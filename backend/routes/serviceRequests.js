const express = require("express");
const router = express.Router();
const serviceRequestTool = require("../services/tools/serviceRequestTool");

// GET /api/service-requests - Retrieve tickets
router.get("/", async (req, res) => {
  try {
    const { userId, role, status } = req.query;
    const tickets = await serviceRequestTool.getTickets({ userId, role, status });
    res.json({
      success: true,
      data: tickets
    });
  } catch (err) {
    console.error("Error fetching service requests:", err);
    res.status(500).json({ success: false, error: "Failed to retrieve service requests." });
  }
});

// POST /api/service-requests - Create new ticket
router.post("/", async (req, res) => {
  try {
    const { userId, userName, userRole, category, subject, description, priority, assignedDepartment } = req.body || {};

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        error: "Subject and description are required fields."
      });
    }

    const created = await serviceRequestTool.createTicket({
      userId,
      userName,
      userRole,
      category,
      subject,
      description,
      priority,
      assignedDepartment
    });

    res.status(201).json({
      success: true,
      data: created
    });
  } catch (err) {
    console.error("Error creating service request:", err);
    res.status(500).json({ success: false, error: "Failed to create service request." });
  }
});

// PATCH /api/service-requests/:id - Update status / assignment
router.patch("/:id", async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { status, assignedDepartment, resolutionNotes } = req.body || {};

    const updated = await serviceRequestTool.updateTicket(ticketId, {
      ...(status ? { status } : {}),
      ...(assignedDepartment ? { assignedDepartment } : {}),
      ...(resolutionNotes !== undefined ? { resolutionNotes } : {})
    });

    if (!updated) {
      return res.status(404).json({ success: false, error: "Service request ticket not found." });
    }

    res.json({
      success: true,
      data: updated
    });
  } catch (err) {
    console.error("Error updating service request:", err);
    res.status(500).json({ success: false, error: "Failed to update service request." });
  }
});

module.exports = router;
