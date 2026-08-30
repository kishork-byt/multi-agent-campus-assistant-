/* ==========================================================================
   COLLEGE AI ASSISTANT - NAVBAR COMPONENT
   ========================================================================== */

const NavbarComponent = {
  render: function(currentPortal, currentRoute) {
    const user = Auth.getCurrentUser();
    const isPublic = currentPortal === 'public';

    return `
      <header class="app-navbar">
        <div class="navbar-brand">
          ${!isPublic ? `
            <button class="btn-icon mobile-menu-btn" id="toggle-mobile-sidebar" title="Toggle Navigation">
              <i data-lucide="menu"></i>
            </button>
          ` : ''}
          <div class="brand-icon">
            <i data-lucide="bot"></i>
          </div>
          <span style="letter-spacing: -0.02em;">College <span class="portal-gradient-text">AI Assistant</span></span>
        </div>

        ${isPublic ? `
          <ul class="navbar-nav desktop-nav">
            <li><a href="#/home" class="nav-link ${currentRoute === 'home' ? 'active' : ''}">Home</a></li>
            <li><a href="#/about" class="nav-link ${currentRoute === 'about' ? 'active' : ''}">About</a></li>
            <li><a href="#/features" class="nav-link ${currentRoute === 'features' ? 'active' : ''}">Features</a></li>
            <li><a href="#/contact" class="nav-link ${currentRoute === 'contact' ? 'active' : ''}">Contact</a></li>
          </ul>
        ` : `
          <div class="portal-indicator-badge">
            <span class="badge badge-${currentPortal}">
              <i data-lucide="${currentPortal === 'student' ? 'graduation-cap' : currentPortal === 'staff' ? 'briefcase' : 'shield-check'}"></i>
              ${currentPortal.toUpperCase()} PORTAL
            </span>
          </div>
        `}

        <div class="navbar-actions">
          <button class="btn-icon" id="theme-toggle-btn" title="Toggle Light/Dark Theme">
            <i data-lucide="sun"></i>
          </button>

          ${isPublic ? `
            <a href="#/login" class="btn btn-outline btn-sm">Login</a>
            <a href="#/role-selection" class="btn btn-primary btn-sm">Launch Portal</a>
          ` : `
            <div style="position: relative;">
              <button class="btn-icon" id="notification-bell-btn" title="Notifications">
                <i data-lucide="bell"></i>
                <span style="position: absolute; top: 6px; right: 6px; width: 8px; height: 8px; background: #ef4444; border-radius: 50%;"></span>
              </button>
            </div>

            <div class="user-profile-badge" style="cursor: pointer;" onclick="App.navigateTo('role-selection')" title="Switch Portal Role">
              <div class="user-avatar">${user.avatar}</div>
              <div class="user-details desktop-only">
                <span class="user-name">${user.name}</span>
                <span class="user-role">${user.role.toUpperCase()} (Switch)</span>
              </div>
            </div>
          `}
        </div>
      </header>
    `;
  }
};
