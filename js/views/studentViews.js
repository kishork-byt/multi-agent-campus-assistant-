/* ==========================================================================
   COLLEGE AI ASSISTANT - STUDENT PORTAL VIEWS (FUNCTIONAL ENGINE)
   ========================================================================== */

const StudentViews = {
  // 1. Dashboard (DO NOT MODIFY DESIGN)
  renderDashboard: function() {
    const data = MockData.student;
    return `
      <div>
        <!-- Welcome Hero Widget -->
        <div class="card glass-panel" style="background: linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%); margin-bottom: 2rem; border-color: rgba(59, 130, 246, 0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <span class="badge badge-student" style="margin-bottom: 0.5rem;">Student Dashboard</span>
              <h1 style="font-size: 2rem; font-weight: 800;">Welcome back, Alex! 👋</h1>
              <p style="color: var(--text-muted); font-size: 0.95rem;">You have 3 classes scheduled for today. AI Copilot is active.</p>
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
              <span class="stat-value">${data.stats.cgpa}</span>
              <span class="stat-label">Current CGPA</span>
              <span class="stat-change up"><i data-lucide="trending-up"></i> Top 5%</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981;"><i data-lucide="user-check"></i></div>
            <div class="stat-info">
              <span class="stat-value">${data.stats.attendance}</span>
              <span class="stat-label">Overall Attendance</span>
              <span class="stat-change up"><i data-lucide="check"></i> Satisfactory</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(139, 92, 246, 0.15); color: #8b5cf6;"><i data-lucide="book-open"></i></div>
            <div class="stat-info">
              <span class="stat-value">${data.stats.creditsEarned}</span>
              <span class="stat-label">Degree Credits</span>
              <span class="stat-change up">Semester 6</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;"><i data-lucide="clock"></i></div>
            <div class="stat-info">
              <span class="stat-value">${data.stats.activeTasks}</span>
              <span class="stat-label">Assignments Due</span>
              <span class="stat-change down"><i data-lucide="alert-circle"></i> Due this week</span>
            </div>
          </div>
        </div>

        <!-- 2 Column Layout: Today's Classes & Notifications/Events -->
        <div class="grid-cols-2">
          <!-- Today's Schedule -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title"><i data-lucide="calendar" style="color: var(--primary-400);"></i> Today's Schedule</h3>
              <a href="#/student/timetable" class="btn btn-ghost btn-sm">Full Timetable →</a>
            </div>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              ${data.todaySchedule.map(s => `
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-sm); border-left: 4px solid var(--primary-500); display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong style="display: block; font-size: 0.95rem;">${s.course}</strong>
                    <span style="font-size: 0.8rem; color: var(--text-muted); display: flex; gap: 1rem; margin-top: 0.25rem;">
                      <span><i data-lucide="map-pin" style="width: 14px; height: 14px;"></i> ${s.room}</span>
                      <span><i data-lucide="user" style="width: 14px; height: 14px;"></i> ${s.instructor}</span>
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
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">Ask your AI assistant for quick summaries or help with your assignments.</p>
              <div style="display: flex; gap: 0.5rem;">
                <input type="text" class="input-field" placeholder="e.g. What is due tomorrow?" id="dash-quick-ai">
                <button class="btn btn-primary" onclick="App.navigateTo('student/ai-assistant')">Ask</button>
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <h3 class="card-title"><i data-lucide="party-popper" style="color: var(--accent-violet);"></i> Upcoming Campus Events</h3>
                <a href="#/student/events" class="btn btn-ghost btn-sm">All Events →</a>
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                ${data.upcomingEvents.slice(0, 2).map(e => `
                  <div style="padding: 0.85rem; background: var(--bg-secondary); border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <strong style="font-size: 0.9rem; display: block;">${e.title}</strong>
                      <span style="font-size: 0.78rem; color: var(--text-muted);">${e.date} • ${e.location}</span>
                    </div>
                    <span class="badge badge-student">${e.tag}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // 2. AI Assistant Page (DO NOT MODIFY DESIGN)
  renderAIAssistant: function() {
    return AIChatComponent.render('student');
  },

  // 3. Notifications Page (STORE PERSISTENT)
  renderNotifications: function() {
    const list = Store.getStudentNotifications();
    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 800;">Student Notifications & Activity Log</h1>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Stay informed about grade releases, assignment feedback, and campus announcements.</p>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-secondary btn-sm" onclick="Store.markAllNotificationsRead('student'); App.renderCurrentView();">
              <i data-lucide="check-check"></i> Mark All as Read
            </button>
            <button class="btn btn-outline btn-sm" onclick="alert('Notification preference settings saved.')">
              <i data-lucide="settings"></i> Notification Settings
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
            ${list.map(n => `
              <div class="notification-card-item" data-category="${n.type}" style="padding: 1.25rem; background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="display: flex; gap: 1rem;">
                  <div class="stat-icon" style="width: 44px; height: 44px; flex-shrink: 0; background: ${n.type === 'Academic' ? 'rgba(59,130,246,0.15)' : n.type === 'Event' ? 'rgba(139,92,246,0.15)' : 'rgba(16,185,129,0.15)'}; color: ${n.type === 'Academic' ? '#3b82f6' : n.type === 'Event' ? '#8b5cf6' : '#10b981'};">
                    <i data-lucide="${n.type === 'Academic' ? 'graduation-cap' : n.type === 'Event' ? 'party-popper' : 'shield-check'}"></i>
                  </div>
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
                      <strong style="font-size: 0.95rem;">${n.title}</strong>
                      <span class="badge badge-student">${n.type}</span>
                      ${!n.read ? `<span class="badge badge-danger" style="font-size: 0.65rem;">NEW</span>` : ''}
                    </div>
                    <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.5;">${n.desc}</p>
                  </div>
                </div>
                <div style="text-align: right; flex-shrink: 0;">
                  <span style="font-size: 0.78rem; color: var(--text-subtle); display: block; margin-bottom: 0.5rem;">${n.time}</span>
                  <button class="btn btn-ghost btn-sm" onclick="Store.dismissNotification('student', '${n.id}'); App.renderCurrentView();">Dismiss</button>
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
    const list = Store.getStudentTimetable();
    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 800;">Academic Course Timetable</h1>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Fall 2026 Semester Schedule • 18 Total Weekly Hours</p>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-primary btn-sm" onclick="alert('AI Schedule Optimizer: No time slot overlaps detected for your 5 enrolled courses.')">
              <i data-lucide="sparkles"></i> AI Schedule Optimizer
            </button>
            <button class="btn btn-outline btn-sm" onclick="alert('Exporting schedule to iCal / Google Calendar...')">
              <i data-lucide="download"></i> Export iCal
            </button>
          </div>
        </div>

        <div class="card glass-panel" style="background: rgba(99, 102, 241, 0.08); border-color: rgba(99, 102, 241, 0.25); margin-bottom: 1.5rem;">
          <div style="display: flex; align-items: center; gap: 0.85rem;">
            <div class="brand-icon" style="width: 36px; height: 36px; flex-shrink: 0;"><i data-lucide="bot"></i></div>
            <div style="font-size: 0.88rem;">
              <strong>AI Schedule Insight:</strong> You have a 2-hour break on Wednesdays between 11:00 AM and 03:00 PM. Would you like AI to schedule a study session for CS-401?
              <button class="btn btn-ghost btn-sm" style="color: var(--primary-400); font-weight: 600;" onclick="App.navigateTo('student/ai-assistant')">Ask AI Assistant →</button>
            </div>
          </div>
        </div>

        <div class="card">
          <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            ${list.map(t => `
              <div style="padding: 1.25rem; background: var(--bg-secondary); border-radius: var(--radius-sm); border-left: 4px solid var(--portal-accent);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
                  <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--portal-accent);">${t.day}</h3>
                  <span style="font-size: 0.78rem; color: var(--text-muted);">${t.slots.length} Sessions</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem;">
                  ${t.slots.map(s => `
                    <div style="padding: 1rem; background: var(--surface); border: 1px solid var(--border-color); border-radius: var(--radius-sm);" class="card-interactive">
                      <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span class="badge badge-primary">${s.code}</span>
                        <span style="font-size: 0.78rem; font-weight: 600; color: var(--text-muted);">${s.time}</span>
                      </div>
                      <strong style="display: block; font-size: 0.95rem; margin-bottom: 0.35rem;">${s.name}</strong>
                      <div style="font-size: 0.8rem; color: var(--text-subtle); display: flex; flex-direction: column; gap: 0.2rem;">
                        <span style="display: flex; align-items: center; gap: 0.3rem;"><i data-lucide="map-pin" style="width: 12px; height: 12px;"></i> ${s.room}</span>
                        <span style="display: flex; align-items: center; gap: 0.3rem;"><i data-lucide="user" style="width: 12px; height: 12px;"></i> ${s.instructor}</span>
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

  // 5. Events Page (STORE PERSISTENT RSVP)
  renderEvents: function() {
    const list = Store.getStudentEvents();
    const featuredEvent = list.find(e => e.id === 'e1') || list[0];
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
                ${featuredEvent.desc}
              </p>
            </div>
            <button class="btn ${featuredEvent.rsvp ? 'btn-secondary' : 'btn-primary'} btn-lg" onclick="Store.toggleEventRSVP('${featuredEvent.id}'); App.renderCurrentView();">
              <i data-lucide="${featuredEvent.rsvp ? 'check' : 'trophy'}"></i> ${featuredEvent.rsvp ? 'Team Registered ✓' : 'Register Team Now'}
            </button>
          </div>
        </div>

        <div class="grid-cols-3" id="events-grid-container">
          ${list.map(e => `
            <div class="card card-interactive event-card-item" data-title="${e.title.toLowerCase()}" style="display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                  <span class="badge badge-student">${e.tag}</span>
                  <span style="font-size: 0.75rem; color: var(--text-subtle);">${e.category}</span>
                </div>
                <h3 style="font-size: 1.15rem; margin-bottom: 0.5rem; line-height: 1.3;">${e.title}</h3>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem; line-height: 1.5;">${e.desc}</p>
                <div style="font-size: 0.8rem; color: var(--text-subtle); display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 1.25rem;">
                  <span><i data-lucide="calendar" style="width: 14px; height: 14px;"></i> ${e.date} • ${e.time}</span>
                  <span><i data-lucide="map-pin" style="width: 14px; height: 14px;"></i> ${e.location}</span>
                </div>
              </div>
              <button class="btn ${e.rsvp ? 'btn-secondary' : 'btn-primary'} btn-sm" style="width: 100%;" onclick="Store.toggleEventRSVP('${e.id}'); App.renderCurrentView();">
                <i data-lucide="${e.rsvp ? 'check' : 'plus'}"></i> ${e.rsvp ? 'RSVP Confirmed ✓' : 'Confirm RSVP'}
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
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
    const courses = Store.getStudentCourses();

    return `
      <div style="max-width: 1100px; margin: 0 auto;">
        <div class="card glass-panel" style="background: linear-gradient(135deg, rgba(37,99,235,0.2) 0%, rgba(124,58,237,0.15) 100%); margin-bottom: 2rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 1.5rem;">
              <div class="user-avatar" style="width: 80px; height: 80px; font-size: 2rem; border: 3px solid var(--primary-500);">${user.avatar}</div>
              <div>
                <h1 style="font-size: 2rem; font-weight: 800;">${user.name}</h1>
                <p style="color: var(--text-muted); font-size: 0.92rem;">${user.department} • Roll ID: <strong>${user.id}</strong></p>
                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                  <span class="badge badge-student">B.Tech Senior</span>
                  <span class="badge badge-primary">CGPA: 3.84</span>
                  <span class="badge badge-staff">96.5% Attendance</span>
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
            <h3 class="card-title" style="margin-bottom: 1.25rem;"><i data-lucide="book-open" style="color: var(--primary-400);"></i> Enrolled Courses & Academic Grades</h3>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              ${courses.map(c => `
                <div style="padding: 0.85rem; background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
                    <div>
                      <strong style="font-size: 0.9rem;">${c.code}: ${c.title}</strong>
                      <span style="font-size: 0.78rem; color: var(--text-muted); display: block;">${c.instructor} • ${c.credits} Credits</span>
                    </div>
                    <span class="badge badge-primary">${c.grade}</span>
                  </div>
                  <div style="width: 100%; height: 5px; background: var(--surface); border-radius: 3px; overflow: hidden; margin-top: 0.5rem;">
                    <div style="width: ${c.progress}%; height: 100%; background: var(--portal-accent);"></div>
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
                <input type="text" id="student-profile-name" class="input-field" value="${user.name}">
              </div>
              <div class="form-group">
                <label class="form-label">University Email</label>
                <input type="email" class="input-field" value="${user.email}" readonly style="opacity: 0.7;">
              </div>
              <div class="form-group">
                <label class="form-label">Department</label>
                <input type="text" class="input-field" value="${user.department}" readonly style="opacity: 0.7;">
              </div>
              <div class="form-group">
                <label class="form-label">AI Copilot Personalization</label>
                <select id="student-profile-pref" class="input-field select-field">
                  <option ${user.aiPreference === 'Detailed Academic Explanations (Default)' ? 'selected' : ''}>Detailed Academic Explanations (Default)</option>
                  <option ${user.aiPreference === 'Concise Summary Bullet Points' ? 'selected' : ''}>Concise Summary Bullet Points</option>
                  <option ${user.aiPreference === 'Code & Formula Focused Responses' ? 'selected' : ''}>Code & Formula Focused Responses</option>
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
    const prefEl = document.getElementById('student-profile-pref');
    const name = nameEl ? nameEl.value.trim() : '';
    const pref = prefEl ? prefEl.value : '';

    if (!name) {
      alert('Please enter your full name.');
      return;
    }

    Store.updateStudentProfile(name, pref);
    alert('Student profile updated successfully!');
    App.renderCurrentView();
  },

  // 7. College Information Page
  renderCollegeInfo: function() {
    const library = Store.getLibraryResources();
    return `
      <div>
        <div style="margin-bottom: 1.5rem;">
          <h1 style="font-size: 1.75rem; font-weight: 800;">College Information & Campus Directory</h1>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Access academic directory, library catalogs, exam schedules, and facility timings.</p>
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
            <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 0.5rem; margin-bottom: 1rem;">Locate lecture halls, AI research labs, auditoriums, and cafeterias.</p>
            <button class="btn btn-outline btn-sm" style="width: 100%;" onclick="alert('Interactive map loaded.')">View Map</button>
          </div>
        </div>

        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <h3 class="card-title"><i data-lucide="book" style="color: var(--primary-400);"></i> Digital Library Catalog Preview</h3>
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
  }
};
