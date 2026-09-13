/**
 * Retrieval-Augmented Generation (RAG) Service for CampusNova
 * Orchestrates text chunking, embedding generation, vector storage,
 * and role-governed semantic retrieval.
 */

const Document = require("../models/Document");
const vectorStore = require("./vectorStore");
const { getActiveLLMProvider } = require("./llm/llmProvider");
const seedDocuments = require("../data/seedDocuments");
const mongoose = require("mongoose");

const isDbConnected = () => mongoose.connection.readyState === 1;
const inMemoryDocuments = [];

class RAGService {
  constructor() {
    this.llmProvider = getActiveLLMProvider();
  }

  /**
   * Recursive paragraph/section text chunker
   * Breaks text into semantically coherent segments (300-500 words) with 50-word overlap
   */
  chunkText(text, { maxWordsPerChunk = 400, overlapWords = 50 } = {}) {
    if (!text || typeof text !== "string") return [];

    // Split by Markdown headers (### or ##) or double newlines
    const sections = text.split(/(?=\n###|\n##)/g);
    const chunks = [];

    for (const section of sections) {
      const words = section.trim().split(/\s+/).filter(Boolean);
      if (words.length <= maxWordsPerChunk) {
        if (words.length > 5) {
          chunks.push(words.join(" "));
        }
        continue;
      }

      // If section is long, slide window
      let start = 0;
      while (start < words.length) {
        const end = Math.min(start + maxWordsPerChunk, words.length);
        const chunkSlice = words.slice(start, end).join(" ");
        chunks.push(chunkSlice);
        if (end >= words.length) break;
        start += (maxWordsPerChunk - overlapWords);
      }
    }

    return chunks.length > 0 ? chunks : [text.trim()];
  }

  /**
   * Ingests, chunks, embeds, and indexes a campus document
   */
  async indexDocument(docData) {
    const documentId = docData.documentId || `DOC-${Date.now()}`;
    const roleAccess = Array.isArray(docData.roleAccess) ? docData.roleAccess : ["student", "staff", "admin"];

    // 1. Save or update Document record
    const documentRecord = {
      documentId,
      title: docData.title || "Untitled Policy",
      category: docData.category || "General FAQs",
      department: docData.department || "General Campus",
      roleAccess,
      source: docData.source || "Uploaded Document",
      content: docData.content,
      status: "PROCESSING",
      uploadedBy: docData.uploadedBy || "Campus Administrator",
      chunkCount: 0,
      createdAt: new Date().toISOString()
    };

    if (isDbConnected()) {
      try {
        await Document.findOneAndUpdate(
          { documentId },
          { $set: documentRecord },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.warn("[RAGService] DB document upsert warning:", err.message);
      }
    }

    const inMemIdx = inMemoryDocuments.findIndex(d => d.documentId === documentId);
    if (inMemIdx >= 0) inMemoryDocuments[inMemIdx] = documentRecord;
    else inMemoryDocuments.push(documentRecord);

    // 2. Clear existing chunks for this document
    await vectorStore.deleteChunksByDocumentId(documentId);

    // 3. Chunk the content
    const textChunks = this.chunkText(docData.content);
    const chunkObjects = [];

    // 4. Generate embeddings and store chunks
    for (let i = 0; i < textChunks.length; i++) {
      const chunkText = textChunks[i];
      const chunkId = `${documentId}-CHK-${i + 1}`;

      // Prefix chunk with metadata context for better semantic embedding
      const embeddingInput = `Title: ${docData.title}\nCategory: ${docData.category}\nContent: ${chunkText}`;
      const embedding = await this.llmProvider.generateEmbedding(embeddingInput);

      const chunkObj = {
        chunkId,
        documentId,
        content: chunkText,
        embedding,
        metadata: {
          title: docData.title,
          category: docData.category,
          department: docData.department || "General Campus",
          roleAccess,
          source: docData.source || "Official Knowledge Base",
          chunkIndex: i
        }
      };

      await vectorStore.insertChunk(chunkObj);
      chunkObjects.push(chunkObj);
    }

    // 5. Update document record status to COMPLETED
    documentRecord.status = "COMPLETED";
    documentRecord.chunkCount = chunkObjects.length;

    if (isDbConnected()) {
      try {
        await Document.findOneAndUpdate(
          { documentId },
          { $set: { status: "COMPLETED", chunkCount: chunkObjects.length } }
        );
      } catch (e) {
        // Fallback
      }
    }

    console.log(`[RAGService] Indexed "${docData.title}" into ${chunkObjects.length} vector chunks.`);
    return {
      documentId,
      title: docData.title,
      chunkCount: chunkObjects.length,
      status: "COMPLETED"
    };
  }

  /**
   * Retrieves role-governed relevant campus knowledge for a query
   * @param {string} query
   * @param {Object} options
   * @param {string} options.role 'student' | 'staff' | 'admin'
   * @param {number} [options.limit=3]
   * @returns {Promise<Object>}
   */
  async retrieveKnowledge(query, { role = "student", limit = 3, minSimilarity = 0.28 } = {}) {
    const queryClean = (query || "").trim();
    if (!queryClean) {
      return { context: "", chunks: [], sources: [], topSimilarity: 0, confidence: 0, requiresHumanSupport: false };
    }

    // Generate query embedding
    const queryVector = await this.llmProvider.generateEmbedding(queryClean);

    // Retrieve similar chunks filtered by role permissions
    const chunks = await vectorStore.searchSimilarChunks(queryVector, {
      role,
      limit,
      minSimilarity
    });

    const topSimilarity = chunks.length > 0 ? chunks[0].similarity : 0;

    // Determine confidence & grounding
    let confidence = 0.50;
    let requiresHumanSupport = false;

    if (topSimilarity >= 0.65) {
      confidence = Math.min(0.98, parseFloat((0.85 + (topSimilarity - 0.65) * 0.4).toFixed(2)));
    } else if (topSimilarity >= 0.45) {
      confidence = parseFloat((0.70 + (topSimilarity - 0.45) * 0.75).toFixed(2));
    } else if (topSimilarity >= 0.28) {
      confidence = parseFloat((0.50 + (topSimilarity - 0.28) * 0.8).toFixed(2));
    } else {
      confidence = 0.35;
      requiresHumanSupport = true;
    }

    // Deduplicate and format sources
    const sourcesMap = new Map();
    for (const c of chunks) {
      if (!sourcesMap.has(c.documentId)) {
        sourcesMap.set(c.documentId, {
          documentId: c.documentId,
          title: c.title,
          category: c.category,
          source: c.source,
          department: c.department,
          excerpt: c.content.substring(0, 160) + "..."
        });
      }
    }
    const sources = Array.from(sourcesMap.values());

    // Build context string for prompt
    const context = chunks.map((c, i) => {
      return `[Source ${i + 1}: "${c.title}" (${c.category})]\n${c.content}`;
    }).join("\n\n---\n\n");

    return {
      context,
      chunks,
      sources,
      topSimilarity,
      confidence,
      requiresHumanSupport
    };
  }

  /**
   * Initializes the campus knowledge base with official seed documents if empty
   */
  async initializeKnowledgeBase() {
    try {
      // 1. Ensure in-memory seed
      if (inMemoryDocuments.length === 0) {
        console.log("[RAGService] In-memory knowledge base is empty. Seeding campus documents...");
        for (const doc of seedDocuments) {
          await this.indexDocument(doc);
        }
        console.log(`[RAGService] Seeded ${seedDocuments.length} campus documents into in-memory store.`);
      }

      // 2. If DB is connected and empty, also sync to DB
      if (isDbConnected()) {
        try {
          const dbCount = await Document.countDocuments();
          if (dbCount === 0) {
            console.log("[RAGService] MongoDB collection is empty. Syncing seed documents to MongoDB...");
            for (const doc of seedDocuments) {
              await this.indexDocument(doc);
            }
          }
        } catch (dbErr) {
          console.warn("[RAGService] DB sync notice:", dbErr.message);
        }
      }
    } catch (err) {
      console.error("[RAGService] Error initializing knowledge base:", err);
    }
  }

  /**
   * Deletes a document and its associated vector chunks
   */
  async deleteDocument(documentId) {
    await vectorStore.deleteChunksByDocumentId(documentId);
    if (isDbConnected()) {
      try {
        await Document.deleteOne({ documentId });
      } catch (err) {
        console.warn("[RAGService] Error deleting document record:", err.message);
      }
    }
    const idx = inMemoryDocuments.findIndex(d => d.documentId === documentId);
    if (idx >= 0) inMemoryDocuments.splice(idx, 1);
    return true;
  }

  /**
   * Lists all documents in the knowledge base
   */
  async getAllDocuments() {
    if (isDbConnected()) {
      try {
        const docs = await Document.find({}).sort({ createdAt: -1 }).lean();
        if (docs && docs.length > 0) return docs;
      } catch (err) {
        console.warn("[RAGService] Mongo fetch failed:", err.message);
      }
    }
    return inMemoryDocuments.length > 0 ? inMemoryDocuments : seedDocuments;
  }
}

module.exports = new RAGService();
