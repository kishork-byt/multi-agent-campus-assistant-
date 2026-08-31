const mongoose = require("mongoose");

const communityPostSchema = new mongoose.Schema(
  {
    postId: { type: String },
    authorRole: { type: String, enum: ["student", "staff", "admin"], default: "student" },
    category: { type: String, required: true },
    text: { type: String, required: true },
    mediaType: { type: String, enum: ["none", "image", "video"], default: "none" },
    mediaUrl: { type: String, default: "" },
    supportCount: { type: Number, default: 0 },
    supportedBy: [{ type: String }],
    status: { type: String, enum: ["approved", "active", "pending", "flagged", "hidden", "removed"], default: "approved" },
    fakeScore: { type: Number, default: 0 },
    duplicateScore: { type: Number, default: 0 },
    toxicScore: { type: Number, default: 0 },
    flagReason: { type: String, default: null },
    linkedPostId: { type: String, default: null },
    timestamp: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CommunityPost", communityPostSchema);
