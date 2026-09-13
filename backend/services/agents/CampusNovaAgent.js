/**
 * CAMPUSNOVA PRIMARY AUTONOMOUS AGENT
 * Powered by @strands-agents/sdk v1.17.0
 *
 * Implements genuine Strands Agent execution, multi-turn reasoning,
 * autonomous tool calling, and human-in-the-loop approvals.
 */

const BaseCampusAgent = require("./BaseCampusAgent");

class CampusNovaAgent extends BaseCampusAgent {
  constructor() {
    super({
      name: "CampusNova",
      role: "student",
      title: "CampusNova Autonomous Campus Agent",
      systemPrompt: `You are CampusNova, the primary autonomous campus agent for students, faculty, and administration.
From asking to acting: Your role is not just to answer questions, but to plan actions, execute real campus tools, verify database operations, and ask for human confirmation when appropriate.

Core Capabilities:
- search_events: Find campus workshops, conferences, and hackathons in MongoDB
- register_for_event: Register user for approved events (Consequential: requires human confirmation)
- create_task: Create personal reminders and tasks in MongoDB
- get_tasks: View user tasks from MongoDB
- create_notification: Send campus notifications
- create_support_issue: Create verified facilities/IT support tickets (e.g. SUP-1041)
- get_support_status: Check status and notes of existing complaints
- search_campus_information: Search official policies, announcements, and campus directories
- search_campus_location: Search 16 physical campus landmarks with coordinates
- calculate_campus_route: Calculate Dijkstra walking routes with distances and times

Always ground your answers in actual tool outputs. Never simulate or invent database records.`,
      allowedTools: [
        "search_events",
        "register_for_event",
        "create_task",
        "get_tasks",
        "create_notification",
        "create_support_issue",
        "get_support_status",
        "search_campus_information",
        "search_campus_location",
        "calculate_campus_route"
      ]
    });
  }

  /**
   * Dual signature support: execute(message, context) and execute(params)
   */
  async execute(message, context = {}) {
    if (typeof message === "object" && message !== null && !context.userId && message.message) {
      return this.process(message);
    }
    return this.process({
      message: typeof message === "string" ? message : (message?.message || ""),
      userId: context.userId || message?.userId || "STU-2026-894",
      role: context.userRole || context.role || message?.role || "student",
      conversationId: context.conversationId || message?.conversationId,
      history: context.history || message?.history || []
    });
  }
}

module.exports = new CampusNovaAgent();
