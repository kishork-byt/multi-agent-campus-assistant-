const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    hodId: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },
    hodName: { type: String, default: "" },
    budget: { type: String, default: "$1.0M" },
    studentCount: { type: Number, default: 0 },
    facultyCount: { type: Number, default: 0 },
    description: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Department", departmentSchema);
