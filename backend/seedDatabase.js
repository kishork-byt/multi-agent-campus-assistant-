const mongoose = require("mongoose");
const path = require("path");
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
try { dns.setServers(["8.8.8.8", "1.1.1.1"]); } catch (e) {}

require("dotenv").config({ path: path.join(__dirname, ".env") });

// Models
const Department = require("./models/Department");
const Course = require("./models/Course");
const Faculty = require("./models/Faculty");
const Student = require("./models/Student");
const Timetable = require("./models/Timetable");
const Attendance = require("./models/Attendance");

// Synthetic / Demo Department Definitions
const DEPARTMENTS_DATA = [
  { code: "AIML", name: "AI & Machine Learning", budget: "$1.8M", description: "Department of Artificial Intelligence and Machine Learning" },
  { code: "CSE", name: "Computer Science and Engineering", budget: "$2.2M", description: "Department of Computer Science and Systems Engineering" },
  { code: "ECE", name: "Electronics and Communication Engineering", budget: "$1.6M", description: "Department of Electronics and Communication Technologies" },
  { code: "IT", name: "Information Technology", budget: "$1.5M", description: "Department of Information Technology and Cloud Systems" },
  { code: "MECH", name: "Mechanical Engineering", budget: "$1.4M", description: "Department of Mechanical, Mechatronics and Robotics Engineering" },
  { code: "EEE", name: "Electrical and Electronics Engineering", budget: "$1.3M", description: "Department of Electrical Power and Electronics Engineering" }
];

// Synthetic / Demo Faculty Definitions (12 Faculty Members)
const FACULTY_DATA = [
  { staffId: "STF-201", name: "Dr. Evelyn Vance", deptCode: "AIML", role: "Head of Dept.", designation: "Professor", title: "Ph.D. in Deep Learning", officeHours: "Tue/Thu 2-4 PM", email: "evelyn.vance@university.edu" },
  { staffId: "STF-202", name: "Prof. Michael Sterling", deptCode: "CSE", role: "Head of Dept.", designation: "Professor", title: "M.Tech in Algorithms", officeHours: "Mon/Wed 10-12 AM", email: "m.sterling@university.edu" },
  { staffId: "STF-203", name: "Dr. Alan Turing", deptCode: "AIML", role: "Associate Professor", designation: "Lead AI Researcher", title: "Ph.D. in Neural Computing", officeHours: "Wed/Fri 1-3 PM", email: "a.turing@university.edu" },
  { staffId: "STF-204", name: "Dr. Robert Lang", deptCode: "ECE", role: "Head of Dept.", designation: "Professor", title: "Ph.D. in VLSI Systems", officeHours: "Tue/Fri 11-1 PM", email: "r.lang@university.edu" },
  { staffId: "STF-205", name: "Dr. Sarah Jenkins", deptCode: "IT", role: "Head of Dept.", designation: "Professor", title: "Ph.D. in Cloud Security", officeHours: "Mon/Thu 3-5 PM", email: "s.jenkins@university.edu" },
  { staffId: "STF-206", name: "Dr. Victor Stone", deptCode: "MECH", role: "Head of Dept.", designation: "Professor", title: "Ph.D. in Robotics", officeHours: "Wed/Fri 9-11 AM", email: "v.stone@university.edu" },
  { staffId: "STF-207", name: "Dr. Maya Patel", deptCode: "EEE", role: "Head of Dept.", designation: "Professor", title: "Ph.D. in Smart Grids", officeHours: "Tue/Thu 1-3 PM", email: "m.patel@university.edu" },
  { staffId: "STF-208", name: "Prof. Clara Oswald", deptCode: "IT", role: "Assistant Professor", designation: "Assistant Professor", title: "M.S. in Web Technologies", officeHours: "Mon/Wed 2-4 PM", email: "c.oswald@university.edu" },
  { staffId: "STF-209", name: "Dr. Marcus Brody", deptCode: "CSE", role: "Associate Professor", designation: "Associate Professor", title: "Ph.D. in Software Architecture", officeHours: "Tue/Thu 10-12 AM", email: "m.brody@university.edu" },
  { staffId: "STF-210", name: "Dr. Elena Rostova", deptCode: "ECE", role: "Assistant Professor", designation: "Assistant Professor", title: "Ph.D. in Embedded Systems", officeHours: "Mon/Wed 1-3 PM", email: "e.rostova@university.edu" },
  { staffId: "STF-211", name: "Prof. David Kim", deptCode: "MECH", role: "Associate Professor", designation: "Associate Professor", title: "M.Tech in Thermodynamics", officeHours: "Thu/Fri 2-4 PM", email: "d.kim@university.edu" },
  { staffId: "STF-212", name: "Dr. Hannah Abbott", deptCode: "EEE", role: "Assistant Professor", designation: "Assistant Professor", title: "Ph.D. in Power Electronics", officeHours: "Mon/Fri 11-1 PM", email: "h.abbott@university.edu" }
];

// Synthetic / Demo Course Definitions (18 Courses across 6 Departments)
const COURSES_DATA = [
  // AIML
  { code: "AIML-401", title: "Advanced Deep Learning & Neural Networks", deptCode: "AIML", staffId: "STF-201", credits: 4, room: "Tech Lab 304", scheduleTime: "Mon/Wed 09:00 AM" },
  { code: "AIML-302", title: "Natural Language Processing", deptCode: "AIML", staffId: "STF-203", credits: 4, room: "AI Lab 102", scheduleTime: "Tue/Thu 11:00 AM" },
  { code: "AIML-201", title: "Introduction to Machine Learning", deptCode: "AIML", staffId: "STF-201", credits: 3, room: "Seminar Hall 1", scheduleTime: "Fri 02:00 PM" },
  // CSE
  { code: "CSE-308", title: "Data Structures & Algorithms", deptCode: "CSE", staffId: "STF-202", credits: 4, room: "Auditorium B", scheduleTime: "Mon/Thu 11:00 AM" },
  { code: "CSE-405", title: "Distributed Systems & Cloud Computing", deptCode: "CSE", staffId: "STF-209", credits: 4, room: "CS Lab 201", scheduleTime: "Tue/Fri 09:00 AM" },
  { code: "CSE-202", title: "Database Management Systems", deptCode: "CSE", staffId: "STF-202", credits: 3, room: "Room 105", scheduleTime: "Wed 01:00 PM" },
  // ECE
  { code: "ECE-301", title: "Digital Signal Processing", deptCode: "ECE", staffId: "STF-204", credits: 4, room: "DSP Lab", scheduleTime: "Mon/Wed 10:00 AM" },
  { code: "ECE-402", title: "VLSI Circuit Design", deptCode: "ECE", staffId: "STF-204", credits: 4, room: "Microelectronics Lab", scheduleTime: "Tue/Thu 02:00 PM" },
  { code: "ECE-205", title: "Embedded Systems Architecture", deptCode: "ECE", staffId: "STF-210", credits: 3, room: "Hardware Lab 3", scheduleTime: "Fri 10:00 AM" },
  // IT
  { code: "IT-304", title: "Full Stack Web Engineering", deptCode: "IT", staffId: "STF-208", credits: 4, room: "Software Lab 4", scheduleTime: "Mon/Wed 02:00 PM" },
  { code: "IT-410", title: "Cybersecurity & Cryptography", deptCode: "IT", staffId: "STF-205", credits: 4, room: "Cyber Security Lab", scheduleTime: "Tue/Thu 09:00 AM" },
  { code: "IT-201", title: "Computer Networks Protocols", deptCode: "IT", staffId: "STF-205", credits: 3, room: "Room 204", scheduleTime: "Fri 11:00 AM" },
  // MECH
  { code: "MECH-302", title: "Robotics & Kinematics", deptCode: "MECH", staffId: "STF-206", credits: 4, room: "Robotics Arena", scheduleTime: "Mon/Thu 09:00 AM" },
  { code: "MECH-405", title: "Advanced Fluid Dynamics", deptCode: "MECH", staffId: "STF-211", credits: 4, room: "Mech Lab 101", scheduleTime: "Wed/Fri 11:00 AM" },
  { code: "MECH-201", title: "Engineering Thermodynamics", deptCode: "MECH", staffId: "STF-206", credits: 3, room: "Room 302", scheduleTime: "Tue 02:00 PM" },
  // EEE
  { code: "EEE-301", title: "Smart Power Systems & Grids", deptCode: "EEE", staffId: "STF-207", credits: 4, room: "Power Systems Lab", scheduleTime: "Mon/Wed 11:00 AM" },
  { code: "EEE-404", title: "Control Systems & Automation", deptCode: "EEE", staffId: "STF-212", credits: 4, room: "Control Lab 2", scheduleTime: "Tue/Thu 01:00 PM" },
  { code: "EEE-202", title: "Electric Machines & Drives", deptCode: "EEE", staffId: "STF-207", credits: 3, room: "Machines Lab", scheduleTime: "Fri 09:00 AM" }
];

// 36 Synthetic Student Names
const STUDENT_NAMES = [
  "Alex Rivera", "Sophia Chen", "Marcus Brody", "Elena Rostova", "David Kim", "Hannah Abbott",
  "Lucas Garcia", "Emma Watson", "Liam Miller", "Olivia Davis", "Noah Wilson", "Ava Taylor",
  "Ethan Anderson", "Isabella Thomas", "James Jackson", "Mia White", "Benjamin Harris", "Charlotte Martin",
  "Alexander Thompson", "Amelia Garcia", "Henry Martinez", "Harper Robinson", "Sebastian Clark", "Evelyn Rodriguez",
  "Jack Lewis", "Abigail Lee", "Owen Walker", "Emily Hall", "Daniel Allen", "Elizabeth Young",
  "Matthew Hernandez", "Sofia King", "Jackson Wright", "Avery Lopez", "Levi Hill", "Ella Scott"
];

const YEARS = ["Freshman", "Sophomore", "Junior", "Senior"];
const ATTENDANCE_STATUSES = ["Present", "Present", "Present", "Present", "Present", "Present", "Present", "Absent", "Late", "Excused"];

async function seedDatabase() {
  let isAtlas = false;
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
      console.log("⚡ Connecting to MongoDB Atlas...");
      try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
        console.log("✅ Successfully connected to MongoDB Atlas!");
        isAtlas = true;
      } catch (atlasErr) {
        console.warn("⚠️ Atlas connection failed/whitelisted IP issue:", atlasErr.message);
        console.log("⚡ Falling back to in-memory MongoMemoryServer for seed verification...");
        const { MongoMemoryServer } = require("mongodb-memory-server");
        const mongod = await MongoMemoryServer.create();
        await mongoose.connect(mongod.getUri());
        console.log("✅ Connected to MongoMemoryServer!");
      }
    } else {
      console.log("⚡ MONGODB_URI missing. Connecting to MongoMemoryServer...");
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongod = await MongoMemoryServer.create();
      await mongoose.connect(mongod.getUri());
      console.log("✅ Connected to MongoMemoryServer!");
    }

    // 1. Seed Departments
    console.log("\n📦 Seeding Departments...");
    const departmentMap = {};
    for (const d of DEPARTMENTS_DATA) {
      const deptDoc = await Department.findOneAndUpdate(
        { code: d.code },
        {
          code: d.code,
          name: d.name,
          budget: d.budget,
          description: d.description
        },
        { upsert: true, returnDocument: "after" }
      );
      departmentMap[d.code] = deptDoc;
    }
    console.log(`✅ ${Object.keys(departmentMap).length} Departments seeded.`);

    // 2. Seed Faculty
    console.log("\n📦 Seeding Faculty members...");
    const facultyMap = {};
    for (const f of FACULTY_DATA) {
      const deptDoc = departmentMap[f.deptCode];
      const facDoc = await Faculty.findOneAndUpdate(
        { staffId: f.staffId },
        {
          staffId: f.staffId,
          name: f.name,
          dept: deptDoc ? deptDoc.name : f.deptCode,
          deptId: deptDoc ? deptDoc._id : null,
          role: f.role,
          designation: f.designation,
          status: "Active",
          email: f.email,
          title: f.title,
          officeHours: f.officeHours
        },
        { upsert: true, returnDocument: "after" }
      );
      facultyMap[f.staffId] = facDoc;

      // Assign HOD if role matches Head of Dept.
      if (f.role === "Head of Dept." && deptDoc) {
        await Department.findByIdAndUpdate(deptDoc._id, {
          hodId: facDoc._id,
          hodName: facDoc.name
        });
      }
    }
    console.log(`✅ ${Object.keys(facultyMap).length} Faculty members seeded.`);

    // 3. Seed Courses
    console.log("\n📦 Seeding Courses...");
    const courseMap = {};
    const coursesByDept = {};
    for (const c of COURSES_DATA) {
      const deptDoc = departmentMap[c.deptCode];
      const facDoc = facultyMap[c.staffId];

      const courseDoc = await Course.findOneAndUpdate(
        { code: c.code },
        {
          code: c.code,
          title: c.title,
          deptId: deptDoc._id,
          deptCode: c.deptCode,
          instructorId: facDoc ? facDoc._id : null,
          instructorName: facDoc ? facDoc.name : "",
          credits: c.credits,
          room: c.room,
          scheduleTime: c.scheduleTime,
          syllabusProgress: Math.floor(Math.random() * 35) + 60,
          avgGrade: ["A", "A-", "B+", "A"][Math.floor(Math.random() * 4)]
        },
        { upsert: true, returnDocument: "after" }
      );
      courseMap[c.code] = courseDoc;

      if (!coursesByDept[c.deptCode]) coursesByDept[c.deptCode] = [];
      coursesByDept[c.deptCode].push(courseDoc._id);

      // Link course to faculty assignedCourses array
      if (facDoc) {
        await Faculty.findByIdAndUpdate(facDoc._id, {
          $addToSet: { assignedCourses: courseDoc._id }
        });
      }
    }
    console.log(`✅ ${Object.keys(courseMap).length} Courses seeded.`);

    // 4. Seed Students (36 Synthetic Students)
    console.log("\n📦 Seeding 36 Synthetic Students...");
    const studentList = [];
    const deptCodes = Object.keys(departmentMap);

    for (let i = 0; i < STUDENT_NAMES.length; i++) {
      const name = STUDENT_NAMES[i];
      const studentIdNum = `STU-2026-${101 + i}`;
      const deptCode = deptCodes[i % deptCodes.length];
      const deptDoc = departmentMap[deptCode];
      const year = YEARS[i % YEARS.length];
      const email = name.toLowerCase().replace(/\s+/g, ".") + "@university.edu";
      const enrolled = coursesByDept[deptCode] || [];
      const cgpa = (3.2 + (Math.random() * 0.75)).toFixed(2);
      const creditsEarned = (YEARS.indexOf(year) + 1) * 30;

      const studentDoc = await Student.findOneAndUpdate(
        { studentId: studentIdNum },
        {
          studentId: studentIdNum,
          name: name,
          dept: deptDoc.name,
          deptId: deptDoc._id,
          year: year,
          cgpa: cgpa,
          creditsEarned: creditsEarned,
          status: "Active",
          email: email,
          enrolledCourses: enrolled,
          aiPreference: "Detailed Academic Explanations (Default)"
        },
        { upsert: true, returnDocument: "after" }
      );
      studentList.push(studentDoc);

      // Update enrolledCount on courses
      for (const courseId of enrolled) {
        await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: 1 } });
      }
    }
    console.log(`✅ ${studentList.length} Synthetic Students seeded.`);

    // Update student counts in departments
    for (const code of deptCodes) {
      const deptDoc = departmentMap[code];
      const sCount = await Student.countDocuments({ deptId: deptDoc._id });
      const fCount = await Faculty.countDocuments({ deptId: deptDoc._id });
      await Department.findByIdAndUpdate(deptDoc._id, {
        studentCount: sCount,
        facultyCount: fCount
      });
    }

    // 5. Seed Timetables
    console.log("\n📦 Seeding Department Timetables (Monday to Saturday)...");
    await Timetable.deleteMany({});

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let timetableCount = 0;

    for (const code of deptCodes) {
      const deptDoc = departmentMap[code];
      const deptCourses = COURSES_DATA.filter(c => c.deptCode === code);

      for (const year of YEARS) {
        for (let dIdx = 0; dIdx < days.length; dIdx++) {
          const dayName = days[dIdx];
          const slots = [];

          for (let period = 1; period <= 3; period++) {
            const courseMeta = deptCourses[(period + dIdx) % deptCourses.length];
            if (courseMeta) {
              const courseDoc = courseMap[courseMeta.code];
              const facDoc = facultyMap[courseMeta.staffId];
              const times = [
                "09:00 AM - 10:30 AM",
                "11:00 AM - 12:30 PM",
                "02:00 PM - 03:30 PM"
              ];

              slots.push({
                time: times[period - 1],
                period: period,
                courseId: courseDoc._id,
                courseCode: courseDoc.code,
                courseName: courseDoc.title,
                instructorId: facDoc._id,
                instructorName: facDoc.name,
                room: courseMeta.room
              });
            }
          }

          await Timetable.create({
            deptId: deptDoc._id,
            deptCode: deptDoc.code,
            year: year,
            day: dayName,
            slots: slots
          });
          timetableCount++;
        }
      }
    }
    console.log(`✅ ${timetableCount} Timetable schedule blocks seeded.`);

    // 6. Seed Attendance Records
    console.log("\n📦 Seeding Synthetic Attendance Records...");
    await Attendance.deleteMany({});

    let attendanceRecordCount = 0;
    const pastDates = [];
    const now = new Date();
    for (let d = 1; d <= 12; d++) {
      const dateObj = new Date(now);
      dateObj.setDate(now.getDate() - d);
      if (dateObj.getDay() !== 0) {
        pastDates.push(dateObj);
      }
    }

    for (const student of studentList) {
      for (const courseId of student.enrolledCourses) {
        const courseDoc = await Course.findById(courseId);
        if (!courseDoc || !courseDoc.instructorId) continue;

        for (const recordDate of pastDates) {
          const status = ATTENDANCE_STATUSES[Math.floor(Math.random() * ATTENDANCE_STATUSES.length)];
          await Attendance.create({
            studentId: student._id,
            studentIdNum: student.studentId,
            studentName: student.name,
            courseId: courseDoc._id,
            courseCode: courseDoc.code,
            instructorId: courseDoc.instructorId,
            date: recordDate,
            status: status,
            remarks: status === "Absent" ? "Unexcused absence" : status === "Late" ? "Arrived 15 mins late" : ""
          });
          attendanceRecordCount++;
        }
      }
    }
    console.log(`✅ ${attendanceRecordCount} Attendance records generated across past 12 class days.`);

    // 7. Seed Events
    console.log("\n📦 Seeding Events...");
    const Event = require("./models/Event");
    const EVENTS_DATA = [
      { eventId: "EVT-101", title: "Annual Campus AI Hackathon 2026", date: "Sept 20, 2026", time: "09:00 AM", location: "Innovation Hub", tag: "Hackathon", category: "Hackathon", desc: "Build cutting-edge generative AI apps with $10,000 in prizes.", organizer: "AI Department", status: "Approved", rsvps: [] },
      { eventId: "EVT-102", title: "Faculty Research & Grant Writing Symposium", date: "Sept 25, 2026", time: "10:30 AM", location: "Main Auditorium", tag: "Workshop", category: "Research", desc: "Interactive workshop on securing NSF & Industry research grants.", organizer: "Dean of Research", status: "Approved", rsvps: [] },
      { eventId: "EVT-103", title: "Guest Lecture: Quantum Computing & Ethics", date: "Oct 02, 2026", time: "02:00 PM", location: "Auditorium B", tag: "Lecture", category: "Academic", desc: "Keynote presentation by MIT guest scholar Dr. Aris Thorne.", organizer: "Physics & CS Dept", status: "Approved", rsvps: [] },
      { eventId: "EVT-104", title: "Inter-College Robotics & Bio-Engineering Expo", date: "Oct 15, 2026", time: "10:00 AM", location: "Sports Complex", tag: "Exhibition", category: "Cultural", desc: "Showcasing autonomous drones, humanoid bots, and bio-inspired robotics.", organizer: "Robotics Club", status: "Approved", rsvps: [] }
    ];

    for (const ev of EVENTS_DATA) {
      await Event.findOneAndUpdate({ eventId: ev.eventId }, ev, { upsert: true });
    }
    console.log(`✅ ${EVENTS_DATA.length} Events seeded.`);

    // 8. Verify Relationships
    console.log("\n🔍 Verifying MongoDB ObjectId Relationships...");
    const sampleStudent = await Student.findOne().populate("deptId").populate("enrolledCourses");
    console.log(`   Student: ${sampleStudent.name} (${sampleStudent.studentId})`);
    console.log(`   └─ Linked Department: ${sampleStudent.deptId ? sampleStudent.deptId.name : "N/A"}`);
    console.log(`   └─ Linked Enrolled Courses Count: ${sampleStudent.enrolledCourses.length}`);

    const sampleCourse = await Course.findOne().populate("deptId").populate("instructorId");
    console.log(`   Course: ${sampleCourse.code} - ${sampleCourse.title}`);
    console.log(`   └─ Linked Department: ${sampleCourse.deptId ? sampleCourse.deptId.name : "N/A"}`);
    console.log(`   └─ Linked Instructor: ${sampleCourse.instructorId ? sampleCourse.instructorId.name : "N/A"}`);

    const sampleDept = await Department.findOne().populate("hodId");
    console.log(`   Department: ${sampleDept.name} (${sampleDept.code})`);
    console.log(`   └─ Linked HOD: ${sampleDept.hodId ? sampleDept.hodId.name : "N/A"}`);

    const sampleAttendance = await Attendance.findOne().populate("studentId").populate("courseId").populate("instructorId");
    console.log(`   Attendance Record: ${sampleAttendance.studentName} for ${sampleAttendance.courseCode} (${sampleAttendance.status})`);
    console.log(`   └─ Linked Student: ${sampleAttendance.studentId ? sampleAttendance.studentId.name : "N/A"}`);
    console.log(`   └─ Linked Course: ${sampleAttendance.courseId ? sampleAttendance.courseId.title : "N/A"}`);
    console.log(`   └─ Linked Instructor: ${sampleAttendance.instructorId ? sampleAttendance.instructorId.name : "N/A"}`);

    console.log("\n==================================================");
    console.log("🎉 PHASE 1 DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("==================================================");
    console.log(`Target Database: ${isAtlas ? "MongoDB Atlas (Cloud)" : "MongoMemoryServer (In-Memory)"}`);
    console.log(`Summary of Seeded MongoDB Records:`);
    console.log(` - Departments : ${Object.keys(departmentMap).length}`);
    console.log(` - Faculty     : ${Object.keys(facultyMap).length}`);
    console.log(` - Courses     : ${Object.keys(courseMap).length}`);
    console.log(` - Students    : ${studentList.length}`);
    console.log(` - Timetables  : ${timetableCount}`);
    console.log(` - Attendance  : ${attendanceRecordCount}`);
    console.log("==================================================\n");

  } catch (error) {
    console.error("❌ Database seeding failed:", error);
  } finally {
    if (require.main === module) {
      await mongoose.disconnect();
      console.log("🔌 Disconnected from MongoDB.");
      process.exit(0);
    }
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
