const express = require("express");
const router = express.Router();
const Announcement = require("../models/Announcement");
const mongoose = require("mongoose");
const { isDbConnected, inMemoryAnnouncements, createNotificationForAnnouncement } = require("../services/inMemoryStore");

// Helper to construct query for _id or announcementId
function getAnnouncementQuery(id) {
  return mongoose.Types.ObjectId.isValid(id) ? { $or: [{ _id: id }, { announcementId: id }] } : { announcementId: id };
}

// GET /api/announcements - List all announcements
router.get("/", async (req, res) => {
  try {
    if (isDbConnected()) {
      const list = await Announcement.find().sort({ createdAt: -1 });
      return res.json({ success: true, count: list.length, data: list });
    } else {
      return res.json({ success: true, count: inMemoryAnnouncements.length, data: inMemoryAnnouncements });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/announcements/:id - Get single announcement
router.get("/:id", async (req, res) => {
  try {
    const idParam = req.params.id;
    if (isDbConnected()) {
      const item = await Announcement.findOne(getAnnouncementQuery(idParam));
      if (!item) return res.status(404).json({ success: false, error: "Announcement not found" });
      return res.json({ success: true, data: item });
    } else {
      const item = inMemoryAnnouncements.find(a => a._id === idParam || a.announcementId === idParam);
      if (!item) return res.status(404).json({ success: false, error: "Announcement not found" });
      return res.json({ success: true, data: item });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/announcements - Create new announcement
router.post("/", async (req, res) => {
  try {
    let item;
    if (isDbConnected()) {
      item = new Announcement(req.body);
      await item.save();
    } else {
      item = {
        _id: "ann_" + Date.now(),
        announcementId: req.body.announcementId || "ann_" + Date.now(),
        title: req.body.title,
        message: req.body.message || "",
        target: req.body.target || "All Users",
        author: req.body.author || "System Administrator",
        priority: req.body.priority || "Normal",
        date: req.body.date || "",
        createdAt: new Date().toISOString()
      };
      inMemoryAnnouncements.unshift(item);
    }

    // Auto-create notification records for targeted audience
    await createNotificationForAnnouncement(item);

    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /api/announcements/:id - Update announcement
router.put("/:id", async (req, res) => {
  try {
    const idParam = req.params.id;
    if (isDbConnected()) {
      const item = await Announcement.findOneAndUpdate(getAnnouncementQuery(idParam), { $set: req.body }, { new: true, runValidators: true });
      if (!item) return res.status(404).json({ success: false, error: "Announcement not found" });
      return res.json({ success: true, data: item });
    } else {
      const idx = inMemoryAnnouncements.findIndex(a => a._id === idParam || a.announcementId === idParam);
      if (idx === -1) return res.status(404).json({ success: false, error: "Announcement not found" });
      inMemoryAnnouncements[idx] = { ...inMemoryAnnouncements[idx], ...req.body };
      return res.json({ success: true, data: inMemoryAnnouncements[idx] });
    }
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/announcements/:id - Delete announcement & associated broadcast notifications
router.delete("/:id", async (req, res) => {
  try {
    const idParam = req.params.id;
    const Notification = require("../models/Notification");
    const { inMemoryNotifications } = require("../services/inMemoryStore");

    if (isDbConnected()) {
      const item = await Announcement.findOneAndDelete(getAnnouncementQuery(idParam));
      if (!item) return res.status(404).json({ success: false, error: "Announcement not found" });
      
      const targetId = item.announcementId || (item._id ? item._id.toString() : idParam);
      await Notification.deleteMany({ $or: [{ relatedId: targetId }, { title: item.title }] });

      return res.json({ success: true, message: "Announcement and associated broadcast notifications removed successfully" });
    } else {
      const idx = inMemoryAnnouncements.findIndex(a => a._id === idParam || a.announcementId === idParam);
      if (idx === -1) return res.status(404).json({ success: false, error: "Announcement not found" });
      const removed = inMemoryAnnouncements.splice(idx, 1)[0];
      const targetId = removed.announcementId || removed._id;
      for (let i = inMemoryNotifications.length - 1; i >= 0; i--) {
        if (inMemoryNotifications[i].relatedId === targetId || inMemoryNotifications[i].title === removed.title) {
          inMemoryNotifications.splice(i, 1);
        }
      }
      return res.json({ success: true, message: "Announcement and associated broadcast notifications removed successfully" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
