const express = require("express");
const router = express.Router();
const Announcement = require("../models/Announcement");
const mongoose = require("mongoose");

// Helper to construct query for _id or announcementId
function getAnnouncementQuery(id) {
  return mongoose.Types.ObjectId.isValid(id) ? { $or: [{ _id: id }, { announcementId: id }] } : { announcementId: id };
}

// GET /api/announcements - List all announcements
router.get("/", async (req, res) => {
  try {
    const list = await Announcement.find().sort({ createdAt: -1 });
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/announcements/:id - Get single announcement
router.get("/:id", async (req, res) => {
  try {
    const item = await Announcement.findOne(getAnnouncementQuery(req.params.id));
    if (!item) return res.status(404).json({ success: false, error: "Announcement not found" });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/announcements - Create new announcement
router.post("/", async (req, res) => {
  try {
    const item = new Announcement(req.body);
    await item.save();
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /api/announcements/:id - Update announcement
router.put("/:id", async (req, res) => {
  try {
    const item = await Announcement.findOneAndUpdate(getAnnouncementQuery(req.params.id), { $set: req.body }, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, error: "Announcement not found" });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/announcements/:id - Delete announcement
router.delete("/:id", async (req, res) => {
  try {
    const item = await Announcement.findOneAndDelete(getAnnouncementQuery(req.params.id));
    if (!item) return res.status(404).json({ success: false, error: "Announcement not found" });
    res.json({ success: true, message: "Announcement deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
