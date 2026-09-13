const express = require("express");
const router = express.Router();
const campusNovaAgent = require("../services/agents/CampusNovaAgent");

// POST /api/ai/chat - Process message via primary CampusNova Agent
router.post("/chat", async (req, res) => {
  try {
    const { message, role, history, userId, conversationId } = req.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message prompt text is required."
      });
    }

    const cleanMessage = message.trim();
    const userRole = role || "student";
    const currentUserId = userId || "STU-2026-894";
    const convId = conversationId || `conv_${Date.now()}`;

    const agentResponse = await campusNovaAgent.execute(cleanMessage, {
      userRole,
      userId: currentUserId,
      conversationId: convId,
      history: Array.isArray(history) ? history : []
    });

    res.json({
      success: true,
      data: {
        reply: agentResponse.message || agentResponse.answer,
        answer: agentResponse.message || agentResponse.answer,
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
        role: userRole,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error("Error handling POST /api/ai/chat:", err);
    res.status(500).json({
      success: false,
      error: "The AI Assistant encountered an issue processing your request. Please try again."
    });
  }
});

module.exports = router;
