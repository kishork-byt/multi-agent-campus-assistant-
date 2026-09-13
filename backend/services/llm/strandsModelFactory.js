/**
 * CAMPUSNOVA STRANDS MODEL FACTORY
 * Provides genuine model provider integration for @strands-agents/sdk v1.17.0
 *
 * Supported Providers:
 * 1. Amazon Bedrock (BedrockModel) - PREFERRED
 *    Environment: AWS_REGION, BEDROCK_MODEL_ID, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 * 2. Google Gemini (GoogleModel)
 *    Environment: GEMINI_API_KEY, GEMINI_MODEL
 * 3. StrandsOfflineTestModel (Explicit testing fallback for offline unit tests)
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env"), override: true });

let StrandsSdk = null;
async function getStrandsSdk() {
  if (!StrandsSdk) {
    StrandsSdk = await import("@strands-agents/sdk");
  }
  return StrandsSdk;
}

/**
 * Deterministic helper to extract event search keywords and date ranges
 * for offline test execution when cloud LLM is unavailable.
 */
function extractEventSearchParams(text, referenceDate = new Date("2026-09-10T09:25:00+05:30")) {
  let clean = (text || "").replace(/[.,?!]+$/, "").trim();
  const lower = clean.toLowerCase();
  let dateFrom = undefined;
  let dateTo = undefined;

  if (lower.includes("this week")) {
    dateFrom = referenceDate.toISOString().slice(0, 10);
    const endOfWeek = new Date(referenceDate);
    endOfWeek.setDate(referenceDate.getDate() + 6);
    dateTo = endOfWeek.toISOString().slice(0, 10);
  } else if (lower.includes("today")) {
    dateFrom = referenceDate.toISOString().slice(0, 10);
    dateTo = referenceDate.toISOString().slice(0, 10);
  } else if (lower.includes("tomorrow")) {
    const tmr = new Date(referenceDate);
    tmr.setDate(referenceDate.getDate() + 1);
    dateFrom = tmr.toISOString().slice(0, 10);
    dateTo = tmr.toISOString().slice(0, 10);
  }

  let kw = clean
    .replace(/^(?:find|search for|look for|show me|are there any|get|list)\s+(?:the\s+)?/i, "")
    .replace(/^(?:register me for|sign me up for|enroll me in|register for)\s+(?:the\s+)?/i, "")
    .replace(/\s+(?:and register me|and sign me up|and enroll me)$/i, "")
    .replace(/\s+and remind me.*$/i, "")
    .replace(/\s+(?:this week|today|tomorrow|next week)$/i, "")
    .replace(/[.,?!]+$/, "")
    .trim();

  kw = kw.replace(/\s+events$/i, "").trim();

  const result = { keyword: kw || "AI" };
  if (dateFrom) result.dateFrom = dateFrom;
  if (dateTo) result.dateTo = dateTo;
  return result;
}

/**
 * StrandsOfflineTestModel
 * An official Strands Model implementation used for automated test suites
 * when running offline without AWS Bedrock or Google API credentials.
 * Implements the real Strands tool-calling streaming protocol.
 */
class StrandsOfflineTestModel {
  constructor(options = {}) {
    this.options = options;
    this.modelName = options.modelId || "Strands-Offline-Test-Model";
    this.referenceDate = options.referenceDate || new Date("2026-09-10T09:25:00+05:30");
  }

  updateConfig(config) {
    this.options = { ...this.options, ...config };
  }

  getConfig() {
    return { modelId: this.modelName, contextWindowLimit: 200000 };
  }

  async countTokens() {
    return 100;
  }

  extractEventSearchParams(text) {
    return extractEventSearchParams(text, this.referenceDate);
  }

  async *stream(messages, options = {}) {
    if (!messages || messages.length === 0) {
      throw new Error("At least one message is required for Strands stream");
    }

    const lastMsg = messages[messages.length - 1];
    const userMsg = messages.find(m => m.role === "user");
    const userText = userMsg
      ? userMsg.content.map(c => c.text || "").join(" ").trim()
      : "";
    const lowerUser = userText.toLowerCase();

    // Available tool names from options
    const availableToolNames = (options.toolSpecs || []).map(t => t.name);

    // =========================================================================
    // TURN 2+: A Tool Result was returned to the Model
    // =========================================================================
    const toolResultBlock = lastMsg.content && lastMsg.content.find(c => c.type === "toolResultBlock");
    if (toolResultBlock) {
      const rawContent = toolResultBlock.content || toolResultBlock.toolResult?.content || [];
      const toolOutput = rawContent[0]?.json || rawContent[0]?.text || {};

      let responseText = "";

      // 1. Event Search Result
      if (toolOutput.events !== undefined) {
        const events = toolOutput.events || [];
        const isRegRequest = /register|sign me up|enroll/i.test(userText);
        const hasReminder = /remind/i.test(userText);

        if (events.length === 0) {
          responseText = `I could not locate any upcoming events matching your request in the university calendar.`;
        } else if (isRegRequest) {
          const target = events[0];
          const reminderText = hasReminder ? " and schedule a reminder for one hour before" : "";
          responseText = `I found **${target.title}** on **${target.date}** at **${target.time || '10:00 AM'}** (${target.location || target.venue || 'Innovation Hub'}).\n\nWould you like me to register you${reminderText}?`;
        } else {
          responseText = `I found **${events.length} campus event${events.length > 1 ? 's' : ''}** matching your query:\n\n` +
            events.map(e => `• **${e.title}** — ${e.date} at ${e.time || 'TBA'} (${e.location || e.venue || 'Campus'})`).join("\n") +
            `\n\nWould you like me to register you for any of these events?`;
        }
      }
      // 2. Event Registration Result
      else if (toolOutput.registration !== undefined || toolOutput.alreadyRegistered !== undefined) {
        if (toolOutput.alreadyRegistered) {
          responseText = toolOutput.message || `You are already registered for this event.`;
        } else if (toolOutput.success) {
          responseText = `You're registered for **${toolOutput.registration?.eventTitle || 'the event'}**.\n\nRegistration has been verified in the university database.`;
        } else {
          responseText = `Registration could not be completed: ${toolOutput.error || 'Database error'}`;
        }
      }
      // 3. Navigation / Route Result
      else if (toolOutput.route !== undefined) {
        const route = toolOutput.route;
        responseText = `Walking directions to destination:\n` +
          `• **Distance**: ${route.distanceMeters} meters (~${route.walkingTimeMinutes} mins)\n` +
          `• **Route**: ${route.pathNames ? route.pathNames.join(" → ") : 'Shortest path found'}\n` +
          (route.directions ? route.directions.map(d => `  ${d}`).join("\n") : "");
      }
      // 4. Campus Location Search Result
      else if (toolOutput.locations !== undefined) {
        const locs = toolOutput.locations || [];
        if (locs.length > 0) {
          responseText = `I found the following campus locations:\n\n` +
            locs.slice(0, 2).map(l => `• **${l.name}** (${l.building}, Floor ${l.floor}) — ${l.description}`).join("\n");
        } else {
          responseText = `No matching campus locations found.`;
        }
      }
      // 5. Tasks Result
      else if (toolOutput.tasks !== undefined) {
        const tasks = toolOutput.tasks || [];
        if (tasks.length > 0) {
          responseText = `Here are your pending tasks:\n\n` +
            tasks.map(t => `• **${t.title}** (Due: ${t.dueDate || 'TBA'}, Priority: ${t.priority || 'Normal'})`).join("\n");
        } else {
          responseText = `You have no pending tasks.`;
        }
      }
      // 6. Task Created Result
      else if (toolOutput.task !== undefined) {
        responseText = `Task "**${toolOutput.task.title}**" has been created successfully (Due: ${toolOutput.task.dueDate || 'Tomorrow'}).`;
      }
      // 7. Support Issue Result
      else if (toolOutput.issue !== undefined) {
        responseText = `Support ticket **${toolOutput.issue.issueId}** created for ${toolOutput.issue.department || 'Facilities'}: "${toolOutput.issue.title}". Status: ${toolOutput.issue.status}.`;
      }
      // 8. Admin Analytics Result
      else if (toolOutput.data !== undefined && toolOutput.data.activeApprovedEvents !== undefined) {
        const d = toolOutput.data;
        responseText = `Campus Operational Analytics:\n` +
          `• **Active Approved Events**: ${d.activeApprovedEvents}\n` +
          `• **Unresolved Support Tickets**: ${d.unresolvedSupportIssues}\n` +
          `• **Total AI Executions**: ${d.totalAiExecutions}\n` +
          `• **Report Timestamp**: ${d.timestamp}`;
      }
      // 9. Campus Information Result
      else if (toolOutput.data !== undefined) {
        responseText = toolOutput.message || `Campus information retrieved successfully.`;
      }
      // General Fallback
      else {
        responseText = toolOutput.message || (toolOutput.success ? "Action completed successfully." : `Notice: ${toolOutput.error || 'Done'}`);
      }

      yield { type: "modelMessageStartEvent", role: "assistant" };
      yield { type: "modelContentBlockStartEvent" };
      yield {
        type: "modelContentBlockDeltaEvent",
        delta: { type: "textDelta", text: responseText }
      };
      yield { type: "modelContentBlockStopEvent" };
      yield { type: "modelMessageStopEvent", stopReason: "endTurn" };
      return;
    }

    // =========================================================================
    // TURN 1: User Natural Language Input -> Tool Selection & Parameter Extraction
    // =========================================================================

    // 1. Role Authorization Guardrails
    const restrictedKeywords = [
      "faculty salary", "staff salary", "confidential budget", "disciplinary action",
      "admin credentials", "salary records", "payroll records", "confidential payroll"
    ];
    if (restrictedKeywords.some(k => lowerUser.includes(k))) {
      yield { type: "modelMessageStartEvent", role: "assistant" };
      yield { type: "modelContentBlockStartEvent" };
      yield {
        type: "modelContentBlockDeltaEvent",
        delta: {
          type: "textDelta",
          text: "⚠️ **Authorization Notice**: Access to confidential institutional administrative data and payroll records is strictly restricted to authorized university administrators."
        }
      };
      yield { type: "modelContentBlockStopEvent" };
      yield { type: "modelMessageStopEvent", stopReason: "endTurn" };
      return;
    }

    // Helper: Yield tool call
    const yieldToolCall = function* (toolName, inputObj) {
      const toolUseId = `call_${toolName}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      yield { type: "modelMessageStartEvent", role: "assistant" };
      yield {
        type: "modelContentBlockStartEvent",
        start: { type: "toolUseStart", name: toolName, toolUseId }
      };
      yield {
        type: "modelContentBlockDeltaEvent",
        delta: { type: "toolUseInputDelta", input: JSON.stringify(inputObj) }
      };
      yield { type: "modelContentBlockStopEvent" };
      yield { type: "modelMessageStopEvent", stopReason: "toolUse" };
    };

    // 2. Admin Analytics (Admin only)
    if ((lowerUser.includes("analytics") || lowerUser.includes("operational overview") || lowerUser.includes("campus activity") || lowerUser.includes("audit")) &&
        availableToolNames.includes("get_admin_analytics")) {
      yield* yieldToolCall("get_admin_analytics", {});
      return;
    }

    // 3. Navigation / Directions Intent
    const isNavigation = /\b(directions?|route|navigate|how to get|how do i get|how to reach|how can i go|take me to|take me from|epdi poganum|eppadi poganum|vazhi|rasta|kaise jau|kaise jaye)\b/i.test(lowerUser);
    if (isNavigation && availableToolNames.includes("calculate_campus_route")) {
      let destName = "Central University Library";
      let srcName = "Main Gate";

      const fromToMatch = userText.match(/(?:from|irundhu|se)\s+([^,]+?)\s+(?:to|ku|ko|towards)\s+([^,?.!]+)/i);
      if (fromToMatch) {
        srcName = fromToMatch[1].trim();
        destName = fromToMatch[2].trim();
      } else {
        const toMatch = userText.match(/(?:to|ku|ko|reach|towards)\s+([^,?.!]+)/i);
        if (toMatch) destName = toMatch[1].trim();
        else if (lowerUser.includes("library")) destName = "Central University Library";
        else if (lowerUser.includes("lab 3")) destName = "Academic Block A";
        else if (lowerUser.includes("innovation hub")) destName = "Innovation Hub";
      }

      yield* yieldToolCall("calculate_campus_route", { from: srcName, to: destName });
      return;
    }

    // 4. Location Query Intent
    const isLocationQuery = /\b(where is|location of|which building|what floor|enga iruku|enga irukku|kaha hai|kahan hai|kidhar hai)\b/i.test(lowerUser) ||
      lowerUser.startsWith("where is it");
    if (isLocationQuery && availableToolNames.includes("search_campus_location")) {
      let locTarget = userText
        .replace(/^(?:where is|location of|which building is|what floor is|enga iruku|kaha hai)\s+(?:the\s+)?/i, "")
        .replace(/[.,?!]+$/, "")
        .trim();
      if (!locTarget || locTarget === "it") locTarget = "Library";
      yield* yieldToolCall("search_campus_location", { query: locTarget });
      return;
    }

    // 5. Support Issue Status
    if ((lowerUser.includes("status") || lowerUser.includes("what happened") || lowerUser.includes("check ticket") || lowerUser.includes("enna aachu")) &&
        (lowerUser.includes("complaint") || lowerUser.includes("ticket") || lowerUser.includes("projector") || lowerUser.includes("issue") || /sup-\d+/i.test(lowerUser)) &&
        availableToolNames.includes("get_support_status")) {
      const ticketMatch = userText.match(/sup-\d+/i);
      yield* yieldToolCall("get_support_status", {
        ticketId: ticketMatch ? ticketMatch[0].toUpperCase() : undefined,
        query: userText
      });
      return;
    }

    // 6. Support Issue Creation
    if ((lowerUser.includes("not working") || lowerUser.includes("isn't working") || lowerUser.includes("broken") ||
         lowerUser.includes("repair") || lowerUser.includes("complaint") || lowerUser.includes("faulty") ||
         lowerUser.includes("projector") || lowerUser.includes("vela seiyala") || lowerUser.includes("kharab hai")) &&
        availableToolNames.includes("create_support_issue")) {
      let loc = "Lab 3";
      if (lowerUser.includes("room 204")) loc = "Room 204";
      yield* yieldToolCall("create_support_issue", {
        title: userText,
        description: `Support ticket lodged via autonomous campus agent: "${userText}"`,
        location: loc,
        department: "Facilities",
        priority: "Medium"
      });
      return;
    }

    // 7. Event Discovery / Event Registration Request
    const isEventSearch = /find|search|show|look for|are there any|what events|events|event|workshop|hackathon|conference|seminar|summit|lecture|ai/i.test(lowerUser);
    const isEventReg = /register|sign me up|enroll/i.test(lowerUser);

    if ((isEventSearch || isEventReg) && availableToolNames.includes("search_events")) {
      const searchParams = this.extractEventSearchParams(userText);
      yield* yieldToolCall("search_events", searchParams);
      return;
    }

    // 8. Task Management: View Tasks
    if ((lowerUser.includes("my tasks") || lowerUser.includes("show tasks") || lowerUser.includes("list tasks") || lowerUser.includes("pending tasks") || lowerUser.includes("what tasks")) &&
        availableToolNames.includes("get_tasks")) {
      yield* yieldToolCall("get_tasks", {});
      return;
    }

    // 9. Task Management: Create Task / Reminder
    if ((lowerUser.includes("remind me") || lowerUser.includes("create task") || lowerUser.includes("add task") || lowerUser.includes("set a reminder") || lowerUser.includes("yaad dila")) &&
        availableToolNames.includes("create_task")) {
      yield* yieldToolCall("create_task", {
        title: userText,
        dueDate: "Tomorrow at 5:00 PM",
        priority: "High",
        reminderTime: "1 hour before",
        desc: userText
      });
      return;
    }

    // 10. General Campus Information / Policies (Default)
    if (availableToolNames.includes("search_campus_information")) {
      yield* yieldToolCall("search_campus_information", { query: userText });
      return;
    }

    // Text completion fallback if no tools matched
    yield { type: "modelMessageStartEvent", role: "assistant" };
    yield { type: "modelContentBlockStartEvent" };
    yield {
      type: "modelContentBlockDeltaEvent",
      delta: {
        type: "textDelta",
        text: `I understand your inquiry: "${userText}". How may I assist you further with campus services?`
      }
    };
    yield { type: "modelContentBlockStopEvent" };
    yield { type: "modelMessageStopEvent", stopReason: "endTurn" };
  }
}

/**
 * Validates AWS Bedrock configuration and credentials
 */
function hasValidAwsCredentials() {
  const key = (process.env.AWS_ACCESS_KEY_ID || "").trim();
  const secret = (process.env.AWS_SECRET_ACCESS_KEY || "").trim();
  const profile = (process.env.AWS_PROFILE || "").trim();

  const isPlaceholder = (val) => !val || val.startsWith("your_") || val.includes("<");
  if (key && secret && !isPlaceholder(key) && !isPlaceholder(secret)) {
    return true;
  }
  if (profile && !isPlaceholder(profile)) {
    return true;
  }
  return false;
}

/**
 * Validates Google Gemini configuration and credentials
 */
function hasValidGoogleCredentials() {
  const key = (process.env.GEMINI_API_KEY || "").trim();
  const isPlaceholder = (val) => !val || val.startsWith("your_") || val.includes("<");
  return Boolean(key && !isPlaceholder(key));
}

/**
 * Accurately determines the runtime state of the active model provider.
 * Never claims a provider is active unless genuine, valid credentials exist.
 */
function getActiveModelRuntimeState() {
  require("dotenv").config({ path: path.join(__dirname, "../../.env"), override: true });
  const requestedProvider = (process.env.AI_PROVIDER || "").toLowerCase().trim();

  // 1. Bedrock requested or default preference
  if (requestedProvider === "bedrock" || (!requestedProvider && hasValidAwsCredentials())) {
    if (hasValidAwsCredentials()) {
      return {
        activeProvider: "AWS Bedrock",
        activeModelId: process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-haiku-20240307-v1:0",
        region: process.env.AWS_REGION || "us-east-1",
        strandsVersion: "v1.17.0",
        state: "ACTIVE",
        isLiveCloud: true,
        isConfigured: true,
        details: "AWS Bedrock Converse API with BedrockModel is active."
      };
    }

    // Bedrock was explicitly configured, but credentials are missing
    if (requestedProvider === "bedrock") {
      // Check if Gemini is available as configured fallback
      if (hasValidGoogleCredentials()) {
        const configuredModel = (process.env.GEMINI_MODEL || "").trim();
        const geminiModelId = (configuredModel && configuredModel !== "gemini-2.5-flash")
          ? configuredModel
          : "gemini-3.6-flash";
        return {
          activeProvider: "Google Gemini",
          activeModelId: geminiModelId,
          strandsVersion: "v1.17.0",
          state: "ACTIVE",
          isLiveCloud: true,
          isConfigured: true,
          details: "AWS Bedrock credentials missing; falling back to configured Google Gemini."
        };
      }
      return {
        activeProvider: "NONE",
        activeModelId: null,
        region: process.env.AWS_REGION || "us-east-1",
        strandsVersion: "v1.17.0",
        state: "MODEL_UNAVAILABLE",
        isLiveCloud: false,
        isConfigured: false,
        details: "AWS Bedrock is specified in AI_PROVIDER, but valid AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are not configured in backend/.env."
      };
    }
  }

  // 2. Google Gemini requested or available
  if (requestedProvider === "gemini" || hasValidGoogleCredentials()) {
    if (hasValidGoogleCredentials()) {
      const configuredModel = (process.env.GEMINI_MODEL || "").trim();
      const geminiModelId = (configuredModel && configuredModel !== "gemini-2.5-flash")
        ? configuredModel
        : "gemini-3.6-flash";
      return {
        activeProvider: "Google Gemini",
        activeModelId: geminiModelId,
        strandsVersion: "v1.17.0",
        state: "ACTIVE",
        isLiveCloud: true,
        isConfigured: true,
        details: "Google Gemini API with GoogleModel is active."
      };
    }

    if (requestedProvider === "gemini") {
      return {
        activeProvider: "NONE",
        activeModelId: null,
        strandsVersion: "v1.17.0",
        state: "MODEL_UNAVAILABLE",
        isLiveCloud: false,
        isConfigured: false,
        details: "Google Gemini is specified in AI_PROVIDER, but valid GEMINI_API_KEY is not configured in backend/.env."
      };
    }
  }

  // 3. Isolated Test Mode Fallback (ONLY when explicitly enabled via env flag)
  if (process.env.ALLOW_OFFLINE_TESTING === "true") {
    return {
      activeProvider: "Strands Offline Test Model",
      activeModelId: "CampusNova-Offline-Test-Model",
      strandsVersion: "v1.17.0",
      state: "TEST_FALLBACK",
      isLiveCloud: false,
      isConfigured: false,
      isOfflineTest: true,
      details: "Isolated offline test mode active via ALLOW_OFFLINE_TESTING flag."
    };
  }

  // 4. Default: No valid credentials exist -> MODEL_UNAVAILABLE
  return {
    activeProvider: "NONE",
    activeModelId: null,
    strandsVersion: "v1.17.0",
    state: "MODEL_UNAVAILABLE",
    isLiveCloud: false,
    isConfigured: false,
    details: "No valid cloud model credentials configured. Please set AWS Bedrock (AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY) or Google Gemini (GEMINI_API_KEY) in backend/.env."
  };
}

/**
 * Creates and configures the genuine Model instance for Strands Agents
 * @param {Object} options
 * @param {string} [options.agentName] Name of the calling agent (Astra, Orion, Atlas)
 * @param {string} [options.role] Role of the calling agent
 * @param {boolean} [options.allowOfflineTest] Whether isolated test fallback is permitted
 */
async function createStrandsModel(options = {}) {
  const runtimeState = getActiveModelRuntimeState();

  // If credentials are valid for AWS Bedrock, instantiate real BedrockModel from SDK
  if (runtimeState.state === "ACTIVE" && runtimeState.activeProvider === "AWS Bedrock") {
    try {
      const { BedrockModel } = await import("@strands-agents/sdk/models/bedrock");
      const clientConfig = {};

      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        clientConfig.credentials = {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID.trim(),
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.trim()
        };
      }

      const model = new BedrockModel({
        region: runtimeState.region,
        modelId: runtimeState.activeModelId,
        clientConfig: Object.keys(clientConfig).length > 0 ? clientConfig : undefined
      });

      // Attach search helper to preserve compatibility for test assertion helpers
      model.extractEventSearchParams = (text) => extractEventSearchParams(text);

      console.log(`[StrandsModelFactory] Instantiated genuine BedrockModel: ${runtimeState.activeModelId} (${runtimeState.region})`);
      return {
        model,
        provider: "AWS Bedrock",
        modelId: runtimeState.activeModelId,
        region: runtimeState.region,
        isLiveCloud: true,
        state: "ACTIVE"
      };
    } catch (err) {
      console.error(`[StrandsModelFactory] Failed to initialize BedrockModel:`, err.message);
      return {
        model: null,
        provider: "AWS Bedrock",
        modelId: runtimeState.activeModelId,
        isLiveCloud: false,
        state: "MODEL_UNAVAILABLE",
        error: `BedrockModel initialization failed: ${err.message}`
      };
    }
  }

  // If credentials are valid for Google Gemini, instantiate real GoogleModel from SDK
  if (runtimeState.state === "ACTIVE" && runtimeState.activeProvider === "Google Gemini") {
    try {
      const { GoogleModel } = await import("@strands-agents/sdk/models/google");
      const model = new GoogleModel({
        apiKey: process.env.GEMINI_API_KEY.trim(),
        modelId: runtimeState.activeModelId
      });

      // Attach search helper to preserve compatibility for test assertion helpers
      model.extractEventSearchParams = (text) => extractEventSearchParams(text);

      console.log(`[StrandsModelFactory] Instantiated genuine GoogleModel: ${runtimeState.activeModelId}`);
      return {
        model,
        provider: "Google Gemini",
        modelId: runtimeState.activeModelId,
        isLiveCloud: true,
        state: "ACTIVE"
      };
    } catch (err) {
      console.error(`[StrandsModelFactory] Failed to initialize GoogleModel:`, err.message);
      return {
        model: null,
        provider: "Google Gemini",
        modelId: runtimeState.activeModelId,
        isLiveCloud: false,
        state: "MODEL_UNAVAILABLE",
        error: `GoogleModel initialization failed: ${err.message}`
      };
    }
  }

  // Isolated test mode fallback ONLY when explicitly requested
  if (options.allowOfflineTest || (process.env.ALLOW_OFFLINE_TESTING === "true" && runtimeState.state === "TEST_FALLBACK")) {
    const testModel = new StrandsOfflineTestModel({
      modelId: `${options.agentName || 'CampusNova'}-Offline-Test-Model`
    });

    return {
      model: testModel,
      provider: "Strands Offline Test Model",
      modelId: testModel.modelName,
      isLiveCloud: false,
      isOfflineTest: true,
      state: "TEST_FALLBACK"
    };
  }

  // Otherwise, return strictly MODEL_UNAVAILABLE (no fake responses or silent fallback)
  return {
    model: null,
    provider: "NONE",
    modelId: null,
    isLiveCloud: false,
    state: "MODEL_UNAVAILABLE",
    error: runtimeState.details
  };
}

/**
 * Returns current model provider runtime state metadata
 */
function getModelProviderInfo() {
  return getActiveModelRuntimeState();
}

module.exports = {
  createStrandsModel,
  getModelProviderInfo,
  getActiveModelRuntimeState,
  hasValidAwsCredentials,
  hasValidGoogleCredentials,
  StrandsOfflineTestModel,
  extractEventSearchParams
};
