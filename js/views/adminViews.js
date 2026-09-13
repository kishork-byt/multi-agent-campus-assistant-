/* ==========================================================================
   COLLEGE AI ASSISTANT - ADMINISTRATION PORTAL VIEWS (FUNCTIONAL ENGINE)
   ========================================================================== */

const AdminViews = {
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

        <!-- Analytical Charts Row -->
        <div class="grid-cols-2" style="margin-bottom: 2rem;">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title"><i data-lucide="line-chart" style="color: var(--portal-accent);"></i> Weekly Campus Attendance Trends</h3>
            </div>
            <div style="height: 240px; position: relative;">
              <canvas id="admin-attendance-chart"></canvas>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3 class="card-title"><i data-lucide="bar-chart" style="color: var(--accent-cyan);"></i> Students per Department</h3>
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

  // 2. Students Management (STORE PERSISTENT)
  renderStudentsManagement: function() {
    const list = Store.getStudentsList();
    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 800;">Students Master Database Directory</h1>
            <p style="color: var(--text-muted); font-size: 0.9rem;">View, search, filter, add, and manage persistent student records.</p>
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
              <select class="input-field select-field" style="max-width: 200px;" onchange="AdminViews.filterStudentsDept(this.value)">
                <option value="all">All Departments</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Data Science">Data Science</option>
                <option value="Electrical Eng.">Electrical Eng.</option>
                <option value="Biotechnology">Biotechnology</option>
                <option value="Mechanical Eng.">Mechanical Eng.</option>
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
                ${list.map(s => `
                  <tr data-dept="${s.dept}">
                    <td><strong>${s.id}</strong></td>
                    <td>${s.name}</td>
                    <td>${s.dept}</td>
                    <td>${s.year}</td>
                    <td><span class="badge badge-primary">${s.cgpa}</span></td>
                    <td><span style="font-size: 0.8rem; color: var(--text-muted);">${s.email || 'student@university.edu'}</span></td>
                    <td><span class="badge badge-${s.status === 'Active' ? 'staff' : 'danger'}">${s.status}</span></td>
                    <td>
                      <div style="display: flex; gap: 0.25rem;">
                        <button class="btn btn-ghost btn-sm" onclick="alert('Student Record Details:\\nID: ${s.id}\\nName: ${s.name}\\nDept: ${s.dept}\\nCGPA: ${s.cgpa}')">View</button>
                        <button class="btn btn-ghost btn-sm" style="color: var(--primary-400);" onclick="AdminViews.editStudentPrompt('${s.id}')">Edit</button>
                        <button class="btn btn-ghost btn-sm" style="color: var(--status-error);" onclick="if(confirm('Delete record for ${s.name}?')) { Store.deleteStudent('${s.id}'); App.renderCurrentView(); }">Delete</button>
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

  editStudentPrompt: function(studentId) {
    const student = Store.getStudentsList().find(s => s.id === studentId || s._id === studentId);
    if (!student) return;
    const newCGPA = prompt(`Edit CGPA for ${student.name} (${student.id}):`, student.cgpa);
    if (newCGPA !== null && newCGPA.trim()) {
      Store.updateStudent(studentId, { cgpa: newCGPA.trim() });
      App.renderCurrentView();
    }
  },

  searchStudents: function(query) {
    const q = query.toLowerCase();
    document.querySelectorAll('#admin-students-table-body tr').forEach(row => {
      row.style.display = row.innerText.toLowerCase().includes(q) ? '' : 'none';
    });
  },

  filterStudentsDept: function(dept) {
    document.querySelectorAll('#admin-students-table-body tr').forEach(row => {
      const d = row.getAttribute('data-dept');
      row.style.display = (dept === 'all' || d.includes(dept)) ? '' : 'none';
    });
  },

  // 3. Staff Management (STORE PERSISTENT & BACKEND SYNCED)
  renderStaffManagement: function() {
    const list = Store.getStaffList();
    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 800;">Faculty & Staff Master Directory</h1>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Manage professors, department heads, research fellows, and staff credentials.</p>
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
              <select class="input-field select-field" style="max-width: 200px;" onchange="AdminViews.filterStaffDept(this.value)">
                <option value="all">All Departments</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Data Science">Data Science</option>
                <option value="Electrical Eng.">Electrical Eng.</option>
                <option value="Biotechnology">Biotechnology</option>
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
                ${list.map(s => `
                  <tr data-dept="${s.dept}">
                    <td><strong>${s.id}</strong></td>
                    <td>${s.name}</td>
                    <td>${s.dept}</td>
                    <td>${s.role}</td>
                    <td><span style="font-size: 0.8rem; color: var(--text-muted);">${s.email}</span></td>
                    <td>${s.courses} Courses</td>
                    <td><span class="badge badge-${s.status === 'Active' ? 'staff' : 'admin'}">${s.status}</span></td>
                    <td>
                      <div style="display: flex; gap: 0.25rem;">
                        <button class="btn btn-ghost btn-sm" onclick="alert('Faculty Record Details:\\nID: ${s.id}\\nName: ${s.name}\\nDept: ${s.dept}\\nRole: ${s.role}\\nEmail: ${s.email}\\nCourses: ${s.courses}\\nStatus: ${s.status}')">View</button>
                        <button class="btn btn-ghost btn-sm" style="color: var(--primary-400);" onclick="ModalsComponent.openEditStaffModal('${s.id}')">Edit</button>
                        <button class="btn btn-ghost btn-sm" style="color: var(--status-error);" onclick="if(confirm('Are you sure you want to delete faculty record for ${s.name} (${s.id})? This will remove it from MongoDB.')) { Store.deleteStaff('${s.id}'); App.renderCurrentView(); }">Delete</button>
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
      const d = row.getAttribute('data-dept');
      row.style.display = (dept === 'all' || (d && d.includes(dept))) ? '' : 'none';
    });
  },

  // 4. Departments Page (STORE PERSISTENT)
  renderDepartments: function() {
    const list = Store.getDepartmentsList();
    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 800;">Academic Departments & Leadership</h1>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Manage university departments, HOD assignments, budgets, and faculty counts.</p>
          </div>
          <button class="btn btn-primary btn-sm" style="background: linear-gradient(135deg, #d97706, #7c3aed);" onclick="const name = prompt('Enter new Department name:'); if(name) { Store.addDepartment({name}); App.renderCurrentView(); }">
            <i data-lucide="building-2"></i> Add Department
          </button>
        </div>

        <div class="grid-cols-3">
          ${list.map(d => `
            <div class="card card-interactive">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <div class="stat-icon" style="width: 44px; height: 44px; background: rgba(245,158,11,0.15); color: #f59e0b;"><i data-lucide="building"></i></div>
                <span class="badge badge-admin">${d.code}</span>
              </div>
              <h3 style="font-size: 1.15rem; margin-bottom: 0.5rem; line-height: 1.3;">${d.name}</h3>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">HOD: <strong>${d.hod}</strong></p>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color); color: var(--text-muted);">
                <span>Enrolled: <strong>${d.students}</strong></span>
                <span>Faculty: <strong>${d.faculty}</strong></span>
                <span>Budget: <strong>${d.budget}</strong></span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // 5. Announcements Page (STORE PERSISTENT)
  renderAnnouncements: function() {
    const list = Store.getAnnouncements();
    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 800;">Campus Announcement Publisher</h1>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Broadcast campus-wide notices, exam releases, and emergency alerts.</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="ModalsComponent.openModal('modal-add-announcement')" style="background: linear-gradient(135deg, #d97706, #7c3aed);">
            <i data-lucide="megaphone"></i> Publish New Broadcast
          </button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${list.map(a => `
            <div class="card" style="padding: 1.25rem;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <h3 style="font-size: 1.1rem;">${a.title}</h3>
                  <span class="badge badge-${a.priority === 'High' ? 'danger' : 'admin'}">${a.priority || 'Normal'} Priority</span>
                </div>
                <span class="badge badge-primary">${a.target}</span>
              </div>
              ${a.message ? `<p style="font-size: 0.9rem; margin-bottom: 0.75rem; color: var(--text-color, #e2e8f0); line-height: 1.5;">${a.message}</p>` : ''}
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">Published on ${a.date} by <strong>${a.author}</strong></p>
              <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-ghost btn-sm" onclick="ModalsComponent.openEditAnnouncementModal('${a.id}')">Edit Notice</button>
                <button class="btn btn-ghost btn-sm" style="color: var(--status-error);" onclick="if(confirm('Are you sure you want to delete announcement &quot;${a.title}&quot;? This will remove it from MongoDB.')) { Store.deleteAnnouncement('${a.id}'); App.renderCurrentView(); }">Remove Broadcast</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // 6. Events Management Page (STORE PERSISTENT & MODAL FUNCTIONAL)
  renderEventsManagement: function() {
    const list = Store.getEventsApprovals();
    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 800;">Campus Events & Venue Reservations</h1>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Approve venue requests for campus auditoriums, labs, and sports arenas.</p>
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
                ${list.map(e => `
                  <tr>
                    <td><strong>${e.title}</strong></td>
                    <td>${e.organizer}</td>
                    <td>${e.venue}</td>
                    <td>${e.date}</td>
                    <td><span class="badge badge-${e.status === 'Approved' ? 'staff' : 'admin'}">${e.status}</span></td>
                    <td>
                      <div style="display: flex; gap: 0.35rem; align-items: center; flex-wrap: wrap;">
                        ${e.status !== 'Approved' ? `
                          <button class="btn btn-primary btn-sm" onclick="Store.approveEvent('${e.id}'); App.renderCurrentView();">Approve</button>
                        ` : `
                          <span class="badge badge-staff">Approved ✓</span>
                        `}
                        <button class="btn btn-ghost btn-sm" onclick="ModalsComponent.showEventDetails('${e.id}')">View</button>
                        <button class="btn btn-ghost btn-sm" style="color: var(--primary-400);" onclick="ModalsComponent.openEditVenueModal('${e.id}')">Edit</button>
                        <button class="btn btn-ghost btn-sm" style="color: var(--status-error);" onclick="if(confirm('Are you sure you want to delete event reservation for ${e.title}? This will remove it from MongoDB.')) { Store.deleteEventApproval('${e.id}'); App.renderCurrentView(); }">Delete</button>
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

  // 7. Attendance & Reports Page
  renderAttendanceReports: function() {
    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 800;">Attendance & Analytical System Reports</h1>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Export campus-wide attendance sheets, GPA distributions, and AI usage metrics.</p>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-primary btn-sm" style="background: linear-gradient(135deg, #d97706, #7c3aed);" onclick="alert('PDF Report generated and downloaded!')">
              <i data-lucide="file-text"></i> Export PDF Report
            </button>
            <button class="btn btn-outline btn-sm" onclick="alert('Excel CSV Export downloaded!')">
              <i data-lucide="download"></i> Export Excel CSV
            </button>
          </div>
        </div>

        <div class="card" style="margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 class="card-title"><i data-lucide="line-chart" style="color: var(--portal-accent);"></i> Campus Weekly Attendance Rate Analytics</h3>
            <select class="input-field select-field" style="max-width: 180px;">
              <option>Fall 2026 Semester</option>
              <option>Spring 2026 Semester</option>
            </select>
          </div>
          <div style="height: 280px; position: relative;">
            <canvas id="report-attendance-chart"></canvas>
          </div>
        </div>
      </div>
    `;
  },

  // 8. Admin Profile Page (STORE PERSISTENT AUDIT LOGS)
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
  }
};
