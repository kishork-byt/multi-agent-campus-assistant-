const express = require("express");
const router = express.Router();
const Task = require("../models/Task");

const mongoose = require("mongoose");

// Helper to construct query for _id or taskId
function getTaskQuery(id) {
  return mongoose.Types.ObjectId.isValid(id) ? { $or: [{ _id: id }, { taskId: id }] } : { taskId: id };
}

// GET /api/tasks - List all tasks
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/tasks/:id - Get single task
router.get("/:id", async (req, res) => {
  try {
    const task = await Task.findOne(getTaskQuery(req.params.id));
    if (!task) return res.status(404).json({ success: false, error: "Task not found" });
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tasks - Create new task
router.post("/", async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /api/tasks/:id - Update task status / priority
router.put("/:id", async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(getTaskQuery(req.params.id), { $set: req.body }, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ success: false, error: "Task not found" });
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findOneAndDelete(getTaskQuery(req.params.id));
    if (!task) return res.status(404).json({ success: false, error: "Task not found" });
    res.json({ success: true, message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
