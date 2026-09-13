const mongoose = require("mongoose");

const agentExecutionSchema = new mongoose.Schema(
  {
    agentExecutionId: { type: String, required: true, unique: true, index: true },
    agentName: { type: String, enum: ["Astra", "Orion", "Atlas", "CampusNova"], default: "Astra", index: true },
    conversationId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userRole: { type: String, enum: ["student", "staff", "admin"], default: "student" },
    intent: { type: String, default: "CAMPUS_INQUIRY" },
    query: { type: String, default: "" },
    selectedTools: [{ type: String }],
    toolResults: [{ type: mongoose.Schema.Types.Mixed }],
    status: {
      type: String,
      enum: ["PLANNING", "WAITING_APPROVAL", "EXECUTING", "VERIFYING", "COMPLETED", "FAILED"],
      default: "PLANNING"
    },
    approvalRequired: { type: Boolean, default: false },
    approvalStatus: {
      type: String,
      enum: ["NONE", "PENDING", "APPROVED", "REJECTED"],
      default: "NONE"
    },
    approvalDetails: { type: mongoose.Schema.Types.Mixed, default: null },
    actionSummary: { type: String, default: "" },
    resultMessage: { type: String, default: "" },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    error: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AgentExecution", agentExecutionSchema);
