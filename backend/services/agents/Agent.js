/**
 * Reusable Base Agent Interface for CampusNova AI Architecture
 */

const { getActiveLLMProvider } = require("../llm/llmProvider");

class Agent {
  /**
   * @param {Object} options
   * @param {string} options.id Agent identifier
   * @param {string} options.name Agent display name
   * @param {string} options.role Target role ('student' | 'staff' | 'admin' | 'coordinator')
   * @param {string} options.systemPrompt Role-specific system instructions
   * @param {string[]} options.allowedTools Tool identifiers permitted for this agent
   * @param {string} options.knowledgeScope Knowledge boundary description
   * @param {string[]} options.permissions Role authorization tokens
   */
  constructor({ id, name, role, systemPrompt, allowedTools = [], knowledgeScope = "general", permissions = [] }) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.systemPrompt = systemPrompt;
    this.allowedTools = allowedTools;
    this.knowledgeScope = knowledgeScope;
    this.permissions = permissions;
    this.llmProvider = getActiveLLMProvider();
  }

  /**
   * Abstract process method executed by specialist agent
   * @param {Object} context
   * @param {string} context.message User message
   * @param {string} context.userId User ID
   * @param {string} context.role User portal role
   * @param {Array} context.history Prior conversation turns
   * @returns {Promise<Object>} Formatted response object
   */
  async process(context) {
    throw new Error(`process() must be implemented by Agent subclass (${this.name})`);
  }

  /**
   * Helper to check tool permission
   */
  canUseTool(toolName) {
    return this.allowedTools.includes(toolName) || this.allowedTools.includes("*");
  }

  /**
   * Helper to format final agent response payload
   */
  formatResponse({ answer, sources = [], confidence = 0.90, requiresHumanSupport = false, toolOutputs = [] }) {
    return {
      agent: this.name,
      agentId: this.id,
      agentRole: this.role,
      answer,
      sources,
      confidence,
      requiresHumanSupport,
      toolOutputs,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = Agent;
