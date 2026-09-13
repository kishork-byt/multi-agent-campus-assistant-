const express = require("express");
const router = express.Router();
const campusNovaAgent = require("../services/agents/CampusNovaAgent");

// POST /api/ai/chat - Process message via primary CampusNova Agent
router.post("/chat", async (req, res) => {
  try {
    const { message, role, history, userId, studentId, staffId, conversationId } = req.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message prompt text is required."
      });
    }

    const cleanMessage = message.trim();
    // Validate role safely against allowed roles
    const validRoles = ["student", "staff", "faculty", "admin"];
    const normalizedRole = typeof role === "string" ? role.toLowerCase().trim() : "";
    const userRole = validRoles.includes(normalizedRole) ? normalizedRole : "student";

    // Resolve effective user ID safely with backward-compatible fallbacks
    const currentUserId = (typeof userId === "string" && userId.trim())
      || (typeof studentId === "string" && studentId.trim())
      || (typeof staffId === "string" && staffId.trim())
      || (userRole === "staff" || userRole === "faculty" ? "STAFF-01" : userRole === "admin" ? "ADMIN-01" : "STU-2026-894");

    const convId = conversationId || `conv_${Date.now()}`;

    const agentResponse = await campusNovaAgent.execute(cleanMessage, {
      userRole,
      userId: currentUserId,
      conversationId: convId,
      history: Array.isArray(history) ? history : []
    });

    const reply = agentResponse.message || agentResponse.answer || "";

    res.json({
      success: true,
      data: {
        reply: reply,
        answer: reply,
        agent: agentResponse.agent || "CampusNova",
        agentRole: agentResponse.agentRole || "Autonomous Campus Agent",
        status: agentResponse.status,
        executionId: agentResponse.executionId,
        toolsUsed: agentResponse.toolsUsed || [],
        approvalRequired: !!agentResponse.approvalRequired,
        approvalId: agentResponse.approvalId,
        actionDetails: agentResponse.actionDetails,
        cards: agentResponse.cards || [],
        confidence: agentResponse.confidence || 0.98,
        conversationId: convId,
        role: userRole,
        userId: currentUserId,
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
