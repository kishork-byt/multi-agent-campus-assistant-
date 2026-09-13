/**
 * ORION - Faculty & Staff Specialist Agent
 * Focus: Faculty policies, academic schedules, casual/duty leaves,
 * examination duties, syllabus management, grading guidelines, and staff services.
 */

const Agent = require("./Agent");
const ragService = require("../ragService");
const campusLocationsTool = require("../tools/campusLocationsTool");

class OrionAgent extends Agent {
  constructor() {
    super({
      id: "agent-orion",
      name: "Orion",
      role: "Faculty",
      systemPrompt: `You are Orion, the dedicated Faculty & Staff AI Specialist for the CampusNova Smart Campus platform.
Your objective is to provide professors, instructors, and departmental staff with precise, authoritative, and structured assistance regarding:
- Faculty leave policies (Casual Leave quotas, On-Duty conference permissions, Medical Leave)
- Course syllabus handouts, lesson plans, Bloom's Taxonomy question paper submissions
- Academic calendar, internal assessment deadlines, grade submission protocols
- Examination invigilation duties, revaluation guidelines
- Department laboratories, compute servers, research grant applications
- Faculty services, parking allocations, and administrative approvals

CRITICAL GROUNDING RULES:
1. Ground your answers strictly on the retrieved Faculty Regulations and Campus Knowledge Base excerpts.
2. Never invent leave quotas, administrative deadlines, or department procedures.
3. If official policy details are not present in the retrieved context, acknowledge the gap and advise escalating via the Faculty Service Desk.
4. Format responses professionally with clear headings, bullet points, and step-by-step procedures.`,
      allowedTools: ["rag_knowledge_search", "campus_locations", "create_service_request"],
      knowledgeScope: "Faculty and Staff academic management and service regulations",
      permissions: ["faculty:read", "faculty:manage", "service_request:create"]
    });
  }

  async process({ message, userId, role = "staff", history = [] }) {
    const lower = message.toLowerCase();

    // 1. Check for Campus Location / Venue Query
    const locationKeywords = ["where is", "venue", "seminar hall", "lab", "conference room", "faculty parking", "auditorium"];
    const isLocationQuery = locationKeywords.some(k => lower.includes(k));

    let locationContext = "";
    let matchedLocations = [];
    if (isLocationQuery) {
      matchedLocations = campusLocationsTool.searchLocations(message);
      if (matchedLocations.length > 0) {
        locationContext = campusLocationsTool.formatForAgent(matchedLocations.slice(0, 2));
      }
    }

    // 2. Perform Role-Governed RAG Knowledge Retrieval for Faculty
    const ragResult = await ragService.retrieveKnowledge(message, {
      role: "staff",
      limit: 3,
      minSimilarity: 0.28
    });

    const hasRagContext = !!ragResult.context.trim();
    const hasLocationContext = !!locationContext.trim();

    // 3. Formulate Prompt with Grounded Context
    let promptWithContext = "";
    if (hasLocationContext && hasRagContext) {
      promptWithContext = `Faculty Query: "${message}"\n\nCampus Facility Directory:\n${locationContext}\n\nOfficial Faculty & Academic Policies:\n${ragResult.context}\n\nPlease synthesize a clear, comprehensive response for the faculty member based on the official data above.`;
    } else if (hasLocationContext) {
      promptWithContext = `Faculty Query: "${message}"\n\nCampus Facility Directory:\n${locationContext}\n\nPlease provide venue specifications, operating hours, and location based strictly on the directory above.`;
    } else if (hasRagContext) {
      promptWithContext = `Faculty Query: "${message}"\n\nRetrieved Official University Policies:\n${ragResult.context}\n\nPlease provide an authoritative, grounded response addressing the faculty query directly based on the policies above.`;
    } else {
      promptWithContext = `Faculty Query: "${message}"\n\nNote: No matching official documents were found in the faculty knowledge base.\nPlease politely inform the faculty member and suggest raising a departmental service request.`;
    }

    // 4. Generate LLM Grounded Answer
    let answer = "";
    try {
      answer = await this.llmProvider.generateResponse({
        prompt: promptWithContext,
        systemPrompt: this.systemPrompt,
        temperature: 0.3
      });
    } catch (err) {
      console.warn("[OrionAgent] LLM Generation error, using grounded fallback synthesis:", err.message);
      if (hasLocationContext) {
        answer = `### Faculty Facility Information\n\n${locationContext}`;
      } else if (hasRagContext) {
        answer = `### Official Faculty Policy Guidelines\n\nBased on official university records:\n\n${ragResult.chunks.map(c => c.content).join("\n\n")}`;
      } else {
        answer = "I could not locate the required faculty regulation in the knowledge base. Would you like to create a service request for the Dean of Faculty Affairs?";
      }
    }

    // 5. Build Sources
    const sources = [...ragResult.sources];
    if (matchedLocations.length > 0) {
      sources.unshift({
        documentId: matchedLocations[0].id,
        title: `${matchedLocations[0].name} Directory`,
        category: "Campus Facilities",
        source: "University Infrastructure Directory",
        department: matchedLocations[0].building,
        excerpt: `${matchedLocations[0].building}, ${matchedLocations[0].floor} • ${matchedLocations[0].operatingHours}`
      });
    }

    const confidence = (hasRagContext || hasLocationContext) ? Math.max(0.85, ragResult.confidence) : 0.35;
    const requiresHumanSupport = ragResult.requiresHumanSupport && !hasLocationContext;

    return this.formatResponse({
      answer,
      sources,
      confidence,
      requiresHumanSupport,
      toolOutputs: matchedLocations.map(l => ({ tool: "campus_locations", result: l.name }))
    });
  }
}

module.exports = new OrionAgent();
