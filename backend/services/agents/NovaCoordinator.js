/**
 * NOVA - Central Coordinator Agent
 * Responsibilities:
 * 1. Receives every query
 * 2. Classifies user role and intent
 * 3. Enforces authorization guardrails (rejects unauthorized access attempts)
 * 4. Routes query to specialist agent (Astra, Orion, or Atlas)
 * 5. Handles general campus greetings & introductions directly
 * 6. Detects uncertainty and triggers human escalation
 * 7. Logs execution traces to AgentLog for viva and audit transparency
 */

const Agent = require("./Agent");
const astraAgent = require("./AstraAgent");
const orionAgent = require("./OrionAgent");
const atlasAgent = require("./AtlasAgent");
const AgentLog = require("../../models/AgentLog");
const mongoose = require("mongoose");

const isDbConnected = () => mongoose.connection.readyState === 1;
const inMemoryLogs = [];

class NovaCoordinator extends Agent {
  constructor() {
    super({
      id: "agent-nova",
      name: "Nova",
      role: "Coordinator",
      systemPrompt: `You are Nova, the Central AI Coordinator for the CampusNova Smart Campus Helpdesk.
Your role is to orchestrate specialized agents:
- Astra (Student Specialist)
- Orion (Faculty & Staff Specialist)
- Atlas (Administrative Specialist)
You determine query intent, enforce security and role authorization, route requests, and ensure grounded answers.`,
      allowedTools: ["*"],
      knowledgeScope: "All campus domains and routing governance",
      permissions: ["coordinator:full"]
    });

    this.specialists = {
      student: astraAgent,
      staff: orionAgent,
      faculty: orionAgent,
      admin: atlasAgent
    };
  }

  /**
   * Analyzes query text and role context to classify intent and target agent
   */
  classifyIntent(message, userRole = "student") {
    const text = (message || "").toLowerCase().trim();
    const normRole = userRole.toLowerCase();

    // 1. Simple Greetings
    if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)(\s+(nova|there|campusnova|assistant))?[\s!.]*$/i.test(text)) {
      return {
        intent: "CAMPUS_GREETING",
        targetAgent: "Nova",
        routingRationale: "Standard campus greeting detected. Nova handles greeting directly."
      };
    }

    // 2. Explicit Human Escalation Request
    if (text.includes("human support") || text.includes("talk to a person") || text.includes("raise a ticket") || text.includes("file a complaint") || text.includes("report an issue")) {
      return {
        intent: "HUMAN_ESCALATION_REQUEST",
        targetAgent: normRole === "admin" ? "Atlas" : normRole === "staff" ? "Orion" : "Astra",
        routingRationale: "User explicitly requested human assistance or ticket creation."
      };
    }

    // 3. Security Check: Restricted Admin Inquiries by Students
    const restrictedAdminKeywords = ["staff salary", "faculty salary", "confidential budget", "disciplinary action on faculty", "admin credentials", "system audit keys", "confidential staff file"];
    if (normRole === "student" && restrictedAdminKeywords.some(k => text.includes(k))) {
      return {
        intent: "UNAUTHORIZED_ACCESS_ATTEMPT",
        targetAgent: "Nova",
        routingRationale: "Security guardrail triggered: Student attempted to access restricted administrative data."
      };
    }

    // 4. Admin Management Queries
    const adminKeywords = ["pending service request", "pending ticket", "upload policy", "upload document", "budget sanction", "system statistics", "sla deadline", "approval workflow"];
    if (normRole === "admin" || adminKeywords.some(k => text.includes(k))) {
      return {
        intent: "ADMIN_MANAGEMENT",
        targetAgent: "Atlas",
        routingRationale: "Administrative governance query mapped to Atlas (Administrative Specialist)."
      };
    }

    // 5. Faculty Academic Queries
    const facultyKeywords = ["casual leave", "duty leave", "medical leave", "lesson plan", "course handout", "question paper submission", "invigilation", "grade entry", "teaching timetable"];
    if (normRole === "staff" || normRole === "faculty" || facultyKeywords.some(k => text.includes(k))) {
      return {
        intent: "FACULTY_ACADEMIC",
        targetAgent: "Orion",
        routingRationale: "Faculty academic/leave inquiry routed to Orion (Faculty Specialist)."
      };
    }

    // 6. Campus Location Queries
    const locationKeywords = ["where is", "how to reach", "directions to", "building", "which floor", "room number"];
    if (locationKeywords.some(k => text.includes(k))) {
      const target = normRole === "admin" ? "Atlas" : normRole === "staff" ? "Orion" : "Astra";
      return {
        intent: "CAMPUS_LOCATION",
        targetAgent: target,
        routingRationale: `Campus venue inquiry routed to ${target} with campus location tool enabled.`
      };
    }

    // 7. Student Academic & Facilities (Default for student portal)
    return {
      intent: "STUDENT_ACADEMIC",
      targetAgent: normRole === "staff" ? "Orion" : normRole === "admin" ? "Atlas" : "Astra",
      routingRationale: `Routine campus inquiry routed to ${normRole === "staff" ? "Orion" : normRole === "admin" ? "Atlas" : "Astra"} based on user portal session.`
    };
  }

  /**
   * Main entrypoint for processing user messages in the Multi-Agent architecture
   */
  async process({ message, userId = "STU-2026-894", role = "student", history = [], conversationId = `conv_${Date.now()}` }) {
    const normRole = (role || "student").toLowerCase();

    // Step 1: Nova determines intent & selects agent
    const { intent, targetAgent, routingRationale } = this.classifyIntent(message, normRole);

    let result = null;

    // Step 2: Handle greetings directly at Coordinator level
    if (intent === "CAMPUS_GREETING") {
      result = this.formatResponse({
        answer: `Hello! I am **Nova**, the Central AI Coordinator for CampusNova.\n\nI coordinate three specialized campus agents to assist you:\n- **Astra**: For students (academics, exams, attendance, bonafide certificates, hostels, and library)\n- **Orion**: For faculty (leave rules, syllabi, class schedules, and teaching duty)\n- **Atlas**: For administration (service tickets, policy governance, approvals, and announcements)\n\nHow can our multi-agent assistant help you today?`,
        sources: [
          {
            title: "CampusNova Multi-Agent Helpdesk Guide",
            category: "General FAQs",
            source: "CampusNova System Architecture",
            excerpt: "Nova coordinates specialized role-aware AI agents Astra, Orion, and Atlas."
          }
        ],
        confidence: 0.99,
        requiresHumanSupport: false
      });
      result.agent = "Nova";
      result.agentRole = "Coordinator";
    }

    // Step 3: Handle unauthorized cross-role attempts with strict security guardrails
    else if (intent === "UNAUTHORIZED_ACCESS_ATTEMPT") {
      result = this.formatResponse({
        answer: `⚠️ **Authorization Notice**: Access to confidential institutional records, employee compensation, and executive files is strictly restricted to authorized administrative officials.\n\nStudents can query course materials, academic regulations, examination schedules, library timings, and student service requests through **Astra**.`,
        sources: [
          {
            title: "University Data Governance & Privacy Policy",
            category: "Administrative Workflows",
            source: "Institutional Information Security Protocol",
            excerpt: "Confidential staff, payroll, and internal audit files are restricted to administrative authorization tokens."
          }
        ],
        confidence: 1.0,
        requiresHumanSupport: false
      });
      result.agent = "Nova";
      result.agentRole = "Coordinator";
    }

    // Step 4: Route to the designated specialist agent
    else {
      let specialist = this.specialists[normRole] || astraAgent;
      if (targetAgent === "Astra") specialist = astraAgent;
      else if (targetAgent === "Orion") specialist = orionAgent;
      else if (targetAgent === "Atlas") specialist = atlasAgent;

      result = await specialist.process({
        message,
        userId,
        role: normRole,
        history
      });
    }

    // Step 5: If the user requested human escalation, enrich with service request prompt
    if (intent === "HUMAN_ESCALATION_REQUEST") {
      result.requiresHumanSupport = true;
      result.answer += `\n\n---\nWould you like to formally lodge a campus service ticket with the administration? Click **Create Service Request** below to submit your issue.`;
    }

    // Step 6: Log agent execution trace to AgentLog
    await this.logExecution({
      conversationId,
      userId,
      userRole: normRole,
      agentName: result.agent,
      query: message,
      intent,
      routingRationale,
      retrievedDocuments: (result.sources || []).map(s => ({
        documentId: s.documentId || "DOC-REF",
        title: s.title,
        category: s.category,
        similarity: s.similarity || 0.85
      })),
      executionStatus: intent === "UNAUTHORIZED_ACCESS_ATTEMPT" ? "UNAUTHORIZED" : result.requiresHumanSupport ? "ESCALATED" : "SUCCESS",
      confidence: result.confidence,
      requiresHumanSupport: result.requiresHumanSupport,
      responseSnippet: (result.answer || "").substring(0, 200)
    });

    // Step 7: Attach metadata to response for frontend and API
    return {
      answer: result.answer,
      agent: result.agent,
      agentRole: result.agentRole,
      sources: result.sources || [],
      confidence: result.confidence || 0.90,
      conversationId,
      requiresHumanSupport: !!result.requiresHumanSupport,
      routingRationale,
      intent
    };
  }

  /**
   * Persists agent execution trace to database and memory
   */
  async logExecution(logPayload) {
    const logId = `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const fullRecord = { logId, ...logPayload, createdAt: new Date().toISOString() };

    if (isDbConnected()) {
      try {
        await AgentLog.create(fullRecord);
      } catch (err) {
        console.warn("[NovaCoordinator] DB log error:", err.message);
      }
    }

    inMemoryLogs.unshift(fullRecord);
    if (inMemoryLogs.length > 200) inMemoryLogs.pop();
  }

  /**
   * Retrieves recent agent execution logs for Admin inspection and Viva demo
   */
  async getRecentLogs(limit = 30) {
    if (isDbConnected()) {
      try {
        return await AgentLog.find({}).sort({ createdAt: -1 }).limit(limit);
      } catch (err) {
        console.warn("[NovaCoordinator] Fetch logs error:", err.message);
      }
    }
    return inMemoryLogs.slice(0, limit);
  }
}

module.exports = new NovaCoordinator();
