const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const mongoose = require("mongoose");

// Helper to construct query for _id or eventId
function getEventQuery(id) {
  return mongoose.Types.ObjectId.isValid(id) ? { $or: [{ _id: id }, { eventId: id }] } : { eventId: id };
}

// GET /api/events - List all events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json({ success: true, count: events.length, data: events });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/events/:id - Get single event
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findOne(getEventQuery(req.params.id));
    if (!event) return res.status(404).json({ success: false, error: "Event not found" });
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/events - Create new event
router.post("/", async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /api/events/:id - Update event
router.put("/:id", async (req, res) => {
  try {
    const event = await Event.findOneAndUpdate(getEventQuery(req.params.id), { $set: req.body }, { new: true, runValidators: true });
    if (!event) return res.status(404).json({ success: false, error: "Event not found" });
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/events/:id - Delete event
router.delete("/:id", async (req, res) => {
  try {
    const event = await Event.findOneAndDelete(getEventQuery(req.params.id));
    if (!event) return res.status(404).json({ success: false, error: "Event not found" });
    res.json({ success: true, message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
