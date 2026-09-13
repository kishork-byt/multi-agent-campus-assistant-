const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    studentIdNum: { type: String, required: true },
    studentName: { type: String, required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    courseCode: { type: String, required: true },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty", required: true },
    date: { type: Date, required: true, default: Date.now },
    status: {
      type: String,
      required: true,
      enum: ["Present", "Absent", "Late", "Excused"],
      default: "Present"
    },
    remarks: { type: String, default: "" }
  },
  { timestamps: true }
);

attendanceSchema.index({ studentId: 1, courseId: 1, date: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
