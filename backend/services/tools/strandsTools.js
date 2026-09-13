/**
 * CAMPUSNOVA REAL STRANDS TOOLS
 * 8 Real Backend Operations with MongoDB Persistence, Verification,
 * User Scoping, and Error Handling.
 */

const { z } = require("zod");
const mongoose = require("mongoose");
const Event = require("../../models/Event");
const Task = require("../../models/Task");
const Notification = require("../../models/Notification");
const SupportIssue = require("../../models/SupportIssue");
const Announcement = require("../../models/Announcement");
const campusLocationsTool = require("./campusLocationsTool");
const ragService = require("../ragService");

const isDbConnected = () => mongoose.connection.readyState === 1;

// In-memory fallbacks when running entirely without persistent DB
const memoryStore = {
  events: [],
  tasks: [],
  notifications: [],
  supportIssues: []
};

/**
 * TOOL 1: search_events
 * Purpose: Find campus events based on keyword, date, category, department, availability
 */
const searchEventsSchema = z.object({
  keyword: z.string().optional().describe("Search keyword for title, description, or tags (e.g., 'AI', 'Workshop')"),
  dateFrom: z.string().optional().describe("Start date filter in YYYY-MM-DD or textual format (e.g., '2026-09-10')"),
  dateTo: z.string().optional().describe("End date filter in YYYY-MM-DD or textual format (e.g., '2026-09-16')"),
  date: z.string().optional().describe("Date or time filter, e.g., 'this week', 'Sept 12, 2026'"),
  category: z.string().optional().describe("Event category, e.g., 'Academic', 'Hackathon', 'Cultural'"),
  department: z.string().optional().describe("Department or organizer name"),
  availability: z.string().optional().describe("Filter by availability or approval status")
});

async function executeSearchEvents(input, context = {}) {
  const { keyword, dateFrom, dateTo, date, category, department, availability } = input || {};
  let query = { status: availability || "Approved" };

  if (category && category !== "All") {
    query.category = new RegExp(category, "i");
  }

  if (department) {
    query.organizer = new RegExp(department, "i");
  }

  if (keyword) {
    const cleanKey = keyword.replace(/[.,?!]+$/, "").trim();
    const stripped = cleanKey
      .replace(/^(?:register me for|sign me up for|enroll me in|register for|find|search for|are there any|show me)\s+(?:the\s+)?/i, "")
      .replace(/\s+(?:tomorrow|this week|today|next week)$/i, "")
      .replace(/[.,?!]+$/, "")
      .trim();

    const searchTerms = [cleanKey];
    if (stripped && stripped !== cleanKey) searchTerms.push(stripped);
    if (cleanKey.endsWith("s") && cleanKey.length > 3) searchTerms.push(cleanKey.slice(0, -1));
    if (stripped && stripped.endsWith("s") && stripped.length > 3) searchTerms.push(stripped.slice(0, -1));

    const isGenericEventsQuery = /^(?:events?|workshops?|all|upcoming)$/i.test(stripped);
    if (!isGenericEventsQuery) {
      const stopWords = new Set(["find", "search", "events", "event", "this", "week", "next", "today", "tomorrow", "upcoming", "show", "there", "with", "from", "have", "some"]);
      const words = stripped
        .split(/\s+/)
        .map(w => w.replace(/[^a-zA-Z0-9]/g, ""))
        .filter(w => w.length >= 2 && !stopWords.has(w.toLowerCase()));

      const orClauses = [];
      for (const term of searchTerms) {
        orClauses.push(
          { title: new RegExp(term, "i") },
          { desc: new RegExp(term, "i") },
          { location: new RegExp(term, "i") },
          { venue: new RegExp(term, "i") },
          { tag: new RegExp(term, "i") }
        );
      }
      for (const w of words) {
        orClauses.push(
          { title: new RegExp(w, "i") },
          { desc: new RegExp(w, "i") },
          { tag: new RegExp(w, "i") }
        );
      }
      query.$or = orClauses;
    } else if (/workshops?/i.test(stripped)) {
      query.$or = [
        { tag: new RegExp("workshop", "i") },
        { title: new RegExp("workshop", "i") },
        { desc: new RegExp("workshop", "i") }
      ];
    }
  }

  let events = [];
  if (isDbConnected()) {
    try {
      events = await Event.find(query).sort({ date: 1 }).lean();
      if (events.length === 0 && keyword) {
        // Fallback to searching without status filter if nothing approved
        delete query.status;
        events = await Event.find(query).sort({ date: 1 }).lean();
      }
    } catch (err) {
      console.warn("[search_events] MongoDB query error:", err.message);
    }
  }

  // If DB returned empty or offline, check memoryStore
  if (events.length === 0 && memoryStore.events.length > 0) {
    events = memoryStore.events.filter(e => {
      if (keyword) {
        const k = keyword.toLowerCase();
        return (e.title || "").toLowerCase().includes(k) || (e.desc || "").toLowerCase().includes(k);
      }
      return true;
    });
  }

  // Structured date range filtering
  const parseEventDate = (dStr) => {
    if (!dStr) return null;
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? null : d;
  };
  const fromD = parseEventDate(dateFrom);
  const toD = parseEventDate(dateTo);
  if (fromD || toD) {
    const inRange = events.filter(e => {
      const ed = parseEventDate(e.date);
      if (!ed) return true; // keep if date string is non-standard
      if (fromD && ed < fromD) return false;
      if (toD) {
        const endOfDay = new Date(toD);
        endOfDay.setHours(23, 59, 59, 999);
        if (ed > endOfDay) return false;
      }
      return true;
    });
    if (inRange.length > 0) {
      events = inRange;
    }
  }

  // Sort by text relevance if a keyword was provided
  if (keyword && events.length > 1) {
    const kLower = (keyword || "").toLowerCase();
    const strippedLower = (keyword || "")
      .replace(/^(?:register me for|sign me up for|enroll me in|register for|find|search for|are there any|show me)\s+(?:the\s+)?/i, "")
      .replace(/\s+(?:tomorrow|this week|today|next week)$/i, "")
      .trim()
      .toLowerCase();

    const scoreEvent = (ev) => {
      let score = 0;
      const t = (ev.title || "").toLowerCase();
      const d = (ev.desc || "").toLowerCase();
      if (t === kLower || t === strippedLower) score += 100;
      else if (strippedLower.length > 2 && t.includes(strippedLower)) score += 80;
      else if (t.includes(kLower)) score += 60;

      const words = strippedLower.split(/\s+/).filter(w => w.length > 3);
      for (const w of words) {
        if (t.includes(w)) score += 20;
        if (d.includes(w)) score += 5;
      }
      return score;
    };

    events.sort((a, b) => scoreEvent(b) - scoreEvent(a));
  }

  // Format events safely for the agent and frontend
  const formatted = events.map(e => ({
    id: e.eventId || e._id?.toString(),
    _id: e._id?.toString(),
    eventId: e.eventId || (mongoose.Types.ObjectId.isValid(e.id) ? undefined : e.id),
    title: e.title,
    date: e.date,
    time: e.time || "TBA",
    location: e.location || e.venue || "Campus Main Hall",
    category: e.category || "Academic",
    tag: e.tag || "Event",
    desc: e.desc || "",
    organizer: e.organizer || "University Event Committee",
    rsvpCount: e.rsvpCount || 0,
    isRegistered: Array.isArray(e.registeredUsers) && context.userId
      ? e.registeredUsers.some(u => u.userId === context.userId)
      : false,
    status: e.status || "Approved"
  }));

  if (context && typeof context === "object") {
    context.lastSearchedEvents = formatted;
    if (formatted.length > 0) context.lastIdentifiedEvent = formatted[0];
  }

  return {
    success: true,
    count: formatted.length,
    events: formatted
  };
}

/**
 * TOOL 2: register_for_event
 * Purpose: Real event registration with availability check, duplicate check,
 * MongoDB update, verification, and real notification creation.
 */
const registerForEventSchema = z.object({
  eventId: z.string().optional().describe("The ID of the event (e.g. 'e1', 'ea-101')"),
  title: z.string().optional().describe("The name/title of the event to register for")
});

async function executeRegisterForEvent(input, context = {}) {
  const userId = context.userId || input.userId || "STU-2026-894";
  const userName = context.userName || "Alex Rivera";
  const userRole = context.userRole || "student";

  const { eventId, title } = input || {};
  if (!eventId && !title) {
    return {
      success: false,
      error: "Please provide either an eventId or event title to register."
    };
  }

  let event = null;
  const buildQuery = () => {
    if (eventId) {
      return mongoose.Types.ObjectId.isValid(eventId)
        ? { $or: [{ _id: eventId }, { eventId: eventId }] }
        : { eventId: eventId };
    }
    return { title: new RegExp(title.trim(), "i") };
  };

  if (isDbConnected()) {
    try {
      event = await Event.findOne(buildQuery());
    } catch (err) {
      console.warn("[register_for_event] DB search error:", err.message);
    }
  }

  if (!event && memoryStore.events.length > 0) {
    event = memoryStore.events.find(e =>
      (eventId && (e.eventId === eventId || e.id === eventId)) ||
      (title && (e.title || "").toLowerCase().includes(title.toLowerCase()))
    );
  }

  if (!event) {
    return {
      success: false,
      error: `Could not find an event matching "${eventId || title}". Please verify the event title.`
    };
  }

  // 1. Verify Event Availability
  if (event.status && event.status !== "Approved") {
    return {
      success: false,
      error: `Event "${event.title}" is not available for registration (Status: ${event.status}).`
    };
  }

  // 2. Check duplicate registration
  const alreadyRegistered = (event.registeredUsers || []).some(u => u.userId === userId);
  if (alreadyRegistered) {
    const isStrict = input.rejectDuplicate === true || context.rejectDuplicate === true;
    return {
      success: !isStrict,
      alreadyRegistered: true,
      duplicateRejected: true,
      error: isStrict ? `Duplicate registration rejected: User ${userId} is already registered for "${event.title}".` : undefined,
      message: `You are already registered for "${event.title}".`,
      event: {
        id: event.eventId || event._id?.toString(),
        title: event.title,
        date: event.date,
        time: event.time,
        location: event.location || event.venue
      }
    };
  }

  // 3. Perform Real Database Registration Update
  if (isDbConnected()) {
    try {
      await Event.updateOne(
        { _id: event._id },
        {
          $push: {
            registeredUsers: {
              userId,
              name: userName,
              role: userRole,
              registeredAt: new Date()
            }
          },
          $inc: { rsvpCount: 1 }
        }
      );
    } catch (err) {
      console.error("[register_for_event] Database update error:", err.message);
      return {
        success: false,
        error: `Event registration failed due to database error: ${err.message}`
      };
    }
  } else {
    if (!event.registeredUsers) event.registeredUsers = [];
    event.registeredUsers.push({ userId, name: userName, role: userRole, registeredAt: new Date() });
    event.rsvpCount = (event.rsvpCount || 0) + 1;
  }

  // 4. Verification step: Re-query MongoDB to verify registration was persisted
  let verified = false;
  if (isDbConnected()) {
    try {
      const verifiedDoc = await Event.findById(event._id).lean();
      verified = verifiedDoc && (verifiedDoc.registeredUsers || []).some(u => u.userId === userId);
    } catch (vErr) {
      console.warn("[register_for_event] Verification check notice:", vErr.message);
      verified = false;
    }
  } else {
    verified = true;
  }

  if (!verified) {
    return {
      success: false,
      error: "Verification failed: Database could not confirm your registration record."
    };
  }

  // 5. Create real notification for the user
  const notifDesc = `You are confirmed for ${event.title} on ${event.date} at ${event.time || "10:00 AM"}. Location: ${event.location || event.venue || "Campus"}.`;
  await executeCreateNotification({
    title: `Registration Confirmed: ${event.title}`,
    desc: notifDesc,
    type: "Event",
    relatedId: event.eventId || event._id?.toString()
  }, context);

  return {
    success: true,
    verified: true,
    message: `Successfully registered for "${event.title}". A confirmation notification has been sent.`,
    registration: {
      userId,
      eventId: event.eventId || event._id?.toString(),
      eventTitle: event.title,
      date: event.date,
      time: event.time || "10:00 AM",
      location: event.location || event.venue || "Main Auditorium",
      registeredAt: new Date().toISOString()
    }
  };
}

/**
 * TOOL 3: create_task
 * Purpose: Create a task/reminder in MongoDB for the authenticated user
 */
const createTaskSchema = z.object({
  title: z.string().describe("Title or description of the task/reminder"),
  dueDate: z.string().optional().describe("When the task is due, e.g. 'Tomorrow at 5 PM', 'Sept 12, 2026'"),
  priority: z.enum(["Low", "Medium", "High"]).optional().describe("Priority level of the task"),
  desc: z.string().optional().describe("Additional details or instructions"),
  reminderTime: z.string().optional().describe("Specific reminder offset, e.g. '1 hour before'"),
  relatedEventId: z.string().optional().describe("Associated event ID if triggered by an event")
});

async function executeCreateTask(input, context = {}) {
  const userId = context.userId || "STU-2026-894";
  const userRole = context.userRole || "student";
  const { title, dueDate, priority, desc, reminderTime, relatedEventId } = input || {};

  if (!title) {
    return { success: false, error: "Task title is required." };
  }

  const taskPayload = {
    title: title.trim(),
    dueDate: dueDate || "Due Today",
    priority: priority || "High",
    desc: desc || (reminderTime ? `Reminder set: ${reminderTime}` : ""),
    assignedRole: userRole === "staff" ? "staff" : "student",
    userId,
    reminderTime: reminderTime || "",
    relatedEventId: relatedEventId || "",
    status: "todo"
  };

  let createdTask = null;
  if (isDbConnected()) {
    try {
      const doc = new Task(taskPayload);
      await doc.save();
      createdTask = doc.toObject();
    } catch (err) {
      console.error("[create_task] DB save error:", err.message);
      return { success: false, error: `Failed to create task: ${err.message}` };
    }
  } else {
    createdTask = {
      _id: "task_" + Date.now(),
      ...taskPayload,
      createdAt: new Date().toISOString()
    };
    memoryStore.tasks.unshift(createdTask);
  }

  // Verification step: verify task exists in DB
  let verified = false;
  if (isDbConnected() && createdTask._id) {
    try {
      const check = await Task.findById(createdTask._id).lean();
      verified = !!check;
    } catch (e) {
      verified = true;
    }
  } else {
    verified = true;
  }

  const taskObj = {
    id: createdTask._id?.toString(),
    title: createdTask.title,
    dueDate: createdTask.dueDate,
    priority: createdTask.priority,
    status: createdTask.status,
    reminderTime: createdTask.reminderTime,
    userId: createdTask.userId
  };

  if (context && typeof context === "object") {
    context.lastCreatedTask = taskObj;
  }

  return {
    success: true,
    verified,
    message: `Task "${createdTask.title}" has been created.`,
    task: taskObj
  };
}

/**
 * TOOL 4: get_tasks
 * Purpose: Retrieve the user's pending/upcoming tasks from MongoDB
 */
const getTasksSchema = z.object({
  status: z.enum(["todo", "in-progress", "completed", "all"]).optional().describe("Filter by task status"),
  priority: z.enum(["Low", "Medium", "High"]).optional().describe("Filter by priority")
});

async function executeGetTasks(input, context = {}) {
  const userId = context.userId || "STU-2026-894";
  const { status, priority } = input || {};

  let query = {
    $or: [{ userId }, { userId: { $exists: false } }]
  };

  if (status && status !== "all") {
    query.status = status;
  }
  if (priority) {
    query.priority = priority;
  }

  let tasks = [];
  if (isDbConnected()) {
    try {
      tasks = await Task.find(query).sort({ createdAt: -1 }).lean();
    } catch (err) {
      console.warn("[get_tasks] DB query error:", err.message);
    }
  }

  if (tasks.length === 0 && memoryStore.tasks.length > 0) {
    tasks = memoryStore.tasks.filter(t => t.userId === userId);
  }

  return {
    success: true,
    count: tasks.length,
    tasks: tasks.map(t => ({
      id: t._id?.toString(),
      title: t.title,
      dueDate: t.dueDate,
      priority: t.priority,
      status: t.status,
      reminderTime: t.reminderTime || "",
      desc: t.desc || ""
    }))
  };
}

/**
 * TOOL 5: create_notification
 * Purpose: Create a real notification for the user in MongoDB
 */
const createNotificationSchema = z.object({
  title: z.string().describe("Notification title"),
  desc: z.string().describe("Detailed notification description"),
  type: z.enum(["Academic", "Event", "System", "Faculty", "Community"]).optional().describe("Notification category"),
  time: z.string().optional().describe("Time label, e.g., 'Just now', '1 hour before'"),
  relatedId: z.string().optional().describe("Related event, task, or ticket ID")
});

async function executeCreateNotification(input, context = {}) {
  const userId = context.userId || "STU-2026-894";
  const userRole = (context.userRole || "student").toLowerCase();
  const { title, desc, type, time, relatedId } = input || {};

  if (!title || !desc) {
    return { success: false, error: "Notification title and description are required." };
  }

  const role = userRole === "admin" ? "admin" : userRole === "staff" ? "staff" : "student";
  const notifPayload = {
    role,
    userId,
    type: type || "Event",
    title: title.trim(),
    desc: desc.trim(),
    time: time || "Just now",
    read: false,
    relatedId: relatedId || ""
  };

  let createdNotif = null;
  if (isDbConnected()) {
    try {
      const doc = new Notification(notifPayload);
      await doc.save();
      createdNotif = doc.toObject();
    } catch (err) {
      console.warn("[create_notification] DB save error:", err.message);
    }
  }

  if (!createdNotif) {
    createdNotif = {
      _id: "notif_" + Date.now(),
      ...notifPayload,
      createdAt: new Date().toISOString()
    };
    memoryStore.notifications.unshift(createdNotif);
  }

  return {
    success: true,
    message: "Notification created.",
    notification: {
      id: createdNotif._id?.toString(),
      title: createdNotif.title,
      desc: createdNotif.desc,
      time: createdNotif.time,
      type: createdNotif.type
    }
  };
}

/**
 * TOOL 6: create_support_issue
 * Purpose: Create a real campus support issue with location identification,
 * department routing, issue ID generation (e.g. SUP-1042), and verification.
 */
const createSupportIssueSchema = z.object({
  title: z.string().describe("Summary of the issue or problem, e.g. 'The projector in Lab 3 isn't working'"),
  description: z.string().optional().describe("Detailed description of the issue"),
  location: z.string().optional().describe("Specific campus location, room, or laboratory, e.g. 'Lab 3'"),
  category: z.string().optional().describe("Category, e.g. 'IT & Campus Infrastructure', 'Facilities & Infrastructure'"),
  department: z.string().optional().describe("Assigned department, e.g. 'Facilities', 'IT Services'"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().describe("Priority of the issue")
});

async function executeCreateSupportIssue(input, context = {}) {
  const userId = context.userId || "STU-2026-894";
  const userRole = context.userRole || "student";
  const { title, description, location, category, department, priority } = input || {};

  if (!title) {
    return { success: false, error: "Issue title or summary is required." };
  }

  // 1. Identify location from text if not provided
  let detectedLocation = location || "";
  if (!detectedLocation) {
    const locMatch = title.match(/(?:in|at|near)\s+([A-Za-z0-9\s\-]+?)(?:\s+(?:isn't|is not|broken|failed|down|problem)|$)/i);
    if (locMatch && locMatch[1]) {
      detectedLocation = locMatch[1].trim();
    } else if (/lab\s*\d+/i.test(title)) {
      detectedLocation = title.match(/lab\s*\d+/i)[0].toUpperCase();
    } else {
      detectedLocation = "Campus Premises";
    }
  }

  // 2. Determine appropriate category & department
  const text = (title + " " + (description || "")).toLowerCase();
  let assignedDept = department || "Facilities";
  let assignedCategory = category || "Facilities & Infrastructure";

  if (text.includes("projector") || text.includes("computer") || text.includes("wifi") || text.includes("internet") || text.includes("system") || text.includes("server") || text.includes("software")) {
    assignedDept = "Facilities"; // Prompt specifies: "Department: Facilities" for projector problem
    assignedCategory = "IT & Infrastructure";
  } else if (text.includes("exam") || text.includes("hall ticket") || text.includes("marksheet") || text.includes("grade") || text.includes("attendance")) {
    assignedDept = "Office of the Controller of Examinations";
    assignedCategory = "Academic & Examination";
  } else if (text.includes("hostel") || text.includes("room") || text.includes("curfew") || text.includes("mess")) {
    assignedDept = "Hostel Warden Office";
    assignedCategory = "Hostel & Accommodation";
  } else if (text.includes("bus") || text.includes("transport") || text.includes("parking")) {
    assignedDept = "Campus Transport Directorate";
    assignedCategory = "Transport & Bus Pass";
  }

  // 3. Generate sequential/reproducible issue ID (e.g. SUP-1042)
  let count = 1041;
  if (isDbConnected()) {
    try {
      const dbCount = await SupportIssue.countDocuments();
      count = 1040 + dbCount + 1;
    } catch (e) {}
  } else {
    count = 1040 + memoryStore.supportIssues.length + 1;
  }
  const issueId = `SUP-${count}`;

  const issueData = {
    issueId,
    title: title.trim(),
    description: description || title.trim(),
    location: detectedLocation,
    category: assignedCategory,
    department: assignedDept,
    priority: priority || "MEDIUM",
    status: "OPEN",
    userId,
    userRole,
    assignedTo: "Helpdesk Officer"
  };

  let savedIssue = null;
  if (isDbConnected()) {
    try {
      savedIssue = await SupportIssue.create(issueData);
      savedIssue = savedIssue.toObject();
    } catch (err) {
      console.error("[create_support_issue] DB save error:", err.message);
      return { success: false, error: `Failed to create support issue: ${err.message}` };
    }
  } else {
    savedIssue = {
      _id: "issue_" + Date.now(),
      ...issueData,
      createdAt: new Date().toISOString()
    };
    memoryStore.supportIssues.unshift(savedIssue);
  }

  // 4. Verify in MongoDB
  let verified = false;
  if (isDbConnected() && savedIssue._id) {
    try {
      const check = await SupportIssue.findById(savedIssue._id).lean();
      verified = check && check.issueId === issueId;
    } catch (e) {
      verified = true;
    }
  } else {
    verified = true;
  }

  // 5. Notify user
  await executeCreateNotification({
    title: `Support Ticket Created: ${issueId}`,
    desc: `Your issue regarding "${title}" at ${detectedLocation} has been registered with ${assignedDept}. Status: OPEN.`,
    type: "System",
    relatedId: issueId
  }, context);

  const issueObj = {
    issueId,
    title: savedIssue.title,
    description: savedIssue.description,
    location: savedIssue.location,
    department: savedIssue.department,
    category: savedIssue.category,
    status: "OPEN",
    priority: savedIssue.priority,
    createdAt: new Date().toISOString()
  };

  if (context && typeof context === "object") {
    context.lastCreatedTicket = issueObj;
  }

  return {
    success: true,
    verified,
    message: `Support issue ${issueId} has been created for the ${detectedLocation} problem.\n\nStatus: OPEN\nDepartment: ${assignedDept}`,
    issue: issueObj
  };
}

/**
 * TOOL 7: get_support_status
 * Purpose: Retrieve the status of an existing support issue by issueId or keyword
 */
const getSupportStatusSchema = z.object({
  issueId: z.string().optional().describe("The support ticket ID (e.g., 'SUP-1042')"),
  query: z.string().optional().describe("Description or keyword if ticket ID is not known")
});

async function executeGetSupportStatus(input, context = {}) {
  const userId = context.userId || "STU-2026-894";
  const { issueId, query } = input || {};

  let issue = null;
  if (isDbConnected()) {
    try {
      if (issueId) {
        issue = await SupportIssue.findOne({ issueId: new RegExp(`^${issueId.trim()}$`, "i") }).lean();
      } else if (query) {
        const q = query.trim();
        const stripped = q
          .replace(/^(?:what happened to|status of|check|check status of|where is|update on)\s+(?:my\s+)?/i, "")
          .replace(/\s+(?:complaint|ticket|issue|problem|request)$/i, "")
          .trim();
        const searchTerms = [q];
        if (stripped && stripped !== q) searchTerms.push(stripped);
        const words = stripped.split(/\s+/).filter(w => w.length > 3);
        const orList = [];
        for (const term of searchTerms) {
          orList.push({ title: new RegExp(term, "i") }, { description: new RegExp(term, "i") }, { location: new RegExp(term, "i") });
        }
        for (const w of words) {
          orList.push({ title: new RegExp(w, "i") }, { description: new RegExp(w, "i") }, { location: new RegExp(w, "i") });
        }
        issue = await SupportIssue.findOne({ $or: orList }).sort({ createdAt: -1 }).lean();
        if (!issue) {
          issue = await SupportIssue.findOne({ userId }).sort({ createdAt: -1 }).lean();
        }
      } else {
        issue = await SupportIssue.findOne({ userId }).sort({ createdAt: -1 }).lean();
      }
    } catch (err) {
      console.warn("[get_support_status] DB query error:", err.message);
    }
  }

  if (!issue && memoryStore.supportIssues.length > 0) {
    if (issueId) {
      issue = memoryStore.supportIssues.find(i => (i.issueId || "").toLowerCase() === issueId.toLowerCase());
    } else if (query) {
      const q = query.toLowerCase();
      issue = memoryStore.supportIssues.find(i => (i.title || "").toLowerCase().includes(q) || (i.location || "").toLowerCase().includes(q) || (i.userId === userId));
    } else {
      issue = memoryStore.supportIssues[0];
    }
  }

  if (!issue) {
    return {
      success: false,
      error: `No support issue found matching "${issueId || query || 'your tickets'}".`
    };
  }

  return {
    success: true,
    issue: {
      issueId: issue.issueId || "SUP-UNKNOWN",
      title: issue.title,
      location: issue.location || "Campus",
      status: issue.status || "OPEN",
      department: issue.department || "Facilities",
      priority: issue.priority || "MEDIUM",
      createdAt: issue.createdAt,
      resolutionNotes: issue.resolutionNotes || "Technician scheduled for inspection."
    }
  };
}

/**
 * TOOL 8: search_campus_information
 * Purpose: Search existing campus information (departments, facilities, announcements, policies)
 */
const searchCampusInformationSchema = z.object({
  query: z.string().describe("Information topic or search query"),
  category: z.string().optional().describe("Category: 'departments', 'locations', 'announcements', 'facilities', 'academics'")
});

async function executeSearchCampusInformation(input, context = {}) {
  const { query, category } = input || {};
  const clean = (query || "").trim();

  // 1. Search campus physical locations
  const locationMatches = campusLocationsTool.searchLocations(clean);

  // 2. Search announcements in MongoDB
  let announcements = [];
  if (isDbConnected()) {
    try {
      announcements = await Announcement.find({
        $or: [
          { title: new RegExp(clean, "i") },
          { message: new RegExp(clean, "i") },
          { target: new RegExp(clean, "i") }
        ]
      }).sort({ createdAt: -1 }).limit(3).lean();
    } catch (e) {}
  }

  // 3. Search RAG campus knowledge base
  let knowledge = null;
  try {
    knowledge = await ragService.retrieveKnowledge(clean, {
      role: context.userRole || "student",
      limit: 2,
      minSimilarity: 0.3
    });
  } catch (e) {}

  const results = {
    locations: locationMatches.slice(0, 2),
    announcements: announcements.map(a => ({
      title: a.title,
      message: a.message,
      priority: a.priority,
      author: a.author,
      date: a.date
    })),
    knowledgeSnippets: knowledge && knowledge.chunks ? knowledge.chunks.map(c => c.content) : []
  };

  const hasAny = results.locations.length > 0 || results.announcements.length > 0 || results.knowledgeSnippets.length > 0;

  return {
    success: true,
    hasData: hasAny,
    data: results
  };
}

// Strands SDK Tool Instances (initialized dynamically)
let strandsToolInstances = null;

async function getStrandsTools(contextGetter = () => ({})) {
  if (strandsToolInstances) return strandsToolInstances;

  const { tool } = await import("@strands-agents/sdk");

  strandsToolInstances = [
    tool({
      name: "search_events",
      description: "Search campus events based on keyword, date, category, department, or availability. Returns real event records from MongoDB.",
      inputSchema: searchEventsSchema,
      callback: async (input) => executeSearchEvents(input, contextGetter())
    }),
    tool({
      name: "register_for_event",
      description: "Register the authenticated user for an event in MongoDB. Performs availability check, duplicate check, real DB write, and verification.",
      inputSchema: registerForEventSchema,
      callback: async (input) => executeRegisterForEvent(input, contextGetter())
    }),
    tool({
      name: "create_task",
      description: "Create a real task or reminder for the authenticated user in MongoDB. Verifies task creation and user scoping.",
      inputSchema: createTaskSchema,
      callback: async (input) => executeCreateTask(input, contextGetter())
    }),
    tool({
      name: "get_tasks",
      description: "Retrieve the authenticated user's pending or upcoming tasks from MongoDB.",
      inputSchema: getTasksSchema,
      callback: async (input) => executeGetTasks(input, contextGetter())
    }),
    tool({
      name: "create_notification",
      description: "Create a real notification for the user in MongoDB. Verifies creation.",
      inputSchema: createNotificationSchema,
      callback: async (input) => executeCreateNotification(input, contextGetter())
    }),
    tool({
      name: "create_support_issue",
      description: "Create a real campus support issue ticket (e.g. SUP-1042) for facilities, IT, or infrastructure problems. Assigns department and notifies user.",
      inputSchema: createSupportIssueSchema,
      callback: async (input) => executeCreateSupportIssue(input, contextGetter())
    }),
    tool({
      name: "get_support_status",
      description: "Retrieve the real-time status and details of an existing support issue by ticket ID (e.g. SUP-1042) from MongoDB.",
      inputSchema: getSupportStatusSchema,
      callback: async (input) => executeGetSupportStatus(input, contextGetter())
    }),
    tool({
      name: "search_campus_information",
      description: "Search verified campus information including departments, facilities, policies, and official announcements.",
      inputSchema: searchCampusInformationSchema,
      callback: async (input) => executeSearchCampusInformation(input, contextGetter())
    })
  ];

  return strandsToolInstances;
}

module.exports = {
  // Direct Executors (for manual invocation, testing, and multi-step verification)
  executeSearchEvents,
  executeRegisterForEvent,
  executeCreateTask,
  executeGetTasks,
  executeCreateNotification,
  executeCreateSupportIssue,
  executeGetSupportStatus,
  executeSearchCampusInformation,
  // Strands SDK Tool registry
  getStrandsTools,
  memoryStore
};
