/* ==========================================================================
   COLLEGE AI ASSISTANT - LOCAL DATA STORE ENGINE
   ========================================================================== */

const Store = {
  STORAGE_KEY: 'COLLEGE_AI_DATA_V1',

  data: null,

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
  getStudentNotifications: function() { return this.data.student.notifications; },
  getStudentTimetable: function() { return this.data.student.timetable; },
  getStudentCourses: function() { return this.data.student.courses; },
  getLibraryResources: function() { return this.data.student.libraryResources; },

  getStaffStats: function() { return this.data.staff.stats; },
  getStaffTasks: function() { return this.data.staff.tasks; },
  getStaffClasses: function() { return this.data.staff.classes; },
  getStaffNotifications: function() { return this.data.staff.notifications; },
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

  addCommunityPost: function(postData) {
    const user = Auth.getCurrentUser();
    const aiCheck = this.analyzePostAI(postData.text, postData.category || 'General');

    let status = 'active';
    let flagReason = null;
    let linkedPostId = null;

    if (aiCheck.isSuspicious) {
      status = 'flagged';
      flagReason = aiCheck.reason;
    }

    if (aiCheck.isDuplicate) {
      linkedPostId = aiCheck.matchedPostId;
      flagReason = aiCheck.reason;
    }

    const newPost = {
      id: "post_" + Date.now(),
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
      flagReason: flagReason,
      linkedPostId: linkedPostId
    };

    this.data.communityPosts.unshift(newPost);
    this.addAuditLog(`Created Anonymous Campus Post (${newPost.category})`);
    this.save();

    return { post: newPost, aiCheck };
  },

  supportCommunityPost: function(postId) {
    const user = Auth.getCurrentUser();
    const post = this.getCommunityPosts().find(p => p.id === postId);
    if (!post) return false;

    if (!post.supportedBy) post.supportedBy = [];

    // Prevent duplicate support from same user/session
    const userKey = user.id || user.email || 'session_user';
    if (post.supportedBy.includes(userKey)) {
      post.supportedBy = post.supportedBy.filter(k => k !== userKey);
      post.supportCount = Math.max(0, post.supportCount - 1);
    } else {
      post.supportedBy.push(userKey);
      post.supportCount = (post.supportCount || 0) + 1;
    }

    this.save();
    return { supportCount: post.supportCount, isSupported: post.supportedBy.includes(userKey) };
  },

  addCommunityComment: function(postId, commentText) {
    const user = Auth.getCurrentUser();
    const post = this.getCommunityPosts().find(p => p.id === postId);
    if (!post || !commentText.trim()) return false;

    if (!post.comments) post.comments = [];

    const newComment = {
      id: "c_" + Date.now(),
      authorRole: user.role || 'student', // Displayed anonymously
      text: commentText.trim(),
      timestamp: 'Just now'
    };

    post.comments.push(newComment);
    this.save();
    return newComment;
  },

  moderateCommunityPost: function(postId, action) {
    const posts = this.getCommunityPosts();
    const idx = posts.findIndex(p => p.id === postId);
    if (idx === -1) return false;

    const post = posts[idx];
    if (action === 'approve') {
      post.status = 'active';
      post.flagReason = null;
    } else if (action === 'hide') {
      post.status = 'hidden';
    } else if (action === 'remove') {
      posts.splice(idx, 1);
    }

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

  // 2. Students CRUD
  addStudent: function(studentData) {
    const newStudent = {
      id: "STU-" + Math.floor(100 + Math.random() * 900),
      name: studentData.name,
      dept: studentData.dept,
      year: studentData.year,
      cgpa: studentData.cgpa || "3.75",
      status: "Active",
      email: studentData.email || `${studentData.name.toLowerCase().replace(/\s+/g, '.')}@university.edu`
    };
    this.data.admin.studentsList.unshift(newStudent);
    this.data.admin.stats.totalStudents += 1;
    this.addAuditLog(`Created New Student Record: ${newStudent.name} (${newStudent.id})`);
    this.save();
    return newStudent;
  },

  deleteStudent: function(studentId) {
    const idx = this.data.admin.studentsList.findIndex(s => s.id === studentId);
    if (idx !== -1) {
      const removed = this.data.admin.studentsList.splice(idx, 1)[0];
      this.data.admin.stats.totalStudents = Math.max(0, this.data.admin.stats.totalStudents - 1);
      this.addAuditLog(`Deleted Student Record: ${removed.name} (${removed.id})`);
      this.save();
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
    const newStaff = {
      id: "STF-" + Math.floor(200 + Math.random() * 800),
      name: staffData.name,
      dept: staffData.dept,
      role: staffData.role,
      courses: 2,
      status: "Active",
      email: staffData.email || `${staffData.name.toLowerCase().replace(/\s+/g, '.')}@university.edu`
    };
    this.data.admin.staffList.unshift(newStaff);
    this.data.admin.stats.totalStaff += 1;
    this.addAuditLog(`Registered New Faculty Member: ${newStaff.name} (${newStaff.id})`);
    this.save();
    return newStaff;
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
  addAnnouncement: function(annData) {
    const newAnn = {
      id: "a" + Date.now(),
      title: annData.title,
      target: annData.target || "All Users",
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      author: annData.author || "System Administrator",
      priority: annData.priority || "Normal"
    };
    this.data.admin.announcements.unshift(newAnn);
    this.addAuditLog(`Published Broadcast Announcement: ${newAnn.title}`);
    this.save();
    return newAnn;
  },

  deleteAnnouncement: function(annId) {
    const idx = this.data.admin.announcements.findIndex(a => a.id === annId);
    if (idx !== -1) {
      this.data.admin.announcements.splice(idx, 1);
      this.save();
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
    const newReservation = {
      id: "ea" + Date.now(),
      title: eventData.title,
      organizer: eventData.organizer || "Faculty / Dept",
      venue: eventData.venue || "Main Auditorium",
      date: eventData.date || "Oct 12",
      status: eventData.status || "Pending Approval",
      details: eventData.details || "Official campus venue reservation request."
    };
    this.data.admin.eventsApprovals.unshift(newReservation);
    this.addAuditLog(`Created Venue Reservation: ${newReservation.title} (${newReservation.venue})`);
    this.save();
    return newReservation;
  },

  approveEvent: function(eventId) {
    const event = this.data.admin.eventsApprovals.find(e => e.id === eventId);
    if (event) {
      event.status = "Approved";
      this.addAuditLog(`Approved Venue Reservation: ${event.title}`);
      this.save();
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
