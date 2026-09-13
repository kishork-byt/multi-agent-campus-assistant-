const express = require("express");
const router = express.Router();

const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const Department = require("../models/Department");
const Course = require("../models/Course");
const Attendance = require("../models/Attendance");
const Event = require("../models/Event");
const Announcement = require("../models/Announcement");

// 1. GET /api/admin/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalStaff = await Faculty.countDocuments();
    const totalDepartments = await Department.countDocuments();
    const totalCourses = await Course.countDocuments();

    const totalAttendanceRecords = await Attendance.countDocuments();
    const presentAttendanceRecords = await Attendance.countDocuments({ status: "Present" });
    const overallAttendanceRate = totalAttendanceRecords > 0 
      ? ((presentAttendanceRecords / totalAttendanceRecords) * 100).toFixed(1) + "%" 
      : "95.5%";

    const upcomingEvents = await Event.find().sort({ createdAt: -1 }).limit(5);
    const recentAnnouncements = await Announcement.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          totalStaff,
          totalDepartments,
          totalCourses,
          overallAttendanceRate
        },
        upcomingEvents,
        recentAnnouncements
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. GET /api/admin/students
router.get("/students", async (req, res) => {
  try {
    const students = await Student.find()
      .populate("deptId")
      .populate("enrolledCourses")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: students.length, data: students });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. GET /api/admin/staff
router.get("/staff", async (req, res) => {
  try {
    const staffMembers = await Faculty.find()
      .populate("deptId")
      .populate("assignedCourses")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: staffMembers.length, data: staffMembers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. GET /api/admin/departments
router.get("/departments", async (req, res) => {
  try {
    const departments = await Department.find().populate("hodId").sort({ code: 1 });
    res.json({ success: true, count: departments.length, data: departments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. GET /api/admin/courses
router.get("/courses", async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("deptId")
      .populate("instructorId")
      .sort({ code: 1 });

    res.json({ success: true, count: courses.length, data: courses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. GET /api/admin/attendance
router.get("/attendance", async (req, res) => {
  try {
    const totalRecords = await Attendance.countDocuments();
    const presentRecords = await Attendance.countDocuments({ status: "Present" });
    const absentRecords = await Attendance.countDocuments({ status: "Absent" });
    const lateRecords = await Attendance.countDocuments({ status: "Late" });
    const excusedRecords = await Attendance.countDocuments({ status: "Excused" });

    const recentLogs = await Attendance.find()
      .populate("studentId")
      .populate("courseId")
      .populate("instructorId")
      .sort({ date: -1 })
      .limit(20);

    res.json({
      success: true,
      summary: {
        totalRecords,
        present: presentRecords,
        absent: absentRecords,
        late: lateRecords,
        excused: excusedRecords,
        overallPercentage: totalRecords > 0 ? ((presentRecords / totalRecords) * 100).toFixed(1) + "%" : "100%"
      },
      recentLogs
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. GET /api/admin/events
router.get("/events", async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json({ success: true, count: events.length, data: events });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. GET /api/admin/announcements
router.get("/announcements", async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json({ success: true, count: announcements.length, data: announcements });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. GET /api/admin/reports
router.get("/reports", async (req, res) => {
  try {
    const departments = await Department.find();
    const deptReports = [];

    for (const dept of departments) {
      const studentCount = await Student.countDocuments({ deptId: dept._id });
      const facultyCount = await Faculty.countDocuments({ deptId: dept._id });
      const courseCount = await Course.countDocuments({ deptId: dept._id });

      deptReports.push({
        deptCode: dept.code,
        deptName: dept.name,
        students: studentCount,
        faculty: facultyCount,
        courses: courseCount,
        budget: dept.budget
      });
    }

    res.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        departmentReports: deptReports
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. POST /api/admin/departments - Create Department
router.post("/departments", async (req, res) => {
  try {
    const { code, name, building, budget, description } = req.body || {};
    if (!code || !name) {
      return res.status(400).json({ success: false, error: "Department code and name are required." });
    }

    const existing = await Department.findOne({ code: code.trim().toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, error: `Department with code '${code.toUpperCase()}' already exists.` });
    }

    const dept = new Department({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      building: building || "Main Campus",
      budget: budget || "$450,000",
      description: description || ""
    });

    await dept.save();
    res.status(201).json({ success: true, data: dept });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 11. PUT /api/admin/departments/:id - Update Department
router.put("/departments/:id", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const idParam = req.params.id;
    const query = mongoose.Types.ObjectId.isValid(idParam) ? { $or: [{ _id: idParam }, { code: idParam }] } : { code: idParam };

    const dept = await Department.findOneAndUpdate(query, { $set: req.body }, { new: true, runValidators: true });
    if (!dept) return res.status(404).json({ success: false, error: "Department not found." });

    res.json({ success: true, data: dept });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 12. DELETE /api/admin/departments/:id - Delete Department
router.delete("/departments/:id", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const idParam = req.params.id;
    const query = mongoose.Types.ObjectId.isValid(idParam) ? { $or: [{ _id: idParam }, { code: idParam }] } : { code: idParam };

    const dept = await Department.findOneAndDelete(query);
    if (!dept) return res.status(404).json({ success: false, error: "Department not found." });

    res.json({ success: true, message: "Department deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
