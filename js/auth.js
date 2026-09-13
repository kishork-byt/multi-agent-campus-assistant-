/* ==========================================================================
   COLLEGE AI ASSISTANT - AUTHENTICATION & SESSION MANAGER
   ========================================================================== */

const Auth = {
  SESSION_KEY: 'COLLEGE_AI_SESSION_V1',

  currentSession: null,

  init: function() {
    const raw = sessionStorage.getItem(this.SESSION_KEY);
    if (raw) {
      try {
        this.currentSession = JSON.parse(raw);
      } catch (e) {
        this.setDefaultSession('student');
      }
    } else {
      this.setDefaultSession('student');
    }
  },

  setDefaultSession: function(role) {
    let user = {
      name: "Alex Rivera",
      role: role,
      id: "STU-2026-101",
      department: "AI & Machine Learning",
      avatar: "AR",
      email: "alex.rivera@university.edu"
    };

    if (role === 'staff') {
      user = {
        name: "Dr. Evelyn Vance",
        role: "staff",
        id: "STF-201",
        department: "Computer Science & Engineering",
        avatar: "EV",
        email: "evelyn.vance@university.edu"
      };
    } else if (role === 'admin') {
      user = {
        name: "System Admin",
        role: "admin",
        id: "ADM-001",
        department: "IT Directorate",
        avatar: "SA",
        email: "admin@university.edu"
      };
    }

    this.currentSession = {
      user: user,
      token: "session_token_" + Date.now(),
      loginTime: new Date().toISOString()
    };

    MockData.currentUser = user;
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentSession));
    this.syncServerSession();
  },

  syncServerSession: async function() {
    try {
      if (!this.currentSession || !this.currentSession.user) return;
      const user = this.currentSession.user;
      const res = await fetch('/api/agent/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: user.role, userId: user.id })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.token) {
          this.currentSession.token = data.token;
          sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentSession));
        }
      }
    } catch (e) {
      // Graceful offline fallback
    }
  },

  getToken: function() {
    if (!this.currentSession) this.init();
    return this.currentSession ? this.currentSession.token : null;
  },

  login: function(role, id, password) {
    if (!id || !password) {
      alert('Please enter your Institutional ID and Password.');
      return false;
    }

    this.setDefaultSession(role);
    Store.addAuditLog(`User logged in as ${role.toUpperCase()}`);
    return true;
  },

  switchRole: function(role) {
    this.setDefaultSession(role);
    Store.addAuditLog(`User switched active portal role to ${role.toUpperCase()}`);
  },

  getCurrentUser: function() {
    if (!this.currentSession) this.init();
    return this.currentSession.user;
  },

  isAuthenticated: function() {
    return !!this.currentSession;
  },

  logout: function() {
    sessionStorage.removeItem(this.SESSION_KEY);
    this.currentSession = null;
    App.navigateTo('home');
  }
};

// Initialize Auth
Auth.init();
Auth.syncServerSession();
