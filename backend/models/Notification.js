const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["student", "staff", "admin"], required: true },
    type: { type: String, enum: ["Academic", "Event", "System", "Faculty", "Community"], default: "Academic" },
    title: { type: String, required: true },
    desc: { type: String, required: true },
    time: { type: String, default: "Just now" },
    read: { type: Boolean, default: false },
    relatedId: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
