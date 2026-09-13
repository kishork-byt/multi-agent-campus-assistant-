/* ==========================================================================
   COLLEGE AI ASSISTANT - LOCAL DATA STORE ENGINE
   ========================================================================== */

const Store = {
  STORAGE_KEY: 'COLLEGE_AI_DATA_V1',
  data: null,
  backendStatus: { connected: true, lastError: null },

  get API_BASE() {
    if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin.startsWith('http')) {
      return `${window.location.origin}/api`;
    }
    return 'http://localhost:5000/api';
  },

  fetchWithTimeout: async function(url, options = {}, timeoutMs = 8000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`Connection timed out after ${Math.round(timeoutMs / 1000)}s. Please check if the backend server is running.`);
      }
      throw err;
    }
  },

  escapeHtml: function(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  init: function() {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (raw) {
      try {
        this.data = JSON.parse(raw);
        if (!this.data.communityPosts) {
          this.data.communityPosts = JSON.parse(JSON.stringify(MockData.communityPosts || []));
          this.save();
        }
      } catch (e) {
        console.error('Failed to parse stored data, resetting to defaults', e);
        this.resetToDefaults();
      }
    } else {
      this.resetToDefaults();
    }
  },

  resetToDefaults: function() {
    // Deep clone MockData as initial state
    this.data = JSON.parse(JSON.stringify(MockData));
    this.save();
  },

  save: function() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  },

  // Getters
  getStudentStats: function() { return this.data.student.stats; },
  getStudentTodaySchedule: function() { return this.data.student.todaySchedule; },
  getStudentEvents: function() { return this.data.student.upcomingEvents; },
  getStudentTimetable: function() { return this.data.student.timetable || []; },
  getStudentCourses: function() { return this.data.student.courses || []; },
  getLibraryResources: function() { return this.data.student.libraryResources || []; },
  getStudentNotifications: function() { return this.getNotifications('student'); },
  getStaffNotifications: function() { return this.getNotifications('staff'); },
  getStaffTasks: function() { return this.data.staff.tasks || []; },
  getStaffClasses: function() { return this.data.staff.classes || []; },
  getAIChatHistory: function(role) {
    if (!this.data.aiChatHistory) {
      this.data.aiChatHistory = { student: [], staff: [], admin: [] };
    }
    return this.data.aiChatHistory[role] || [];
  },

  addAIChatMessage: function(role, sender, text) {
    if (!this.data.aiChatHistory) {
      this.data.aiChatHistory = { student: [], staff: [], admin: [] };
    }
    if (!this.data.aiChatHistory[role]) {
      this.data.aiChatHistory[role] = [];
    }
    this.data.aiChatHistory[role].push({ sender, text, timestamp: new Date().toISOString() });
    this.save();
  },

  clearAIChatHistory: function(role) {
    if (!this.data.aiChatHistory) {
      this.data.aiChatHistory = { student: [], staff: [], admin: [] };
    }
    this.data.aiChatHistory[role] = [];
    this.save();
  },

  sendAIChatMessage: async function(role, message) {
    try {
      const history = this.getAIChatHistory(role);
      const currentUser = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : { id: 'STU-2026-894', role };
      const conversationId = `conv_${role}_${currentUser.id}`;

      // 1. Primary Autonomous Agent Endpoint: POST /api/agent/chat
      const token = (typeof Auth !== 'undefined' && Auth.getToken) ? Auth.getToken() : null;
      const headers = {
        'Content-Type': 'application/json',
        'X-User-Id': currentUser.id,
        'X-User-Role': currentUser.role || role
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['X-Session-Token'] = token;
      }

      let res = await fetch(`${this.API_BASE}/agent/chat`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          message,
          conversationId,
          role: currentUser.role || role,
          history
        })
      }).catch(() => null);

      if (res && res.ok) {
        const result = await res.json();
        return {
          success: true,
          answer: result.message || result.answer || '',
          reply: result.message || result.answer || '',
          agent: result.agent || 'CampusNova',
          agentRole: 'Autonomous Campus Agent',
          status: result.status || 'COMPLETED',
          executionId: result.executionId,
          toolsUsed: result.toolsUsed || [],
          approvalRequired: !!result.approvalRequired,
          approvalId: result.approvalId,
          actionDetails: result.actionDetails,
          cards: result.cards || [],
          confidence: 0.98,
          requiresHumanSupport: false,
          conversationId: result.conversationId || conversationId
        };
      }

      // 2. Legacy Fallback to /api/chat
      res = await fetch(`${this.API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          message,
          userId: currentUser.id,
          conversationId,
          history
        })
      }).catch(() => null);

      if (res && res.ok) {
        const result = await res.json();
        const data = result.data || result;
        const reply = data.answer || data.reply || result.answer || '';
        return {
          success: true,
          reply,
          answer: reply,
          agent: data.agent || 'CampusNova',
          agentRole: 'Campus Agent',
          sources: data.sources || [],
          confidence: data.confidence !== undefined ? data.confidence : 0.92,
          requiresHumanSupport: !!(data.requiresHumanSupport || result.requiresHumanSupport),
          conversationId: data.conversationId || conversationId
        };
      }

      return { success: false, error: 'Received invalid response format from AI Assistant service.' };
    } catch (e) {
      console.warn('AI Chat API endpoint connection error:', e.message);
      return { success: false, error: 'Unable to connect to AI Assistant backend service. Please verify server is running.' };
    }
  },

  approveAgentAction: async function(approvalId) {
    try {
      const currentUser = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : { id: 'STU-2026-894', role: 'student' };
      const token = (typeof Auth !== 'undefined' && Auth.getToken) ? Auth.getToken() : null;
      const headers = {
        'Content-Type': 'application/json',
        'X-User-Id': currentUser.id,
        'X-User-Role': currentUser.role || 'student'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['X-Session-Token'] = token;
      }

      const res = await fetch(`${this.API_BASE}/agent/approve`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ approvalId })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  rejectAgentAction: async function(approvalId) {
    try {
      const currentUser = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : { id: 'STU-2026-894', role: 'student' };
      const token = (typeof Auth !== 'undefined' && Auth.getToken) ? Auth.getToken() : null;
      const headers = {
        'Content-Type': 'application/json',
        'X-User-Id': currentUser.id,
        'X-User-Role': currentUser.role || 'student'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['X-Session-Token'] = token;
      }

      const res = await fetch(`${this.API_BASE}/agent/reject`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ approvalId })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  fetchAutopilotInsights: async function(role, userId) {
    try {
      const currentUser = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : { id: userId || 'STU-2026-894', role: role || 'student' };
      const res = await fetch(`${this.API_BASE}/agent/autopilot`, {
        headers: {
          'X-User-Id': currentUser.id,
          'X-User-Role': currentUser.role || 'student'
        }
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (e) {
      console.warn('Autopilot fetch error:', e.message);
    }
    return [];
  },

  fetchAgentExecutions: async function(limit = 30) {
    try {
      const res = await fetch(`${this.API_BASE}/agent/executions?limit=${limit}`);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (e) {
      console.warn('Agent executions fetch error:', e.message);
    }
    return [];
  },

  getAgentLogs: async function(limit = 30) {
    return await this.fetchAgentExecutions(limit);
  },

  // Service Requests Store API
  getServiceRequests: async function(role, userId) {
    try {
      const params = new URLSearchParams();
      if (role) params.append('role', role);
      if (userId) params.append('userId', userId);
      const res = await fetch(`${this.API_BASE}/service-requests?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        return result.data || [];
      }
    } catch (e) {
      console.warn('Error fetching service requests:', e.message);
    }
    return [];
  },

  createServiceRequest: async function(ticketData) {
    try {
      const res = await fetch(`${this.API_BASE}/service-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData)
      });
      if (res.ok) {
        const result = await res.json();
        return { success: true, data: result.data };
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || 'Failed to create request.' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  updateServiceRequest: async function(ticketId, updates) {
    try {
      const res = await fetch(`${this.API_BASE}/service-requests/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const result = await res.json();
        return { success: true, data: result.data };
      }
      return { success: false, error: 'Update failed.' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // Knowledge Base Store API
  getKnowledgeBaseDocs: async function() {
    try {
      const res = await fetch(`${this.API_BASE}/knowledge-base/documents`);
      if (res.ok) {
        const result = await res.json();
        return result.data || [];
      }
    } catch (e) {
      console.warn('Error fetching knowledge base documents:', e.message);
    }
    return [];
  },

  uploadKnowledgeBaseDoc: async function(docData) {
    try {
      const res = await fetch(`${this.API_BASE}/knowledge-base/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docData)
      });
      if (res.ok) {
        const result = await res.json();
        return { success: true, data: result.data, message: result.message };
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || 'Failed to upload document.' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  deleteKnowledgeBaseDoc: async function(docId) {
    try {
      const res = await fetch(`${this.API_BASE}/knowledge-base/documents/${docId}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  getKnowledgeBaseChunks: async function(docId) {
    try {
      const res = await fetch(`${this.API_BASE}/knowledge-base/documents/${docId}/chunks`);
      if (res.ok) {
        const result = await res.json();
        return result.data || [];
      }
    } catch (e) {
      return [];
    }
  },

  getKnowledgeBaseStats: async function() {
    try {
      const res = await fetch(`${this.API_BASE}/knowledge-base/stats`);
      if (res.ok) {
        const result = await res.json();
        return result.data || null;
      }
    } catch (e) {
      return null;
    }
  },

  // Multi-Agent Execution Audit Logs API
  getAgentLogs: async function(limit = 40) {
    try {
      const res = await fetch(`${this.API_BASE}/agent-logs?limit=${limit}`);
      if (res.ok) {
        const result = await res.json();
        return result.data || [];
      }
    } catch (e) {
      console.warn('Error fetching agent logs:', e.message);
    }
    return [];
  },

  // Campus Locations API
  getCampusLocations: async function(query, category) {
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (category) params.append('category', category);
      const res = await fetch(`${this.API_BASE}/campus/locations?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        return result.data || [];
      }
    } catch (e) {
      console.warn('Error fetching campus locations:', e.message);
    }
    return [];
  },

  // Campus Navigation & Dijkstra Routing API
  getCampusDirections: async function(from, to, accessible = false) {
    try {
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      if (accessible) params.append('accessible', 'true');
      const res = await fetch(`${this.API_BASE}/campus/directions?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        return result.data || null;
      }
    } catch (e) {
      console.warn('Error fetching campus directions:', e.message);
    }
    return null;
  },

  getNotifications: function(role) {
    if (!this.data.notifications) {
      this.data.notifications = [];
    }
    if (!role) return this.data.notifications;
    const normRole = role === 'staff' ? 'staff' : role === 'admin' ? 'admin' : 'student';
    return this.data.notifications.filter(n => n.role === normRole || n.role === 'all');
  },

  getUnreadNotificationCount: function(role) {
    const list = this.getNotifications(role);
    return list.filter(n => !n.read).length;
  },
  getStaffEvents: function() { return this.data.staff.events; },
  getStaffProfile: function() {
    if (!this.data.staff.profile) {
      this.data.staff.profile = {
        title: "Associate Professor in AI & Computer Vision",
        officeHours: "Tech Building Room 304 • Mon/Wed 2-4 PM",
        email: "evelyn.vance@university.edu"
      };
    }
    return this.data.staff.profile;
  },

  getAdminStats: function() { return this.data.admin.stats; },
  getStudentsList: function() { return this.data.admin.studentsList; },
  getStaffList: function() { return this.data.admin.staffList; },
  getDepartmentsList: function() { return this.data.admin.departmentsList; },
  getAnnouncements: function() { return this.data.admin.announcements; },
  getEventsApprovals: function() { return this.data.admin.eventsApprovals; },
  getAuditLogs: function() { return this.data.admin.auditLogs; },

  // Anonymous Campus Community Store Actions & AI Moderation Engine
  getCommunityPosts: function() {
    if (!this.data.communityPosts) {
      this.data.communityPosts = JSON.parse(JSON.stringify(MockData.communityPosts || []));
      this.save();
    }
    return this.data.communityPosts;
  },

  getFlaggedCommunityPosts: function() {
    return this.getCommunityPosts().filter(p => p.status === 'flagged' || p.flagReason);
  },

  // AI Content Pre-Screening Engine (Toxic, Duplicate, Fake/Suspicious)
  analyzePostAI: function(text, category) {
    const lowerText = text.toLowerCase().trim();

    // 1. Toxic / Abusive Content Detection
    const toxicKeywords = ['hate speech', 'kill all', 'destroy school', 'stupid prof', 'threat', 'violence', 'harass', 'abusive', 'slur', 'idiot faculty'];
    const isToxic = toxicKeywords.some(kw => lowerText.includes(kw));
    if (isToxic) {
      return {
        isToxic: true,
        reason: "Content contains language flagged as toxic or abusive by AI Moderation rules.",
        block: true
      };
    }

    // 2. Duplicate Post Detection
    const existingPosts = this.getCommunityPosts().filter(p => p.status !== 'removed');
    const words = lowerText.split(/\s+/).filter(w => w.length > 3);

    let matchedPost = null;
    for (const post of existingPosts) {
      if (post.category.toLowerCase() === category.toLowerCase() || category === 'All') {
        const postTextLower = post.text.toLowerCase();
        let matchCount = 0;
        for (const word of words) {
          if (postTextLower.includes(word)) matchCount++;
        }
        if (words.length >= 3 && matchCount >= Math.ceil(words.length * 0.5)) {
          matchedPost = post;
          break;
        }
      }
    }

    if (matchedPost) {
      return {
        isDuplicate: true,
        matchedPostId: matchedPost.id,
        matchedPostText: matchedPost.text,
        reason: `Similar issue already reported in ${matchedPost.category}`
      };
    }

    // 3. Fake / Suspicious Post Detection
    const suspiciousKeywords = ['bit.ly', 'free gift', 'claim now', 'unverified link', 'click here for free', 'win cash', 'crypto voucher'];
    const isSuspicious = suspiciousKeywords.some(kw => lowerText.includes(kw));
    if (isSuspicious) {
      return {
        isSuspicious: true,
        reason: "AI Moderation Flag: Suspicious/Phishing Link Pattern Detected",
        flag: true
      };
    }

    return { ok: true };
  },

  addCommunityPost: async function(postData) {
    const user = Auth.getCurrentUser();
    const aiCheck = this.analyzePostAI(postData.text, postData.category || 'General');

    let status = 'active';
    let flagReason = null;
    let linkedPostId = null;
    let fakeScore = 0;
    let duplicateScore = 0;
    let toxicScore = 0;

    if (postData.text.includes('[MODERATION_TEST_TOXIC]')) {
      status = 'pending';
      toxicScore = 99;
      flagReason = "AI Toxic Moderation Test Flag: Test Marker Detected ([MODERATION_TEST_TOXIC])";
    } else if (aiCheck.isToxic) {
      status = 'flagged';
      toxicScore = 85;
      flagReason = aiCheck.reason;
    }

    if (aiCheck.isSuspicious) {
      status = 'flagged';
      fakeScore = 90;
      flagReason = aiCheck.reason;
    }

    if (aiCheck.isDuplicate) {
      linkedPostId = aiCheck.matchedPostId;
      duplicateScore = 95;
      flagReason = aiCheck.reason;
    }

    const postId = "post_" + Date.now();
    const newPost = {
      id: postId,
      authorRole: user.role || 'student', // Used ONLY to render "Anonymous Student", "Anonymous Faculty", "Anonymous Admin"
      authorIdInternal: user.id, // Internal ID for session tracking - NEVER shown to users
      anonymousHandle: postData.anonymousHandle || 'OceanSoul',
      category: postData.category || 'General',
      text: postData.text.trim(),
      mediaType: postData.mediaType || 'none',
      mediaUrl: postData.mediaUrl || '',
      postType: postData.postType || 'text',
      pollData: postData.pollData || null,
      eventData: postData.eventData || null,
      timestamp: 'Just now',
      createdAt: new Date().toISOString(),
      supportCount: 0,
      supportedBy: [],
      comments: [],
      status: status,
      fakeScore: fakeScore,
      duplicateScore: duplicateScore,
      toxicScore: toxicScore,
      flagReason: flagReason,
      linkedPostId: linkedPostId
    };

    this.data.communityPosts.unshift(newPost);
    this.addAuditLog(`Created Anonymous Campus Post (${newPost.category})`);
    this.save();

    // Async Backend API Sync
    try {
      const res = await fetch(`${this.API_BASE}/community/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: newPost.id,
          authorRole: newPost.authorRole,
          anonymousHandle: newPost.anonymousHandle,
          category: newPost.category,
          text: newPost.text,
          mediaType: newPost.mediaType,
          mediaUrl: newPost.mediaUrl,
          postType: newPost.postType,
          pollData: newPost.pollData,
          eventData: newPost.eventData,
          timestamp: newPost.timestamp,
          supportCount: 0,
          supportedBy: [],
          status: newPost.status,
          fakeScore: newPost.fakeScore,
          duplicateScore: newPost.duplicateScore,
          toxicScore: newPost.toxicScore,
          flagReason: newPost.flagReason,
          linkedPostId: newPost.linkedPostId
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          newPost._id = data.data._id;
          newPost.status = data.data.status || newPost.status;
          newPost.toxicScore = data.data.toxicScore !== undefined ? data.data.toxicScore : newPost.toxicScore;
          newPost.fakeScore = data.data.fakeScore !== undefined ? data.data.fakeScore : newPost.fakeScore;
          newPost.duplicateScore = data.data.duplicateScore !== undefined ? data.data.duplicateScore : newPost.duplicateScore;
          newPost.flagReason = data.data.flagReason !== undefined ? data.data.flagReason : newPost.flagReason;
          this.save();
        }
      }
    } catch (err) {
      console.warn('Backend offline. Saved community post locally to LocalStorage.', err);
    }

    // Re-sync with backend to ensure client state matches server database
    await this.syncCommunityFromBackend();

    if (newPost.status === 'flagged' || newPost.status === 'pending') {
      this.addNotification({
        role: 'admin',
        type: 'System',
        title: 'New Moderation Alert',
        desc: `A community post (${newPost.category}) was flagged by AI Moderation for review.`,
        relatedId: newPost.id
      });
    }

    return { post: newPost, aiCheck };
  },

  supportCommunityPost: async function(postId) {
    const user = Auth.getCurrentUser();
    const post = this.getCommunityPosts().find(p => p.id === postId || p._id === postId);
    if (!post) return false;

    if (!post.supportedBy) post.supportedBy = [];

    // Prevent duplicate support from same user/session
    const userKey = user.id || user.email || 'session_user';
    let isSupported = false;

    if (post.supportedBy.includes(userKey)) {
      post.supportedBy = post.supportedBy.filter(k => k !== userKey);
      post.supportCount = Math.max(0, post.supportCount - 1);
    } else {
      post.supportedBy.push(userKey);
      post.supportCount = (post.supportCount || 0) + 1;
      isSupported = true;
    }

    this.save();

    // Async Backend API Sync
    const targetId = post._id || post.id;
    try {
      const res = await fetch(`${this.API_BASE}/community/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: targetId,
          userId: userKey,
          userRole: user.role || 'student'
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          post.supportCount = data.data.supportCount;
          post.supportedBy = data.data.supportedBy || post.supportedBy;
          this.save();
        }
      }
    } catch (err) {
      console.warn('Backend offline. Saved support issue toggle locally to LocalStorage.', err);
    }

    if (isSupported) {
      this.addNotification({
        role: post.authorRole || 'student',
        type: 'Community',
        title: 'Anonymous Post Supported',
        desc: `Your anonymous campus post received new support! Total supports: ${post.supportCount}`,
        relatedId: post.id
      });
    }

    return { supportCount: post.supportCount, isSupported: isSupported };
  },

  addCommunityComment: async function(postId, commentText) {
    const user = Auth.getCurrentUser();
    const post = this.getCommunityPosts().find(p => p.id === postId || p._id === postId);
    if (!post || !commentText.trim()) return false;

    if (!post.comments) post.comments = [];

    const commentId = "c_" + Date.now();
    const newComment = {
      id: commentId,
      authorRole: user.role || 'student', // Displayed anonymously
      text: commentText.trim(),
      timestamp: 'Just now'
    };

    post.comments.push(newComment);
    this.save();

    // Async Backend API Sync
    const targetId = post._id || post.id;
    try {
      const res = await fetch(`${this.API_BASE}/community/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId: newComment.id,
          postId: targetId,
          authorRole: newComment.authorRole,
          text: newComment.text,
          timestamp: newComment.timestamp
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          newComment._id = data.data._id;
          this.save();
        }
      }
    } catch (err) {
      console.warn('Backend offline. Saved comment locally to LocalStorage.', err);
    }

    this.addNotification({
      role: post.authorRole || 'student',
      type: 'Community',
      title: 'New Comment on Anonymous Post',
      desc: `Someone commented on your post: "${commentText.trim().substring(0, 40)}..."`,
      relatedId: post.id
    });

    return newComment;
  },

  moderateCommunityPost: async function(postId, action) {
    const posts = this.getCommunityPosts();
    const idx = posts.findIndex(p => p.id === postId || p._id === postId);
    if (idx === -1) return false;

    const post = posts[idx];
    const targetId = post._id || post.id;

    if (action === 'approve') {
      post.status = 'active';
      post.flagReason = null;

      await fetch(`${this.API_BASE}/community/posts/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active', flagReason: null })
      }).catch(() => {});
    } else if (action === 'hide' || action === 'reject') {
      post.status = 'hidden';

      await fetch(`${this.API_BASE}/community/posts/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'hidden' })
      }).catch(() => {});
    } else if (action === 'remove' || action === 'delete') {
      posts.splice(idx, 1);

      await fetch(`${this.API_BASE}/community/posts/${targetId}`, {
        method: 'DELETE'
      }).catch(() => {});
    }

    this.addNotification({
      role: 'admin',
      type: 'System',
      title: `Post Moderated: ${action.toUpperCase()}`,
      desc: `Post ${targetId} was ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected/hidden' : 'deleted'} by Admin.`,
      relatedId: targetId
    });

    this.addNotification({
      role: post.authorRole || 'student',
      type: 'System',
      title: 'Post Moderation Update',
      desc: `Your anonymous campus post was ${action === 'approve' ? 'Approved' : 'Reviewed'} by Admin.`,
      relatedId: targetId
    });

    this.addAuditLog(`Admin Moderated Anonymous Post ${postId}: ${action.toUpperCase()}`);
    this.save();
    return true;
  },

  voteCommunityPoll: async function(postId, optionIndex) {
    const user = Auth.getCurrentUser();
    const userId = user.id || 'session_user';
    const posts = this.getCommunityPosts();
    const post = posts.find(p => p.id === postId || p._id === postId);

    if (!post || !post.pollData || !post.pollData.options || !post.pollData.options[optionIndex]) {
      return false;
    }

    // Toggle vote on option
    post.pollData.options.forEach(opt => {
      if (opt.voters && opt.voters.includes(userId)) {
        opt.voters = opt.voters.filter(u => u !== userId);
        opt.votes = Math.max(0, (opt.votes || 0) - 1);
      }
    });

    const targetOpt = post.pollData.options[optionIndex];
    if (!targetOpt.voters) targetOpt.voters = [];
    targetOpt.voters.push(userId);
    targetOpt.votes = (targetOpt.votes || 0) + 1;

    this.save();

    try {
      await fetch(`${this.API_BASE}/community/poll/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id || post._id, optionIndex, userId })
      });
    } catch (err) {
      console.warn('Poll vote backend offline. Updated vote locally.', err);
    }
    await this.syncCommunityFromBackend();
    return true;
  },

  reportCommunityPostWithReason: async function(postId, reason, details) {
    const user = Auth.getCurrentUser();
    const userId = user.id || 'session_user';
    const posts = this.getCommunityPosts();
    const post = posts.find(p => p.id === postId || p._id === postId);
    if (post) {
      post.status = 'flagged';
      post.flagReason = `User Report (${reason})${details ? ': ' + details : ''}`;
      this.save();
    }

    try {
      await fetch(`${this.API_BASE}/community/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, reason, details, userId })
      });
    } catch (err) {
      console.warn('Report API offline. Flagged post locally.', err);
    }
    await this.syncCommunityFromBackend();
    return true;
  },

  // Mutators & CRUD Actions

  // 1. Staff Profile Update
  updateStaffProfile: function(profileData) {
    const p = this.getStaffProfile();
    if (profileData.title) p.title = profileData.title;
    if (profileData.officeHours) p.officeHours = profileData.officeHours;
    this.addAuditLog("Updated Faculty Profile details");
    this.save();
    return p;
  },


  studentCache: {
    dashboard: null,
    profile: null,
    timetable: null,
    attendance: null,
    courses: null,
    events: null,
    notifications: null,
    collegeInfo: null,
    loading: {}
  },

  staffCache: {
    dashboard: null,
    profile: null,
    classes: null,
    tasks: null,
    events: null,
    notifications: null,
    collegeInfo: null,
    loading: {}
  },

  adminCache: {
    dashboard: null,
    students: null,
    staff: null,
    departments: null,
    courses: null,
    attendance: null,
    events: null,
    announcements: null,
    reports: null,
    loading: {},
    error: {}
  },

  syncStudentDashboard: async function(studentId = "STU-2026-101") {
    try {
      this.studentCache.loading.dashboard = true;
      const res = await fetch(`${this.API_BASE}/student/dashboard/${studentId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          this.studentCache.dashboard = json.data;
          if (json.data.profile) {
            this.data.student.stats.cgpa = json.data.profile.cgpa || "3.84";
            this.data.student.stats.creditsEarned = (json.data.profile.creditsEarned || 90) + " / 120";
          }
          if (json.data.attendance) {
            this.data.student.stats.attendance = json.data.attendance.percentage || "95.0%";
          }
          this.save();
          return json.data;
        }
      }
    } catch (e) {
      console.warn("Student Dashboard API sync error:", e.message);
    } finally {
      this.studentCache.loading.dashboard = false;
    }
    return null;
  },

  syncStudentProfile: async function(studentId = "STU-2026-101") {
    try {
      this.studentCache.loading.profile = true;
      const res = await fetch(`${this.API_BASE}/student/profile/${studentId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          this.studentCache.profile = json.data;
          return json.data;
        }
      }
    } catch (e) {
      console.warn("Student Profile API sync error:", e.message);
    } finally {
      this.studentCache.loading.profile = false;
    }
    return null;
  },

  syncStudentTimetable: async function(studentId = "STU-2026-101") {
    try {
      this.studentCache.loading.timetable = true;
      const res = await fetch(`${this.API_BASE}/student/timetable/${studentId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          this.studentCache.timetable = json.data;
          return json.data;
        }
      }
    } catch (e) {
      console.warn("Student Timetable API sync error:", e.message);
    } finally {
      this.studentCache.loading.timetable = false;
    }
    return null;
  },

  syncStudentAttendance: async function(studentId = "STU-2026-101") {
    try {
      this.studentCache.loading.attendance = true;
      const res = await fetch(`${this.API_BASE}/student/attendance/${studentId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          this.studentCache.attendance = json;
          return json;
        }
      }
    } catch (e) {
      console.warn("Student Attendance API sync error:", e.message);
    } finally {
      this.studentCache.loading.attendance = false;
    }
    return null;
  },

  syncStudentCourses: async function(studentId = "STU-2026-101") {
    try {
      this.studentCache.loading.courses = true;
      const res = await fetch(`${this.API_BASE}/student/courses/${studentId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          this.studentCache.courses = json.data;
          return json.data;
        }
      }
    } catch (e) {
      console.warn("Student Courses API sync error:", e.message);
    } finally {
      this.studentCache.loading.courses = false;
    }
    return null;
  },

  syncStudentEvents: async function(studentId = "STU-2026-101") {
    try {
      this.studentCache.loading.events = true;
      const res = await fetch(`${this.API_BASE}/student/events/${studentId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          this.studentCache.events = json.data;
          return json.data;
        }
      }
    } catch (e) {
      console.warn("Student Events API sync error:", e.message);
    } finally {
      this.studentCache.loading.events = false;
    }
    return null;
  },

  syncStudentNotifications: async function(studentId = "STU-2026-101") {
    try {
      this.studentCache.loading.notifications = true;
      const res = await fetch(`${this.API_BASE}/student/notifications/${studentId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          this.studentCache.notifications = json.data;
          return json.data;
        }
      }
    } catch (e) {
      console.warn("Student Notifications API sync error:", e.message);
    } finally {
      this.studentCache.loading.notifications = false;
    }
    return null;
  },

  syncStudentCollegeInfo: async function(studentId = "STU-2026-101") {
    try {
      this.studentCache.loading.collegeInfo = true;
      const res = await fetch(`${this.API_BASE}/student/college-info/${studentId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          this.studentCache.collegeInfo = json.data;
          return json.data;
        }
      }
    } catch (e) {
      console.warn("Student College Info API sync error:", e.message);
    } finally {
      this.studentCache.loading.collegeInfo = false;
    }
    return null;
  },

  syncStaffDashboard: async function(staffId = "STF-201") {
    try {
      this.staffCache.loading.dashboard = true;
      const res = await fetch(`${this.API_BASE}/staff/dashboard/${staffId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          this.staffCache.dashboard = json.data;
          if (json.data.stats) {
            this.data.staff.stats = json.data.stats;
          }
          if (json.data.classes) {
            this.data.staff.classes = json.data.classes;
          }
          if (json.data.tasks) {
            this.data.staff.tasks = json.data.tasks;
          }
          this.save();
          return json.data;
        }
      }
    } catch (e) {
      console.warn("Staff Dashboard API sync error:", e.message);
    } finally {
      this.staffCache.loading.dashboard = false;
    }
    return null;
  },

  syncStaffProfile: async function(staffId = "STF-201") {
    try {
      this.staffCache.loading.profile = true;
      const res = await fetch(`${this.API_BASE}/staff/profile/${staffId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          this.staffCache.profile = json.data;
          return json.data;
        }
      }
    } catch (e) {
      console.warn("Staff Profile API sync error:", e.message);
    } finally {
      this.staffCache.loading.profile = false;
    }
    return null;
  },

  syncStaffClasses: async function(staffId = "STF-201") {
    try {
      this.staffCache.loading.classes = true;
      const res = await fetch(`${this.API_BASE}/staff/classes/${staffId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          this.staffCache.classes = json.data;
          this.data.staff.classes = json.data;
          this.save();
          return json.data;
        }
      }
    } catch (e) {
      console.warn("Staff Classes API sync error:", e.message);
    } finally {
      this.staffCache.loading.classes = false;
    }
    return null;
  },

  syncStaffTasks: async function(staffId = "STF-201") {
    try {
      this.staffCache.loading.tasks = true;
      const res = await fetch(`${this.API_BASE}/staff/tasks/${staffId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          this.staffCache.tasks = json.data;
          this.data.staff.tasks = json.data;
          this.save();
          return json.data;
        }
      }
    } catch (e) {
      console.warn("Staff Tasks API sync error:", e.message);
    } finally {
      this.staffCache.loading.tasks = false;
    }
    return null;
  },

  syncStaffEvents: async function(staffId = "STF-201") {
    try {
      this.staffCache.loading.events = true;
      const res = await fetch(`${this.API_BASE}/staff/events/${staffId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          this.staffCache.events = json.data;
          this.data.staff.events = json.data;
          this.save();
          return json.data;
        }
      }
    } catch (e) {
      console.warn("Staff Events API sync error:", e.message);
    } finally {
      this.staffCache.loading.events = false;
    }
    return null;
  },

  syncStaffNotifications: async function(staffId = "STF-201") {
    try {
      this.staffCache.loading.notifications = true;
      const res = await fetch(`${this.API_BASE}/staff/notifications/${staffId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          this.staffCache.notifications = json.data;
          this.data.staff.notifications = json.data;
          this.save();
          return json.data;
        }
      }
    } catch (e) {
      console.warn("Staff Notifications API sync error:", e.message);
    } finally {
      this.staffCache.loading.notifications = false;
    }
    return null;
  },

  syncStaffCollegeInfo: async function(staffId = "STF-201") {
    try {
      this.staffCache.loading.collegeInfo = true;
      const res = await fetch(`${this.API_BASE}/staff/college-info/${staffId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          this.staffCache.collegeInfo = json.data;
          return json.data;
        }
      }
    } catch (e) {
      console.warn("Staff College Info API sync error:", e.message);
    } finally {
      this.staffCache.loading.collegeInfo = false;
    }
    return null;
  },

  syncAdminDashboard: async function() {
    this.adminCache.error.dashboard = null;
    this.adminCache.loading.dashboard = true;
    try {
      const res = await this.fetchWithTimeout(`${this.API_BASE}/admin/dashboard`, {}, 8000);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      if (json.success && json.data) {
        this.adminCache.dashboard = json.data;
        this.adminCache.error.dashboard = null;
        if (json.data.stats) {
          this.data.admin.stats.totalStudents = json.data.stats.totalStudents;
          this.data.admin.stats.totalStaff = json.data.stats.totalStaff;
          this.data.admin.stats.departments = json.data.stats.totalDepartments;
        }
        this.save();
        return json.data;
      } else {
        throw new Error(json.error || "Failed to parse dashboard data from server.");
      }
    } catch (e) {
      console.error("Admin Dashboard API sync error:", e.message);
      this.adminCache.error.dashboard = e.message || "Failed to connect to backend server.";
      return null;
    } finally {
      this.adminCache.loading.dashboard = false;
    }
  },

  syncAdminStudents: async function() {
    this.adminCache.error.students = null;
    this.adminCache.loading.students = true;
    try {
      const res = await this.fetchWithTimeout(`${this.API_BASE}/admin/students`, {}, 8000);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        this.adminCache.students = json.data;
        this.adminCache.error.students = null;
        return json.data;
      } else {
        throw new Error(json.error || "Invalid response format for students directory.");
      }
    } catch (e) {
      console.error("Admin Students API sync error:", e.message);
      this.adminCache.error.students = e.message || "Failed to load students directory.";
      return null;
    } finally {
      this.adminCache.loading.students = false;
    }
  },

  syncAdminStaff: async function() {
    this.adminCache.error.staff = null;
    this.adminCache.loading.staff = true;
    try {
      const res = await this.fetchWithTimeout(`${this.API_BASE}/admin/staff`, {}, 8000);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        this.adminCache.staff = json.data;
        this.adminCache.error.staff = null;
        return json.data;
      } else {
        throw new Error(json.error || "Invalid response format for faculty directory.");
      }
    } catch (e) {
      console.error("Admin Staff API sync error:", e.message);
      this.adminCache.error.staff = e.message || "Failed to load faculty directory.";
      return null;
    } finally {
      this.adminCache.loading.staff = false;
    }
  },

  syncAdminDepartments: async function() {
    this.adminCache.error.departments = null;
    this.adminCache.loading.departments = true;
    try {
      const res = await this.fetchWithTimeout(`${this.API_BASE}/admin/departments`, {}, 8000);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        this.adminCache.departments = json.data;
        this.adminCache.error.departments = null;
        return json.data;
      } else {
        throw new Error(json.error || "Invalid response format for departments.");
      }
    } catch (e) {
      console.error("Admin Departments API sync error:", e.message);
      this.adminCache.error.departments = e.message || "Failed to load departments.";
      return null;
    } finally {
      this.adminCache.loading.departments = false;
    }
  },

  syncAdminCourses: async function() {
    this.adminCache.error.courses = null;
    this.adminCache.loading.courses = true;
    try {
      const res = await this.fetchWithTimeout(`${this.API_BASE}/admin/courses`, {}, 8000);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        this.adminCache.courses = json.data;
        this.adminCache.error.courses = null;
        return json.data;
      } else {
        throw new Error(json.error || "Invalid response format for courses catalog.");
      }
    } catch (e) {
      console.error("Admin Courses API sync error:", e.message);
      this.adminCache.error.courses = e.message || "Failed to load course catalog.";
      return null;
    } finally {
      this.adminCache.loading.courses = false;
    }
  },

  syncAdminAttendance: async function() {
    this.adminCache.error.attendance = null;
    this.adminCache.loading.attendance = true;
    try {
      const res = await this.fetchWithTimeout(`${this.API_BASE}/admin/attendance`, {}, 8000);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      if (json.success && json.summary) {
        this.adminCache.attendance = json;
        this.adminCache.error.attendance = null;
        return json;
      } else {
        throw new Error(json.error || "Invalid response format for attendance analytics.");
      }
    } catch (e) {
      console.error("Admin Attendance API sync error:", e.message);
      this.adminCache.error.attendance = e.message || "Failed to load attendance analytics.";
      return null;
    } finally {
      this.adminCache.loading.attendance = false;
    }
  },

  syncAdminEvents: async function() {
    this.adminCache.error.events = null;
    this.adminCache.loading.events = true;
    try {
      const res = await this.fetchWithTimeout(`${this.API_BASE}/admin/events`, {}, 8000);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        this.adminCache.events = json.data;
        this.adminCache.error.events = null;
        return json.data;
      } else {
        throw new Error(json.error || "Invalid response format for campus events.");
      }
    } catch (e) {
      console.error("Admin Events API sync error:", e.message);
      this.adminCache.error.events = e.message || "Failed to load campus events.";
      return null;
    } finally {
      this.adminCache.loading.events = false;
    }
  },

  syncAdminAnnouncements: async function() {
    this.adminCache.error.announcements = null;
    this.adminCache.loading.announcements = true;
    try {
      const res = await this.fetchWithTimeout(`${this.API_BASE}/admin/announcements`, {}, 8000);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        this.adminCache.announcements = json.data;
        this.adminCache.error.announcements = null;
        return json.data;
      } else {
        throw new Error(json.error || "Invalid response format for announcements.");
      }
    } catch (e) {
      console.error("Admin Announcements API sync error:", e.message);
      this.adminCache.error.announcements = e.message || "Failed to load announcements.";
      return null;
    } finally {
      this.adminCache.loading.announcements = false;
    }
  },

  syncAdminReports: async function() {
    this.adminCache.error.reports = null;
    this.adminCache.loading.reports = true;
    try {
      const res = await this.fetchWithTimeout(`${this.API_BASE}/admin/reports`, {}, 8000);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      if (json.success && json.data) {
        this.adminCache.reports = json.data;
        this.adminCache.error.reports = null;
        return json.data;
      } else {
        throw new Error(json.error || "Invalid response format for system reports.");
      }
    } catch (e) {
      console.error("Admin Reports API sync error:", e.message);
      this.adminCache.error.reports = e.message || "Failed to load system reports.";
      return null;
    } finally {
      this.adminCache.loading.reports = false;
    }
  },

  // Sync Students List from Backend API with LocalStorage Fallback
  syncStudentsFromBackend: async function() {
    try {
      const res = await fetch(`${this.API_BASE}/students`);
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          if (result.data.length > 0) {
            const apiStudents = result.data.map(item => ({
              id: item.studentId || item._id,
              _id: item._id,
              name: item.name,
              dept: item.dept,
              year: item.year,
              cgpa: item.cgpa || "3.75",
              status: item.status || "Active",
              email: item.email || `${item.name.toLowerCase().replace(/\s+/g, '.')}@university.edu`
            }));
            this.data.admin.studentsList = apiStudents;
            this.data.admin.stats.totalStudents = apiStudents.length;
            this.save();
          } else {
            // Seed initial local students to backend database
            const localStudents = this.getStudentsList();
            for (const s of localStudents) {
              await fetch(`${this.API_BASE}/students`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  studentId: s.id,
                  name: s.name,
                  dept: s.dept,
                  year: s.year,
                  cgpa: s.cgpa,
                  status: s.status,
                  email: s.email
                })
              }).catch(() => {});
            }
          }
        }
      }
    } catch (e) {
      console.warn('Backend API unavailable. Operating in LocalStorage fallback mode.');
    }
  },

  // Sync Faculty List from Backend API with LocalStorage Fallback
  syncFacultyFromBackend: async function() {
    try {
      const res = await fetch(`${this.API_BASE}/faculty`);
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          if (result.data.length > 0) {
            const apiStaff = result.data.map(item => ({
              id: item.staffId || item._id,
              _id: item._id,
              name: item.name,
              dept: item.dept,
              role: item.role,
              courses: item.courses !== undefined ? item.courses : 2,
              status: item.status || "Active",
              email: item.email || `${item.name.toLowerCase().replace(/\s+/g, '.')}@university.edu`
            }));
            this.data.admin.staffList = apiStaff;
            this.data.admin.stats.totalStaff = apiStaff.length;
            this.save();
          } else {
            // Seed initial local staff to backend database
            const localStaff = this.getStaffList();
            for (const s of localStaff) {
              await fetch(`${this.API_BASE}/faculty`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  staffId: s.id,
                  name: s.name,
                  dept: s.dept,
                  role: s.role,
                  courses: s.courses || 2,
                  status: s.status || "Active",
                  email: s.email
                })
              }).catch(() => {});
            }
          }
        }
      }
    } catch (e) {
      console.warn('Backend API unavailable. Operating in LocalStorage fallback mode.');
    }
  },

  // Sync Events List from Backend API with LocalStorage Fallback
  syncEventsFromBackend: async function() {
    try {
      const res = await fetch(`${this.API_BASE}/events`);
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          if (result.data.length > 0) {
            const apiEvents = result.data.map(item => ({
              id: item.eventId || item._id,
              _id: item._id,
              title: item.title,
              organizer: item.organizer || "Faculty / Dept",
              venue: item.venue || item.location || "Main Auditorium",
              date: item.date,
              time: item.time || "10:00 AM",
              location: item.location || item.venue || "Main Auditorium",
              status: item.status || "Approved",
              details: item.desc || item.details || "Campus event reservation request."
            }));
            this.data.admin.eventsApprovals = apiEvents;
            this.save();
          } else {
            // Seed initial local events to backend database
            const localEvents = this.getEventsApprovals();
            for (const e of localEvents) {
              await fetch(`${this.API_BASE}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  eventId: e.id,
                  title: e.title,
                  organizer: e.organizer,
                  venue: e.venue,
                  location: e.venue || "Main Auditorium",
                  date: e.date,
                  status: e.status || "Approved",
                  desc: e.details || "Official campus venue reservation request."
                })
              }).catch(() => {});
            }
          }
        }
      }
    } catch (e) {
      console.warn('Backend API unavailable. Operating in LocalStorage fallback mode.');
    }
  },

  // Sync Announcements List from Backend API with LocalStorage Fallback
  syncAnnouncementsFromBackend: async function() {
    try {
      const res = await fetch(`${this.API_BASE}/announcements`);
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          if (result.data.length > 0) {
            const apiAnnouncements = result.data.map(item => ({
              id: item.announcementId || item._id,
              _id: item._id,
              title: item.title,
              target: item.target || "All Users",
              author: item.author || "System Administrator",
              priority: item.priority || "Normal",
              date: item.date || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
            }));
            this.data.admin.announcements = apiAnnouncements;
            this.save();
          } else {
            // Seed initial local announcements to backend database
            const localAnnouncements = this.getAnnouncements();
            for (const a of localAnnouncements) {
              await fetch(`${this.API_BASE}/announcements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  announcementId: a.id,
                  title: a.title,
                  target: a.target,
                  author: a.author,
                  priority: a.priority,
                  date: a.date
                })
              }).catch(() => {});
            }
          }
        }
      }
    } catch (e) {
      console.warn('Backend API unavailable. Operating in LocalStorage fallback mode.');
    }
  },

  // Sync Community Posts & Comments from Backend API with LocalStorage Fallback
  syncCommunityFromBackend: async function() {
    try {
      const res = await fetch(`${this.API_BASE}/community/posts`);
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          this.backendStatus = { connected: true, lastError: null };

          const commentsRes = await fetch(`${this.API_BASE}/community/comments`).catch(() => null);
          let allComments = [];
          if (commentsRes && commentsRes.ok) {
            const cData = await commentsRes.json();
            if (cData.success && Array.isArray(cData.data)) {
              allComments = cData.data;
            }
          }

          if (result.data.length > 0) {
            const apiPosts = result.data.map(item => {
              const pId = item.postId || (item._id ? item._id.toString() : "post_" + Date.now());
              const mId = item._id ? item._id.toString() : pId;
              const postComments = allComments.filter(c => String(c.postId) === pId || String(c.postId) === mId).map(c => ({
                id: c.commentId || c._id,
                _id: c._id,
                authorRole: c.authorRole || 'student',
                text: c.text,
                timestamp: c.timestamp || 'Recently'
              }));

              return {
                id: pId,
                _id: item._id,
                authorRole: item.authorRole || 'student',
                anonymousHandle: item.anonymousHandle || 'OceanSoul',
                category: item.category,
                text: item.text,
                mediaType: item.mediaType || 'none',
                mediaUrl: item.mediaUrl || '',
                postType: item.postType || (item.pollData ? 'poll' : item.eventData ? 'event' : item.mediaType !== 'none' ? item.mediaType : 'text'),
                pollData: item.pollData || null,
                eventData: item.eventData || null,
                timestamp: item.timestamp || 'Recently',
                supportCount: item.supportCount || 0,
                supportedBy: item.supportedBy || [],
                comments: postComments,
                status: item.status || 'active',
                fakeScore: item.fakeScore || 0,
                duplicateScore: item.duplicateScore || 0,
                toxicScore: item.toxicScore || 0,
                flagReason: item.flagReason || null,
                linkedPostId: item.linkedPostId || null
              };
            });

            this.data.communityPosts = apiPosts;
            this.save();
          } else {
            // Seed initial local community posts to backend database
            const localPosts = this.getCommunityPosts();
            for (const p of localPosts) {
              await fetch(`${this.API_BASE}/community/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  postId: p.id,
                  authorRole: p.authorRole,
                  anonymousHandle: p.anonymousHandle || 'OceanSoul',
                  category: p.category,
                  text: p.text,
                  mediaType: p.mediaType || 'none',
                  mediaUrl: p.mediaUrl || '',
                  postType: p.postType || 'text',
                  pollData: p.pollData || null,
                  eventData: p.eventData || null,
                  timestamp: p.timestamp || 'Just now',
                  supportCount: p.supportCount || 0,
                  supportedBy: p.supportedBy || [],
                  status: p.status || 'active',
                  fakeScore: p.fakeScore || 0,
                  duplicateScore: p.duplicateScore || 0,
                  toxicScore: p.toxicScore || 0,
                  flagReason: p.flagReason || null,
                  linkedPostId: p.linkedPostId || null
                })
              }).catch(() => {});
            }
          }
        }
      } else {
        this.backendStatus = { connected: false, lastError: `Server returned HTTP status ${res.status}` };
      }
    } catch (e) {
      this.backendStatus = { connected: false, lastError: e.message || 'Failed to connect to backend server' };
      console.warn('Backend API unavailable. Operating in LocalStorage fallback mode.', e);
    }
  },

  // Sync Notifications from Backend API with LocalStorage Fallback
  syncNotificationsFromBackend: async function() {
    try {
      const res = await fetch(`${this.API_BASE}/notifications`);
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          const apiNotifs = result.data.map(item => ({
            id: item._id || item.id,
            _id: item._id,
            role: item.role,
            type: item.type || 'Academic',
            title: item.title,
            desc: item.desc,
            time: item.time || 'Recently',
            read: !!item.read,
            relatedId: item.relatedId || null
          }));
          this.data.notifications = apiNotifs;
          this.save();
        }
      }
    } catch (e) {
      console.warn('Backend API unavailable for Notifications sync.');
    }
  },

  getNotifications: function(role) {
    if (!this.data.notifications) return [];
    if (!role || role === 'all') return this.data.notifications;
    const normRole = role === 'staff' ? 'staff' : role === 'admin' ? 'admin' : 'student';
    return this.data.notifications.filter(n => n.role === normRole || n.role === 'all');
  },

  getStudentNotifications: function() {
    return this.getNotifications('student');
  },

  getStaffNotifications: function() {
    return this.getNotifications('staff');
  },

  getUnreadNotificationCount: function(role) {
    const list = this.getNotifications(role);
    return list.filter(n => !n.read).length;
  },

  addNotification: async function(notifData) {
    if (!this.data.notifications) this.data.notifications = [];
    const notifId = "notif_" + Date.now();
    const newNotif = {
      id: notifId,
      role: notifData.role || 'student',
      type: notifData.type || 'Community',
      title: notifData.title,
      desc: notifData.desc,
      time: notifData.time || 'Just now',
      read: false,
      relatedId: notifData.relatedId || null
    };

    this.data.notifications.unshift(newNotif);
    this.save();

    // Async Backend API Sync
    try {
      const res = await fetch(`${this.API_BASE}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: newNotif.role,
          type: newNotif.type,
          title: newNotif.title,
          desc: newNotif.desc,
          time: newNotif.time,
          read: false,
          relatedId: newNotif.relatedId
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          newNotif._id = data.data._id;
          newNotif.id = data.data._id;
          this.save();
        }
      }
    } catch (err) {
      console.warn('Backend offline. Saved notification locally.', err);
    }

    return newNotif;
  },

  markNotificationRead: async function(notifId) {
    if (!this.data.notifications) return;
    const notif = this.data.notifications.find(n => n.id === notifId || n._id === notifId);
    if (!notif) return;

    notif.read = true;
    this.save();

    const targetId = notif._id || notif.id;
    if (targetId) {
      await fetch(`${this.API_BASE}/notifications/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true })
      }).catch(() => {});
    }
  },

  markAllNotificationsRead: async function(role) {
    if (!this.data.notifications) return;
    const list = this.getNotifications(role);
    list.forEach(n => n.read = true);
    this.save();

    const normRole = role === 'staff' ? 'staff' : role === 'admin' ? 'admin' : 'student';
    await fetch(`${this.API_BASE}/notifications/read-all`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: normRole })
    }).catch(() => {});
  },

  dismissNotification: async function(role, notifId) {
    if (!this.data.notifications) return false;
    const idx = this.data.notifications.findIndex(n => n.id === notifId || n._id === notifId);
    if (idx !== -1) {
      const removed = this.data.notifications.splice(idx, 1)[0];
      this.save();

      const targetId = removed._id || removed.id;
      if (targetId) {
        await fetch(`${this.API_BASE}/notifications/${targetId}`, {
          method: 'DELETE'
        }).catch(() => {});
      }
      return true;
    }
    return false;
  },

  // 2. Students CRUD
  addStudent: function(studentData) {
    const studentId = studentData.studentId || "STU-" + Math.floor(100 + Math.random() * 900);
    const newStudent = {
      id: studentId,
      name: studentData.name,
      dept: studentData.dept,
      year: studentData.year,
      cgpa: studentData.cgpa || "3.75",
      status: studentData.status || "Active",
      email: studentData.email || `${studentData.name.toLowerCase().replace(/\s+/g, '.')}@university.edu`
    };

    // Immediate LocalStorage state update
    this.data.admin.studentsList.unshift(newStudent);
    this.data.admin.stats.totalStudents += 1;
    this.addAuditLog(`Created New Student Record: ${newStudent.name} (${newStudent.id})`);
    this.save();

    // Async Backend API Sync
    fetch(`${this.API_BASE}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: newStudent.id,
        name: newStudent.name,
        dept: newStudent.dept,
        year: newStudent.year,
        cgpa: newStudent.cgpa,
        status: newStudent.status,
        email: newStudent.email
      })
    }).then(res => res.json()).then(data => {
      if (data.success && data.data) {
        newStudent._id = data.data._id;
        this.save();
      }
    }).catch(err => {
      console.warn('Backend offline. Saved student locally to LocalStorage.', err);
    });

    return newStudent;
  },

  updateStudent: function(studentId, updateData) {
    const student = this.data.admin.studentsList.find(s => s.id === studentId || s._id === studentId);
    if (!student) return false;

    if (updateData.name) student.name = updateData.name;
    if (updateData.dept) student.dept = updateData.dept;
    if (updateData.year) student.year = updateData.year;
    if (updateData.cgpa) student.cgpa = updateData.cgpa;
    if (updateData.status) student.status = updateData.status;
    if (updateData.email) student.email = updateData.email;

    this.addAuditLog(`Updated Student Record: ${student.name} (${student.id})`);
    this.save();

    // Async Backend API Sync
    const targetId = student._id || student.id;
    fetch(`${this.API_BASE}/students/${targetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    }).catch(err => {
      console.warn('Backend offline. Updated student locally in LocalStorage.', err);
    });

    return true;
  },

  deleteStudent: function(studentId) {
    const idx = this.data.admin.studentsList.findIndex(s => s.id === studentId || s._id === studentId);
    if (idx !== -1) {
      const removed = this.data.admin.studentsList.splice(idx, 1)[0];
      this.data.admin.stats.totalStudents = Math.max(0, this.data.admin.stats.totalStudents - 1);
      this.addAuditLog(`Deleted Student Record: ${removed.name} (${removed.id})`);
      this.save();

      // Async Backend API Sync
      const targetId = removed._id || removed.id;
      fetch(`${this.API_BASE}/students/${targetId}`, {
        method: 'DELETE'
      }).catch(err => {
        console.warn('Backend offline. Deleted student locally from LocalStorage.', err);
      });

      return true;
    }
    return false;
  },

  updateStudentProfile: function(name, aiPreference) {
    if (this.data.users && this.data.users.student) {
      if (name) this.data.users.student.name = name;
      if (aiPreference) this.data.users.student.aiPreference = aiPreference;
    }
    const currentSession = Auth.getCurrentUser();
    if (currentSession && currentSession.role === 'student') {
      if (name) currentSession.name = name;
    }
    this.save();
    return true;
  },

  // 3. Staff CRUD & Faculty Events
  addStaff: function(staffData) {
    const staffId = staffData.staffId || "STF-" + Math.floor(200 + Math.random() * 800);
    const newStaff = {
      id: staffId,
      name: staffData.name,
      dept: staffData.dept,
      role: staffData.role,
      courses: staffData.courses !== undefined ? staffData.courses : 2,
      status: staffData.status || "Active",
      email: staffData.email || `${staffData.name.toLowerCase().replace(/\s+/g, '.')}@university.edu`
    };

    // Immediate LocalStorage state update
    this.data.admin.staffList.unshift(newStaff);
    this.data.admin.stats.totalStaff += 1;
    this.addAuditLog(`Registered New Faculty Member: ${newStaff.name} (${newStaff.id})`);
    this.save();

    // Async Backend API Sync
    fetch(`${this.API_BASE}/faculty`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        staffId: newStaff.id,
        name: newStaff.name,
        dept: newStaff.dept,
        role: newStaff.role,
        courses: newStaff.courses,
        status: newStaff.status,
        email: newStaff.email
      })
    }).then(res => res.json()).then(data => {
      if (data.success && data.data) {
        newStaff._id = data.data._id;
        this.save();
      }
    }).catch(err => {
      console.warn('Backend offline. Saved faculty locally to LocalStorage.', err);
    });

    return newStaff;
  },

  updateStaff: function(staffId, updateData) {
    const staff = this.data.admin.staffList.find(s => s.id === staffId || s._id === staffId);
    if (!staff) return false;

    if (updateData.name) staff.name = updateData.name;
    if (updateData.dept) staff.dept = updateData.dept;
    if (updateData.role) staff.role = updateData.role;
    if (updateData.courses !== undefined) staff.courses = updateData.courses;
    if (updateData.status) staff.status = updateData.status;
    if (updateData.email) staff.email = updateData.email;

    this.addAuditLog(`Updated Faculty Record: ${staff.name} (${staff.id})`);
    this.save();

    // Async Backend API Sync
    const targetId = staff._id || staff.id;
    fetch(`${this.API_BASE}/faculty/${targetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    }).catch(err => {
      console.warn('Backend offline. Updated faculty locally in LocalStorage.', err);
    });

    return true;
  },

  deleteStaff: function(staffId) {
    const idx = this.data.admin.staffList.findIndex(s => s.id === staffId || s._id === staffId);
    if (idx !== -1) {
      const removed = this.data.admin.staffList.splice(idx, 1)[0];
      this.data.admin.stats.totalStaff = Math.max(0, this.data.admin.stats.totalStaff - 1);
      this.addAuditLog(`Deleted Faculty Record: ${removed.name} (${removed.id})`);
      this.save();

      // Async Backend API Sync
      const targetId = removed._id || removed.id;
      fetch(`${this.API_BASE}/faculty/${targetId}`, {
        method: 'DELETE'
      }).catch(err => {
        console.warn('Backend offline. Deleted faculty locally from LocalStorage.', err);
      });

      return true;
    }
    return false;
  },

  addStaffEvent: async function(eventData) {
    const newEvent = {
      eventId: "EVT-" + Date.now(),
      title: eventData.title,
      date: eventData.date || "Sept 25, 2026",
      time: eventData.time || "10:00 AM",
      location: eventData.location || "Conference Hall A",
      category: eventData.role || "Faculty Workshop",
      role: eventData.role || "Faculty Organiser",
      organizer: "Faculty Member",
      status: "Approved",
      rsvps: []
    };
    try {
      const res = await this.fetchWithTimeout(`${this.API_BASE}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent)
      }, 8000);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          if (this.staffCache.events) this.staffCache.events.unshift(json.data);
          if (this.studentCache.events) this.studentCache.events.unshift(json.data);
          if (this.adminCache.events) this.adminCache.events.unshift(json.data);
          return json.data;
        }
      }
    } catch (e) {
      console.error('Failed to save staff event to MongoDB:', e.message);
    }
    return newEvent;
  },

  toggleStaffEventConfirmation: function(eventId, userId, action) {
    return this.toggleEventRSVP(eventId, userId, action);
  },

  // 4. Departments CRUD
  addDepartment: function(deptData) {
    const newDept = {
      id: "d" + Date.now(),
      name: deptData.name,
      hod: deptData.hod || "Pending Assignment",
      students: 0,
      faculty: 0,
      budget: deptData.budget || "$750K",
      code: deptData.code || deptData.name.substring(0, 4).toUpperCase()
    };
    this.data.admin.departmentsList.push(newDept);
    this.data.admin.stats.departments += 1;
    this.addAuditLog(`Added New Department: ${newDept.name}`);
    this.save();
    return newDept;
  },

  // 5. Announcements CRUD
  addAnnouncement: async function(annData) {
    const annId = annData.announcementId || "a" + Date.now();
    const newAnn = {
      id: annId,
      title: annData.title,
      message: annData.message || "",
      target: annData.target || "All Users",
      date: annData.date || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      author: annData.author || "System Administrator",
      priority: annData.priority || "Normal"
    };

    // Immediate LocalStorage state update
    this.data.admin.announcements.unshift(newAnn);
    this.addAuditLog(`Published Broadcast Announcement: ${newAnn.title}`);
    this.save();

    // Create Notification records based on Target Audience
    const targetLower = newAnn.target.toLowerCase();
    const notifTitle = newAnn.title;
    const msgSnippet = newAnn.message ? `: ${newAnn.message}` : '';
    const notifDesc = `[${newAnn.priority} Priority] Broadcast Announcement from ${newAnn.author}${msgSnippet}`;
    const notifTime = newAnn.date;

    const targetsStudent = targetLower.includes('all') || targetLower.includes('student');
    const targetsStaff = targetLower.includes('all') || targetLower.includes('staff') || targetLower.includes('faculty');

    if (targetsStudent) {
      await this.addNotification({
        role: 'student',
        type: 'Academic',
        title: notifTitle,
        desc: notifDesc,
        time: notifTime,
        relatedId: newAnn.id
      });
    }

    if (targetsStaff) {
      await this.addNotification({
        role: 'staff',
        type: 'Academic',
        title: notifTitle,
        desc: notifDesc,
        time: notifTime,
        relatedId: newAnn.id
      });
    }

    // Async Backend API Sync
    try {
      const res = await fetch(`${this.API_BASE}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          announcementId: newAnn.id,
          title: newAnn.title,
          message: newAnn.message,
          target: newAnn.target,
          author: newAnn.author,
          priority: newAnn.priority,
          date: newAnn.date
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          newAnn._id = data.data._id;
          this.save();
        }
      }
    } catch (err) {
      console.warn('Backend offline. Saved announcement locally to LocalStorage.', err);
    }

    return newAnn;
  },

  updateAnnouncement: function(annId, updateData) {
    const item = this.data.admin.announcements.find(a => a.id === annId || a._id === annId);
    if (!item) return false;

    if (updateData.title) item.title = updateData.title;
    if (updateData.message !== undefined) item.message = updateData.message;
    if (updateData.target) item.target = updateData.target;
    if (updateData.priority) item.priority = updateData.priority;
    if (updateData.author) item.author = updateData.author;
    if (updateData.date) item.date = updateData.date;

    this.addAuditLog(`Updated Broadcast Announcement: ${item.title}`);
    this.save();

    // Async Backend API Sync
    const targetId = item._id || item.id;
    fetch(`${this.API_BASE}/announcements/${targetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: item.title,
        message: item.message,
        target: item.target,
        priority: item.priority,
        author: item.author,
        date: item.date
      })
    }).catch(err => {
      console.warn('Backend offline. Updated announcement locally in LocalStorage.', err);
    });

    return true;
  },

  deleteAnnouncement: function(annId) {
    const idx = this.data.admin.announcements.findIndex(a => a.id === annId || a._id === annId);
    if (idx !== -1) {
      const removed = this.data.admin.announcements.splice(idx, 1)[0];
      this.addAuditLog(`Deleted Broadcast Announcement: ${removed.title}`);
      
      // Clean up corresponding local notifications
      const targetId = removed._id || removed.id;
      if (this.data.student && this.data.student.notifications) {
        this.data.student.notifications = this.data.student.notifications.filter(n => n.relatedId !== removed.id && n.relatedId !== removed._id);
      }
      if (this.data.staff && this.data.staff.notifications) {
        this.data.staff.notifications = this.data.staff.notifications.filter(n => n.relatedId !== removed.id && n.relatedId !== removed._id);
      }

      this.save();

      // Async Backend API Sync
      fetch(`${this.API_BASE}/announcements/${targetId}`, {
        method: 'DELETE'
      }).catch(err => {
        console.warn('Backend offline. Deleted announcement locally from LocalStorage.', err);
      });

      return true;
    }
    return false;
  },

  // 6. Tasks Kanban Actions
  addTask: async function(taskData) {
    const newTask = {
      id: "t" + Date.now(),
      title: taskData.title,
      status: taskData.status || "todo",
      priority: taskData.priority || "High",
      dueDate: taskData.dueDate || "Due Today",
      desc: taskData.desc || ""
    };
    if (!this.data.staff.tasks) this.data.staff.tasks = [];
    this.data.staff.tasks.push(newTask);
    this.save();

    try {
      const currentUser = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;
      const staffId = taskData.staffId || (currentUser ? (currentUser.staffId || currentUser.id) : 'STF101');
      const res = await fetch(`${this.API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId,
          title: newTask.title,
          status: newTask.status,
          priority: newTask.priority,
          dueDate: newTask.dueDate,
          desc: newTask.desc
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          newTask._id = data.data._id;
          if (data.data.id) newTask.id = data.data.id;
          this.save();
        }
      }
    } catch (err) {
      console.warn('Backend task create sync offline:', err);
    }
    return newTask;
  },

  updateTaskStatus: async function(taskId, newStatus) {
    let task = this.data.staff.tasks.find(t => t.id === taskId || t._id === taskId);
    if (task) {
      task.status = newStatus;
      this.save();
    }
    try {
      const targetId = (task && task._id) ? task._id : taskId;
      await fetch(`${this.API_BASE}/tasks/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      return true;
    } catch (e) {
      console.warn('Backend task status sync offline:', e);
    }
    return !!task;
  },

  deleteTask: async function(taskId) {
    const idx = this.data.staff.tasks.findIndex(t => t.id === taskId || t._id === taskId);
    let targetId = taskId;
    if (idx !== -1) {
      const removed = this.data.staff.tasks.splice(idx, 1)[0];
      if (removed._id) targetId = removed._id;
      this.save();
    }
    try {
      await fetch(`${this.API_BASE}/tasks/${targetId}`, {
        method: 'DELETE'
      });
      return true;
    } catch (e) {
      console.warn('Backend task delete sync offline:', e);
    }
    return idx !== -1;
  },

  // 7. Admin Events & Venue Approvals
  addEventApproval: function(eventData) {
    const eventId = eventData.eventId || "ea" + Date.now();
    const newReservation = {
      id: eventId,
      title: eventData.title,
      organizer: eventData.organizer || "Faculty / Dept",
      venue: eventData.venue || "Main Auditorium",
      date: eventData.date || "Oct 12",
      status: eventData.status || "Pending Approval",
      details: eventData.details || "Official campus venue reservation request."
    };

    // Immediate LocalStorage state update
    this.data.admin.eventsApprovals.unshift(newReservation);
    this.addAuditLog(`Created Venue Reservation: ${newReservation.title} (${newReservation.venue})`);
    this.save();

    // Async Backend API Sync
    fetch(`${this.API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: newReservation.id,
        title: newReservation.title,
        organizer: newReservation.organizer,
        venue: newReservation.venue,
        location: newReservation.venue,
        date: newReservation.date,
        status: newReservation.status,
        desc: newReservation.details
      })
    }).then(res => res.json()).then(data => {
      if (data.success && data.data) {
        newReservation._id = data.data._id;
        this.save();
      }
    }).catch(err => {
      console.warn('Backend offline. Saved event locally to LocalStorage.', err);
    });

    return newReservation;
  },

  updateEventApproval: function(eventId, updateData) {
    const event = this.data.admin.eventsApprovals.find(e => e.id === eventId || e._id === eventId);
    if (!event) return false;

    if (updateData.title) event.title = updateData.title;
    if (updateData.organizer) event.organizer = updateData.organizer;
    if (updateData.venue) event.venue = updateData.venue;
    if (updateData.date) event.date = updateData.date;
    if (updateData.status) event.status = updateData.status;
    if (updateData.details) event.details = updateData.details;

    this.addAuditLog(`Updated Venue Reservation: ${event.title}`);
    this.save();

    // Async Backend API Sync
    const targetId = event._id || event.id;
    fetch(`${this.API_BASE}/events/${targetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: event.title,
        organizer: event.organizer,
        venue: event.venue,
        location: event.venue,
        date: event.date,
        status: event.status,
        desc: event.details
      })
    }).catch(err => {
      console.warn('Backend offline. Updated event locally in LocalStorage.', err);
    });

    return true;
  },

  deleteEventApproval: function(eventId) {
    const idx = this.data.admin.eventsApprovals.findIndex(e => e.id === eventId || e._id === eventId);
    if (idx !== -1) {
      const removed = this.data.admin.eventsApprovals.splice(idx, 1)[0];
      this.addAuditLog(`Deleted Venue Reservation: ${removed.title}`);
      this.save();

      // Async Backend API Sync
      const targetId = removed._id || removed.id;
      fetch(`${this.API_BASE}/events/${targetId}`, {
        method: 'DELETE'
      }).catch(err => {
        console.warn('Backend offline. Deleted event locally from LocalStorage.', err);
      });

      return true;
    }
    return false;
  },

  approveEvent: function(eventId) {
    const event = this.data.admin.eventsApprovals.find(e => e.id === eventId || e._id === eventId);
    if (event) {
      event.status = "Approved";
      this.addAuditLog(`Approved Venue Reservation: ${event.title}`);
      this.save();

      // Async Backend API Sync
      const targetId = event._id || event.id;
      fetch(`${this.API_BASE}/events/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Approved' })
      }).catch(err => {
        console.warn('Backend offline. Approved event locally in LocalStorage.', err);
      });

      return true;
    }
    return false;
  },

  toggleEventRSVP: async function(eventId, userId, action) {
    const user = Auth.getCurrentUser();
    const currentUserId = userId || (user ? user.id : "STF-201");
    try {
      const res = await this.fetchWithTimeout(`${this.API_BASE}/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId, action: action || "toggle" })
      }, 8000);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      if (json.success && json.data) {
        const updated = json.data;
        const updateInList = (list) => {
          if (!Array.isArray(list)) return;
          const idx = list.findIndex(e => (e._id === eventId || e.eventId === eventId || e.id === eventId));
          if (idx !== -1) list[idx] = updated;
        };
        if (this.staffCache && this.staffCache.events) updateInList(this.staffCache.events);
        if (this.studentCache && this.studentCache.events) updateInList(this.studentCache.events);
        if (this.adminCache && this.adminCache.events) updateInList(this.adminCache.events);
        return updated;
      } else {
        throw new Error(json.error || "Failed to update RSVP");
      }
    } catch (e) {
      console.error("Failed to update event RSVP:", e.message);
      throw e;
    }
  },

  // 8. Notifications
  markAllNotificationsRead: async function(role) {
    if (role === 'student') {
      if (this.data.student && this.data.student.notifications) {
        this.data.student.notifications.forEach(n => n.read = true);
      }
    } else if (role === 'staff') {
      if (this.data.staff && this.data.staff.notifications) {
        this.data.staff.notifications.forEach(n => n.read = true);
      }
    }
    this.save();
    try {
      const currentUser = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;
      const userId = currentUser ? (currentUser.studentId || currentUser.staffId || currentUser.id) : null;
      await fetch(`${this.API_BASE}/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, userId })
      });
    } catch (e) {
      console.warn('Mark all read sync offline:', e);
    }
  },

  dismissNotification: async function(role, notifId) {
    if (role === 'student') {
      if (this.data.student && this.data.student.notifications) {
        const idx = this.data.student.notifications.findIndex(n => n.id === notifId || n._id === notifId);
        if (idx !== -1) this.data.student.notifications.splice(idx, 1);
      }
    } else if (role === 'staff') {
      if (this.data.staff && this.data.staff.notifications) {
        const idx = this.data.staff.notifications.findIndex(n => n.id === notifId || n._id === notifId);
        if (idx !== -1) this.data.staff.notifications.splice(idx, 1);
      }
    }
    this.save();

    try {
      const currentUser = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;
      const userId = currentUser ? (currentUser.studentId || currentUser.staffId || currentUser.id) : null;
      await fetch(`${this.API_BASE}/notifications/${notifId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role })
      });
    } catch (e) {
      console.warn('Backend notification dismissal sync offline:', e);
    }
  },

  // Profile & User & Department Sync Actions
  updateStaffProfile: async function(staffId, updateData) {
    if (!this.data.staff) this.data.staff = {};
    if (!this.data.staff.profile) this.data.staff.profile = {};
    Object.assign(this.data.staff.profile, updateData);
    this.save();

    try {
      const targetId = staffId || (typeof Auth !== 'undefined' && Auth.getCurrentUser() ? Auth.getCurrentUser().id : 'STF101');
      const res = await fetch(`${this.API_BASE}/staff/profile/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Staff profile update API error:', e);
    }
    return { success: true, data: this.data.staff.profile };
  },

  updateStudent: async function(studentId, updateData) {
    const student = (this.data.admin.studentsList || []).find(s => s.id === studentId || s._id === studentId || s.studentId === studentId);
    if (student) {
      Object.assign(student, updateData);
      this.save();
    }
    try {
      const targetId = (student && student._id) ? student._id : studentId;
      const res = await fetch(`${this.API_BASE}/students/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Student update API error:', e);
    }
    return { success: true };
  },

  updateStaff: async function(staffId, updateData) {
    const staff = (this.data.admin.staffList || []).find(s => s.id === staffId || s._id === staffId || s.staffId === staffId);
    if (staff) {
      Object.assign(staff, updateData);
      this.save();
    }
    try {
      const targetId = (staff && staff._id) ? staff._id : staffId;
      const res = await fetch(`${this.API_BASE}/faculty/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Staff update API error:', e);
    }
    return { success: true };
  },

  addDepartment: async function(deptData) {
    const code = (deptData.code || '').trim().toUpperCase();
    const newDept = {
      id: code.toLowerCase(),
      code: code,
      name: deptData.name,
      hod: deptData.hod || 'Unassigned',
      facultyCount: Number(deptData.facultyCount) || 0,
      studentsCount: Number(deptData.studentsCount) || 0,
      coursesCount: Number(deptData.coursesCount) || 0
    };
    if (!this.data.admin.departmentsList) this.data.admin.departmentsList = [];
    
    // Check local duplicate
    const exists = this.data.admin.departmentsList.some(d => d.code === code);
    if (exists) {
      return { success: false, error: `Department code ${code} already exists.` };
    }

    this.data.admin.departmentsList.push(newDept);
    this.save();

    try {
      const res = await fetch(`${this.API_BASE}/admin/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDept)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const idx = this.data.admin.departmentsList.findIndex(d => d.code === code);
        if (idx !== -1) this.data.admin.departmentsList.splice(idx, 1);
        this.save();
        return { success: false, error: data.error || 'Failed to add department' };
      }
      newDept._id = data.data._id;
      this.save();
      return { success: true, data: newDept };
    } catch (e) {
      console.warn('Add department API error:', e);
      return { success: true, data: newDept };
    }
  },

  updateDepartment: async function(deptId, updateData) {
    const dept = (this.data.admin.departmentsList || []).find(d => d.id === deptId || d._id === deptId || d.code === deptId);
    if (dept) {
      Object.assign(dept, updateData);
      this.save();
    }
    try {
      const targetId = (dept && dept._id) ? dept._id : deptId;
      const res = await fetch(`${this.API_BASE}/admin/departments/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Update department API error:', e);
    }
    return { success: true };
  },

  deleteDepartment: async function(deptId) {
    const idx = (this.data.admin.departmentsList || []).findIndex(d => d.id === deptId || d._id === deptId || d.code === deptId);
    let targetId = deptId;
    if (idx !== -1) {
      const removed = this.data.admin.departmentsList.splice(idx, 1)[0];
      if (removed._id) targetId = removed._id;
      this.save();
    }
    try {
      await fetch(`${this.API_BASE}/admin/departments/${targetId}`, {
        method: 'DELETE'
      });
      return { success: true };
    } catch (e) {
      console.warn('Delete department API error:', e);
    }
    return { success: true };
  },

  // 9. AI Conversation Memory
  getAIChatHistory: function(role) {
    if (!this.data.aiChatHistory) this.data.aiChatHistory = {};
    if (!this.data.aiChatHistory[role]) {
      this.data.aiChatHistory[role] = [
        { sender: 'ai', text: `Hello! I am your ${role.toUpperCase()} AI Copilot. How can I assist your workflow today?` }
      ];
    }
    return this.data.aiChatHistory[role];
  },

  addAIChatMessage: function(role, sender, text) {
    const history = this.getAIChatHistory(role);
    history.push({ sender, text, timestamp: new Date().toISOString() });
    this.save();
  },

  clearAIChatHistory: function(role) {
    if (!this.data.aiChatHistory) this.data.aiChatHistory = {};
    this.data.aiChatHistory[role] = [
      { sender: 'ai', text: `Chat history cleared. How can I help you?` }
    ];
    this.save();
  },

  // 10. Audit Logging
  addAuditLog: function(action) {
    const user = Auth.getCurrentUser();
    const newLog = {
      id: "log" + (this.data.admin.auditLogs.length + 1),
      action: action,
      actor: `${user.name} (${user.role.toUpperCase()})`,
      target: "System Store",
      ip: "192.168.1." + Math.floor(10 + Math.random() * 80),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    this.data.admin.auditLogs.unshift(newLog);
  }
};

// Initialize Store
Store.init();
