const mongoose = require("mongoose");

const facultySchema = new mongoose.Schema(
  {
    staffId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    dept: { type: String, required: true },
    role: { type: String, required: true },
    courses: { type: Number, default: 0 },
    status: { type: String, enum: ["Active", "On Leave", "On Sabbatical"], default: "Active" },
    email: { type: String, required: true },
    title: { type: String, default: "" },
    officeHours: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Faculty", facultySchema);
