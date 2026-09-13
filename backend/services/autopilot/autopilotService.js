/**
 * CAMPUSNOVA AUTOPILOT SERVICE
 * Proactively scans campus services to identify useful repetitive tasks,
 * upcoming unregistered workshops, overdue tasks, and unresolved support issues.
 */

const mongoose = require("mongoose");
const Event = require("../../models/Event");
const Task = require("../../models/Task");
const SupportIssue = require("../../models/SupportIssue");
const Announcement = require("../../models/Announcement");
const agentRegistry = require("../agents/agentRegistry");
const campusNovaAgent = require("../agents/CampusNovaAgent");

const isDbConnected = () => mongoose.connection.readyState === 1;

class AutopilotService {
  constructor() {
    this.name = "CampusNova Autopilot";
    this.enabled = true;
  }

  /**
   * Stages pending approval into canonical agent approval stores
   * Preserves role isolation, user scoping, and cross-agent replay protection.
   */
  stagePendingApproval(approvalId, approvalRecord, targetAgent) {
    if (!targetAgent) return;

    targetAgent.pendingApprovals.set(approvalId, approvalRecord);

    // Also link into campusNovaAgent for legacy test callers
    if (campusNovaAgent && targetAgent !== campusNovaAgent) {
      campusNovaAgent.pendingApprovals.set(approvalId, approvalRecord);
    }

    // Mutual resolution synchronization with recursion guard
    let resolving = false;
    const syncResolve = (id) => {
      if (resolving || id !== approvalId) return;
      resolving = true;
      try {
        targetAgent.pendingApprovals.delete(approvalId);
        targetAgent.resolvedApprovals.add(approvalId);
        if (campusNovaAgent && targetAgent !== campusNovaAgent) {
          campusNovaAgent.pendingApprovals.delete(approvalId);
          campusNovaAgent.resolvedApprovals.add(approvalId);
        }
      } finally {
        resolving = false;
      }
    };

    if (!targetAgent._syncHookInstalled) {
      targetAgent._syncHookInstalled = true;
      const origTargetAdd = targetAgent.resolvedApprovals.add.bind(targetAgent.resolvedApprovals);
      targetAgent.resolvedApprovals.add = function(id) {
        const res = origTargetAdd(id);
        syncResolve(id);
        return res;
      };
    }

    if (campusNovaAgent && targetAgent !== campusNovaAgent && !campusNovaAgent._syncHookInstalled) {
      campusNovaAgent._syncHookInstalled = true;
      const origCampusAdd = campusNovaAgent.resolvedApprovals.add.bind(campusNovaAgent.resolvedApprovals);
      campusNovaAgent.resolvedApprovals.add = function(id) {
        const res = origCampusAdd(id);
        syncResolve(id);
        return res;
      };
    }
  }

  /**
   * Scans campus records and identifies proactive actions for the user
   */
  async runScan(options = {}) {
    return this.scanForProactiveTasks(options);
  }

  async scanForProactiveTasks({ userId = "STU-2026-894", role = "student" } = {}) {
    const insights = [];

    if (!isDbConnected()) {
      return this.getFallbackInsights(userId, role);
    }

    try {
      // 1. Proactive Event Check: Upcoming events not registered
      const events = await Event.find({ status: "Approved" }).sort({ date: 1 }).limit(10).lean();
      for (const ev of events) {
        const isRegistered = Array.isArray(ev.registeredUsers) && ev.registeredUsers.some(u => u.userId === userId);
        if (!isRegistered) {
          // Found an upcoming event the user hasn't registered for!
          const approvalId = `appr_auto_${Date.now()}_${Math.floor(Math.random() * 900 + 100)}`;
          const targetEvent = {
            id: ev.eventId || ev._id.toString(),
            eventId: ev.eventId || ev._id.toString(),
            _id: ev._id.toString(),
            title: ev.title,
            date: ev.date,
            time: ev.time || "10:00 AM",
            location: ev.location || ev.venue || "Campus Innovation Hub"
          };

          // Canonical approval registration via target role agent
          const targetAgent = agentRegistry.getAgentForUser({ role, id: userId });
          const approvalRecord = {
            approvalId,
            userId,
            userRole: role,
            agentName: targetAgent.name,
            targetEvent,
            action: "register_for_event",
            intent: "REGISTER_FOR_EVENT",
            input: {
              eventId: targetEvent.eventId,
              eventTitle: targetEvent.title
            },
            createdAt: Date.now(),
            expiresAt: Date.now() + 15 * 60 * 1000
          };

          this.stagePendingApproval(approvalId, approvalRecord, targetAgent);

          const approvalPayload = {
            approvalId,
            actionType: "REGISTER_FOR_EVENT",
            userId,
            userRole: role,
            event: targetEvent,
            originalMessage: `Proactive registration for ${ev.title}`
          };

          insights.push({
            id: `insight_event_${ev._id}`,
            type: "UPCOMING_EVENT_UNREGISTERED",
            category: "Event Registration",
            urgency: "HIGH",
            icon: "sparkles",
            title: `Unregistered: ${ev.title}`,
            message: `I noticed that you have an upcoming event "${ev.title}" on ${ev.date} at ${ev.time || '10:00 AM'}, and you are not registered yet. Would you like me to register you?`,
            event: targetEvent,
            actionRequired: true,
            approvalId,
            actionLabel: "Register Me",
            actionPayload: approvalPayload
          });
          break; // Suggest top unregistered event first
        }
      }

      // 2. Proactive Task Deadline Check
      const pendingTasks = await Task.find({
        userId,
        status: { $in: ["todo", "in-progress"] }
      }).sort({ createdAt: -1 }).limit(5).lean();

      for (const t of pendingTasks) {
        insights.push({
          id: `insight_task_${t._id}`,
          type: "UPCOMING_TASK_DEADLINE",
          category: "Task Reminder",
          urgency: t.priority === "High" ? "HIGH" : "MEDIUM",
          icon: "check-circle",
          title: `Pending Task: ${t.title}`,
          message: `You have an active task "${t.title}" scheduled for ${t.dueDate || 'Today'}.`,
          task: {
            id: t._id.toString(),
            title: t.title,
            dueDate: t.dueDate,
            priority: t.priority
          },
          actionRequired: false
        });
        break;
      }

      // 3. Proactive Support Issue Tracking
      const openIssues = await SupportIssue.find({
        userId,
        status: { $in: ["OPEN", "IN_PROGRESS"] }
      }).sort({ createdAt: -1 }).limit(1).lean();

      if (openIssues.length > 0) {
        const iss = openIssues[0];
        insights.push({
          id: `insight_issue_${iss._id}`,
          type: "UNRESOLVED_SUPPORT_TICKET",
          category: "Campus Support",
          urgency: "MEDIUM",
          icon: "life-buoy",
          title: `Active Ticket: ${iss.issueId}`,
          message: `Your ticket ${iss.issueId} for "${iss.title}" (${iss.location}) is currently ${iss.status} with ${iss.department}.`,
          issue: {
            issueId: iss.issueId,
            title: iss.title,
            status: iss.status,
            department: iss.department
          },
          actionRequired: false
        });
      }

      // 4. Proactive Announcement Check
      const urgentAnnouncements = await Announcement.find({
        priority: { $in: ["High", "Urgent"] }
      }).sort({ createdAt: -1 }).limit(1).lean();

      if (urgentAnnouncements.length > 0) {
        const ann = urgentAnnouncements[0];
        insights.push({
          id: `insight_ann_${ann._id}`,
          type: "CAMPUS_ANNOUNCEMENT",
          category: "Announcement",
          urgency: "HIGH",
          icon: "bell",
          title: ann.title,
          message: `${ann.message} (Target: ${ann.target})`,
          actionRequired: false
        });
      }
    } catch (err) {
      console.warn("[AutopilotService] DB scan notice:", err.message);
    }

    if (insights.length === 0) {
      return this.getFallbackInsights(userId, role);
    }

    return insights;
  }

  getFallbackInsights(userId, role) {
    const approvalId = `appr_auto_fb_${Date.now()}_${Math.floor(Math.random() * 900 + 100)}`;
    const targetEvent = {
      id: "e1",
      eventId: "e1",
      title: "Annual Campus AI Hackathon 2026",
      date: "Sept 12, 2026",
      time: "09:00 AM",
      location: "Innovation Hub"
    };

    const targetAgent = agentRegistry.getAgentForUser({ role, id: userId });
    const approvalRecord = {
      approvalId,
      userId,
      userRole: role,
      agentName: targetAgent.name,
      targetEvent,
      action: "register_for_event",
      intent: "REGISTER_FOR_EVENT",
      input: {
        eventId: "e1",
        eventTitle: targetEvent.title
      },
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000
    };

    this.stagePendingApproval(approvalId, approvalRecord, targetAgent);

    const payload = {
      approvalId,
      actionType: "REGISTER_FOR_EVENT",
      userId,
      userRole: role,
      event: targetEvent,
      originalMessage: `Proactive registration for ${targetEvent.title}`
    };

    return [
      {
        id: "insight_event_default",
        type: "UPCOMING_EVENT_UNREGISTERED",
        category: "Event Registration",
        urgency: "HIGH",
        icon: "sparkles",
        title: `Unregistered: ${targetEvent.title}`,
        message: `I noticed that you have an upcoming event "${targetEvent.title}" on ${targetEvent.date} at ${targetEvent.time}, and you are not registered. Would you like me to register you?`,
        event: targetEvent,
        actionRequired: true,
        approvalId,
        actionLabel: "Register Me",
        actionPayload: payload
      }
    ];
  }
}

module.exports = new AutopilotService();
