const mongoose = require("mongoose");

const communityCommentSchema = new mongoose.Schema(
  {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "CommunityPost", required: true },
    authorRole: { type: String, enum: ["student", "staff", "admin"], default: "student" },
    text: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CommunityComment", communityCommentSchema);
