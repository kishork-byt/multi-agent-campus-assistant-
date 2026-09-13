/* ==========================================================================
   CAMPUSNOVA - STRANDS AGENT EXECUTION LOGS & AUDIT TRAIL
   Displays real-time execution traces: Intent, Tool Selection,
   Human Approval lifecycle, Database Verification, and Statuses.
   ========================================================================== */

const AgentLogsView = {
  render: function() {
    return `
      <div>
        <!-- Header -->
        <div class="card glass-panel" style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%); margin-bottom: 1.5rem; border-color: rgba(124, 58, 237, 0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <span class="badge badge-primary" style="margin-bottom: 0.4rem; background: #4f46e5; color: #fff;">Strands Agents SDK Audit</span>
              <h1 style="font-size: 1.75rem; font-weight: 800; margin: 0;">Autonomous Agent Execution Logs</h1>
              <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0.25rem 0 0 0;">
                Live observability of CampusNova Agent: Intent, Selected Tools, Real Database Operations, Verification, and Human Approvals.
              </p>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="AgentLogsView.loadLogs()">
              <i data-lucide="refresh-cw"></i> Refresh Execution Traces
            </button>
          </div>
        </div>

        <!-- Architecture Flow Banner -->
        <div class="card" style="margin-bottom: 1.5rem; background: var(--surface); border-left: 4px solid #10b981; padding: 1rem 1.25rem;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.4rem;">
            <i data-lucide="activity" style="width: 16px; height: 16px; color: #10b981;"></i>
            Strands Autonomous Execution Cycle:
          </h4>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0; line-height: 1.5;">
            <strong>User Request</strong> ➔ <strong>Understand & Plan</strong> ➔
            <strong>Tool Selection</strong> (8 Real MongoDB Tools) ➔
            <strong>Risk Assessment</strong> (Medium/High Risk ➔ Human Approval Card) ➔
            <strong>Real Database Operation</strong> ➔
            <strong>MongoDB Verification</strong> ➔
            <strong>Result / Notification</strong>
          </p>
        </div>

        <!-- Logs Table -->
        <div class="card" style="padding: 1.25rem;">
          <div class="table-responsive" style="overflow-x: auto;">
            <table class="table" style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid var(--border-color); text-align: left; font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase;">
                  <th style="padding: 0.75rem 1rem;">Agent</th>
                  <th style="padding: 0.75rem 1rem;">Timestamp & User</th>
                  <th style="padding: 0.75rem 1rem;">Natural Language Query</th>
                  <th style="padding: 0.75rem 1rem;">Intent & Tools Used</th>
                  <th style="padding: 0.75rem 1rem;">Approval Lifecycle</th>
                  <th style="padding: 0.75rem 1rem;">Execution Status</th>
                </tr>
              </thead>
              <tbody id="agent-logs-table-body">
                <tr>
                  <td colspan="6" style="padding: 2rem; text-align: center; color: var(--text-muted);">
                    <i data-lucide="loader-2" style="width: 20px; height: 20px; animation: spin 1s linear infinite;"></i> Loading agent traces...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  loadLogs: async function() {
    const logs = await Store.getAgentLogs(50);
    const tbody = document.getElementById('agent-logs-table-body');
    if (!tbody) return;

    if (!logs || logs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
            No agent execution logs recorded yet. Send requests in Astra, Orion, or Atlas chat to view live traces.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = logs.map(l => {
      const timeFormatted = l.createdAt ? new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now';
      const status = l.status || l.executionStatus || 'COMPLETED';
      const statusColor = status === 'COMPLETED' || status === 'SUCCESS' ? '#10b981' : status === 'WAITING_APPROVAL' ? '#f59e0b' : status === 'EXECUTING' || status === 'VERIFYING' ? '#3b82f6' : '#ef4444';
      const tools = l.selectedTools || (l.toolOutputs ? l.toolOutputs.map(t => t.tool) : []);
      const approvalStatus = l.approvalStatus || (l.approvalRequired ? 'PENDING' : 'NONE');

      const agent = l.agentName || (l.userRole === 'admin' ? 'Atlas' : (l.userRole === 'staff' || l.userRole === 'faculty') ? 'Orion' : 'Astra');
      let agentGradient = 'linear-gradient(135deg, #4f46e5, #06b6d4)';
      if (agent === 'Orion') {
        agentGradient = 'linear-gradient(135deg, #059669, #0d9488)';
      } else if (agent === 'Atlas') {
        agentGradient = 'linear-gradient(135deg, #d97706, #7c3aed)';
      }

      return `
        <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.83rem;">
          <td style="padding: 0.85rem 1rem;">
            <span class="badge" style="background: ${agentGradient}; color: #fff; font-weight: 800; font-size: 0.72rem; padding: 4px 8px; letter-spacing: 0.04em;">
              ${agent.toUpperCase()}
            </span>
          </td>
          <td style="padding: 0.85rem 1rem;">
            <div style="font-weight: 600; color: var(--text-main);">${timeFormatted}</div>
            <span style="font-size: 0.72rem; color: var(--text-muted);">${l.userId} (${l.userRole || 'student'})</span>
            ${l.agentExecutionId ? `<div style="font-size: 0.68rem; color: var(--text-muted); font-family: monospace;">${l.agentExecutionId.slice(-8)}</div>` : ''}
          </td>
          <td style="padding: 0.85rem 1rem; max-width: 260px;">
            <div style="color: var(--text-main); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${l.query}">
              "${l.query}"
            </div>
            ${l.actionSummary ? `<div style="font-size: 0.72rem; color: #10b981;">✓ ${l.actionSummary}</div>` : ''}
          </td>
          <td style="padding: 0.85rem 1rem;">
            <div style="font-size: 0.74rem; font-weight: 700; color: var(--primary-300); margin-bottom: 0.2rem;">
              ${l.intent || 'CAMPUS_ACTION'}
            </div>
            ${tools.length > 0 ? `
              <div style="display: flex; gap: 0.3rem; flex-wrap: wrap;">
                ${tools.map(t => `<code style="font-size: 0.68rem; background: rgba(99,102,241,0.1); padding: 1px 4px; border-radius: 3px; color: var(--primary-300);">${t}</code>`).join('')}
              </div>
            ` : `<span style="font-size: 0.7rem; color: var(--text-muted);">No external tools</span>`}
          </td>
          <td style="padding: 0.85rem 1rem;">
            ${approvalStatus === 'PENDING' ? `
              <span class="badge badge-warning" style="font-size: 0.68rem; font-weight: 700;">Waiting Human</span>
            ` : approvalStatus === 'APPROVED' ? `
              <span class="badge badge-success" style="font-size: 0.68rem; font-weight: 700;">Approved ✓</span>
            ` : approvalStatus === 'REJECTED' ? `
              <span class="badge badge-danger" style="font-size: 0.68rem; font-weight: 700;">Cancelled ✕</span>
            ` : `
              <span style="font-size: 0.72rem; color: var(--text-muted);">Auto-approved (Low Risk)</span>
            `}
          </td>
          <td style="padding: 0.85rem 1rem;">
            <span class="badge" style="background: rgba(255,255,255,0.05); color: ${statusColor}; font-weight: 700; font-size: 0.72rem; border: 1px solid ${statusColor};">
              ${status}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  }
};
