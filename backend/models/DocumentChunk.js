const mongoose = require("mongoose");

const documentChunkSchema = new mongoose.Schema(
  {
    chunkId: { type: String, required: true, unique: true },
    documentId: { type: String, required: true, index: true },
    content: { type: String, required: true },
    embedding: {
      type: [Number],
      required: true,
      default: []
    },
    metadata: {
      title: { type: String, default: "" },
      category: { type: String, default: "" },
      department: { type: String, default: "" },
      roleAccess: { type: [String], default: ["student", "staff", "admin"] },
      source: { type: String, default: "" },
      chunkIndex: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DocumentChunk", documentChunkSchema);
