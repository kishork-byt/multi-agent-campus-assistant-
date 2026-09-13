const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    deptId: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    deptCode: { type: String, required: true },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },
    instructorName: { type: String, default: "" },
    credits: { type: Number, required: true, default: 3 },
    enrolledCount: { type: Number, default: 0 },
    syllabusProgress: { type: Number, default: 0 },
    avgGrade: { type: String, default: "A" },
    scheduleTime: { type: String, default: "" },
    room: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
