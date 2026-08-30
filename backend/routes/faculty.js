const express = require("express");
const router = express.Router();
const Faculty = require("../models/Faculty");

// GET /api/faculty - List all faculty members
router.get("/", async (req, res) => {
  try {
    const faculty = await Faculty.find().sort({ createdAt: -1 });
    res.json({ success: true, count: faculty.length, data: faculty });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/faculty/:id - Get single faculty record
router.get("/:id", async (req, res) => {
  try {
    const member = await Faculty.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, error: "Faculty record not found" });
    res.json({ success: true, data: member });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/faculty - Create new faculty record
router.post("/", async (req, res) => {
  try {
    const member = new Faculty(req.body);
    await member.save();
    res.status(201).json({ success: true, data: member });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /api/faculty/:id - Update faculty record
router.put("/:id", async (req, res) => {
  try {
    const member = await Faculty.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!member) return res.status(404).json({ success: false, error: "Faculty record not found" });
    res.json({ success: true, data: member });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/faculty/:id - Delete faculty record
router.delete("/:id", async (req, res) => {
  try {
    const member = await Faculty.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ success: false, error: "Faculty record not found" });
    res.json({ success: true, message: "Faculty record deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
