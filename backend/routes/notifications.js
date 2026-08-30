const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

// GET /api/notifications - List all notifications (optional ?role=student query)
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    const list = await Notification.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/notifications/:id - Get single notification
router.get("/:id", async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.status(404).json({ success: false, error: "Notification not found" });
    res.json({ success: true, data: notif });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/notifications - Create notification
router.post("/", async (req, res) => {
  try {
    const notif = new Notification(req.body);
    await notif.save();
    res.status(201).json({ success: true, data: notif });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /api/notifications/:id - Mark as read / update
router.put("/:id", async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!notif) return res.status(404).json({ success: false, error: "Notification not found" });
    res.json({ success: true, data: notif });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/notifications/:id - Dismiss / delete notification
router.delete("/:id", async (req, res) => {
  try {
    const notif = await Notification.findByIdAndDelete(req.params.id);
    if (!notif) return res.status(404).json({ success: false, error: "Notification not found" });
    res.json({ success: true, message: "Notification deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
