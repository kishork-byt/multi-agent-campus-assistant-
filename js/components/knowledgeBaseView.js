/* ==========================================================================
   CAMPUSNOVA - ADMIN KNOWLEDGE BASE MANAGEMENT VIEW COMPONENT
   Supports Document Upload, Chunking, Embedding Status, and pgvector Indexing.
   ========================================================================== */

const KnowledgeBaseView = {
  documents: [],
  selectedDocChunks: [],

  render: function() {
    return `
      <div>
        <!-- Portal Header -->
        <div class="card glass-panel" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(79, 70, 229, 0.1) 100%); margin-bottom: 1.5rem; border-color: rgba(16, 185, 129, 0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <span class="badge badge-staff" style="margin-bottom: 0.4rem;">Institutional RAG Engine</span>
              <h1 style="font-size: 1.75rem; font-weight: 800; margin: 0;">Campus Knowledge Base & Vector Store</h1>
              <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0.25rem 0 0 0;">
                Upload official regulations, chunk policies, generate 768-D vector embeddings, and govern role access.
              </p>
            </div>
            <button class="btn btn-primary" onclick="KnowledgeBaseView.openUploadModal()" style="background: linear-gradient(135deg, #10b981, #059669);">
              <i data-lucide="upload-cloud"></i> Upload Campus Document
            </button>
          </div>
        </div>

        <!-- System Stats Grid -->
        <div class="grid-cols-4" style="margin-bottom: 1.5rem;">
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981;"><i data-lucide="file-text"></i></div>
            <div class="stat-info">
              <span class="stat-value" id="kb-stat-docs">--</span>
              <span class="stat-label">Indexed Documents</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(99, 102, 241, 0.15); color: var(--primary-400);"><i data-lucide="database"></i></div>
            <div class="stat-info">
              <span class="stat-value" id="kb-stat-chunks">--</span>
              <span class="stat-label">Total Vector Chunks</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;"><i data-lucide="cpu"></i></div>
            <div class="stat-info">
              <span class="stat-value">768 Dim</span>
              <span class="stat-label">Vector Embedding</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(6, 182, 212, 0.15); color: #06b6d4;"><i data-lucide="shield-check"></i></div>
            <div class="stat-info">
              <span class="stat-value">Active</span>
              <span class="stat-label">Role-Based Access</span>
            </div>
          </div>
        </div>

        <!-- Documents Table Card -->
        <div class="card" style="padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
            <div class="input-group" style="max-width: 320px;">
              <input type="text" id="kb-search-input" class="input-field" placeholder="Search knowledge catalog..." onkeyup="KnowledgeBaseView.handleSearch(this.value)">
            </div>
            <button class="btn btn-secondary btn-sm" onclick="KnowledgeBaseView.loadDocuments()">
              <i data-lucide="refresh-cw"></i> Refresh Catalog
            </button>
          </div>

          <div class="table-responsive" style="overflow-x: auto;">
            <table class="table" style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid var(--border-color); text-align: left; font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase;">
                  <th style="padding: 0.75rem 1rem;">Document Title & ID</th>
                  <th style="padding: 0.75rem 1rem;">Category</th>
                  <th style="padding: 0.75rem 1rem;">Role Access</th>
                  <th style="padding: 0.75rem 1rem;">Chunks</th>
                  <th style="padding: 0.75rem 1rem;">Status</th>
                  <th style="padding: 0.75rem 1rem; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody id="kb-docs-table-body">
                <tr>
                  <td colspan="6" style="padding: 2rem; text-align: center; color: var(--text-muted);">
                    <i data-lucide="loader-2" style="width: 20px; height: 20px; animation: spin 1s linear infinite;"></i> Loading catalog...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Document Upload Modal Container -->
      <div id="kb-upload-modal-container"></div>
      <!-- Chunks Inspection Modal Container -->
      <div id="kb-chunks-modal-container"></div>
    `;
  },

  loadDocuments: async function() {
    const docs = await Store.getKnowledgeBaseDocs();
    this.documents = docs;

    const stats = await Store.getKnowledgeBaseStats();
    const docsEl = document.getElementById('kb-stat-docs');
    const chunksEl = document.getElementById('kb-stat-chunks');

    if (docsEl) docsEl.innerText = docs.length;
    if (chunksEl) chunksEl.innerText = stats?.totalChunks || (docs.length * 2);

    this.renderTable(docs);
  },

  renderTable: function(docs) {
    const tbody = document.getElementById('kb-docs-table-body');
    if (!tbody) return;

    if (docs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
            No campus documents indexed. Click "Upload Campus Document" to index your first policy.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = docs.map(doc => `
      <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.85rem; transition: background 0.15s;">
        <td style="padding: 0.85rem 1rem;">
          <strong style="color: var(--text-main); display: block;">${doc.title}</strong>
          <span style="font-family: monospace; font-size: 0.72rem; color: var(--text-muted);">${doc.documentId}</span>
        </td>
        <td style="padding: 0.85rem 1rem;">
          <span class="badge badge-primary" style="font-size: 0.7rem;">${doc.category}</span>
        </td>
        <td style="padding: 0.85rem 1rem;">
          <div style="display: flex; gap: 0.3rem; flex-wrap: wrap;">
            ${(doc.roleAccess || ['student']).map(r => `
              <span class="badge ${r === 'admin' ? 'badge-admin' : r === 'staff' ? 'badge-staff' : 'badge-primary'}" style="font-size: 0.65rem; padding: 1px 5px; text-transform: uppercase;">
                ${r}
              </span>
            `).join('')}
          </div>
        </td>
        <td style="padding: 0.85rem 1rem; font-weight: 600; color: var(--primary-400);">
          ${doc.chunkCount || 2} Chunks
        </td>
        <td style="padding: 0.85rem 1rem;">
          <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; font-weight: 700; font-size: 0.7rem;">
            <i data-lucide="check" style="width: 10px; height: 10px; vertical-align: middle;"></i> ${doc.status || 'COMPLETED'}
          </span>
        </td>
        <td style="padding: 0.85rem 1rem; text-align: right;">
          <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
            <button class="btn btn-secondary btn-sm" style="padding: 3px 8px; font-size: 0.74rem;" onclick="KnowledgeBaseView.inspectChunks('${doc.documentId}')">
              <i data-lucide="layers"></i> Chunks
            </button>
            <button class="btn btn-danger btn-sm" style="padding: 3px 8px; font-size: 0.74rem;" onclick="KnowledgeBaseView.deleteDoc('${doc.documentId}', '${doc.title.replace(/'/g, "\\'")}')">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    if (window.lucide) lucide.createIcons();
  },

  handleSearch: function(query) {
    if (!query) {
      this.renderTable(this.documents);
      return;
    }
    const q = query.toLowerCase();
    const filtered = this.documents.filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      d.documentId.toLowerCase().includes(q)
    );
    this.renderTable(filtered);
  },

  openUploadModal: function() {
    const container = document.getElementById('kb-upload-modal-container') || document.body;
    container.innerHTML = `
      <div class="modal-backdrop active" id="kb-upload-backdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem;">
        <div class="card" style="width: 100%; max-width: 600px; background: var(--surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.5rem; box-shadow: var(--shadow-lg);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <div class="brand-icon" style="width: 34px; height: 34px; background: linear-gradient(135deg, #10b981, #059669);">
                <i data-lucide="upload-cloud" style="width: 16px; height: 16px;"></i>
              </div>
              <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0;">Upload Campus Policy Document</h3>
            </div>
            <button class="btn-icon" onclick="KnowledgeBaseView.closeUploadModal()">
              <i data-lucide="x"></i>
            </button>
          </div>

          <form onsubmit="KnowledgeBaseView.handleUploadSubmit(event)">
            <div style="margin-bottom: 1rem;">
              <label style="display: block; font-size: 0.78rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.25rem;">Document Title</label>
              <input type="text" id="kb-up-title" class="input-field" style="width: 100%;" required placeholder="e.g. Student Research Grant Application Guidelines 2026">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
              <div>
                <label style="display: block; font-size: 0.78rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.25rem;">Policy Category</label>
                <select id="kb-up-category" class="input-field" style="width: 100%;">
                  <option value="Academic Regulations">Academic Regulations</option>
                  <option value="Examination">Examination</option>
                  <option value="Library">Library</option>
                  <option value="Hostel">Hostel</option>
                  <option value="Transport">Transport</option>
                  <option value="Scholarships">Scholarships</option>
                  <option value="Certificates & Procedures">Certificates & Procedures</option>
                  <option value="Faculty Policies">Faculty Policies</option>
                  <option value="Administrative Workflows">Administrative Workflows</option>
                  <option value="Campus Facilities">Campus Facilities</option>
                  <option value="General FAQs">General FAQs</option>
                </select>
              </div>
              <div>
                <label style="display: block; font-size: 0.78rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.25rem;">Department / Division</label>
                <input type="text" id="kb-up-dept" class="input-field" style="width: 100%;" value="Academic Affairs Directorate">
              </div>
            </div>

            <div style="margin-bottom: 1rem;">
              <label style="display: block; font-size: 0.78rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.35rem;">Role-Based Access Permissions</label>
              <div style="display: flex; gap: 1.5rem; font-size: 0.82rem;">
                <label><input type="checkbox" id="role-stu" checked> Student</label>
                <label><input type="checkbox" id="role-staff" checked> Faculty / Staff</label>
                <label><input type="checkbox" id="role-admin" checked> Admin</label>
              </div>
            </div>

            <div style="margin-bottom: 1.25rem;">
              <label style="display: block; font-size: 0.78rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.25rem;">Policy Text Content (Markdown / Sections)</label>
              <textarea id="kb-up-content" class="input-field" rows="6" style="width: 100%; resize: vertical;" required placeholder="Paste full policy regulations, criteria, eligibility, and steps..."></textarea>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
              <button type="button" class="btn btn-secondary" onclick="KnowledgeBaseView.closeUploadModal()">Cancel</button>
              <button type="submit" id="kb-submit-btn" class="btn btn-primary" style="background: linear-gradient(135deg, #10b981, #059669);">
                <i data-lucide="check"></i> Process & Index Vector Chunks
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  closeUploadModal: function() {
    const el = document.getElementById('kb-upload-backdrop');
    if (el) el.remove();
  },

  handleUploadSubmit: async function(e) {
    e.preventDefault();
    const btn = document.getElementById('kb-submit-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i data-lucide="loader-2" style="animation: spin 1s linear infinite;"></i> Processing & Chunking...';
      if (window.lucide) lucide.createIcons();
    }

    const title = document.getElementById('kb-up-title').value;
    const category = document.getElementById('kb-up-category').value;
    const department = document.getElementById('kb-up-dept').value;
    const content = document.getElementById('kb-up-content').value;

    const roles = [];
    if (document.getElementById('role-stu').checked) roles.push('student');
    if (document.getElementById('role-staff').checked) roles.push('staff');
    if (document.getElementById('role-admin').checked) roles.push('admin');

    const res = await Store.uploadKnowledgeBaseDoc({
      title,
      category,
      department,
      roleAccess: roles,
      content
    });

    this.closeUploadModal();

    if (res.success) {
      alert(`Success!\n\n${res.message}\nTotal Chunks Indexed: ${res.data?.chunkCount || 2}`);
      this.loadDocuments();
    } else {
      alert(`Upload Notice: ${res.error}`);
    }
  },

  inspectChunks: async function(documentId) {
    const chunks = await Store.getKnowledgeBaseChunks(documentId);
    const container = document.getElementById('kb-chunks-modal-container') || document.body;

    container.innerHTML = `
      <div class="modal-backdrop active" id="kb-chunks-backdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem;">
        <div class="card" style="width: 100%; max-width: 680px; max-height: 85vh; background: var(--surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.5rem; display: flex; flex-direction: column; box-shadow: var(--shadow-lg);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
            <div>
              <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0;">Extracted Vector Chunks Inspection</h3>
              <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0.15rem 0 0 0;">Document ID: <code>${documentId}</code> • ${chunks.length} Chunks</p>
            </div>
            <button class="btn-icon" onclick="document.getElementById('kb-chunks-backdrop').remove()">
              <i data-lucide="x"></i>
            </button>
          </div>

          <div style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 0.85rem; padding-right: 0.25rem;">
            ${chunks.map((c, i) => `
              <div style="padding: 0.85rem 1rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; font-size: 0.75rem;">
                  <strong style="color: var(--primary-400);">Chunk #${i + 1} (${c.chunkId})</strong>
                  <span class="badge badge-staff" style="font-size: 0.65rem;">Embedding: ${c.embeddingDimension || 768} Float Values</span>
                </div>
                <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.45; margin: 0;">
                  ${c.content}
                </p>
              </div>
            `).join('')}
          </div>

          <div style="margin-top: 1rem; text-align: right;">
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('kb-chunks-backdrop').remove()">Close</button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  deleteDoc: async function(docId, title) {
    if (confirm(`Are you sure you want to delete "${title}" and remove all its vector embeddings from the knowledge base?`)) {
      await Store.deleteKnowledgeBaseDoc(docId);
      this.loadDocuments();
    }
  }
};
