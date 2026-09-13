const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const mongoose = require("mongoose");
const { isDbConnected, inMemoryNotifications } = require("../services/inMemoryStore");

function getNotifQuery(id) {
  return mongoose.Types.ObjectId.isValid(id) ? { $or: [{ _id: id }, { relatedId: id }] } : { relatedId: id };
}

// GET /api/notifications - List all notifications (optional ?role=student query)
router.get("/", async (req, res) => {
  try {
    const roleQuery = req.query.role;
    if (isDbConnected()) {
      const filter = { dismissed: { $ne: true } };
      if (roleQuery) filter.role = { $in: [roleQuery, "all"] };
      const list = await Notification.find(filter).sort({ createdAt: -1 });
      return res.json({ success: true, count: list.length, data: list });
    } else {
      let list = inMemoryNotifications.filter(n => !n.dismissed);
      if (roleQuery) {
        list = list.filter(n => n.role === roleQuery || n.role === 'all');
      }
      return res.json({ success: true, count: list.length, data: list });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/notifications/:id - Get single notification
router.get("/:id", async (req, res) => {
  try {
    const idParam = req.params.id;
    if (isDbConnected()) {
      const notif = await Notification.findOne(getNotifQuery(idParam));
      if (!notif) return res.status(404).json({ success: false, error: "Notification not found" });
      return res.json({ success: true, data: notif });
    } else {
      const notif = inMemoryNotifications.find(n => n._id === idParam || n.id === idParam || n.relatedId === idParam);
      if (!notif) return res.status(404).json({ success: false, error: "Notification not found" });
      return res.json({ success: true, data: notif });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/notifications - Create notification
router.post("/", async (req, res) => {
  try {
    let notif;
    if (isDbConnected()) {
      notif = new Notification(req.body);
      await notif.save();
    } else {
      notif = {
        _id: "notif_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        role: req.body.role || "student",
        type: req.body.type || "Community",
        title: req.body.title || "",
        desc: req.body.desc || "",
        time: req.body.time || "Just now",
        read: req.body.read !== undefined ? req.body.read : false,
        dismissed: false,
        relatedId: req.body.relatedId || null,
        createdAt: new Date().toISOString()
      };
      inMemoryNotifications.unshift(notif);
    }
    res.status(201).json({ success: true, data: notif });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read for a role
router.put("/read-all", async (req, res) => {
  try {
    const roleVal = req.body.role;
    if (isDbConnected()) {
      const filter = { dismissed: { $ne: true } };
      if (roleVal) filter.role = { $in: [roleVal, "all"] };
      await Notification.updateMany(filter, { $set: { read: true } });
    } else {
      inMemoryNotifications.forEach(n => {
        if (!roleVal || n.role === roleVal || n.role === 'all') {
          n.read = true;
        }
      });
    }
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/notifications/:id - Mark as read / update
router.put("/:id", async (req, res) => {
  try {
    const idParam = req.params.id;
    if (isDbConnected()) {
      const notif = await Notification.findOneAndUpdate(getNotifQuery(idParam), { $set: req.body }, { new: true });
      if (!notif) return res.status(404).json({ success: false, error: "Notification not found" });
      return res.json({ success: true, data: notif });
    } else {
      const notif = inMemoryNotifications.find(n => n._id === idParam || n.id === idParam || n.relatedId === idParam);
      if (!notif) return res.status(404).json({ success: false, error: "Notification not found" });
      Object.assign(notif, req.body);
      return res.json({ success: true, data: notif });
    }
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/notifications/:id - Dismiss / delete notification
router.delete("/:id", async (req, res) => {
  try {
    const idParam = req.params.id;
    if (isDbConnected()) {
      let notif = await Notification.findOneAndDelete(getNotifQuery(idParam));
      if (!notif && mongoose.Types.ObjectId.isValid(idParam)) {
        notif = await Notification.findByIdAndDelete(idParam);
      }
      return res.json({ success: true, message: "Notification dismissed successfully" });
    } else {
      const idx = inMemoryNotifications.findIndex(n => n._id === idParam || n.id === idParam || n.relatedId === idParam);
      if (idx !== -1) inMemoryNotifications.splice(idx, 1);
      return res.json({ success: true, message: "Notification dismissed successfully" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
