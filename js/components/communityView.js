/* ==========================================================================
   COLLEGE AI ASSISTANT - ANONYMOUS CAMPUS COMMUNITY VIEW COMPONENT
   ========================================================================== */

const CommunityView = {
  activeCategory: 'all',
  openCommentsMap: {},

  render: function(userRole) {
    const posts = Store.getCommunityPosts();
    const currentUser = Auth.getCurrentUser();
    const userKey = currentUser.id || currentUser.email || 'session_user';

    // Filter to display approved posts in public community feed
    const visiblePosts = posts.filter(p => p.status === 'approved' || p.status === 'active');

    return `
      <div>
        <!-- Hero Header -->
        <div class="card glass-panel" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%); margin-bottom: 2rem; border-color: rgba(139, 92, 246, 0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem;">
            <div>
              <span class="badge badge-primary" style="margin-bottom: 0.5rem;"><i data-lucide="shield"></i> 100% Privacy Preserved</span>
              <h1 style="font-size: 2rem; font-weight: 800;">Anonymous Campus Community</h1>
              <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.35rem; max-width: 680px;">
                Share feedback, report campus issues, discuss academic topics, and support peer initiatives. Your identity is always kept completely anonymous.
              </p>
            </div>
            <button class="btn btn-primary btn-lg" style="background: linear-gradient(135deg, #7c3aed, #2563eb);" onclick="ModalsComponent.openModal('modal-create-anonymous-post')">
              <i data-lucide="plus-circle"></i> Create Anonymous Post
            </button>
          </div>
        </div>

        ${Store.backendStatus && !Store.backendStatus.connected ? `
          <div class="card glass-panel" style="background: rgba(239, 68, 68, 0.12); border-color: rgba(239, 68, 68, 0.35); padding: 1rem 1.25rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
            <i data-lucide="wifi-off" style="color: var(--status-error); flex-shrink: 0; width: 22px; height: 22px;"></i>
            <div>
              <strong style="color: var(--status-error); font-size: 0.92rem;">Backend Server Connection Error:</strong>
              <span style="font-size: 0.85rem; color: var(--text-main); display: block; margin-top: 0.15rem;">Unable to connect to MongoDB API backend at <code>${Store.API_BASE}</code> (${Store.backendStatus.lastError || 'Offline'}).</span>
            </div>
          </div>
        ` : ''}

        <!-- Filter & Search Controls Bar -->
        <div class="card" style="margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div class="tabs-nav" style="border-bottom: none; margin-bottom: 0; padding-bottom: 0;">
              <button class="tab-btn ${this.activeCategory === 'all' ? 'active' : ''}" onclick="CommunityView.filterCategory('all', this)">All Categories (${visiblePosts.length})</button>
              <button class="tab-btn ${this.activeCategory === 'Academic' ? 'active' : ''}" onclick="CommunityView.filterCategory('Academic', this)">Academic</button>
              <button class="tab-btn ${this.activeCategory === 'Infrastructure' ? 'active' : ''}" onclick="CommunityView.filterCategory('Infrastructure', this)">Infrastructure</button>
              <button class="tab-btn ${this.activeCategory === 'Campus Issue' ? 'active' : ''}" onclick="CommunityView.filterCategory('Campus Issue', this)">Campus Issue</button>
              <button class="tab-btn ${this.activeCategory === 'Transport' ? 'active' : ''}" onclick="CommunityView.filterCategory('Transport', this)">Transport</button>
              <button class="tab-btn ${this.activeCategory === 'Hostel' ? 'active' : ''}" onclick="CommunityView.filterCategory('Hostel', this)">Hostel</button>
              <button class="tab-btn ${this.activeCategory === 'Safety' ? 'active' : ''}" onclick="CommunityView.filterCategory('Safety', this)">Safety</button>
            </div>
            <div class="input-group" style="max-width: 280px; flex: 1;">
              <i data-lucide="search" class="input-icon"></i>
              <input type="text" class="input-field" placeholder="Search posts..." onkeyup="CommunityView.searchPosts(this.value)">
            </div>
          </div>
        </div>

        <!-- Community Feed Container -->
        <div style="display: flex; flex-direction: column; gap: 1.5rem;" id="community-posts-container">
          ${visiblePosts.length === 0 ? `
            <div class="card" style="text-align: center; padding: 3rem 1rem;">
              <i data-lucide="message-square" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom: 1rem;"></i>
              <h3 style="font-size: 1.2rem; font-weight: 700;">No posts in this category yet</h3>
              <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.5rem;">Be the first to create an anonymous post in this category!</p>
            </div>
          ` : visiblePosts.map(post => {
            const isSupported = (post.supportedBy || []).includes(userKey);
            const commentsCount = (post.comments || []).length;
            const isCommentsOpen = !!this.openCommentsMap[post.id];
            
            // Format Author Role Badge strictly anonymously
            const authorRoleDisplay = post.authorRole === 'staff' ? 'Anonymous Faculty' 
              : post.authorRole === 'admin' ? 'Anonymous Admin' 
              : 'Anonymous Student';

            const authorBadgeClass = post.authorRole === 'staff' ? 'badge-staff' 
              : post.authorRole === 'admin' ? 'badge-admin' 
              : 'badge-student';

            // Check linked duplicate post text
            let linkedText = '';
            if (post.linkedPostId) {
              const linkedPost = posts.find(p => p.id === post.linkedPostId);
              if (linkedPost) linkedText = linkedPost.text;
            }

            return `
              <div class="card community-post-item" data-category="${post.category}" style="border: 1px solid var(--border-color); position: relative;">
                <!-- Post Header -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;">
                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div class="user-avatar" style="width: 42px; height: 42px; font-size: 1.1rem; background: var(--portal-gradient);">
                      <i data-lucide="user-check" style="width: 20px; height: 20px;"></i>
                    </div>
                    <div>
                      <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <strong style="font-size: 0.95rem;">${authorRoleDisplay}</strong>
                        <span class="badge ${authorBadgeClass}" style="font-size: 0.68rem;">${post.category}</span>
                        ${post.status === 'flagged' ? `<span class="badge badge-danger" style="font-size: 0.65rem;"><i data-lucide="alert-triangle" style="width: 10px; height: 10px;"></i> Flagged for Review</span>` : ''}
                      </div>
                      <span style="font-size: 0.78rem; color: var(--text-subtle);">${post.timestamp}</span>
                    </div>
                  </div>
                </div>

                <!-- Duplicate Issue Linked Alert Banner (if applicable) -->
                ${post.linkedPostId ? `
                  <div class="card glass-panel" style="background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.3); padding: 0.75rem 1rem; margin-bottom: 1rem; font-size: 0.85rem; display: flex; align-items: center; gap: 0.6rem;">
                    <i data-lucide="link" style="color: var(--accent-amber); flex-shrink: 0;"></i>
                    <div>
                      <strong style="color: var(--accent-amber);">AI Duplicate Detection:</strong> Similar issue already reported: 
                      <span style="color: var(--text-main); font-style: italic;">"${linkedText ? linkedText.substring(0, 70) + '...' : 'Original reported issue'}"</span>
                    </div>
                  </div>
                ` : ''}

                <!-- Post Body Content -->
                <p style="font-size: 0.95rem; line-height: 1.6; color: var(--text-main); margin-bottom: 1.25rem;">
                  ${post.text}
                </p>

                <!-- Optional Media Preview -->
                ${post.mediaType === 'image' && post.mediaUrl ? `
                  <div style="margin-bottom: 1.25rem; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-color); max-height: 320px;">
                    <img src="${post.mediaUrl}" alt="Post attachment" style="width: 100%; height: 100%; object-fit: cover;">
                  </div>
                ` : post.mediaType === 'video' && post.mediaUrl ? `
                  <div style="margin-bottom: 1.25rem; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-color); background: var(--bg-secondary); padding: 1rem; display: flex; align-items: center; gap: 0.75rem;">
                    <i data-lucide="video" style="width: 24px; height: 24px; color: var(--primary-400);"></i>
                    <span style="font-size: 0.85rem; color: var(--text-muted);">Video Attachment Attached (${post.mediaUrl})</span>
                  </div>
                ` : ''}

                <!-- Actions Footer Bar -->
                <div style="display: flex; align-items: center; gap: 0.85rem; padding-top: 1rem; border-top: 1px solid var(--border-color); flex-wrap: wrap;">
                  <button class="btn ${isSupported ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="CommunityView.toggleSupport('${post.id}')" title="Support this campus issue">
                    <i data-lucide="thumbs-up" style="width: 14px; height: 14px;"></i>
                    <span>${isSupported ? 'Supported ✓' : 'Support Issue'} (${post.supportCount || 0})</span>
                  </button>

                  <button class="btn btn-ghost btn-sm" onclick="CommunityView.toggleComments('${post.id}')">
                    <i data-lucide="message-square" style="width: 14px; height: 14px;"></i>
                    <span>Comments (${commentsCount})</span>
                  </button>

                  <button class="btn btn-ghost btn-sm" style="color: var(--text-muted); margin-left: auto;" onclick="CommunityView.reportPost('${post.id}')" title="Report suspicious or toxic content">
                    <i data-lucide="flag" style="width: 14px; height: 14px;"></i>
                    <span>Report</span>
                  </button>
                </div>

                <!-- Collapsible Comments Section -->
                <div id="comments-section-${post.id}" style="display: ${isCommentsOpen ? 'block' : 'none'}; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px dashed var(--border-color);">
                  <h4 style="font-size: 0.88rem; font-weight: 700; margin-bottom: 0.85rem; color: var(--text-muted);">
                    Community Comments (${commentsCount})
                  </h4>

                  <!-- Comment List -->
                  <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem;">
                    ${commentsCount === 0 ? `
                      <span style="font-size: 0.82rem; color: var(--text-subtle);">No comments yet. Start the discussion!</span>
                    ` : (post.comments || []).map(c => `
                      <div style="padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                          <span class="badge badge-student" style="font-size: 0.65rem;">
                            ${c.authorRole === 'staff' ? 'Anonymous Faculty' : c.authorRole === 'admin' ? 'Anonymous Admin' : 'Anonymous Student'}
                          </span>
                          <span style="font-size: 0.72rem; color: var(--text-subtle);">${c.timestamp || 'Recently'}</span>
                        </div>
                        <p style="font-size: 0.88rem; color: var(--text-main); margin: 0;">${c.text}</p>
                      </div>
                    `).join('')}
                  </div>

                  <!-- New Comment Form -->
                  <div style="display: flex; gap: 0.5rem;">
                    <input type="text" id="comment-input-${post.id}" class="input-field" placeholder="Add an anonymous comment..." onkeypress="if(event.key === 'Enter') CommunityView.submitComment('${post.id}')">
                    <button class="btn btn-primary btn-sm" onclick="CommunityView.submitComment('${post.id}')">Comment</button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  filterCategory: function(cat, btn) {
    this.activeCategory = cat;
    document.querySelectorAll('.tabs-nav .tab-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    document.querySelectorAll('#community-posts-container .community-post-item').forEach(item => {
      const itemCat = item.getAttribute('data-category');
      if (cat === 'all' || itemCat.toLowerCase() === cat.toLowerCase()) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  },

  searchPosts: function(query) {
    const q = query.toLowerCase().trim();
    document.querySelectorAll('#community-posts-container .community-post-item').forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(q) ? 'block' : 'none';
    });
  },

  toggleSupport: async function(postId) {
    const res = await Store.supportCommunityPost(postId);
    if (res) {
      App.renderCurrentView();
    }
  },

  toggleComments: function(postId) {
    this.openCommentsMap[postId] = !this.openCommentsMap[postId];
    const el = document.getElementById(`comments-section-${postId}`);
    if (el) {
      el.style.display = this.openCommentsMap[postId] ? 'block' : 'none';
    }
  },

  submitComment: async function(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    if (!input || !input.value.trim()) return;

    await Store.addCommunityComment(postId, input.value.trim());
    input.value = '';
    this.openCommentsMap[postId] = true;
    App.renderCurrentView();
  },

  reportPost: async function(postId) {
    if (confirm('Report this post to Campus AI Moderation for review?')) {
      await Store.moderateCommunityPost(postId, 'flag');
      alert('Post reported. AI Moderation team has been notified.');
      App.renderCurrentView();
    }
  }
};
