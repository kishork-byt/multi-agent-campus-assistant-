/* ==========================================================================
   COLLEGE AI ASSISTANT - NAVBAR COMPONENT
   ========================================================================== */

const NavbarComponent = {
  render: function(currentPortal, currentRoute) {
    const user = Auth.getCurrentUser();
    const isPublic = currentPortal === 'public';

    return `
      <header class="app-navbar">
        <div class="navbar-brand" style="${isPublic ? 'cursor: pointer;' : ''}" ${isPublic ? 'onclick="App.scrollToSection(\'home\')"' : ''}>
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
            <li><a href="#home" onclick="App.scrollToSection('home'); return false;" class="nav-link nav-item-home ${currentRoute === 'home' || !currentRoute ? 'active' : ''}">Home</a></li>
            <li><a href="#about" onclick="App.scrollToSection('about'); return false;" class="nav-link nav-item-about ${currentRoute === 'about' ? 'active' : ''}">About</a></li>
            <li><a href="#features" onclick="App.scrollToSection('features'); return false;" class="nav-link nav-item-features ${currentRoute === 'features' ? 'active' : ''}">Features</a></li>
            <li><a href="#contact" onclick="App.scrollToSection('contact'); return false;" class="nav-link nav-item-contact ${currentRoute === 'contact' ? 'active' : ''}">Contact</a></li>
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
                ${(() => {
                  const unreadCount = Store.getUnreadNotificationCount(currentPortal);
                  if (unreadCount > 0) {
                    return `<span class="notification-badge" style="position: absolute; top: 2px; right: 2px; background: #ef4444; color: #ffffff; border-radius: 50%; font-size: 0.65rem; font-weight: 800; min-width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; padding: 0 3px;">${unreadCount}</span>`;
                  }
                  return '';
                })()}
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
