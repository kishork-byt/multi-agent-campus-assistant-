const express = require("express");
const router = express.Router();
const novaCoordinator = require("../services/agents/NovaCoordinator");
const agentRegistry = require("../services/agents/agentRegistry");

// GET /api/agent-logs - Retrieve multi-agent execution audit trail for Astra, Orion, Atlas
router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const agentFilter = req.query.agent || null;

    let executions = [];
    try {
      executions = await agentRegistry.getRecentExecutions(limit, agentFilter);
    } catch (e) {
      console.warn("Error fetching AgentExecution traces:", e.message);
    }

    if (!executions || executions.length === 0) {
      const legacyLogs = await novaCoordinator.getRecentLogs(limit);
      return res.json({
        success: true,
        count: legacyLogs.length,
        data: legacyLogs
      });
    }

    res.json({
      success: true,
      count: executions.length,
      data: executions
    });
  } catch (err) {
    console.error("Error fetching agent logs:", err);
    res.status(500).json({ success: false, error: "Failed to fetch agent logs." });
  }
});

module.exports = router;
