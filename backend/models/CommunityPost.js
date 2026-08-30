const mongoose = require("mongoose");

const communityPostSchema = new mongoose.Schema(
  {
    authorRole: { type: String, enum: ["student", "staff", "admin"], default: "student" },
    category: { type: String, required: true },
    text: { type: String, required: true },
    mediaType: { type: String, enum: ["none", "image", "video"], default: "none" },
    mediaUrl: { type: String, default: "" },
    supportCount: { type: Number, default: 0 },
    supportedBy: [{ type: String }],
    status: { type: String, enum: ["active", "flagged", "hidden", "removed"], default: "active" },
    flagReason: { type: String, default: null },
    linkedPostId: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CommunityPost", communityPostSchema);
