/* ==========================================================================
   COLLEGE AI ASSISTANT - PUBLIC VIEWS (FUNCTIONAL ENGINE)
   ========================================================================== */

const PublicViews = {
  selectedRole: 'student',

  // 1. Home Page
  renderHome: function() {
    return `
      <div style="background: linear-gradient(180deg, rgba(79, 70, 229, 0.12) 0%, transparent 60%); padding: 5rem 2rem 3rem 2rem;" class="hero-section">
        <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center;" class="grid-cols-2">
          <div>
            <span class="badge badge-primary" style="margin-bottom: 1rem;"><i data-lucide="sparkles"></i> Next-Gen Campus AI Engine</span>
            <h1 class="hero-title" style="font-size: 3.5rem; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 1.25rem;">
              Empowering Education with Intelligent <span class="gradient-text">AI Copilots</span>
            </h1>
            <p style="font-size: 1.15rem; color: var(--text-muted); margin-bottom: 2rem; line-height: 1.7;">
              A unified responsive AI platform connecting Students, Staff, and Campus Administrators with automated schedules, AI tutoring, grading assistants, and real-time campus management.
            </p>
            <div class="hero-actions" style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
              <a href="#/role-selection" class="btn btn-primary btn-lg">
                <i data-lucide="sparkles"></i> Launch Web Portals
              </a>
              <a href="#/features" class="btn btn-secondary btn-lg">
                <i data-lucide="play-circle"></i> Explore Features
              </a>
            </div>
          </div>
          <div>
            <div class="card glass-panel" style="padding: 2rem; position: relative; border-color: var(--border-glow);">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <div class="brand-icon"><i data-lucide="bot"></i></div>
                  <div>
                    <strong style="display: block;">Campus AI Copilot</strong>
                    <span style="font-size: 0.75rem; color: var(--status-success);">Active • 24/7 Academic Support</span>
                  </div>
                </div>
                <span class="badge badge-student">Live Preview</span>
              </div>
              <div style="background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius-sm); font-size: 0.9rem; margin-bottom: 1rem; border: 1px solid var(--border-color);">
                <strong>Student:</strong> "Can you summarize my AI Systems lecture and check tomorrow's assignment submission deadline?"
              </div>
              <div style="background: rgba(99, 102, 241, 0.1); padding: 1rem; border-radius: var(--radius-sm); font-size: 0.9rem; border-left: 3px solid var(--primary-500);">
                <strong>AI Assistant:</strong> "Certainly! Your CS-401 lecture focused on Neural Network Weights. Your Lab Report is due tomorrow at 11:59 PM in Room 304."
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Feature Grid -->
      <section style="padding: 4rem 2rem; max-width: 1200px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 3rem;">
          <h2 style="font-size: 2.25rem; font-weight: 800; margin-bottom: 0.75rem;">Tailored Interfaces for Every Role</h2>
          <p style="color: var(--text-muted); font-size: 1.05rem;">Designed desktop-first with seamless mobile & tablet responsive navigation.</p>
        </div>

        <div class="grid-cols-3">
          <div class="card card-interactive">
            <div class="stat-icon" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6; margin-bottom: 1rem;">
              <i data-lucide="graduation-cap"></i>
            </div>
            <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem;">Student Portal</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.25rem;">Smart timetables, instant AI study companion, event calendar, GPA tracker, and course resources.</p>
            <button onclick="App.switchPortal('student')" class="btn btn-outline btn-sm" style="width: 100%;">View Student View</button>
          </div>

          <div class="card card-interactive">
            <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981; margin-bottom: 1rem;">
              <i data-lucide="briefcase"></i>
            </div>
            <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem;">Staff & Faculty Portal</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.25rem;">Lesson plan builder, AI grading assistant, task Kanban boards, class attendance & announcements.</p>
            <button onclick="App.switchPortal('staff')" class="btn btn-outline btn-sm" style="width: 100%;">View Staff View</button>
          </div>

          <div class="card card-interactive">
            <div class="stat-icon" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; margin-bottom: 1rem;">
              <i data-lucide="shield-check"></i>
            </div>
            <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem;">Administration Portal</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.25rem;">Campus-wide analytics, staff & student management databases, department rosters, and reports.</p>
            <button onclick="App.switchPortal('admin')" class="btn btn-outline btn-sm" style="width: 100%;">View Admin View</button>
          </div>
        </div>
      </section>
    `;
  },

  // 2. About Page
  renderAbout: function() {
    return `
      <div style="padding: 4rem 2rem; max-width: 1100px; margin: 0 auto;">
        <span class="badge badge-primary" style="margin-bottom: 1rem;">About The Platform</span>
        <h1 style="font-size: 2.75rem; margin-bottom: 1.5rem;">Transforming Higher Education with Generative AI</h1>
        <p style="font-size: 1.1rem; color: var(--text-muted); margin-bottom: 3rem; line-height: 1.8;">
          College AI Assistant is a next-generation academic management website platform engineered to streamline campus communication, automate administrative overhead, and empower students with personalized learning tools.
        </p>

        <div class="grid-cols-2" style="margin-bottom: 3rem;">
          <div class="card">
            <h3 class="card-title" style="margin-bottom: 1rem;"><i data-lucide="target" style="color: var(--primary-500);"></i> Our Vision</h3>
            <p style="color: var(--text-muted); font-size: 0.95rem;">To eliminate friction in higher education by providing an intelligent digital infrastructure that supports students 24/7, reduces faculty workload, and gives leadership actionable data insights.</p>
          </div>
          <div class="card">
            <h3 class="card-title" style="margin-bottom: 1rem;"><i data-lucide="lock" style="color: var(--accent-cyan);"></i> Enterprise Campus Security</h3>
            <p style="color: var(--text-muted); font-size: 0.95rem;">Built with role-based access control (RBAC), end-to-end data encryption, FERPA/GDPR compliance, and isolated data containers for student privacy.</p>
          </div>
        </div>
      </div>
    `;
  },

  // 3. Features Page
  renderFeatures: function() {
    return `
      <div style="padding: 4rem 2rem; max-width: 1200px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 3.5rem;">
          <h1 style="font-size: 2.75rem; font-weight: 800;">Comprehensive Platform Features</h1>
          <p style="color: var(--text-muted); font-size: 1.1rem; margin-top: 0.5rem;">Explore our specialized tools engineered for campus workflows.</p>
        </div>

        <div class="grid-cols-3">
          <div class="card">
            <div class="stat-icon" style="margin-bottom: 1rem;"><i data-lucide="brain-circuit"></i></div>
            <h3>Smart AI Tutor</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.5rem;">Contextual Q&A on lecture notes, quiz prep, essay outlines, and complex math problems.</p>
          </div>
          <div class="card">
            <div class="stat-icon" style="margin-bottom: 1rem;"><i data-lucide="calendar"></i></div>
            <h3>Dynamic Timetable Sync</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.5rem;">Automated schedule conflicts detection, room locator, and calendar export for mobile & web.</p>
          </div>
          <div class="card">
            <div class="stat-icon" style="margin-bottom: 1rem;"><i data-lucide="sparkles"></i></div>
            <h3>Faculty Grading Assistant</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.5rem;">AI-assisted rubric evaluation, lesson plan generation, and automated assignment feedback.</p>
          </div>
          <div class="card">
            <div class="stat-icon" style="margin-bottom: 1rem;"><i data-lucide="users"></i></div>
            <h3>Roster & Student Database</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.5rem;">Admin search & filterable tables for attendance tracking, student profiles, and grades.</p>
          </div>
          <div class="card">
            <div class="stat-icon" style="margin-bottom: 1rem;"><i data-lucide="bell"></i></div>
            <h3>Multi-Channel Alerts</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.5rem;">Instant push notifications for exam schedule releases, campus events, and grade updates.</p>
          </div>
          <div class="card">
            <div class="stat-icon" style="margin-bottom: 1rem;"><i data-lucide="bar-chart-2"></i></div>
            <h3>Analytics & Reports</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.5rem;">Interactive visual charts monitoring department attendance, AI usage metrics, and passing rates.</p>
          </div>
        </div>
      </div>
    `;
  },

  // 4. Contact Page
  renderContact: function() {
    return `
      <div style="padding: 4rem 2rem; max-width: 1100px; margin: 0 auto;">
        <div class="grid-cols-2">
          <div>
            <span class="badge badge-primary" style="margin-bottom: 1rem;">Get In Touch</span>
            <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">Contact Campus Support</h1>
            <p style="color: var(--text-muted); margin-bottom: 2rem;">Have questions about onboarding your institution or need technical support?</p>

            <div style="display: flex; flex-direction: column; gap: 1.25rem;">
              <div style="display: flex; gap: 1rem; align-items: center;">
                <div class="stat-icon" style="width: 44px; height: 44px;"><i data-lucide="mail"></i></div>
                <div>
                  <strong style="display: block;">Email Us</strong>
                  <span style="color: var(--text-muted); font-size: 0.9rem;">support@collegeai.edu</span>
                </div>
              </div>
              <div style="display: flex; gap: 1rem; align-items: center;">
                <div class="stat-icon" style="width: 44px; height: 44px;"><i data-lucide="phone"></i></div>
                <div>
                  <strong style="display: block;">Campus IT Helpline</strong>
                  <span style="color: var(--text-muted); font-size: 0.9rem;">+1 (800) 555-COLLEGE</span>
                </div>
              </div>
              <div style="display: flex; gap: 1rem; align-items: center;">
                <div class="stat-icon" style="width: 44px; height: 44px;"><i data-lucide="map-pin"></i></div>
                <div>
                  <strong style="display: block;">Location</strong>
                  <span style="color: var(--text-muted); font-size: 0.9rem;">Innovation Quad, Building A, Suite 400</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <h3 style="font-size: 1.25rem; margin-bottom: 1.25rem;">Send a Message</h3>
            <form onsubmit="event.preventDefault(); alert('Message sent! Support team will respond via email.');">
              <div class="form-group">
                <label class="form-label">Your Name</label>
                <input type="text" class="input-field" placeholder="John Doe" required>
              </div>
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" class="input-field" placeholder="john@university.edu" required>
              </div>
              <div class="form-group">
                <label class="form-label">Message</label>
                <textarea class="input-field" rows="4" placeholder="How can we help you?" required></textarea>
              </div>
              <button type="submit" class="btn btn-primary" style="width: 100%;">Submit Inquiry</button>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  // 5. Login Page (FUNCTIONAL AUTH SUBMIT)
  renderLogin: function() {
    return `
      <div style="min-height: calc(100vh - var(--navbar-height)); display: flex; align-items: center; justify-content: center; padding: 2rem;">
        <div class="card glass-panel" style="width: 100%; max-width: 440px; padding: 2.5rem;">
          <div style="text-align: center; margin-bottom: 2rem;">
            <div class="brand-icon" style="margin: 0 auto 1rem auto; width: 48px; height: 48px;">
              <i data-lucide="bot"></i>
            </div>
            <h2 style="font-size: 1.75rem; font-weight: 800;">Welcome Back</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.25rem;">Sign in to your College AI Assistant account</p>
          </div>

          <div class="tabs-nav" style="justify-content: center; margin-bottom: 1.5rem;">
            <button class="tab-btn active" onclick="PublicViews.switchLoginRole('student', this)">Student</button>
            <button class="tab-btn" onclick="PublicViews.switchLoginRole('staff', this)">Staff</button>
            <button class="tab-btn" onclick="PublicViews.switchLoginRole('admin', this)">Admin</button>
          </div>

          <form onsubmit="event.preventDefault(); PublicViews.handleLoginSubmit();">
            <div class="form-group">
              <label class="form-label">Institutional ID / Email</label>
              <div class="input-group">
                <i data-lucide="user" class="input-icon"></i>
                <input type="text" id="login-id" class="input-field" value="STU-2026-894" required>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Password</label>
              <div class="input-group">
                <i data-lucide="lock" class="input-icon"></i>
                <input type="password" id="login-pass" class="input-field" value="••••••••••••" required>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; font-size: 0.85rem;">
              <label style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); cursor: pointer;">
                <input type="checkbox" checked> Remember me
              </label>
              <a href="javascript:void(0)" onclick="alert('Password reset instructions sent to your institutional email.')" style="color: var(--primary-400);">Forgot password?</a>
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.85rem;">
              Sign In to Portal <i data-lucide="arrow-right"></i>
            </button>
          </form>
        </div>
      </div>
    `;
  },

  switchLoginRole: function(role, btn) {
    this.selectedRole = role;
    document.querySelectorAll('.tabs-nav .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const idInput = document.getElementById('login-id');
    if (idInput) {
      if (role === 'student') idInput.value = "STU-2026-894";
      else if (role === 'staff') idInput.value = "STF-201-VANCE";
      else if (role === 'admin') idInput.value = "ADM-001-SYSTEM";
    }
  },

  handleLoginSubmit: function() {
    const id = document.getElementById('login-id').value;
    const pass = document.getElementById('login-pass').value;

    if (Auth.login(this.selectedRole, id, pass)) {
      App.switchPortal(this.selectedRole);
    }
  },

  // 6. Role Selection Page
  renderRoleSelection: function() {
    return `
      <div style="padding: 4rem 2rem; max-width: 1200px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 3.5rem;">
          <span class="badge badge-primary" style="margin-bottom: 1rem;">Portal Selector</span>
          <h1 style="font-size: 2.75rem; font-weight: 800;">Choose Your Web Portal Experience</h1>
          <p style="color: var(--text-muted); font-size: 1.1rem; margin-top: 0.5rem;">Select an institutional role to explore tailored features & dashboards.</p>
        </div>

        <div class="grid-cols-3">
          <!-- Student Card -->
          <div class="card card-interactive" style="display: flex; flex-direction: column; justify-content: space-between; border-top: 4px solid #3b82f6;">
            <div>
              <div class="badge badge-student" style="margin-bottom: 1rem;">Student View</div>
              <h2 style="font-size: 1.5rem; margin-bottom: 0.75rem;">Student Portal</h2>
              <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 1.5rem;">
                Access course timetables, AI homework assistance, notifications, upcoming campus events, academic records, and college info.
              </p>
            </div>
            <button class="btn btn-primary" onclick="App.switchPortal('student')" style="background: linear-gradient(135deg, #2563eb, #06b6d4);">
              Enter Student Portal <i data-lucide="arrow-right"></i>
            </button>
          </div>

          <!-- Staff Card -->
          <div class="card card-interactive" style="display: flex; flex-direction: column; justify-content: space-between; border-top: 4px solid #10b981;">
            <div>
              <div class="badge badge-staff" style="margin-bottom: 1rem;">Faculty & Staff</div>
              <h2 style="font-size: 1.5rem; margin-bottom: 0.75rem;">Staff & Management Portal</h2>
              <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 1.5rem;">
                Manage assigned classes, use AI lesson planning tools, track tasks on Kanban boards, approve leave requests, and view syllabus status.
              </p>
            </div>
            <button class="btn btn-primary" onclick="App.switchPortal('staff')" style="background: linear-gradient(135deg, #059669, #10b981);">
              Enter Staff Portal <i data-lucide="arrow-right"></i>
            </button>
          </div>

          <!-- Admin Card -->
          <div class="card card-interactive" style="display: flex; flex-direction: column; justify-content: space-between; border-top: 4px solid #f59e0b;">
            <div>
              <div class="badge badge-admin" style="margin-bottom: 1rem;">System Administrator</div>
              <h2 style="font-size: 1.5rem; margin-bottom: 0.75rem;">Administration Portal</h2>
              <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 1.5rem;">
                Oversee campus-wide analytics, manage student & staff master directories, publish announcements, manage departments, and export reports.
              </p>
            </div>
            <button class="btn btn-primary" onclick="App.switchPortal('admin')" style="background: linear-gradient(135deg, #d97706, #7c3aed);">
              Enter Admin Portal <i data-lucide="arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }
};
