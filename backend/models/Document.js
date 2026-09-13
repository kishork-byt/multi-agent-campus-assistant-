const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    documentId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: [
        "Academic Regulations",
        "Examination",
        "Library",
        "Hostel",
        "Transport",
        "Scholarships",
        "Certificates & Procedures",
        "Faculty Policies",
        "Administrative Workflows",
        "Campus Facilities",
        "Emergency & Health",
        "General FAQs"
      ],
      default: "General FAQs"
    },
    department: { type: String, default: "General Campus" },
    roleAccess: {
      type: [String],
      default: ["student", "staff", "admin"] // 'student', 'staff', 'admin'
    },
    source: { type: String, default: "Official Campus Policy Archive" },
    content: { type: String, required: true },
    chunkCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["PROCESSING", "COMPLETED", "FAILED"],
      default: "COMPLETED"
    },
    uploadedBy: { type: String, default: "Campus Administration" },
    metadata: { type: Object, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
