/**
 * Service Request Tool for Human Handoff & Helpdesk Escalation
 */

const ServiceRequest = require("../../models/ServiceRequest");
const mongoose = require("mongoose");

const isDbConnected = () => mongoose.connection.readyState === 1;
const inMemoryServiceRequests = [];

const ServiceRequestTool = {
  name: "service_requests",
  description: "Create, view, and manage campus helpdesk tickets and human escalation requests.",

  /**
   * Creates a service request ticket
   */
  createTicket: async function({ userId, userName, userRole = "student", category, subject, description, priority = "MEDIUM", assignedDepartment }) {
    const ticketId = `REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const defaultDeptMap = {
      "Academic & Examination": "Office of the Controller of Examinations",
      "Hostel & Accommodation": "Hostel Warden Office",
      "Transport & Bus Pass": "Campus Transport Directorate",
      "Library & Resources": "University Library Administration",
      "Certificates & Documents": "Student Affairs Office",
      "IT & Campus Infrastructure": "Campus IT Support Helpdesk",
      "Finance & Scholarships": "University Accounts & Scholarship Cell",
      "Administrative Grievance": "Campus Administrative Secretariat",
      "General Inquiry": "Student Services Helpdesk"
    };

    const targetDept = assignedDepartment || defaultDeptMap[category] || "Student Services Helpdesk";

    const ticketData = {
      ticketId,
      userId: userId || "STU-2026-894",
      userName: userName || "Campus User",
      userRole,
      category: category || "General Inquiry",
      subject: subject || "Inquiry from AI Assistant",
      description: description || "No description provided.",
      priority: priority || "MEDIUM",
      status: "OPEN",
      assignedDepartment: targetDept,
      resolutionNotes: ""
    };

    if (isDbConnected()) {
      try {
        const created = await ServiceRequest.create(ticketData);
        return created.toObject();
      } catch (err) {
        console.warn("[ServiceRequestTool] DB creation error, storing in-memory:", err.message);
      }
    }

    const fallbackTicket = {
      _id: "req_" + Date.now(),
      ...ticketData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    inMemoryServiceRequests.unshift(fallbackTicket);
    return fallbackTicket;
  },

  /**
   * Retrieves tickets filtered by user role or user ID
   */
  getTickets: async function({ userId, role, status } = {}) {
    let filter = {};
    if (role && role !== "admin") {
      filter.userId = userId;
    }
    if (status) {
      filter.status = status;
    }

    if (isDbConnected()) {
      try {
        return await ServiceRequest.find(filter).sort({ createdAt: -1 });
      } catch (err) {
        console.warn("[ServiceRequestTool] DB query failed, using in-memory:", err.message);
      }
    }

    return inMemoryServiceRequests.filter(ticket => {
      if (filter.userId && ticket.userId !== filter.userId) return false;
      if (filter.status && ticket.status !== filter.status) return false;
      return true;
    });
  },

  /**
   * Updates ticket status or assigned department
   */
  updateTicket: async function(ticketId, updates) {
    if (isDbConnected()) {
      try {
        const updated = await ServiceRequest.findOneAndUpdate(
          { ticketId: ticketId },
          { $set: updates },
          { new: true }
        );
        if (updated) return updated.toObject();
      } catch (err) {
        console.warn("[ServiceRequestTool] DB update failed:", err.message);
      }
    }

    const item = inMemoryServiceRequests.find(t => t.ticketId === ticketId || t._id === ticketId);
    if (item) {
      Object.assign(item, updates, { updatedAt: new Date().toISOString() });
      return item;
    }
    return null;
  }
};

module.exports = ServiceRequestTool;
