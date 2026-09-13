const express = require("express");
const router = express.Router();
const ragService = require("../services/ragService");
const vectorStore = require("../services/vectorStore");

// GET /api/knowledge-base/documents - List all documents
router.get("/documents", async (req, res) => {
  try {
    const docs = await ragService.getAllDocuments();
    res.json({
      success: true,
      data: docs
    });
  } catch (err) {
    console.error("Error fetching knowledge base documents:", err);
    res.status(500).json({ success: false, error: "Failed to retrieve documents." });
  }
});

// GET /api/knowledge-base/documents/:id/chunks - View chunks of a document
router.get("/documents/:id/chunks", async (req, res) => {
  try {
    const chunks = await vectorStore.getChunksByDocumentId(req.params.id);
    res.json({
      success: true,
      data: chunks.map(c => ({
        chunkId: c.chunkId,
        documentId: c.documentId,
        content: c.content,
        metadata: c.metadata,
        embeddingDimension: Array.isArray(c.embedding) ? c.embedding.length : 0,
        createdAt: c.createdAt
      }))
    });
  } catch (err) {
    console.error("Error fetching document chunks:", err);
    res.status(500).json({ success: false, error: "Failed to retrieve document chunks." });
  }
});

// POST /api/knowledge-base/upload - Upload, chunk, and embed new document
router.post("/upload", async (req, res) => {
  try {
    const { title, category, department, roleAccess, content, source, uploadedBy } = req.body || {};

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: "Document title and text content are required."
      });
    }

    const roles = Array.isArray(roleAccess) && roleAccess.length > 0
      ? roleAccess
      : ["student", "staff", "admin"];

    const indexed = await ragService.indexDocument({
      title: title.trim(),
      category: category || "General FAQs",
      department: department || "General Campus",
      roleAccess: roles,
      source: source || "Admin Document Upload",
      content: content.trim(),
      uploadedBy: uploadedBy || "System Administrator"
    });

    res.status(201).json({
      success: true,
      message: `Document "${title}" successfully processed, chunked, and indexed with vector embeddings.`,
      data: indexed
    });
  } catch (err) {
    console.error("Error processing document upload:", err);
    res.status(500).json({ success: false, error: "Failed to process and index document." });
  }
});

// DELETE /api/knowledge-base/documents/:id - Delete document and chunks
router.delete("/documents/:id", async (req, res) => {
  try {
    await ragService.deleteDocument(req.params.id);
    res.json({
      success: true,
      message: `Document ${req.params.id} and associated vector chunks successfully removed.`
    });
  } catch (err) {
    console.error("Error deleting document:", err);
    res.status(500).json({ success: false, error: "Failed to delete document." });
  }
});

// GET /api/knowledge-base/stats - Vector DB stats
router.get("/stats", async (req, res) => {
  try {
    const stats = await vectorStore.getStats();
    const docs = await ragService.getAllDocuments();
    res.json({
      success: true,
      data: {
        totalDocuments: docs.length,
        ...stats
      }
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ success: false, error: "Failed to fetch stats." });
  }
});

module.exports = router;
