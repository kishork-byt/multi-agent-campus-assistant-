const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const AiService = {
  /**
   * Role-specific system instructions for the AI Assistant.
   */
  systemInstructions: {
    staff: `You are the official Faculty & Staff AI Assistant for a modern university portal. You assist professors, instructors, and university staff with course development, syllabus design, assignment creation, grading rubrics, student communications, research support, teaching support, quiz generation, lab work guidance, and academic explanations. Provide clear, well-structured, professional, and directly relevant answers. If asked for specific private campus data or student records that are not provided in context, clearly state that internal university databases are not connected rather than inventing fake data.`,
    student: `You are the official Student AI Assistant for a modern university portal. You assist students with course topics, concepts, study strategies, lab assignments, and academic questions. Provide clear, encouraging, educational, and easy-to-understand explanations.`,
    admin: `You are the official University Admin AI Copilot. You assist university administrators with departmental management, policy formulation, faculty analytics, campus operations, and academic governance. Provide concise, professional, data-informed insights.`
  },

  /**
   * Sanitizes conversation history to strictly comply with Gemini API multi-turn constraints:
   * 1. Roles must be 'user' or 'model'.
   * 2. History must start with 'user'.
   * 3. History must strictly alternate between 'user' and 'model'.
   * 4. History must end with 'model' (since the current prompt will be sent via sendMessage).
   */
  sanitizeGeminiHistory: function(history, currentPrompt) {
    if (!Array.isArray(history) || history.length === 0) {
      return [];
    }

    const cleanHistory = [];
    const promptText = (currentPrompt || '').trim().toLowerCase();

    for (let i = 0; i < history.length; i++) {
      const item = history[i];
      if (!item || !item.text) continue;

      const rawText = item.text.replace(/<[^>]*>/g, '').trim();
      if (!rawText) continue;

      // Skip current prompt if it was already saved as the last user message in history
      if (i === history.length - 1 && item.sender === 'user' && rawText.toLowerCase() === promptText) {
        continue;
      }

      const gRole = item.sender === 'user' ? 'user' : 'model';

      if (cleanHistory.length === 0) {
        // Gemini history MUST start with 'user'
        if (gRole === 'user') {
          cleanHistory.push({ role: 'user', parts: [{ text: rawText }] });
        }
      } else {
        const lastRole = cleanHistory[cleanHistory.length - 1].role;
        if (gRole !== lastRole) {
          cleanHistory.push({ role: gRole, parts: [{ text: rawText }] });
        } else {
          // Combine adjacent turns of the same role
          cleanHistory[cleanHistory.length - 1].parts[0].text += "\n" + rawText;
        }
      }
    }

    // History must end with 'model' so the new prompt from chat.sendMessage(prompt) is 'user'
    if (cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === 'user') {
      cleanHistory.pop();
    }

    return cleanHistory;
  },

  /**
   * Generates dynamic AI response for a user query using real AI model integration.
   * @param {Object} options
   * @param {string} options.message User prompt message
   * @param {string} options.role Role context ('staff' | 'student' | 'admin')
   * @param {Array} options.history Conversation history
   * @returns {Promise<string>} AI generated response text
   */
  generateResponse: async function({ message, role = 'staff', history = [] }) {
    const prompt = (message || '').trim();
    if (!prompt) {
      return "Please enter a question or prompt for the AI Assistant.";
    }

    const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.AI_API_KEY || '').trim();

    if (!apiKey) {
      console.warn("AI API Key missing in backend environment.");
      return "AI Assistant Error: GEMINI_API_KEY is not configured in the backend environment (.env). Please set GEMINI_API_KEY in backend/.env to enable live AI responses.";
    }

    const roleKey = (role && this.systemInstructions[role]) ? role : 'staff';
    const sysInstruction = this.systemInstructions[roleKey];

    // Format and sanitize chat history into Gemini format
    const formattedHistory = this.sanitizeGeminiHistory(history, prompt);

    const modelsToTry = ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.1-flash-lite", "gemini-2.0-flash"];
    let lastError = null;

    const genAI = new GoogleGenerativeAI(apiKey);

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: sysInstruction
        });

        // Try startChat with history if available
        if (formattedHistory.length > 0) {
          try {
            const chat = model.startChat({ history: formattedHistory });
            const result = await chat.sendMessage(prompt);
            const response = await result.response;
            const text = response.text();
            if (text && text.trim()) {
              return text.trim();
            }
          } catch (chatErr) {
            console.warn(`Chat with history failed on model ${modelName}, falling back to single prompt generation:`, chatErr.message);
          }
        }

        // Single generation fallback
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        if (text && text.trim()) {
          return text.trim();
        }
      } catch (err) {
        console.warn(`Gemini model ${modelName} call failed:`, err.message);
        lastError = err;
      }
    }

    return `AI Assistant Error: Failed to generate response from configured AI models. ${lastError ? lastError.message : ''}`;
  }
};

module.exports = AiService;

