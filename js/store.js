/* ==========================================================================
   COLLEGE AI ASSISTANT - LOCAL DATA STORE ENGINE
   ========================================================================== */

const Store = {
  STORAGE_KEY: 'COLLEGE_AI_DATA_V1',

  data: null,
  backendStatus: { connected: true, lastError: null },

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
      const res = await fetch(`${this.API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, message, history })
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data && result.data.reply) {
          return { success: true, reply: result.data.reply };
        }
      }
      return { success: false, error: 'Received invalid response format from AI Assistant service.' };
    } catch (e) {
      console.warn('AI Chat API endpoint connection error:', e.message);
      return { success: false, error: 'Unable to connect to AI Assistant backend service. Please verify server is running.' };
    }
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
      category: postData.category || 'General',
      text: postData.text.trim(),
      mediaType: postData.mediaType || 'none',
      mediaUrl: postData.mediaUrl || '',
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
          category: newPost.category,
          text: newPost.text,
          mediaType: newPost.mediaType,
          mediaUrl: newPost.mediaUrl,
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

  API_BASE: 'http://localhost:5000/api',

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
                category: item.category,
                text: item.text,
                mediaType: item.mediaType || 'none',
                mediaUrl: item.mediaUrl || '',
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
                  category: p.category,
                  text: p.text,
                  mediaType: p.mediaType || 'none',
                  mediaUrl: p.mediaUrl || '',
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

  addStaffEvent: function(eventData) {
    const newEvent = {
      id: "se" + Date.now(),
      title: eventData.title,
      date: eventData.date || "Sept 25, 2026",
      time: eventData.time || "10:00 AM",
      location: eventData.location || "Conference Hall A",
      role: eventData.role || "Faculty Organiser",
      confirmed: false
    };
    this.data.staff.events.unshift(newEvent);
    this.addAuditLog(`Scheduled Faculty Event: ${newEvent.title}`);
    this.save();
    return newEvent;
  },

  toggleStaffEventConfirmation: function(eventId) {
    const event = this.data.staff.events.find(e => e.id === eventId);
    if (event) {
      event.confirmed = !event.confirmed;
      this.save();
      return event.confirmed;
    }
    return false;
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
      this.save();

      // Async Backend API Sync
      const targetId = removed._id || removed.id;
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
  addTask: function(taskData) {
    const newTask = {
      id: "t" + Date.now(),
      title: taskData.title,
      status: taskData.status || "todo",
      priority: taskData.priority || "High",
      dueDate: taskData.dueDate || "Due Today",
      desc: taskData.desc || ""
    };
    this.data.staff.tasks.push(newTask);
    this.save();
    return newTask;
  },

  updateTaskStatus: function(taskId, newStatus) {
    const task = this.data.staff.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = newStatus;
      this.save();
      return true;
    }
    return false;
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

  toggleEventRSVP: function(eventId) {
    const event = this.data.student.upcomingEvents.find(e => e.id === eventId);
    if (event) {
      event.rsvp = !event.rsvp;
      this.save();
      return event.rsvp;
    }
    return false;
  },

  // 8. Notifications
  markAllNotificationsRead: function(role) {
    if (role === 'student') {
      this.data.student.notifications.forEach(n => n.read = true);
    } else if (role === 'staff') {
      this.data.staff.notifications.forEach(n => n.read = true);
    }
    this.save();
  },

  dismissNotification: function(role, notifId) {
    if (role === 'student') {
      const idx = this.data.student.notifications.findIndex(n => n.id === notifId);
      if (idx !== -1) this.data.student.notifications.splice(idx, 1);
    } else if (role === 'staff') {
      const idx = this.data.staff.notifications.findIndex(n => n.id === notifId);
      if (idx !== -1) this.data.staff.notifications.splice(idx, 1);
    }
    this.save();
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
