const mongoose = require("mongoose");

const facultySchema = new mongoose.Schema(
  {
    staffId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    dept: { type: String, required: true },
    deptId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    role: { type: String, required: true },
    designation: { type: String, default: "Associate Professor" },
    courses: { type: Number, default: 0 },
    assignedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    status: { type: String, enum: ["Active", "On Leave", "On Sabbatical"], default: "Active" },
    email: { type: String, required: true },
    title: { type: String, default: "" },
    officeHours: { type: String, default: "" },
    phone: { type: String, default: "+1 (555) 234-5678" },
    qualification: { type: String, default: "Ph.D. in Computer Science & Artificial Intelligence" },
    specialization: { type: String, default: "Deep Learning, Natural Language Processing & Computer Vision" },
    experienceYears: { type: Number, default: 12 },
    officeRoom: { type: String, default: "Tech Building Room 304" },
    academicResponsibilities: { type: String, default: "Department Curriculum Chair, AI Lab Director, Undergraduate Mentor" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Faculty", facultySchema);
