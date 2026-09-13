const mongoose = require("mongoose");

const agentLogSchema = new mongoose.Schema(
  {
    logId: { type: String, required: true, unique: true },
    conversationId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userRole: { type: String, default: "student" },
    agentName: {
      type: String,
      required: true,
      enum: ["Nova", "Astra", "Orion", "Atlas"]
    },
    query: { type: String, required: true },
    intent: { type: String, required: true },
    routingRationale: { type: String, default: "" },
    retrievedDocuments: [
      {
        documentId: String,
        title: String,
        category: String,
        similarity: Number,
        chunkId: String
      }
    ],
    executionStatus: {
      type: String,
      enum: ["SUCCESS", "ROUTED", "ESCALATED", "UNAUTHORIZED", "FAILED"],
      default: "SUCCESS"
    },
    confidence: { type: Number, default: 0.9 },
    requiresHumanSupport: { type: Boolean, default: false },
    responseSnippet: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AgentLog", agentLogSchema);
