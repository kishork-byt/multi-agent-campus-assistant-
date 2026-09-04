const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    announcementId: { type: String },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    target: { type: String, default: "All Users" },
    author: { type: String, default: "System Administrator" },
    priority: { type: String, enum: ["Normal", "Medium", "High", "Urgent"], default: "Normal" },
    date: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);
