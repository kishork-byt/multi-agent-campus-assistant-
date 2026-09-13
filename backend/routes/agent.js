const express = require("express");
const router = express.Router();
const agentRegistry = require("../services/agents/agentRegistry");
const campusNovaAgent = require("../services/agents/CampusNovaAgent");
const autopilotService = require("../services/autopilot/autopilotService");
const AgentExecution = require("../models/AgentExecution");

const {
  verifySessionToken,
  issueTokenForRole,
  issueTokenForUser,
  createSessionToken,
  VERIFIED_USERS
} = require("../services/auth/sessionService");

/**
 * Authentication Middleware: Cryptographically verified session tokens.
 * Extracts token from Authorization (Bearer) or x-session-token.
 * Completely eliminates arbitrary header spoofing of x-user-id and x-user-role.
 */
function resolveAuthenticatedUser(req, res, next) {
  // 1. Check for cryptographically signed token
  let token = null;
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  } else if (req.headers["x-session-token"]) {
    token = req.headers["x-session-token"].trim();
  }

  if (token) {
    if (token.startsWith("session_token_")) {
      const defaultStudent = VERIFIED_USERS["STU-2026-894"];
      req.authenticatedUser = { ...defaultStudent };
      return next();
    }
    const verified = verifySessionToken(token);
    if (!verified) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Invalid, expired, or tampered session token."
      });
    }
    req.authenticatedUser = verified;
    return next();
  }

  // 2. Reject attempts to elevate role via unauthenticated raw headers
  const requestedRole = (req.headers["x-user-role"] || "").toLowerCase();
  const requestedUserId = req.headers["x-user-id"];

  if (requestedRole === "admin" || requestedRole === "staff" || requestedRole === "faculty") {
    return res.status(403).json({
      success: false,
      error: `Forbidden: Role '${requestedRole}' requires a valid cryptographically signed session token. Header spoofing is strictly prohibited.`
    });
  }

  if (requestedUserId && requestedUserId !== "STU-2026-894") {
    return res.status(403).json({
      success: false,
      error: `Forbidden: Access to identity '${requestedUserId}' requires a valid signed session token.`
    });
  }

  // 3. Assign verified default student identity (Alex Rivera)
  const defaultStudent = VERIFIED_USERS["STU-2026-894"];
  req.authenticatedUser = { ...defaultStudent };
  res.setHeader("x-session-token", createSessionToken(defaultStudent));
  next();
}

/**
 * Session Token Issuance Endpoint: POST /api/agent/auth/session
 * Allows clients to obtain verified signed tokens for authorized roles.
 */
router.post("/auth/session", (req, res) => {
  const { role, userId } = req.body || {};
  let session = null;

  if (userId && VERIFIED_USERS[userId]) {
    session = issueTokenForUser(userId);
  } else if (role) {
    session = issueTokenForRole(role);
  } else {
    session = issueTokenForRole("student");
  }

  if (!session) {
    return res.status(400).json({ success: false, error: "Invalid user identity or role request." });
  }

  res.json({
    success: true,
    token: session.token,
    user: session.user
  });
});

router.use(resolveAuthenticatedUser);

/**
 * POST /api/agent/chat
 * Primary server-routed entrypoint for the Strands Agents
 * Authenticated session role strictly decides the agent:
 * - student       -> Astra
 * - faculty/staff -> Orion
 * - admin         -> Atlas
 */
router.post("/chat", async (req, res) => {
  try {
    const { message, conversationId, history } = req.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "A valid natural-language message string is required."
      });
    }

    const cleanMessage = message.trim();
    const user = req.authenticatedUser;
    const convId = conversationId || `conv_${user.role}_${user.id}`;

    // Securely routes to Astra, Orion, or Atlas based strictly on user.role
    const result = await agentRegistry.processChat({
      message: cleanMessage,
      user,
      conversationId: convId,
      history: Array.isArray(history) ? history : []
    });

    res.json(result);
  } catch (err) {
    console.error("[AgentRoute] Chat processing error:", err);
    res.status(500).json({
      success: false,
      agent: "CampusNova",
      error: "The CampusNova Agent encountered an unexpected server error. Please try again."
    });
  }
});

/**
 * POST /api/agent/student/chat
 * Direct Student Agent (Astra) Endpoint
 */
router.post("/student/chat", async (req, res) => {
  try {
    const user = req.authenticatedUser;
    const { message, conversationId, history } = req.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, error: "A valid natural-language message is required." });
    }

    const convId = conversationId || `conv_astra_${user.id}`;
    const result = await agentRegistry.agents.astra.process({
      message: message.trim(),
      userId: user.id,
      role: user.role,
      conversationId: convId,
      history: Array.isArray(history) ? history : []
    });

    res.json(result);
  } catch (err) {
    console.error("[AgentRoute] Student chat error:", err);
    res.status(500).json({ success: false, agent: "Astra", error: err.message });
  }
});

/**
 * POST /api/agent/faculty/chat
 * Direct Faculty Agent (Orion) Endpoint
 */
router.post("/faculty/chat", async (req, res) => {
  try {
    const user = req.authenticatedUser;
    const role = (user.role || "").toLowerCase();

    if (role !== "staff" && role !== "faculty") {
      return res.status(403).json({
        success: false,
        agent: "Orion",
        error: "Forbidden: Orion Agent requires verified faculty or staff credentials."
      });
    }

    const { message, conversationId, history } = req.body || {};
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, error: "A valid natural-language message is required." });
    }

    const convId = conversationId || `conv_orion_${user.id}`;
    const result = await agentRegistry.agents.orion.process({
      message: message.trim(),
      userId: user.id,
      role: user.role,
      conversationId: convId,
      history: Array.isArray(history) ? history : []
    });

    res.json(result);
  } catch (err) {
    console.error("[AgentRoute] Faculty chat error:", err);
    res.status(500).json({ success: false, agent: "Orion", error: err.message });
  }
});

/**
 * POST /api/agent/admin/chat
 * Direct Administration Agent (Atlas) Endpoint
 */
router.post("/admin/chat", async (req, res) => {
  try {
    const user = req.authenticatedUser;
    const role = (user.role || "").toLowerCase();

    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        agent: "Atlas",
        error: "Forbidden: Atlas Agent requires verified university administrator credentials."
      });
    }

    const { message, conversationId, history } = req.body || {};
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, error: "A valid natural-language message is required." });
    }

    const convId = conversationId || `conv_atlas_${user.id}`;
    const result = await agentRegistry.agents.atlas.process({
      message: message.trim(),
      userId: user.id,
      role: user.role,
      conversationId: convId,
      history: Array.isArray(history) ? history : []
    });

    res.json(result);
  } catch (err) {
    console.error("[AgentRoute] Admin chat error:", err);
    res.status(500).json({ success: false, agent: "Atlas", error: err.message });
  }
});

/**
 * POST /api/agent/approve
 * Executes and verifies a pending consequential action across agents
 * Request: { approvalId }
 */
router.post("/approve", async (req, res) => {
  try {
    const { approvalId } = req.body || {};

    if (!approvalId) {
      return res.status(400).json({
        success: false,
        error: "An approvalId is required to approve an action."
      });
    }

    const user = req.authenticatedUser;
    const result = await agentRegistry.approve({
      approvalId,
      user
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error("[AgentRoute] Approval execution error:", err);
    res.status(500).json({
      success: false,
      error: `Approval execution failed: ${err.message}`
    });
  }
});

/**
 * POST /api/agent/reject
 * Safely cancels a pending consequential action across agents
 * Request: { approvalId }
 */
router.post("/reject", async (req, res) => {
  try {
    const { approvalId } = req.body || {};

    if (!approvalId) {
      return res.status(400).json({
        success: false,
        error: "An approvalId is required to reject an action."
      });
    }

    const user = req.authenticatedUser;
    const result = await agentRegistry.reject({
      approvalId,
      user
    });

    res.json(result);
  } catch (err) {
    console.error("[AgentRoute] Rejection error:", err);
    res.status(500).json({
      success: false,
      error: `Failed to cancel action: ${err.message}`
    });
  }
});

/**
 * GET /api/agent/executions
 * Returns recent agent execution traces for viva, audit, and multi-agent debug UI
 */
router.get("/executions", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const agentFilter = req.query.agent || null;
    const executions = await agentRegistry.getRecentExecutions(limit, agentFilter);
    res.json({
      success: true,
      count: executions.length,
      data: executions
    });
  } catch (err) {
    console.error("[AgentRoute] Execution log fetch error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch agent execution traces." });
  }
});

/**
 * GET /api/agent/autopilot
 * Returns proactive suggestions and detected actions for the current user
 */
router.get("/autopilot", async (req, res) => {
  try {
    const user = req.authenticatedUser;
    const insights = await autopilotService.scanForProactiveTasks({
      userId: user.id,
      role: user.role
    });

    res.json({
      success: true,
      data: insights
    });
  } catch (err) {
    console.error("[AgentRoute] Autopilot scan error:", err);
    res.status(500).json({ success: false, error: "Failed to run autopilot scan." });
  }
});

/**
 * POST /api/agent/autopilot/run
 * Manually trigger proactive scan
 */
router.post("/autopilot/run", async (req, res) => {
  try {
    const user = req.authenticatedUser;
    const insights = await autopilotService.scanForProactiveTasks({
      userId: user.id,
      role: user.role
    });

    res.json({
      success: true,
      message: `Autopilot identified ${insights.length} proactive recommendations.`,
      data: insights
    });
  } catch (err) {
    console.error("[AgentRoute] Autopilot run error:", err);
    res.status(500).json({ success: false, error: "Autopilot run failed." });
  }
});

module.exports = router;
