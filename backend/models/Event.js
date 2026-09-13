const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    eventId: { type: String },
    title: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, default: "" },
    location: { type: String, default: "" },
    tag: { type: String, default: "Event" },
    category: { type: String, default: "Academic" },
    desc: { type: String, default: "" },
    organizer: { type: String, default: "" },
    venue: { type: String, default: "" },
    status: { type: String, enum: ["Approved", "Pending Approval", "Rejected"], default: "Approved" },
    role: { type: String, default: "Attendee" },
    rsvps: [{ type: String }],
    rsvpCount: { type: Number, default: 0 },
    registeredUsers: [
      {
        userId: { type: String, required: true },
        name: { type: String, default: "Student" },
        role: { type: String, default: "student" },
        registeredAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
