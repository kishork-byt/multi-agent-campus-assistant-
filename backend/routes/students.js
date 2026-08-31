const express = require("express");
const router = express.Router();
const Student = require("../models/Student");

const mongoose = require("mongoose");

// Helper to construct query for _id or studentId
function getStudentQuery(id) {
  return mongoose.Types.ObjectId.isValid(id) ? { $or: [{ _id: id }, { studentId: id }] } : { studentId: id };
}

// GET /api/students - List all students
router.get("/", async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json({ success: true, count: students.length, data: students });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/students/:id - Get single student
router.get("/:id", async (req, res) => {
  try {
    const student = await Student.findOne(getStudentQuery(req.params.id));
    if (!student) return res.status(404).json({ success: false, error: "Student not found" });
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/students - Create new student
router.post("/", async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json({ success: true, data: student });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /api/students/:id - Update student
router.put("/:id", async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(getStudentQuery(req.params.id), { $set: req.body }, { new: true });
    if (!student) return res.status(404).json({ success: false, error: "Student not found" });
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/students/:id - Delete student
router.delete("/:id", async (req, res) => {
  try {
    const student = await Student.findOneAndDelete(getStudentQuery(req.params.id));
    if (!student) return res.status(404).json({ success: false, error: "Student not found" });
    res.json({ success: true, message: "Student record deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
