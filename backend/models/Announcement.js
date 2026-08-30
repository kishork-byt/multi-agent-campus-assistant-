const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    target: { type: String, default: "All Users" },
    author: { type: String, default: "System Administrator" },
    priority: { type: String, enum: ["Normal", "Medium", "High"], default: "Normal" },
    date: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);
