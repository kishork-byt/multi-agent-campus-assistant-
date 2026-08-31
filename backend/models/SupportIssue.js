const mongoose = require("mongoose");

const supportIssueSchema = new mongoose.Schema(
  {
    postId: { type: String, required: true },
    userId: { type: String, required: true },
    userRole: { type: String, default: "student" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportIssue", supportIssueSchema);
