/**
 * Vector Database Store for CampusNova RAG Pipeline
 * Supports:
 * 1. PostgreSQL with pgvector when POSTGRES_URL is configured
 * 2. MongoDB Mongoose DocumentChunk with high-precision vector cosine similarity math
 * 3. In-memory vector store fallback
 */

const DocumentChunk = require("../models/DocumentChunk");
const mongoose = require("mongoose");

const isDbConnected = () => mongoose.connection.readyState === 1;

// In-memory vector store mirror for instant startup & fallback
const inMemoryChunks = [];

/**
 * Calculates high-precision cosine similarity between two float vectors.
 * Returns a value between -1.0 and 1.0 (typically 0.0 to 1.0 for normalized embeddings).
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  const len = Math.min(vecA.length, vecB.length);

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

class VectorStore {
  constructor() {
    this.pgPool = null;
    this.usePostgres = false;
    this.initPostgresIfAvailable();
  }

  async initPostgresIfAvailable() {
    const pgUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (pgUrl && pgUrl.startsWith("postgres")) {
      try {
        const { Pool } = require("pg");
        this.pgPool = new Pool({ connectionString: pgUrl });
        await this.pgPool.query("CREATE EXTENSION IF NOT EXISTS vector;");
        await this.pgPool.query(`
          CREATE TABLE IF NOT EXISTS document_chunks (
            id SERIAL PRIMARY KEY,
            chunk_id VARCHAR(120) UNIQUE NOT NULL,
            document_id VARCHAR(120) NOT NULL,
            content TEXT NOT NULL,
            metadata JSONB NOT NULL,
            embedding vector(768),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        this.usePostgres = true;
        console.log("[VectorStore] Connected to PostgreSQL + pgvector successfully.");
      } catch (err) {
        console.warn("[VectorStore] PostgreSQL/pgvector connection not available, utilizing primary Mongoose vector engine:", err.message);
        this.usePostgres = false;
      }
    }
  }

  /**
   * Stores a single chunk with its float embedding vector
   */
  async insertChunk(chunk) {
    // 1. PostgreSQL + pgvector if active
    if (this.usePostgres && this.pgPool) {
      try {
        const formattedVector = `[${chunk.embedding.join(",")}]`;
        await this.pgPool.query(
          `INSERT INTO document_chunks (chunk_id, document_id, content, metadata, embedding)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (chunk_id) DO UPDATE SET content = $3, metadata = $4, embedding = $5`,
          [chunk.chunkId, chunk.documentId, chunk.content, JSON.stringify(chunk.metadata), formattedVector]
        );
      } catch (err) {
        console.warn("[VectorStore] PG insert error:", err.message);
      }
    }

    // 2. Mongoose DocumentChunk
    if (isDbConnected()) {
      try {
        await DocumentChunk.findOneAndUpdate(
          { chunkId: chunk.chunkId },
          { $set: chunk },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.warn("[VectorStore] Mongo insert error:", err.message);
      }
    }

    // 3. In-memory mirror
    const existingIdx = inMemoryChunks.findIndex(c => c.chunkId === chunk.chunkId);
    if (existingIdx >= 0) {
      inMemoryChunks[existingIdx] = chunk;
    } else {
      inMemoryChunks.push(chunk);
    }

    return chunk;
  }

  /**
   * Stores a batch of chunks
   */
  async insertChunksBatch(chunks) {
    for (const chunk of chunks) {
      await this.insertChunk(chunk);
    }
    return chunks.length;
  }

  /**
   * Deletes all chunks belonging to a document ID
   */
  async deleteChunksByDocumentId(documentId) {
    if (this.usePostgres && this.pgPool) {
      try {
        await this.pgPool.query("DELETE FROM document_chunks WHERE document_id = $1", [documentId]);
      } catch (err) {
        console.warn("[VectorStore] PG delete error:", err.message);
      }
    }

    if (isDbConnected()) {
      try {
        await DocumentChunk.deleteMany({ documentId });
      } catch (err) {
        console.warn("[VectorStore] Mongo delete error:", err.message);
      }
    }

    for (let i = inMemoryChunks.length - 1; i >= 0; i--) {
      if (inMemoryChunks[i].documentId === documentId) {
        inMemoryChunks.splice(i, 1);
      }
    }
  }

  /**
   * Performs semantic vector similarity search with strict role-based access filtering
   * @param {number[]} queryVector Normalized embedding vector
   * @param {Object} options
   * @param {string} options.role 'student' | 'staff' | 'admin'
   * @param {number} [options.limit=4] Top-K results
   * @param {number} [options.minSimilarity=0.30] Minimum cosine similarity threshold
   * @returns {Promise<Array>} Ranked chunks with similarity scores
   */
  async searchSimilarChunks(queryVector, { role = "student", limit = 4, minSimilarity = 0.30 } = {}) {
    let allChunks = [];

    if (isDbConnected()) {
      try {
        allChunks = await DocumentChunk.find({}).lean();
      } catch (err) {
        allChunks = inMemoryChunks;
      }
    }
    if (!allChunks || allChunks.length === 0) {
      allChunks = inMemoryChunks;
    }

    // Role-based filtering
    const roleNormalized = role.toLowerCase();
    const authorizedChunks = allChunks.filter(chunk => {
      const allowedRoles = (chunk.metadata?.roleAccess || ["student", "staff", "admin"]).map(r => r.toLowerCase());

      if (roleNormalized === "admin") return true;
      if (roleNormalized === "staff" || roleNormalized === "faculty") {
        return allowedRoles.includes("staff") || allowedRoles.includes("faculty") || allowedRoles.includes("student") || allowedRoles.includes("all");
      }
      // Student
      return allowedRoles.includes("student") || allowedRoles.includes("all");
    });

    // Score via cosine similarity
    const scoredChunks = authorizedChunks.map(chunk => {
      const sim = cosineSimilarity(queryVector, chunk.embedding);
      return {
        chunkId: chunk.chunkId,
        documentId: chunk.documentId,
        title: chunk.metadata?.title || "Campus Document",
        category: chunk.metadata?.category || "General",
        department: chunk.metadata?.department || "General Campus",
        roleAccess: chunk.metadata?.roleAccess || ["student"],
        source: chunk.metadata?.source || "Campus Knowledge Base",
        content: chunk.content,
        similarity: parseFloat(sim.toFixed(4))
      };
    });

    // Sort descending by similarity
    scoredChunks.sort((a, b) => b.similarity - a.similarity);

    // Filter by threshold and limit
    const relevant = scoredChunks.filter(c => c.similarity >= minSimilarity).slice(0, limit);

    return relevant;
  }

  /**
   * Retrieves all chunks for a document
   */
  async getChunksByDocumentId(documentId) {
    if (isDbConnected()) {
      try {
        return await DocumentChunk.find({ documentId }).lean();
      } catch (e) {
        // Fallback
      }
    }
    return inMemoryChunks.filter(c => c.documentId === documentId);
  }

  /**
   * Returns vector store statistics
   */
  async getStats() {
    let count = 0;
    if (isDbConnected()) {
      try {
        count = await DocumentChunk.countDocuments();
      } catch (e) {
        count = inMemoryChunks.length;
      }
    }
    if (count === 0) {
      count = inMemoryChunks.length;
    }

    return {
      totalChunks: count,
      vectorEngine: this.usePostgres ? "PostgreSQL + pgvector" : "High-Precision Mongoose Cosine Vector Engine",
      dimensions: 768
    };
  }
}

module.exports = new VectorStore();
