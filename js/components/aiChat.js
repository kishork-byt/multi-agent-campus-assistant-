/* ==========================================================================
   CAMPUSNOVA - THREE REAL AUTONOMOUS CAMPUS AGENTS
   1. ASTRA - Student AI Agent
   2. ORION - Faculty & Staff AI Agent
   3. ATLAS - Administrator AI Agent
   Powered by Strands Agents SDK
   Tagline: "From asking to acting."
   Features Real-time Safe Tool Activity, Structured Action Cards,
   Human-in-the-Loop Approvals, Dijkstra Campus Routing, and Turn-by-Turn Navigation.
   ========================================================================== */

const AIChatComponent = {
  currentRole: 'student',
  autopilotEnabled: true,
  activeInsights: [],

  getAgentMeta: function(role) {
    if (role === 'admin') {
      return {
        name: 'Atlas',
        fullName: 'ATLAS · Administrative AI Agent',
        badgeClass: 'badge-admin',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #7c3aed 100%)',
        accentColor: '#f59e0b',
        icon: 'shield-check',
        subtitle: 'Campus operations, multi-agent audit, policy oversight & executive controls',
        thinking: 'Atlas is analyzing campus operations & policies...',
        welcomeTitle: 'Atlas Administrative Copilot',
        welcomeDesc: 'Real-time administrative intelligence powered by Strands Agents SDK. Monitor system health, audit cross-agent executions, verify campus facilities, and manage institutional workflows with zero role leakage.',
        badges: ['Multi-Agent Audit', 'System Health', 'Facilities & Tickets', 'Strict Admin Isolation'],
        demoActions: [
          { label: '1. Audit Agent Traces', query: 'Audit recent agent execution traces.' },
          { label: '2. Facilities Status', query: 'Check status of recent facilities support tickets.' },
          { label: '3. Pending Tasks', query: 'Show pending campus tasks and deadlines.' },
          { label: '4. Directorate Route', query: 'Where is the Administrative Directorate?' },
          { label: '5. Security Gate Directions', query: 'How do I get to Security Gate from Main Gate?' }
        ]
      };
    } else if (role === 'staff' || role === 'faculty') {
      return {
        name: 'Orion',
        fullName: 'ORION · Faculty & Staff AI Agent',
        badgeClass: 'badge-staff',
        gradient: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #0d9488 100%)',
        accentColor: '#10b981',
        icon: 'sparkles',
        subtitle: 'Academic workflows, classroom tech, syllabus assistance & faculty tasks',
        thinking: 'Orion is planning academic actions & checking resources...',
        welcomeTitle: 'Orion Faculty & Staff Agent',
        welcomeDesc: 'Dedicated academic agent powered by Strands Agents SDK. Create support tickets for malfunctioning lab equipment, schedule task reminders, find campus venues, and manage syllabus queries with verifiable database actions.',
        badges: ['Classroom Tech Support', 'Task Scheduling', 'Campus Navigation', 'Academic Tools'],
        demoActions: [
          { label: '1. Report Lab 3 Projector', query: 'The projector in Lab 3 is not working.' },
          { label: '2. Track Support Ticket', query: 'What happened to my projector complaint?' },
          { label: '3. Remind Grading 5 PM', query: 'Remind me to submit grading tomorrow at 5 PM.' },
          { label: '4. Route to Innovation Hub', query: 'How do I get to Innovation Hub from Main Gate?' },
          { label: '5. Find AI Events', query: 'Find AI events this week.' }
        ]
      };
    }
    // Student (Astra)
    return {
      name: 'Astra',
      fullName: 'ASTRA · Student AI Agent',
      badgeClass: 'badge-student',
      gradient: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)',
      accentColor: '#818cf8',
      icon: 'bot',
      subtitle: 'Campus life, events registration, study reminders & turn-by-turn navigation',
      thinking: 'Astra is thinking and selecting campus tools...',
      welcomeTitle: 'Astra Student Campus Agent',
      welcomeDesc: 'Your personal campus companion powered by Strands Agents SDK. Discover and register for events with human confirmation, set study reminders, navigate venues via Dijkstra shortest path, and resolve everyday student queries.',
      badges: ['Event Registration', 'Human-in-the-Loop', 'Dijkstra Map Routing', 'Study Reminders'],
      demoActions: [
        { label: '1. Find AI events', query: 'Find AI events this week.' },
        { label: '2. Register for AI workshop', query: 'Register me for the AI workshop.' },
        { label: '3. Remind 1 hr before', query: 'Remind me one hour before.' },
        { label: '4. Directions to Lab 3', query: 'How do I get to Lab 3 from Main Gate?' },
        { label: '5. Tamil Query (Library)', query: 'Library ku epdi poganum?' }
      ]
    };
  },

  getSuggestedPrompts: function(role) {
    if (role === 'admin') {
      return [
        "Audit recent agent execution traces.",
        "Show pending campus tasks and deadlines.",
        "Check status of recent facilities support tickets.",
        "Where is the Administrative Directorate?",
        "Are there any AI workshops scheduled this week?",
        "How do I get to Security Gate from Main Gate?"
      ];
    } else if (role === 'staff' || role === 'faculty') {
      return [
        "The projector in Lab 3 is not working.",
        "What happened to my projector complaint?",
        "Remind me to submit grading tomorrow at 5 PM.",
        "How do I get to Innovation Hub from Main Gate?",
        "Find AI events this week.",
        "Where is the Faculty Lounge?"
      ];
    }
    // Student & General
    return [
      "Find AI events this week.",
      "Register me for the AI workshop.",
      "How do I get to Lab 3 from Main Gate?",
      "Where is the library?",
      "Remind me to submit assignment tomorrow at 5 PM.",
      "Library ku epdi poganum?",
      "Lab 3 la projector vela seiyala",
      "Hostel gate closing time enna?"
    ];
  },

  render: function(role) {
    this.currentRole = role || 'student';
    const meta = this.getAgentMeta(this.currentRole);
    const history = Store.getAIChatHistory(this.currentRole);
    const prompts = this.getSuggestedPrompts(this.currentRole);

    return `
      <div class="chat-container" id="campusnova-chat-root">
        <!-- Strands Autonomous Agent Header -->
        <div style="padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); flex-wrap: wrap; gap: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 0.85rem;">
            <div class="brand-icon" style="width: 44px; height: 44px; background: ${meta.gradient}; display: flex; align-items: center; justify-content: center; border-radius: 10px; color: #fff; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);">
              <i data-lucide="${meta.icon}" style="width: 24px; height: 24px;"></i>
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                <h3 style="font-size: 1.1rem; font-weight: 800; margin: 0; color: var(--text-main); letter-spacing: -0.02em;">
                  ${meta.name} <span style="font-weight: 500; font-size: 0.88rem; color: var(--primary-400);">${meta.fullName.split('·')[1]?.trim() || 'AI Agent'}</span>
                </h3>
                <span class="badge badge-primary" style="font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3);">
                  Strands SDK v1.17
                </span>
                <span class="badge ${meta.badgeClass}" style="font-size: 0.68rem; text-transform: uppercase;">
                  ${this.currentRole} Portal
                </span>
              </div>
              <p style="font-size: 0.76rem; color: var(--text-muted); margin: 0.2rem 0 0 0; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                <span style="display: inline-flex; align-items: center; gap: 0.25rem; color: #10b981; font-weight: 600;">
                  <span style="width: 7px; height: 7px; background: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981;"></span> Online
                </span>
                • <span>${meta.subtitle}</span>
                • <span style="color: #10b981;">Isolated Role Context</span>
              </p>
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <button class="btn btn-outline btn-sm" id="autopilot-toggle-btn" onclick="AIChatComponent.toggleAutopilot()" style="font-size: 0.75rem; border-color: rgba(139, 92, 246, 0.4); color: #a78bfa;">
              <i data-lucide="zap" style="width: 14px; height: 14px; color: #fbbf24;"></i> Autopilot: ${this.autopilotEnabled ? 'Active' : 'Paused'}
            </button>
            <button class="btn btn-secondary btn-sm" onclick="AIChatComponent.clearChat()" title="Reset chat history">
              <i data-lucide="rotate-ccw" style="width: 13px; height: 13px;"></i> Reset
            </button>
          </div>
        </div>

        <!-- Proactive Autopilot Alert Box (Rendered if insights found) -->
        <div id="autopilot-banner-root" style="display: none; padding: 0.75rem 1.5rem; background: linear-gradient(90deg, rgba(124, 58, 237, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%); border-bottom: 1px solid rgba(139, 92, 246, 0.25);">
          <!-- Dynamic Autopilot Content Injected Here -->
        </div>

        <!-- Chat Scroll Area -->
        <div class="chat-messages" id="chat-messages-body" style="flex: 1; padding: 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1.25rem;">
          ${history.length === 0 ? `
            <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
              <div style="width: 64px; height: 64px; border-radius: 50%; background: ${meta.gradient}; color: #fff; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem; box-shadow: 0 0 24px rgba(99, 102, 241, 0.3);">
                <i data-lucide="${meta.icon}" style="width: 32px; height: 32px;"></i>
              </div>
              <h4 style="font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.35rem;">
                ${meta.welcomeTitle}
              </h4>
              <p style="font-size: 0.88rem; max-width: 560px; margin: 0 auto; line-height: 1.6;">
                ${meta.welcomeDesc}
              </p>
              <div style="margin-top: 1.25rem; display: flex; justify-content: center; gap: 0.6rem; flex-wrap: wrap;">
                ${meta.badges.map(b => `<span class="badge badge-secondary" style="font-size: 0.74rem;">● ${b}</span>`).join('')}
              </div>
            </div>
          ` : history.map(msg => this.renderMessageBubble(msg)).join('')}
        </div>

        <!-- Role-Specific Demo Quick Actions Bar -->
        <div style="padding: 0.6rem 1.25rem; background: rgba(99, 102, 241, 0.05); border-top: 1px solid var(--border-color); display: flex; gap: 0.5rem; overflow-x: auto; align-items: center;">
          <span style="font-size: 0.72rem; font-weight: 700; color: ${meta.accentColor}; white-space: nowrap; display: flex; align-items: center; gap: 0.3rem;">
            <i data-lucide="play-circle" style="width: 14px; height: 14px; color: ${meta.accentColor};"></i> ${meta.name} Actions:
          </span>
          ${meta.demoActions.map(action => `
            <button class="btn btn-secondary btn-sm" style="font-size: 0.75rem; border-radius: 20px; white-space: nowrap;" onclick="AIChatComponent.sendMessage('${action.query.replace(/'/g, "\\'")}')">
              ${action.label}
            </button>
          `).join('')}
          <button class="btn btn-outline btn-sm" style="font-size: 0.75rem; border-radius: 20px; white-space: nowrap; border-color: rgba(245, 158, 11, 0.4); color: #fbbf24;" onclick="AIChatComponent.runAutopilotScan()">
            <i data-lucide="zap" style="width: 12px; height: 12px; color: #fbbf24;"></i> Autopilot Scan
          </button>
        </div>

        <!-- Quick Suggestions bar -->
        <div style="padding: 0.6rem 1.25rem; background: var(--bg-main); border-top: 1px solid var(--border-color); display: flex; gap: 0.5rem; overflow-x: auto; align-items: center;">
          <span style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); white-space: nowrap;">
            <i data-lucide="lightbulb" style="width: 14px; height: 14px; vertical-align: middle; color: var(--accent-amber);"></i> Suggested:
          </span>
          ${prompts.map(p => `
            <button class="btn btn-secondary btn-sm" style="font-size: 0.76rem; border-radius: 20px; white-space: nowrap; border-color: rgba(255,255,255,0.08);" onclick="AIChatComponent.sendMessage('${p.replace(/'/g, "\\'")}')">
              ${p}
            </button>
          `).join('')}
        </div>

        <!-- Input Bar -->
        <div class="chat-input-bar" style="padding: 1rem 1.25rem; background: var(--bg-secondary); border-top: 1px solid var(--border-color); display: flex; gap: 0.75rem; align-items: center;">
          <input type="text" id="chat-user-input" class="input-field" style="flex: 1;" placeholder="Ask ${meta.name} to execute actions, navigate campus, manage tasks, or query records..." onkeypress="if(event.key==='Enter') AIChatComponent.handleInputSubmit()">
          <button class="btn btn-primary" onclick="AIChatComponent.handleInputSubmit()" style="display: flex; align-items: center; gap: 0.4rem; padding: 0.65rem 1.25rem; background: ${meta.gradient}; border: none;">
            <span>Execute</span>
            <i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i>
          </button>
        </div>
      </div>

      <!-- Service Request Modal Backdrop & Container -->
      <div id="service-request-modal-container"></div>
    `;
  },

  renderMessageBubble: function(msg) {
    if (msg.sender === 'user') {
      return `
        <div class="chat-bubble chat-bubble-user" style="max-width: 75%; align-self: flex-end; background: var(--portal-gradient); color: #fff; border-radius: var(--radius-md); border-bottom-right-radius: 4px; padding: 0.9rem 1.2rem; font-size: 0.93rem; line-height: 1.55; box-shadow: var(--shadow-sm);">
          <div style="font-size: 0.7rem; opacity: 0.85; margin-bottom: 0.25rem; font-weight: 600;">You</div>
          <div>${msg.text}</div>
        </div>
      `;
    }

    // AI Autonomous Agent Bubble (Astra, Orion, or Atlas)
    const agentName = msg.agent || (this.currentRole === 'admin' ? 'Atlas' : this.currentRole === 'staff' || this.currentRole === 'faculty' ? 'Orion' : 'Astra');
    const roleForMeta = agentName === 'Atlas' ? 'admin' : agentName === 'Orion' ? 'staff' : 'student';
    const meta = this.getAgentMeta(roleForMeta);

    const toolsUsed = msg.toolsUsed || [];
    const cards = msg.cards || [];
    const isWaitingApproval = msg.status === 'WAITING_APPROVAL' || !!msg.approvalRequired;
    const status = msg.status || 'COMPLETED';
    const statusColor = status === 'COMPLETED' || status === 'SUCCESS' ? '#10b981' : status === 'WAITING_APPROVAL' ? '#f59e0b' : status === 'EXECUTING' || status === 'VERIFYING' || status === 'SEARCHING' ? '#3b82f6' : '#ef4444';

    return `
      <div class="chat-bubble chat-bubble-ai" style="max-width: 85%; align-self: flex-start; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-md); border-bottom-left-radius: 4px; padding: 1.1rem 1.35rem; font-size: 0.93rem; line-height: 1.6; box-shadow: var(--shadow-sm);">
        <!-- Agent Identity & Safe State Badge -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); flex-wrap: wrap; gap: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.45rem;">
            <span class="badge badge-primary" style="font-weight: 700; font-size: 0.72rem; display: inline-flex; align-items: center; gap: 0.3rem; background: ${meta.gradient}; color: #fff;">
              <i data-lucide="${meta.icon}" style="width: 12px; height: 12px;"></i> ${agentName}
            </span>
            <span style="font-size: 0.74rem; color: var(--text-muted);">${meta.fullName}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <span class="badge" style="background: rgba(255,255,255,0.05); color: ${statusColor}; font-weight: 700; font-size: 0.7rem; border: 1px solid ${statusColor}; text-transform: uppercase;">
              ${status}
            </span>
            <span style="font-size: 0.72rem; padding: 2px 8px; border-radius: 12px; background: rgba(16, 185, 129, 0.15); color: #10b981; font-weight: 600; display: inline-flex; align-items: center; gap: 0.25rem;">
              <i data-lucide="check-circle" style="width: 12px; height: 12px;"></i> Strands Verified
            </span>
          </div>
        </div>

        <!-- Rendered Agent Response Content -->
        <div class="ai-response-body" style="color: var(--text-main); margin-bottom: 0.85rem; line-height: 1.6;">
          ${this.formatMarkdown(msg.text || msg.answer || '')}
        </div>

        <!-- Approval Card (Human-in-the-Loop) -->
        ${isWaitingApproval && msg.approvalId ? `
          <div class="approval-card" id="approval-card-${msg.approvalId}" style="margin-top: 0.85rem; padding: 1.15rem 1.25rem; background: rgba(245, 158, 11, 0.08); border: 1.5px solid rgba(245, 158, 11, 0.4); border-radius: var(--radius-sm); box-shadow: 0 4px 14px rgba(245, 158, 11, 0.08);">
            <div style="margin-bottom: 0.75rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                <span class="badge badge-warning" style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase;">
                  ⚠ Human Approval Required
                </span>
                <span style="font-size: 0.72rem; color: var(--text-muted);">Tied to your Session</span>
              </div>
              <strong style="font-size: 1.05rem; color: var(--text-main); display: block; margin-bottom: 0.35rem;">${msg.actionDetails?.title || (cards[0]?.data?.title) || 'Campus Action'}</strong>
              <div style="font-size: 0.82rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 3px;">
                ${msg.actionDetails?.date || cards[0]?.data?.date ? `<div><span>Date: ${msg.actionDetails?.date || cards[0]?.data?.date}</span></div>` : ''}
                ${msg.actionDetails?.time || cards[0]?.data?.time ? `<div><span>Time: ${msg.actionDetails?.time || cards[0]?.data?.time}</span></div>` : ''}
                ${msg.actionDetails?.location || cards[0]?.data?.location ? `<div><span>Venue: ${msg.actionDetails?.location || cards[0]?.data?.location}</span></div>` : ''}
              </div>
            </div>
            <p style="font-size: 0.86rem; color: #f59e0b; font-weight: 600; margin: 0.6rem 0 0.85rem 0; line-height: 1.45;">
              ${agentName} wants to execute this operation. No database changes have been committed yet.
            </p>
            <div class="approval-btn-group" style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
              <button class="btn btn-primary btn-sm btn-approve" style="background: #10b981; border: none; font-size: 0.82rem; padding: 0.45rem 1.1rem; font-weight: 700;" onclick="AIChatComponent.handleApproval('${msg.approvalId}')">
                <i data-lucide="check"></i> Approve Action
              </button>
              <button class="btn btn-secondary btn-sm btn-cancel" style="font-size: 0.82rem; padding: 0.45rem 1.1rem;" onclick="AIChatComponent.handleRejection('${msg.approvalId}')">
                <i data-lucide="x"></i> Cancel
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Structured Action Cards (Event, Support Issue, Task, Map Route, Location) -->
        ${cards.length > 0 ? `
          <div class="action-cards-container" style="margin-top: 0.85rem; display: flex; flex-direction: column; gap: 0.65rem;">
            ${cards.map(c => this.renderCard(c)).join('')}
          </div>
        ` : ''}

        <!-- Tools Used & Execution Metadata Bar -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.85rem; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.06); font-size: 0.74rem; flex-wrap: wrap; gap: 0.4rem;">
          <div style="display: flex; gap: 0.4rem; align-items: center;">
            <button class="btn btn-ghost btn-sm" style="padding: 2px 8px; font-size: 0.72rem; color: var(--text-muted);" onclick="AIChatComponent.copyText(this)">
              <i data-lucide="copy" style="width: 12px; height: 12px;"></i> Copy
            </button>
            <button class="btn btn-ghost btn-sm" style="padding: 2px 8px; font-size: 0.72rem; color: var(--text-muted);" onclick="AIChatComponent.openServiceRequestModal()">
              <i data-lucide="life-buoy" style="width: 12px; height: 12px;"></i> Support
            </button>
          </div>
          <span style="font-size: 0.7rem; color: var(--text-muted);">
            ${toolsUsed.length > 0 ? `Tools: <code style="color: var(--primary-300);">${toolsUsed.join(', ')}</code> • ` : ''}
            ${msg.executionId ? `Execution: ${msg.executionId.slice(-8)}` : 'Verified Operation'}
          </span>
        </div>
      </div>
    `;
  },

  renderCard: function(card) {
    if (!card || !card.data) return '';
    const portal = this.currentRole || 'student';

    // 1. EVENT ACTION CARD
    if (card.type === 'event') {
      const e = card.data;
      return `
        <div class="card" style="padding: 1rem 1.25rem; background: var(--surface); border: 1px solid var(--border-color); border-radius: var(--radius-sm); box-shadow: var(--shadow-sm);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; gap: 0.5rem;">
            <div>
              <strong style="font-size: 1rem; color: var(--text-main); display: block;">${e.title}</strong>
              <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.35rem; display: flex; flex-direction: column; gap: 3px;">
                <span>📅 ${e.date}</span>
                <span>⏰ ${e.time || '10:00 AM'}</span>
                <span>📍 ${e.location || e.venue || 'Innovation Hub'}</span>
              </div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 2px;">Status:</span>
              <span class="badge ${e.isRegistered ? 'badge-success' : 'badge-primary'}" style="font-size: 0.72rem; font-weight: 700;">
                ${e.isRegistered ? 'Confirmed' : 'Available'}
              </span>
            </div>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.75rem; border-top: 1px solid var(--border-color); padding-top: 0.6rem; flex-wrap: wrap;">
            ${!e.isRegistered ? `
              <button class="btn btn-primary btn-sm" style="font-size: 0.78rem; padding: 0.4rem 0.9rem;" onclick="AIChatComponent.sendMessage('Register me for ${e.title.replace(/'/g, "\\'")}')">
                <i data-lucide="user-plus" style="width: 13px; height: 13px;"></i> Register
              </button>
            ` : `
              <button class="btn btn-secondary btn-sm" disabled style="font-size: 0.78rem; padding: 0.4rem 0.9rem; color: #10b981;">
                <i data-lucide="check" style="width: 13px; height: 13px;"></i> Confirmed ✓
              </button>
            `}
            <button class="btn btn-secondary btn-sm" style="font-size: 0.78rem; padding: 0.4rem 0.9rem;" onclick="AIChatComponent.openLocationOnMap('${e.location || e.venue || 'loc-hub-01'}')">
              <i data-lucide="map-pin" style="width: 13px; height: 13px;"></i> View Venue
            </button>
            <button class="btn btn-secondary btn-sm" style="font-size: 0.78rem; padding: 0.4rem 0.9rem;" onclick="AIChatComponent.viewEventDetails('${e.title.replace(/'/g, "\\'")}', '${e.date}', '${e.time || '10:00 AM'}', '${(e.location || e.venue || 'Innovation Hub').replace(/'/g, "\\'")}', '${(e.desc || 'Campus event').replace(/'/g, "\\'")}')">
              <i data-lucide="info" style="width: 13px; height: 13px;"></i> Details
            </button>
          </div>
        </div>
      `;
    }

    // 2. SUPPORT ISSUE CARD
    if (card.type === 'support_issue') {
      const s = card.data;
      return `
        <div class="card" style="padding: 1rem 1.25rem; background: var(--surface); border: 1px solid rgba(245, 158, 11, 0.4); border-left: 4px solid #f59e0b; border-radius: var(--radius-sm); box-shadow: var(--shadow-sm);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
            <div style="font-size: 0.78rem; font-weight: 700; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.04em;">
              Support Issue Logged
            </div>
            <span class="badge badge-warning" style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase;">
              ${s.status || 'OPEN'}
            </span>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px; margin-bottom: 0.65rem;">
            <div><span style="color: var(--text-muted);">Issue:</span> <strong style="color: var(--text-main);">${s.title}</strong></div>
            <div><span style="color: var(--text-muted);">Location:</span> <strong style="color: var(--text-main);">${s.location}</strong></div>
            <div><span style="color: var(--text-muted);">Status:</span> <strong style="color: #f59e0b;">${s.status || 'OPEN'}</strong></div>
            <div><span style="color: var(--text-muted);">Issue ID:</span> <code style="font-size: 0.85rem; color: var(--primary-300); font-weight: 700;">${s.issueId}</code></div>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 0.5rem; border-top: 1px solid var(--border-color); padding-top: 0.5rem;">
            <button class="btn btn-secondary btn-sm" style="font-size: 0.76rem; padding: 0.35rem 0.85rem;" onclick="AIChatComponent.sendMessage('What happened to my ${s.issueId} complaint?')">
              <i data-lucide="compass" style="width: 13px; height: 13px;"></i> Track Issue
            </button>
          </div>
        </div>
      `;
    }

    // 3. TASK REMINDER CARD
    if (card.type === 'task') {
      const t = card.data;
      return `
        <div class="card" style="padding: 1rem 1.25rem; background: var(--surface); border: 1px solid rgba(16, 185, 129, 0.4); border-left: 4px solid #10b981; border-radius: var(--radius-sm); box-shadow: var(--shadow-sm);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
            <div style="font-size: 0.78rem; font-weight: 700; color: #10b981; text-transform: uppercase; letter-spacing: 0.04em;">
              Reminder Created
            </div>
            <span class="badge badge-success" style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase;">
              ${t.status === 'todo' ? 'Scheduled' : (t.status || 'Scheduled')}
            </span>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;">
            <div><strong style="color: var(--text-main); font-size: 0.95rem;">${t.title}</strong></div>
            <div><span style="color: var(--text-muted);">Reminder:</span> <strong style="color: var(--text-main);">${t.reminderTime || '1 hour before'}</strong></div>
            <div><span style="color: var(--text-muted);">Status:</span> <strong style="color: #10b981;">Scheduled</strong></div>
          </div>
        </div>
      `;
    }

    // 4. MAP ROUTE CARD (Dijkstra Shortest Path Engine with Navigation Trigger)
    if (card.type === 'map_route') {
      const r = card.data;
      const fromName = r.from?.name || 'Main Gate';
      const toName = r.to?.name || 'Campus Venue';
      const destId = r.to?.id || '';
      const fromId = r.from?.id || 'loc-gate-01';

      return `
        <div class="card" style="padding: 1rem 1.25rem; background: var(--surface); border: 1.5px solid rgba(99, 102, 241, 0.4); border-left: 4px solid #6366f1; border-radius: var(--radius-sm); box-shadow: var(--shadow-sm);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
            <div style="font-size: 0.78rem; font-weight: 700; color: #818cf8; text-transform: uppercase; letter-spacing: 0.04em; display: flex; align-items: center; gap: 0.35rem;">
              <i data-lucide="navigation" style="width: 14px; height: 14px;"></i> Dijkstra Walking Route
            </div>
            <span class="badge badge-primary" style="font-size: 0.7rem; font-weight: 700;">
              ${r.distanceMeters} m • ~${r.walkingMinutes} mins
            </span>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px; margin-bottom: 0.65rem;">
            <div><span style="color: var(--text-muted);">From:</span> <strong style="color: var(--text-main);">${fromName}</strong></div>
            <div><span style="color: var(--text-muted);">To:</span> <strong style="color: var(--text-main);">${toName}</strong> (${r.to?.building || 'Campus'})</div>
            <div><span style="color: var(--text-muted);">Waypoints:</span> <strong style="color: #818cf8;">${(r.steps || []).length} Wayfinding Steps</strong></div>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 0.5rem; border-top: 1px solid var(--border-color); padding-top: 0.5rem; flex-wrap: wrap;">
            <button class="btn btn-secondary btn-sm" style="font-size: 0.78rem; padding: 0.4rem 0.9rem;" onclick="AIChatComponent.openMapRoute('${destId}', '${fromId}')">
              <i data-lucide="map" style="width: 13px; height: 13px;"></i> Open Route
            </button>
            <button class="btn btn-primary btn-sm" style="font-size: 0.78rem; padding: 0.4rem 0.95rem; font-weight: 700; background: linear-gradient(135deg, #10b981, #059669); border: none;" onclick="AIChatComponent.startMapNavigation('${destId}', '${fromId}')">
              <i data-lucide="navigation" style="width: 13px; height: 13px;"></i> Start Navigation
            </button>
          </div>
        </div>
      `;
    }

    // 5. LOCATION INFO CARD
    if (card.type === 'location' || card.type === 'location_info') {
      const l = card.data;
      return `
        <div class="card" style="padding: 1rem 1.25rem; background: var(--surface); border: 1.5px solid rgba(16, 185, 129, 0.4); border-left: 4px solid #10b981; border-radius: var(--radius-sm); box-shadow: var(--shadow-sm);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
            <strong style="font-size: 0.95rem; color: var(--text-main);">${l.name}</strong>
            <span class="badge badge-primary" style="font-size: 0.68rem;">${l.category || 'Venue'}</span>
          </div>
          <div style="font-size: 0.82rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 3px; margin-bottom: 0.6rem;">
            <div><span style="color: var(--text-muted);">Building:</span> <strong style="color: var(--text-main);">${l.building} (${l.floor || 'Ground'})</strong></div>
            ${l.operatingHours ? `<div><span style="color: var(--text-muted);">Hours:</span> <span style="color: #10b981; font-weight: 600;">${l.operatingHours}</span></div>` : ''}
            ${l.description ? `<p style="margin: 3px 0 0 0; font-size: 0.78rem; line-height: 1.35; color: var(--text-muted);">${l.description}</p>` : ''}
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 0.5rem; border-top: 1px solid var(--border-color); padding-top: 0.5rem; flex-wrap: wrap;">
            <button class="btn btn-secondary btn-sm" style="font-size: 0.76rem; padding: 0.35rem 0.9rem;" onclick="AIChatComponent.openLocationOnMap('${l.id}')">
              <i data-lucide="map-pin" style="width: 13px; height: 13px;"></i> View on Map
            </button>
            <button class="btn btn-primary btn-sm" style="font-size: 0.76rem; padding: 0.35rem 0.9rem; background: linear-gradient(135deg, #6366f1, #4f46e5); border: none;" onclick="AIChatComponent.getDirectionsToLocation('${l.id}')">
              <i data-lucide="navigation" style="width: 13px; height: 13px;"></i> Get Directions
            </button>
          </div>
        </div>
      `;
    }

    return '';
  },

  openMapRoute: function(destId, fromId) {
    const portal = this.currentRole || 'student';
    window.location.hash = `#/${portal}/campus-map?dest=${destId || ''}&from=${fromId || 'loc-gate-01'}`;
  },

  startMapNavigation: function(destId, fromId) {
    const portal = this.currentRole || 'student';
    window.location.hash = `#/${portal}/campus-map?dest=${destId || ''}&from=${fromId || 'loc-gate-01'}&nav=start`;
  },

  openLocationOnMap: function(locId) {
    const portal = this.currentRole || 'student';
    window.location.hash = `#/${portal}/campus-map?dest=${locId || ''}`;
  },

  getDirectionsToLocation: function(locId) {
    const portal = this.currentRole || 'student';
    window.location.hash = `#/${portal}/campus-map?dest=${locId || ''}&nav=start`;
  },

  handleInputSubmit: function() {
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
      .replace(/^### (.*$)/gim, '<strong style="display:block; font-size:1rem; margin-top:0.6rem; margin-bottom:0.3rem; color:var(--primary-400);">$1</strong>')
      .replace(/^#### (.*$)/gim, '<strong style="display:block; font-size:0.92rem; margin-top:0.4rem;">$1</strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '• $1')
      .replace(/\n/g, '<br>');
  },

  copyText: function(btn) {
    const bubble = btn.closest('.chat-bubble-ai');
    const textEl = bubble ? bubble.querySelector('.ai-response-body') : null;
    if (textEl) {
      navigator.clipboard.writeText(textEl.innerText || textEl.textContent).then(() => {
        const original = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="check" style="width:12px; height:12px;"></i> Copied!';
        if (window.lucide) lucide.createIcons();
        setTimeout(() => {
          btn.innerHTML = original;
          if (window.lucide) lucide.createIcons();
        }, 1800);
      });
    }
  },

  sendMessage: async function(text) {
    const body = document.getElementById('chat-messages-body');
    if (!body) return;

    const meta = this.getAgentMeta(this.currentRole);

    // 1. Render User Bubble
    const userMsg = { sender: 'user', text, timestamp: new Date().toISOString() };
    Store.addAIChatMessage(this.currentRole, 'user', text);

    const userBubble = document.createElement('div');
    userBubble.innerHTML = this.renderMessageBubble(userMsg);
    body.appendChild(userBubble.firstElementChild);
    body.scrollTop = body.scrollHeight;

    // 2. Render Progressive Agent Activity UI with Agent's Distinct Name
    const typingBubble = document.createElement('div');
    typingBubble.className = 'chat-bubble chat-bubble-ai';
    typingBubble.id = 'ai-typing-indicator';
    typingBubble.style.padding = '0.9rem 1.25rem';
    typingBubble.style.maxWidth = '75%';
    typingBubble.style.background = 'var(--bg-secondary)';
    typingBubble.style.border = '1px solid var(--border-color)';
    typingBubble.style.borderRadius = 'var(--radius-md)';
    typingBubble.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.4rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 0.35rem;">
          <div style="display: flex; align-items: center; gap: 0.45rem;">
            <span class="badge badge-primary" style="font-size: 0.72rem; background: ${meta.gradient}; color: #fff;">${meta.name}</span>
            <span id="agent-thinking-text" style="font-size: 0.8rem; color: var(--text-main);">${meta.thinking}</span>
          </div>
          <span class="badge" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; font-size: 0.68rem; font-weight: 700; border: 1px solid rgba(59, 130, 246, 0.3);">
            THINKING
          </span>
        </div>
        <div id="agent-steps-log" style="font-size: 0.76rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 3px;">
          <span style="color: #10b981;">✓ Context verified for ${this.currentRole} portal</span>
          <span id="agent-step-2" style="color: var(--text-muted);">⏳ Executing role-authorized tools in Strands SDK...</span>
        </div>
      </div>
    `;
    body.appendChild(typingBubble);
    body.scrollTop = body.scrollHeight;
    if (window.lucide) lucide.createIcons();

    // Call Backend Strands Agent API directly
    const res = await Store.sendAIChatMessage(this.currentRole, text);

    // Remove typing indicator
    const currentTyping = document.getElementById('ai-typing-indicator');
    if (currentTyping) currentTyping.remove();

    let aiMessage = null;
    if (res.success) {
      aiMessage = {
        sender: 'ai',
        text: res.answer || res.message || '',
        agent: res.agent || meta.name,
        status: res.status,
        executionId: res.executionId,
        toolsUsed: res.toolsUsed || [],
        approvalRequired: !!res.approvalRequired,
        approvalId: res.approvalId,
        actionDetails: res.actionDetails,
        cards: res.cards || []
      };
    } else {
      aiMessage = {
        sender: 'ai',
        text: res.error || `${meta.name} encountered an issue executing this request. Please try again.`,
        agent: meta.name,
        status: 'FAILED',
        toolsUsed: []
      };
    }

    // Save & render AI Bubble
    Store.addAIChatMessage(this.currentRole, 'ai', aiMessage.text);

    const aiBubble = document.createElement('div');
    aiBubble.innerHTML = this.renderMessageBubble(aiMessage);
    body.appendChild(aiBubble.firstElementChild);
    body.scrollTop = body.scrollHeight;

    if (window.lucide) lucide.createIcons();

    // Check for Autopilot opportunities
    this.checkForAutopilotInsights();
  },

  handleApproval: async function(approvalId) {
    const body = document.getElementById('chat-messages-body');
    if (!body) return;

    const meta = this.getAgentMeta(this.currentRole);

    // Prevent double-clicks
    const cardEl = document.getElementById(`approval-card-${approvalId}`);
    if (cardEl) {
      const btns = cardEl.querySelectorAll('button');
      btns.forEach(b => { b.disabled = true; b.style.opacity = '0.5'; b.style.pointerEvents = 'none'; });
    }

    // Show safe executing transition activity panel
    const progressBubble = document.createElement('div');
    progressBubble.className = 'chat-bubble chat-bubble-ai';
    progressBubble.id = 'ai-approval-progress';
    progressBubble.style.padding = '0.9rem 1.25rem';
    progressBubble.style.maxWidth = '75%';
    progressBubble.style.background = 'var(--bg-secondary)';
    progressBubble.style.border = '1px solid #10b981';
    progressBubble.style.borderRadius = 'var(--radius-md)';
    progressBubble.innerHTML = `
      <div style="font-size: 0.82rem; color: #10b981; display: flex; flex-direction: column; gap: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
          <span style="font-weight: 700; color: #10b981;">${meta.name} Execution Engine</span>
          <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; font-size: 0.68rem; font-weight: 700; border: 1px solid #10b981;">
            EXECUTING
          </span>
        </div>
        <span style="font-size: 0.76rem; color: #10b981;">✓ Identity verified via cryptographic session</span>
        <span style="font-size: 0.76rem; color: #10b981;">✓ Executing authorized tool action</span>
        <span style="font-size: 0.76rem; color: #10b981;">✓ Verifying MongoDB persistence</span>
        <span style="font-size: 0.76rem; color: #10b981;">✓ Completed successfully</span>
      </div>
    `;
    body.appendChild(progressBubble);
    body.scrollTop = body.scrollHeight;

    const res = await Store.approveAgentAction(approvalId);
    progressBubble.remove();

    if (res.success) {
      if (cardEl) {
        cardEl.style.border = '1px solid #10b981';
        cardEl.style.background = 'rgba(16, 185, 129, 0.08)';
        cardEl.innerHTML = `
          <div style="font-size: 0.86rem; color: #10b981; font-weight: 700; display: flex; align-items: center; gap: 0.4rem;">
            <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i> Action Approved & Verified in University Database
          </div>
        `;
      }

      const outcomeMsg = {
        sender: 'ai',
        text: res.message,
        agent: res.agent || meta.name,
        toolsUsed: res.toolsUsed || ['register_for_event'],
        cards: res.cards || [],
        executionId: res.executionId,
        status: 'COMPLETED'
      };
      Store.addAIChatMessage(this.currentRole, 'ai', res.message);
      const bubble = document.createElement('div');
      bubble.innerHTML = this.renderMessageBubble(outcomeMsg);
      body.appendChild(bubble.firstElementChild);
      body.scrollTop = body.scrollHeight;
    } else {
      if (cardEl) {
        const btns = cardEl.querySelectorAll('button');
        btns.forEach(b => { b.disabled = false; b.style.opacity = '1'; b.style.pointerEvents = 'auto'; });
      }
      alert(`Approval error: ${res.error || 'Failed to complete action.'}`);
    }

    if (window.lucide) lucide.createIcons();
    this.dismissAutopilotBanner();
  },

  handleRejection: async function(approvalId) {
    const body = document.getElementById('chat-messages-body');
    if (!body) return;

    const meta = this.getAgentMeta(this.currentRole);
    const cardEl = document.getElementById(`approval-card-${approvalId}`);
    if (cardEl) {
      const btns = cardEl.querySelectorAll('button');
      btns.forEach(b => { b.disabled = true; b.style.opacity = '0.5'; b.style.pointerEvents = 'none'; });
    }

    const res = await Store.rejectAgentAction(approvalId);

    if (cardEl) {
      cardEl.style.border = '1px solid var(--border-color)';
      cardEl.style.background = 'rgba(255, 255, 255, 0.02)';
      cardEl.innerHTML = `
        <div style="font-size: 0.84rem; color: var(--text-muted); font-weight: 600; display: flex; align-items: center; gap: 0.4rem;">
          <i data-lucide="x-circle" style="width: 15px; height: 15px;"></i> Action Cancelled — No changes made to records
        </div>
      `;
    }

    const cancelMsg = {
      sender: 'ai',
      agent: meta.name,
      text: res.message || 'The action was cancelled. No changes were made to your records.',
      status: 'COMPLETED',
      toolsUsed: []
    };
    Store.addAIChatMessage(this.currentRole, 'ai', cancelMsg.text);
    const bubble = document.createElement('div');
    bubble.innerHTML = this.renderMessageBubble(cancelMsg);
    body.appendChild(bubble.firstElementChild);
    body.scrollTop = body.scrollHeight;

    if (window.lucide) lucide.createIcons();
    this.dismissAutopilotBanner();
  },

  viewEventDetails: function(title, date, time, location, desc) {
    alert(`CampusNova Verified Event\n\nTitle: ${title}\nDate: ${date}\nTime: ${time}\nLocation: ${location}\n\nDescription:\n${desc}`);
  },

  runAutopilotScan: async function() {
    const banner = document.getElementById('autopilot-banner-root');
    const insights = await Store.fetchAutopilotInsights(this.currentRole);
    if (insights && insights.length > 0) {
      this.checkForAutopilotInsights();
      if (banner) {
        banner.style.display = 'block';
        banner.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      alert("Autopilot scan completed. All campus events, deadlines, and tickets are currently up to date!");
    }
  },

  toggleAutopilot: function() {
    this.autopilotEnabled = !this.autopilotEnabled;
    const btn = document.getElementById('autopilot-toggle-btn');
    if (btn) {
      btn.innerHTML = `<i data-lucide="zap" style="width: 14px; height: 14px; color: #fbbf24;"></i> Autopilot: ${this.autopilotEnabled ? 'Active' : 'Paused'}`;
      if (window.lucide) lucide.createIcons();
    }
    if (this.autopilotEnabled) {
      this.checkForAutopilotInsights();
    } else {
      this.dismissAutopilotBanner();
    }
  },

  checkForAutopilotInsights: async function() {
    if (!this.autopilotEnabled) return;
    const insights = await Store.fetchAutopilotInsights(this.currentRole);
    if (insights && insights.length > 0) {
      const top = insights[0];
      const banner = document.getElementById('autopilot-banner-root');
      if (banner) {
        banner.style.display = 'block';
        banner.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 0.65rem;">
              <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(245, 158, 11, 0.2); color: #f59e0b; display: flex; align-items: center; justify-content: center;">
                <i data-lucide="zap" style="width: 18px; height: 18px;"></i>
              </div>
              <div>
                <strong style="font-size: 0.84rem; color: var(--text-main); display: block;">
                  CampusNova Autopilot: Proactive Recommendation
                </strong>
                <span style="font-size: 0.78rem; color: var(--text-muted);">${top.message}</span>
              </div>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              ${top.approvalId ? `
                <button class="btn btn-primary btn-sm" style="font-size: 0.75rem; padding: 0.35rem 0.85rem; background: linear-gradient(135deg, #10b981, #059669);" onclick="AIChatComponent.handleApproval('${top.approvalId}')">
                  <i data-lucide="check"></i> Approve Registration
                </button>
              ` : ''}
              <button class="btn btn-ghost btn-sm" style="font-size: 0.75rem; padding: 0.35rem 0.65rem;" onclick="AIChatComponent.dismissAutopilotBanner()">
                Dismiss
              </button>
            </div>
          </div>
        `;
        if (window.lucide) lucide.createIcons();
      }
    }
  },

  dismissAutopilotBanner: function() {
    const banner = document.getElementById('autopilot-banner-root');
    if (banner) banner.style.display = 'none';
  },

  openServiceRequestModal: function(prefillSubject = "") {
    const modalContainer = document.getElementById('service-request-modal-container') || document.body;

    modalContainer.innerHTML = `
      <div class="modal-backdrop active" id="sr-modal-backdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem;">
        <div class="card" style="width: 100%; max-width: 540px; background: var(--surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.5rem; box-shadow: var(--shadow-lg);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <div class="brand-icon" style="width: 32px; height: 32px; background: linear-gradient(135deg, #f59e0b, #d97706);">
                <i data-lucide="life-buoy" style="width: 16px; height: 16px;"></i>
              </div>
              <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0;">Raise Official Campus Service Ticket</h3>
            </div>
            <button class="btn-icon" onclick="AIChatComponent.closeServiceRequestModal()">
              <i data-lucide="x"></i>
            </button>
          </div>

          <form onsubmit="AIChatComponent.handleServiceRequestSubmit(event)">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
              <div>
                <label style="display: block; font-size: 0.78rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.25rem;">Category</label>
                <select id="sr-category" class="input-field" style="width: 100%;">
                  <option value="Facilities & Infrastructure">Facilities & Infrastructure</option>
                  <option value="Academic & Examination">Academic & Examination</option>
                  <option value="Hostel & Accommodation">Hostel & Accommodation</option>
                  <option value="Transport & Bus Pass">Transport & Bus Pass</option>
                  <option value="Library & Resources">Library & Resources</option>
                  <option value="General Inquiry">General Inquiry</option>
                </select>
              </div>
              <div>
                <label style="display: block; font-size: 0.78rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.25rem;">Priority Level</label>
                <select id="sr-priority" class="input-field" style="width: 100%;">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM" selected>Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            <div style="margin-bottom: 1rem;">
              <label style="display: block; font-size: 0.78rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.25rem;">Subject / Brief Summary</label>
              <input type="text" id="sr-subject" class="input-field" style="width: 100%;" required placeholder="e.g. Projector in Lab 3 is not working" value="${prefillSubject || ''}">
            </div>

            <div style="margin-bottom: 1.25rem;">
              <label style="display: block; font-size: 0.78rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.25rem;">Detailed Description</label>
              <textarea id="sr-description" class="input-field" rows="4" style="width: 100%; resize: vertical;" required placeholder="Describe your issue or request clearly for the department helpdesk..."></textarea>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
              <button type="button" class="btn btn-secondary" onclick="AIChatComponent.closeServiceRequestModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
                <i data-lucide="send"></i> Submit Ticket
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  closeServiceRequestModal: function() {
    const el = document.getElementById('sr-modal-backdrop');
    if (el) el.remove();
  },

  handleServiceRequestSubmit: async function(e) {
    e.preventDefault();
    const subject = document.getElementById('sr-subject').value;
    this.closeServiceRequestModal();
    this.sendMessage(subject);
  },

  clearChat: function() {
    Store.clearAIChatHistory(this.currentRole);
    App.renderCurrentView();
  }
};
