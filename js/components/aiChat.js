/* ==========================================================================
   COLLEGE AI ASSISTANT - AI CHAT COMPONENT
   ========================================================================== */

const AIChatComponent = {
  currentRole: 'student',
  isProcessing: false,

  render: function(role) {
    this.currentRole = role;
    const history = Store.getAIChatHistory(role);
    const prompts = MockData.aiPrompts[role] || MockData.aiPrompts.student;

    return `
      <div class="chat-container">
        <!-- Header -->
        <div style="padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary);">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div class="brand-icon" style="width: 38px; height: 38px;">
              <i data-lucide="sparkles"></i>
            </div>
            <div>
              <h3 style="font-size: 1rem; font-weight: 700;">College AI Copilot (${role.toUpperCase()})</h3>
              <p style="font-size: 0.75rem; color: var(--status-success); display: flex; align-items: center; gap: 0.3rem;">
                <span style="width: 6px; height: 6px; background: currentColor; border-radius: 50%;"></span> Online • Conversational LLM Engine
              </p>
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-secondary btn-sm" id="btn-reset-chat" onclick="AIChatComponent.clearChat()">
              <i data-lucide="rotate-ccw"></i> Reset History
            </button>
          </div>
        </div>

        <!-- Chat Scroll Area -->
        <div class="chat-messages" id="chat-messages-body">
          ${history.map(msg => `
            <div class="chat-bubble ${msg.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}">
              ${msg.text}
            </div>
          `).join('')}
        </div>

        <!-- Quick Prompts bar -->
        <div style="padding: 0.75rem 1.5rem; background: var(--bg-main); border-top: 1px solid var(--border-color); display: flex; gap: 0.5rem; overflow-x: auto;">
          <span style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); align-self: center; white-space: nowrap;">Suggestions:</span>
          ${prompts.map(p => `
            <button class="btn btn-secondary btn-sm" style="font-size: 0.75rem; border-radius: 20px;" onclick="AIChatComponent.sendMessage('${p.replace(/'/g, "\\'")}')">
              <i data-lucide="corner-down-right"></i> ${p}
            </button>
          `).join('')}
        </div>

        <!-- Input Bar -->
        <div class="chat-input-bar">
          <button class="btn-icon" title="Attach PDF/Document" onclick="alert('Document upload simulation: PDF attached for AI processing.')">
            <i data-lucide="paperclip"></i>
          </button>
          <input type="text" id="chat-user-input" class="input-field" placeholder="Ask anything about courses, exams, assignments, or college policies..." onkeydown="if(event.key==='Enter' && !event.shiftKey){ event.preventDefault(); AIChatComponent.handleInputSubmit(); }">
          <button class="btn-icon" title="Voice Input Simulation" onclick="AIChatComponent.simulateVoiceInput()">
            <i data-lucide="mic"></i>
          </button>
          <button class="btn btn-primary" id="chat-send-btn" onclick="AIChatComponent.handleInputSubmit()">
            <i data-lucide="send"></i>
          </button>
        </div>
      </div>
    `;
  },

  handleInputSubmit: function() {
    if (this.isProcessing) return;
    const inputEl = document.getElementById('chat-user-input');
    const text = inputEl ? inputEl.value.trim() : '';
    if (!text) return;

    this.sendMessage(text);
    if (inputEl) inputEl.value = '';
  },

  formatMarkdown: function(text) {
    if (!text) return '';
    if (text.includes('<strong>') || text.includes('<br>')) return text;
    return text
      .replace(/^### (.*$)/gim, '<strong style="display:block; font-size:1rem; margin-top:0.4rem; margin-bottom:0.2rem; color:var(--primary-400);">$1</strong>')
      .replace(/^#### (.*$)/gim, '<strong style="display:block; font-size:0.92rem; margin-top:0.3rem;">$1</strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '• $1')
      .replace(/\n/g, '<br>');
  },

  setProcessingState: function(processing) {
    this.isProcessing = processing;
    const inputEl = document.getElementById('chat-user-input');
    const sendBtn = document.getElementById('chat-send-btn');
    if (inputEl) inputEl.disabled = processing;
    if (sendBtn) sendBtn.disabled = processing;
  },

  sendMessage: async function(text) {
    if (this.isProcessing) return;
    const body = document.getElementById('chat-messages-body');
    if (!body) return;

    this.setProcessingState(true);

    // Save & render user message
    Store.addAIChatMessage(this.currentRole, 'user', text);

    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble chat-bubble-user';
    userBubble.innerText = text;
    body.appendChild(userBubble);
    body.scrollTop = body.scrollHeight;

    // Render typing indicator bubble
    const typingBubble = document.createElement('div');
    typingBubble.className = 'chat-bubble chat-bubble-ai';
    typingBubble.id = 'ai-typing-indicator';
    typingBubble.innerHTML = '<i data-lucide="sparkles" style="width:14px; height:14px; animation: spin 2s linear infinite;"></i> <span style="opacity: 0.8;">AI Assistant is thinking...</span>';
    body.appendChild(typingBubble);
    body.scrollTop = body.scrollHeight;
    if (window.lucide) lucide.createIcons();

    try {
      // Call backend API via Store
      const res = await Store.sendAIChatMessage(this.currentRole, text);

      // Remove typing bubble
      const currentTyping = document.getElementById('ai-typing-indicator');
      if (currentTyping) currentTyping.remove();

      let aiReply = '';
      if (res.success && res.reply) {
        aiReply = this.formatMarkdown(res.reply);
      } else {
        aiReply = `<span style="color: var(--status-danger);"><i data-lucide="alert-triangle" style="width:14px; height:14px; vertical-align:middle;"></i> ${res.error || 'The AI Assistant is currently unavailable. Please try again.'}</span>`;
      }

      Store.addAIChatMessage(this.currentRole, 'ai', aiReply);

      const aiBubble = document.createElement('div');
      aiBubble.className = 'chat-bubble chat-bubble-ai';
      aiBubble.innerHTML = aiReply;
      body.appendChild(aiBubble);
      body.scrollTop = body.scrollHeight;

      if (window.lucide) lucide.createIcons();
    } finally {
      this.setProcessingState(false);
      const inputEl = document.getElementById('chat-user-input');
      if (inputEl) inputEl.focus();
    }
  },

  simulateVoiceInput: function() {
    const inputEl = document.getElementById('chat-user-input');
    if (inputEl) {
      inputEl.value = "What is the deadline for CS-401 Senior Project?";
      this.handleInputSubmit();
    }
  },

  clearChat: function() {
    Store.clearAIChatHistory(this.currentRole);
    App.renderCurrentView();
  }
};

