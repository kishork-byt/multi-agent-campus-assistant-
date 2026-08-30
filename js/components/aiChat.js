/* ==========================================================================
   COLLEGE AI ASSISTANT - AI CHAT COMPONENT
   ========================================================================== */

const AIChatComponent = {
  currentRole: 'student',

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
                <span style="width: 6px; height: 6px; background: currentColor; border-radius: 50%;"></span> Online • Campus Fine-tuned GPT-4o Engine
              </p>
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-secondary btn-sm" onclick="AIChatComponent.clearChat()">
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
          <input type="text" id="chat-user-input" class="input-field" placeholder="Ask anything about courses, exams, assignments, or college policies..." onkeypress="if(event.key==='Enter') AIChatComponent.handleInputSubmit()">
          <button class="btn-icon" title="Voice Input Simulation" onclick="AIChatComponent.simulateVoiceInput()">
            <i data-lucide="mic"></i>
          </button>
          <button class="btn btn-primary" onclick="AIChatComponent.handleInputSubmit()">
            <i data-lucide="send"></i>
          </button>
        </div>
      </div>
    `;
  },

  handleInputSubmit: function() {
    const inputEl = document.getElementById('chat-user-input');
    const text = inputEl ? inputEl.value.trim() : '';
    if (!text) return;

    this.sendMessage(text);
    if (inputEl) inputEl.value = '';
  },

  sendMessage: function(text) {
    const body = document.getElementById('chat-messages-body');
    if (!body) return;

    // Save & render user message
    Store.addAIChatMessage(this.currentRole, 'user', text);

    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble chat-bubble-user';
    userBubble.innerText = text;
    body.appendChild(userBubble);
    body.scrollTop = body.scrollHeight;

    // Simulated Typing AI Response based on Role & Query
    setTimeout(() => {
      let aiReply = "I have processed your query regarding: '" + text + "'. Based on your course syllabus and university datastore, here is the requested information.";
      const t = text.toLowerCase();

      if (this.currentRole === 'student') {
        if (t.includes('quiz') || t.includes('cs-401')) {
          aiReply = "<strong>CS-401 Quiz 3 Study Breakdown:</strong><br>1. Autonomous Agent Control Loops<br>2. Vector Embeddings & RAG Architectures<br>3. Context Window Optimization & Fine-Tuning. Recommended textbook: Chapter 7 & 8.";
        } else if (t.includes('tomorrow') || t.includes('classes') || t.includes('schedule')) {
          aiReply = "<strong>Tomorrow's Schedule:</strong><br>• 10:00 AM - CS-308 Data Structures (Auditorium B)<br>• 01:00 PM - MATH-201 Linear Algebra (Room 102). Your homework submission for MATH-201 is due by midnight.";
        }
      } else if (this.currentRole === 'staff') {
        if (t.includes('quiz') || t.includes('convolutional')) {
          aiReply = "<strong>Generated 5-Question Quiz on CNNs:</strong><br>1. What is the purpose of Max Pooling layers?<br>2. Explain the receptive field calculation.<br>3. How does stride affect output spatial dimensions?<br>4. Compare 1x1 convolutions vs depthwise separable convolutions.<br>5. What causes gradient vanishing in deep CNNs?";
        }
      } else if (this.currentRole === 'admin') {
        if (t.includes('attendance') || t.includes('report')) {
          aiReply = "<strong>Monthly Campus Attendance Report Summary:</strong><br>• Overall Attendance: 95.1%<br>• Highest Attendance Department: Biotechnology (97.2%)<br>• Active AI Assistant Sessions: 14,280 queries / day.";
        }
      }

      Store.addAIChatMessage(this.currentRole, 'ai', aiReply);

      const aiBubble = document.createElement('div');
      aiBubble.className = 'chat-bubble chat-bubble-ai';
      aiBubble.innerHTML = aiReply;
      body.appendChild(aiBubble);
      body.scrollTop = body.scrollHeight;

      if (window.lucide) lucide.createIcons();
    }, 500);
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
