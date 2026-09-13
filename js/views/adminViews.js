/* ==========================================================================
   COLLEGE AI ASSISTANT - ADMINISTRATION PORTAL VIEWS (FUNCTIONAL ENGINE)
   ========================================================================== */

const AdminViews = {
  renderErrorState: function(title, errorMessage, retryJsCode) {
    const escapedMsg = Store.escapeHtml ? Store.escapeHtml(errorMessage) : errorMessage;
    const escapedTitle = Store.escapeHtml ? Store.escapeHtml(title) : title;
    return `
      <div class="card glass-panel" style="padding: 3rem 2rem; text-align: center; max-width: 580px; margin: 2.5rem auto; border-color: rgba(239, 68, 68, 0.4); background: rgba(15, 23, 42, 0.65);">
        <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(239, 68, 68, 0.15); color: var(--status-error); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem auto; font-size: 1.6rem; border: 1px solid rgba(239, 68, 68, 0.3);">
          ⚠️
        </div>
        <h3 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 0.5rem; color: #f87171;">${escapedTitle}</h3>
        <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 1.75rem; line-height: 1.5;">${escapedMsg}</p>
        <button class="btn btn-primary" onclick="${retryJsCode}" style="background: linear-gradient(135deg, #d97706, #7c3aed); margin: 0 auto; display: inline-flex; align-items: center; gap: 0.5rem;">
          <i data-lucide="refresh-cw"></i> Retry Connection
        </button>
      </div>
    `;
  },
  // 1. Dashboard (Comprehensive Phase 5 Implementation)
  renderDashboard: function() {
    const students = Store.getStudentsList() || [];
    const staff = Store.getStaffList() || [];
    const events = Store.getEventsApprovals() || [];
    const upcomingEvents = events.filter(e => e.status === 'Approved');
    const serviceRequests = Store.data?.serviceRequests || [];
    const openRequests = serviceRequests.filter(s => s.status !== 'RESOLVED' && s.status !== 'CLOSED');
    const announcements = Store.getAnnouncements() || [];
    const agentLogs = Store.data?.agentLogs || Store.data?.admin?.auditLogs || [];
    const recentLogs = agentLogs.slice(0, 5);

    // Trigger async sync of service requests & agent logs in background if needed
    if (!Store.data?.serviceRequests) {
      setTimeout(() => {
        Store.getServiceRequests('admin').then(() => {
          const el = document.getElementById('admin-dash-open-requests-count');
          if (el) {
            const reqs = Store.data?.serviceRequests || [];
            const open = reqs.filter(s => s.status !== 'RESOLVED' && s.status !== 'CLOSED');
            el.innerText = open.length;
          }
        });
      }, 50);
    }

    return `
      <div>
        <!-- Welcome Hero Banner -->
        <div class="card glass-panel" style="background: linear-gradient(135deg, rgba(217, 119, 6, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%); margin-bottom: 2rem; border-color: rgba(245, 158, 11, 0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <span class="badge badge-admin" style="margin-bottom: 0.5rem;"><i data-lucide="shield"></i> Administration Portal</span>
              <h1 style="font-size: 2rem; font-weight: 800; margin: 0 0 0.25rem 0;">Campus Administration Overview</h1>
              <p style="color: var(--text-muted); font-size: 0.95rem; margin: 0;">
                CampusNova Autonomous Operations Active • <strong>${students.length}</strong> enrolled students • <strong>${staff.length}</strong> faculty & staff.
              </p>
            </div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button class="btn btn-primary" onclick="ModalsComponent.openModal('modal-add-student')" style="background: linear-gradient(135deg, #d97706, #7c3aed);">
                <i data-lucide="user-plus"></i> Add Student
              </button>
              <button class="btn btn-secondary" onclick="ModalsComponent.openModal('modal-add-staff')">
                <i data-lucide="user-check"></i> Register Faculty
              </button>
            </div>
          </div>
        </div>

        <!-- 4 Primary Overview Cards (Phase 5 Required) -->
        <div class="grid-cols-4" style="margin-bottom: 2rem;">
          <div class="stat-card" style="cursor: pointer;" onclick="App.navigateTo('admin/students-management')">
            <div class="stat-icon" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;"><i data-lucide="users"></i></div>
            <div class="stat-info">
              <span class="stat-value">${students.length}</span>
              <span class="stat-label">Total Students</span>
              <span class="stat-change up"><i data-lucide="check"></i> Enrolled</span>
            </div>
          </div>
          <div class="stat-card" style="cursor: pointer;" onclick="App.navigateTo('admin/staff-management')">
            <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981;"><i data-lucide="user-check"></i></div>
            <div class="stat-info">
              <span class="stat-value">${staff.length}</span>
              <span class="stat-label">Total Faculty/Staff</span>
              <span class="stat-change up"><i data-lucide="check"></i> Verified</span>
            </div>
          </div>
          <div class="stat-card" style="cursor: pointer;" onclick="App.navigateTo('admin/service-requests')">
            <div class="stat-icon" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;"><i data-lucide="life-buoy"></i></div>
            <div class="stat-info">
              <span class="stat-value" id="admin-dash-open-requests-count">${openRequests.length}</span>
              <span class="stat-label">Open Service Requests</span>
              <span class="stat-change down"><i data-lucide="alert-circle"></i> Needs Action</span>
            </div>
          </div>
          <div class="stat-card" style="cursor: pointer;" onclick="App.navigateTo('admin/events-management')">
            <div class="stat-icon" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;"><i data-lucide="calendar"></i></div>
            <div class="stat-info">
              <span class="stat-value">${upcomingEvents.length}</span>
              <span class="stat-label">Upcoming Events</span>
              <span class="stat-change up"><i data-lucide="sparkles"></i> Scheduled</span>
            </div>
          </div>
        </div>

        <!-- Quick Actions Bar (Phase 5) -->
        <div class="card" style="margin-bottom: 2rem; padding: 1rem 1.25rem; background: var(--surface);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 0.4rem;">
              <i data-lucide="zap" style="width: 16px; height: 16px; color: #f59e0b;"></i> Quick Actions:
            </span>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button class="btn btn-secondary btn-sm" onclick="ModalsComponent.openModal('modal-add-announcement')">
                <i data-lucide="megaphone" style="width: 13px; height: 13px;"></i> Publish Notice
              </button>
              <button class="btn btn-secondary btn-sm" onclick="ModalsComponent.openModal('modal-reserve-venue')">
                <i data-lucide="calendar-plus" style="width: 13px; height: 13px;"></i> Reserve Venue
              </button>
              <button class="btn btn-secondary btn-sm" onclick="App.navigateTo('admin/ai-copilot')">
                <i data-lucide="cpu" style="width: 13px; height: 13px; color: var(--primary-300);"></i> CampusNova AI
              </button>
              <button class="btn btn-secondary btn-sm" onclick="App.navigateTo('admin/campus-map')">
                <i data-lucide="map" style="width: 13px; height: 13px; color: #10b981;"></i> Campus Map
              </button>
              <button class="btn btn-secondary btn-sm" onclick="App.navigateTo('admin/ai-logs')">
                <i data-lucide="activity" style="width: 13px; height: 13px; color: #38bdf8;"></i> AI Multi-Agent Logs
              </button>
            </div>
          </div>
        </div>

        <!-- Live Dashboard Data Preview Row -->
        <div class="grid-cols-2" style="margin-bottom: 2rem;">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title"><i data-lucide="calendar" style="color: var(--portal-accent);"></i> Upcoming Campus Events</h3>
              <a href="#/admin/events-management" class="btn btn-ghost btn-sm">Manage Events →</a>
            </div>
            <div style="height: 240px; position: relative;">
              <canvas id="admin-attendance-chart"></canvas>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3 class="card-title"><i data-lucide="megaphone" style="color: var(--accent-cyan);"></i> Recent Broadcast Announcements</h3>
              <a href="#/admin/announcements" class="btn btn-ghost btn-sm">Publisher →</a>
            </div>
            <div style="height: 240px; position: relative;">
              <canvas id="admin-dept-chart"></canvas>
            </div>
          </div>
        </div>

        <!-- 2 Column Layout: Upcoming Events & Recent Service Requests -->
        <div class="grid-cols-2" style="margin-bottom: 2rem;">
          <!-- Upcoming Events -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title"><i data-lucide="calendar" style="color: #818cf8;"></i> Upcoming Campus Events</h3>
              <a href="#/admin/events-management" class="btn btn-ghost btn-sm">Manage Events →</a>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
              ${events.length === 0 ? `
                <div style="padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.88rem;">
                  No data available. No events currently scheduled.
                </div>
              ` : events.slice(0, 4).map(e => `
                <div style="padding: 0.85rem 1rem; background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong style="font-size: 0.92rem; display: block; color: var(--text-main);">${e.title}</strong>
                    <span style="font-size: 0.78rem; color: var(--text-muted); display: flex; gap: 0.75rem; margin-top: 0.2rem;">
                      <span><i data-lucide="clock" style="width: 12px; height: 12px; vertical-align: middle;"></i> ${e.date}</span>
                      <span><i data-lucide="map-pin" style="width: 12px; height: 12px; vertical-align: middle;"></i> ${e.venue || e.location || 'Campus'}</span>
                    </span>
                  </div>
                  <span class="badge badge-${e.status === 'Approved' ? 'staff' : 'admin'}" style="font-size: 0.72rem;">${e.status}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Recent Support & Service Requests -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title"><i data-lucide="life-buoy" style="color: #f59e0b;"></i> Recent Support & Service Requests</h3>
              <a href="#/admin/service-requests" class="btn btn-ghost btn-sm">Helpdesk →</a>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
              ${serviceRequests.length === 0 ? `
                <div style="padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.88rem;">
                  No data available. All campus service requests resolved.
                </div>
              ` : serviceRequests.slice(0, 4).map(s => `
                <div style="padding: 0.85rem 1rem; background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <code style="font-size: 0.75rem; color: var(--primary-300);">${s.ticketId || s.issueId || 'SUP'}</code>
                      <strong style="font-size: 0.9rem; color: var(--text-main);">${s.title}</strong>
                    </div>
                    <span style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-top: 0.2rem;">
                      ${s.department || 'Facilities'} • Requester: ${s.requesterName || s.userId || 'Campus User'}
                    </span>
                  </div>
                  <span class="badge badge-${s.status === 'RESOLVED' || s.status === 'CLOSED' ? 'staff' : s.status === 'IN_PROGRESS' ? 'primary' : 'danger'}" style="font-size: 0.72rem;">
                    ${s.status || 'OPEN'}
                  </span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- 2 Column Layout: AI Agent Activity & System Notifications -->
        <div class="grid-cols-2" style="margin-bottom: 1.5rem;">
          <!-- AI Agent Activity (Phase 5) -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title"><i data-lucide="cpu" style="color: var(--primary-400);"></i> AI Agent Activity</h3>
              <a href="#/admin/ai-logs" class="btn btn-ghost btn-sm">All Logs →</a>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              ${recentLogs.length === 0 ? `
                <div style="padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.88rem;">
                  No data available. AI agent execution traces will appear here.
                </div>
              ` : recentLogs.map(l => `
                <div style="padding: 0.75rem 0.95rem; background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.2rem;">
                      <span class="badge badge-primary" style="font-size: 0.65rem; padding: 1px 5px;">CampusNova</span>
                      <strong style="font-size: 0.84rem; color: var(--text-main);">${l.intent || l.action || 'Query Processed'}</strong>
                    </div>
                    <p style="font-size: 0.76rem; color: var(--text-muted); margin: 0; max-width: 320px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      "${l.query || l.target || 'Campus autonomous operation'}"
                    </p>
                  </div>
                  <div style="text-align: right;">
                    <span class="badge badge-${(l.status === 'COMPLETED' || l.status === 'SUCCESS') ? 'staff' : l.status === 'WAITING_APPROVAL' ? 'admin' : 'primary'}" style="font-size: 0.68rem;">
                      ${l.status || 'COMPLETED'}
                    </span>
                    <span style="display: block; font-size: 0.7rem; color: var(--text-muted); margin-top: 0.2rem;">${l.timestamp || 'Recent'}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- System Notifications / Announcements (Phase 5) -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title"><i data-lucide="megaphone" style="color: var(--accent-violet);"></i> System Notifications</h3>
              <a href="#/admin/announcements" class="btn btn-ghost btn-sm">Announcements →</a>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              ${announcements.length === 0 ? `
                <div style="padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.88rem;">
                  No data available. No broadcast announcements published.
                </div>
              ` : announcements.slice(0, 4).map(a => `
                <div style="padding: 0.75rem 0.95rem; background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong style="font-size: 0.86rem; color: var(--text-main); display: block;">${a.title}</strong>
                    <span style="font-size: 0.76rem; color: var(--text-muted);">${a.target || 'All Users'} • ${a.date}</span>
                  </div>
                  <span class="badge badge-${a.priority === 'High' ? 'danger' : 'admin'}" style="font-size: 0.68rem;">
                    ${a.priority || 'Normal'}
                  </span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // 2. Students Management
  renderStudentsManagement: function() {
    if (Store.adminCache.loading.students) {
      return `
        <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
          <div class="spinner" style="margin: 0 auto 1rem auto; width: 36px; height: 36px; border: 3px solid var(--border-color); border-top-color: var(--accent-amber); border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p>Connecting to MongoDB & Loading Students Directory...</p>
        </div>
      `;
    }

    if (Store.adminCache.error.students) {
      return this.renderErrorState(
        "Failed to Load Students Master Directory",
        Store.adminCache.error.students,
        "Store.syncAdminStudents().then(() => App.renderCurrentView())"
      );
    }

    if (!Store.adminCache.students) {
      Store.syncAdminStudents().then(() => App.renderCurrentView());
      return `
        <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
          <div class="spinner" style="margin: 0 auto 1rem auto; width: 36px; height: 36px; border: 3px solid var(--border-color); border-top-color: var(--accent-amber); border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p>Connecting to MongoDB & Loading Students Directory...</p>
        </div>
      `;
    }

    const list = Store.adminCache.students || Store.getStudentsList() || [];

    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 800;">Students Master Database Directory</h1>
            <p style="color: var(--text-muted); font-size: 0.9rem;">View, search, filter, add, and manage persistent student records from MongoDB.</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="ModalsComponent.openModal('modal-add-student')" style="background: linear-gradient(135deg, #d97706, #7c3aed);">
            <i data-lucide="user-plus"></i> Add New Student Record
          </button>
        </div>

        <div class="card" style="margin-bottom: 1.5rem;">
          <!-- Search & Filter Controls Bar -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem;">
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; flex: 1;">
              <div class="input-group" style="max-width: 280px; flex: 1;">
                <i data-lucide="search" class="input-icon"></i>
                <input type="text" class="input-field" placeholder="Search by name, ID or email..." onkeyup="AdminViews.searchStudents(this.value)">
              </div>
              <select class="input-field select-field" style="max-width: 220px;" onchange="AdminViews.filterStudentsDept(this.value)">
                <option value="all">All Departments</option>
                <option value="AI & Machine Learning">AI & Machine Learning</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Electronics">Electronics</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Mechanical">Mechanical</option>
              </select>
            </div>
            <span style="font-size: 0.85rem; color: var(--text-muted);">Showing <strong>${list.length}</strong> Registered Students</span>
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Full Name</th>
                  <th>Department</th>
                  <th>Academic Year</th>
                  <th>CGPA</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="admin-students-table-body">
                ${list.length === 0 ? `
                  <tr>
                    <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">No student records found in database.</td>
                  </tr>
                ` : list.map(s => {
                  const sId = s.studentId || s.id || s._id;
                  const name = s.name;
                  const dept = (s.deptId && s.deptId.name) ? s.deptId.name : (s.dept || s.department || "General");
                  const year = s.year || "3rd Year";
                  const cgpa = s.cgpa || "3.80";
                  const email = s.email || "student@university.edu";
                  const status = s.status || "Active";

                  return `
                    <tr data-dept="${dept}">
                      <td><strong>${sId}</strong></td>
                      <td>${name}</td>
                      <td>${dept}</td>
                      <td>${year}</td>
                      <td><span class="badge badge-primary">${cgpa}</span></td>
                      <td><span style="font-size: 0.8rem; color: var(--text-muted);">${email}</span></td>
                      <td><span class="badge badge-${status === 'Active' ? 'staff' : 'danger'}">${status}</span></td>
                      <td>
                        <div style="display: flex; gap: 0.25rem;">
                          <button class="btn btn-ghost btn-sm" onclick="alert('Student Record Details:\\nID: ${sId}\\nName: ${name}\\nDept: ${dept}\\nCGPA: ${cgpa}')">View</button>
                          <button class="btn btn-ghost btn-sm" style="color: var(--primary-400);" onclick="ModalsComponent.openEditStudentModal('${sId}')">Edit</button>
                          <button class="btn btn-ghost btn-sm" style="color: var(--status-error);" onclick="if(confirm('Delete record for ${name}?')) { Store.deleteStudent('${sId}').then(() => App.renderCurrentView()); }">Delete</button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  editStudentPrompt: function(studentId) {
    ModalsComponent.openEditStudentModal(studentId);
  },

  searchStudents: function(query) {
    const q = query.toLowerCase();
    document.querySelectorAll('#admin-students-table-body tr').forEach(row => {
      row.style.display = row.innerText.toLowerCase().includes(q) ? '' : 'none';
    });
  },

  filterStudentsDept: function(dept) {
    document.querySelectorAll('#admin-students-table-body tr').forEach(row => {
      const d = row.getAttribute('data-dept') || '';
      row.style.display = (dept === 'all' || d.toLowerCase().includes(dept.toLowerCase())) ? '' : 'none';
    });
  },

  // 3. Staff Management
  renderStaffManagement: function() {
    if (Store.adminCache.loading.staff) {
      return `
        <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
          <div class="spinner" style="margin: 0 auto 1rem auto; width: 36px; height: 36px; border: 3px solid var(--border-color); border-top-color: var(--accent-amber); border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p>Connecting to MongoDB & Loading Faculty Directory...</p>
        </div>
      `;
    }

    if (Store.adminCache.error.staff) {
      return this.renderErrorState(
        "Failed to Load Faculty Master Directory",
        Store.adminCache.error.staff,
        "Store.syncAdminStaff().then(() => App.renderCurrentView())"
      );
    }

    if (!Store.adminCache.staff) {
      Store.syncAdminStaff().then(() => App.renderCurrentView());
      return `
        <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
          <div class="spinner" style="margin: 0 auto 1rem auto; width: 36px; height: 36px; border: 3px solid var(--border-color); border-top-color: var(--accent-amber); border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p>Connecting to MongoDB & Loading Faculty Directory...</p>
        </div>
      `;
    }

    const list = Store.adminCache.staff || Store.getStaffList() || [];

    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 800;">Faculty & Staff Master Directory</h1>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Manage professors, department heads, research fellows, and staff credentials from MongoDB.</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="ModalsComponent.openModal('modal-add-staff')" style="background: linear-gradient(135deg, #d97706, #7c3aed);">
            <i data-lucide="user-check"></i> Register Faculty Member
          </button>
        </div>

        <div class="card">
          <!-- Search & Filter Controls Bar -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem;">
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; flex: 1;">
              <div class="input-group" style="max-width: 280px; flex: 1;">
                <i data-lucide="search" class="input-icon"></i>
                <input type="text" class="input-field" placeholder="Search by name, ID or email..." onkeyup="AdminViews.searchStaff(this.value)">
              </div>
              <select class="input-field select-field" style="max-width: 220px;" onchange="AdminViews.filterStaffDept(this.value)">
                <option value="all">All Departments</option>
                <option value="AI & Machine Learning">AI & Machine Learning</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Electronics">Electronics</option>
                <option value="Information Technology">Information Technology</option>
              </select>
            </div>
            <span style="font-size: 0.85rem; color: var(--text-muted);">Showing <strong>${list.length}</strong> Registered Faculty Members</span>
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Faculty Name</th>
                  <th>Department</th>
                  <th>Designation / Role</th>
                  <th>Email</th>
                  <th>Courses Assigned</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="admin-staff-table-body">
                ${list.length === 0 ? `
                  <tr>
                    <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">No faculty records found in database.</td>
                  </tr>
                ` : list.map(s => {
                  const stfId = s.staffId || s.id || s._id;
                  const name = s.name;
                  const dept = (s.deptId && s.deptId.name) ? s.deptId.name : (s.dept || s.department || "General");
                  const role = s.designation || s.title || s.role || "Professor";
                  const email = s.email;
                  const courseCount = (s.assignedCourses && Array.isArray(s.assignedCourses)) ? s.assignedCourses.length : (s.courses || 3);
                  const status = s.status || "Active";

                  return `
                    <tr data-dept="${dept}">
                      <td><strong>${stfId}</strong></td>
                      <td>${name}</td>
                      <td>${dept}</td>
                      <td>${role}</td>
                      <td><span style="font-size: 0.8rem; color: var(--text-muted);">${email}</span></td>
                      <td>${courseCount} Courses</td>
                      <td><span class="badge badge-${status === 'Active' ? 'staff' : 'admin'}">${status}</span></td>
                      <td>
                        <div style="display: flex; gap: 0.25rem;">
                          <button class="btn btn-ghost btn-sm" onclick="alert('Faculty Record Details:\\nID: ${stfId}\\nName: ${name}\\nDept: ${dept}\\nRole: ${role}\\nEmail: ${email}')">View</button>
                          <button class="btn btn-ghost btn-sm" style="color: var(--primary-400);" onclick="ModalsComponent.openEditStaffModal('${stfId}')">Edit</button>
                          <button class="btn btn-ghost btn-sm" style="color: var(--status-error);" onclick="if(confirm('Are you sure you want to delete faculty record for ${name} (${stfId})? This will remove it from MongoDB.')) { Store.deleteStaff('${stfId}'); App.renderCurrentView(); }">Delete</button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  editStaffPrompt: function(staffId) {
    ModalsComponent.openEditStaffModal(staffId);
  },

  searchStaff: function(query) {
    const q = query.toLowerCase();
    document.querySelectorAll('#admin-staff-table-body tr').forEach(row => {
      row.style.display = row.innerText.toLowerCase().includes(q) ? '' : 'none';
    });
  },

  filterStaffDept: function(dept) {
    document.querySelectorAll('#admin-staff-table-body tr').forEach(row => {
      const d = row.getAttribute('data-dept') || '';
      row.style.display = (dept === 'all' || d.toLowerCase().includes(dept.toLowerCase())) ? '' : 'none';
    });
  },

  // 4. Departments & Courses Page
  renderDepartments: function() {
    if (Store.adminCache.loading.departments || Store.adminCache.loading.courses) {
      return `
        <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
          <div class="spinner" style="margin: 0 auto 1rem auto; width: 36px; height: 36px; border: 3px solid var(--border-color); border-top-color: var(--accent-amber); border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p>Connecting to MongoDB & Loading Departments & Course Catalog...</p>
        </div>
      `;
    }

    const err = Store.adminCache.error.departments || Store.adminCache.error.courses;
    if (err) {
      return this.renderErrorState(
        "Failed to Load Academic Departments & Courses",
        err,
        "Promise.all([Store.syncAdminDepartments(), Store.syncAdminCourses()]).then(() => App.renderCurrentView())"
      );
    }

    if (!Store.adminCache.departments || !Store.adminCache.courses) {
      Promise.all([Store.syncAdminDepartments(), Store.syncAdminCourses()]).then(() => App.renderCurrentView());
      return `
        <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
          <div class="spinner" style="margin: 0 auto 1rem auto; width: 36px; height: 36px; border: 3px solid var(--border-color); border-top-color: var(--accent-amber); border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p>Connecting to MongoDB & Loading Departments & Course Catalog...</p>
        </div>
      `;
    }

    const list = Store.adminCache.departments || Store.getDepartmentsList() || [];
    const courses = Store.adminCache.courses || [];

    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 800;">Academic Departments & Leadership</h1>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Manage university departments, HOD assignments, budgets, and course catalogs from MongoDB.</p>
          </div>
          <button class="btn btn-primary btn-sm" style="background: linear-gradient(135deg, #d97706, #7c3aed);" onclick="ModalsComponent.openAddDepartmentModal()">
            <i data-lucide="building-2"></i> Add Department
          </button>
        </div>

        <div class="grid-cols-3" style="margin-bottom: 2rem;">
          ${list.length === 0 ? `
            <div class="card" style="grid-column: span 3; padding: 2rem; text-align: center; color: var(--text-muted);">
              No departments found in MongoDB database.
            </div>
          ` : list.map(d => {
            const code = d.code || "DEPT";
            const name = d.name || "Department";
            const hodName = d.hodId ? d.hodId.name : (d.hod || "Dr. Department Chair");
            const students = d.studentsCount || d.students || 150;
            const faculty = d.facultyCount || d.faculty || 12;
            const budget = d.budget || "$450,000";

            return `
              <div class="card card-interactive">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                  <div class="stat-icon" style="width: 44px; height: 44px; background: rgba(245,158,11,0.15); color: #f59e0b;"><i data-lucide="building"></i></div>
                  <span class="badge badge-admin">${code}</span>
                </div>
                <h3 style="font-size: 1.15rem; margin-bottom: 0.5rem; line-height: 1.3;">${name}</h3>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">HOD: <strong>${hodName}</strong></p>
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color); color: var(--text-muted); margin-bottom: 0.75rem;">
                  <span>Enrolled: <strong>${students}</strong></span>
                  <span>Faculty: <strong>${faculty}</strong></span>
                  <span>Budget: <strong>${budget}</strong></span>
                </div>
                <div style="display: flex; gap: 0.35rem; justify-content: flex-end;">
                  <button class="btn btn-ghost btn-sm" onclick="const newHod = prompt('Edit HOD name for ${name}:', '${hodName}'); if(newHod) { Store.updateDepartment('${code}', { hod: newHod }).then(() => App.renderCurrentView()); }">Edit HOD</button>
                  <button class="btn btn-ghost btn-sm" style="color: var(--status-error);" onclick="if(confirm('Delete department ${name}?')) { Store.deleteDepartment('${code}').then(() => App.renderCurrentView()); }">Delete</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Master Course Catalog -->
        <div class="card">
          <h3 class="card-title" style="margin-bottom: 1rem;"><i data-lucide="book-open" style="color: var(--portal-accent);"></i> Institutional Master Courses Catalog (${courses.length} Active Courses)</h3>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Title</th>
                  <th>Department</th>
                  <th>Instructor / Faculty</th>
                  <th>Credits</th>
                  <th>Enrolled Students</th>
                </tr>
              </thead>
              <tbody>
                ${courses.length === 0 ? `
                  <tr>
                    <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No course records loaded from MongoDB.</td>
                  </tr>
                ` : courses.map(c => `
                  <tr>
                    <td><strong>${c.code}</strong></td>
                    <td>${c.name}</td>
                    <td>${c.deptId ? c.deptId.name : (c.department || 'Computer Science')}</td>
                    <td>${c.instructorId ? c.instructorId.name : 'Faculty Assigned'}</td>
                    <td><span class="badge badge-primary">${c.credits} Credits</span></td>
                    <td>${c.enrolledStudentsCount || 45} Students</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  // 5. Announcements Page
  renderAnnouncements: function() {
    if (Store.adminCache.loading.announcements) {
      return `
        <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
          <div class="spinner" style="margin: 0 auto 1rem auto; width: 36px; height: 36px; border: 3px solid var(--border-color); border-top-color: var(--accent-amber); border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p>Connecting to MongoDB & Loading Broadcast Announcements...</p>
        </div>
      `;
    }

    if (Store.adminCache.error.announcements) {
      return this.renderErrorState(
        "Failed to Load Broadcast Announcements",
        Store.adminCache.error.announcements,
        "Store.syncAdminAnnouncements().then(() => App.renderCurrentView())"
      );
    }

    if (!Store.adminCache.announcements) {
      Store.syncAdminAnnouncements().then(() => App.renderCurrentView());
      return `
        <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
          <div class="spinner" style="margin: 0 auto 1rem auto; width: 36px; height: 36px; border: 3px solid var(--border-color); border-top-color: var(--accent-amber); border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p>Connecting to MongoDB & Loading Broadcast Announcements...</p>
        </div>
      `;
    }

    const list = Store.adminCache.announcements || Store.getAnnouncements() || [];

    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 800;">Campus Announcement Publisher</h1>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Broadcast campus-wide notices, exam releases, and emergency alerts from MongoDB.</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="ModalsComponent.openModal('modal-add-announcement')" style="background: linear-gradient(135deg, #d97706, #7c3aed);">
            <i data-lucide="megaphone"></i> Publish New Broadcast
          </button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${list.length === 0 ? `
            <div class="card" style="padding: 2rem; text-align: center; color: var(--text-muted);">
              No announcements published in MongoDB database.
            </div>
          ` : list.map(a => {
            const id = a.id || a._id;
            const title = a.title;
            const priority = a.priority || 'Normal';
            const target = a.targetPortal || a.target || 'All';
            const message = a.message || a.desc || '';
            const date = a.date ? new Date(a.date).toLocaleDateString() : (a.createdAt ? new Date(a.createdAt).toLocaleDateString() : 'Recent');
            const author = a.authorRole || a.author || 'Admin';

            return `
              <div class="card" style="padding: 1.25rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <h3 style="font-size: 1.1rem;">${title}</h3>
                    <span class="badge badge-${priority === 'High' ? 'danger' : 'admin'}">${priority} Priority</span>
                  </div>
                  <span class="badge badge-primary">Portal Target: ${target}</span>
                </div>
                ${message ? `<p style="font-size: 0.9rem; margin-bottom: 0.75rem; color: var(--text-color, #e2e8f0); line-height: 1.5;">${message}</p>` : ''}
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">Published on ${date} by <strong>${author}</strong></p>
                <div style="display: flex; gap: 0.5rem;">
                  <button class="btn btn-ghost btn-sm" onclick="ModalsComponent.openEditAnnouncementModal('${id}')">Edit Notice</button>
                  <button class="btn btn-ghost btn-sm" style="color: var(--status-error);" onclick="if(confirm('Are you sure you want to delete announcement &quot;${title}&quot;? This will remove it from MongoDB.')) { Store.deleteAnnouncement('${id}'); App.renderCurrentView(); }">Remove Broadcast</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // 6. Events Management Page
  renderEventsManagement: function() {
    if (Store.adminCache.loading.events) {
      return `
        <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
          <div class="spinner" style="margin: 0 auto 1rem auto; width: 36px; height: 36px; border: 3px solid var(--border-color); border-top-color: var(--accent-amber); border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p>Connecting to MongoDB & Loading Campus Venue Reservations...</p>
        </div>
      `;
    }

    if (Store.adminCache.error.events) {
      return this.renderErrorState(
        "Failed to Load Campus Events & Reservations",
        Store.adminCache.error.events,
        "Store.syncAdminEvents().then(() => App.renderCurrentView())"
      );
    }

    if (!Store.adminCache.events) {
      Store.syncAdminEvents().then(() => App.renderCurrentView());
      return `
        <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
          <div class="spinner" style="margin: 0 auto 1rem auto; width: 36px; height: 36px; border: 3px solid var(--border-color); border-top-color: var(--accent-amber); border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p>Connecting to MongoDB & Loading Campus Venue Reservations...</p>
        </div>
      `;
    }

    const list = Store.adminCache.events || Store.getEventsApprovals() || [];

    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 800;">Campus Events & Venue Reservations</h1>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Approve venue requests for campus auditoriums, labs, and sports arenas from MongoDB.</p>
          </div>
          <button class="btn btn-primary btn-sm" style="background: linear-gradient(135deg, #d97706, #7c3aed);" onclick="ModalsComponent.openModal('modal-reserve-venue')">
            <i data-lucide="calendar-plus"></i> Reserve Venue
          </button>
        </div>

        <div class="card">
          <h3 class="card-title" style="margin-bottom: 1.25rem;"><i data-lucide="calendar"></i> Pending & Approved Campus Event Requests</h3>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Organizer / Department</th>
                  <th>Requested Venue</th>
                  <th>Date</th>
                  <th>Approval Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${list.length === 0 ? `
                  <tr>
                    <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No campus events registered in database.</td>
                  </tr>
                ` : list.map(e => {
                  const id = e._id || e.id;
                  const title = e.title;
                  const organizer = e.organizer || e.category || 'Student Union';
                  const venue = e.location || e.venue || 'Auditorium';
                  const date = e.date ? new Date(e.date).toLocaleDateString() : 'Upcoming';
                  const status = e.status || 'Approved';

                  return `
                    <tr>
                      <td><strong>${title}</strong></td>
                      <td>${organizer}</td>
                      <td>${venue}</td>
                      <td>${date}</td>
                      <td><span class="badge badge-${status === 'Approved' ? 'staff' : 'admin'}">${status}</span></td>
                      <td>
                        <div style="display: flex; gap: 0.35rem; align-items: center; flex-wrap: wrap;">
                          ${status !== 'Approved' ? `
                            <button class="btn btn-primary btn-sm" onclick="Store.approveEvent('${id}'); App.renderCurrentView();">Approve</button>
                          ` : `
                            <span class="badge badge-staff">Approved ✓</span>
                          `}
                          <button class="btn btn-ghost btn-sm" onclick="ModalsComponent.showEventDetails('${id}')">View</button>
                          <button class="btn btn-ghost btn-sm" style="color: var(--primary-400);" onclick="ModalsComponent.openEditVenueModal('${id}')">Edit</button>
                          <button class="btn btn-ghost btn-sm" style="color: var(--status-error);" onclick="if(confirm('Are you sure you want to delete event reservation for ${title}? This will remove it from MongoDB.')) { Store.deleteEventApproval('${id}'); App.renderCurrentView(); }">Delete</button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  // 7. Attendance & Reports Page
  renderAttendanceReports: function() {
    if (Store.adminCache.loading.attendance || Store.adminCache.loading.reports) {
      return `
        <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
          <div class="spinner" style="margin: 0 auto 1rem auto; width: 36px; height: 36px; border: 3px solid var(--border-color); border-top-color: var(--accent-amber); border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p>Connecting to MongoDB & Loading Attendance Analytics & System Reports...</p>
        </div>
      `;
    }

    const err = Store.adminCache.error.attendance || Store.adminCache.error.reports;
    if (err) {
      return this.renderErrorState(
        "Failed to Load Attendance Analytics & Reports",
        err,
        "Promise.all([Store.syncAdminAttendance(), Store.syncAdminReports()]).then(() => App.renderCurrentView())"
      );
    }

    if (!Store.adminCache.attendance || !Store.adminCache.reports) {
      Promise.all([Store.syncAdminAttendance(), Store.syncAdminReports()]).then(() => App.renderCurrentView());
      return `
        <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
          <div class="spinner" style="margin: 0 auto 1rem auto; width: 36px; height: 36px; border: 3px solid var(--border-color); border-top-color: var(--accent-amber); border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p>Connecting to MongoDB & Loading Attendance Analytics & System Reports...</p>
        </div>
      `;
    }

    const attData = Store.adminCache.attendance || {};
    const summary = attData.summary || {};
    const recentLogs = attData.recentLogs || [];

    const reportsData = Store.adminCache.reports || {};
    const deptReports = reportsData.departmentReports || [];

    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 800;">Attendance & Analytical System Reports</h1>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Real-time attendance logs, department enrollment metrics, and system analytics from MongoDB.</p>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-primary btn-sm" style="background: linear-gradient(135deg, #d97706, #7c3aed);" onclick="AdminViews.exportReportsPDF()">
              <i data-lucide="file-text"></i> Export PDF Report
            </button>
            <button class="btn btn-outline btn-sm" onclick="AdminViews.exportAttendanceCSV()">
              <i data-lucide="download"></i> Export Excel CSV
            </button>
          </div>
        </div>

        <!-- Summary Metrics Row -->
        <div class="grid-cols-4" style="margin-bottom: 2rem;">
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981;"><i data-lucide="check-circle"></i></div>
            <div class="stat-info">
              <span class="stat-value">${summary.overallPercentage || '95.5%'}</span>
              <span class="stat-label">Overall Attendance Rate</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6;"><i data-lucide="user-check"></i></div>
            <div class="stat-info">
              <span class="stat-value">${summary.present || 120}</span>
              <span class="stat-label">Present Sessions</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;"><i data-lucide="user-x"></i></div>
            <div class="stat-info">
              <span class="stat-value">${summary.absent || 8}</span>
              <span class="stat-label">Absent Records</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;"><i data-lucide="clock"></i></div>
            <div class="stat-info">
              <span class="stat-value">${summary.totalRecords || 135}</span>
              <span class="stat-label">Total Audit Logs</span>
            </div>
          </div>
        </div>

        <!-- Recent MongoDB Attendance Logs Table -->
        <div class="card" style="margin-bottom: 2rem;">
          <h3 class="card-title" style="margin-bottom: 1rem;"><i data-lucide="activity" style="color: var(--status-success);"></i> Recent Student Attendance Logs (MongoDB Live Sync)</h3>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Subject Course</th>
                  <th>Instructor</th>
                  <th>Date Recorded</th>
                  <th>Attendance Status</th>
                </tr>
              </thead>
              <tbody>
                ${recentLogs.length === 0 ? `
                  <tr>
                    <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No attendance logs loaded.</td>
                  </tr>
                ` : recentLogs.map(l => `
                  <tr>
                    <td><strong>${l.studentId ? l.studentId.name : 'Student Record'}</strong></td>
                    <td>${l.courseId ? (l.courseId.code + ': ' + l.courseId.name) : 'Subject Course'}</td>
                    <td>${l.instructorId ? l.instructorId.name : 'Faculty Member'}</td>
                    <td>${l.date ? new Date(l.date).toLocaleDateString() : 'Today'}</td>
                    <td><span class="badge badge-${l.status === 'Present' ? 'staff' : (l.status === 'Late' ? 'admin' : 'danger')}">${l.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Department Reports Table -->
        <div class="card">
          <h3 class="card-title" style="margin-bottom: 1rem;"><i data-lucide="bar-chart-2" style="color: var(--accent-amber);"></i> Institutional Departmental Analytics Breakdown</h3>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Dept Code</th>
                  <th>Department Name</th>
                  <th>Active Students</th>
                  <th>Faculty Staff</th>
                  <th>Courses Offered</th>
                  <th>Allocated Budget</th>
                </tr>
              </thead>
              <tbody>
                ${deptReports.length === 0 ? `
                  <tr>
                    <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No departmental report metrics available.</td>
                  </tr>
                ` : deptReports.map(dr => `
                  <tr>
                    <td><strong>${dr.deptCode}</strong></td>
                    <td>${dr.deptName}</td>
                    <td>${dr.students} Students</td>
                    <td>${dr.faculty} Faculty</td>
                    <td>${dr.courses} Courses</td>
                    <td><span class="badge badge-primary">${dr.budget || '$450,000'}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  // 8. Admin Profile Page
  renderAdminProfile: function() {
    const logs = Store.getAuditLogs();
    const user = Auth.getCurrentUser();
    return `
      <div style="max-width: 1000px; margin: 0 auto;">
        <div class="card glass-panel" style="background: linear-gradient(135deg, rgba(217, 119, 6, 0.2) 0%, rgba(124, 58, 237, 0.15) 100%); margin-bottom: 2rem;">
          <div style="display: flex; align-items: center; gap: 1.5rem;">
            <div class="user-avatar" style="width: 80px; height: 80px; font-size: 2rem; background: linear-gradient(135deg, #d97706, #7c3aed);">${user.avatar || 'SA'}</div>
            <div>
              <h1 style="font-size: 2rem; font-weight: 800;">${user.name}</h1>
              <p style="color: var(--text-muted); font-size: 0.92rem;">${user.department} • Superuser Root Access</p>
              <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                <span class="badge badge-admin">Super Admin</span>
                <span class="badge badge-staff">System Status: Operational</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card" style="margin-bottom: 2rem;">
          <h3 class="card-title" style="margin-bottom: 1.25rem;"><i data-lucide="shield" style="color: var(--accent-amber);"></i> System Security Audit Log (${logs.length} entries)</h3>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Audit ID</th>
                  <th>Action Description</th>
                  <th>User / Actor</th>
                  <th>Target Object</th>
                  <th>IP Address</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                ${logs.map(l => `
                  <tr>
                    <td><strong>${l.id}</strong></td>
                    <td>${l.action}</td>
                    <td>${l.actor}</td>
                    <td>${l.target}</td>
                    <td><code>${l.ip}</code></td>
                    <td><span style="font-size: 0.78rem; color: var(--text-muted);">${l.timestamp}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  // 9. Anonymous Campus Community Page
  renderCommunity: function() {
    return CommunityView.render('admin');
  },

  // 10. Anonymous Community AI Moderation Dashboard
  renderCommunityModeration: function() {
    const posts = Store.getCommunityPosts();
    const flaggedPosts = posts.filter(p => p.status === 'pending' || p.status === 'flagged' || p.flagReason || p.linkedPostId);

    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 800;">Anonymous Community AI Moderation</h1>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Review AI-flagged suspicious posts, duplicate issues, and toxic content reports.</p>
          </div>
          <span class="badge badge-admin"><i data-lucide="shield-alert"></i> Admin Moderation Active</span>
        </div>

        <!-- Metrics Grid -->
        <div class="grid-cols-4" style="margin-bottom: 2rem;">
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(124, 58, 237, 0.15); color: #8b5cf6;"><i data-lucide="message-square"></i></div>
            <div class="stat-info">
              <span class="stat-value">${posts.length}</span>
              <span class="stat-label">Total Community Posts</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;"><i data-lucide="alert-triangle"></i></div>
            <div class="stat-info">
              <span class="stat-value">${flaggedPosts.length}</span>
              <span class="stat-label">Pending / Flagged for Review</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;"><i data-lucide="link"></i></div>
            <div class="stat-info">
              <span class="stat-value">${posts.filter(p => p.linkedPostId || (p.duplicateScore && p.duplicateScore > 50)).length}</span>
              <span class="stat-label">Duplicate Issues Linked</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981;"><i data-lucide="check-circle"></i></div>
            <div class="stat-info">
              <span class="stat-value">${posts.filter(p => p.status === 'approved' || p.status === 'active').length}</span>
              <span class="stat-label">Approved Active Posts</span>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="card-title" style="margin-bottom: 1.25rem;"><i data-lucide="shield-alert" style="color: var(--status-error);"></i> Flagged & Reviewed Anonymous Posts Queue</h3>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Post ID</th>
                  <th>Anonymous Author</th>
                  <th>Category</th>
                  <th>Post Content Preview</th>
                  <th>AI Moderation Scores</th>
                  <th>AI Flag Reason</th>
                  <th>Status</th>
                  <th>Moderation Actions</th>
                </tr>
              </thead>
              <tbody>
                ${flaggedPosts.length === 0 ? `
                  <tr>
                    <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                      No flagged posts currently requiring moderation review.
                    </td>
                  </tr>
                ` : flaggedPosts.map(p => `
                  <tr>
                    <td><strong>${p.id}</strong></td>
                    <td><span class="badge badge-${p.authorRole === 'staff' ? 'staff' : 'student'}">${p.authorRole === 'staff' ? 'Anonymous Faculty' : 'Anonymous Student'}</span></td>
                    <td>${p.category}</td>
                    <td style="max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.text}</td>
                    <td>
                      <div style="font-size: 0.78rem; display: flex; flex-direction: column; gap: 0.15rem;">
                        <span style="color: ${p.toxicScore > 50 ? 'var(--status-error)' : 'var(--text-muted)'}; font-weight: ${p.toxicScore > 50 ? '700' : 'normal'};">Toxic: ${p.toxicScore || 0}%</span>
                        <span style="color: ${p.duplicateScore > 50 ? '#f59e0b' : 'var(--text-muted)'}; font-weight: ${p.duplicateScore > 50 ? '700' : 'normal'};">Duplicate: ${p.duplicateScore || 0}%</span>
                        <span style="color: ${p.fakeScore > 50 ? '#ef4444' : 'var(--text-muted)'}; font-weight: ${p.fakeScore > 50 ? '700' : 'normal'};">Suspicious: ${p.fakeScore || 0}%</span>
                      </div>
                    </td>
                    <td><span style="font-size: 0.8rem; color: var(--status-error);">${p.flagReason || 'User Reported'}</span></td>
                    <td><span class="badge badge-${(p.status === 'approved' || p.status === 'active') ? 'staff' : 'danger'}">${p.status}</span></td>
                    <td>
                      <div style="display: flex; gap: 0.35rem;">
                        <button class="btn btn-primary btn-sm" style="font-size: 0.75rem;" onclick="Store.moderateCommunityPost('${p.id}', 'approve').then(() => App.renderCurrentView());">Approve</button>
                        <button class="btn btn-secondary btn-sm" style="font-size: 0.75rem;" onclick="Store.moderateCommunityPost('${p.id}', 'reject').then(() => App.renderCurrentView());">Reject / Hide</button>
                        <button class="btn btn-ghost btn-sm" style="color: var(--status-error); font-size: 0.75rem;" onclick="if(confirm('Remove post completely? This will delete it from MongoDB.')) { Store.moderateCommunityPost('${p.id}', 'remove').then(() => App.renderCurrentView()); }">Delete</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  // 13. AI Copilot (Atlas & Nova)
  renderAIAssistant: function() {
    return AIChatComponent.render('admin');
  },

  // 14. Admin Knowledge Base & Vector Store
  renderKnowledgeBase: function() {
    setTimeout(() => KnowledgeBaseView.loadDocuments(), 50);
    return KnowledgeBaseView.render();
  },

  // 15. Service Requests Helpdesk Management
  renderServiceRequests: function() {
    setTimeout(() => ServiceRequestsView.loadTickets('admin'), 50);
    return ServiceRequestsView.render('admin');
  },

  // 16. AI Multi-Agent Audit Logs & Viva Transparency
  renderAgentLogs: function() {
    setTimeout(() => AgentLogsView.loadLogs(), 50);
    return AgentLogsView.render();
  },

  // 17. Campus Map
  renderCampusMap: function() {
    setTimeout(() => CampusMapView.initMap(), 100);
    return CampusMapView.render('admin');
  },

  exportAttendanceCSV: function() {
    const logs = (Store.adminCache.attendance && Store.adminCache.attendance.recentLogs) ? Store.adminCache.attendance.recentLogs : [];
    let csv = 'Student Name,Course Code,Course Name,Instructor,Date,Status\n';
    logs.forEach(l => {
      const sName = (l.studentId ? l.studentId.name : 'Student Record').replace(/,/g, '');
      const cCode = l.courseId ? l.courseId.code : 'N/A';
      const cName = (l.courseId ? l.courseId.name : 'Subject Course').replace(/,/g, '');
      const inst = (l.instructorId ? l.instructorId.name : 'Faculty Member').replace(/,/g, '');
      const d = l.date ? new Date(l.date).toLocaleDateString() : 'Today';
      const st = l.status || 'Present';
      csv += `"${sName}","${cCode}","${cName}","${inst}","${d}","${st}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (window.App && App.showToast) App.showToast('Attendance report CSV downloaded!', 'success');
  },

  exportReportsPDF: function() {
    const printWin = window.open('', '_blank');
    const attData = Store.adminCache.attendance || {};
    const summary = attData.summary || {};
    const reportsData = Store.adminCache.reports || {};
    const deptReports = reportsData.departmentReports || [];

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Campus Executive Analytics Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #1e293b; }
          h1 { color: #d97706; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
          th { background: #f1f5f9; }
          .summary { display: flex; gap: 20px; margin: 15px 0; }
          .card { border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; flex: 1; }
        </style>
      </head>
      <body>
        <h1>Institutional Analytics & Attendance Executive Report</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <div class="summary">
          <div class="card"><strong>Overall Attendance Rate:</strong> ${summary.overallPercentage || '95.5%'}</div>
          <div class="card"><strong>Present Sessions:</strong> ${summary.present || 120}</div>
          <div class="card"><strong>Absent Records:</strong> ${summary.absent || 8}</div>
        </div>
        <h2>Departmental Breakdown</h2>
        <table>
          <thead>
            <tr><th>Dept Code</th><th>Department Name</th><th>Students</th><th>Faculty</th><th>Courses</th><th>Budget</th></tr>
          </thead>
          <tbody>
            ${deptReports.map(dr => `
              <tr>
                <td>${dr.deptCode}</td>
                <td>${dr.deptName}</td>
                <td>${dr.students}</td>
                <td>${dr.faculty}</td>
                <td>${dr.courses}</td>
                <td>${dr.budget || '$450,000'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
    }, 250);
  }
};
