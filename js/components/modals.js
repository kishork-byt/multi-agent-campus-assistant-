/* ==========================================================================
   COLLEGE AI ASSISTANT - REUSABLE MODALS COMPONENT (FUNCTIONAL ENGINE)
   ========================================================================== */

const ModalsComponent = {
  selectedMedia: null,

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

  renderEditStudentModal: function() {
    return `
      <div class="modal-overlay" id="modal-edit-student">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="card-title"><i data-lucide="user-check"></i> Edit Student Record</h3>
            <button class="btn-icon" onclick="ModalsComponent.closeModal('modal-edit-student')">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body">
            <form id="form-edit-student" onsubmit="event.preventDefault(); ModalsComponent.handleEditStudentSubmit();">
              <input type="hidden" id="edit-student-id">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" id="edit-student-name" class="input-field" placeholder="e.g. Jordan Smith" required>
              </div>
              <div class="grid-cols-2">
                <div class="form-group">
                  <label class="form-label">Department</label>
                  <select id="edit-student-dept" class="input-field select-field">
                    <option>Computer Science & Engineering</option>
                    <option>Data Science & AI</option>
                    <option>Electrical Eng.</option>
                    <option>Biotechnology</option>
                    <option>Mechanical Eng.</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Academic Year</label>
                  <select id="edit-student-year" class="input-field select-field">
                    <option>Freshman</option>
                    <option>Sophomore</option>
                    <option>Junior</option>
                    <option>Senior</option>
                  </select>
                </div>
              </div>
              <div class="grid-cols-2">
                <div class="form-group">
                  <label class="form-label">Student Email</label>
                  <input type="email" id="edit-student-email" class="input-field" placeholder="jordan@university.edu" required>
                </div>
                <div class="form-group">
                  <label class="form-label">CGPA Score</label>
                  <input type="number" id="edit-student-gpa" class="input-field" step="0.01" min="0" max="4.0" placeholder="e.g. 3.85" required>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Attendance Rate (%)</label>
                <input type="number" id="edit-student-attendance" class="input-field" min="0" max="100" placeholder="e.g. 94" required>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="ModalsComponent.closeModal('modal-edit-student')">Cancel</button>
            <button class="btn btn-primary" onclick="document.getElementById('form-edit-student').requestSubmit()">Save Student Record</button>
          </div>
        </div>
      </div>
    `;
  },

  renderAddDepartmentModal: function() {
    return `
      <div class="modal-overlay" id="modal-add-department">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="card-title"><i data-lucide="building"></i> Add Academic Department</h3>
            <button class="btn-icon" onclick="ModalsComponent.closeModal('modal-add-department')">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body">
            <form id="form-add-department" onsubmit="event.preventDefault(); ModalsComponent.handleDepartmentSubmit();">
              <div class="grid-cols-2">
                <div class="form-group">
                  <label class="form-label">Department Code</label>
                  <input type="text" id="new-dept-code" class="input-field" placeholder="e.g. CSE, ECE, AI" required style="text-transform: uppercase;">
                </div>
                <div class="form-group">
                  <label class="form-label">Department Name</label>
                  <input type="text" id="new-dept-name" class="input-field" placeholder="e.g. Computer Science & Engineering" required>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Head of Department (HOD)</label>
                <input type="text" id="new-dept-hod" class="input-field" placeholder="e.g. Dr. Sarah Jenkins" required>
              </div>
              <div class="grid-cols-3">
                <div class="form-group">
                  <label class="form-label">Faculty Count</label>
                  <input type="number" id="new-dept-faculty" class="input-field" min="0" value="12" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Students Count</label>
                  <input type="number" id="new-dept-students" class="input-field" min="0" value="450" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Courses Count</label>
                  <input type="number" id="new-dept-courses" class="input-field" min="0" value="18" required>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="ModalsComponent.closeModal('modal-add-department')">Cancel</button>
            <button class="btn btn-primary" onclick="document.getElementById('form-add-department').requestSubmit()">Create Department</button>
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

  renderEditStaffModal: function() {
    return `
      <div class="modal-overlay" id="modal-edit-staff">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="card-title"><i data-lucide="user-check"></i> Edit Faculty Record</h3>
            <button class="btn-icon" onclick="ModalsComponent.closeModal('modal-edit-staff')">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body">
            <form id="form-edit-staff" onsubmit="event.preventDefault(); ModalsComponent.handleEditStaffSubmit();">
              <input type="hidden" id="edit-staff-id">
              <div class="form-group">
                <label class="form-label">Faculty Full Name</label>
                <input type="text" id="edit-staff-name" class="input-field" placeholder="e.g. Dr. Alan Grant" required>
              </div>
              <div class="grid-cols-2">
                <div class="form-group">
                  <label class="form-label">Department</label>
                  <select id="edit-staff-dept" class="input-field select-field">
                    <option>Computer Science & Engineering</option>
                    <option>Data Science & AI</option>
                    <option>Electrical Eng.</option>
                    <option>Biotechnology</option>
                    <option>Mechanical Eng.</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Designation / Role</label>
                  <select id="edit-staff-role" class="input-field select-field">
                    <option>Assistant Professor</option>
                    <option>Associate Professor</option>
                    <option>Professor</option>
                    <option>Head of Department</option>
                    <option>Lead AI Researcher</option>
                  </select>
                </div>
              </div>
              <div class="grid-cols-2">
                <div class="form-group">
                  <label class="form-label">Official Email</label>
                  <input type="email" id="edit-staff-email" class="input-field" placeholder="a.grant@university.edu" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Courses Assigned</label>
                  <input type="number" id="edit-staff-courses" class="input-field" min="0" max="10" required>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Faculty Status</label>
                <select id="edit-staff-status" class="input-field select-field">
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="On Sabbatical">On Sabbatical</option>
                </select>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="ModalsComponent.closeModal('modal-edit-staff')">Cancel</button>
            <button class="btn btn-primary" onclick="document.getElementById('form-edit-staff').requestSubmit()">Save Changes</button>
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
              <div class="form-group">
                <label class="form-label">Announcement Message</label>
                <textarea id="new-ann-message" class="input-field" rows="3" placeholder="Enter announcement details..." required style="resize: vertical; min-height: 80px;"></textarea>
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

  renderEditAnnouncementModal: function() {
    return `
      <div class="modal-overlay" id="modal-edit-announcement">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="card-title"><i data-lucide="megaphone"></i> Edit Campus Announcement</h3>
            <button class="btn-icon" onclick="ModalsComponent.closeModal('modal-edit-announcement')">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body">
            <form id="form-edit-announcement" onsubmit="event.preventDefault(); ModalsComponent.handleEditAnnouncementSubmit();">
              <input type="hidden" id="edit-ann-id">
              <div class="form-group">
                <label class="form-label">Announcement Title</label>
                <input type="text" id="edit-ann-title" class="input-field" placeholder="e.g. Campus Holiday Notice" required>
              </div>
              <div class="form-group">
                <label class="form-label">Announcement Message</label>
                <textarea id="edit-ann-message" class="input-field" rows="3" placeholder="Enter announcement details..." required style="resize: vertical; min-height: 80px;"></textarea>
              </div>
              <div class="grid-cols-2">
                <div class="form-group">
                  <label class="form-label">Target Audience</label>
                  <select id="edit-ann-target" class="input-field select-field">
                    <option>All Students & Staff</option>
                    <option>All Users</option>
                    <option>Students Only</option>
                    <option>Staff Only</option>
                    <option>Faculty Heads</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Priority Level</label>
                  <select id="edit-ann-priority" class="input-field select-field">
                    <option>Normal</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              </div>
              <div class="grid-cols-2">
                <div class="form-group">
                  <label class="form-label">Author / Publisher</label>
                  <input type="text" id="edit-ann-author" class="input-field" placeholder="e.g. Dean of Academics" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Publication Date</label>
                  <input type="text" id="edit-ann-date" class="input-field" placeholder="e.g. Aug 28, 2026" required>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="ModalsComponent.closeModal('modal-edit-announcement')">Cancel</button>
            <button class="btn btn-primary" onclick="document.getElementById('form-edit-announcement').requestSubmit()">Save Changes</button>
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

  renderEditVenueModal: function() {
    return `
      <div class="modal-overlay" id="modal-edit-venue">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="card-title"><i data-lucide="calendar"></i> Edit Campus Event / Reservation</h3>
            <button class="btn-icon" onclick="ModalsComponent.closeModal('modal-edit-venue')">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body">
            <form id="form-edit-venue" onsubmit="event.preventDefault(); ModalsComponent.handleEditVenueSubmit();">
              <input type="hidden" id="edit-venue-id">
              <div class="form-group">
                <label class="form-label">Event Name</label>
                <input type="text" id="edit-venue-title" class="input-field" placeholder="e.g. Annual Tech Summit" required>
              </div>
              <div class="grid-cols-2">
                <div class="form-group">
                  <label class="form-label">Organizer / Department</label>
                  <input type="text" id="edit-venue-organizer" class="input-field" placeholder="e.g. CS Department" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Requested Venue</label>
                  <select id="edit-venue-name" class="input-field select-field">
                    <option>Main Auditorium</option>
                    <option>Tech Lab 102</option>
                    <option>Innovation Hub</option>
                    <option>Seminar Room B</option>
                    <option>Sports Arena</option>
                    <option>Auditorium A</option>
                  </select>
                </div>
              </div>
              <div class="grid-cols-2">
                <div class="form-group">
                  <label class="form-label">Event Date</label>
                  <input type="text" id="edit-venue-date" class="input-field" placeholder="e.g. Oct 15, 2026" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Approval Status</label>
                  <select id="edit-venue-status" class="input-field select-field">
                    <option value="Approved">Approved</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Description / Notes</label>
                <input type="text" id="edit-venue-details" class="input-field" placeholder="Official campus venue reservation request.">
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="ModalsComponent.closeModal('modal-edit-venue')">Cancel</button>
            <button class="btn btn-primary" onclick="document.getElementById('form-edit-venue').requestSubmit()">Save Changes</button>
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
              <div class="grid-cols-2">
                <div class="form-group">
                  <label class="form-label">Post Category</label>
                  <select id="new-post-category" class="input-field select-field">
                    <option value="Academic">Academic</option>
                    <option value="Campus Issue">Campus Issue (Support Issue)</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Safety">Safety</option>
                    <option value="Events">Events</option>
                    <option value="Transport">Transport</option>
                    <option value="Hostel">Hostel</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Post Format / Type</label>
                  <select id="new-post-type" class="input-field select-field" onchange="ModalsComponent.togglePostTypeFields(this.value)">
                    <option value="text">Standard Text / Post</option>
                    <option value="image">Image Attachment</option>
                    <option value="video">Video Attachment</option>
                    <option value="poll">Campus Poll / Survey</option>
                    <option value="event">Campus Event Announcement</option>
                    <option value="support">Campus Support Issue Report</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Post Description / Issue Details</label>
                <textarea id="new-post-text" class="input-field" rows="4" placeholder="Share your campus thoughts, feedback, or report a support issue... Your real name and ID are strictly hidden." required style="resize: vertical; min-height: 100px;"></textarea>
              </div>

              <!-- Conditional Poll Fields -->
              <div id="new-post-poll-fields" style="display: none; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.85rem; background: var(--bg-main); margin-bottom: 1rem;">
                <label class="form-label" style="font-weight: 700;">Poll Choices</label>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;" id="poll-options-inputs">
                  <input type="text" class="input-field poll-option-input" placeholder="Choice 1 (e.g. Strongly Agree / Yes)">
                  <input type="text" class="input-field poll-option-input" placeholder="Choice 2 (e.g. Disagree / No)">
                  <input type="text" class="input-field poll-option-input" placeholder="Choice 3 (Optional)">
                </div>
              </div>

              <!-- Conditional Event Fields -->
              <div id="new-post-event-fields" style="display: none; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.85rem; background: var(--bg-main); margin-bottom: 1rem;">
                <label class="form-label" style="font-weight: 700;">Campus Event Details</label>
                <div class="grid-cols-2" style="margin-bottom: 0.5rem;">
                  <div>
                    <label class="form-label" style="font-size: 0.78rem;">Event Title</label>
                    <input type="text" id="new-post-event-title" class="input-field" placeholder="e.g. Tech Summit 2026">
                  </div>
                  <div>
                    <label class="form-label" style="font-size: 0.78rem;">Event Date &amp; Time</label>
                    <input type="text" id="new-post-event-date" class="input-field" placeholder="e.g. Oct 25, 4:00 PM">
                  </div>
                </div>
                <div>
                  <label class="form-label" style="font-size: 0.78rem;">Location / Venue</label>
                  <input type="text" id="new-post-event-loc" class="input-field" placeholder="e.g. Main Auditorium / Tech Hub">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" style="display: flex; justify-content: space-between; align-items: center;">
                  <span>Media Attachment (Optional)</span>
                </label>
                <small style="color: var(--text-muted); font-size: 0.8rem; display: block; margin-bottom: 0.5rem;">
                  Upload an image or video from your device (optional)
                </small>

                <!-- Hidden File Input -->
                <input type="file" id="new-post-media-file" accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/webm,video/quicktime,video/mov,image/*,video/*" style="display: none;" onchange="ModalsComponent.handlePostMediaSelect(this)">

                <!-- Device Upload Button / Click Zone -->
                <div id="new-post-media-upload-area" onclick="document.getElementById('new-post-media-file').click();" style="border: 2px dashed var(--border-color); border-radius: var(--radius-md); padding: 1.25rem 1rem; text-align: center; background: var(--bg-main); cursor: pointer; transition: all var(--transition-fast);">
                  <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                    <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(124, 58, 237, 0.12); color: var(--accent-violet); display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                      📎
                    </div>
                    <div>
                      <button type="button" class="btn btn-secondary btn-sm" style="pointer-events: none; margin-bottom: 0.35rem; font-weight: 600;">
                        📎 Upload from Device
                      </button>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">
                        Images (JPG, PNG, WEBP) &amp; Videos (MP4, WEBM, MOV)
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Selected Media Preview Box -->
                <div id="new-post-media-preview-container" style="display: none; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.85rem; background: var(--bg-main); margin-top: 0.5rem;">
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.65rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; overflow: hidden;">
                      <span id="new-post-media-file-icon" style="font-size: 1.1rem; flex-shrink: 0;">🖼️</span>
                      <div style="overflow: hidden;">
                        <div id="new-post-media-file-name" style="font-size: 0.85rem; font-weight: 600; color: var(--text-main); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">filename.jpg</div>
                        <div id="new-post-media-file-size" style="font-size: 0.75rem; color: var(--text-muted);">1.2 MB</div>
                      </div>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" style="color: var(--status-error); flex-shrink: 0; padding: 0.3rem 0.65rem;" onclick="ModalsComponent.clearPostMediaSelection()">
                      <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Remove
                    </button>
                  </div>
                  <div id="new-post-media-preview-box" style="border-radius: var(--radius-sm); overflow: hidden; max-height: 220px; background: #000; display: flex; justify-content: center; align-items: center;">
                  </div>
                </div>
              </div>

              <div class="card glass-panel" style="background: rgba(124, 58, 237, 0.1); border-color: rgba(124, 58, 237, 0.25); padding: 0.75rem 1rem; font-size: 0.82rem; margin-top: 0.5rem;">
                <i data-lucide="shield-check" style="color: var(--accent-violet);"></i> 
                <strong>Privacy Guarantee:</strong> Published anonymously with your custom handle (e.g. OceanSoul, SilentReader). Real identity is strictly hidden.
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

  renderCustomizeAnonymousProfileModal: function() {
    const currentProfile = (typeof CommunityView !== 'undefined' && CommunityView.getAnonymousProfile) ? CommunityView.getAnonymousProfile() : { displayName: 'OceanSoul' };

    return `
      <div class="modal-overlay" id="modal-customize-anonymous-profile">
        <div class="modal-content" style="max-width: 460px;">
          <div class="modal-header">
            <h3 class="card-title"><i data-lucide="settings"></i> Customize Anonymous Profile</h3>
            <button class="btn-icon" onclick="ModalsComponent.closeModal('modal-customize-anonymous-profile')">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body">
            <form id="form-customize-anonymous-profile" onsubmit="event.preventDefault(); ModalsComponent.handleCustomizeAnonymousProfileSubmit();">
              <div class="form-group">
                <label class="form-label">Anonymous Display Name</label>
                <input type="text" id="anon-custom-handle" class="input-field" value="${currentProfile.displayName || 'OceanSoul'}" placeholder="e.g. OceanSoul, NightOwl, SilentReader, GreenLeaf" required>
                <small style="color: var(--text-muted); font-size: 0.75rem; margin-top: 0.35rem; display: block;">
                  Pick a creative alias. Your real student/faculty name and ID remain 100% hidden.
                </small>
              </div>

              <div class="form-group">
                <label class="form-label">Avatar Theme Gradient</label>
                <select id="anon-custom-avatar-bg" class="input-field select-field">
                  <option value="linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)">Purple Violet (Default)</option>
                  <option value="linear-gradient(135deg, #06b6d4 0%, #10b981 100%)">Ocean Cyan & Emerald</option>
                  <option value="linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)">Pink & Sunset Violet</option>
                  <option value="linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)">Amber & Crimson Flame</option>
                  <option value="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)">Classic Deep Blue</option>
                </select>
              </div>

              <div class="card glass-panel" style="background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.25); padding: 0.75rem 1rem; font-size: 0.82rem;">
                <i data-lucide="shield-check" style="color: var(--accent-emerald);"></i> 
                <strong>Privacy Guaranteed:</strong> Changing your alias updates how you appear on the Anonymous Campus feed without linking to your actual portal identity.
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="ModalsComponent.closeModal('modal-customize-anonymous-profile')">Cancel</button>
            <button class="btn btn-primary" onclick="document.getElementById('form-customize-anonymous-profile').requestSubmit()">Save Profile</button>
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
    if (modalId === 'modal-create-anonymous-post') {
      this.clearPostMediaSelection();
    }
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

  openEditStudentModal: function(studentId) {
    const student = (Store.getStudentsList() || []).find(s => s.id === studentId || s._id === studentId || s.studentId === studentId);
    if (!student) return;

    const idEl = document.getElementById('edit-student-id');
    const nameEl = document.getElementById('edit-student-name');
    const deptEl = document.getElementById('edit-student-dept');
    const yearEl = document.getElementById('edit-student-year');
    const emailEl = document.getElementById('edit-student-email');
    const gpaEl = document.getElementById('edit-student-gpa');
    const attEl = document.getElementById('edit-student-attendance');

    if (idEl) idEl.value = student.id || student._id || studentId;
    if (nameEl) nameEl.value = student.name || '';
    if (deptEl) deptEl.value = student.dept || 'Computer Science & Engineering';
    if (yearEl) yearEl.value = student.year || 'Junior';
    if (emailEl) emailEl.value = student.email || '';
    if (gpaEl) gpaEl.value = student.gpa !== undefined ? student.gpa : (student.cgpa || 3.8);
    if (attEl) attEl.value = student.attendance !== undefined ? student.attendance : 90;

    this.openModal('modal-edit-student');
  },

  handleEditStudentSubmit: async function() {
    const idEl = document.getElementById('edit-student-id');
    const nameEl = document.getElementById('edit-student-name');
    const deptEl = document.getElementById('edit-student-dept');
    const yearEl = document.getElementById('edit-student-year');
    const emailEl = document.getElementById('edit-student-email');
    const gpaEl = document.getElementById('edit-student-gpa');
    const attEl = document.getElementById('edit-student-attendance');

    if (!idEl || !nameEl || !nameEl.value.trim()) {
      alert('Please enter student name');
      return;
    }

    const studentId = idEl.value;
    await Store.updateStudent(studentId, {
      name: nameEl.value.trim(),
      dept: deptEl.value,
      year: yearEl.value,
      email: emailEl.value.trim(),
      gpa: parseFloat(gpaEl.value) || 3.5,
      cgpa: parseFloat(gpaEl.value) || 3.5,
      attendance: parseInt(attEl.value) || 90
    });

    this.closeModal('modal-edit-student');
    if (window.App && App.showToast) App.showToast('Student record updated successfully!', 'success');
    App.renderCurrentView();
  },

  openAddDepartmentModal: function() {
    this.openModal('modal-add-department');
  },

  handleDepartmentSubmit: async function() {
    const codeEl = document.getElementById('new-dept-code');
    const nameEl = document.getElementById('new-dept-name');
    const hodEl = document.getElementById('new-dept-hod');
    const facEl = document.getElementById('new-dept-faculty');
    const stuEl = document.getElementById('new-dept-students');
    const crsEl = document.getElementById('new-dept-courses');

    if (!codeEl || !codeEl.value.trim() || !nameEl || !nameEl.value.trim()) {
      alert('Please fill out department code and name');
      return;
    }

    const res = await Store.addDepartment({
      code: codeEl.value.trim().toUpperCase(),
      name: nameEl.value.trim(),
      hod: hodEl ? hodEl.value.trim() : 'Unassigned',
      facultyCount: parseInt(facEl.value) || 0,
      studentsCount: parseInt(stuEl.value) || 0,
      coursesCount: parseInt(crsEl.value) || 0
    });

    if (!res.success) {
      alert(res.error || 'Failed to create department');
      return;
    }

    codeEl.value = '';
    nameEl.value = '';
    if (hodEl) hodEl.value = '';

    this.closeModal('modal-add-department');
    if (window.App && App.showToast) App.showToast('Department added successfully!', 'success');
    App.renderCurrentView();
  },

  openEditStaffModal: function(staffId) {
    const staff = Store.getStaffList().find(s => s.id === staffId || s._id === staffId);
    if (!staff) return;

    const idEl = document.getElementById('edit-staff-id');
    const nameEl = document.getElementById('edit-staff-name');
    const deptEl = document.getElementById('edit-staff-dept');
    const roleEl = document.getElementById('edit-staff-role');
    const emailEl = document.getElementById('edit-staff-email');
    const coursesEl = document.getElementById('edit-staff-courses');
    const statusEl = document.getElementById('edit-staff-status');

    if (idEl) idEl.value = staff.id || staff._id;
    if (nameEl) nameEl.value = staff.name || '';
    if (deptEl) deptEl.value = staff.dept || 'Computer Science & Engineering';
    if (roleEl) roleEl.value = staff.role || 'Assistant Professor';
    if (emailEl) emailEl.value = staff.email || '';
    if (coursesEl) coursesEl.value = staff.courses !== undefined ? staff.courses : 2;
    if (statusEl) statusEl.value = staff.status || 'Active';

    this.openModal('modal-edit-staff');
  },

  handleEditStaffSubmit: function() {
    const idEl = document.getElementById('edit-staff-id');
    const nameEl = document.getElementById('edit-staff-name');
    const deptEl = document.getElementById('edit-staff-dept');
    const roleEl = document.getElementById('edit-staff-role');
    const emailEl = document.getElementById('edit-staff-email');
    const coursesEl = document.getElementById('edit-staff-courses');
    const statusEl = document.getElementById('edit-staff-status');

    if (!idEl || !nameEl || !nameEl.value.trim()) {
      alert('Please enter faculty name');
      return;
    }

    const staffId = idEl.value;
    Store.updateStaff(staffId, {
      name: nameEl.value.trim(),
      dept: deptEl.value,
      role: roleEl.value,
      email: emailEl.value.trim(),
      courses: parseInt(coursesEl.value) || 0,
      status: statusEl.value
    });

    this.closeModal('modal-edit-staff');
    App.renderCurrentView();
  },

  handleAnnouncementSubmit: async function() {
    const titleEl = document.getElementById('new-ann-title');
    const msgEl = document.getElementById('new-ann-message');
    const targetEl = document.getElementById('new-ann-target');
    const priorityEl = document.getElementById('new-ann-priority');

    if (!titleEl || !titleEl.value.trim()) {
      alert('Please enter announcement title');
      return;
    }
    if (!msgEl || !msgEl.value.trim()) {
      alert('Please enter announcement message');
      return;
    }

    await Store.addAnnouncement({
      title: titleEl.value.trim(),
      message: msgEl.value.trim(),
      target: targetEl.value,
      priority: priorityEl.value
    });

    titleEl.value = '';
    msgEl.value = '';

    this.closeModal('modal-add-announcement');
    App.renderCurrentView();
  },

  openEditAnnouncementModal: function(annId) {
    const list = Store.getAnnouncements();
    const ann = list.find(a => a.id === annId || a._id === annId);
    if (!ann) return;

    const idEl = document.getElementById('edit-ann-id');
    const titleEl = document.getElementById('edit-ann-title');
    const msgEl = document.getElementById('edit-ann-message');
    const targetEl = document.getElementById('edit-ann-target');
    const priorityEl = document.getElementById('edit-ann-priority');
    const authorEl = document.getElementById('edit-ann-author');
    const dateEl = document.getElementById('edit-ann-date');

    if (idEl) idEl.value = ann.id || ann._id;
    if (titleEl) titleEl.value = ann.title || '';
    if (msgEl) msgEl.value = ann.message || '';
    if (targetEl) targetEl.value = ann.target || 'All Users';
    if (priorityEl) priorityEl.value = ann.priority || 'Normal';
    if (authorEl) authorEl.value = ann.author || 'System Administrator';
    if (dateEl) dateEl.value = ann.date || '';

    this.openModal('modal-edit-announcement');
  },

  handleEditAnnouncementSubmit: function() {
    const idEl = document.getElementById('edit-ann-id');
    const titleEl = document.getElementById('edit-ann-title');
    const msgEl = document.getElementById('edit-ann-message');
    const targetEl = document.getElementById('edit-ann-target');
    const priorityEl = document.getElementById('edit-ann-priority');
    const authorEl = document.getElementById('edit-ann-author');
    const dateEl = document.getElementById('edit-ann-date');

    if (!idEl || !titleEl || !titleEl.value.trim()) {
      alert('Please enter announcement title');
      return;
    }
    if (!msgEl || !msgEl.value.trim()) {
      alert('Please enter announcement message');
      return;
    }

    const annId = idEl.value;
    Store.updateAnnouncement(annId, {
      title: titleEl.value.trim(),
      message: msgEl.value.trim(),
      target: targetEl.value,
      priority: priorityEl.value,
      author: authorEl ? authorEl.value.trim() : 'System Administrator',
      date: dateEl ? dateEl.value.trim() : ''
    });

    this.closeModal('modal-edit-announcement');
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

    const submitBtn = document.querySelector('#modal-add-faculty-event .modal-footer .btn-primary');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Scheduling...';
    }

    try {
      await Store.addStaffEvent({
        title: titleEl.value.trim(),
        date: dateEl.value ? dateEl.value.trim() : 'Upcoming',
        time: timeEl.value ? timeEl.value.trim() : '10:00 AM',
        location: locEl.value ? locEl.value.trim() : 'Conference Room A',
        role: roleEl ? roleEl.value : 'Faculty Organiser'
      });

      titleEl.value = '';
      if (dateEl) dateEl.value = '';
      if (timeEl) timeEl.value = '';
      if (locEl) locEl.value = '';

      this.closeModal('modal-add-faculty-event');
      App.renderCurrentView();
    } catch (e) {
      alert('Failed to schedule event: ' + e.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Schedule Event';
      }
    }
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

  openEditVenueModal: function(eventId) {
    const approvals = Store.getEventsApprovals();
    const event = approvals.find(e => e.id === eventId || e._id === eventId);
    if (!event) return;

    const idEl = document.getElementById('edit-venue-id');
    const titleEl = document.getElementById('edit-venue-title');
    const orgEl = document.getElementById('edit-venue-organizer');
    const venueEl = document.getElementById('edit-venue-name');
    const dateEl = document.getElementById('edit-venue-date');
    const statusEl = document.getElementById('edit-venue-status');
    const detailsEl = document.getElementById('edit-venue-details');

    if (idEl) idEl.value = event.id || event._id;
    if (titleEl) titleEl.value = event.title || '';
    if (orgEl) orgEl.value = event.organizer || '';
    if (venueEl) venueEl.value = event.venue || 'Main Auditorium';
    if (dateEl) dateEl.value = event.date || '';
    if (statusEl) statusEl.value = event.status || 'Pending Approval';
    if (detailsEl) detailsEl.value = event.details || '';

    this.openModal('modal-edit-venue');
  },

  handleEditVenueSubmit: function() {
    const idEl = document.getElementById('edit-venue-id');
    const titleEl = document.getElementById('edit-venue-title');
    const orgEl = document.getElementById('edit-venue-organizer');
    const venueEl = document.getElementById('edit-venue-name');
    const dateEl = document.getElementById('edit-venue-date');
    const statusEl = document.getElementById('edit-venue-status');
    const detailsEl = document.getElementById('edit-venue-details');

    if (!idEl || !titleEl || !titleEl.value.trim()) {
      alert('Please enter event title');
      return;
    }

    const eventId = idEl.value;
    Store.updateEventApproval(eventId, {
      title: titleEl.value.trim(),
      organizer: orgEl.value.trim(),
      venue: venueEl.value,
      date: dateEl.value.trim(),
      status: statusEl.value,
      details: detailsEl ? detailsEl.value.trim() : ''
    });

    this.closeModal('modal-edit-venue');
    App.renderCurrentView();
  },

  showEventDetails: function(eventId) {
    let event = null;
    if (Store.staffCache && Store.staffCache.events) {
      event = Store.staffCache.events.find(e => (e._id === eventId || e.eventId === eventId || e.id === eventId));
    }
    if (!event && Store.studentCache && Store.studentCache.events) {
      event = Store.studentCache.events.find(e => (e._id === eventId || e.eventId === eventId || e.id === eventId));
    }
    if (!event && Store.adminCache && Store.adminCache.events) {
      event = Store.adminCache.events.find(e => (e._id === eventId || e.eventId === eventId || e.id === eventId));
    }
    if (!event) {
      const approvals = Store.getEventsApprovals();
      event = approvals.find(e => (e.id === eventId || e._id === eventId));
    }
    if (!event) return;

    const rsvps = Array.isArray(event.rsvps) ? event.rsvps : [];
    const rsvpCount = event.rsvpCount !== undefined ? event.rsvpCount : rsvps.length;

    const body = document.getElementById('modal-event-details-body');
    if (body) {
      body.innerHTML = `
        <div style="padding: 0.5rem 0;">
          <span class="badge badge-staff" style="margin-bottom: 0.75rem;">${event.category || event.tag || event.status || 'Approved'}</span>
          <h2 style="font-size: 1.4rem; font-weight: 800; margin-bottom: 0.75rem;">${Store.escapeHtml ? Store.escapeHtml(event.title) : event.title}</h2>
          <div style="display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.92rem; color: var(--text-muted);">
            <span><strong>Date & Time:</strong> ${event.date || 'Upcoming'} ${event.time ? '• ' + event.time : ''}</span>
            <span><strong>Location / Venue:</strong> ${event.location || event.venue || 'Campus Auditorium'}</span>
            <span><strong>Organizer:</strong> ${event.organizer || 'Faculty / Department'}</span>
            <span><strong>Registered Attendees:</strong> <strong>${rsvpCount}</strong> Users</span>
            <div style="margin-top: 0.5rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color); color: var(--text-color, #e2e8f0);">
              <strong>Event Description:</strong><br>
              <p style="margin-top: 0.35rem; line-height: 1.5; color: var(--text-muted);">${Store.escapeHtml ? Store.escapeHtml(event.desc || event.details || event.description || 'Campus academic event.') : (event.desc || event.details || 'Campus academic event.')}</p>
            </div>
          </div>
        </div>
      `;
    }
    this.openModal('modal-event-details');
    if (window.lucide) lucide.createIcons();
  },

  handleCreateAnonymousPostSubmit: async function() {
    const textEl = document.getElementById('new-post-text');
    const categoryEl = document.getElementById('new-post-category');

    if (!textEl || !textEl.value.trim()) {
      alert('Please enter your post content.');
      return;
    }

    const text = textEl.value.trim();
    const category = categoryEl ? categoryEl.value : 'General';
    const mediaType = this.selectedMedia ? this.selectedMedia.type : 'none';
    const mediaUrl = this.selectedMedia ? this.selectedMedia.dataUrl : '';

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

    const typeEl = document.getElementById('new-post-type');
    const postType = typeEl ? typeEl.value : (mediaType !== 'none' ? mediaType : 'text');

    let pollData = null;
    if (postType === 'poll') {
      const pollInputs = document.querySelectorAll('.poll-option-input');
      const options = [];
      pollInputs.forEach((inp, idx) => {
        if (inp.value.trim()) {
          options.push({ optionId: 'opt_' + (idx + 1), text: inp.value.trim(), votes: 0, voters: [] });
        }
      });
      if (options.length < 2) {
        options.push({ optionId: 'opt_1', text: 'Agree / Yes', votes: 0, voters: [] });
        options.push({ optionId: 'opt_2', text: 'Disagree / No', votes: 0, voters: [] });
      }
      pollData = { options };
    }

    let eventData = null;
    if (postType === 'event') {
      const title = document.getElementById('new-post-event-title')?.value.trim() || 'Campus Event';
      const date = document.getElementById('new-post-event-date')?.value.trim() || 'Upcoming';
      const location = document.getElementById('new-post-event-loc')?.value.trim() || 'Main Campus';
      eventData = { title, date, location };
    }

    // Add post to Store & Backend
    const anonProfile = (typeof CommunityView !== 'undefined' && CommunityView.getAnonymousProfile) ? CommunityView.getAnonymousProfile() : { displayName: 'OceanSoul' };

    await Store.addCommunityPost({
      category,
      text,
      mediaType,
      mediaUrl,
      postType,
      pollData,
      eventData,
      anonymousHandle: anonProfile.displayName
    });

    // Reset inputs
    textEl.value = '';
    this.clearPostMediaSelection();

    this.closeModal('modal-create-anonymous-post');
    App.renderCurrentView();
  },

  handlePostMediaSelect: function(input) {
    const file = input.files && input.files[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      alert('Please select a valid image (JPG, PNG, WEBP) or video (MP4, WEBM, MOV).');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const mediaType = isImage ? 'image' : 'video';
      const formattedSize = this.formatFileSize(file.size);

      this.selectedMedia = {
        type: mediaType,
        dataUrl: dataUrl,
        fileName: file.name,
        fileSize: formattedSize
      };

      const uploadArea = document.getElementById('new-post-media-upload-area');
      const previewContainer = document.getElementById('new-post-media-preview-container');
      const fileNameEl = document.getElementById('new-post-media-file-name');
      const fileSizeEl = document.getElementById('new-post-media-file-size');
      const iconEl = document.getElementById('new-post-media-file-icon');
      const previewBox = document.getElementById('new-post-media-preview-box');

      if (uploadArea) uploadArea.style.display = 'none';
      if (previewContainer) previewContainer.style.display = 'block';

      if (fileNameEl) fileNameEl.textContent = file.name;
      if (fileSizeEl) fileSizeEl.textContent = formattedSize;
      if (iconEl) iconEl.textContent = isImage ? '🖼️' : '🎬';

      if (previewBox) {
        if (isImage) {
          previewBox.innerHTML = `<img src="${dataUrl}" alt="Media Preview" style="max-width: 100%; max-height: 200px; object-fit: contain;">`;
        } else {
          previewBox.innerHTML = `<video src="${dataUrl}" controls style="max-width: 100%; max-height: 200px; border-radius: 4px;"></video>`;
        }
      }

      if (window.lucide) lucide.createIcons();
    };

    reader.readAsDataURL(file);
  },

  clearPostMediaSelection: function() {
    this.selectedMedia = null;
    const fileInput = document.getElementById('new-post-media-file');
    if (fileInput) fileInput.value = '';

    const uploadArea = document.getElementById('new-post-media-upload-area');
    const previewContainer = document.getElementById('new-post-media-preview-container');
    const previewBox = document.getElementById('new-post-media-preview-box');

    if (uploadArea) uploadArea.style.display = 'block';
    if (previewContainer) previewContainer.style.display = 'none';
    if (previewBox) previewBox.innerHTML = '';
  },

  formatFileSize: function(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  handleCustomizeAnonymousProfileSubmit: function() {
    const handleEl = document.getElementById('anon-custom-handle');
    const avatarBgEl = document.getElementById('anon-custom-avatar-bg');

    const displayName = handleEl ? handleEl.value.trim() : 'OceanSoul';
    const avatarBg = avatarBgEl ? avatarBgEl.value : 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)';

    if (typeof CommunityView !== 'undefined' && CommunityView.saveAnonymousProfile) {
      CommunityView.saveAnonymousProfile(displayName, avatarBg);
    }
    this.closeModal('modal-customize-anonymous-profile');
    if (window.App && App.showToast) App.showToast('Anonymous profile updated!', 'success');
  },

  togglePostTypeFields: function(type) {
    const pollFields = document.getElementById('new-post-poll-fields');
    const eventFields = document.getElementById('new-post-event-fields');
    const mediaGroup = document.getElementById('new-post-media-upload-area') ? document.getElementById('new-post-media-upload-area').parentElement : null;

    if (pollFields) pollFields.style.display = type === 'poll' ? 'block' : 'none';
    if (eventFields) eventFields.style.display = type === 'event' ? 'block' : 'none';
  },

  openReportPostModal: function(postId) {
    this.reportingPostId = postId;
    this.openModal('modal-report-post');
  },

  handleReportPostSubmit: async function() {
    const reasonEl = document.getElementById('report-post-reason');
    const detailsEl = document.getElementById('report-post-details');

    const reason = reasonEl ? reasonEl.value : 'Other';
    const details = detailsEl ? detailsEl.value.trim() : '';

    if (this.reportingPostId) {
      await Store.reportCommunityPostWithReason(this.reportingPostId, reason, details);
      this.closeModal('modal-report-post');
      if (window.App && App.showToast) App.showToast('Report submitted to Campus AI Moderation', 'success');
      App.renderCurrentView();
    }
  },

  renderReportPostModal: function() {
    return `
      <div class="modal-overlay" id="modal-report-post">
        <div class="modal-content" style="max-width: 480px;">
          <div class="modal-header">
            <h3 class="card-title"><i data-lucide="flag" style="color: var(--status-error);"></i> Report Anonymous Post</h3>
            <button class="btn-icon" onclick="ModalsComponent.closeModal('modal-report-post')">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body">
            <form id="form-report-post" onsubmit="event.preventDefault(); ModalsComponent.handleReportPostSubmit();">
              <div class="form-group">
                <label class="form-label">Reason for Report</label>
                <select id="report-post-reason" class="input-field select-field">
                  <option value="Spam / Phishing">Spam or Phishing Link</option>
                  <option value="Hate Speech / Harassment">Harassment or Hate Speech</option>
                  <option value="Offensive Language">Abusive / Offensive Language</option>
                  <option value="Misinformation">False / Misleading Information</option>
                  <option value="Other">Other Community Guideline Violation</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Additional Details (Optional)</label>
                <textarea id="report-post-details" class="input-field" rows="3" placeholder="Explain why this post should be reviewed by Campus AI Moderation..."></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="ModalsComponent.closeModal('modal-report-post')">Cancel</button>
            <button class="btn btn-primary" style="background: var(--status-error);" onclick="document.getElementById('form-report-post').requestSubmit()">Submit Report</button>
          </div>
        </div>
      </div>
    `;
  },

  renderAnonymityShieldModal: function() {
    return `
      <div class="modal-overlay" id="modal-anonymity-shield">
        <div class="modal-content" style="max-width: 520px;">
          <div class="modal-header">
            <h3 class="card-title"><i data-lucide="shield-check" style="color: var(--accent-emerald);"></i> Your Anonymity Shield Protection</h3>
            <button class="btn-icon" onclick="ModalsComponent.closeModal('modal-anonymity-shield')">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body" style="display: flex; flex-direction: column; gap: 1rem;">
            <div class="card glass-panel" style="background: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.3); padding: 1rem; border-radius: var(--radius-md);">
              <strong style="color: var(--accent-emerald); font-size: 0.95rem; display: block; margin-bottom: 0.35rem;">100% Identity Protection Guaranteed</strong>
              <p style="font-size: 0.85rem; color: var(--text-main); margin: 0; line-height: 1.4;">
                Your real name, email address, student ID, and IP metadata are strictly hidden. Only your custom alias handle (e.g. <em>OceanSoul</em>) and general portal role (<em>Anonymous Student</em> / <em>Anonymous Faculty</em>) are displayed.
              </p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.85rem;">
              <div style="display: flex; align-items: center; gap: 0.65rem;">
                <i data-lucide="lock" style="color: var(--accent-violet);"></i>
                <span><strong>No Identity Tracking:</strong> Posts and comments are indexed by randomized token IDs.</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.65rem;">
                <i data-lucide="cpu" style="color: var(--accent-cyan);"></i>
                <span><strong>AI Moderation Guard:</strong> Protects against hate speech and spam without human bias.</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.65rem;">
                <i data-lucide="check-circle" style="color: var(--accent-emerald);"></i>
                <span><strong>Encrypted Sessions:</strong> Custom handles update safely without linking to portal identity.</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" onclick="ModalsComponent.closeModal('modal-anonymity-shield')">Got It</button>
          </div>
        </div>
      </div>
    `;
  },

  renderEmergencySupportModal: function() {
    return `
      <div class="modal-overlay" id="modal-emergency-support">
        <div class="modal-content" style="max-width: 500px;">
          <div class="modal-header">
            <h3 class="card-title"><i data-lucide="phone-call" style="color: var(--accent-amber);"></i> Campus Emergency Helplines &amp; Support</h3>
            <button class="btn-icon" onclick="ModalsComponent.closeModal('modal-emergency-support')">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body" style="display: flex; flex-direction: column; gap: 1rem;">
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <div style="padding: 0.85rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-main);">
                <strong style="color: var(--status-error); font-size: 0.9rem; display: block;">Campus Security &amp; Safety Control Room</strong>
                <span style="font-size: 0.85rem; color: var(--text-main); font-weight: 700; display: block; margin-top: 0.2rem;">📞 +1 (800) 555-CAMPUS (Ext 911)</span>
                <span style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-top: 0.15rem;">Location: Admin Block A, Ground Floor (24/7 Security Desk)</span>
              </div>
              <div style="padding: 0.85rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-main);">
                <strong style="color: var(--accent-violet); font-size: 0.9rem; display: block;">Student Mental Health &amp; Counseling Helpline</strong>
                <span style="font-size: 0.85rem; color: var(--text-main); font-weight: 700; display: block; margin-top: 0.2rem;">📞 +1 (800) 555-CARE (Confidential)</span>
                <span style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-top: 0.15rem;">Available 24 hours a day for confidential counseling.</span>
              </div>
              <div style="padding: 0.85rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-main);">
                <strong style="color: var(--accent-emerald); font-size: 0.9rem; display: block;">Campus Health &amp; Medical Center</strong>
                <span style="font-size: 0.85rem; color: var(--text-main); font-weight: 700; display: block; margin-top: 0.2rem;">📞 +1 (800) 555-HEAL</span>
                <span style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-top: 0.15rem;">Location: Student Activity Center Block C</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="ModalsComponent.closeModal('modal-emergency-support')">Close</button>
          </div>
        </div>
      </div>
    `;
  }
};
