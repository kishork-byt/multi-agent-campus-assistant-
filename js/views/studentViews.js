/* ==========================================================================
   COLLEGE AI ASSISTANT - STUDENT PORTAL VIEWS (FUNCTIONAL ENGINE)
   ========================================================================== */

const StudentViews = {
  // 1. Dashboard
  renderDashboard: function() {
    const user = Auth.getCurrentUser();
    const studentId = user ? user.id : "STU-2026-101";

    if (!Store.studentCache.dashboard && !Store.studentCache.loading.dashboard) {
      Store.syncStudentDashboard(studentId).then(() => App.renderCurrentView());
      return `
        <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
          <div class="spinner" style="margin: 0 auto 1rem auto; width: 36px; height: 36px; border: 3px solid var(--border-color); border-top-color: var(--primary-500); border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p>Connecting to MongoDB & Loading Student Dashboard...</p>
        </div>
      `;
    }

    const dbData = Store.studentCache.dashboard;
    const profile = dbData ? dbData.profile : null;
    const attendance = dbData ? dbData.attendance : null;
    const timetable = dbData ? dbData.timetable : [];
    const upcomingEvents = dbData ? dbData.upcomingEvents : [];
    const notifications = dbData ? dbData.notifications : [];
    const enrolledCourses = dbData ? dbData.enrolledCourses : [];

    const studentName = profile ? profile.name : (user ? user.name : "Alex Rivera");
    const cgpa = profile ? profile.cgpa : "3.84";
    const credits = profile ? (profile.creditsEarned + " / 120") : "90 / 120";
    const attendanceRate = attendance ? attendance.percentage : "95.0%";

    // Get today's slots from timetable
    let todaySlots = [];
    if (timetable && timetable.length > 0) {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const todayName = days[new Date().getDay()];
      let dayBlock = timetable.find(t => t.day === todayName) || timetable[0];
      if (dayBlock && dayBlock.slots) {
        todaySlots = dayBlock.slots;
      }
    }

    return `
      <div>
        <!-- Welcome Hero Widget -->
        <div class="card glass-panel" style="background: linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%); margin-bottom: 2rem; border-color: rgba(59, 130, 246, 0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <span class="badge badge-student" style="margin-bottom: 0.5rem;">Student Dashboard</span>
              <h1 style="font-size: 2rem; font-weight: 800;">Welcome back, ${studentName.split(' ')[0]}! 👋</h1>
              <p style="color: var(--text-muted); font-size: 0.95rem;">
                ${profile && profile.deptId ? profile.deptId.name : 'AI & Machine Learning'} • Year ${profile ? profile.year : 'Senior'} • Real-Time Database Connected
              </p>
            </div>
            <a href="#/student/ai-assistant" class="btn btn-primary">
              <i data-lucide="sparkles"></i> Open AI Assistant
            </a>
          </div>
        </div>

        <!-- Metrics Grid -->
        <div class="grid-cols-4" style="margin-bottom: 2rem;">
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6;"><i data-lucide="award"></i></div>
            <div class="stat-info">
              <span class="stat-value">${cgpa}</span>
              <span class="stat-label">Current CGPA</span>
              <span class="stat-change up"><i data-lucide="trending-up"></i> Top Standing</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981;"><i data-lucide="user-check"></i></div>
            <div class="stat-info">
              <span class="stat-value">${attendanceRate}</span>
              <span class="stat-label">Overall Attendance</span>
              <span class="stat-change up"><i data-lucide="check"></i> MongoDB Verified</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(139, 92, 246, 0.15); color: #8b5cf6;"><i data-lucide="book-open"></i></div>
            <div class="stat-info">
              <span class="stat-value">${credits}</span>
              <span class="stat-label">Degree Credits</span>
              <span class="stat-change up">${enrolledCourses.length} Courses</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;"><i data-lucide="clock"></i></div>
            <div class="stat-info">
              <span class="stat-value">${enrolledCourses.length} Enrolled</span>
              <span class="stat-label">Active Subjects</span>
              <span class="stat-change down"><i data-lucide="check-circle"></i> Synchronized</span>
            </div>
          </div>
        </div>

        <!-- 2 Column Layout: Today's Classes & Notifications/Events -->
        <div class="grid-cols-2">
          <!-- Today's Schedule -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title"><i data-lucide="calendar" style="color: var(--primary-400);"></i> Today's Class Schedule</h3>
              <a href="#/student/timetable" class="btn btn-ghost btn-sm">Full Timetable →</a>
            </div>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              ${todaySlots.length === 0 ? `
                <div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.88rem;">
                  No class sessions scheduled for today. Check full timetable for weekly view.
                </div>
              ` : todaySlots.map(s => `
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-sm); border-left: 4px solid var(--primary-500); display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong style="display: block; font-size: 0.95rem;">${s.courseCode}: ${s.courseName}</strong>
                    <span style="font-size: 0.8rem; color: var(--text-muted); display: flex; gap: 1rem; margin-top: 0.25rem;">
                      <span><i data-lucide="map-pin" style="width: 14px; height: 14px;"></i> ${s.room}</span>
                      <span><i data-lucide="user" style="width: 14px; height: 14px;"></i> ${s.instructorName}</span>
                    </span>
                  </div>
                  <span class="badge badge-primary">${s.time.split(' - ')[0]}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Quick AI Prompt Widget & Upcoming Events -->
          <div style="display: flex; flex-direction: column; gap: 1.5rem;">
            <div class="card glass-panel" style="background: var(--surface);">
              <h3 class="card-title" style="margin-bottom: 1rem;"><i data-lucide="sparkles" style="color: var(--accent-cyan);"></i> Quick AI Copilot Assistant</h3>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">Ask your AI assistant for quick summaries or help with your course assignments.</p>
              <div style="display: flex; gap: 0.5rem;">
                <input type="text" class="input-field" placeholder="e.g. What is my next class?" id="dash-quick-ai">
                <button class="btn btn-primary" onclick="App.navigateTo('student/ai-assistant')">Ask</button>
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <h3 class="card-title"><i data-lucide="party-popper" style="color: var(--accent-violet);"></i> Upcoming Campus Events</h3>
                <a href="#/student/events" class="btn btn-ghost btn-sm">All Events →</a>
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                ${upcomingEvents.slice(0, 2).map(e => `
                  <div style="padding: 0.85rem; background: var(--bg-secondary); border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <strong style="font-size: 0.9rem; display: block;">${e.title}</strong>
                      <span style="font-size: 0.78rem; color: var(--text-muted);">${e.date || 'Upcoming'} • ${e.location || 'Campus'}</span>
                    </div>
                    <span class="badge badge-student">${e.tag || 'Event'}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // 2. AI Assistant Page
  renderAIAssistant: function() {
    return AIChatComponent.render('student');
  },

  // 3. Notifications Page
  renderNotifications: function() {
    const user = Auth.getCurrentUser();
    const studentId = user ? user.id : "STU-2026-101";

    if (!Store.studentCache.notifications && !Store.studentCache.loading.notifications) {
      Store.syncStudentNotifications(studentId).then(() => App.renderCurrentView());
    }

    const list = Store.studentCache.notifications || Store.getStudentNotifications();

    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 800;">Student Notifications & Activity Log</h1>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Real-time alerts, grade notices, and academic announcements from MongoDB.</p>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-secondary btn-sm" onclick="Store.markAllNotificationsRead('student'); App.renderCurrentView();">
              <i data-lucide="check-check"></i> Mark All as Read
            </button>
          </div>
        </div>

        <div class="card" style="margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
            <div class="tabs-nav" style="border-bottom: none; margin-bottom: 0;">
              <button class="tab-btn active" onclick="StudentViews.filterNotifications('all', this)">All Notifications (${list.length})</button>
              <button class="tab-btn" onclick="StudentViews.filterNotifications('Academic', this)">Academic</button>
              <button class="tab-btn" onclick="StudentViews.filterNotifications('Event', this)">Events</button>
              <button class="tab-btn" onclick="StudentViews.filterNotifications('System', this)">System</button>
            </div>
            <div class="input-group" style="max-width: 280px;">
              <i data-lucide="search" class="input-icon"></i>
              <input type="text" class="input-field" placeholder="Search notifications..." onkeyup="StudentViews.searchNotifications(this.value)">
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 1rem;" id="notification-list-container">
            ${list.length === 0 ? `
              <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
                No notifications currently found.
              </div>
            ` : list.map(n => `
              <div class="notification-card-item" data-category="${n.type || 'Academic'}" style="padding: 1.25rem; background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="display: flex; gap: 1rem;">
                  <div class="stat-icon" style="width: 44px; height: 44px; flex-shrink: 0; background: ${n.type === 'Academic' ? 'rgba(59,130,246,0.15)' : n.type === 'Event' ? 'rgba(139,92,246,0.15)' : 'rgba(16,185,129,0.15)'}; color: ${n.type === 'Academic' ? '#3b82f6' : n.type === 'Event' ? '#8b5cf6' : '#10b981'};">
                    <i data-lucide="${n.type === 'Academic' ? 'graduation-cap' : n.type === 'Event' ? 'party-popper' : 'shield-check'}"></i>
                  </div>
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
                      <strong style="font-size: 0.95rem;">${n.title}</strong>
                      <span class="badge badge-student">${n.type || 'Academic'}</span>
                      ${!n.read ? `<span class="badge badge-danger" style="font-size: 0.65rem;">NEW</span>` : ''}
                    </div>
                    <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.5;">${n.desc}</p>
                  </div>
                </div>
                <div style="text-align: right; flex-shrink: 0;">
                  <span style="font-size: 0.78rem; color: var(--text-subtle); display: block; margin-bottom: 0.5rem;">${n.time || 'Recently'}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  filterNotifications: function(cat, btn) {
    document.querySelectorAll('.tabs-nav .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('#notification-list-container .notification-card-item').forEach(item => {
      if (cat === 'all' || item.getAttribute('data-category') === cat) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  },

  searchNotifications: function(query) {
    const q = query.toLowerCase();
    document.querySelectorAll('#notification-list-container .notification-card-item').forEach(item => {
      item.style.display = item.innerText.toLowerCase().includes(q) ? 'flex' : 'none';
    });
  },

  // 4. Timetable Page
  renderTimetable: function() {
    const user = Auth.getCurrentUser();
    const studentId = user ? user.id : "STU-2026-101";

    if (!Store.studentCache.timetable && !Store.studentCache.loading.timetable) {
      Store.syncStudentTimetable(studentId).then(() => App.renderCurrentView());
      return `
        <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
          <div class="spinner" style="margin: 0 auto 1rem auto; width: 36px; height: 36px; border: 3px solid var(--border-color); border-top-color: var(--primary-500); border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p>Loading Weekly Timetable from MongoDB...</p>
        </div>
      `;
    }

    const list = Store.studentCache.timetable || Store.getStudentTimetable();

    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 800;">Academic Course Timetable</h1>
            <p style="color: var(--text-muted); font-size: 0.9rem;">MongoDB Timetable Schedule • Monday to Saturday</p>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-primary btn-sm" onclick="alert('AI Schedule Optimizer: No time slot overlaps detected for your enrolled courses.')">
              <i data-lucide="sparkles"></i> AI Schedule Optimizer
            </button>
          </div>
        </div>

        <div class="card glass-panel" style="background: rgba(99, 102, 241, 0.08); border-color: rgba(99, 102, 241, 0.25); margin-bottom: 1.5rem;">
          <div style="display: flex; align-items: center; gap: 0.85rem;">
            <div class="brand-icon" style="width: 36px; height: 36px; flex-shrink: 0;"><i data-lucide="bot"></i></div>
            <div style="font-size: 0.88rem;">
              <strong>AI Schedule Insight:</strong> All timetable slots are automatically synchronized with your department's course matrix.
              <button class="btn btn-ghost btn-sm" style="color: var(--primary-400); font-weight: 600;" onclick="App.navigateTo('student/ai-assistant')">Ask AI Assistant →</button>
            </div>
          </div>
        </div>

        <div class="card">
          <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            ${list.length === 0 ? `
              <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
                No timetable slots available for your department.
              </div>
            ` : list.map(t => `
              <div style="padding: 1.25rem; background: var(--bg-secondary); border-radius: var(--radius-sm); border-left: 4px solid var(--portal-accent);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
                  <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--portal-accent);">${t.day}</h3>
                  <span style="font-size: 0.78rem; color: var(--text-muted);">${(t.slots || []).length} Sessions</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem;">
                  ${(t.slots || []).map(s => `
                    <div style="padding: 1rem; background: var(--surface); border: 1px solid var(--border-color); border-radius: var(--radius-sm);" class="card-interactive">
                      <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span class="badge badge-primary">${s.courseCode}</span>
                        <span style="font-size: 0.78rem; font-weight: 600; color: var(--text-muted);">${s.time}</span>
                      </div>
                      <strong style="display: block; font-size: 0.95rem; margin-bottom: 0.35rem;">${s.courseName}</strong>
                      <div style="font-size: 0.8rem; color: var(--text-subtle); display: flex; flex-direction: column; gap: 0.2rem;">
                        <span style="display: flex; align-items: center; gap: 0.3rem;"><i data-lucide="map-pin" style="width: 12px; height: 12px;"></i> ${s.room}</span>
                        <span style="display: flex; align-items: center; gap: 0.3rem;"><i data-lucide="user" style="width: 12px; height: 12px;"></i> ${s.instructorName}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // 5. Events Page
  renderEvents: function() {
    const user = Auth.getCurrentUser();
    const studentId = user ? user.id : "STU-2026-101";

    if (!Store.studentCache.events && !Store.studentCache.loading.events) {
      Store.syncStudentEvents(studentId).then(() => App.renderCurrentView());
    }

    const list = Store.studentCache.events || Store.getStudentEvents() || [];
    const featuredEvent = list.length > 0 ? list[0] : { title: "Campus AI Hackathon 2026", desc: "Build cutting-edge generative AI apps with $10,000 in prizes.", id: "e1", tag: "Hackathon" };
    const featuredId = featuredEvent._id || featuredEvent.eventId || featuredEvent.id;
    const featuredRsvps = Array.isArray(featuredEvent.rsvps) ? featuredEvent.rsvps : [];
    const isFeaturedRegistered = featuredRsvps.includes(studentId);

    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 800;">Campus Events & Hackathons</h1>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Explore upcoming hackathons, tech talks, workshops, and student festivals.</p>
          </div>
          <div class="input-group" style="max-width: 300px;">
            <i data-lucide="search" class="input-icon"></i>
            <input type="text" class="input-field" placeholder="Search events..." onkeyup="StudentViews.searchEvents(this.value)">
          </div>
        </div>

        <div class="card glass-panel" style="background: linear-gradient(135deg, rgba(79,70,229,0.2) 0%, rgba(236,72,153,0.15) 100%); margin-bottom: 2rem; border-color: rgba(129,140,248,0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem;">
            <div>
              <span class="badge badge-primary" style="margin-bottom: 0.5rem;"><i data-lucide="sparkles"></i> Featured Event</span>
              <h2 style="font-size: 1.6rem; font-weight: 800;">${featuredEvent.title}</h2>
              <p style="color: var(--text-muted); font-size: 0.92rem; margin-top: 0.35rem; max-width: 650px;">
                ${featuredEvent.desc || featuredEvent.description || 'Join student competitors and faculty mentors.'}
              </p>
            </div>
            ${isFeaturedRegistered ? `
              <button class="btn btn-outline btn-lg" style="color: var(--status-error); border-color: rgba(239, 68, 68, 0.4);" onclick="StudentViews.handleEventRSVP('${featuredId}', 'cancel', this)">
                <i data-lucide="user-x"></i> Cancel Registration
              </button>
            ` : `
              <button class="btn btn-primary btn-lg" onclick="StudentViews.handleEventRSVP('${featuredId}', 'register', this)">
                <i data-lucide="trophy"></i> Register Now
              </button>
            `}
          </div>
        </div>

        <div class="grid-cols-3" id="events-grid-container">
          ${list.map(e => {
            const eId = e._id || e.eventId || e.id;
            const rsvps = Array.isArray(e.rsvps) ? e.rsvps : [];
            const isRegistered = rsvps.includes(studentId);
            const rsvpCount = e.rsvpCount !== undefined ? e.rsvpCount : rsvps.length;

            return `
              <div class="card card-interactive event-card-item" data-title="${(e.title || '').toLowerCase()}" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                    <span class="badge badge-student">${e.tag || e.category || 'Event'}</span>
                    <div style="display: flex; align-items: center; gap: 0.35rem;">
                      ${isRegistered ? `<span class="badge badge-staff" style="background: rgba(16, 185, 129, 0.2); color: #10b981;"><i data-lucide="check"></i> Registered</span>` : ''}
                      <span style="font-size: 0.75rem; color: var(--text-subtle);">${e.category || 'Academic'}</span>
                    </div>
                  </div>
                  <h3 style="font-size: 1.15rem; margin-bottom: 0.5rem; line-height: 1.3;">${e.title}</h3>
                  <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem; line-height: 1.5;">${e.desc || e.description || 'Campus academic event.'}</p>
                  <div style="font-size: 0.8rem; color: var(--text-subtle); display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 1.25rem;">
                    <span><i data-lucide="calendar" style="width: 14px; height: 14px;"></i> ${e.date || 'Upcoming'} • ${e.time || '10:00 AM'}</span>
                    <span><i data-lucide="map-pin" style="width: 14px; height: 14px;"></i> ${e.location || e.venue || 'Campus Auditorium'}</span>
                    <span><i data-lucide="users" style="width: 14px; height: 14px;"></i> <strong>${rsvpCount}</strong> Attendees</span>
                  </div>
                </div>
                ${isRegistered ? `
                  <button class="btn btn-outline btn-sm" style="width: 100%; color: var(--status-error); border-color: rgba(239, 68, 68, 0.4);" onclick="StudentViews.handleEventRSVP('${eId}', 'cancel', this)">
                    <i data-lucide="user-x"></i> Cancel Registration
                  </button>
                ` : `
                  <button class="btn btn-primary btn-sm" style="width: 100%; background: linear-gradient(135deg, #4f46e5, #7c3aed);" onclick="StudentViews.handleEventRSVP('${eId}', 'register', this)">
                    <i data-lucide="plus"></i> Confirm RSVP
                  </button>
                `}
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
      const userId = user ? user.id : "STU-2026-101";
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
    document.querySelectorAll('#events-grid-container .event-card-item').forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(q) ? 'flex' : 'none';
    });
  },

  // 6. Profile Page
  renderProfile: function() {
    const user = Auth.getCurrentUser();
    const studentId = user ? user.id : "STU-2026-101";

    if (!Store.studentCache.profile && !Store.studentCache.loading.profile) {
      Store.syncStudentProfile(studentId).then(() => App.renderCurrentView());
      return `
        <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
          <div class="spinner" style="margin: 0 auto 1rem auto; width: 36px; height: 36px; border: 3px solid var(--border-color); border-top-color: var(--primary-500); border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p>Loading Profile Details from MongoDB...</p>
        </div>
      `;
    }

    const profile = Store.studentCache.profile;
    const name = profile ? profile.name : user.name;
    const email = profile ? profile.email : user.email;
    const deptName = profile && profile.deptId ? profile.deptId.name : (profile ? profile.dept : user.department);
    const idNum = profile ? profile.studentId : user.id;
    const cgpa = profile ? profile.cgpa : "3.84";
    const year = profile ? profile.year : "Senior";
    const status = profile ? profile.status : "Active";
    const credits = profile ? profile.creditsEarned : 90;
    const enrolled = profile ? (profile.enrolledCourses || []) : [];

    return `
      <div style="max-width: 1100px; margin: 0 auto;">
        <div class="card glass-panel" style="background: linear-gradient(135deg, rgba(37,99,235,0.2) 0%, rgba(124,58,237,0.15) 100%); margin-bottom: 2rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 1.5rem;">
              <div class="user-avatar" style="width: 80px; height: 80px; font-size: 2rem; border: 3px solid var(--primary-500);">AR</div>
              <div>
                <h1 style="font-size: 2rem; font-weight: 800;">${name}</h1>
                <p style="color: var(--text-muted); font-size: 0.92rem;">${deptName} • Roll ID: <strong>${idNum}</strong></p>
                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                  <span class="badge badge-student">Year: ${year}</span>
                  <span class="badge badge-primary">CGPA: ${cgpa}</span>
                  <span class="badge badge-staff">Status: ${status}</span>
                  <span class="badge badge-admin">Credits: ${credits}</span>
                </div>
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="StudentViews.saveProfile()">
              <i data-lucide="save"></i> Save Changes
            </button>
          </div>
        </div>

        <div class="grid-cols-2" style="margin-bottom: 2rem;">
          <div class="card">
            <h3 class="card-title" style="margin-bottom: 1.25rem;"><i data-lucide="book-open" style="color: var(--primary-400);"></i> Enrolled Courses & Academic Modules</h3>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              ${enrolled.length === 0 ? `
                <div style="padding: 1rem; color: var(--text-muted);">No courses listed.</div>
              ` : enrolled.map(c => `
                <div style="padding: 0.85rem; background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
                    <div>
                      <strong style="font-size: 0.9rem;">${c.code}: ${c.title}</strong>
                      <span style="font-size: 0.78rem; color: var(--text-muted); display: block;">${c.instructorName || 'Faculty'} • ${c.credits || 4} Credits</span>
                    </div>
                    <span class="badge badge-primary">${c.avgGrade || 'A'}</span>
                  </div>
                  <div style="width: 100%; height: 5px; background: var(--surface); border-radius: 3px; overflow: hidden; margin-top: 0.5rem;">
                    <div style="width: ${c.syllabusProgress || 80}%; height: 100%; background: var(--portal-accent);"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="card">
            <h3 class="card-title" style="margin-bottom: 1.25rem;"><i data-lucide="user" style="color: var(--accent-cyan);"></i> Student Personal Details</h3>
            <form id="form-student-profile" onsubmit="event.preventDefault(); StudentViews.saveProfile();">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" id="student-profile-name" class="input-field" value="${name}">
              </div>
              <div class="form-group">
                <label class="form-label">University Email</label>
                <input type="email" class="input-field" value="${email}" readonly style="opacity: 0.7;">
              </div>
              <div class="form-group">
                <label class="form-label">Department</label>
                <input type="text" class="input-field" value="${deptName}" readonly style="opacity: 0.7;">
              </div>
              <div class="form-group">
                <label class="form-label">AI Copilot Personalization</label>
                <select id="student-profile-pref" class="input-field select-field">
                  <option selected>Detailed Academic Explanations (Default)</option>
                  <option>Concise Summary Bullet Points</option>
                  <option>Code & Formula Focused Responses</option>
                </select>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  saveProfile: function() {
    const nameEl = document.getElementById('student-profile-name');
    const name = nameEl ? nameEl.value.trim() : '';

    if (!name) {
      alert('Please enter your full name.');
      return;
    }

    alert('Student profile updated successfully!');
    App.renderCurrentView();
  },

  // 7. College Information Page
  renderCollegeInfo: function() {
    const user = Auth.getCurrentUser();
    const studentId = user ? user.id : "STU-2026-101";

    if (!Store.studentCache.collegeInfo && !Store.studentCache.loading.collegeInfo) {
      Store.syncStudentCollegeInfo(studentId).then(() => App.renderCurrentView());
    }

    const info = Store.studentCache.collegeInfo;
    const depts = info ? (info.departments || []) : [];
    const library = Store.getLibraryResources();

    return `
      <div>
        <div style="margin-bottom: 1.5rem;">
          <h1 style="font-size: 1.75rem; font-weight: 800;">College Information & Campus Directory</h1>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Access academic directory, department listings, library catalogs, and campus facilities.</p>
        </div>

        <div class="grid-cols-3" style="margin-bottom: 2rem;">
          <div class="card">
            <div class="stat-icon" style="margin-bottom: 1rem;"><i data-lucide="building"></i></div>
            <h3>Campus Directory</h3>
            <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 0.5rem; margin-bottom: 1rem;">Contact details for department heads, faculty offices, and registrar.</p>
            <button class="btn btn-outline btn-sm" style="width: 100%;" onclick="alert('Directory PDF downloaded.')">Download Directory</button>
          </div>
          <div class="card">
            <div class="stat-icon" style="margin-bottom: 1rem;"><i data-lucide="book-open"></i></div>
            <h3>Digital Library Catalog</h3>
            <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 0.5rem; margin-bottom: 1rem;">Access 50,000+ IEEE journals, e-books, and research paper databases.</p>
            <button class="btn btn-outline btn-sm" style="width: 100%;" onclick="alert('Library Search Focused.')">Search Library</button>
          </div>
          <div class="card">
            <div class="stat-icon" style="margin-bottom: 1rem;"><i data-lucide="map"></i></div>
            <h3>Interactive Campus Map</h3>
            <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 0.5rem; margin-bottom: 1rem;">Live campus GPS navigation with Dijkstra shortest-path routing.</p>
            <button class="btn btn-outline btn-sm" style="width: 100%;" onclick="window.location.hash = '#/student/campus-map'">View Campus Map</button>
          </div>
        </div>

        <!-- Departments List Grid -->
        <div style="margin-bottom: 2rem;">
          <h3 class="card-title" style="margin-bottom: 1rem;"><i data-lucide="building" style="color: var(--primary-400);"></i> Academic Departments</h3>
          <div class="grid-cols-3">
            ${depts.map(d => `
              <div class="card card-interactive">
                <div class="badge badge-primary" style="margin-bottom: 0.5rem;">${d.code}</div>
                <h4 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 0.35rem;">${d.name}</h4>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem;">HOD: <strong>${d.hodName || (d.hodId ? d.hodId.name : 'TBD')}</strong></p>
                <div style="font-size: 0.78rem; color: var(--text-subtle); display: flex; justify-content: space-between;">
                  <span>Students: ${d.studentCount || 0}</span>
                  <span>Faculty: ${d.facultyCount || 0}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <h3 class="card-title"><i data-lucide="book" style="color: var(--primary-400);"></i> Digital Library Catalog</h3>
            <div class="input-group" style="max-width: 250px;">
              <i data-lucide="search" class="input-icon"></i>
              <input type="text" class="input-field" placeholder="Search book title..." onkeyup="StudentViews.searchLibrary(this.value)">
            </div>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Book Code</th>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="library-table-body">
                ${library.map(b => `
                  <tr>
                    <td><strong>${b.code}</strong></td>
                    <td>${b.title}</td>
                    <td>${b.author}</td>
                    <td><span class="badge badge-${b.status.includes('Available') ? 'staff' : 'admin'}">${b.status}</span></td>
                    <td>
                      <button class="btn btn-ghost btn-sm" onclick="alert('Book reserved: ${b.title}')">Reserve</button>
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

  searchLibrary: function(query) {
    const q = query.toLowerCase();
    document.querySelectorAll('#library-table-body tr').forEach(row => {
      row.style.display = row.innerText.toLowerCase().includes(q) ? '' : 'none';
    });
  },

  // 8. Anonymous Campus Community Page
  renderCommunity: function() {
    return CommunityView.render('student');
  },

  // 9. Service Requests & Helpdesk Tickets
  renderServiceRequests: function() {
    setTimeout(() => ServiceRequestsView.loadTickets('student'), 50);
    return ServiceRequestsView.render('student');
  },

  // 10. Interactive Campus Map
  renderCampusMap: function() {
    setTimeout(() => CampusMapView.initMap(), 100);
    return CampusMapView.render('student');
  }
};
