/* ==========================================================================
   CAMPUSNOVA - SERVICE REQUESTS & HUMAN HANDOFF VIEW COMPONENT
   Enables Students & Faculty to track helpdesk tickets and Admin to manage/resolve them.
   ========================================================================== */

const ServiceRequestsView = {
  currentFilterStatus: 'ALL',

  render: function(portal = 'student') {
    const isAdmin = portal === 'admin';

    return `
      <div>
        <!-- Portal Header -->
        <div class="card glass-panel" style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(124, 58, 237, 0.1) 100%); margin-bottom: 1.5rem; border-color: rgba(245, 158, 11, 0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <span class="badge ${isAdmin ? 'badge-admin' : 'badge-primary'}" style="margin-bottom: 0.4rem;">
                ${isAdmin ? 'Central Administration Helpdesk' : 'Student & Faculty Support Desk'}
              </span>
              <h1 style="font-size: 1.75rem; font-weight: 800; margin: 0;">
                ${isAdmin ? 'Campus Service Requests Management' : 'My Campus Service Tickets'}
              </h1>
              <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0.25rem 0 0 0;">
                ${isAdmin ? 'Monitor, assign, investigate, and resolve campus service requests across departments.' : 'Track your queries, bonafide requests, hostel issues, and official grievance tickets.'}
              </p>
            </div>
            <button class="btn btn-primary" onclick="AIChatComponent.openServiceRequestModal()" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
              <i data-lucide="plus-circle"></i> Create New Ticket
            </button>
          </div>
        </div>

        <!-- Metrics Cards -->
        <div class="grid-cols-4" style="margin-bottom: 1.5rem;" id="sr-stats-container">
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(99, 102, 241, 0.15); color: var(--primary-400);"><i data-lucide="inbox"></i></div>
            <div class="stat-info">
              <span class="stat-value" id="stat-total-tickets">--</span>
              <span class="stat-label">Total Requests</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6;"><i data-lucide="clock"></i></div>
            <div class="stat-info">
              <span class="stat-value" id="stat-open-tickets">--</span>
              <span class="stat-label">Open Tickets</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;"><i data-lucide="refresh-cw"></i></div>
            <div class="stat-info">
              <span class="stat-value" id="stat-inprogress-tickets">--</span>
              <span class="stat-label">In Progress</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981;"><i data-lucide="check-circle-2"></i></div>
            <div class="stat-info">
              <span class="stat-value" id="stat-resolved-tickets">--</span>
              <span class="stat-label">Resolved</span>
            </div>
          </div>
        </div>

        <!-- Filter and Search Bar -->
        <div class="card" style="margin-bottom: 1.5rem; padding: 1rem 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button class="btn btn-primary btn-sm sr-filter-btn" data-status="ALL" onclick="ServiceRequestsView.filterStatus('ALL', '${portal}', this)">All</button>
              <button class="btn btn-secondary btn-sm sr-filter-btn" data-status="OPEN" onclick="ServiceRequestsView.filterStatus('OPEN', '${portal}', this)">Open</button>
              <button class="btn btn-secondary btn-sm sr-filter-btn" data-status="IN_PROGRESS" onclick="ServiceRequestsView.filterStatus('IN_PROGRESS', '${portal}', this)">In Progress</button>
              <button class="btn btn-secondary btn-sm sr-filter-btn" data-status="RESOLVED" onclick="ServiceRequestsView.filterStatus('RESOLVED', '${portal}', this)">Resolved</button>
              <button class="btn btn-secondary btn-sm sr-filter-btn" data-status="CLOSED" onclick="ServiceRequestsView.filterStatus('CLOSED', '${portal}', this)">Closed</button>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="ServiceRequestsView.loadTickets('${portal}')">
              <i data-lucide="refresh-cw"></i> Refresh
            </button>
          </div>
        </div>

        <!-- Tickets Container -->
        <div id="tickets-list-container">
          <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
            <i data-lucide="loader-2" style="width: 24px; height: 24px; animation: spin 1s linear infinite;"></i>
            <p>Loading service requests...</p>
          </div>
        </div>
      </div>
    `;
  },

  loadTickets: async function(portal) {
    const currentUser = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : { id: 'STU-2026-894', role: portal };
    const isAdmin = portal === 'admin';

    const tickets = await Store.getServiceRequests(isAdmin ? null : portal, isAdmin ? null : currentUser.id);

    // Update Stats
    const totalEl = document.getElementById('stat-total-tickets');
    const openEl = document.getElementById('stat-open-tickets');
    const inProgEl = document.getElementById('stat-inprogress-tickets');
    const resEl = document.getElementById('stat-resolved-tickets');

    if (totalEl) totalEl.innerText = tickets.length;
    if (openEl) openEl.innerText = tickets.filter(t => t.status === 'OPEN').length;
    if (inProgEl) inProgEl.innerText = tickets.filter(t => t.status === 'IN_PROGRESS').length;
    if (resEl) resEl.innerText = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

    // Filter by active status
    const filtered = this.currentFilterStatus === 'ALL'
      ? tickets
      : tickets.filter(t => t.status === this.currentFilterStatus);

    const container = document.getElementById('tickets-list-container');
    if (!container) return;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(245, 158, 11, 0.1); color: #f59e0b; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 0.75rem;">
            <i data-lucide="inbox" style="width: 24px; height: 24px;"></i>
          </div>
          <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.25rem;">No Service Requests Found</h4>
          <p style="font-size: 0.85rem; margin-bottom: 1rem;">No tickets match the selected status filter (${this.currentFilterStatus}).</p>
          <button class="btn btn-outline btn-sm" onclick="AIChatComponent.openServiceRequestModal()">
            <i data-lucide="plus-circle"></i> Create First Ticket
          </button>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${filtered.map(t => this.renderTicketCard(t, isAdmin)).join('')}
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  renderTicketCard: function(ticket, isAdmin) {
    const statusBadges = {
      OPEN: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', text: 'OPEN' },
      IN_PROGRESS: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', text: 'IN PROGRESS' },
      RESOLVED: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', text: 'RESOLVED' },
      CLOSED: { bg: 'rgba(107, 114, 128, 0.15)', color: '#9ca3af', text: 'CLOSED' }
    };

    const s = statusBadges[ticket.status] || statusBadges.OPEN;
    const priorityColor = ticket.priority === 'URGENT' ? '#ef4444' : ticket.priority === 'HIGH' ? '#f59e0b' : '#3b82f6';
    const dateFormatted = ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently';

    return `
      <div class="card" style="padding: 1.25rem; transition: transform 0.2s, border-color 0.2s;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.75rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
              <span style="font-family: monospace; font-size: 0.82rem; font-weight: 700; color: var(--primary-400);">${ticket.ticketId}</span>
              <span class="badge" style="background: ${s.bg}; color: ${s.color}; font-size: 0.7rem; font-weight: 700;">${s.text}</span>
              <span style="font-size: 0.7rem; color: ${priorityColor}; font-weight: 600;">• ${ticket.priority} Priority</span>
            </div>
            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin: 0;">${ticket.subject}</h3>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">
            Lodge Date: ${dateFormatted}
          </div>
        </div>

        <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 1rem;">
          ${ticket.description}
        </p>

        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 0.75rem; border-top: 1px solid var(--border-color); flex-wrap: wrap; gap: 0.75rem; font-size: 0.78rem;">
          <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            <span><strong style="color: var(--text-main);">Category:</strong> ${ticket.category}</span>
            <span><strong style="color: var(--text-main);">Assigned:</strong> ${ticket.assignedDepartment}</span>
            <span><strong style="color: var(--text-main);">User:</strong> ${ticket.userName} (${ticket.userRole})</span>
          </div>

          ${isAdmin ? `
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <span style="font-weight: 600; color: var(--text-muted);">Transition Status:</span>
              <select class="input-field" style="padding: 2px 8px; font-size: 0.75rem;" onchange="ServiceRequestsView.handleStatusChange('${ticket.ticketId}', this.value)">
                <option value="OPEN" ${ticket.status === 'OPEN' ? 'selected' : ''}>Open</option>
                <option value="IN_PROGRESS" ${ticket.status === 'IN_PROGRESS' ? 'selected' : ''}>In Progress</option>
                <option value="RESOLVED" ${ticket.status === 'RESOLVED' ? 'selected' : ''}>Resolved</option>
                <option value="CLOSED" ${ticket.status === 'CLOSED' ? 'selected' : ''}>Closed</option>
              </select>
            </div>
          ` : `
            <span style="color: var(--status-success); font-weight: 600;">Active in SLA Queue</span>
          `}
        </div>
      </div>
    `;
  },

  handleStatusChange: async function(ticketId, newStatus) {
    const res = await Store.updateServiceRequest(ticketId, { status: newStatus });
    if (res.success) {
      this.loadTickets('admin');
    } else {
      alert(`Error updating status: ${res.error}`);
    }
  },

  filterStatus: function(status, portal, btn) {
    this.currentFilterStatus = status;
    document.querySelectorAll('.sr-filter-btn').forEach(b => {
      b.classList.remove('btn-primary');
      b.classList.add('btn-secondary');
    });
    if (btn) {
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary');
    }
    this.loadTickets(portal);
  }
};
