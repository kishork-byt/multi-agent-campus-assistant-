const mongoose = require("mongoose");

const supportIssueSchema = new mongoose.Schema(
  {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "CommunityPost", required: true },
    userId: { type: String, required: true },
    userRole: { type: String, default: "student" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportIssue", supportIssueSchema);
