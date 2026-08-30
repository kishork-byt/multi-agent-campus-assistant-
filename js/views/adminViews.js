/* ==========================================================================
   COLLEGE AI ASSISTANT - ADMINISTRATION PORTAL VIEWS (FUNCTIONAL ENGINE)
   ========================================================================== */

const AdminViews = {
  // 1. Dashboard
  renderDashboard: function() {
    const stats = Store.getAdminStats();
    return `
      <div>
        <div class="card glass-panel" style="background: linear-gradient(135deg, rgba(217, 119, 6, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%); margin-bottom: 2rem; border-color: rgba(245, 158, 11, 0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <span class="badge badge-admin" style="margin-bottom: 0.5rem;">Administration Portal</span>
              <h1 style="font-size: 2rem; font-weight: 800;">Campus Administration Overview</h1>
              <p style="color: var(--text-muted); font-size: 0.95rem;">System status normal • ${stats.totalStudents} enrolled students • ${stats.departments} departments active.</p>
            </div>
            <button class="btn btn-primary" onclick="ModalsComponent.openModal('modal-add-student')" style="background: linear-gradient(135deg, #d97706, #7c3aed);">
              <i data-lucide="user-plus"></i> Add New Student
            </button>
          </div>
        </div>

        <!-- Metrics -->
        <div class="grid-cols-4" style="margin-bottom: 2rem;">
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;"><i data-lucide="users"></i></div>
            <div class="stat-info">
              <span class="stat-value">${stats.totalStudents}</span>
              <span class="stat-label">Total Enrolled Students</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981;"><i data-lucide="user-check"></i></div>
            <div class="stat-info">
              <span class="stat-value">${stats.totalStaff}</span>
              <span class="stat-label">Active Faculty & Staff</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(99, 102, 241, 0.15); color: #6366f1;"><i data-lucide="building"></i></div>
            <div class="stat-info">
              <span class="stat-value">${stats.departments}</span>
              <span class="stat-label">Academic Departments</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(6, 182, 212, 0.15); color: #06b6d4;"><i data-lucide="cpu"></i></div>
            <div class="stat-info">
              <span class="stat-value">${stats.activeAiQueries}</span>
              <span class="stat-label">Daily AI Copilot Usage</span>
            </div>
          </div>
        </div>

        <!-- Analytical Charts Row -->
        <div class="grid-cols-2" style="margin-bottom: 2rem;">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title"><i data-lucide="line-chart" style="color: var(--portal-accent);"></i> Weekly Campus Attendance Trends</h3>
            </div>
            <div style="height: 250px; position: relative;">
              <canvas id="admin-attendance-chart"></canvas>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3 class="card-title"><i data-lucide="bar-chart" style="color: var(--accent-cyan);"></i> Students per Department</h3>
            </div>
            <div style="height: 250px; position: relative;">
              <canvas id="admin-dept-chart"></canvas>
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

  // 3. Staff Management (STORE PERSISTENT)
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
              <tbody>
                ${list.map(s => `
                  <tr>
                    <td><strong>${s.id}</strong></td>
                    <td>${s.name}</td>
                    <td>${s.dept}</td>
                    <td>${s.role}</td>
                    <td><span style="font-size: 0.8rem; color: var(--text-muted);">${s.email}</span></td>
                    <td>${s.courses} Courses</td>
                    <td><span class="badge badge-${s.status === 'Active' ? 'staff' : 'admin'}">${s.status}</span></td>
                    <td>
                      <button class="btn btn-ghost btn-sm" onclick="alert('Editing permissions for ${s.name}')">Edit Permissions</button>
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
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">Published on ${a.date} by <strong>${a.author}</strong></p>
              <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-ghost btn-sm" onclick="alert('Editing broadcast announcement: ${a.title}')">Edit Notice</button>
                <button class="btn btn-ghost btn-sm" style="color: var(--status-error);" onclick="if(confirm('Remove announcement?')) { Store.deleteAnnouncement('${a.id}'); App.renderCurrentView(); }">Remove Broadcast</button>
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
                      <div style="display: flex; gap: 0.35rem; align-items: center;">
                        ${e.status !== 'Approved' ? `
                          <button class="btn btn-primary btn-sm" onclick="Store.approveEvent('${e.id}'); App.renderCurrentView();">Approve Event</button>
                        ` : `
                          <span class="badge badge-staff">Approved ✓</span>
                        `}
                        <button class="btn btn-ghost btn-sm" onclick="ModalsComponent.showEventDetails('${e.id}')">View Details</button>
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
    const flaggedPosts = posts.filter(p => p.status === 'flagged' || p.flagReason || p.linkedPostId);

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
              <span class="stat-label">Flagged for AI Review</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;"><i data-lucide="link"></i></div>
            <div class="stat-info">
              <span class="stat-value">${posts.filter(p => p.linkedPostId).length}</span>
              <span class="stat-label">Duplicate Issues Linked</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981;"><i data-lucide="check-circle"></i></div>
            <div class="stat-info">
              <span class="stat-value">${posts.filter(p => p.status === 'active').length}</span>
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
                  <th>Post Preview</th>
                  <th>AI Flag Reason</th>
                  <th>Status</th>
                  <th>Moderation Actions</th>
                </tr>
              </thead>
              <tbody>
                ${flaggedPosts.length === 0 ? `
                  <tr>
                    <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                      No flagged posts currently requiring moderation review.
                    </td>
                  </tr>
                ` : flaggedPosts.map(p => `
                  <tr>
                    <td><strong>${p.id}</strong></td>
                    <td><span class="badge badge-${p.authorRole === 'staff' ? 'staff' : 'student'}">${p.authorRole === 'staff' ? 'Anonymous Faculty' : 'Anonymous Student'}</span></td>
                    <td>${p.category}</td>
                    <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.text}</td>
                    <td><span style="font-size: 0.8rem; color: var(--status-error);">${p.flagReason || 'User Reported'}</span></td>
                    <td><span class="badge badge-${p.status === 'active' ? 'staff' : 'danger'}">${p.status}</span></td>
                    <td>
                      <div style="display: flex; gap: 0.35rem;">
                        <button class="btn btn-primary btn-sm" style="font-size: 0.75rem;" onclick="Store.moderateCommunityPost('${p.id}', 'approve'); App.renderCurrentView();">Approve</button>
                        <button class="btn btn-secondary btn-sm" style="font-size: 0.75rem;" onclick="Store.moderateCommunityPost('${p.id}', 'hide'); App.renderCurrentView();">Hide</button>
                        <button class="btn btn-ghost btn-sm" style="color: var(--status-error); font-size: 0.75rem;" onclick="if(confirm('Remove post completely?')) { Store.moderateCommunityPost('${p.id}', 'remove'); App.renderCurrentView(); }">Remove</button>
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
  }
};
