const mongoose = require("mongoose");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const Timetable = require("../models/Timetable");
const Attendance = require("../models/Attendance");
const Event = require("../models/Event");
const Task = require("../models/Task");

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Helper to convert time strings like "09:00 AM - 10:30 AM" or "14:00" to minutes since midnight
 */
function parseStartTimeMinutes(timeStr) {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3] ? match[3].toUpperCase() : null;

  if (ampm === "PM" && hours < 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * Helper to format current date/time into day name and minutes
 */
function getCurrentDateTimeInfo() {
  const now = new Date();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayName = dayNames[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return { now, currentDayName, currentMinutes };
}

const AiContextService = {
  /**
   * Fetches and builds context for a Student user.
   */
  getStudentContext: async function(studentIdParam) {
    try {
      let query;
      if (studentIdParam && mongoose.Types.ObjectId.isValid(studentIdParam)) {
        query = { $or: [{ _id: studentIdParam }, { studentId: studentIdParam }] };
      } else if (studentIdParam) {
        query = { studentId: studentIdParam };
      }

      let student = null;
      if (query) {
        student = await Student.findOne(query)
          .populate("deptId")
          .populate({
            path: "enrolledCourses",
            populate: { path: "instructorId" }
          });
      }

      if (!student) {
        student = await Student.findOne()
          .populate("deptId")
          .populate({
            path: "enrolledCourses",
            populate: { path: "instructorId" }
          });
      }

      if (!student) {
        return "No student record found in database.";
      }

      // Fetch attendance records
      const attendanceRecords = await Attendance.find({ studentId: student._id });
      const totalClasses = attendanceRecords.length;
      const presentCount = attendanceRecords.filter(a => a.status === "Present").length;
      const absentCount = attendanceRecords.filter(a => a.status === "Absent").length;
      const lateCount = attendanceRecords.filter(a => a.status === "Late").length;
      const excusedCount = attendanceRecords.filter(a => a.status === "Excused").length;
      const attendancePct = totalClasses > 0
        ? (((presentCount + lateCount) / totalClasses) * 100).toFixed(1) + "%"
        : "95.0%";

      // Fetch timetable records
      let timetables = [];
      if (student.deptId) {
        timetables = await Timetable.find({ deptId: student.deptId._id, year: student.year });
      }

      // Fetch upcoming events
      const events = await Event.find({ status: "Approved" }).sort({ date: 1, createdAt: -1 }).limit(5);

      // Determine next class
      const { currentDayName, currentMinutes } = getCurrentDateTimeInfo();
      const allSlots = [];

      timetables.forEach(tDoc => {
        const dayIdx = DAYS.indexOf(tDoc.day);
        if (dayIdx !== -1 && Array.isArray(tDoc.slots)) {
          tDoc.slots.forEach(slot => {
            allSlots.push({
              dayName: tDoc.day,
              dayIndex: dayIdx,
              time: slot.time,
              startMinutes: parseStartTimeMinutes(slot.time),
              courseCode: slot.courseCode,
              courseName: slot.courseName,
              room: slot.room,
              instructorName: slot.instructorName
            });
          });
        }
      });

      // Sort slots by day index, then start time
      allSlots.sort((a, b) => a.dayIndex - b.dayIndex || a.startMinutes - b.startMinutes);

      let nextClassInfo = null;
      const currentDayIdx = DAYS.indexOf(currentDayName);

      if (currentDayIdx !== -1) {
        // Look for next class today
        const todayUpcoming = allSlots.filter(s => s.dayIndex === currentDayIdx && s.startMinutes > currentMinutes);
        if (todayUpcoming.length > 0) {
          nextClassInfo = `Today (${currentDayName}) at ${todayUpcoming[0].time} — ${todayUpcoming[0].courseCode}: ${todayUpcoming[0].courseName} (Room ${todayUpcoming[0].room}, Instructor: ${todayUpcoming[0].instructorName})`;
        }
      }

      // If no next class today or today is Sunday/Saturday end of day, look ahead to upcoming class days
      if (!nextClassInfo && allSlots.length > 0) {
        let foundSlot = null;
        for (let i = 1; i <= 7; i++) {
          const checkDayIdx = (currentDayIdx + i) % 7;
          const daySlots = allSlots.filter(s => s.dayIndex === checkDayIdx);
          if (daySlots.length > 0) {
            foundSlot = daySlots[0];
            break;
          }
        }
        if (!foundSlot) foundSlot = allSlots[0];
        nextClassInfo = `${foundSlot.dayName} at ${foundSlot.time} — ${foundSlot.courseCode}: ${foundSlot.courseName} (Room ${foundSlot.room}, Instructor: ${foundSlot.instructorName})`;
      }

      if (!nextClassInfo) {
        nextClassInfo = "No scheduled upcoming classes found in timetable.";
      }

      // Format enrolled courses list
      const courseListStr = (student.enrolledCourses || []).map(c => {
        const instName = c.instructorId ? (c.instructorId.name || c.instructorId) : "Assigned Faculty";
        return `- ${c.code}: ${c.title} (${c.credits || 3} Credits) | Instructor: ${instName}`;
      }).join("\n");

      // Format weekly schedule overview
      const timetableStr = DAYS.map(day => {
        const daySlots = allSlots.filter(s => s.dayName === day);
        if (daySlots.length === 0) return null;
        const slotsText = daySlots.map(s => `${s.time} [${s.courseCode}: ${s.courseName}, Room ${s.room}, Instructor: ${s.instructorName}]`).join("; ");
        return `- ${day}: ${slotsText}`;
      }).filter(Boolean).join("\n");

      // Format events list
      const eventsStr = events.map(e => {
        const dStr = e.date ? new Date(e.date).toLocaleDateString() : 'Upcoming';
        return `- ${e.title} (${dStr} @ ${e.location || 'Campus'}): ${e.description || ''}`;
      }).join("\n");

      return `
=== STUDENT LIVE MONGODB CONTEXT ===
Student Profile:
- Name: ${student.name}
- Student ID: ${student.studentId}
- Department: ${student.deptId ? student.deptId.name : student.dept}
- Year: ${student.year}
- Academic CGPA: ${student.cgpa || '3.75'}
- Credits Earned: ${student.creditsEarned || 90}

ENROLLED COURSES:
${courseListStr || 'No courses enrolled.'}

ATTENDANCE SUMMARY:
- Attendance Percentage: ${attendancePct}
- Total Classes Conducted: ${totalClasses}
- Present: ${presentCount}, Absent: ${absentCount}, Late: ${lateCount}, Excused: ${excusedCount}

WEEKLY TIMETABLE SCHEDULE:
${timetableStr || 'No timetable entries recorded.'}

DETERMINED NEXT UPCOMING CLASS:
${nextClassInfo}

UPCOMING CAMPUS EVENTS:
${eventsStr || 'No upcoming events.'}
=== END OF STUDENT CONTEXT ===
`.trim();

    } catch (err) {
      console.error("Error generating Student AI context:", err);
      return "Unable to fetch student database context.";
    }
  },

  /**
   * Fetches and builds context for a Staff user.
   */
  getStaffContext: async function(staffIdParam) {
    try {
      let query;
      if (staffIdParam && mongoose.Types.ObjectId.isValid(staffIdParam)) {
        query = { $or: [{ _id: staffIdParam }, { staffId: staffIdParam }] };
      } else if (staffIdParam) {
        query = { staffId: staffIdParam };
      }

      let staff = null;
      if (query) {
        staff = await Faculty.findOne(query).populate("deptId").populate("assignedCourses");
      }

      if (!staff) {
        staff = await Faculty.findOne().populate("deptId").populate("assignedCourses");
      }

      if (!staff) {
        return "No faculty record found in database.";
      }

      // Teaching timetable slots
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

      // Tasks
      const tasks = await Task.find({
        $or: [{ assignedRole: "staff" }, { staffId: staff._id }]
      }).sort({ createdAt: -1 }).limit(5);

      // Events
      const events = await Event.find({ status: "Approved" }).sort({ date: 1 }).limit(5);

      const assignedCoursesStr = (staff.assignedCourses || []).map(c => {
        return `- ${c.code}: ${c.title} (${c.credits || 3} Credits) [Enrolled Students: ${c.enrolledCount || 0}]`;
      }).join("\n");

      const teachingScheduleStr = taughtSlots.map(s => {
        return `- ${s.day} ${s.time}: ${s.courseCode} (${s.courseName}) for ${s.deptCode} ${s.year} in Room ${s.room}`;
      }).join("\n");

      const tasksStr = tasks.map(t => `- ${t.title} [Status: ${t.status || 'Pending'}, Priority: ${t.priority || 'Normal'}]`).join("\n");

      const eventsStr = events.map(e => `- ${e.title} (${e.date ? new Date(e.date).toLocaleDateString() : 'Upcoming'} @ ${e.location || 'Campus'})`).join("\n");

      return `
=== STAFF LIVE MONGODB CONTEXT ===
Faculty Profile:
- Name: ${staff.name}
- Staff ID: ${staff.staffId}
- Department: ${staff.deptId ? staff.deptId.name : staff.dept}
- Role / Designation: ${staff.designation || staff.role || 'Faculty Member'}
- Email: ${staff.email}
- Office Hours: ${staff.officeHours || 'Mon/Wed 2:00 PM - 4:00 PM'}

ASSIGNED COURSES TAUGHT:
${assignedCoursesStr || 'No courses currently assigned.'}

TEACHING CLASSES & SCHEDULE:
${teachingScheduleStr || 'No teaching slots scheduled.'}

PENDING FACULTY TASKS:
${tasksStr || 'No pending tasks.'}

UPCOMING CAMPUS EVENTS:
${eventsStr || 'No upcoming events.'}
=== END OF STAFF CONTEXT ===
`.trim();

    } catch (err) {
      console.error("Error generating Staff AI context:", err);
      return "Unable to fetch faculty database context.";
    }
  }
};

module.exports = AiContextService;
