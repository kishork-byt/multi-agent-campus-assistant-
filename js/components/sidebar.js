/* ==========================================================================
   COLLEGE AI ASSISTANT - SIDEBAR COMPONENT
   ========================================================================== */

const SidebarComponent = {
  getNavItems: function(portal) {
    if (portal === 'student') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
        { id: 'ai-assistant', label: 'Astra (Student AI)', icon: 'sparkles' },
        { id: 'service-requests', label: 'Service Requests', icon: 'life-buoy' },
        { id: 'campus-map', label: 'Campus Map', icon: 'map' },
        { id: 'community', label: 'Campus Community', icon: 'message-square' },
        { id: 'notifications', label: 'Notifications', icon: 'bell' },
        { id: 'timetable', label: 'Timetable', icon: 'calendar' },
        { id: 'events', label: 'Events', icon: 'party-popper' },
        { id: 'profile', label: 'Profile', icon: 'user' },
        { id: 'college-info', label: 'College Information', icon: 'building-2' }
      ];
    } else if (portal === 'staff') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
        { id: 'ai-assistant', label: 'Orion (Faculty AI)', icon: 'sparkles' },
        { id: 'service-requests', label: 'Service Requests', icon: 'life-buoy' },
        { id: 'campus-map', label: 'Campus Map', icon: 'map' },
        { id: 'community', label: 'Campus Community', icon: 'message-square' },
        { id: 'notifications', label: 'Notifications', icon: 'bell' },
        { id: 'events', label: 'Events', icon: 'calendar-days' },
        { id: 'my-tasks', label: 'My Tasks', icon: 'check-square' },
        { id: 'profile', label: 'Profile', icon: 'user-cog' },
        { id: 'college-management', label: 'College Management', icon: 'book-open' }
      ];
    } else if (portal === 'admin') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
        { id: 'ai-copilot', label: 'Atlas (Admin AI)', icon: 'sparkles' },
        { id: 'service-requests', label: 'Service Requests', icon: 'life-buoy' },
        { id: 'knowledge-base', label: 'Knowledge Base', icon: 'database' },
        { id: 'ai-logs', label: 'AI Multi-Agent Logs', icon: 'cpu' },
        { id: 'campus-map', label: 'Campus Map', icon: 'map' },
        { id: 'community', label: 'Campus Community', icon: 'message-square' },
        { id: 'community-moderation', label: 'Community Moderation', icon: 'shield-alert' },
        { id: 'students-management', label: 'Students Mgmt', icon: 'users' },
        { id: 'staff-management', label: 'Staff Management', icon: 'user-check' },
        { id: 'departments', label: 'Departments', icon: 'building' },
        { id: 'announcements', label: 'Announcements', icon: 'megaphone' },
        { id: 'events-management', label: 'Events Mgmt', icon: 'calendar-plus' },
        { id: 'attendance-reports', label: 'Attendance & Reports', icon: 'bar-chart-3' },
        { id: 'admin-profile', label: 'Admin Profile', icon: 'shield' }
      ];
    }
    return [];
  },

  render: function(currentPortal, currentRoute) {
    if (currentPortal === 'public') return '';

    const navItems = this.getNavItems(currentPortal);

    return `
      <aside class="app-sidebar" id="app-sidebar">
        <div class="sidebar-header">
          <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 700; font-family: 'Outfit';">
            <div class="brand-icon" style="width: 32px; height: 32px;">
              <i data-lucide="bot" style="width: 18px; height: 18px;"></i>
            </div>
            <span>${currentPortal.toUpperCase()} PORTAL</span>
          </div>
          <button class="btn-icon mobile-only" id="close-mobile-sidebar">
            <i data-lucide="x"></i>
          </button>
        </div>

        <div class="sidebar-nav">
          <div class="sidebar-section-label">Portal Menu</div>
          ${navItems.map(item => `
            <a href="#/${currentPortal}/${item.id}" class="sidebar-nav-item ${currentRoute === item.id ? 'active' : ''}">
              <i data-lucide="${item.icon}"></i>
              <span>${item.label}</span>
            </a>
          `).join('')}
        </div>

        <div class="sidebar-footer">
          <a href="#/role-selection" class="btn btn-outline btn-sm" style="width: 100%; justify-content: flex-start;">
            <i data-lucide="arrow-left-right"></i>
            <span>Switch Portal Role</span>
          </a>
        </div>
      </aside>
    `;
  }
};
