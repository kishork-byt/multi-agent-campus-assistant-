/* ==========================================================================
   COLLEGE AI ASSISTANT - MAIN APPLICATION ROUTER & CONTROLLER
   ========================================================================== */

const App = {
  currentPortal: 'public', // 'public' | 'student' | 'staff' | 'admin'
  currentRoute: 'home',

  init: function() {
    const savedTheme = localStorage.getItem('APP_THEME');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
      document.body.setAttribute('data-theme', savedTheme);
    }
    const isCollapsed = localStorage.getItem('SIDEBAR_COLLAPSED') === 'true';
    if (isCollapsed) document.body.classList.add('sidebar-collapsed');
    Store.syncStudentsFromBackend().then(() => {
      if (this.currentRoute === 'students-management') {
        this.renderCurrentView();
      }
    });
    Store.syncFacultyFromBackend().then(() => {
      if (this.currentRoute === 'staff-management') {
        this.renderCurrentView();
      }
    });
    Store.syncEventsFromBackend().then(() => {
      if (this.currentRoute === 'events-management' || this.currentRoute === 'events') {
        this.renderCurrentView();
      }
    });
    Store.syncAnnouncementsFromBackend().then(() => {
      if (this.currentRoute === 'announcements') {
        this.renderCurrentView();
      }
    });
    Store.syncCommunityFromBackend().then(() => {
      if (this.currentRoute === 'community' || this.currentRoute === 'community-moderation') {
        this.renderCurrentView();
      }
    });
    Store.syncNotificationsFromBackend().then(() => {
      this.renderLayout();
    });
    this.startCommunityAutoSync();
    this.bindEvents();
    this.handleRouting();
    window.addEventListener('hashchange', () => this.handleRouting());
  },

  startCommunityAutoSync: function() {
    if (this._communitySyncInterval) return;
    this._communitySyncInterval = setInterval(async () => {
      if (this.currentRoute === 'community' || this.currentRoute === 'community-moderation') {
        const prevPosts = Store.getCommunityPosts();
        const prevLength = prevPosts.length;
        const prevSupports = prevPosts.reduce((a, p) => a + (p.supportCount || 0), 0);
        await Store.syncCommunityFromBackend();
        const newPosts = Store.getCommunityPosts();
        const newLength = newPosts.length;
        const newSupports = newPosts.reduce((a, p) => a + (p.supportCount || 0), 0);

        if (newLength !== prevLength || newSupports !== prevSupports) {
          this.renderCurrentView();
        }
      }
    }, 4000);
  },

  bindEvents: function() {
    // Global theme toggle & sidebar listener delegation
    document.addEventListener('click', (e) => {
      if (e.target.closest('#theme-toggle-btn')) {
        this.toggleTheme();
      }
      if (e.target.closest('#toggle-mobile-sidebar')) {
        this.toggleSidebar();
      }
      if (e.target.closest('#close-mobile-sidebar')) {
        this.closeSidebar();
      }
      if (e.target.closest('.sidebar-nav-item')) {
        const sidebar = document.getElementById('app-sidebar');
        if (sidebar) sidebar.classList.remove('mobile-open');
      }
      if (e.target.closest('#notification-bell-btn')) {
        const pop = document.getElementById('notification-popover');
        if (pop) pop.classList.toggle('active');
      } else if (!e.target.closest('.notification-popover')) {
        const pop = document.getElementById('notification-popover');
        if (pop) pop.classList.remove('active');
      }

      const itemEl = e.target.closest('.notification-item');
      if (itemEl && itemEl.dataset.notifId) {
        Store.markNotificationRead(itemEl.dataset.notifId).then(() => {
          this.renderLayout();
          const pop = document.getElementById('notification-popover');
          if (pop) pop.classList.add('active');
        });
      }

      if (e.target.closest('#mark-all-read-btn')) {
        Store.markAllNotificationsRead(this.currentPortal).then(() => {
          this.renderLayout();
          const pop = document.getElementById('notification-popover');
          if (pop) pop.classList.add('active');
        });
      }
    });
  },

  toggleSidebar: function() {
    if (window.innerWidth <= 768) {
      const sidebar = document.getElementById('app-sidebar');
      if (sidebar) sidebar.classList.toggle('mobile-open');
    } else {
      document.body.classList.toggle('sidebar-collapsed');
      const isCollapsed = document.body.classList.contains('sidebar-collapsed');
      localStorage.setItem('SIDEBAR_COLLAPSED', isCollapsed ? 'true' : 'false');
    }
  },

  closeSidebar: function() {
    if (window.innerWidth <= 768) {
      const sidebar = document.getElementById('app-sidebar');
      if (sidebar) sidebar.classList.remove('mobile-open');
    } else {
      document.body.classList.add('sidebar-collapsed');
      localStorage.setItem('SIDEBAR_COLLAPSED', 'true');
    }
  },

  toggleTheme: function() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('APP_THEME', newTheme);
    const btnIcon = document.querySelector('#theme-toggle-btn i');
    if (btnIcon) {
      btnIcon.setAttribute('data-lucide', newTheme === 'dark' ? 'sun' : 'moon');
      if (window.lucide) lucide.createIcons();
    }
  },

  switchPortal: function(portal) {
    this.currentPortal = portal;
    MockData.currentUser.role = portal;
    this.navigateTo(`${portal}/dashboard`);
  },

  scrollToSection: function(sectionId) {
    const landingSections = ['home', 'about', 'features', 'contact'];

    if (this.currentPortal !== 'public' || this.currentRoute === 'login' || this.currentRoute === 'role-selection') {
      this.navigateTo(sectionId);
      return;
    }

    const targetEl = document.getElementById(sectionId);
    if (targetEl) {
      if (sectionId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
      this.currentRoute = sectionId;
      if (history.replaceState) {
        history.replaceState(null, '', '#/' + sectionId);
      }
      this.updateActiveNavLink(sectionId);
    }
  },

  updateActiveNavLink: function(activeSectionId) {
    document.querySelectorAll('.desktop-nav .nav-link').forEach(link => {
      link.classList.remove('active');
    });
    const activeLink = document.querySelector(`.desktop-nav .nav-item-${activeSectionId}`);
    if (activeLink) activeLink.classList.add('active');
  },

  initScrollSpy: function() {
    if (this._scrollSpyHandler) {
      window.removeEventListener('scroll', this._scrollSpyHandler);
    }
    this._scrollSpyHandler = () => {
      if (this.currentPortal !== 'public' || this.currentRoute === 'login' || this.currentRoute === 'role-selection') return;
      const sections = ['home', 'about', 'features', 'contact'];
      let currentSection = 'home';
      const scrollPosition = window.scrollY + 120;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop - 80;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            currentSection = sectionId;
            break;
          }
        }
      }
      this.updateActiveNavLink(currentSection);
      this.currentRoute = currentSection;
      if (history.replaceState && window.location.hash !== '#/' + currentSection && window.location.hash !== '#' + currentSection) {
        history.replaceState(null, '', '#/' + currentSection);
      }
    };
    window.addEventListener('scroll', this._scrollSpyHandler, { passive: true });
  },

  navigateTo: function(hash) {
    window.location.hash = hash.startsWith('/') ? hash : '/' + hash;
  },

  handleRouting: function() {
    let rawHash = window.location.hash.replace('#/', '').replace('#', '').trim();
    if (!rawHash) rawHash = 'home';

    const landingSections = ['home', 'about', 'features', 'contact'];
    const parts = rawHash.split('/');

    let newPortal = 'public';
    let newRoute = 'home';

    if (parts.length === 1) {
      newPortal = 'public';
      newRoute = parts[0];
    } else {
      newPortal = parts[0];
      newRoute = parts[1];
    }

    const isCurrentlyOnLandingPage = (this.currentPortal === 'public' && landingSections.includes(this.currentRoute) && document.getElementById('landing-container') !== null);
    const isNavigatingToLandingSection = (newPortal === 'public' && landingSections.includes(newRoute));

    this.currentPortal = newPortal;
    this.currentRoute = newRoute;

    document.body.setAttribute('data-portal', this.currentPortal);
    if (this.currentPortal === 'public') {
      document.body.classList.add('public-mode');
    } else {
      document.body.classList.remove('public-mode');
      if (Auth.getCurrentUser().role !== this.currentPortal) {
        Auth.switchRole(this.currentPortal);
      }
    }

    const isCollapsed = localStorage.getItem('SIDEBAR_COLLAPSED') === 'true';
    if (isCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    }

    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) sidebar.classList.remove('mobile-open');

    if (isCurrentlyOnLandingPage && isNavigatingToLandingSection) {
      this.initScrollSpy();
      const targetEl = document.getElementById(newRoute);
      if (targetEl) {
        if (newRoute === 'home') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
      this.updateActiveNavLink(newRoute);
      return;
    }

    this.renderLayout();

    if (this.currentPortal === 'public') {
      this.initScrollSpy();
      if (landingSections.includes(this.currentRoute)) {
        const targetSection = this.currentRoute;
        setTimeout(() => {
          const targetEl = document.getElementById(targetSection);
          if (targetEl) {
            if (targetSection === 'home') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              targetEl.scrollIntoView({ behavior: 'smooth' });
            }
          }
          this.updateActiveNavLink(targetSection);
        }, 60);
      }
    }

    if (this.currentPortal === 'student') {
      const studentId = Auth.getCurrentUser().id || "STU-2026-101";
      if (this.currentRoute === 'dashboard') {
        Store.syncStudentDashboard(studentId).then(() => this.renderCurrentView());
      } else if (this.currentRoute === 'timetable') {
        Store.syncStudentTimetable(studentId).then(() => this.renderCurrentView());
      } else if (this.currentRoute === 'events') {
        Store.syncStudentEvents(studentId).then(() => this.renderCurrentView());
      } else if (this.currentRoute === 'notifications') {
        Store.syncStudentNotifications(studentId).then(() => this.renderCurrentView());
      } else if (this.currentRoute === 'profile') {
        Store.syncStudentProfile(studentId).then(() => this.renderCurrentView());
      } else if (this.currentRoute === 'college-info') {
        Store.syncStudentCollegeInfo(studentId).then(() => this.renderCurrentView());
      }
    }

    if (this.currentPortal === 'staff') {
      const staffId = Auth.getCurrentUser().id || "STF-201";
      if (this.currentRoute === 'dashboard') {
        Store.syncStaffDashboard(staffId).then(() => this.renderCurrentView());
      } else if (this.currentRoute === 'events') {
        Store.syncStaffEvents(staffId).then(() => this.renderCurrentView());
      } else if (this.currentRoute === 'notifications') {
        Store.syncStaffNotifications(staffId).then(() => this.renderCurrentView());
      } else if (this.currentRoute === 'my-tasks' || this.currentRoute === 'tasks') {
        Store.syncStaffTasks(staffId).then(() => this.renderCurrentView());
      } else if (this.currentRoute === 'profile') {
        Store.syncStaffProfile(staffId).then(() => this.renderCurrentView());
      } else if (this.currentRoute === 'college-management' || this.currentRoute === 'classes') {
        Store.syncStaffCollegeInfo(staffId).then(() => this.renderCurrentView());
        Store.syncStaffClasses(staffId).then(() => this.renderCurrentView());
      }
    }

    if (this.currentPortal === 'admin') {
      if (this.currentRoute === 'dashboard') {
        Store.syncAdminDashboard().then(() => this.renderCurrentView());
      } else if (this.currentRoute === 'students-management') {
        Store.syncAdminStudents().then(() => this.renderCurrentView());
      } else if (this.currentRoute === 'staff-management') {
        Store.syncAdminStaff().then(() => this.renderCurrentView());
      } else if (this.currentRoute === 'departments') {
        Promise.all([Store.syncAdminDepartments(), Store.syncAdminCourses()]).then(() => this.renderCurrentView());
      } else if (this.currentRoute === 'announcements') {
        Store.syncAdminAnnouncements().then(() => this.renderCurrentView());
      } else if (this.currentRoute === 'events-management') {
        Store.syncAdminEvents().then(() => this.renderCurrentView());
      } else if (this.currentRoute === 'attendance-reports') {
        Promise.all([Store.syncAdminAttendance(), Store.syncAdminReports()]).then(() => this.renderCurrentView());
      }
    }

    if (this.currentRoute === 'community' || this.currentRoute === 'community-moderation') {
      Store.syncCommunityFromBackend().then(() => this.renderCurrentView());
    }
    Store.syncNotificationsFromBackend().then(() => this.renderLayout());
  },

  renderLayout: function() {
    const root = document.getElementById('app-root');
    if (!root) return;

    root.innerHTML = `
      ${SidebarComponent.render(this.currentPortal, this.currentRoute)}
      <div class="main-wrapper">
        ${NavbarComponent.render(this.currentPortal, this.currentRoute)}
        
        ${(() => {
          const notifications = Store.getNotifications(this.currentPortal);
          const unreadCount = Store.getUnreadNotificationCount(this.currentPortal);

          return `
            <!-- Notification Popover -->
            <div class="notification-popover" id="notification-popover">
              <div class="notification-header" style="display: flex; justify-content: space-between; align-items: center; padding: 0.85rem 1rem; border-bottom: 1px solid var(--border-color);">
                <div>
                  <strong style="font-size: 0.95rem;">Notifications</strong>
                  ${unreadCount > 0 ? `<span class="badge badge-danger" style="margin-left: 0.4rem; font-size: 0.7rem;">${unreadCount} unread</span>` : ''}
                </div>
                <button class="btn btn-ghost btn-sm" id="mark-all-read-btn" style="font-size: 0.75rem;">Mark All Read</button>
              </div>
              <div class="notification-list" style="max-height: 360px; overflow-y: auto;">
                ${notifications.length === 0 ? `
                  <div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                    No notifications currently available.
                  </div>
                ` : notifications.map(n => `
                  <div class="notification-item ${n.read ? '' : 'unread'}" data-notif-id="${n.id || n._id}" style="cursor: pointer; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); display: flex; gap: 0.6rem; align-items: flex-start; background: ${n.read ? 'transparent' : 'rgba(124, 58, 237, 0.08)'}; transition: background 0.2s;">
                    <div class="notification-dot" style="width: 8px; height: 8px; border-radius: 50%; background: ${n.read ? 'transparent' : '#ef4444'}; margin-top: 5px; flex-shrink: 0;"></div>
                    <div style="flex-grow: 1;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.15rem;">
                        <strong style="font-size: 0.85rem; display: block; color: var(--text-main);">${n.title}</strong>
                        <span class="badge badge-${n.type === 'System' ? 'admin' : n.type === 'Community' ? 'primary' : 'staff'}" style="font-size: 0.65rem; padding: 1px 5px;">${n.type || 'Notice'}</span>
                      </div>
                      <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0; line-height: 1.35;">${n.desc}</p>
                      <span style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-top: 0.25rem;">${n.time || 'Recently'}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        })()}

        <main class="main-content" id="main-content">
          <!-- View dynamically rendered here -->
        </main>
      </div>

      <!-- Modals Container -->
      ${ModalsComponent.renderAddStudentModal()}
      ${ModalsComponent.renderEditStudentModal ? ModalsComponent.renderEditStudentModal() : ''}
      ${ModalsComponent.renderAddStaffModal()}
      ${ModalsComponent.renderEditStaffModal()}
      ${ModalsComponent.renderAddDepartmentModal ? ModalsComponent.renderAddDepartmentModal() : ''}
      ${ModalsComponent.renderNewAnnouncementModal()}
      ${ModalsComponent.renderEditAnnouncementModal()}
      ${ModalsComponent.renderScheduleFacultyEventModal()}
      ${ModalsComponent.renderReserveVenueModal()}
      ${ModalsComponent.renderEditVenueModal()}
      ${ModalsComponent.renderEventDetailsModal()}
      ${ModalsComponent.renderCreateAnonymousPostModal()}
      ${ModalsComponent.renderCustomizeAnonymousProfileModal()}
      ${ModalsComponent.renderReportPostModal ? ModalsComponent.renderReportPostModal() : ''}
      ${ModalsComponent.renderAnonymityShieldModal ? ModalsComponent.renderAnonymityShieldModal() : ''}
      ${ModalsComponent.renderEmergencySupportModal ? ModalsComponent.renderEmergencySupportModal() : ''}
      <div id="toast-container" style="position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999; display: flex; flex-direction: column; gap: 0.5rem; pointer-events: none;"></div>
    `;

    this.renderCurrentView();
  },

  showToast: function(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999; display: flex; flex-direction: column; gap: 0.5rem; pointer-events: none;';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bg = type === 'success' ? 'var(--accent-emerald, #10b981)' : type === 'error' ? 'var(--status-error, #ef4444)' : 'var(--accent-violet, #7c3aed)';
    toast.style.cssText = `background: ${bg}; color: #ffffff; padding: 0.65rem 1.15rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: all 0.3s ease; pointer-events: auto; transform: translateY(10px); opacity: 0;`;
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    }, 10);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  },

  renderCurrentView: function() {
    const container = document.getElementById('main-content');
    if (!container) return;

    let content = '';

    if (this.currentPortal === 'public') {
      switch (this.currentRoute) {
        case 'about': content = PublicViews.renderAbout(); break;
        case 'features': content = PublicViews.renderFeatures(); break;
        case 'contact': content = PublicViews.renderContact(); break;
        case 'login': content = PublicViews.renderLogin(); break;
        case 'role-selection': content = PublicViews.renderRoleSelection(); break;
        case 'home':
        default: content = PublicViews.renderHome(); break;
      }
    } else if (this.currentPortal === 'student') {
      switch (this.currentRoute) {
        case 'ai-assistant': content = StudentViews.renderAIAssistant(); break;
        case 'community': content = StudentViews.renderCommunity(); break;
        case 'notifications': content = StudentViews.renderNotifications(); break;
        case 'timetable': content = StudentViews.renderTimetable(); break;
        case 'events': content = StudentViews.renderEvents(); break;
        case 'profile': content = StudentViews.renderProfile(); break;
        case 'college-info': content = StudentViews.renderCollegeInfo(); break;
        case 'dashboard':
        default: content = StudentViews.renderDashboard(); break;
      }
    } else if (this.currentPortal === 'staff') {
      switch (this.currentRoute) {
        case 'ai-assistant': content = StaffViews.renderAIAssistant(); break;
        case 'community': content = StaffViews.renderCommunity(); break;
        case 'notifications': content = StaffViews.renderNotifications(); break;
        case 'events': content = StaffViews.renderEvents(); break;
        case 'my-tasks': content = StaffViews.renderMyTasks(); break;
        case 'profile': content = StaffViews.renderProfile(); break;
        case 'college-management': content = StaffViews.renderCollegeManagement(); break;
        case 'dashboard':
        default: content = StaffViews.renderDashboard(); break;
      }
    } else if (this.currentPortal === 'admin') {
      switch (this.currentRoute) {
        case 'community': content = AdminViews.renderCommunity(); break;
        case 'community-moderation': content = AdminViews.renderCommunityModeration(); break;
        case 'students-management': content = AdminViews.renderStudentsManagement(); break;
        case 'staff-management': content = AdminViews.renderStaffManagement(); break;
        case 'departments': content = AdminViews.renderDepartments(); break;
        case 'announcements': content = AdminViews.renderAnnouncements(); break;
        case 'events-management': content = AdminViews.renderEventsManagement(); break;
        case 'attendance-reports': content = AdminViews.renderAttendanceReports(); break;
        case 'admin-profile': content = AdminViews.renderAdminProfile(); break;
        case 'dashboard':
        default: content = AdminViews.renderDashboard(); break;
      }
    }

    container.innerHTML = content;

    // Initialize or destroy landing canvas engine based on active page
    const landingSections = ['home', 'about', 'features', 'contact'];
    if (this.currentPortal === 'public' && (landingSections.includes(this.currentRoute) || !this.currentRoute)) {
      setTimeout(() => {
        if (typeof LandingCanvasEngine !== 'undefined') {
          LandingCanvasEngine.init();
        }
      }, 30);
    } else {
      if (typeof LandingCanvasEngine !== 'undefined') {
        LandingCanvasEngine.destroy();
      }
    }

    // Refresh icons
    if (window.lucide) {
      lucide.createIcons();
    }

    // Render charts if on dashboard or reports
    if (this.currentPortal === 'admin') {
      if (this.currentRoute === 'dashboard') {
        ChartsComponent.renderAttendanceChart('admin-attendance-chart');
        ChartsComponent.renderDepartmentBarChart('admin-dept-chart');
      } else if (this.currentRoute === 'attendance-reports') {
        ChartsComponent.renderAttendanceChart('report-attendance-chart');
      }
    }
  }
};

// Initialize App when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
