const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
  time: { type: String, required: true },
  period: { type: Number, required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  courseCode: { type: String, required: true },
  courseName: { type: String, required: true },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty", required: true },
  instructorName: { type: String, required: true },
  room: { type: String, required: true }
});

const timetableSchema = new mongoose.Schema(
  {
    deptId: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    deptCode: { type: String, required: true },
    year: { type: String, required: true },
    day: { 
      type: String, 
      required: true, 
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] 
    },
    slots: [slotSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Timetable", timetableSchema);
