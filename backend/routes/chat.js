const express = require("express");
const router = express.Router();
const campusNovaAgent = require("../services/agents/CampusNovaAgent");

/**
 * POST /api/chat - Unified Primary Agent Chat Entrypoint
 * Accepts { message, conversationId, userId, role, history }
 */
router.post("/", async (req, res) => {
  try {
    const { message, conversationId, userId, role, history } = req.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "A valid message prompt string is required."
      });
    }

    const cleanMessage = message.trim();
    const userRole = role || "student";
    const currentUserId = userId || "STU-2026-894";
    const convId = conversationId || `conv_${Date.now()}`;

    // Execute via primary CampusNova Strands Agent
    const agentResponse = await campusNovaAgent.execute(cleanMessage, {
      userRole,
      userId: currentUserId,
      conversationId: convId,
      history: Array.isArray(history) ? history : []
    });

    res.json({
      success: true,
      answer: agentResponse.message || agentResponse.answer,
      reply: agentResponse.message || agentResponse.answer,
      agent: agentResponse.agent || "CampusNova",
      agentRole: "Autonomous Campus Agent",
      status: agentResponse.status,
      executionId: agentResponse.executionId,
      toolsUsed: agentResponse.toolsUsed,
      approvalRequired: !!agentResponse.approvalRequired,
      approvalId: agentResponse.approvalId,
      actionDetails: agentResponse.actionDetails,
      cards: agentResponse.cards || [],
      confidence: 0.98,
      conversationId: convId,
      requiresHumanSupport: false
    });
  } catch (err) {
    console.error("[ChatAPI] Error processing chat request:", err);
    res.status(500).json({
      success: false,
      error: "The CampusNova AI Assistant encountered an unexpected error processing your request. Please try again."
    });
  }
});

module.exports = router;
