const mongoose = require("mongoose");

const supportIssueSchema = new mongoose.Schema(
  {
    issueId: { type: String, unique: true, sparse: true, index: true },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    location: { type: String, default: "" },
    category: { type: String, default: "Facilities & Infrastructure" },
    department: { type: String, default: "Facilities" },
    priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "URGENT"], default: "MEDIUM" },
    status: { type: String, enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"], default: "OPEN" },
    postId: { type: String, sparse: true },
    userId: { type: String, required: true, index: true },
    userRole: { type: String, default: "student" },
    assignedTo: { type: String, default: "Helpdesk Officer" },
    resolutionNotes: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportIssue", supportIssueSchema);
