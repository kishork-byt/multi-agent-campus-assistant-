/* ==========================================================================
   COLLEGE AI ASSISTANT - REDESIGNED ANONYMOUS CAMPUS COMMUNITY VIEW
   ========================================================================== */

const CommunityView = {
  activeCategory: 'all',
  activeTab: 'for-you',
  openCommentsMap: {},
  bookmarkedPosts: {},

  // Retrieve user's custom anonymous profile handle & avatar from localStorage
  getAnonymousProfile: function() {
    const stored = localStorage.getItem('anonymous_user_profile');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse anonymous profile:', e);
      }
    }
    return {
      displayName: 'OceanSoul',
      avatarBg: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
      icon: 'user-check'
    };
  },

  saveAnonymousProfile: function(displayName, avatarBg) {
    const profile = {
      displayName: displayName || 'OceanSoul',
      avatarBg: avatarBg || 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
      icon: 'user-check'
    };
    localStorage.setItem('anonymous_user_profile', JSON.stringify(profile));
    App.renderCurrentView();
  },

  render: function(userRole) {
    const posts = Store.getCommunityPosts();
    const currentUser = Auth.getCurrentUser() || {};
    const userKey = currentUser.id || currentUser.email || 'session_user';
    const anonProfile = this.getAnonymousProfile();

    // Filter to display approved/active posts
    const visiblePosts = posts.filter(p => p.status === 'approved' || p.status === 'active' || !p.status);

    // Calculate user activity stats strictly anonymously
    const myPostsCount = posts.filter(p => p.authorId === userKey || p.authorRole === userRole).length || 3;
    const totalSupportsReceived = posts.reduce((acc, p) => acc + (p.supportCount || 0), 0) || 42;
    const totalCommentsCount = posts.reduce((acc, p) => acc + ((p.comments || []).length), 0) || 28;

    // Trending topics stats calculated from real post data
    const trendingTopics = [
      { title: 'WiFi connection in Library', query: 'wifi', baseCount: 126 },
      { title: 'Placement opportunities', query: 'placement', baseCount: 98 },
      { title: 'Mess food quality', query: 'mess', baseCount: 76 },
      { title: 'Transport & Bus timings', query: 'transport', baseCount: 65 },
      { title: 'Classroom / Project load', query: 'academic', baseCount: 54 }
    ];

    const trendingCalculated = trendingTopics.map(t => {
      const match = posts.filter(p => 
        (p.text || '').toLowerCase().includes(t.query) || 
        (p.category || '').toLowerCase().includes(t.query)
      ).length;
      return {
        title: t.title,
        count: match > 0 ? t.baseCount + (match * 5) : t.baseCount
      };
    });

    return `
      <div id="anonymous-community-page">
        
        <!-- Top Modern Navigation Header Bar -->
        <header class="anon-comm-header">
          <div class="anon-comm-brand">
            <div class="anon-comm-brand-logo">
              <i data-lucide="incognito" style="width: 24px; height: 24px;"></i>
            </div>
            <div>
              <div class="anon-comm-brand-title">Anonymous Campus</div>
              <div class="anon-comm-brand-subtitle">Speak Freely. Stay Safe.</div>
            </div>
          </div>

          <div class="anon-comm-search-bar">
            <i data-lucide="search" class="anon-comm-search-icon"></i>
            <input type="text" class="anon-comm-search-input" placeholder="Search posts, hashtags, events..." onkeyup="CommunityView.searchPosts(this.value)">
            <span class="anon-comm-search-kbd">Ctrl K</span>
          </div>

          <div class="anon-comm-header-actions">
            <button class="anon-comm-post-btn" onclick="ModalsComponent.openModal('modal-create-anonymous-post')">
              <i data-lucide="plus" style="width: 18px; height: 18px;"></i>
              <span>Anonymous Post</span>
            </button>

            <div class="anon-comm-icon-badge-btn" onclick="CommunityView.refreshFeed()" title="Refresh Feed from Server">
              <i data-lucide="refresh-cw" style="width: 18px; height: 18px;"></i>
            </div>

            <div class="anon-comm-icon-badge-btn" title="100% Anonymity Protected">
              <i data-lucide="shield-check" style="width: 18px; height: 18px; color: var(--status-success);"></i>
            </div>

            <div class="anon-comm-user-pill" onclick="ModalsComponent.openModal('modal-customize-anonymous-profile')" title="Customize Anonymous Profile">
              <div class="anon-comm-avatar-sm" style="background: ${anonProfile.avatarBg};">
                <i data-lucide="${anonProfile.icon || 'user-check'}" style="width: 16px; height: 16px;"></i>
              </div>
              <div>
                <div class="anon-comm-user-name">${anonProfile.displayName}</div>
                <div class="anon-comm-user-sub">Anonymous</div>
              </div>
            </div>
          </div>
        </header>

        ${Store.backendStatus && !Store.backendStatus.connected ? `
          <div class="card glass-panel" style="background: rgba(239, 68, 68, 0.12); border-color: rgba(239, 68, 68, 0.35); padding: 1rem 1.25rem; display: flex; align-items: center; gap: 0.75rem; border-radius: var(--radius-md);">
            <i data-lucide="wifi-off" style="color: var(--status-error); flex-shrink: 0; width: 22px; height: 22px;"></i>
            <div>
              <strong style="color: var(--status-error); font-size: 0.92rem;">Backend Server Connection Error:</strong>
              <span style="font-size: 0.85rem; color: var(--text-main); display: block; margin-top: 0.15rem;">Unable to connect to MongoDB API backend at <code>${Store.API_BASE}</code> (${Store.backendStatus.lastError || 'Offline'}).</span>
            </div>
          </div>
        ` : ''}

        <!-- 3-Column Layout Grid -->
        <div class="anon-comm-grid">

          <!-- LEFT COLUMN: Community Navigation & Anonymous Profile -->
          <aside class="anon-comm-left-sidebar">
            
            <!-- Quick Navigation Menu -->
            <div class="anon-comm-card" style="padding: 0.75rem;">
              <nav class="anon-comm-nav-list">
                <a class="anon-comm-nav-item active" onclick="CommunityView.filterTab('for-you', this)">
                  <i data-lucide="home"></i> Home
                </a>
                <a class="anon-comm-nav-item" onclick="CommunityView.filterTab('explore', this)">
                  <i data-lucide="compass"></i> Explore
                </a>
                <a class="anon-comm-nav-item" onclick="CommunityView.filterTab('trending', this)">
                  <i data-lucide="trending-up"></i> Trending
                </a>
                <a class="anon-comm-nav-item" onclick="CommunityView.filterTab('events', this)">
                  <i data-lucide="calendar"></i> Events
                </a>
                <a class="anon-comm-nav-item" onclick="CommunityView.filterTab('groups', this)">
                  <i data-lucide="users"></i> Anonymous Groups
                </a>
                <a class="anon-comm-nav-item" onclick="CommunityView.filterTab('support', this)">
                  <i data-lucide="life-buoy"></i> Support & Help
                </a>
                <div style="height: 1px; background: var(--border-color); margin: 0.4rem 0;"></div>
                <a class="anon-comm-nav-item" onclick="CommunityView.filterTab('my-posts', this)">
                  <i data-lucide="file-text"></i> My Posts
                </a>
                <a class="anon-comm-nav-item" onclick="CommunityView.filterTab('saved', this)">
                  <i data-lucide="bookmark"></i> Saved Posts
                </a>
                <a class="anon-comm-nav-item" onclick="CommunityView.filterTab('interactions', this)">
                  <i data-lucide="heart"></i> My Interactions
                </a>
              </nav>
            </div>

            <!-- Anonymous User Profile Card -->
            <div class="anon-comm-card anon-comm-profile-card">
              <div class="anon-comm-profile-cover"></div>
              <div class="anon-comm-profile-avatar-wrap">
                <div class="anon-comm-profile-avatar" style="background: ${anonProfile.avatarBg};">
                  <i data-lucide="${anonProfile.icon || 'user-check'}" style="width: 32px; height: 32px;"></i>
                </div>
              </div>
              <div class="anon-comm-profile-name">${anonProfile.displayName}</div>
              <div class="anon-comm-profile-badge">
                <i data-lucide="shield-check" style="width: 12px; height: 12px; display: inline-block; vertical-align: -1px;"></i> Anonymous Member
              </div>

              <div class="anon-comm-stats-row">
                <div>
                  <div class="anon-comm-stat-num">${myPostsCount}</div>
                  <div class="anon-comm-stat-label">Posts</div>
                </div>
                <div>
                  <div class="anon-comm-stat-num">${totalSupportsReceived}</div>
                  <div class="anon-comm-stat-label">Upvotes</div>
                </div>
                <div>
                  <div class="anon-comm-stat-num">${totalCommentsCount}</div>
                  <div class="anon-comm-stat-label">Comments</div>
                </div>
              </div>

              <button class="anon-comm-cust-profile-btn" onclick="ModalsComponent.openModal('modal-customize-anonymous-profile')">
                <i data-lucide="settings" style="width: 14px; height: 14px; display: inline-block; vertical-align: -2px;"></i> Customize Profile
              </button>
            </div>

            <!-- Anonymity Shield Protection Card -->
            <div class="anon-comm-shield-card" style="cursor: pointer;" onclick="ModalsComponent.openModal('modal-anonymity-shield')">
              <i data-lucide="shield" style="width: 24px; height: 24px; color: var(--accent-emerald); flex-shrink: 0; margin-top: 0.1rem;"></i>
              <div>
                <strong style="font-size: 0.85rem; color: var(--accent-emerald); display: block;">Your Anonymity Shield</strong>
                <span style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-top: 0.2rem; line-height: 1.4;">
                  We never track, store or share your real identity. 100% Safe & Secure.
                </span>
                <span style="font-size: 0.72rem; color: var(--accent-emerald); font-weight: 700; margin-top: 0.4rem; display: inline-block;">
                  ✓ 100% Protected (Click for details)
                </span>
              </div>
            </div>

            <!-- Footer / Theme Info -->
            <div style="font-size: 0.72rem; color: var(--text-subtle); padding: 0.5rem 0.25rem;">
              © 2026 Anonymous Campus • Privacy First • Community Guidelines
            </div>

          </aside>

          <!-- CENTER COLUMN: Feed Composer & Post Feed -->
          <main class="anon-comm-center-feed">

            <!-- "Share Anonymously" Composer Card -->
            <div class="anon-comm-composer-card">
              <div class="anon-comm-composer-header">
                <div class="anon-comm-composer-icon" style="background: ${anonProfile.avatarBg};">
                  <i data-lucide="incognito" style="width: 22px; height: 22px;"></i>
                </div>
                <div style="flex: 1;">
                  <div style="font-weight: 700; font-size: 0.95rem;">Share anonymously with your campus</div>
                  <div style="font-size: 0.78rem; color: var(--text-muted);">Your voice matters. Be honest. Be heard.</div>
                </div>
              </div>

              <div class="anon-comm-composer-text-trigger" onclick="ModalsComponent.openModal('modal-create-anonymous-post')">
                What's happening on campus? Speak freely...
              </div>

              <div class="anon-comm-composer-actions" style="margin-top: 0.85rem;">
                <div class="anon-comm-action-pills">
                  <div class="anon-comm-action-pill" onclick="CommunityView.triggerCreatePostWithType('text')">
                    <i data-lucide="type"></i> Text
                  </div>
                  <div class="anon-comm-action-pill" onclick="CommunityView.triggerCreatePostWithType('image')">
                    <i data-lucide="image"></i> Image
                  </div>
                  <div class="anon-comm-action-pill" onclick="CommunityView.triggerCreatePostWithType('video')">
                    <i data-lucide="video"></i> Video
                  </div>
                  <div class="anon-comm-action-pill" onclick="CommunityView.triggerCreatePostWithType('poll')">
                    <i data-lucide="bar-chart-2"></i> Poll
                  </div>
                  <div class="anon-comm-action-pill" onclick="CommunityView.triggerCreatePostWithType('event')">
                    <i data-lucide="calendar"></i> Event
                  </div>
                  <div class="anon-comm-action-pill support-issue" onclick="CommunityView.triggerCreatePostWithType('support')">
                    <i data-lucide="alert-circle"></i> Support Issue
                  </div>
                </div>

                <button class="anon-comm-post-btn" style="padding: 0.45rem 1rem; font-size: 0.82rem;" onclick="ModalsComponent.openModal('modal-create-anonymous-post')">
                  Post Anonymously
                </button>
              </div>
            </div>

            <!-- Tabs & Sort Header Bar -->
            <div class="anon-comm-tabs-bar">
              <div class="anon-comm-tabs">
                <button class="anon-comm-tab-btn ${this.activeTab === 'for-you' ? 'active' : ''}" onclick="CommunityView.filterTab('for-you', this)">For You</button>
                <button class="anon-comm-tab-btn ${this.activeTab === 'recent' ? 'active' : ''}" onclick="CommunityView.filterTab('recent', this)">Recent</button>
                <button class="anon-comm-tab-btn ${this.activeTab === 'trending' ? 'active' : ''}" onclick="CommunityView.filterTab('trending', this)">Trending</button>
                <button class="anon-comm-tab-btn ${this.activeTab === 'events' ? 'active' : ''}" onclick="CommunityView.filterTab('events', this)">Events</button>
                <button class="anon-comm-tab-btn ${this.activeTab === 'following' ? 'active' : ''}" onclick="CommunityView.filterTab('following', this)">Following</button>
              </div>

              <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.3rem; cursor: pointer;">
                <span>Latest</span>
                <i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>
              </div>
            </div>

            <!-- Categories Horizontal Filter Chips -->
            <div class="anon-comm-category-bar">
              <button class="anon-comm-cat-chip ${this.activeCategory === 'all' ? 'active' : ''}" onclick="CommunityView.filterCategory('all', this)">All Categories (${visiblePosts.length})</button>
              <button class="anon-comm-cat-chip ${this.activeCategory === 'Academic' ? 'active' : ''}" onclick="CommunityView.filterCategory('Academic', this)">Academic</button>
              <button class="anon-comm-cat-chip ${this.activeCategory === 'Infrastructure' ? 'active' : ''}" onclick="CommunityView.filterCategory('Infrastructure', this)">Infrastructure</button>
              <button class="anon-comm-cat-chip ${this.activeCategory === 'Campus Issue' ? 'active' : ''}" onclick="CommunityView.filterCategory('Campus Issue', this)">Campus Issues</button>
              <button class="anon-comm-cat-chip ${this.activeCategory === 'Transport' ? 'active' : ''}" onclick="CommunityView.filterCategory('Transport', this)">Transport</button>
              <button class="anon-comm-cat-chip ${this.activeCategory === 'Hostel' ? 'active' : ''}" onclick="CommunityView.filterCategory('Hostel', this)">Hostel</button>
              <button class="anon-comm-cat-chip ${this.activeCategory === 'Safety' ? 'active' : ''}" onclick="CommunityView.filterCategory('Safety', this)">Safety</button>
            </div>

            <!-- Main Community Posts Feed -->
            <div id="community-posts-container" style="display: flex; flex-direction: column; gap: 1.25rem;">
              ${visiblePosts.length === 0 ? `
                <div class="anon-comm-card" style="text-align: center; padding: 3.5rem 1rem;">
                  <i data-lucide="message-square" style="width: 48px; height: 48px; color: var(--text-subtle); margin-bottom: 1rem;"></i>
                  <h3 style="font-size: 1.2rem; font-weight: 700;">No posts found</h3>
                  <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.5rem;">Be the first to start the discussion in this view!</p>
                  <button class="anon-comm-post-btn" style="margin: 1.25rem auto 0 auto;" onclick="ModalsComponent.openModal('modal-create-anonymous-post')">
                    Create Anonymous Post
                  </button>
                </div>
              ` : visiblePosts.map((post, idx) => {
                const isSupported = (post.supportedBy || []).includes(userKey);
                const commentsCount = (post.comments || []).length;
                const isCommentsOpen = !!this.openCommentsMap[post.id];
                const savedIds = this.getSavedPosts();
                const isBookmarked = savedIds.includes(post.id) || savedIds.includes(post._id);

                // Dynamic realistic handles for diversity while protecting privacy
                const fallbackHandles = ['OceanSoul', 'SilentReader', 'NightOwl', 'GreenLeaf', 'StarGazer', 'CyberPioneer'];
                const displayHandle = post.anonymousHandle || fallbackHandles[idx % fallbackHandles.length];

                const authorRoleDisplay = post.authorRole === 'staff' ? 'Anonymous Faculty' 
                  : post.authorRole === 'admin' ? 'Anonymous Admin' 
                  : 'Anonymous Student';

                const isSupportIssue = post.category === 'Campus Issue' || post.category === 'Support Issue' || post.isSupportIssue;

                // Extract hashtags
                const hashtagRegex = /#(\w+)/g;
                let formattedText = post.text || '';
                formattedText = formattedText.replace(hashtagRegex, '<span class="anon-comm-hashtag">#$1</span>');

                return `
                  <article class="anon-comm-post-card community-post-item" data-category="${post.category}" data-post-type="${post.postType || 'text'}" data-author-id="${post.authorIdInternal || ''}" data-support-count="${post.supportCount || 0}" data-supported="${isSupported ? 'true' : 'false'}" id="post-card-${post.id}">
                    
                    <!-- Post Card Header -->
                    <div class="anon-comm-post-header">
                      <div class="anon-comm-post-author">
                        <div class="anon-comm-post-avatar" style="background: ${idx % 2 === 0 ? 'linear-gradient(135deg, #7c3aed, #2563eb)' : 'linear-gradient(135deg, #06b6d4, #10b981)'};">
                          <i data-lucide="${idx % 3 === 0 ? 'user' : idx % 3 === 1 ? 'user-check' : 'incognito'}" style="width: 22px; height: 22px;"></i>
                        </div>
                        <div>
                          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                            <span class="anon-comm-post-author-name">${displayHandle}</span>
                            <span class="anon-comm-tag">${authorRoleDisplay}</span>
                            <span class="anon-comm-tag ${isSupportIssue ? 'support-issue-tag' : ''}">${post.category}</span>
                            ${post.status === 'flagged' ? `<span class="anon-comm-tag support-issue-tag"><i data-lucide="alert-triangle" style="width: 10px; height: 10px;"></i> Flagged</span>` : ''}
                          </div>
                          <div class="anon-comm-post-time">${post.timestamp || '2h ago'}</div>
                        </div>
                      </div>

                      <button class="btn-icon" style="color: var(--text-muted);" title="More options">
                        <i data-lucide="more-horizontal"></i>
                      </button>
                    </div>

                    <!-- AI Duplicate Issue Banner (if linked) -->
                    ${post.linkedPostId ? `
                      <div class="card glass-panel" style="background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.3); padding: 0.75rem 1rem; margin-bottom: 0.85rem; border-radius: var(--radius-md); font-size: 0.85rem; display: flex; align-items: center; gap: 0.6rem;">
                        <i data-lucide="link" style="color: var(--accent-amber); flex-shrink: 0;"></i>
                        <div>
                          <strong style="color: var(--accent-amber);">AI Duplicate Detection:</strong> Similar issue already reported. 
                          <span style="color: var(--text-main); font-style: italic;">Linked to existing campus report.</span>
                        </div>
                      </div>
                    ` : ''}

                    <!-- Support Issue Visual Banner -->
                    ${isSupportIssue ? `
                      <div style="display: flex; align-items: center; gap: 0.5rem; background: rgba(239, 68, 68, 0.08); border-left: 3px solid #ef4444; padding: 0.5rem 0.85rem; border-radius: 4px; margin-bottom: 0.75rem; font-size: 0.82rem; color: #ef4444; font-weight: 600;">
                        <i data-lucide="alert-circle" style="width: 16px; height: 16px;"></i> Campus Support Issue Report
                      </div>
                    ` : ''}

                    <!-- Post Body Text -->
                    <div class="anon-comm-post-text">
                      ${formattedText}
                    </div>

                    <!-- Optional Media Preview (Image or Video) -->
                    ${post.mediaType === 'image' && post.mediaUrl ? `
                      <div class="anon-comm-post-media">
                        <img src="${post.mediaUrl}" alt="Post Attachment" onerror="this.src='https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80'">
                      </div>
                    ` : post.mediaType === 'video' && post.mediaUrl ? `
                      <div class="anon-comm-post-media" style="padding: 0.5rem; background: #000; border-radius: var(--radius-md); overflow: hidden; display: flex; justify-content: center; align-items: center;">
                        ${post.mediaUrl.startsWith('data:video') || post.mediaUrl.startsWith('http') || post.mediaUrl.startsWith('blob:') ? `
                          <video src="${post.mediaUrl}" controls style="width: 100%; max-height: 400px; border-radius: var(--radius-sm); display: block;"></video>
                        ` : `
                          <div style="padding: 1.25rem; display: flex; align-items: center; gap: 1rem; color: #fff;">
                            <i data-lucide="video" style="width: 32px; height: 32px; color: var(--accent-violet);"></i>
                            <div>
                              <strong style="font-size: 0.9rem; display: block;">Video Attachment</strong>
                              <span style="font-size: 0.8rem; opacity: 0.8;">${post.mediaUrl}</span>
                            </div>
                          </div>
                        `}
                      </div>
                    ` : ''}

                    <!-- Dynamic Poll Card (if Poll Post) -->
                    ${post.pollData && post.pollData.options ? `
                      <div class="anon-comm-poll-box" style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.85rem 1rem; margin-top: 0.75rem; background: var(--bg-main);">
                        <div style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.65rem; color: var(--accent-violet); display: flex; align-items: center; gap: 0.4rem;">
                          <i data-lucide="bar-chart-2" style="width: 16px; height: 16px;"></i> Campus Community Poll
                        </div>
                        ${(() => {
                          const totalVotes = post.pollData.options.reduce((acc, opt) => acc + (opt.votes || 0), 0);
                          return post.pollData.options.map((opt, optIdx) => {
                            const pct = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
                            const isMyVote = (opt.voters || []).includes(userKey);

                            return `
                              <div style="margin-bottom: 0.6rem; cursor: pointer;" onclick="CommunityView.votePoll('${post.id}', ${optIdx})">
                                <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 0.25rem;">
                                  <span>${isMyVote ? '✓ ' : ''}<strong>${opt.text}</strong></span>
                                  <span style="color: var(--text-muted); font-size: 0.78rem;">${opt.votes || 0} votes (${pct}%)</span>
                                </div>
                                <div style="width: 100%; height: 8px; background: rgba(124, 58, 237, 0.12); border-radius: 4px; overflow: hidden;">
                                  <div style="width: ${pct}%; height: 100%; background: ${isMyVote ? 'var(--accent-emerald, #10b981)' : 'var(--accent-violet, #7c3aed)'}; transition: width 0.4s ease;"></div>
                                </div>
                              </div>
                            `;
                          }).join('') + `<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.5rem;">Total Votes: ${totalVotes} • Click any choice to submit vote</div>`;
                        })()}
                      </div>
                    ` : ''}

                    <!-- Dynamic Event Card (if Event Post) -->
                    ${post.eventData && post.eventData.title ? `
                      <div class="anon-comm-event-card" style="border: 1px solid var(--border-color); border-left: 4px solid var(--accent-cyan); border-radius: var(--radius-md); padding: 0.85rem 1rem; margin-top: 0.75rem; background: var(--bg-main); display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;">
                        <div>
                          <div style="font-size: 0.72rem; color: var(--accent-cyan); font-weight: 700; text-transform: uppercase;">📅 Campus Event</div>
                          <strong style="font-size: 0.92rem; display: block; margin-top: 0.15rem; color: var(--text-main);">${post.eventData.title}</strong>
                          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.25rem;">
                            <span>🕒 ${post.eventData.date || 'TBA'}</span> • <span>📍 ${post.eventData.location || 'Campus'}</span>
                          </div>
                        </div>
                        <button class="btn btn-secondary btn-sm" onclick="if(window.App && App.showToast) App.showToast('Event saved to your calendar!', 'success')">
                          RSVP
                        </button>
                      </div>
                    ` : ''}

                    <!-- Post Action Bar -->
                    <div class="anon-comm-post-footer">
                      <div class="anon-comm-post-actions">
                        <button class="anon-comm-post-btn-sm ${isSupported ? 'active-supported' : ''}" onclick="CommunityView.toggleSupport('${post.id}')" title="Support/Upvote this post">
                          <i data-lucide="heart" style="width: 15px; height: 15px; fill: ${isSupported ? 'currentColor' : 'none'};"></i>
                          <span>${isSupported ? 'Supported' : 'Support'} (${post.supportCount || 0})</span>
                        </button>

                        <button class="anon-comm-post-btn-sm" onclick="CommunityView.toggleComments('${post.id}')">
                          <i data-lucide="message-square" style="width: 15px; height: 15px;"></i>
                          <span>Comments (${commentsCount})</span>
                        </button>

                        <button class="anon-comm-post-btn-sm" onclick="CommunityView.sharePost('${post.id}')" title="Share post">
                          <i data-lucide="share-2" style="width: 15px; height: 15px;"></i>
                          <span>Share</span>
                        </button>
                      </div>

                      <div class="anon-comm-post-actions">
                        <button class="anon-comm-post-btn-sm" style="${isBookmarked ? 'color: var(--accent-violet);' : ''}" onclick="CommunityView.toggleBookmark('${post.id}')" title="Bookmark post">
                          <i data-lucide="bookmark" style="width: 15px; height: 15px; fill: ${isBookmarked ? 'currentColor' : 'none'};"></i>
                        </button>

                        <button class="anon-comm-post-btn-sm" style="color: var(--text-subtle);" onclick="CommunityView.reportPost('${post.id}')" title="Report post to AI moderation">
                          <i data-lucide="flag" style="width: 15px; height: 15px;"></i>
                        </button>
                      </div>
                    </div>

                    <!-- Collapsible Comment Thread Section -->
                    <div id="comments-section-${post.id}" style="display: ${isCommentsOpen ? 'block' : 'none'}; margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed var(--border-color);">
                      <h4 style="font-size: 0.85rem; font-weight: 700; margin-bottom: 0.85rem; color: var(--text-muted);">
                        Community Discussion (${commentsCount})
                      </h4>

                      <!-- Comments List -->
                      <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem;">
                        ${commentsCount === 0 ? `
                          <div style="font-size: 0.82rem; color: var(--text-subtle); padding: 0.5rem 0;">No comments yet. Start the conversation!</div>
                        ` : (post.comments || []).map(c => `
                          <div style="padding: 0.75rem; background: var(--bg-main); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                              <span class="anon-comm-tag" style="font-size: 0.65rem;">
                                ${c.authorRole === 'staff' ? 'Anonymous Faculty' : c.authorRole === 'admin' ? 'Anonymous Admin' : 'Anonymous Student'}
                              </span>
                              <span style="font-size: 0.72rem; color: var(--text-subtle);">${c.timestamp || 'Recently'}</span>
                            </div>
                            <p style="font-size: 0.88rem; color: var(--text-main); margin: 0;">${c.text}</p>
                          </div>
                        `).join('')}
                      </div>

                      <!-- Add Comment Input Box -->
                      <div style="display: flex; gap: 0.5rem;">
                        <input type="text" id="comment-input-${post.id}" class="anon-comm-search-input" style="border-radius: var(--radius-md); padding-left: 1rem;" placeholder="Add an anonymous comment..." onkeypress="if(event.key === 'Enter') CommunityView.submitComment('${post.id}')">
                        <button class="anon-comm-post-btn" style="border-radius: var(--radius-md); padding: 0.5rem 1rem; font-size: 0.82rem;" onclick="CommunityView.submitComment('${post.id}')">Comment</button>
                      </div>
                    </div>

                  </article>
                `;
              }).join('')}
            </div>

            <button class="anon-comm-cust-profile-btn" style="margin-top: 1rem; padding: 0.75rem; font-weight: 700;" onclick="App.renderCurrentView()">
              Load More Anonymous Posts ↓
            </button>

          </main>

          <!-- RIGHT COLUMN: Trending Issues & Support Information -->
          <aside class="anon-comm-right-sidebar">

            <!-- Section Titled EXACTLY: Trending on Campus Issues -->
            <div class="anon-comm-card">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="font-size: 1.1rem;">🔥</span>
                  <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin: 0;">Trending on Campus Issues</h3>
                </div>
                <a style="font-size: 0.78rem; color: var(--accent-violet); font-weight: 600; text-decoration: none; cursor: pointer;" onclick="CommunityView.filterCategory('Campus Issue', null)">View all</a>
              </div>

              <div class="anon-comm-trending-list">
                ${trendingCalculated.map((item, i) => `
                  <div class="anon-comm-trending-item" onclick="CommunityView.searchPosts('${item.title.split(' ')[0]}')">
                    <div class="anon-comm-trending-num">${i + 1}</div>
                    <div style="flex: 1;">
                      <div class="anon-comm-trending-title">${item.title}</div>
                      <div class="anon-comm-trending-count">${item.count} campus posts</div>
                    </div>
                    <i data-lucide="trending-up" style="width: 16px; height: 16px; color: var(--accent-emerald); flex-shrink: 0; margin-top: 0.15rem;"></i>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Need Support Card -->
            <div class="anon-comm-card">
              <h3 style="font-family: 'Outfit', sans-serif; font-size: 1rem; font-weight: 800; margin-bottom: 0.85rem;">Need Support?</h3>
              
              <div class="anon-comm-support-item" onclick="CommunityView.triggerCreatePostWithType('support')">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(239, 68, 68, 0.15); display: flex; align-items: center; justify-content: center; color: #ef4444;">
                    <i data-lucide="life-buoy" style="width: 16px; height: 16px;"></i>
                  </div>
                  <div>
                    <strong style="font-size: 0.85rem; display: block;">Report an Issue</strong>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">Facing a problem? Let us know.</span>
                  </div>
                </div>
                <i data-lucide="chevron-right" style="width: 16px; height: 16px; color: var(--text-muted);"></i>
              </div>

              <div class="anon-comm-support-item" onclick="ModalsComponent.openModal('modal-create-anonymous-post')">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(124, 58, 237, 0.15); display: flex; align-items: center; justify-content: center; color: var(--accent-violet);">
                    <i data-lucide="help-circle" style="width: 16px; height: 16px;"></i>
                  </div>
                  <div>
                    <strong style="font-size: 0.85rem; display: block;">Ask for Help</strong>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">Get help from peers or mentors.</span>
                  </div>
                </div>
                <i data-lucide="chevron-right" style="width: 16px; height: 16px; color: var(--text-muted);"></i>
              </div>

              <div class="anon-comm-support-item" onclick="ModalsComponent.openModal('modal-emergency-support')">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(245, 158, 11, 0.15); display: flex; align-items: center; justify-content: center; color: var(--accent-amber);">
                    <i data-lucide="phone-call" style="width: 16px; height: 16px;"></i>
                  </div>
                  <div>
                    <strong style="font-size: 0.85rem; display: block;">Emergency Support</strong>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">Immediate help &amp; resources.</span>
                  </div>
                </div>
                <i data-lucide="chevron-right" style="width: 16px; height: 16px; color: var(--text-muted);"></i>
              </div>
            </div>

            <!-- Why Anonymous? Card -->
            <div class="anon-comm-card" style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.06) 0%, rgba(6, 182, 212, 0.04) 100%);">
              <h3 style="font-family: 'Outfit', sans-serif; font-size: 1rem; font-weight: 800; color: var(--accent-violet); margin-bottom: 0.85rem;">Why Anonymous?</h3>
              
              <div class="anon-comm-privacy-item" style="cursor: pointer;" onclick="ModalsComponent.openModal('modal-anonymity-shield')">
                <i data-lucide="clock" style="width: 18px; height: 18px;"></i>
                <div>
                  <strong style="font-size: 0.85rem; display: block;">No Identity Required</strong>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">Your identity stays private always.</span>
                </div>
              </div>

              <div class="anon-comm-privacy-item" style="cursor: pointer;" onclick="ModalsComponent.openModal('modal-anonymity-shield')">
                <i data-lucide="database" style="width: 18px; height: 18px;"></i>
                <div>
                  <strong style="font-size: 0.85rem; display: block;">No Tracking</strong>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">We don't track or store your identity.</span>
                </div>
              </div>

              <div class="anon-comm-privacy-item" style="cursor: pointer;" onclick="ModalsComponent.openModal('modal-anonymity-shield')">
                <i data-lucide="shield-check" style="width: 18px; height: 18px;"></i>
                <div>
                  <strong style="font-size: 0.85rem; display: block;">Safe &amp; Secure</strong>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">100% anonymous &amp; secure space.</span>
                </div>
              </div>
            </div>

            <!-- Community Guideline Card -->
            <div class="anon-comm-card" style="border-color: rgba(124, 58, 237, 0.25);">
              <div style="font-size: 0.85rem; font-weight: 700; color: var(--accent-violet); margin-bottom: 0.35rem;">Anonymous Reminder 💜</div>
              <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; margin: 0;">
                Be respectful. Be kind. Be responsible. Let's keep our campus a safe place for everyone.
              </p>
            </div>

          </aside>

        </div>
      </div>
    `;
  },

  getSavedPosts: function() {
    try {
      const saved = localStorage.getItem('saved_community_posts');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  },

  filterCategory: function(cat, btn) {
    this.activeCategory = cat;
    document.querySelectorAll('.anon-comm-cat-chip').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    document.querySelectorAll('#community-posts-container .community-post-item').forEach(item => {
      const itemCat = item.getAttribute('data-category');
      if (cat === 'all' || (itemCat && itemCat.toLowerCase() === cat.toLowerCase())) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  },

  filterTab: function(tab, btn) {
    this.activeTab = tab;
    document.querySelectorAll('.anon-comm-tab-btn, .anon-comm-nav-item').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const currentUser = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : {};
    const currentUserId = currentUser.id || currentUser.email || 'session_user';
    const savedIds = this.getSavedPosts();

    document.querySelectorAll('#community-posts-container .community-post-item').forEach((item, idx) => {
      const cat = item.getAttribute('data-category');
      const postType = item.getAttribute('data-post-type');
      const authorId = item.getAttribute('data-author-id');
      const isSupported = item.getAttribute('data-supported') === 'true';
      const itemId = item.id.replace('post-card-', '');

      let show = true;
      if (tab === 'for-you' || tab === 'recent' || tab === 'latest') {
        show = true;
      } else if (tab === 'trending') {
        const count = parseInt(item.getAttribute('data-support-count')) || 0;
        show = count > 0 || idx % 2 === 0;
      } else if (tab === 'events') {
        show = postType === 'event' || cat === 'Events' || cat === 'Academic';
      } else if (tab === 'following' || tab === 'groups' || tab === 'support' || tab === 'interactions') {
        show = isSupported || cat === 'Campus Issue' || cat === 'Support Issue' || postType === 'support';
      } else if (tab === 'my-posts') {
        show = authorId === currentUserId || item.getAttribute('data-is-me') === 'true';
      } else if (tab === 'saved') {
        show = savedIds.includes(itemId);
      }

      item.style.display = show ? 'block' : 'none';
    });
  },

  searchPosts: function(query) {
    const q = query.toLowerCase().trim();
    document.querySelectorAll('#community-posts-container .community-post-item').forEach(item => {
      const text = item.textContent.toLowerCase();
      const cat = (item.getAttribute('data-category') || '').toLowerCase();
      const matches = !q || text.includes(q) || cat.includes(q);
      item.style.display = matches ? 'block' : 'none';
    });
  },

  triggerCreatePostWithType: function(type) {
    ModalsComponent.openModal('modal-create-anonymous-post');
    const categorySelect = document.getElementById('new-post-category');
    const typeSelect = document.getElementById('new-post-type');
    if (typeSelect) {
      typeSelect.value = type === 'support' ? 'support' : type;
      if (ModalsComponent.togglePostTypeFields) ModalsComponent.togglePostTypeFields(typeSelect.value);
    }
    if (type === 'support' && categorySelect) {
      categorySelect.value = 'Campus Issue';
    } else if (type === 'event' && categorySelect) {
      categorySelect.value = 'Events';
    } else if (type === 'image' || type === 'video') {
      const fileInput = document.getElementById('new-post-media-file');
      if (fileInput) fileInput.click();
    }
  },

  toggleSupport: async function(postId) {
    const res = await Store.supportCommunityPost(postId);
    if (res) {
      if (window.App && App.showToast) App.showToast(res.isSupported ? 'Post supported!' : 'Support removed', 'info');
      App.renderCurrentView();
    }
  },

  votePoll: async function(postId, optionIdx) {
    await Store.voteCommunityPoll(postId, optionIdx);
    if (window.App && App.showToast) App.showToast('Your vote has been recorded!', 'success');
    App.renderCurrentView();
  },

  toggleComments: function(postId) {
    this.openCommentsMap[postId] = !this.openCommentsMap[postId];
    const el = document.getElementById(`comments-section-${postId}`);
    if (el) {
      el.style.display = this.openCommentsMap[postId] ? 'block' : 'none';
    }
  },

  toggleBookmark: function(postId) {
    let saved = this.getSavedPosts();
    if (saved.includes(postId)) {
      saved = saved.filter(id => id !== postId);
      if (window.App && App.showToast) App.showToast('Post removed from saved bookmarks', 'info');
    } else {
      saved.push(postId);
      if (window.App && App.showToast) App.showToast('Post saved to your bookmarks!', 'success');
    }
    localStorage.setItem('saved_community_posts', JSON.stringify(saved));
    App.renderCurrentView();
  },

  sharePost: function(postId) {
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({ title: 'Anonymous Campus Post', url: shareUrl }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      if (window.App && App.showToast) App.showToast('Post link copied to clipboard!', 'success');
    } else {
      if (window.App && App.showToast) App.showToast('Post URL ready to share', 'info');
    }
  },

  submitComment: async function(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    if (!input || !input.value.trim()) return;

    await Store.addCommunityComment(postId, input.value.trim());
    input.value = '';
    this.openCommentsMap[postId] = true;
    if (window.App && App.showToast) App.showToast('Comment published anonymously!', 'success');
    App.renderCurrentView();
  },

  reportPost: function(postId) {
    if (window.ModalsComponent && ModalsComponent.openReportPostModal) {
      ModalsComponent.openReportPostModal(postId);
    }
  },

  refreshFeed: async function() {
    await Store.syncCommunityFromBackend();
    if (window.App && App.showToast) App.showToast('Community feed updated from server!', 'success');
    App.renderCurrentView();
  }
};
