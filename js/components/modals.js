/* ==========================================================================
   COLLEGE AI ASSISTANT - REUSABLE MODALS COMPONENT (FUNCTIONAL ENGINE)
   ========================================================================== */

const ModalsComponent = {
  renderAddStudentModal: function() {
    return `
      <div class="modal-overlay" id="modal-add-student">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="card-title"><i data-lucide="user-plus"></i> Add New Student</h3>
            <button class="btn-icon" onclick="ModalsComponent.closeModal('modal-add-student')">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body">
            <form id="form-add-student" onsubmit="event.preventDefault(); ModalsComponent.handleStudentSubmit();">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" id="new-student-name" class="input-field" placeholder="e.g. Jordan Smith" required>
              </div>
              <div class="grid-cols-2">
                <div class="form-group">
                  <label class="form-label">Department</label>
                  <select id="new-student-dept" class="input-field select-field">
                    <option>Computer Science & Engineering</option>
                    <option>Data Science & AI</option>
                    <option>Electrical Eng.</option>
                    <option>Biotechnology</option>
                    <option>Mechanical Eng.</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Academic Year</label>
                  <select id="new-student-year" class="input-field select-field">
                    <option>Freshman</option>
                    <option>Sophomore</option>
                    <option>Junior</option>
                    <option>Senior</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Student Email</label>
                <input type="email" id="new-student-email" class="input-field" placeholder="jordan@university.edu" required>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="ModalsComponent.closeModal('modal-add-student')">Cancel</button>
            <button class="btn btn-primary" onclick="document.getElementById('form-add-student').requestSubmit()">Save Student Record</button>
          </div>
        </div>
      </div>
    `;
  },

  renderAddStaffModal: function() {
    return `
      <div class="modal-overlay" id="modal-add-staff">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="card-title"><i data-lucide="user-check"></i> Add Faculty Member</h3>
            <button class="btn-icon" onclick="ModalsComponent.closeModal('modal-add-staff')">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body">
            <form id="form-add-staff" onsubmit="event.preventDefault(); ModalsComponent.handleStaffSubmit();">
              <div class="form-group">
                <label class="form-label">Faculty Full Name</label>
                <input type="text" id="new-staff-name" class="input-field" placeholder="e.g. Dr. Alan Grant" required>
              </div>
              <div class="grid-cols-2">
                <div class="form-group">
                  <label class="form-label">Department</label>
                  <select id="new-staff-dept" class="input-field select-field">
                    <option>Computer Science & Engineering</option>
                    <option>Data Science & AI</option>
                    <option>Electrical Eng.</option>
                    <option>Biotechnology</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Role / Designation</label>
                  <select id="new-staff-role" class="input-field select-field">
                    <option>Assistant Professor</option>
                    <option>Associate Professor</option>
                    <option>Professor</option>
                    <option>Head of Department</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Official Email</label>
                <input type="email" id="new-staff-email" class="input-field" placeholder="a.grant@university.edu" required>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="ModalsComponent.closeModal('modal-add-staff')">Cancel</button>
            <button class="btn btn-primary" onclick="document.getElementById('form-add-staff').requestSubmit()">Register Faculty</button>
          </div>
        </div>
      </div>
    `;
  },

  renderNewAnnouncementModal: function() {
    return `
      <div class="modal-overlay" id="modal-add-announcement">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="card-title"><i data-lucide="megaphone"></i> Publish Campus Announcement</h3>
            <button class="btn-icon" onclick="ModalsComponent.closeModal('modal-add-announcement')">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body">
            <form id="form-add-announcement" onsubmit="event.preventDefault(); ModalsComponent.handleAnnouncementSubmit();">
              <div class="form-group">
                <label class="form-label">Announcement Title</label>
                <input type="text" id="new-ann-title" class="input-field" placeholder="e.g. Campus Holiday Notice" required>
              </div>
              <div class="grid-cols-2">
                <div class="form-group">
                  <label class="form-label">Target Audience</label>
                  <select id="new-ann-target" class="input-field select-field">
                    <option>All Students & Staff</option>
                    <option>Students Only</option>
                    <option>Staff Only</option>
                    <option>Faculty Heads</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Priority Level</label>
                  <select id="new-ann-priority" class="input-field select-field">
                    <option>Normal</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="ModalsComponent.closeModal('modal-add-announcement')">Cancel</button>
            <button class="btn btn-primary" onclick="document.getElementById('form-add-announcement').requestSubmit()">Publish Broadcast</button>
          </div>
        </div>
      </div>
    `;
  },

  renderScheduleFacultyEventModal: function() {
    return `
      <div class="modal-overlay" id="modal-add-faculty-event">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="card-title"><i data-lucide="calendar-plus"></i> Schedule Faculty Event</h3>
            <button class="btn-icon" onclick="ModalsComponent.closeModal('modal-add-faculty-event')">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body">
            <form id="form-add-faculty-event" onsubmit="event.preventDefault(); ModalsComponent.handleFacultyEventSubmit();">
              <div class="form-group">
                <label class="form-label">Event / Colloquium Title</label>
                <input type="text" id="new-fevent-title" class="input-field" placeholder="e.g. AI Research Symposium" required>
              </div>
              <div class="grid-cols-2">
                <div class="form-group">
                  <label class="form-label">Event Date</label>
                  <input type="text" id="new-fevent-date" class="input-field" placeholder="e.g. Sept 28, 2026" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Event Time</label>
                  <input type="text" id="new-fevent-time" class="input-field" placeholder="e.g. 10:00 AM - 12:00 PM" required>
                </div>
              </div>
              <div class="grid-cols-2">
                <div class="form-group">
                  <label class="form-label">Location / Room</label>
                  <input type="text" id="new-fevent-location" class="input-field" placeholder="e.g. Auditorium A" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Faculty Role</label>
                  <select id="new-fevent-role" class="input-field select-field">
                    <option>Faculty Organiser</option>
                    <option>Keynote Speaker</option>
                    <option>Panel Chair</option>
                    <option>Attendee</option>
                  </select>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="ModalsComponent.closeModal('modal-add-faculty-event')">Cancel</button>
            <button class="btn btn-primary" onclick="document.getElementById('form-add-faculty-event').requestSubmit()">Schedule Event</button>
          </div>
        </div>
      </div>
    `;
  },

  renderReserveVenueModal: function() {
    return `
      <div class="modal-overlay" id="modal-reserve-venue">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="card-title"><i data-lucide="calendar-plus"></i> Reserve Campus Venue</h3>
            <button class="btn-icon" onclick="ModalsComponent.closeModal('modal-reserve-venue')">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body">
            <form id="form-reserve-venue" onsubmit="event.preventDefault(); ModalsComponent.handleVenueReserveSubmit();">
              <div class="form-group">
                <label class="form-label">Event Name</label>
                <input type="text" id="new-venue-title" class="input-field" placeholder="e.g. Annual Tech Summit" required>
              </div>
              <div class="grid-cols-2">
                <div class="form-group">
                  <label class="form-label">Organizer / Department</label>
                  <input type="text" id="new-venue-organizer" class="input-field" placeholder="e.g. CS Department" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Requested Venue</label>
                  <select id="new-venue-name" class="input-field select-field">
                    <option>Main Auditorium</option>
                    <option>Tech Lab 102</option>
                    <option>Innovation Hub</option>
                    <option>Seminar Room B</option>
                    <option>Sports Arena</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Event Date</label>
                <input type="text" id="new-venue-date" class="input-field" placeholder="e.g. Oct 15, 2026" required>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="ModalsComponent.closeModal('modal-reserve-venue')">Cancel</button>
            <button class="btn btn-primary" onclick="document.getElementById('form-reserve-venue').requestSubmit()">Submit Venue Request</button>
          </div>
        </div>
      </div>
    `;
  },

  renderEventDetailsModal: function() {
    return `
      <div class="modal-overlay" id="modal-event-details">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="card-title"><i data-lucide="info"></i> Event & Venue Details</h3>
            <button class="btn-icon" onclick="ModalsComponent.closeModal('modal-event-details')">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body" id="modal-event-details-body">
            <!-- Dynamic Content Injected Here -->
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="ModalsComponent.closeModal('modal-event-details')">Close</button>
          </div>
        </div>
      </div>
    `;
  },

  renderCreateAnonymousPostModal: function() {
    return `
      <div class="modal-overlay" id="modal-create-anonymous-post">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="card-title"><i data-lucide="incognito"></i> Create Anonymous Post</h3>
            <button class="btn-icon" onclick="ModalsComponent.closeModal('modal-create-anonymous-post')">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body">
            <form id="form-create-anonymous-post" onsubmit="event.preventDefault(); ModalsComponent.handleCreateAnonymousPostSubmit();">
              <div class="form-group">
                <label class="form-label">Post Category</label>
                <select id="new-post-category" class="input-field select-field">
                  <option>Academic</option>
                  <option>Campus Issue</option>
                  <option>Infrastructure</option>
                  <option>Safety</option>
                  <option>Events</option>
                  <option>Transport</option>
                  <option>Hostel</option>
                  <option>Other</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Post Description / Feedback</label>
                <textarea id="new-post-text" class="input-field" rows="4" placeholder="Share your campus thoughts, feedback, or issues... Your real name and ID are strictly hidden." required style="resize: vertical; min-height: 100px;"></textarea>
              </div>

              <div class="grid-cols-2">
                <div class="form-group">
                  <label class="form-label">Media Attachment (Optional)</label>
                  <select id="new-post-media-type" class="input-field select-field">
                    <option value="none">None</option>
                    <option value="image">Image Attachment</option>
                    <option value="video">Video Attachment</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Attachment URL (Optional)</label>
                  <input type="text" id="new-post-media-url" class="input-field" placeholder="https://..." >
                </div>
              </div>

              <div class="card glass-panel" style="background: rgba(124, 58, 237, 0.1); border-color: rgba(124, 58, 237, 0.25); padding: 0.75rem 1rem; font-size: 0.82rem; margin-top: 0.5rem;">
                <i data-lucide="shield-check" style="color: var(--accent-violet);"></i> 
                <strong>Privacy Guarantee:</strong> This post will be published anonymously as "Anonymous Student" or "Anonymous Faculty".
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="ModalsComponent.closeModal('modal-create-anonymous-post')">Cancel</button>
            <button class="btn btn-primary" onclick="document.getElementById('form-create-anonymous-post').requestSubmit()">Publish Anonymous Post</button>
          </div>
        </div>
      </div>
    `;
  },

  openModal: function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  },

  closeModal: function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  },

  handleStudentSubmit: function() {
    const nameEl = document.getElementById('new-student-name');
    const deptEl = document.getElementById('new-student-dept');
    const yearEl = document.getElementById('new-student-year');
    const emailEl = document.getElementById('new-student-email');

    if (!nameEl || !nameEl.value.trim()) {
      alert('Please enter student name');
      return;
    }

    const newStudent = Store.addStudent({
      name: nameEl.value.trim(),
      dept: deptEl.value,
      year: yearEl.value,
      email: emailEl ? emailEl.value.trim() : ''
    });

    nameEl.value = '';
    if (emailEl) emailEl.value = '';

    this.closeModal('modal-add-student');
    App.renderCurrentView();
  },

  handleStaffSubmit: function() {
    const nameEl = document.getElementById('new-staff-name');
    const deptEl = document.getElementById('new-staff-dept');
    const roleEl = document.getElementById('new-staff-role');
    const emailEl = document.getElementById('new-staff-email');

    if (!nameEl || !nameEl.value.trim()) {
      alert('Please enter faculty name');
      return;
    }

    const newStaff = Store.addStaff({
      name: nameEl.value.trim(),
      dept: deptEl.value,
      role: roleEl.value,
      email: emailEl ? emailEl.value.trim() : ''
    });

    nameEl.value = '';
    if (emailEl) emailEl.value = '';

    this.closeModal('modal-add-staff');
    App.renderCurrentView();
  },

  handleAnnouncementSubmit: function() {
    const titleEl = document.getElementById('new-ann-title');
    const targetEl = document.getElementById('new-ann-target');
    const priorityEl = document.getElementById('new-ann-priority');

    if (!titleEl || !titleEl.value.trim()) {
      alert('Please enter announcement title');
      return;
    }

    const newAnn = Store.addAnnouncement({
      title: titleEl.value.trim(),
      target: targetEl.value,
      priority: priorityEl.value
    });

    titleEl.value = '';

    this.closeModal('modal-add-announcement');
    App.renderCurrentView();
  },

  handleFacultyEventSubmit: function() {
    const titleEl = document.getElementById('new-fevent-title');
    const dateEl = document.getElementById('new-fevent-date');
    const timeEl = document.getElementById('new-fevent-time');
    const locEl = document.getElementById('new-fevent-location');
    const roleEl = document.getElementById('new-fevent-role');

    if (!titleEl || !titleEl.value.trim()) {
      alert('Please enter event title');
      return;
    }

    const newEvent = Store.addStaffEvent({
      title: titleEl.value.trim(),
      date: dateEl.value.trim(),
      time: timeEl.value.trim(),
      location: locEl.value.trim(),
      role: roleEl.value
    });

    titleEl.value = '';

    this.closeModal('modal-add-faculty-event');
    App.renderCurrentView();
  },

  handleVenueReserveSubmit: function() {
    const titleEl = document.getElementById('new-venue-title');
    const orgEl = document.getElementById('new-venue-organizer');
    const venueEl = document.getElementById('new-venue-name');
    const dateEl = document.getElementById('new-venue-date');

    if (!titleEl || !titleEl.value.trim()) {
      alert('Please enter event title');
      return;
    }

    const newReservation = Store.addEventApproval({
      title: titleEl.value.trim(),
      organizer: orgEl.value.trim(),
      venue: venueEl.value,
      date: dateEl.value.trim(),
      status: "Pending Approval"
    });

    titleEl.value = '';

    this.closeModal('modal-reserve-venue');
    App.renderCurrentView();
  },

  showEventDetails: function(eventId) {
    const approvals = Store.getEventsApprovals();
    const event = approvals.find(e => e.id === eventId);
    if (!event) return;

    const body = document.getElementById('modal-event-details-body');
    if (body) {
      body.innerHTML = `
        <div style="padding: 0.5rem 0;">
          <span class="badge badge-${event.status === 'Approved' ? 'staff' : 'admin'}" style="margin-bottom: 0.75rem;">${event.status}</span>
          <h2 style="font-size: 1.4rem; font-weight: 800; margin-bottom: 0.75rem;">${event.title}</h2>
          <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.9rem; color: var(--text-muted);">
            <span><strong>Organizer:</strong> ${event.organizer}</span>
            <span><strong>Requested Venue:</strong> ${event.venue}</span>
            <span><strong>Event Date:</strong> ${event.date}</span>
            <span><strong>Description / Notes:</strong> ${event.details || 'Campus venue reservation request.'}</span>
          </div>
        </div>
      `;
    }
    this.openModal('modal-event-details');
    if (window.lucide) lucide.createIcons();
  },

  handleCreateAnonymousPostSubmit: function() {
    const categoryEl = document.getElementById('new-post-category');
    const textEl = document.getElementById('new-post-text');
    const mediaTypeEl = document.getElementById('new-post-media-type');
    const mediaUrlEl = document.getElementById('new-post-media-url');

    if (!textEl || !textEl.value.trim()) {
      alert('Please enter your post content.');
      return;
    }

    const text = textEl.value.trim();
    const category = categoryEl ? categoryEl.value : 'General';
    const mediaType = mediaTypeEl ? mediaTypeEl.value : 'none';
    const mediaUrl = mediaUrlEl ? mediaUrlEl.value.trim() : '';

    // Show confirmation before publishing
    if (!confirm('Confirm publishing this post anonymously to the Campus Community?')) {
      return;
    }

    // AI Pre-Screening check
    const aiAnalysis = Store.analyzePostAI(text, category);
    if (aiAnalysis.isToxic) {
      alert(`[AI Moderation Alert]\nYour post contains content flagged as inappropriate or abusive:\n"${aiAnalysis.reason}"\n\nPlease revise your message before submitting.`);
      return;
    }

    if (aiAnalysis.isDuplicate) {
      alert(`[AI Moderation Notice]\nA similar issue has already been reported in the ${category} category. Your post will be published and linked to the existing issue.`);
    }

    if (aiAnalysis.isSuspicious) {
      alert(`[AI Moderation Notice]\nYour post contains link patterns that require review. It will be marked as 'Flagged for Review' for campus safety.`);
    }

    // Add post to Store
    Store.addCommunityPost({
      category,
      text,
      mediaType,
      mediaUrl
    });

    // Reset inputs
    textEl.value = '';
    if (mediaUrlEl) mediaUrlEl.value = '';

    this.closeModal('modal-create-anonymous-post');
    App.renderCurrentView();
  }
};
