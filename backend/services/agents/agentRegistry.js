/**
 * CAMPUSNOVA MULTI-AGENT REGISTRY & SERVER ROUTER
 * Securely routes authenticated user requests to the appropriate Strands Agent:
 * - Student       -> ASTRA (AstraStudentAgent)
 * - Faculty/Staff -> ORION (OrionFacultyAgent)
 * - Admin         -> ATLAS (AtlasAdminAgent)
 *
 * Security Guarantee:
 * - The router strictly uses verified user session role (req.authenticatedUser.role).
 * - Client-supplied role bodies (req.body.role) and unverified headers (x-user-role)
 *   are NEVER trusted for agent selection.
 */

const astraStudentAgent = require("./AstraStudentAgent");
const orionFacultyAgent = require("./OrionFacultyAgent");
const atlasAdminAgent = require("./AtlasAdminAgent");
const AgentExecution = require("../../models/AgentExecution");
const mongoose = require("mongoose");

const isDbConnected = () => mongoose.connection.readyState === 1;

class AgentRegistry {
  constructor() {
    this.agents = {
      astra: astraStudentAgent,
      orion: orionFacultyAgent,
      atlas: atlasAdminAgent
    };
  }

  /**
   * Resolves the proper agent instance strictly from authenticated user credentials
   * @param {Object} user Authenticated user payload from HMAC-SHA256 session
   */
  getAgentForUser(user) {
    if (!user || !user.role) {
      return this.agents.astra;
    }

    const role = (user.role || "").toLowerCase().trim();

    if (role === "admin") {
      return this.agents.atlas;
    }

    if (role === "staff" || role === "faculty") {
      return this.agents.orion;
    }

    return this.agents.astra;
  }

  /**
   * Get specific agent by name with role validation
   */
  getAgentByName(name, user = {}) {
    const key = (name || "").toLowerCase().trim();
    const agent = this.agents[key];
    if (!agent) return null;

    // Security check for Atlas
    if (agent.name === "Atlas" && (user.role || "").toLowerCase() !== "admin") {
      return null;
    }

    return agent;
  }

  /**
   * Routes a chat message to the proper agent based strictly on verified user role
   */
  async processChat({ message, user, conversationId, history = [] }) {
    const agent = this.getAgentForUser(user);
    return await agent.process({
      message,
      userId: user.id,
      role: user.role,
      conversationId,
      history
    });
  }

  /**
   * Approves a pending consequential action across agents
   */
  async approve({ approvalId, user }) {
    // Check which agent has this approval
    for (const agent of Object.values(this.agents)) {
      if (agent.pendingApprovals.has(approvalId)) {
        return await agent.approve({
          approvalId,
          userId: user.id,
          userRole: user.role
        });
      }
    }

    // Fallback check in astra by default
    return await this.agents.astra.approve({
      approvalId,
      userId: user.id,
      userRole: user.role
    });
  }

  /**
   * Rejects a pending consequential action across agents
   */
  async reject({ approvalId, user }) {
    for (const agent of Object.values(this.agents)) {
      if (agent.pendingApprovals.has(approvalId)) {
        return await agent.reject({
          approvalId,
          userId: user.id
        });
      }
    }

    return await this.agents.astra.reject({
      approvalId,
      userId: user.id
    });
  }

  /**
   * Returns recent agent execution traces across all three agents
   */
  async getRecentExecutions(limit = 30, agentFilter = null) {
    if (isDbConnected()) {
      try {
        const query = {};
        if (agentFilter) {
          query.agentName = new RegExp(`^${agentFilter}$`, "i");
        }
        return await AgentExecution.find(query).sort({ createdAt: -1 }).limit(limit).lean();
      } catch (err) {
        console.warn("[AgentRegistry] Failed to fetch execution traces:", err.message);
        return [];
      }
    }
    return [];
  }
}

module.exports = new AgentRegistry();
