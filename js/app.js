/* ==========================================================================
   COLLEGE AI ASSISTANT - MAIN APPLICATION ROUTER & CONTROLLER
   ========================================================================== */

const App = {
  currentPortal: 'public', // 'public' | 'student' | 'staff' | 'admin'
  currentRoute: 'home',

  init: function() {
    const isCollapsed = localStorage.getItem('SIDEBAR_COLLAPSED') === 'true';
    if (isCollapsed) document.body.classList.add('sidebar-collapsed');
    this.bindEvents();
    this.handleRouting();
    window.addEventListener('hashchange', () => this.handleRouting());
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
        const sidebar = document.getElementById('app-sidebar');
        if (sidebar) sidebar.classList.remove('mobile-open');
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

  toggleTheme: function() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    document.body.setAttribute('data-theme', newTheme);
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

  navigateTo: function(hash) {
    window.location.hash = hash.startsWith('/') ? hash : '/' + hash;
  },

  handleRouting: function() {
    let hash = window.location.hash.replace('#/', '').trim();
    if (!hash) hash = 'home';

    const parts = hash.split('/');
    if (parts.length === 1) {
      this.currentPortal = 'public';
      this.currentRoute = parts[0];
    } else {
      this.currentPortal = parts[0];
      this.currentRoute = parts[1];
    }

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

    this.renderLayout();
  },

  renderLayout: function() {
    const root = document.getElementById('app-root');
    if (!root) return;

    root.innerHTML = `
      ${SidebarComponent.render(this.currentPortal, this.currentRoute)}
      <div class="main-wrapper">
        ${NavbarComponent.render(this.currentPortal, this.currentRoute)}
        
        <!-- Notification Popover -->
        <div class="notification-popover" id="notification-popover">
          <div class="notification-header">
            <strong style="font-size: 0.95rem;">Notifications</strong>
            <button class="btn btn-ghost btn-sm" onclick="alert('Cleared all notifications')">Clear</button>
          </div>
          <div class="notification-list">
            <div class="notification-item unread">
              <div class="notification-dot"></div>
              <div>
                <strong style="font-size: 0.85rem; display: block;">CS-401 Lab Score Released</strong>
                <span style="font-size: 0.78rem; color: var(--text-muted);">You scored 98/100 • 10 mins ago</span>
              </div>
            </div>
            <div class="notification-item">
              <div class="notification-dot" style="background: transparent;"></div>
              <div>
                <strong style="font-size: 0.85rem; display: block;">Campus AI Hackathon 2026</strong>
                <span style="font-size: 0.78rem; color: var(--text-muted);">Registration closes Sept 10 • 2 hours ago</span>
              </div>
            </div>
          </div>
        </div>

        <main class="main-content" id="main-content">
          <!-- View dynamically rendered here -->
        </main>
      </div>

      <!-- Modals Container -->
      ${ModalsComponent.renderAddStudentModal()}
      ${ModalsComponent.renderAddStaffModal()}
      ${ModalsComponent.renderNewAnnouncementModal()}
      ${ModalsComponent.renderScheduleFacultyEventModal()}
      ${ModalsComponent.renderReserveVenueModal()}
      ${ModalsComponent.renderEventDetailsModal()}
      ${ModalsComponent.renderCreateAnonymousPostModal()}
    `;

    this.renderCurrentView();
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
