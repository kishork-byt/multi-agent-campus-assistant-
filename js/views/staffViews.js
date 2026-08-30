/* ==========================================================================
   COLLEGE AI ASSISTANT - STAFF & MANAGEMENT PORTAL VIEWS (FUNCTIONAL ENGINE)
   ========================================================================== */

const StaffViews = {
  // 1. Dashboard (DO NOT MODIFY DESIGN)
  renderDashboard: function() {
    const data = MockData.staff;
    return `
      <div>
        <div class="card glass-panel" style="background: linear-gradient(135deg, rgba(5, 150, 105, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%); margin-bottom: 2rem; border-color: rgba(16, 185, 129, 0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <span class="badge badge-staff" style="margin-bottom: 0.5rem;">Faculty & Staff Dashboard</span>
              <h1 style="font-size: 2rem; font-weight: 800;">Welcome, Dr. Evelyn Vance! 👋</h1>
              <p style="color: var(--text-muted); font-size: 0.95rem;">You have 3 active courses and 18 pending lab submissions to grade.</p>
            </div>
            <a href="#/staff/ai-assistant" class="btn btn-primary" style="background: linear-gradient(135deg, #059669, #10b981);">
              <i data-lucide="sparkles"></i> Faculty AI Copilot
            </a>
          </div>
        </div>

        <!-- Metrics -->
        <div class="grid-cols-4" style="margin-bottom: 2rem;">
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981;"><i data-lucide="users"></i></div>
            <div class="stat-info">
              <span class="stat-value">${data.stats.totalStudentsTaught}</span>
              <span class="stat-label">Students Taught</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6;"><i data-lucide="book-open"></i></div>
            <div class="stat-info">
              <span class="stat-value">${data.stats.activeCourses}</span>
              <span class="stat-label">Active Subjects</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;"><i data-lucide="check-square"></i></div>
            <div class="stat-info">
              <span class="stat-value">${data.stats.pendingGrading}</span>
              <span class="stat-label">Pending Grading</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(139, 92, 246, 0.15); color: #8b5cf6;"><i data-lucide="user-check"></i></div>
            <div class="stat-info">
              <span class="stat-value">${data.stats.avgClassAttendance}</span>
              <span class="stat-label">Class Attendance</span>
            </div>
          </div>
        </div>

        <div class="grid-cols-2">
          <!-- Active Courses -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title"><i data-lucide="book-open" style="color: var(--status-success);"></i> Assigned Courses & Progress</h3>
            </div>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              ${data.classes.map(c => `
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <div>
                      <strong style="font-size: 0.95rem;">${c.code}: ${c.title}</strong>
                      <span style="font-size: 0.8rem; color: var(--text-muted); display: block; margin-top: 0.2rem;">
                        ${c.enrolled} Students Enrolled • ${c.schedule}
                      </span>
                    </div>
                    <span class="badge badge-staff">${c.syllabusProgress}% Syllabus</span>
                  </div>
                  <div style="width: 100%; height: 6px; background: var(--surface); border-radius: 3px; overflow: hidden;">
                    <div style="width: ${c.syllabusProgress}%; height: 100%; background: var(--status-success);"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Pending Tasks Preview -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title"><i data-lucide="check-square" style="color: var(--accent-amber);"></i> Urgent Tasks</h3>
              <a href="#/staff/my-tasks" class="btn btn-ghost btn-sm">Task Board →</a>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
              ${data.tasks.slice(0, 3).map(t => `
                <div style="padding: 0.85rem; background: var(--bg-secondary); border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong style="font-size: 0.9rem;">${t.title}</strong>
                    <span style="font-size: 0.78rem; color: var(--text-muted); display: block;">Due: ${t.dueDate}</span>
                  </div>
                  <span class="badge badge-${t.priority === 'High' ? 'danger' : 'staff'}">${t.priority}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // 2. AI Assistant Page (DO NOT MODIFY DESIGN)
  renderAIAssistant: function() {
    return AIChatComponent.render('staff');
  },

  // 3. Notifications Page (STORE PERSISTENT)
  renderNotifications: function() {
    const list = Store.getStaffNotifications();
    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 800;">Faculty & Staff Notifications</h1>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Stay updated with department meetings, grant notices, and exam duty schedules.</p>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="Store.markAllNotificationsRead('staff'); App.renderCurrentView();">
            <i data-lucide="check-check"></i> Mark All as Read
          </button>
        </div>

        <div class="card">
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${list.map(n => `
              <div style="padding: 1.25rem; background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="display: flex; gap: 1rem;">
                  <div class="stat-icon" style="width: 44px; height: 44px; flex-shrink: 0; background: rgba(16, 185, 129, 0.15); color: #10b981;">
                    <i data-lucide="briefcase"></i>
                  </div>
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                      <strong style="font-size: 0.95rem;">${n.title}</strong>
                      <span class="badge badge-staff">Faculty</span>
                    </div>
                    <p style="font-size: 0.88rem; color: var(--text-muted);">${n.desc}</p>
                  </div>
                </div>
                <div style="text-align: right;">
                  <span style="font-size: 0.78rem; color: var(--text-subtle); display: block; margin-bottom: 0.5rem;">${n.time}</span>
                  <button class="btn btn-ghost btn-sm" onclick="Store.dismissNotification('staff', '${n.id}'); App.renderCurrentView();">Dismiss</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // 4. Events Page (STORE PERSISTENT & MODAL FUNCTIONAL)
  renderEvents: function() {
    const list = Store.getStaffEvents();
    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 800;">Faculty Events & Academic Colloquiums</h1>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Schedule workshops, department colloquiums, and research symposia.</p>
          </div>
          <button class="btn btn-primary btn-sm" style="background: linear-gradient(135deg, #059669, #10b981);" onclick="ModalsComponent.openModal('modal-add-faculty-event')">
            <i data-lucide="calendar-plus"></i> Schedule Faculty Event
          </button>
        </div>

        <div class="grid-cols-2">
          ${list.map(e => `
            <div class="card card-interactive">
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                <span class="badge badge-staff">${e.role}</span>
                <span style="font-size: 0.78rem; color: var(--text-muted);">${e.time || 'TBD'}</span>
              </div>
              <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem;">${e.title}</h3>
              <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
                <i data-lucide="calendar" style="width: 14px; height: 14px;"></i> ${e.date}<br>
                <i data-lucide="map-pin" style="width: 14px; height: 14px;"></i> ${e.location}
              </p>
              <button class="btn ${e.confirmed ? 'btn-secondary' : 'btn-primary'} btn-sm" style="${e.confirmed ? '' : 'background: linear-gradient(135deg, #059669, #10b981);'}" onclick="Store.toggleStaffEventConfirmation('${e.id}'); App.renderCurrentView();">
                <i data-lucide="${e.confirmed ? 'check' : 'calendar'}"></i> ${e.confirmed ? 'Slot Confirmed ✓' : 'Confirm Calendar Slot'}
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // 5. My Tasks Page (STORE PERSISTENT KANBAN BOARD)
  renderMyTasks: function() {
    const tasks = Store.getStaffTasks();
    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 800;">Faculty Task Manager & Kanban</h1>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Track grading queues, lecture preparations, and administrative tasks.</p>
          </div>
          <button class="btn btn-primary btn-sm" style="background: linear-gradient(135deg, #059669, #10b981);" onclick="const title = prompt('Enter task title:'); if(title) { Store.addTask({title, status:'todo', priority:'High', dueDate:'Today'}); App.renderCurrentView(); }">
            <i data-lucide="plus"></i> Add New Task
          </button>
        </div>

        <div class="kanban-board">
          <!-- Column 1: To Do -->
          <div class="kanban-column">
            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.5rem; border-bottom: 2px solid #ef4444;">
              <strong style="font-size: 0.95rem;">To Do</strong>
              <span class="badge badge-danger">${tasks.filter(t => t.status === 'todo').length}</span>
            </div>
            ${tasks.filter(t => t.status === 'todo').map(t => `
              <div class="card" style="padding: 1rem; background: var(--surface);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                  <span class="badge badge-danger">${t.priority}</span>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">${t.dueDate}</span>
                </div>
                <strong style="font-size: 0.9rem; display: block; margin-bottom: 0.4rem;">${t.title}</strong>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem;">${t.desc || ''}</p>
                <button class="btn btn-secondary btn-sm" style="width: 100%; font-size: 0.75rem;" onclick="Store.updateTaskStatus('${t.id}', 'in-progress'); App.renderCurrentView();">Move to In Progress →</button>
              </div>
            `).join('')}
          </div>

          <!-- Column 2: In Progress -->
          <div class="kanban-column">
            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.5rem; border-bottom: 2px solid #f59e0b;">
              <strong style="font-size: 0.95rem;">In Progress</strong>
              <span class="badge badge-admin">${tasks.filter(t => t.status === 'in-progress').length}</span>
            </div>
            ${tasks.filter(t => t.status === 'in-progress').map(t => `
              <div class="card" style="padding: 1rem; background: var(--surface);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                  <span class="badge badge-admin">${t.priority}</span>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">${t.dueDate}</span>
                </div>
                <strong style="font-size: 0.9rem; display: block; margin-bottom: 0.4rem;">${t.title}</strong>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem;">${t.desc || ''}</p>
                <button class="btn btn-secondary btn-sm" style="width: 100%; font-size: 0.75rem;" onclick="Store.updateTaskStatus('${t.id}', 'completed'); App.renderCurrentView();">Mark Completed ✓</button>
              </div>
            `).join('')}
          </div>

          <!-- Column 3: Completed -->
          <div class="kanban-column">
            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.5rem; border-bottom: 2px solid #10b981;">
              <strong style="font-size: 0.95rem;">Completed</strong>
              <span class="badge badge-staff">${tasks.filter(t => t.status === 'completed').length}</span>
            </div>
            ${tasks.filter(t => t.status === 'completed').map(t => `
              <div class="card" style="padding: 1rem; background: var(--surface); opacity: 0.85;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                  <span class="badge badge-staff">Done</span>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">${t.dueDate}</span>
                </div>
                <strong style="font-size: 0.9rem; display: block; text-decoration: line-through; margin-bottom: 0.4rem;">${t.title}</strong>
                <p style="font-size: 0.8rem; color: var(--text-subtle);">${t.desc || ''}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // 6. Profile Page (STORE PERSISTENT & FORM EDITABLE)
  renderProfile: function() {
    const user = Auth.getCurrentUser();
    const profile = Store.getStaffProfile();

    return `
      <div style="max-width: 1000px; margin: 0 auto;">
        <div class="card glass-panel" style="background: linear-gradient(135deg, rgba(5,150,105,0.2) 0%, rgba(16,185,129,0.1) 100%); margin-bottom: 2rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 1.5rem;">
              <div class="user-avatar" style="width: 80px; height: 80px; font-size: 2rem; background: linear-gradient(135deg, #059669, #10b981);">${user.avatar || 'EV'}</div>
              <div>
                <h1 style="font-size: 2rem; font-weight: 800;">${user.name}</h1>
                <p style="color: var(--text-muted); font-size: 0.92rem;">${user.department}</p>
                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                  <span class="badge badge-staff">Faculty Staff</span>
                  <span class="badge badge-primary">ID: ${user.id}</span>
                </div>
              </div>
            </div>
            <button class="btn btn-primary btn-sm" style="background: linear-gradient(135deg, #059669, #10b981);" onclick="StaffViews.saveProfile()">
              <i data-lucide="save"></i> Save Profile
            </button>
          </div>
        </div>

        <div class="grid-cols-2">
          <div class="card">
            <h3 class="card-title" style="margin-bottom: 1rem;"><i data-lucide="user"></i> Faculty Profile Information</h3>
            <form id="form-staff-profile" onsubmit="event.preventDefault(); StaffViews.saveProfile();">
              <div class="form-group">
                <label class="form-label">Full Designation Title</label>
                <input type="text" id="staff-profile-title" class="input-field" value="${profile.title}">
              </div>
              <div class="form-group">
                <label class="form-label">Office Location & Hours</label>
                <input type="text" id="staff-profile-office" class="input-field" value="${profile.officeHours}">
              </div>
              <div class="form-group">
                <label class="form-label">Institutional Email</label>
                <input type="email" class="input-field" value="${user.email}" readonly style="opacity: 0.7;">
              </div>
            </form>
          </div>

          <div class="card">
            <h3 class="card-title" style="margin-bottom: 1rem;"><i data-lucide="file-text"></i> Research & Publications</h3>
            <div style="font-size: 0.88rem; display: flex; flex-direction: column; gap: 0.85rem;">
              <div style="padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius-sm);">
                <strong>"Transformer Latent Representations in Medical Imaging"</strong>
                <span style="color: var(--text-muted); display: block; font-size: 0.78rem;">IEEE Transactions on AI (2025)</span>
              </div>
              <div style="padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius-sm);">
                <strong>"Optimization Loops in Autonomous Agent Architectures"</strong>
                <span style="color: var(--text-muted); display: block; font-size: 0.78rem;">NeurIPS Proceedings (2024)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  saveProfile: function() {
    const titleEl = document.getElementById('staff-profile-title');
    const officeEl = document.getElementById('staff-profile-office');

    if (titleEl && officeEl) {
      Store.updateStaffProfile({
        title: titleEl.value.trim(),
        officeHours: officeEl.value.trim()
      });
      App.renderCurrentView();
    }
  },

  // 7. College Management Page
  renderCollegeManagement: function() {
    const classes = Store.getStaffClasses();
    return `
      <div>
        <div style="margin-bottom: 1.5rem;">
          <h1 style="font-size: 1.75rem; font-weight: 800;">Faculty College Management</h1>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Class attendance rosters, syllabus completion metrics, and student grade tracking.</p>
        </div>

        <div class="card" style="margin-bottom: 1.5rem;">
          <h3 class="card-title" style="margin-bottom: 1.25rem;"><i data-lucide="book-open"></i> Assigned Course Syllabus Status</h3>
          <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            ${classes.map(c => `
              <div style="padding: 1.25rem; background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <div>
                    <strong style="font-size: 1rem;">${c.code}: ${c.title}</strong>
                    <span style="font-size: 0.8rem; color: var(--text-muted); display: block;">${c.enrolled} Students Enrolled • Class Average GPA: ${c.avgGrade}</span>
                  </div>
                  <span class="badge badge-staff">${c.syllabusProgress}% Syllabus Completed</span>
                </div>
                <div style="width: 100%; height: 8px; background: var(--surface); border-radius: 4px; overflow: hidden; margin-bottom: 0.75rem;">
                  <div style="width: ${c.syllabusProgress}%; height: 100%; background: var(--status-success);"></div>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                  <button class="btn btn-secondary btn-sm" onclick="alert('Student roster opened for ${c.code}')">View Student Roster</button>
                  <button class="btn btn-outline btn-sm" onclick="alert('Attendance ledger exported for ${c.code}')">Export Attendance</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // 8. Anonymous Campus Community Page
  renderCommunity: function() {
    return CommunityView.render('staff');
  }
};
