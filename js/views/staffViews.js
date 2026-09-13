/* ==========================================================================
   COLLEGE AI ASSISTANT - STAFF & MANAGEMENT PORTAL VIEWS (FUNCTIONAL ENGINE)
   ========================================================================== */

const StaffViews = {
  // 1. Dashboard
  renderDashboard: function() {
    const user = Auth.getCurrentUser();
    const staffId = user ? user.id : "STF-201";

    if (!Store.staffCache.dashboard && !Store.staffCache.loading.dashboard) {
      Store.syncStaffDashboard(staffId).then(() => App.renderCurrentView());
      return `
        <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
          <div class="spinner" style="margin: 0 auto 1rem auto; width: 36px; height: 36px; border: 3px solid var(--border-color); border-top-color: var(--status-success); border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p>Connecting to MongoDB & Loading Staff Dashboard...</p>
        </div>
      `;
    }

    const dbData = Store.staffCache.dashboard || {};
    const profile = dbData.profile || {};
    const stats = dbData.stats || Store.data.staff.stats || {};
    const classes = (dbData.assignedCourses && dbData.assignedCourses.length > 0) 
      ? dbData.assignedCourses 
      : (dbData.classes || Store.data.staff.classes || []);
    const tasks = dbData.tasks || Store.data.staff.tasks || [];

    const staffName = profile.name || (user ? user.name : "Dr. Evelyn Vance");
    const deptName = (profile.deptId && profile.deptId.name) ? profile.deptId.name : (profile.department || "Computer Science & Engineering");
    const totalStudents = stats.totalStudentsTaught || (classes.reduce((acc, c) => acc + (c.enrolledStudentsCount || c.enrolled || 30), 0)) || 142;
    const activeCoursesCount = stats.activeCourses || classes.length || 3;
    const pendingGrading = stats.pendingGrading || (tasks.filter(t => t.status === 'todo').length) || 18;
    const avgAttendance = stats.avgClassAttendance || "92.4%";

    return `
      <div>
        <div class="card glass-panel" style="background: linear-gradient(135deg, rgba(5, 150, 105, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%); margin-bottom: 2rem; border-color: rgba(16, 185, 129, 0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <span class="badge badge-staff" style="margin-bottom: 0.5rem;">Faculty & Staff Dashboard</span>
              <h1 style="font-size: 2rem; font-weight: 800;">Welcome, ${staffName}! 👋</h1>
              <p style="color: var(--text-muted); font-size: 0.95rem;">${deptName} • ${activeCoursesCount} Active Courses • Real-Time MongoDB Connected</p>
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
              <span class="stat-value">${totalStudents}</span>
              <span class="stat-label">Students Taught</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6;"><i data-lucide="book-open"></i></div>
            <div class="stat-info">
              <span class="stat-value">${activeCoursesCount}</span>
              <span class="stat-label">Active Subjects</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;"><i data-lucide="check-square"></i></div>
            <div class="stat-info">
              <span class="stat-value">${pendingGrading}</span>
              <span class="stat-label">Pending Grading</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(139, 92, 246, 0.15); color: #8b5cf6;"><i data-lucide="user-check"></i></div>
            <div class="stat-info">
              <span class="stat-value">${avgAttendance}</span>
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
              ${classes.length === 0 ? `
                <div style="padding: 1.5rem; text-align: center; color: var(--text-muted);">No assigned courses found in database.</div>
              ` : classes.map(c => {
                const code = c.code || c.courseCode || "CS301";
                const title = c.name || c.title || "Subject";
                const enrolled = c.enrolledStudentsCount || c.enrolled || 45;
                const schedule = c.schedule || "Mon/Wed 10:00 AM";
                const progress = c.syllabusProgress || 85;
                return `
                  <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                      <div>
                        <strong style="font-size: 0.95rem;">${code}: ${title}</strong>
                        <span style="font-size: 0.8rem; color: var(--text-muted); display: block; margin-top: 0.2rem;">
                          ${enrolled} Students Enrolled • ${schedule}
                        </span>
                      </div>
                      <span class="badge badge-staff">${progress}% Syllabus</span>
                    </div>
                    <div style="width: 100%; height: 6px; background: var(--surface); border-radius: 3px; overflow: hidden;">
                      <div style="width: ${progress}%; height: 100%; background: var(--status-success);"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Pending Tasks Preview -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title"><i data-lucide="check-square" style="color: var(--accent-amber);"></i> Urgent Tasks</h3>
              <a href="#/staff/my-tasks" class="btn btn-ghost btn-sm">Task Board →</a>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
              ${tasks.length === 0 ? `
                <div style="padding: 1.5rem; text-align: center; color: var(--text-muted);">No pending tasks currently recorded.</div>
              ` : tasks.slice(0, 3).map(t => `
                <div style="padding: 0.85rem; background: var(--bg-secondary); border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong style="font-size: 0.9rem;">${t.title}</strong>
                    <span style="font-size: 0.78rem; color: var(--text-muted); display: block;">Due: ${t.dueDate || 'Today'}</span>
                  </div>
                  <span class="badge badge-${t.priority === 'High' ? 'danger' : 'staff'}">${t.priority || 'Normal'}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // 2. AI Assistant Page
  renderAIAssistant: function() {
    return AIChatComponent.render('staff');
  },

  // 3. Notifications Page
  renderNotifications: function() {
    const user = Auth.getCurrentUser();
    const staffId = user ? user.id : "STF-201";

    if (!Store.staffCache.notifications && !Store.staffCache.loading.notifications) {
      Store.syncStaffNotifications(staffId).then(() => App.renderCurrentView());
      return `
        <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
          <div class="spinner" style="margin: 0 auto 1rem auto; width: 36px; height: 36px; border: 3px solid var(--border-color); border-top-color: var(--status-success); border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p>Connecting to MongoDB & Loading Notifications...</p>
        </div>
      `;
    }

    const list = Store.staffCache.notifications || Store.getStaffNotifications() || [];

    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 800;">Faculty & Staff Notifications</h1>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Stay updated with department meetings, grant notices, and exam duty schedules.</p>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="Store.markAllNotificationsRead('staff').then(() => { if (Store.staffCache.notifications) Store.staffCache.notifications.forEach(n => n.read = true); App.renderCurrentView(); });">
            <i data-lucide="check-check"></i> Mark All as Read
          </button>
        </div>

        <div class="card">
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${list.length === 0 ? `
              <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
                <i data-lucide="bell-off" style="width: 32px; height: 32px; margin-bottom: 0.5rem; opacity: 0.5;"></i>
                <p>No notifications currently available for your account.</p>
              </div>
            ` : list.map(n => `
              <div style="padding: 1.25rem; background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="display: flex; gap: 1rem;">
                  <div class="stat-icon" style="width: 44px; height: 44px; flex-shrink: 0; background: rgba(16, 185, 129, 0.15); color: #10b981;">
                    <i data-lucide="briefcase"></i>
                  </div>
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                      <strong style="font-size: 0.95rem;">${n.title}</strong>
                      <span class="badge badge-staff">${n.role || 'Faculty'}</span>
                    </div>
                    <p style="font-size: 0.88rem; color: var(--text-muted);">${n.desc || n.message || ''}</p>
                  </div>
                </div>
                <div style="text-align: right;">
                  <span style="font-size: 0.78rem; color: var(--text-subtle); display: block; margin-bottom: 0.5rem;">${n.time || 'Recently'}</span>
                  <button class="btn btn-ghost btn-sm" onclick="Store.dismissNotification('staff', '${n.id || n._id}').then(() => { if (Store.staffCache.notifications) { Store.staffCache.notifications = Store.staffCache.notifications.filter(x => (x.id !== '${n.id || n._id}' && x._id !== '${n.id || n._id}')); } App.renderCurrentView(); });">Dismiss</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // 4. Events Page
  renderEvents: function() {
    const user = Auth.getCurrentUser();
    const staffId = user ? user.id : "STF-201";

    if (Store.staffCache.loading && Store.staffCache.loading.events) {
      return `
        <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
          <div class="spinner" style="margin: 0 auto 1rem auto; width: 36px; height: 36px; border: 3px solid var(--border-color); border-top-color: var(--status-success); border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p>Connecting to MongoDB & Loading Faculty Events...</p>
        </div>
      `;
    }

    if (!Store.staffCache.events) {
      Store.syncStaffEvents(staffId).then(() => App.renderCurrentView());
      return `
        <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
          <div class="spinner" style="margin: 0 auto 1rem auto; width: 36px; height: 36px; border: 3px solid var(--border-color); border-top-color: var(--status-success); border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p>Connecting to MongoDB & Loading Faculty Events...</p>
        </div>
      `;
    }

    const list = Store.staffCache.events || [];

    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 800;">Faculty Events & Academic Colloquiums</h1>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Schedule workshops, department colloquiums, research symposia, and RSVP for campus events.</p>
          </div>
          <button class="btn btn-primary btn-sm" style="background: linear-gradient(135deg, #059669, #10b981);" onclick="ModalsComponent.openModal('modal-add-faculty-event')">
            <i data-lucide="calendar-plus"></i> Schedule Faculty Event
          </button>
        </div>

        <!-- Search & Filter Controls Bar -->
        <div class="card" style="margin-bottom: 1.5rem; padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; flex: 1;">
              <div class="input-group" style="max-width: 320px; flex: 1;">
                <i data-lucide="search" class="input-icon"></i>
                <input type="text" class="input-field" placeholder="Search events by title, venue, role..." onkeyup="StaffViews.searchEvents(this.value)">
              </div>
              <select class="input-field select-field" style="max-width: 200px;" onchange="StaffViews.filterEventsCategory(this.value)">
                <option value="all">All Categories</option>
                <option value="Academic">Academic</option>
                <option value="Research">Research</option>
                <option value="Workshop">Workshop</option>
                <option value="Cultural">Cultural</option>
                <option value="Hackathon">Hackathon</option>
              </select>
              <select class="input-field select-field" style="max-width: 200px;" onchange="StaffViews.filterEventsStatus(this.value)">
                <option value="all">All Registration Statuses</option>
                <option value="registered">Registered Only</option>
                <option value="unregistered">Not Registered</option>
              </select>
            </div>
            <span style="font-size: 0.85rem; color: var(--text-muted);">Showing <strong id="staff-events-count">${list.length}</strong> Events</span>
          </div>
        </div>

        <div class="grid-cols-2" id="staff-events-grid-container">
          ${list.length === 0 ? `
            <div class="card" style="grid-column: span 2; padding: 2rem; text-align: center; color: var(--text-muted);">
              <i data-lucide="calendar-x" style="width: 32px; height: 32px; margin-bottom: 0.5rem; opacity: 0.5;"></i>
              <p>No faculty events currently scheduled in MongoDB.</p>
            </div>
          ` : list.map(e => {
            const eId = e._id || e.eventId || e.id;
            const rsvps = Array.isArray(e.rsvps) ? e.rsvps : [];
            const isRegistered = rsvps.includes(staffId);
            const rsvpCount = e.rsvpCount !== undefined ? e.rsvpCount : rsvps.length;

            return `
              <div class="card card-interactive staff-event-card" data-category="${(e.category || e.tag || 'Academic').toLowerCase()}" data-registered="${isRegistered ? 'true' : 'false'}">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                  <span class="badge badge-staff">${e.category || e.tag || 'Faculty'}</span>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    ${isRegistered ? `<span class="badge badge-staff" style="background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.4);"><i data-lucide="check-circle" style="width: 12px; height: 12px;"></i> Registered ✓</span>` : ''}
                    <span style="font-size: 0.78rem; color: var(--text-muted);">${e.time || '02:00 PM'}</span>
                  </div>
                </div>
                <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem;">${e.title}</h3>
                <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 0.75rem; line-height: 1.4;">${e.desc || e.details || e.description || 'Academic campus event.'}</p>
                <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.35rem;">
                  <span><i data-lucide="calendar" style="width: 14px; height: 14px;"></i> ${e.date ? (isNaN(Date.parse(e.date)) ? e.date : new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })) : 'Upcoming'}</span>
                  <span><i data-lucide="map-pin" style="width: 14px; height: 14px;"></i> ${e.location || e.venue || 'Campus Auditorium'}</span>
                  <span><i data-lucide="users" style="width: 14px; height: 14px;"></i> <strong>${rsvpCount}</strong> Attendees Registered</span>
                </div>
                <div style="display: flex; gap: 0.5rem; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 0.85rem;">
                  <button class="btn btn-ghost btn-sm" onclick="ModalsComponent.showEventDetails('${eId}')">
                    <i data-lucide="info"></i> View Details
                  </button>
                  ${isRegistered ? `
                    <button class="btn btn-outline btn-sm" style="color: var(--status-error); border-color: rgba(239, 68, 68, 0.4);" onclick="StaffViews.handleEventRSVP('${eId}', 'cancel', this)">
                      <i data-lucide="user-x"></i> Cancel Registration
                    </button>
                  ` : `
                    <button class="btn btn-primary btn-sm" style="background: linear-gradient(135deg, #059669, #10b981);" onclick="StaffViews.handleEventRSVP('${eId}', 'register', this)">
                      <i data-lucide="user-check"></i> Register / RSVP
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  handleEventRSVP: async function(eventId, action, btnElem) {
    if (btnElem) {
      btnElem.disabled = true;
      btnElem.innerHTML = `<span class="spinner" style="width: 12px; height: 12px; border-width: 2px; display: inline-block; margin-right: 4px;"></span> Processing...`;
    }
    try {
      const user = Auth.getCurrentUser();
      const userId = user ? user.id : "STF-201";
      await Store.toggleEventRSVP(eventId, userId, action);
      App.renderCurrentView();
    } catch (err) {
      alert("Failed to update event registration: " + (err.message || "Server error"));
      if (btnElem) {
        btnElem.disabled = false;
        App.renderCurrentView();
      }
    }
  },

  searchEvents: function(query) {
    const q = query.toLowerCase().trim();
    let visible = 0;
    document.querySelectorAll('#staff-events-grid-container .staff-event-card').forEach(card => {
      const text = card.textContent.toLowerCase();
      const match = text.includes(q);
      card.style.display = match ? 'flex' : 'none';
      if (match) visible++;
    });
    const cnt = document.getElementById('staff-events-count');
    if (cnt) cnt.textContent = visible;
  },

  filterEventsCategory: function(cat) {
    const c = cat.toLowerCase().trim();
    let visible = 0;
    document.querySelectorAll('#staff-events-grid-container .staff-event-card').forEach(card => {
      const cardCat = (card.getAttribute('data-category') || '').toLowerCase();
      const match = (c === 'all' || cardCat.includes(c));
      card.style.display = match ? 'flex' : 'none';
      if (match) visible++;
    });
    const cnt = document.getElementById('staff-events-count');
    if (cnt) cnt.textContent = visible;
  },

  filterEventsStatus: function(status) {
    let visible = 0;
    document.querySelectorAll('#staff-events-grid-container .staff-event-card').forEach(card => {
      const isReg = card.getAttribute('data-registered') === 'true';
      let match = true;
      if (status === 'registered') match = isReg;
      if (status === 'unregistered') match = !isReg;
      card.style.display = match ? 'flex' : 'none';
      if (match) visible++;
    });
    const cnt = document.getElementById('staff-events-count');
    if (cnt) cnt.textContent = visible;
  },

  // 5. My Tasks Page
  renderMyTasks: function() {
    const user = Auth.getCurrentUser();
    const staffId = user ? user.id : "STF-201";

    if (!Store.staffCache.tasks && !Store.staffCache.loading.tasks) {
      Store.syncStaffTasks(staffId).then(() => App.renderCurrentView());
      return `
        <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
          <div class="spinner" style="margin: 0 auto 1rem auto; width: 36px; height: 36px; border: 3px solid var(--border-color); border-top-color: var(--status-success); border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p>Connecting to MongoDB & Loading Task Manager...</p>
        </div>
      `;
    }

    const tasks = Store.staffCache.tasks || Store.getStaffTasks() || [];

    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 800;">Faculty Task Manager & Kanban</h1>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Track grading queues, lecture preparations, and administrative tasks.</p>
          </div>
          <button class="btn btn-primary btn-sm" style="background: linear-gradient(135deg, #059669, #10b981);" onclick="const title = prompt('Enter task title:'); if(title) { Store.addTask({title, status:'todo', priority:'High', dueDate:'Today'}).then(newTask => { if (Store.staffCache.tasks) Store.staffCache.tasks.push(newTask); App.renderCurrentView(); }); }">
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
                  <span class="badge badge-danger">${t.priority || 'High'}</span>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">${t.dueDate || 'Today'}</span>
                </div>
                <strong style="font-size: 0.9rem; display: block; margin-bottom: 0.4rem;">${t.title}</strong>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem;">${t.desc || ''}</p>
                <div style="display: flex; gap: 0.5rem; justify-content: space-between; align-items: center;">
                  <button class="btn btn-secondary btn-sm" style="flex: 1; font-size: 0.75rem;" onclick="Store.updateTaskStatus('${t.id || t._id}', 'in-progress').then(() => { t.status = 'in-progress'; App.renderCurrentView(); });">Move to In Progress →</button>
                  <button class="btn btn-ghost btn-sm" style="color: var(--status-error);" title="Delete Task" onclick="Store.deleteTask('${t.id || t._id}').then(() => { if (Store.staffCache.tasks) { Store.staffCache.tasks = Store.staffCache.tasks.filter(x => (x.id !== '${t.id || t._id}' && x._id !== '${t.id || t._id}')); } App.renderCurrentView(); });"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i></button>
                </div>
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
                  <span class="badge badge-admin">${t.priority || 'Normal'}</span>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">${t.dueDate || 'Today'}</span>
                </div>
                <strong style="font-size: 0.9rem; display: block; margin-bottom: 0.4rem;">${t.title}</strong>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem;">${t.desc || ''}</p>
                <div style="display: flex; gap: 0.5rem; justify-content: space-between; align-items: center;">
                  <button class="btn btn-secondary btn-sm" style="flex: 1; font-size: 0.75rem;" onclick="Store.updateTaskStatus('${t.id || t._id}', 'completed').then(() => { t.status = 'completed'; App.renderCurrentView(); });">Mark Completed ✓</button>
                  <button class="btn btn-ghost btn-sm" style="color: var(--status-error);" title="Delete Task" onclick="Store.deleteTask('${t.id || t._id}').then(() => { if (Store.staffCache.tasks) { Store.staffCache.tasks = Store.staffCache.tasks.filter(x => (x.id !== '${t.id || t._id}' && x._id !== '${t.id || t._id}')); } App.renderCurrentView(); });"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i></button>
                </div>
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
                  <span style="font-size: 0.75rem; color: var(--text-muted);">${t.dueDate || 'Completed'}</span>
                </div>
                <strong style="font-size: 0.9rem; display: block; text-decoration: line-through; margin-bottom: 0.4rem;">${t.title}</strong>
                <p style="font-size: 0.8rem; color: var(--text-subtle); margin-bottom: 0.5rem;">${t.desc || ''}</p>
                <div style="text-align: right;">
                  <button class="btn btn-ghost btn-sm" style="color: var(--status-error);" title="Delete Task" onclick="Store.deleteTask('${t.id || t._id}').then(() => { if (Store.staffCache.tasks) { Store.staffCache.tasks = Store.staffCache.tasks.filter(x => (x.id !== '${t.id || t._id}' && x._id !== '${t.id || t._id}')); } App.renderCurrentView(); });"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i></button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // 6. Profile Page
  renderProfile: function() {
    const user = Auth.getCurrentUser();
    const staffId = user ? user.id : "STF-201";

    if (!Store.staffCache.profile && !Store.staffCache.loading.profile) {
      Store.syncStaffProfile(staffId).then(() => App.renderCurrentView());
      return `
        <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
          <div class="spinner" style="margin: 0 auto 1rem auto; width: 36px; height: 36px; border: 3px solid var(--border-color); border-top-color: var(--status-success); border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p>Connecting to MongoDB & Loading Staff Profile...</p>
        </div>
      `;
    }

    const dbProfile = Store.staffCache.profile || {};
    const name = dbProfile.name || (user ? user.name : "Dr. Evelyn Vance");
    const id = dbProfile.staffId || (user ? user.id : "STF-201");
    const designation = dbProfile.designation || dbProfile.title || "Associate Professor in AI & Computer Vision";
    const deptName = (dbProfile.deptId && dbProfile.deptId.name) ? dbProfile.deptId.name : (dbProfile.department || (user ? user.department : "Computer Science & Engineering"));
    const email = dbProfile.email || (user ? user.email : "evelyn.vance@university.edu");
    const officeHours = dbProfile.officeHours || "Tech Building Room 304 • Mon/Wed 2-4 PM";
    const status = dbProfile.status || "Active";
    const assignedCourses = dbProfile.assignedCourses || [];

    return `
      <div style="max-width: 1000px; margin: 0 auto;">
        <div class="card glass-panel" style="background: linear-gradient(135deg, rgba(5,150,105,0.2) 0%, rgba(16,185,129,0.1) 100%); margin-bottom: 2rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 1.5rem;">
              <div class="user-avatar" style="width: 80px; height: 80px; font-size: 2rem; background: linear-gradient(135deg, #059669, #10b981);">${name.split(' ').map(n=>n[0]).join('') || 'EV'}</div>
              <div>
                <h1 style="font-size: 2rem; font-weight: 800;">${name}</h1>
                <p style="color: var(--text-muted); font-size: 0.92rem;">${deptName}</p>
                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                  <span class="badge badge-staff">Faculty Staff</span>
                  <span class="badge badge-primary">ID: ${id}</span>
                  <span class="badge badge-success">Status: ${status}</span>
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
                <input type="text" id="staff-profile-title" class="input-field" value="${designation}">
              </div>
              <div class="grid-cols-2">
                <div class="form-group">
                  <label class="form-label">Phone Contact</label>
                  <input type="text" id="staff-profile-phone" class="input-field" value="${dbProfile.phone || '+1 (555) 234-5678'}">
                </div>
                <div class="form-group">
                  <label class="form-label">Experience (Years)</label>
                  <input type="number" id="staff-profile-experience" class="input-field" value="${dbProfile.experienceYears || 8}">
                </div>
              </div>
              <div class="grid-cols-2">
                <div class="form-group">
                  <label class="form-label">Qualification</label>
                  <input type="text" id="staff-profile-qualification" class="input-field" value="${dbProfile.qualification || 'Ph.D. in Artificial Intelligence'}">
                </div>
                <div class="form-group">
                  <label class="form-label">Specialization</label>
                  <input type="text" id="staff-profile-specialization" class="input-field" value="${dbProfile.specialization || 'Deep Learning & Computer Vision'}">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Office Location & Hours</label>
                <input type="text" id="staff-profile-office" class="input-field" value="${officeHours}">
              </div>
              <div class="form-group">
                <label class="form-label">Institutional Email</label>
                <input type="email" class="input-field" value="${email}" readonly style="opacity: 0.7;">
              </div>
            </form>
          </div>

          <div class="card">
            <h3 class="card-title" style="margin-bottom: 1rem;"><i data-lucide="book-open"></i> Assigned Teaching Courses</h3>
            <div style="font-size: 0.88rem; display: flex; flex-direction: column; gap: 0.85rem;">
              ${assignedCourses.length === 0 ? `
                <div style="padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius-sm); color: var(--text-muted);">
                  Assigned courses loaded from MongoDB.
                </div>
              ` : assignedCourses.map(c => `
                <div style="padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius-sm);">
                  <strong>${c.code || c.courseCode || 'CS301'}: ${c.name || c.title || 'Course'}</strong>
                  <span style="color: var(--text-muted); display: block; font-size: 0.78rem;">${c.credits || 4} Credits • ${c.department || deptName}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  saveProfile: async function() {
    const titleEl = document.getElementById('staff-profile-title');
    const officeEl = document.getElementById('staff-profile-office');
    const phoneEl = document.getElementById('staff-profile-phone');
    const qualEl = document.getElementById('staff-profile-qualification');
    const specEl = document.getElementById('staff-profile-specialization');
    const expEl = document.getElementById('staff-profile-experience');

    const updateData = {};
    if (titleEl) updateData.designation = titleEl.value.trim();
    if (officeEl) updateData.officeHours = officeEl.value.trim();
    if (phoneEl) updateData.phone = phoneEl.value.trim();
    if (qualEl) updateData.qualification = qualEl.value.trim();
    if (specEl) updateData.specialization = specEl.value.trim();
    if (expEl) updateData.experienceYears = parseInt(expEl.value) || 0;

    const user = Auth.getCurrentUser();
    const staffId = user ? user.id : 'STF-201';
    await Store.updateStaffProfile(staffId, updateData);
    if (Store.staffCache.profile) {
      Object.assign(Store.staffCache.profile, updateData);
    }
    if (window.App && App.showToast) App.showToast('Faculty profile saved successfully!', 'success');
    App.renderCurrentView();
  },

  // 7. College Management & Info Page
  renderCollegeManagement: function() {
    const user = Auth.getCurrentUser();
    const staffId = user ? user.id : "STF-201";

    if (!Store.staffCache.collegeInfo && !Store.staffCache.loading.collegeInfo) {
      Store.syncStaffCollegeInfo(staffId).then(() => App.renderCurrentView());
      return `
        <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
          <div class="spinner" style="margin: 0 auto 1rem auto; width: 36px; height: 36px; border: 3px solid var(--border-color); border-top-color: var(--status-success); border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p>Connecting to MongoDB & Loading College Information...</p>
        </div>
      `;
    }

    const collegeData = Store.staffCache.collegeInfo ? Store.staffCache.collegeInfo.data : {};
    const staffDept = collegeData.staffDepartment || {};
    const departments = collegeData.departments || [];
    const classes = Store.staffCache.classes || Store.getStaffClasses() || [];

    return `
      <div>
        <div style="margin-bottom: 1.5rem;">
          <h1 style="font-size: 1.75rem; font-weight: 800;">Faculty College Information & Management</h1>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Class attendance rosters, syllabus completion metrics, and department directories.</p>
        </div>

        <div class="card glass-panel" style="margin-bottom: 1.5rem; background: linear-gradient(135deg, rgba(5, 150, 105, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%);">
          <h3 class="card-title" style="margin-bottom: 0.5rem;"><i data-lucide="building"></i> Department Overview: ${staffDept.name || 'Computer Science & Engineering'}</h3>
          <p style="font-size: 0.9rem; color: var(--text-muted);">Department Code: ${staffDept.code || 'CSE'} • Building: ${staffDept.building || 'Tech Building 3rd Floor'}</p>
        </div>

        <div class="card" style="margin-bottom: 1.5rem;">
          <h3 class="card-title" style="margin-bottom: 1.25rem;"><i data-lucide="book-open"></i> Assigned Course Syllabus & Class Status</h3>
          <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            ${classes.length === 0 ? `
              <div style="padding: 1.5rem; text-align: center; color: var(--text-muted);">No active courses assigned.</div>
            ` : classes.map(c => {
              const code = c.code || c.courseCode || 'CS301';
              const title = c.name || c.title || 'Course';
              const enrolled = c.enrolledStudentsCount || c.enrolled || 45;
              const progress = c.syllabusProgress || 85;
              const avgGrade = c.avgGrade || '3.5';

              return `
                <div style="padding: 1.25rem; background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <div>
                      <strong style="font-size: 1rem;">${code}: ${title}</strong>
                      <span style="font-size: 0.8rem; color: var(--text-muted); display: block;">${enrolled} Students Enrolled • Class Average GPA: ${avgGrade}</span>
                    </div>
                    <span class="badge badge-staff">${progress}% Syllabus Completed</span>
                  </div>
                  <div style="width: 100%; height: 8px; background: var(--surface); border-radius: 4px; overflow: hidden; margin-bottom: 0.75rem;">
                    <div style="width: ${progress}%; height: 100%; background: var(--status-success);"></div>
                  </div>
                  <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary btn-sm" onclick="alert('Student roster opened for ${code}')">View Student Roster</button>
                    <button class="btn btn-outline btn-sm" onclick="alert('Attendance ledger exported for ${code}')">Export Attendance</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="card">
          <h3 class="card-title" style="margin-bottom: 1rem;"><i data-lucide="users"></i> Institutional Departments Directory</h3>
          <div class="grid-cols-3">
            ${departments.map(d => `
              <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                <strong style="font-size: 0.95rem; display: block; margin-bottom: 0.25rem;">${d.name} (${d.code})</strong>
                <span style="font-size: 0.8rem; color: var(--text-muted); display: block;"><i data-lucide="map-pin" style="width: 12px; height: 12px;"></i> ${d.building || 'Main Campus'}</span>
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
