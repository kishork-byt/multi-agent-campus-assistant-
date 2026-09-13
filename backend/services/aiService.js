const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const campusNovaAgent = require("./agents/CampusNovaAgent");
const AiContextService = require("./aiContextService");

const AiService = {
  /**
   * Role-specific system instructions for the AI Assistant.
   */
  systemInstructions: {
    staff: `You are the official Faculty & Staff AI Assistant for a modern university portal. You assist professors, instructors, and university staff with course development, syllabus design, assignment creation, grading rubrics, student communications, research support, teaching support, quiz generation, lab work guidance, and academic explanations. Provide clear, well-structured, professional, and directly relevant answers.`,
    student: `You are the official Student AI Assistant for a modern university portal. You assist students with course topics, concepts, study strategies, lab assignments, academic questions, schedule, timetable, courses, and attendance. Provide clear, encouraging, educational, and easy-to-understand explanations.`,
    admin: `You are the official University Admin AI Copilot. You assist university administrators with departmental management, policy formulation, faculty analytics, campus operations, and academic governance. Provide concise, professional, data-informed insights.`
  },

  /**
   * Sanitizes conversation history to strictly comply with multi-turn constraints.
   */
  sanitizeGeminiHistory: function(history, currentPrompt) {
    if (!Array.isArray(history) || history.length === 0) {
      return [];
    }

    const cleanHistory = [];
    const promptText = (currentPrompt || "").trim().toLowerCase();

    for (let i = 0; i < history.length; i++) {
      const item = history[i];
      if (!item || !item.text) continue;

      const rawText = item.text.replace(/<[^>]*>/g, "").trim();
      if (!rawText) continue;

      if (i === history.length - 1 && item.sender === "user" && rawText.toLowerCase() === promptText) {
        continue;
      }

      const gRole = item.sender === "user" ? "user" : "model";

      if (cleanHistory.length === 0) {
        if (gRole === "user") {
          cleanHistory.push({ role: "user", parts: [{ text: rawText }] });
        }
      } else {
        const lastRole = cleanHistory[cleanHistory.length - 1].role;
        if (gRole !== lastRole) {
          cleanHistory.push({ role: gRole, parts: [{ text: rawText }] });
        } else {
          cleanHistory[cleanHistory.length - 1].parts[0].text += "\n" + rawText;
        }
      }
    }

    if (cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === "user") {
      cleanHistory.pop();
    }

    return cleanHistory;
  },

  /**
   * Generates AI response for a user query.
   * Canonical path: delegates to the authoritative Strands Multi-Agent system (CampusNovaAgent / Astra / Orion / Atlas).
   *
   * @param {Object} options
   * @param {string} options.message User prompt message
   * @param {string} options.role Role context ('staff' | 'student' | 'admin')
   * @param {string} [options.userId] User ID (studentId or staffId)
   * @param {Array} [options.history] Conversation history
   * @returns {Promise<string>} AI generated response text
   */
  generateResponse: async function({ message, role = "staff", userId = null, history = [] }) {
    const prompt = (message || "").trim();
    if (!prompt) {
      return "Please enter a question or prompt for the AI Assistant.";
    }

    const effectiveRole = role || "staff";
    const targetUserId = userId || (effectiveRole === "student" ? "STU-2026-894" : "STAFF-01");

    // Route directly through the canonical Strands multi-agent architecture
    const agentResult = await campusNovaAgent.execute(prompt, {
      userRole: effectiveRole,
      userId: targetUserId,
      history: Array.isArray(history) ? history : []
    });

    return agentResult.message || agentResult.answer || "No response received from agent.";
  }
};

module.exports = AiService;
