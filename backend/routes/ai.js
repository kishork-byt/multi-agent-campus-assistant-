const express = require("express");
const router = express.Router();
const AiService = require("../services/aiService");

// POST /api/ai/chat - Process user message and return dynamic AI response
router.post("/chat", async (req, res) => {
  try {
    const { message, role, history, userId, studentId, staffId } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message prompt text is required."
      });
    }

    const effectiveRole = role || 'student';
    const targetUserId = studentId || staffId || userId;

    const reply = await AiService.generateResponse({
      message: message.trim(),
      role: effectiveRole,
      userId: targetUserId,
      history: Array.isArray(history) ? history : []
    });

    res.json({
      success: true,
      data: {
        reply,
        role: effectiveRole,
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
