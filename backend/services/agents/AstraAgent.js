/**
 * ASTRA - Student Specialist Agent
 * Focus: Academic queries, examination guidelines, attendance criteria,
 * library resources, hostel rules, transport, bonafide certificates, and student services.
 */

const Agent = require("./Agent");
const ragService = require("../ragService");
const campusLocationsTool = require("../tools/campusLocationsTool");

class AstraAgent extends Agent {
  constructor() {
    super({
      id: "agent-astra",
      name: "Astra",
      role: "Student",
      systemPrompt: `You are Astra, the dedicated Student AI Specialist for the CampusNova Smart Campus platform.
Your objective is to provide students with accurate, official, empathetic, and structured guidance regarding:
- Academic regulations, minimum attendance criteria (75%), CGPA calculation
- End-semester exams, hall tickets, revaluation procedures
- Bonafide, conduct, and student certificate application processes
- University library rules, borrowing quotas, study hours
- Hostel rules, night curfew, leave outpass requests, mess hours
- Campus transport, bus routes, parking zones
- Scholarships, financial assistance, placement eligibility
- Campus buildings, laboratories, and student facilities

CRITICAL GROUNDING RULES:
1. Ground your answers strictly on the retrieved Campus Knowledge Base excerpts provided.
2. Never invent policies, fees, dates, or regulations.
3. If the official information is not available in the retrieved context, state clearly: "I could not locate the official university policy regarding this inquiry in the student knowledge base." and suggest raising a service request.
4. Format responses cleanly using Markdown headers, bullet points, and bold text.`,
      allowedTools: ["rag_knowledge_search", "campus_locations", "create_service_request"],
      knowledgeScope: "Student-accessible campus regulations and services",
      permissions: ["student:read", "service_request:create"]
    });
  }

  async process({ message, userId, role = "student", history = [] }) {
    const lower = message.toLowerCase();

    // 1. Check if this is a Campus Location Query
    const locationKeywords = ["where is", "location of", "how to reach", "directions to", "building", "which block", "which floor", "room"];
    const isLocationQuery = locationKeywords.some(k => lower.includes(k));

    let locationContext = "";
    let matchedLocations = [];
    if (isLocationQuery) {
      matchedLocations = campusLocationsTool.searchLocations(message);
      if (matchedLocations.length > 0) {
        locationContext = campusLocationsTool.formatForAgent(matchedLocations.slice(0, 2));
      }
    }

    // 2. Perform Role-Governed RAG Knowledge Retrieval
    const ragResult = await ragService.retrieveKnowledge(message, {
      role: "student",
      limit: 3,
      minSimilarity: 0.28
    });

    const hasRagContext = !!ragResult.context.trim();
    const hasLocationContext = !!locationContext.trim();

    // 3. Formulate Prompt with Grounded Context
    let promptWithContext = "";
    if (hasLocationContext && hasRagContext) {
      promptWithContext = `User Query: "${message}"\n\nOfficial Campus Location Directory:\n${locationContext}\n\nOfficial Campus Policy Context:\n${ragResult.context}\n\nPlease synthesize a clear, comprehensive, and grounded answer for the student based on the official data above.`;
    } else if (hasLocationContext) {
      promptWithContext = `User Query: "${message}"\n\nOfficial Campus Location Directory:\n${locationContext}\n\nPlease provide precise directions, floor details, and operating hours based strictly on the location directory above.`;
    } else if (hasRagContext) {
      promptWithContext = `User Query: "${message}"\n\nRetrieved Official Campus Policies:\n${ragResult.context}\n\nPlease provide an accurate, grounded answer addressing the student's question directly based only on the retrieved policies.`;
    } else {
      promptWithContext = `User Query: "${message}"\n\nNote: No matching official documents were found in the student knowledge base.\nPlease politely inform the student that this specific policy is not yet indexed in the knowledge base, and advise them to create a service request for human support.`;
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
      console.warn("[AstraAgent] LLM Generation error, using grounded fallback synthesis:", err.message);
      if (hasLocationContext) {
        answer = `### Campus Location Details\n\n${locationContext}\n\n*You can view this on the Interactive Campus Map in the student portal.*`;
      } else if (hasRagContext) {
        answer = `### Official Campus Information\n\nBased on official university records:\n\n${ragResult.chunks.map(c => c.content).join("\n\n")}`;
      } else {
        answer = "I could not find the required official information in the campus knowledge base. Would you like to raise a service request with the student administration helpdesk?";
      }
    }

    // 5. Build Sources & Location Citations
    const sources = [...ragResult.sources];
    if (matchedLocations.length > 0) {
      sources.unshift({
        documentId: matchedLocations[0].id,
        title: `${matchedLocations[0].name} Directory`,
        category: "Campus Facilities",
        source: "Campus Infrastructure Directory",
        department: matchedLocations[0].building,
        excerpt: `${matchedLocations[0].building}, ${matchedLocations[0].floor} • ${matchedLocations[0].operatingHours}`
      });
    }

    // 6. Compute Confidence & Escalation requirement
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

module.exports = new AstraAgent();
