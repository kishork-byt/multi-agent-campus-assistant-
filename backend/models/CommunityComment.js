const mongoose = require("mongoose");

const communityCommentSchema = new mongoose.Schema(
  {
    commentId: { type: String },
    postId: { type: String, required: true },
    authorRole: { type: String, enum: ["student", "staff", "admin"], default: "student" },
    text: { type: String, required: true },
    timestamp: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CommunityComment", communityCommentSchema);
