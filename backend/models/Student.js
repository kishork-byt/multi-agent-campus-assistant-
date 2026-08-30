const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    dept: { type: String, required: true },
    year: { type: String, required: true },
    cgpa: { type: String, default: "3.75" },
    status: { type: String, enum: ["Active", "On Leave", "Graduated"], default: "Active" },
    email: { type: String, required: true },
    aiPreference: { type: String, default: "Detailed Academic Explanations (Default)" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
