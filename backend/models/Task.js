const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    taskId: { type: String },
    title: { type: String, required: true },
    status: { type: String, enum: ["todo", "in-progress", "completed", "Pending", "Completed", "In Progress"], default: "todo" },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "High" },
    dueDate: { type: String, default: "Due Today" },
    desc: { type: String, default: "" },
    assignedRole: { type: String, default: "staff" },
    staffId: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
