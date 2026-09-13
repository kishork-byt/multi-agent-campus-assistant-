/**
 * ATLAS - Administrative Specialist Agent
 * Focus: Administrative procedures, student service request management,
 * approvals, certificates, department oversight, policy governance, and staff workflows.
 */

const Agent = require("./Agent");
const ragService = require("../ragService");
const serviceRequestTool = require("../tools/serviceRequestTool");
const campusLocationsTool = require("../tools/campusLocationsTool");

class AtlasAgent extends Agent {
  constructor() {
    super({
      id: "agent-atlas",
      name: "Atlas",
      role: "Admin",
      systemPrompt: `You are Atlas, the dedicated Administrative AI Specialist for the CampusNova Smart Campus platform.
Your objective is to provide institutional administrators, deans, and registrar officials with authoritative intelligence on:
- Administrative workflows, procurement thresholds, and budgetary approvals
- Student & Faculty service requests (resolution SLAs, department routing, ticket statuses)
- Certificate issuance governance, official transcript authentications
- Knowledge Base governance (uploading policies, indexing documents, vector chunking)
- Campus announcements, emergency alerts, and venue reservations
- Campus infrastructure statistics and institutional analytics

CRITICAL GROUNDING RULES:
1. Ground administrative responses in official university SOPs and service request metrics.
2. Provide concrete actionable summaries (e.g. number of pending requests, resolution SLA deadlines).
3. If managing service tickets, state their exact ticket IDs, categories, and assigned departments.
4. Format responses cleanly with executive summaries, metrics tables, and bullet points.`,
      allowedTools: ["rag_knowledge_search", "service_requests_manage", "campus_locations", "system_status_and_stats"],
      knowledgeScope: "Comprehensive institutional administration, governance, and workflows",
      permissions: ["admin:full", "service_request:manage", "knowledge_base:manage"]
    });
  }

  async process({ message, userId, role = "admin", history = [] }) {
    const lower = message.toLowerCase();

    // 1. Check for Service Request Inquiries (e.g. "Show pending service requests", "tickets")
    const isServiceReqQuery = lower.includes("service request") || lower.includes("ticket") || lower.includes("pending requests") || lower.includes("complaints");

    let serviceReqSummary = "";
    let tickets = [];
    if (isServiceReqQuery) {
      tickets = await serviceRequestTool.getTickets({ role: "admin" });
      const openTickets = tickets.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS");
      serviceReqSummary = `### Current Helpdesk Service Requests Summary\n- **Total Tickets on Record**: ${tickets.length}\n- **Open / In-Progress Tickets**: ${openTickets.length}\n\n` +
        openTickets.slice(0, 5).map(t => `- **[${t.ticketId}]** ${t.subject} (${t.category}) • Priority: \`${t.priority}\` • Status: \`${t.status}\` • Assigned: ${t.assignedDepartment}`).join("\n");
    }

    // 2. Perform Role-Governed RAG Knowledge Retrieval for Admin
    const ragResult = await ragService.retrieveKnowledge(message, {
      role: "admin",
      limit: 3,
      minSimilarity: 0.28
    });

    const hasRagContext = !!ragResult.context.trim();
    const hasTicketContext = !!serviceReqSummary.trim();

    // 3. Formulate Prompt with Grounded Context
    let promptWithContext = "";
    if (hasTicketContext && hasRagContext) {
      promptWithContext = `Admin Query: "${message}"\n\nLive Service Requests in Database:\n${serviceReqSummary}\n\nOfficial Administrative Policies:\n${ragResult.context}\n\nPlease provide a clear administrative report based on the official records above.`;
    } else if (hasTicketContext) {
      promptWithContext = `Admin Query: "${message}"\n\nLive Service Requests in Database:\n${serviceReqSummary}\n\nPlease summarize the ticket statuses and recommended administrative actions.`;
    } else if (hasRagContext) {
      promptWithContext = `Admin Query: "${message}"\n\nRetrieved Administrative Policies:\n${ragResult.context}\n\nPlease synthesize an executive administrative answer based on the official guidelines above.`;
    } else {
      promptWithContext = `Admin Query: "${message}"\n\nPlease provide a structured administrative overview addressing this question. Mention relevant administrative departments and protocols.`;
    }

    // 4. Generate LLM Grounded Answer
    let answer = "";
    try {
      answer = await this.llmProvider.generateResponse({
        prompt: promptWithContext,
        systemPrompt: this.systemPrompt,
        temperature: 0.3
      });
    } catch (err) {
      console.warn("[AtlasAgent] LLM Generation error, using grounded fallback synthesis:", err.message);
      if (hasTicketContext) {
        answer = `${serviceReqSummary}\n\n*Administrators can review and transition tickets in the Service Requests Management portal.*`;
      } else if (hasRagContext) {
        answer = `### Administrative SOP Guidelines\n\n${ragResult.chunks.map(c => c.content).join("\n\n")}`;
      } else {
        answer = "I have analyzed your administrative inquiry. You can review all institutional policies, pending service requests, and uploaded documents in the Admin Portal.";
      }
    }

    // 5. Sources
    const sources = [...ragResult.sources];
    if (hasTicketContext) {
      sources.unshift({
        documentId: "SERVICE-REQUESTS-DB",
        title: "Campus Helpdesk Service Requests Ledger",
        category: "Administrative Workflows",
        source: "CampusNova Ticket Database",
        department: "Helpdesk Administration",
        excerpt: `Active tickets ledger: ${tickets.length} total tickets recorded.`
      });
    }

    const confidence = (hasRagContext || hasTicketContext) ? Math.max(0.88, ragResult.confidence) : 0.70;

    return this.formatResponse({
      answer,
      sources,
      confidence,
      requiresHumanSupport: false,
      toolOutputs: tickets.map(t => ({ tool: "service_requests", ticketId: t.ticketId, status: t.status }))
    });
  }
}

module.exports = new AtlasAgent();
