const mongoose = require("mongoose");

const serviceRequestSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, default: "Campus User" },
    userRole: {
      type: String,
      enum: ["student", "staff", "admin"],
      default: "student"
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Academic & Examination",
        "Hostel & Accommodation",
        "Transport & Bus Pass",
        "Library & Resources",
        "Certificates & Documents",
        "IT & Campus Infrastructure",
        "Finance & Scholarships",
        "Administrative Grievance",
        "General Inquiry"
      ],
      default: "General Inquiry"
    },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM"
    },
    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
      default: "OPEN"
    },
    assignedDepartment: { type: String, default: "Student Affairs Office" },
    resolutionNotes: { type: String, default: "" },
    assignedTo: { type: String, default: "Helpdesk Officer" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServiceRequest", serviceRequestSchema);
