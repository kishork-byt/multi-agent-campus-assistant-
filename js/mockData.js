/* ==========================================================================
   COLLEGE AI ASSISTANT - MOCK DATASTORE
   ========================================================================== */

const MockData = {
  // Current logged in user context
  currentUser: {
    name: "Alex Rivera",
    role: "student", // 'student' | 'staff' | 'admin'
    id: "STU-2026-894",
    department: "Computer Science & Engineering",
    avatar: "AR",
    email: "alex.rivera@university.edu"
  },

  // Student Portal Mock Data
  student: {
    stats: {
      cgpa: "3.84",
      attendance: "96.5%",
      creditsEarned: "78 / 120",
      activeTasks: "4 Pending"
    },
    todaySchedule: [
      { time: "09:00 AM - 10:30 AM", course: "CS-401 Advanced AI Systems", room: "Tech Lab 304", instructor: "Dr. Evelyn Vance" },
      { time: "11:00 AM - 12:30 PM", course: "CS-308 Data Structures & Algorithms", room: "Auditorium B", instructor: "Prof. Michael Sterling" },
      { time: "02:00 PM - 03:30 PM", course: "CS-412 Neural Networks & Deep Learning", room: "Seminar Hall 2", instructor: "Dr. Evelyn Vance" }
    ],
    upcomingEvents: [
      { id: "e1", title: "Annual Campus AI Hackathon 2026", date: "Sept 12, 2026", time: "09:00 AM", location: "Innovation Hub", tag: "Hackathon", category: "Hackathon", desc: "Build cutting-edge generative AI apps with $10,000 in prizes.", rsvp: true },
      { id: "e2", title: "Guest Lecture: Quantum Computing & Ethics", date: "Sept 18, 2026", time: "02:00 PM", location: "Main Auditorium", tag: "Lecture", category: "Academic", desc: "Keynote presentation by MIT guest scholar Dr. Aris Thorne.", rsvp: false },
      { id: "e3", title: "Mid-Term Examination Schedule Released", date: "Sept 25, 2026", time: "All Day", location: "Exam Portal", tag: "Academic", category: "Academic", desc: "Review room assignments and exam guidelines on the student portal.", rsvp: false },
      { id: "e4", title: "Inter-College Robotics Expo", date: "Oct 05, 2026", time: "10:00 AM", location: "Sports Complex", tag: "Exhibition", category: "Cultural", desc: "Showcasing autonomous drones, humanoid bots, and bio-inspired robotics.", rsvp: true },
      { id: "e5", title: "Autumn Campus Music & Cultural Fest", date: "Oct 15, 2026", time: "05:00 PM", location: "Open Air Amphitheatre", tag: "Festival", category: "Cultural", desc: "Annual music festival featuring student bands and guest performances.", rsvp: false }
    ],
    notifications: [
      { id: "n1", type: "Academic", title: "Assignment 3 Graded", desc: "Dr. Vance posted feedback for CS-401. Score: 98/100 (A+)", time: "10 mins ago", read: false },
      { id: "n2", type: "Event", title: "Hackathon Registration Open", desc: "Form your team for the AI Hackathon by Friday.", time: "2 hours ago", read: false },
      { id: "n3", type: "System", title: "Library Book Renewal Notice", desc: "'Deep Learning Principles' due in 2 days.", time: "Yesterday", read: true },
      { id: "n4", type: "Academic", title: "Lab 4 Worksheets Uploaded", desc: "Prof. Sterling uploaded Jupyter notebook materials for CS-308.", time: "2 days ago", read: true },
      { id: "n5", type: "System", title: "Semester Fee Receipt Generated", desc: "Tuition payment confirmed for Fall 2026.", time: "3 days ago", read: true }
    ],
    timetable: [
      { day: "Monday", slots: [{ time: "09:00 AM - 10:30 AM", code: "CS-401", name: "AI Systems", room: "Tech Lab 304", instructor: "Dr. Evelyn Vance" }, { time: "14:00 PM - 15:30 PM", code: "CS-412", name: "Neural Networks", room: "Seminar Hall 2", instructor: "Dr. Evelyn Vance" }] },
      { day: "Tuesday", slots: [{ time: "10:00 AM - 11:30 AM", code: "CS-308", name: "Data Structures", room: "Auditorium B", instructor: "Prof. Michael Sterling" }, { time: "13:00 PM - 14:30 PM", code: "MATH-201", name: "Linear Algebra", room: "Room 102", instructor: "Dr. Alan Turing" }] },
      { day: "Wednesday", slots: [{ time: "09:00 AM - 11:00 AM", code: "CS-401 Lab", name: "AI Systems Practical", room: "Tech Lab 304", instructor: "Dr. Evelyn Vance" }, { time: "15:00 PM - 16:30 PM", code: "ENG-102", name: "Tech Communication", room: "Room 205", instructor: "Prof. Clara Oswald" }] },
      { day: "Thursday", slots: [{ time: "11:00 AM - 12:30 PM", code: "CS-412", name: "Neural Networks", room: "Seminar Hall 2", instructor: "Dr. Evelyn Vance" }, { time: "14:00 PM - 16:00 PM", code: "CS-308 Lab", name: "Algorithms Lab", room: "Software Lab 2", instructor: "Prof. Michael Sterling" }] },
      { day: "Friday", slots: [{ time: "09:00 AM - 10:30 AM", code: "CS-308", name: "Data Structures", room: "Auditorium B", instructor: "Prof. Michael Sterling" }, { time: "14:00 PM - 16:30 PM", code: "CS-499", name: "Capstone Senior Project", room: "Lab 101", instructor: "Dr. Evelyn Vance" }] }
    ],
    courses: [
      { code: "CS-401", title: "Advanced AI Systems", credits: 4, grade: "A", instructor: "Dr. Evelyn Vance", progress: 85 },
      { code: "CS-412", title: "Neural Networks & Deep Learning", credits: 4, grade: "A-", instructor: "Dr. Evelyn Vance", progress: 78 },
      { code: "CS-308", title: "Data Structures & Algorithms", credits: 4, grade: "A", instructor: "Prof. Michael Sterling", progress: 92 },
      { code: "MATH-201", title: "Linear Algebra & Optimization", credits: 3, grade: "B+", instructor: "Dr. Alan Turing", progress: 80 },
      { code: "CS-499", title: "Senior Capstone Mentorship", credits: 3, grade: "In Progress", instructor: "Dr. Evelyn Vance", progress: 60 }
    ],
    libraryResources: [
      { id: "lib1", title: "Pattern Recognition and Machine Learning", author: "Christopher M. Bishop", code: "BOOK-AI-902", status: "Available" },
      { id: "lib2", title: "Deep Learning (Adaptive Computation)", author: "Ian Goodfellow, Yoshua Bengio", code: "BOOK-AI-441", status: "Borrowed (Due Sept 02)" },
      { id: "lib3", title: "Artificial Intelligence: A Modern Approach", author: "Stuart Russell, Peter Norvig", code: "BOOK-AI-101", status: "Available" },
      { id: "lib4", title: "Introduction to Algorithms (CLRS)", author: "Thomas H. Cormen et al.", code: "BOOK-CS-004", status: "Available" }
    ]
  },

  // Staff & Management Portal Mock Data
  staff: {
    stats: {
      totalStudentsTaught: 240,
      activeCourses: 3,
      pendingGrading: 18,
      avgClassAttendance: "94.2%"
    },
    tasks: [
      { id: "t1", title: "Grade CS-401 Midterm Lab Reports", status: "todo", priority: "High", dueDate: "Sept 02", desc: "Review 85 submitted Jupyter Notebooks and assign rubric scores." },
      { id: "t2", title: "Upload Lecture 6 Slides on Neural Networks", status: "in-progress", priority: "Medium", dueDate: "Sept 01", desc: "Add transformer architecture slides to course portal." },
      { id: "t3", title: "Approve Departmental Conference Leave", status: "completed", priority: "Low", dueDate: "Aug 27", desc: "Processed request for IEEE AI Summit attendance." },
      { id: "t4", title: "Prepare Quiz 4 with AI Assistant", status: "todo", priority: "High", dueDate: "Sept 05", desc: "Generate 10 multiple-choice questions on CNNs." },
      { id: "t5", title: "Conduct Capstone Mid-term Evaluation", status: "in-progress", priority: "High", dueDate: "Sept 10", desc: "Evaluate Senior Capstone Group 4 presentation slides." }
    ],
    classes: [
      { code: "CS-401", title: "Advanced AI Systems", enrolled: 85, schedule: "Mon/Wed 09:00 AM", syllabusProgress: 65, avgGrade: "3.72" },
      { code: "CS-412", title: "Neural Networks & Deep Learning", enrolled: 92, schedule: "Mon/Thu 02:00 PM", syllabusProgress: 58, avgGrade: "3.55" },
      { code: "CS-499", title: "Senior Capstone Mentorship", enrolled: 63, schedule: "Fri 02:00 PM", syllabusProgress: 80, avgGrade: "3.88" }
    ],
    notifications: [
      { id: "sn1", title: "Faculty Meeting Scheduled", desc: "Computer Science department curriculum review on Thursday 3 PM.", time: "1 hour ago", read: false },
      { id: "sn2", title: "Grades Submission Portal Opened", desc: "Mid-semester internal marks entry deadline is Sept 15.", time: "5 hours ago", read: false },
      { id: "sn3", title: "Research Grant Proposal Approved", desc: "Your AI Ethics grant application ($45,000) was approved.", time: "Yesterday", read: true }
    ],
    events: [
      { id: "se1", title: "Faculty Workshop: AI-Assisted Pedagogy", date: "Sept 15, 2026", time: "10:00 AM", location: "Conference Hall A", role: "Speaker" },
      { id: "se2", title: "CS Department Research Colloquium", date: "Sept 22, 2026", time: "02:00 PM", location: "Seminar Room 4", role: "Attendee" }
    ]
  },

  // Administration Portal Mock Data
  admin: {
    stats: {
      totalStudents: 3450,
      totalStaff: 185,
      departments: 12,
      overallAttendance: "95.1%",
      activeAiQueries: "14,280 / day"
    },
    studentsList: [
      { id: "STU-101", name: "Alex Rivera", dept: "Computer Science", year: "Senior", cgpa: "3.84", status: "Active", email: "alex.rivera@university.edu" },
      { id: "STU-102", name: "Sophia Chen", dept: "Data Science", year: "Junior", cgpa: "3.92", status: "Active", email: "sophia.c@university.edu" },
      { id: "STU-103", name: "Marcus Brody", dept: "Electrical Eng.", year: "Sophomore", cgpa: "3.45", status: "On Leave", email: "marcus.b@university.edu" },
      { id: "STU-104", name: "Elena Rostova", dept: "Biotechnology", year: "Senior", cgpa: "3.78", status: "Active", email: "elena.r@university.edu" },
      { id: "STU-105", name: "David Kim", dept: "Mechanical Eng.", year: "Freshman", cgpa: "3.60", status: "Active", email: "david.k@university.edu" },
      { id: "STU-106", name: "Hannah Abbott", dept: "Computer Science", year: "Junior", cgpa: "3.88", status: "Active", email: "hannah.a@university.edu" },
      { id: "STU-107", name: "Lucas Garcia", dept: "Data Science", year: "Freshman", cgpa: "3.52", status: "Active", email: "lucas.g@university.edu" }
    ],
    staffList: [
      { id: "STF-201", name: "Dr. Evelyn Vance", dept: "Computer Science", role: "Associate Professor", courses: 3, status: "Active", email: "evelyn.vance@university.edu" },
      { id: "STF-202", name: "Prof. Michael Sterling", dept: "Computer Science", role: "Head of Dept.", courses: 2, status: "Active", email: "m.sterling@university.edu" },
      { id: "STF-203", name: "Dr. Sarah Jenkins", dept: "Biotechnology", role: "Professor", courses: 4, status: "Active", email: "s.jenkins@university.edu" },
      { id: "STF-204", name: "Dr. Alan Turing", dept: "Data Science", role: "Lead AI Researcher", courses: 2, status: "On Sabbatical", email: "a.turing@university.edu" },
      { id: "STF-205", name: "Dr. Robert Lang", dept: "Electrical Eng.", role: "Associate Professor", courses: 3, status: "Active", email: "r.lang@university.edu" }
    ],
    departmentsList: [
      { id: "d1", name: "Computer Science & Engineering", hod: "Prof. Michael Sterling", students: 850, faculty: 34, budget: "$1.4M", code: "CSE" },
      { id: "d2", name: "Data Science & Artificial Intelligence", hod: "Dr. Alan Turing", students: 620, faculty: 28, budget: "$1.2M", code: "DSAI" },
      { id: "d3", name: "Electrical & Communication Eng.", hod: "Dr. Robert Lang", students: 740, faculty: 40, budget: "$1.5M", code: "ECE" },
      { id: "d4", name: "Biotechnology & Bio-engineering", hod: "Dr. Sarah Jenkins", students: 480, faculty: 22, budget: "$950K", code: "BIO" },
      { id: "d5", name: "Mechanical & Robotics Engineering", hod: "Dr. Victor Stone", students: 760, faculty: 38, budget: "$1.6M", code: "MECH" },
      { id: "d6", name: "Civil & Environmental Engineering", hod: "Dr. Maya Patel", students: 510, faculty: 23, budget: "$880K", code: "CIVIL" }
    ],
    announcements: [
      { id: "a1", title: "Fall Semester Exam Timetable Announcement", target: "All Students & Staff", date: "Aug 28, 2026", author: "Dean of Academics", priority: "High" },
      { id: "a2", title: "Campus AI Server Maintenance Window", target: "All Users", date: "Aug 25, 2026", author: "IT Administration", priority: "Medium" },
      { id: "a3", title: "Faculty Research Grant Applications 2027", target: "Staff Only", date: "Aug 20, 2026", author: "Research Directorate", priority: "Normal" },
      { id: "a4", title: "Library Opening Hours Extended for Finals", target: "Students Only", date: "Aug 15, 2026", author: "University Librarian", priority: "Normal" }
    ],
    eventsApprovals: [
      { id: "ea1", title: "AI Hackathon 2026", organizer: "Student CS Club", venue: "Innovation Hub", date: "Sept 12", status: "Approved" },
      { id: "ea2", title: "Robotics Workshop", organizer: "Robotics Society", venue: "Lab 102", date: "Sept 20", status: "Pending Approval" },
      { id: "ea3", title: "BioTech Poster Symposium", organizer: "Dr. Sarah Jenkins", venue: "Auditorium A", date: "Oct 02", status: "Approved" }
    ],
    auditLogs: [
      { id: "log1", action: "User Role Permission Granted", actor: "Admin (SA-001)", target: "Dr. Evelyn Vance", ip: "192.168.1.45", timestamp: "Aug 28, 19:42" },
      { id: "log2", action: "New Student Account Created", actor: "Admin (SA-001)", target: "Jordan Smith (STU-992)", ip: "192.168.1.45", timestamp: "Aug 28, 18:15" },
      { id: "log3", action: "System Backup Completed", actor: "System Automated Task", target: "PostgreSQL Master DB", ip: "127.0.0.1", timestamp: "Aug 28, 04:00" },
      { id: "log4", action: "Campus Announcement Published", actor: "Dean of Academics", target: "All Campus Users", ip: "192.168.2.11", timestamp: "Aug 27, 14:30" }
    ]
  },

  // AI Assistant Chat History & Demo Prompts
  aiPrompts: {
    student: [
      "Summarize Quiz 3 topics for CS-401",
      "What classes do I have tomorrow morning?",
      "Help me outline my Neural Networks essay",
      "Find study resources for Linear Algebra"
    ],
    staff: [
      "Generate a 5-question quiz on Convolutional Networks",
      "Draft a message to students missing Lab 2",
      "Create a rubric for Capstone Senior Presentations",
      "Summarize class attendance statistics for CS-401"
    ],
    admin: [
      "Generate monthly campus attendance report",
      "Identify departments with highest AI assistant usage",
      "Draft campus-wide announcement for AI Hackathon",
      "Check server load and AI query latency"
    ]
  },

  // Anonymous Campus Community Initial Seed Posts
  communityPosts: [
    {
      id: "post_101",
      authorRole: "student",
      authorIdInternal: "STU-102",
      category: "Infrastructure",
      text: "The air conditioning unit in Tech Lab 304 is making an extraordinarily loud rattling noise and failing to cool the room. It gets very uncomfortable during 2-hour afternoon labs.",
      mediaType: "none",
      mediaUrl: "",
      timestamp: "25 mins ago",
      createdAt: "2026-08-29T21:30:00Z",
      supportCount: 18,
      supportedBy: ["STU-101", "STU-103"],
      comments: [
        { id: "c101_1", authorRole: "staff", text: "Facility engineering has logged ticket #4092. Technician dispatched for tomorrow morning.", timestamp: "10 mins ago" },
        { id: "c101_2", authorRole: "student", text: "Can confirm, it was overheating our GPUs during CS-401 lab today!", timestamp: "5 mins ago" }
      ],
      status: "active",
      flagReason: null,
      linkedPostId: null
    },
    {
      id: "post_102",
      authorRole: "student",
      authorIdInternal: "STU-104",
      category: "Transport",
      text: "The 6:30 PM campus shuttle from South Gate to North Campus has been delayed by over 30 minutes three days in a row. Can administration update the live bus tracking schedule?",
      mediaType: "none",
      mediaUrl: "",
      timestamp: "1 hour ago",
      createdAt: "2026-08-29T21:00:00Z",
      supportCount: 29,
      supportedBy: ["STU-105"],
      comments: [
        { id: "c102_1", authorRole: "student", text: "Yes! Many commuting students missed their evening connector buses.", timestamp: "45 mins ago" }
      ],
      status: "active",
      flagReason: null,
      linkedPostId: null
    },
    {
      id: "post_103",
      authorRole: "staff",
      authorIdInternal: "STF-201",
      category: "Academic",
      text: "Suggesting extending the main library reading hall hours to 2:00 AM during mid-term examination week. Many students need quiet study space with fast Wi-Fi access.",
      mediaType: "none",
      mediaUrl: "",
      timestamp: "2 hours ago",
      createdAt: "2026-08-29T20:00:00Z",
      supportCount: 45,
      supportedBy: ["STU-101", "STU-102", "STF-202"],
      comments: [
        { id: "c103_1", authorRole: "student", text: "100% support this! The library gets fully packed by 7 PM.", timestamp: "1 hour ago" }
      ],
      status: "active",
      flagReason: null,
      linkedPostId: null
    },
    {
      id: "post_104",
      authorRole: "student",
      authorIdInternal: "STU-107",
      category: "Campus Issue",
      text: "URGENT WARNING: Free high-speed campus gift cards available click this unverified external link bit.ly/free-cards-2026 to claim free vouchers immediately!",
      mediaType: "none",
      mediaUrl: "",
      timestamp: "3 hours ago",
      createdAt: "2026-08-29T19:00:00Z",
      supportCount: 0,
      supportedBy: [],
      comments: [],
      status: "flagged",
      flagReason: "AI Moderation Flag: Suspicious/Phishing Link Pattern Detected",
      linkedPostId: null
    }
  ]
};
