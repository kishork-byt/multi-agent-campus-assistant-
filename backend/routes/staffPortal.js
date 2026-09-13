const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Faculty = require("../models/Faculty");
const Department = require("../models/Department");
const Course = require("../models/Course");
const Timetable = require("../models/Timetable");
const Task = require("../models/Task");
const Event = require("../models/Event");
const Notification = require("../models/Notification");

// Helper to locate faculty member by ObjectId or staffId string
async function getStaff(idParam) {
  let query;
  if (mongoose.Types.ObjectId.isValid(idParam)) {
    query = { $or: [{ _id: idParam }, { staffId: idParam }] };
  } else {
    query = { staffId: idParam };
  }
  let staff = await Faculty.findOne(query).populate("deptId").populate("assignedCourses");
  if (!staff) {
    staff = await Faculty.findOne().populate("deptId").populate("assignedCourses");
  }
  return staff;
}

// 1. GET /api/staff/dashboard/:staffId
router.get("/dashboard/:staffId", async (req, res) => {
  try {
    const staff = await getStaff(req.params.staffId);
    if (!staff) return res.status(404).json({ success: false, error: "Staff member not found" });

    let taughtSlots = [];
    if (staff._id) {
      const timetableBlocks = await Timetable.find({ "slots.instructorId": staff._id });
      timetableBlocks.forEach(tb => {
        tb.slots.forEach(slot => {
          if (slot.instructorId && slot.instructorId.toString() === staff._id.toString()) {
            taughtSlots.push({
              day: tb.day,
              year: tb.year,
              deptCode: tb.deptCode,
              time: slot.time,
              courseCode: slot.courseCode,
              courseName: slot.courseName,
              room: slot.room
            });
          }
        });
      });
    }

    const tasks = await Task.find({
      $or: [{ assignedRole: "staff" }, { staffId: staff._id }]
    }).sort({ createdAt: -1 });

    const events = await Event.find({ status: "Approved" }).sort({ date: 1 }).limit(5);

    const notifications = await Notification.find({
      $or: [{ role: "staff" }, { role: "all" }]
    }).sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      data: {
        profile: staff,
        todayClasses: taughtSlots,
        assignedCourses: staff.assignedCourses || [],
        tasks,
        upcomingEvents: events,
        notifications
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. GET /api/staff/profile/:staffId
router.get("/profile/:staffId", async (req, res) => {
  try {
    const staff = await getStaff(req.params.staffId);
    if (!staff) return res.status(404).json({ success: false, error: "Staff member not found" });
    res.json({ success: true, data: staff });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2b. PUT /api/staff/profile/:staffId
router.put("/profile/:staffId", async (req, res) => {
  try {
    const idParam = req.params.staffId;
    let query;
    if (mongoose.Types.ObjectId.isValid(idParam)) {
      query = { $or: [{ _id: idParam }, { staffId: idParam }] };
    } else {
      query = { staffId: idParam };
    }
    let staff = await Faculty.findOneAndUpdate(query, { $set: req.body }, { returnDocument: 'after', runValidators: true });
    if (!staff) {
      const firstStaff = await Faculty.findOne();
      if (firstStaff) {
        staff = await Faculty.findByIdAndUpdate(firstStaff._id, { $set: req.body }, { returnDocument: 'after', runValidators: true });
      }
    }
    if (!staff) return res.status(404).json({ success: false, error: "Staff profile not found" });
    res.json({ success: true, data: staff });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 3. GET /api/staff/classes/:staffId
router.get("/classes/:staffId", async (req, res) => {
  try {
    const staff = await getStaff(req.params.staffId);
    if (!staff) return res.status(404).json({ success: false, error: "Staff member not found" });

    res.json({
      success: true,
      count: (staff.assignedCourses || []).length,
      data: staff.assignedCourses || []
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. GET /api/staff/tasks/:staffId
router.get("/tasks/:staffId", async (req, res) => {
  try {
    const staff = await getStaff(req.params.staffId);
    const tasks = await Task.find({
      $or: [{ assignedRole: "staff" }, { staffId: staff ? staff._id : null }]
    }).sort({ createdAt: -1 });

    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. GET /api/staff/events/:staffId
router.get("/events/:staffId", async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json({ success: true, count: events.length, data: events });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. GET /api/staff/notifications/:staffId
router.get("/notifications/:staffId", async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [{ role: "staff" }, { role: "all" }],
      dismissed: { $ne: true }
    }).sort({ createdAt: -1 });

    res.json({ success: true, count: notifications.length, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. GET /api/staff/college-info/:staffId
router.get("/college-info/:staffId", async (req, res) => {
  try {
    const staff = await getStaff(req.params.staffId);
    const departments = await Department.find().populate("hodId").sort({ code: 1 });
    const Student = require("../models/Student");
    const Announcement = require("../models/Announcement");

    const totalStudents = await Student.countDocuments();
    const totalFaculty = await Faculty.countDocuments();
    const totalCourses = await Course.countDocuments();
    const activeEventsCount = await Event.countDocuments({ status: "Approved" });
    const announcementsCount = await Announcement.countDocuments();

    res.json({
      success: true,
      data: {
        institutionName: "College AI Assistant University",
        staffDepartment: staff ? (staff.deptId || { name: staff.dept, code: "DEPT", building: "Tech Building 3rd Floor" }) : null,
        departments,
        academicYear: "2026-2027",
        stats: {
          totalStudents,
          totalFaculty,
          totalDepartments: departments.length,
          totalCourses,
          activeEventsCount,
          announcementsCount
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
