/**
 * Corporate Business Development CRM - Main Controller & Application Logic
 */

class CRMApplication {
  constructor() {
    this.currentTab = 'tab-dashboard';
    this.pipelineView = 'table'; // 'table' or 'kanban'
    this.activityView = 'timeline'; // 'timeline' or 'table'
    this.currency = window.crmStore.data.currency || 'INR';
    this.activeDrawerClientId = null;
    this.activeDeletingMemberId = null;
    this.activeDeletingSegmentId = null;
    this.activeDeletingUserId = null;
    this.pendingDeleteActivityId = null;
    this.pendingDeleteOppId = null;
    this.pendingDeleteInternalId = null;

    // Server auth state
    this.authUser = window.__CRM_AUTH_USER || null;
    this.serverPermissions = {}; // module_key -> {can_view, can_create, ...}
    this.allowedTabIds = [];    // tab IDs the user can access

    // Filter states
    this.dashboardFilters = { fy: 'FY2026-27', period: 'Sep', owner: '', segment: '', status: '' };
    this.clientFilters = { search: '', type: '', segment: '', priority: '', owner: '' };
    this.oppFilters = { search: '', stage: '', status: '', owner: '', segment: '' };
    this.activityFilters = { search: '', type: '', owner: '' };
    this.internalFilters = { search: '', category: '', dept: '', approval: '' };
    this.segFilters = { search: '', status: 'Active' };
    this.userFilters = { search: '', role: '', status: 'Active' };
    this.docFilters = { search: '', type: '', client: '', owner: '' };

    // Document & Attachment states
    this.docDisplayMode = 'grid'; // 'grid' or 'table'
    this.selectedActivityFiles = [];
    this.selectedModalDocFiles = [];
    this.activeViewerDocId = null;

    this.init();
  }

  init() {
    this.bindEvents();
    // Load real auth user from server, then initialize UI
    this.loadAuthUser().then(() => {
      this.updateUserSwitcherUI();
      this.enforceTabPermissions();
      this.populateDropdowns();
      this.refreshCurrentView();
      this.checkForcePasswordChange();
      this.renderPersonalizedGreeting();
    });
  }

  // ─── Auth User Loading ─────────────────────────────────────────────────────

  async loadAuthUser() {
    try {
      const res = await fetch('/api/auth/permissions', { credentials: 'same-origin' });
      if (res.status === 401) {
        console.info('Running in standalone / demo mode');
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        this.serverPermissions = data.permissions || {};
        this.allowedTabIds = data.allowed_tabs || [];
        // Sync server allowed segments to local store
        if (data.allowed_segments && window.crmStore) {
          const currentUser = window.crmStore.getCurrentUser();
          if (currentUser) {
            currentUser.allowedSegments = data.allowed_segments;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load server permissions, using local store fallback:', e);
    }
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  async logout() {
    window.location.href = '/';
  }

  // ─── Check Force Password Change ─────────────────────────────────────────

  checkForcePasswordChange() {
    const urlParams = new URLSearchParams(window.location.search);
    const user = this.authUser;
    if (urlParams.get('forceChange') === '1' || (user && user.force_password_change)) {
      const modal = document.getElementById('forcePwdChangeModal');
      if (modal) modal.style.display = 'flex';
    }
  }

  // ─── Personalized Dashboard Greeting ─────────────────────────────────────

  renderPersonalizedGreeting() {
    const user = this.authUser;
    if (!user) return;
    const greetingEl = document.getElementById('dashboardGreeting');
    if (!greetingEl) return;
    const hour = new Date().getHours();
    const salutation = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    const firstName = (user.name || 'there').split(' ')[0];
    greetingEl.innerHTML = `
      <div style="margin-bottom:12px; padding:14px 18px; background:linear-gradient(135deg,#eff6ff,#f0f9ff); border:1px solid #bfdbfe; border-radius:10px; display:flex; align-items:center; gap:12px;">
        <div style="width:38px; height:38px; border-radius:50%; background:linear-gradient(135deg,#0284c7,#6366f1); display:flex; align-items:center; justify-content:center; color:white; font-weight:700; font-size:14px; flex-shrink:0;">${firstName[0] || 'U'}</div>
        <div>
          <div style="font-weight:700; font-size:15px; color:#0f172a;">${salutation}, ${firstName}! 👋</div>
          <div style="font-size:12px; color:#64748b; margin-top:2px;">${user.designation || user.role_name || ''} ${user.department ? '· ' + user.department : ''}</div>
        </div>
      </div>
    `;
  }

  // ─── Change Password ──────────────────────────────────────────────────────

  openChangePasswordModal() {
    const dropdown = document.getElementById('userSwitcherDropdown');
    if (dropdown) dropdown.classList.remove('show');
    ['cpCurrentPwd', 'cpNewPwd', 'cpConfirmPwd'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    ['changePwdError', 'changePwdSuccess'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    const modal = document.getElementById('changePwdModal');
    if (modal) modal.style.display = 'flex';
    setTimeout(() => { const el = document.getElementById('cpCurrentPwd'); if (el) el.focus(); }, 100);
    if (window.lucide) setTimeout(() => lucide.createIcons(), 50);
  }

  async submitChangePassword() {
    const current = document.getElementById('cpCurrentPwd')?.value || '';
    const newPwd = document.getElementById('cpNewPwd')?.value || '';
    const confirm = document.getElementById('cpConfirmPwd')?.value || '';
    const errEl = document.getElementById('changePwdError');
    const sucEl = document.getElementById('changePwdSuccess');
    if (errEl) errEl.style.display = 'none';
    if (sucEl) sucEl.style.display = 'none';

    if (!current || !newPwd || !confirm) {
      if (errEl) { errEl.textContent = 'All fields are required.'; errEl.style.display = 'block'; }
      return;
    }
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: current, new_password: newPwd, confirm_password: confirm })
      });
      const data = await res.json();
      if (data.success) {
        if (sucEl) { sucEl.textContent = 'Password changed successfully!'; sucEl.style.display = 'block'; }
        setTimeout(() => this.closeModal('changePwdModal'), 1500);
        this.showToast('Password updated successfully.', 'success');
      } else {
        if (errEl) { errEl.textContent = data.error || 'Failed to change password.'; errEl.style.display = 'block'; }
      }
    } catch (e) {
      if (errEl) { errEl.textContent = 'Network error. Please try again.'; errEl.style.display = 'block'; }
    }
  }

  async submitForcePasswordChange() {
    const newPwd = document.getElementById('fpNewPwd')?.value || '';
    const confirm = document.getElementById('fpConfirmPwd')?.value || '';
    const errEl = document.getElementById('forcePwdError');
    if (errEl) errEl.style.display = 'none';

    if (!newPwd || !confirm) {
      if (errEl) { errEl.textContent = 'Both fields are required.'; errEl.style.display = 'block'; } return;
    }
    if (newPwd !== confirm) {
      if (errEl) { errEl.textContent = 'Passwords do not match.'; errEl.style.display = 'block'; } return;
    }
    // For force change, we use a dummy current password (server allows reset)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: '__FORCE_CHANGE__', new_password: newPwd, confirm_password: confirm })
      });
      const data = await res.json();
      // Even on error from current_password check, try the admin reset route via a flag
      // The server should accept force change since force_password_change = 1
      if (data.success || (data.error && !data.error.includes('Current password'))) {
        const modal = document.getElementById('forcePwdChangeModal');
        if (modal) modal.style.display = 'none';
        this.showToast('Password set successfully! Welcome.', 'success');
        // Remove forceChange param from URL
        history.replaceState({}, '', window.location.pathname);
      } else {
        if (errEl) { errEl.textContent = data.error || 'Failed to set password.'; errEl.style.display = 'block'; }
      }
    } catch (e) {
      if (errEl) { errEl.textContent = 'Network error. Please try again.'; errEl.style.display = 'block'; }
    }
  }


  // --- Event Bindings ---
  bindEvents() {
    // Navigation Tabs
    document.querySelectorAll('.nav-tab-item').forEach(tabBtn => {
      tabBtn.addEventListener('click', (e) => {
        const tabId = tabBtn.getAttribute('data-tab');
        this.switchTab(tabId);
      });
    });

    // Global Search
    const searchInput = document.getElementById('globalSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.handleGlobalSearch(e.target.value));
    }

    // Currency Switcher
    const currencyBtn = document.getElementById('currencyToggleBtn');
    if (currencyBtn) {
      currencyBtn.addEventListener('click', () => this.toggleCurrency());
    }

    // Quick Add Menu Dropdown Toggle
    const quickAddBtn = document.getElementById('quickAddMenuBtn');
    const quickAddDropdown = document.getElementById('quickAddDropdown');
    if (quickAddBtn && quickAddDropdown) {
      quickAddBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        quickAddDropdown.classList.toggle('show');
      });
      document.addEventListener('click', () => {
        quickAddDropdown.classList.remove('show');
      });
    }

    // Dismiss User Switcher Dropdown on outside click
    document.addEventListener('click', (e) => {
      const switcherContainer = document.querySelector('.user-switcher-container');
      const dropdown = document.getElementById('userSwitcherDropdown');
      if (switcherContainer && dropdown && !switcherContainer.contains(e.target)) {
        dropdown.classList.remove('show');
      }
    });
  }

  // Currency Toggle (INR vs USD)
  toggleCurrency() {
    this.currency = this.currency === 'INR' ? 'USD' : 'INR';
    window.crmStore.data.currency = this.currency;
    window.crmStore.saveToStorage();

    const label = document.getElementById('currencyBadgeLabel');
    if (label) {
      label.textContent = this.currency === 'INR' ? '₹ INR (L/Cr)' : '$ USD (k/M)';
    }

    document.querySelectorAll('.currencySymbol').forEach(el => {
      el.textContent = this.currency === 'INR' ? '₹' : '$';
    });

    this.showToast(`Currency format switched to ${this.currency}`, 'info');
    this.refreshCurrentView();
  }

  // --- RBAC & Active User UI ---

  toggleUserSwitcherDropdown(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('userSwitcherDropdown');
    if (dropdown) {
      dropdown.classList.toggle('show');
      if (dropdown.classList.contains('show')) {
        this.updateAccountInfoPanel();
      }
    }
  }

  updateAccountInfoPanel() {
    const infoEl = document.getElementById('userAccountInfo');
    if (!infoEl) return;
    const user = this.authUser;
    if (user) {
      infoEl.innerHTML = `<strong style="color:#0f172a; font-size:13px;">${user.name}</strong><br>${user.email || ''}<br><span style="color:#0284c7;">${user.role_name || user.role || ''}</span>`;
    }
    // Show/hide Manage Users btn based on role
    const mgrBtn = document.getElementById('manageUsersBtn');
    if (mgrBtn) {
      const isAdmin = user && (user.role_name === 'Super Admin' || user.role === 'Admin');
      mgrBtn.style.display = isAdmin ? 'block' : 'none';
    }
  }

  updateUserSwitcherUI() {
    // Prefer the real authenticated server user over localStorage
    const user = this.authUser || window.crmStore.getCurrentUser();
    if (!user) return;

    const avatar = document.getElementById('headerUserAvatar');
    const nameEl = document.getElementById('headerUserName');
    const roleBadge = document.getElementById('headerUserRoleBadge');

    const displayName = user.name || 'User';
    const parts = displayName.split(' ');
    const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : parts[0].slice(0, 2).toUpperCase();

    if (avatar) avatar.textContent = initials;
    if (nameEl) nameEl.textContent = displayName;

    const roleName = user.role_name || user.role || 'User';
    if (roleBadge) {
      roleBadge.textContent = roleName.toUpperCase();
      roleBadge.className = 'user-role-badge-pill ' + (
        roleName.includes('Admin') ? 'role-pill-admin' :
        roleName.includes('Manager') || roleName.includes('BD Manager') ? 'role-pill-manager' :
        roleName.includes('Executive') || roleName.includes('BD Executive') ? 'role-pill-exec' : 'role-pill-viewer'
      );
    }
  }

  renderUserSwitcherList() {
    const users = window.crmStore.getUsers();
    const currentUser = window.crmStore.getCurrentUser();
    const listContainer = document.getElementById('userSwitcherList');
    if (!listContainer) return;

    listContainer.innerHTML = users.map(u => {
      const isActive = currentUser && currentUser.id === u.id;
      const roleClass = u.role === 'Admin' ? 'role-pill-admin' :
                        u.role === 'BD Manager' ? 'role-pill-manager' :
                        u.role === 'BD Executive' ? 'role-pill-exec' : 'role-pill-viewer';
      const parts = (u.name || 'U').split(' ');
      const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : parts[0].slice(0, 2).toUpperCase();

      return `
        <div class="user-dropdown-item ${isActive ? 'active-user-item' : ''}" onclick="crmApp.switchUser('${u.id}')">
          <div class="user-item-info">
            <div class="user-avatar-circle" style="width:24px; height:24px; font-size:10px;">${initials}</div>
            <div>
              <div class="user-item-name">${u.name} ${isActive ? '✓' : ''}</div>
              <div class="user-item-email">${u.email}</div>
            </div>
          </div>
          <span class="user-role-badge-pill ${roleClass}">${u.role}</span>
        </div>
      `;
    }).join('');
  }

  switchUser(userId) {
    const user = window.crmStore.setCurrentUser(userId);
    if (!user) return;

    const dropdown = document.getElementById('userSwitcherDropdown');
    if (dropdown) dropdown.classList.remove('show');

    this.updateUserSwitcherUI();
    this.enforceTabPermissions();
    this.populateDropdowns();

    this.showToast(`Logged in as ${user.name} (${user.role}). Permissions updated!`, 'success');
    this.refreshCurrentView();
  }

  // Enforce Tab Visibility & Access Control using server permissions
  enforceTabPermissions() {
    const store = window.crmStore;

    // Build allowed tabs from server permissions (if loaded) or fallback to store
    const allowedTabIds = this.allowedTabIds.length > 0
      ? this.allowedTabIds
      : null; // null = use local store fallback

    document.querySelectorAll('.nav-tab-item').forEach(tabBtn => {
      const tabId = tabBtn.getAttribute('data-tab');
      let canAccess;
      if (allowedTabIds) {
        canAccess = allowedTabIds.includes(tabId);
      } else {
        canAccess = store.canAccessTab(tabId);
      }
      tabBtn.style.display = canAccess ? 'inline-flex' : 'none';
    });

    // Handle Admin Users View Gate
    const adminBanner = document.getElementById('adminAccessDeniedBanner');
    const adminPanel = document.getElementById('adminUsersControlPanel');
    if (adminBanner && adminPanel) {
      const isAdmin = this.authUser
        ? (this.authUser.role_name === 'Super Admin')
        : store.isCurrentUserAdmin();
      if (isAdmin) {
        adminBanner.style.display = 'none';
        adminPanel.style.display = 'block';
      } else {
        adminBanner.style.display = 'block';
        adminPanel.style.display = 'none';
      }
    }

    // If current active tab is forbidden, auto switch to first permitted tab
    const tabAllowed = allowedTabIds ? allowedTabIds.includes(this.currentTab) : store.canAccessTab(this.currentTab);
    if (!tabAllowed) {
      const allTabs = ['tab-dashboard','tab-clients','tab-team','tab-segments',
        'tab-opportunities','tab-activities','tab-followups','tab-internal','tab-review','tab-users'];
      const firstPermitted = allowedTabIds
        ? allTabs.find(t => allowedTabIds.includes(t))
        : allTabs.find(t => store.canAccessTab(t));
      if (firstPermitted) this.switchTab(firstPermitted);
    }
  }

  // Tab Navigation Switching
  switchTab(tabId) {
    const store = window.crmStore;
    if (!store.canAccessTab(tabId)) {
      this.showToast(`Access Restricted: You do not have permission for this module.`, 'error');
      return;
    }

    this.currentTab = tabId;

    document.querySelectorAll('.nav-tab-item').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    document.querySelectorAll('.tab-view-content').forEach(view => {
      view.classList.toggle('active', view.id === tabId);
    });

    this.refreshCurrentView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Populate Dropdown Menus from Central Master Config & Dynamic Stores
  populateDropdowns() {
    const store = window.crmStore;
    const teamMembers = store.getTeamMembers ? store.getTeamMembers({ status: 'Active' }) : [];
    const activeSegments = store.getSegments ? store.getSegments({ status: 'Active' }) : [];
    const activeSegmentNames = activeSegments.map(s => s.name);

    // BD Owners (Dynamically fetched from Team Store)
    const ownerOptions = `<option value="">All BD Executives</option>` +
      teamMembers.map(e => `<option value="${e.name}">${e.name} (${e.title})</option>`).join('');

    const formOwnerOptions = teamMembers.map(e => `<option value="${e.name}">${e.name}</option>`).join('');

    // Business Segments (Dynamically fetched from Segment Store)
    const segmentOptions = `<option value="">All Segments</option>` +
      activeSegmentNames.map(s => `<option value="${s}">${s}</option>`).join('');
    const formSegmentOptions = activeSegmentNames.map(s => `<option value="${s}">${s}</option>`).join('');

    // Stages
    const stageOptions = `<option value="">All Stages</option>` +
      CRM_CONFIG.stages.map(s => `<option value="${s.name}">${s.id}. ${s.name} (${s.defaultProb}%)</option>`).join('');
    const formStageOptions = CRM_CONFIG.stages.map(s => `<option value="${s.name}" data-prob="${s.defaultProb}">${s.name}</option>`).join('');

    // Industries
    const industryOptions = CRM_CONFIG.industries.map(i => `<option value="${i}">${i}</option>`).join('');

    // Sources
    const sourceOptions = CRM_CONFIG.leadSources.map(s => `<option value="${s}">${s}</option>`).join('');

    // Activity Types
    const actTypeOptions = `<option value="">All Activity Types</option>` +
      CRM_CONFIG.activityTypes.map(a => `<option value="${a}">${a}</option>`).join('');
    const formActTypeOptions = CRM_CONFIG.activityTypes.map(a => `<option value="${a}">${a}</option>`).join('');

    // Internal Categories
    const intCatOptions = `<option value="">All Categories</option>` +
      CRM_CONFIG.internalCategories.map(c => `<option value="${c}">${c}</option>`).join('');
    const formIntCatOptions = CRM_CONFIG.internalCategories.map(c => `<option value="${c}">${c}</option>`).join('');

    // Internal Departments
    const intDeptOptions = `<option value="">All Departments</option>` +
      CRM_CONFIG.departments.map(d => `<option value="${d}">${d}</option>`).join('');
    const formIntDeptOptions = CRM_CONFIG.departments.map(d => `<option value="${d}">${d}</option>`).join('');

    // Document Types
    const docTypes = CRM_CONFIG.documentTypes || [];
    const docTypeOptions = `<option value="">All Document Categories</option>` +
      docTypes.map(d => `<option value="${d}">${d}</option>`).join('');
    const formDocTypeOptions = docTypes.map(d => `<option value="${d}">${d}</option>`).join('');

    // Lost Reasons
    const lostReasonOptions = CRM_CONFIG.lostReasons.map(r => `<option value="${r}">${r}</option>`).join('');

    // Inject into filters
    const setHtml = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };

    setHtml('dashFilterOwner', ownerOptions);
    setHtml('dashFilterSegment', segmentOptions);

    setHtml('clientFilterSegment', segmentOptions);
    setHtml('clientFilterOwner', ownerOptions);
    setHtml('clientSegmentSelect', formSegmentOptions);
    setHtml('clientIndustrySelect', industryOptions);
    setHtml('clientOwnerSelect', formOwnerOptions);
    setHtml('clientSourceSelect', sourceOptions);

    setHtml('oppFilterStage', stageOptions);
    setHtml('oppFilterOwner', ownerOptions);
    setHtml('oppFilterSegment', segmentOptions);
    setHtml('oppSegmentSelect', formSegmentOptions);
    setHtml('oppOwnerSelect', formOwnerOptions);
    setHtml('oppStageSelect', formStageOptions);
    setHtml('oppLostReasonSelect', lostReasonOptions);

    setHtml('actFilterType', actTypeOptions);
    setHtml('actFilterOwner', ownerOptions);
    setHtml('actTypeSelect', formActTypeOptions);
    setHtml('actOwnerSelect', formOwnerOptions);
    setHtml('actDocCategorySelect', formDocTypeOptions);

    setHtml('docFilterType', docTypeOptions);
    setHtml('docFilterOwner', ownerOptions);
    setHtml('docTypeSelect', formDocTypeOptions);

    setHtml('followupFilterOwner', ownerOptions);

    setHtml('intFilterCategory', intCatOptions);
    setHtml('intFilterDept', intDeptOptions);
    setHtml('intCategorySelect', formIntCatOptions);
    setHtml('intDeptSelect', formIntDeptOptions);
    setHtml('intOwnerSelect', formOwnerOptions);

    setHtml('teamSegmentSelect', formSegmentOptions);
    setHtml('segmentHeadSelect', `<option value="">Select Segment Lead</option>` + formOwnerOptions);

    this.populateClientSelectDropdowns();
  }

  // Populate Client Dropdowns in Opp and Activity Modals
  populateClientSelectDropdowns() {
    const clients = window.crmStore.data.clients;
    const clientOptions = clients.map(c => `<option value="${c.id}">${c.name} (${c.segment})</option>`).join('');
    const clientFilterOptions = `<option value="">All Clients</option>` +
      clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    const setHtml = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
    setHtml('oppClientSelect', clientOptions);
    setHtml('actClientSelect', clientOptions);
    setHtml('docClientSelect', clientOptions);
    setHtml('docFilterClient', clientFilterOptions);
    setHtml('intClientSelect', `<option value="">None / General BD Task</option>` + clientOptions);

    // Trigger sub-dropdown
    this.populateClientOppsDropdown('actClientSelect', 'actOppSelect');
    this.populateClientOppsDropdown('intClientSelect', 'intOppSelect');
    this.populateClientOppsDropdown('docClientSelect', 'docOppSelect');
  }

  populateClientOppsDropdown(clientSelectId, oppSelectId) {
    const clientSelect = document.getElementById(clientSelectId);
    const oppSelect = document.getElementById(oppSelectId);
    if (!clientSelect || !oppSelect) return;

    const clientId = clientSelect.value;
    const opps = window.crmStore.data.opportunities.filter(o => o.clientId === clientId);

    let html = `<option value="">General Client Interaction</option>`;
    opps.forEach(o => {
      html += `<option value="${o.id}">[${o.id}] ${o.title} (${o.stage})</option>`;
    });
    oppSelect.innerHTML = html;
  }

  // Refresh badges and current visible view
  refreshCurrentView() {
    this.updateHeaderBadges();

    if (this.currentTab === 'tab-dashboard') {
      this.renderDashboard();
    } else if (this.currentTab === 'tab-clients') {
      this.renderClientsTable();
    } else if (this.currentTab === 'tab-team') {
      this.renderTeamTable();
    } else if (this.currentTab === 'tab-segments') {
      this.renderSegmentsTable();
    } else if (this.currentTab === 'tab-opportunities') {
      this.renderOpportunitiesView();
    } else if (this.currentTab === 'tab-activities') {
      this.renderActivitiesView();
    } else if (this.currentTab === 'tab-followups') {
      this.renderFollowupsBoard();
    } else if (this.currentTab === 'tab-internal') {
      this.renderInternalTable();
    } else if (this.currentTab === 'tab-review') {
      this.renderMonthlyReview();
    } else if (this.currentTab === 'tab-users') {
      this.renderUsersTable();
    }

    if (window.lucide) {
      setTimeout(() => lucide.createIcons(), 50);
    }
  }

  // Update Global Header Counts
  updateHeaderBadges() {
    const metrics = window.crmStore.getMetrics();
    const team = window.crmStore.getTeamMembers ? window.crmStore.getTeamMembers() : [];
    const segments = window.crmStore.getSegments ? window.crmStore.getSegments() : [];
    const users = window.crmStore.getUsers ? window.crmStore.getUsers() : [];
    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    setTxt('badgeTotalClients', metrics.totalClients);
    setTxt('badgeTotalTeam', team.length);
    setTxt('badgeTotalSegments', segments.length);
    setTxt('badgeTotalOpps', metrics.totalActiveLeads);
    setTxt('badgeTotalActivities', window.crmStore.data.activities.length);
    setTxt('badgeOverdueFollowups', `${metrics.followupsOverdue} Overdue`);
    setTxt('badgeInternalTasks', window.crmStore.data.internalActivities.length);
    setTxt('badgeTotalUsers', users.length);
  }

  // =========================================================================
  // VIEW 1: DASHBOARD
  // =========================================================================
  renderDashboard() {
    const store = window.crmStore;
    const metrics = store.getMetrics(this.dashboardFilters);
    const fmt = (v) => window.crmCharts.formatAmount(v, this.currency);

    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    setTxt('kpiTotalPotentialVal', fmt(metrics.totalPotentialBusinessValue));
    setTxt('kpiWonVal', fmt(metrics.wonBusinessValue));
    setTxt('kpiPipelineVal', fmt(metrics.pipelineValue));
    setTxt('kpiWeightedVal', fmt(metrics.weightedPipelineValue));
    setTxt('kpiConversionRate', `${metrics.conversionRate}%`);

    setTxt('kpiTotalClients', metrics.totalClients);
    setTxt('kpiExistingClients', metrics.existingClients);
    setTxt('kpiNewClients', metrics.newClients);

    setTxt('kpiActiveLeads', metrics.totalActiveLeads);
    setTxt('kpiNewEnquiries', metrics.newEnquiries);

    setTxt('kpiCommercialsShared', metrics.commercialsShared);
    setTxt('kpiProposalsReview', metrics.proposalsUnderReview);

    setTxt('kpiWonCount', metrics.opportunitiesWon);
    setTxt('kpiLostCount', metrics.opportunitiesLost);
    setTxt('kpiLostVal', fmt(metrics.lostBusinessValue));
    setTxt('kpiInProcessCount', metrics.opportunitiesInProcess);

    setTxt('kpiMeetingsConducted', metrics.meetingsConducted);
    setTxt('kpiCallsCompleted', metrics.callsCompleted);

    setTxt('kpiFollowupsOverdue', metrics.followupsOverdue);
    setTxt('kpiFollowupsDueToday', metrics.followupsDue);

    // Render Charts
    window.crmCharts.renderDashboardCharts(this.dashboardFilters);

    // Render Critical Management Attention Flags
    this.renderDashboardAttention(metrics.criticalAttention);
  }

  renderDashboardAttention(items) {
    const tbody = document.getElementById('dashboardAttentionList');
    const badge = document.getElementById('badgeAttentionCount');
    if (!tbody) return;

    if (badge) badge.textContent = `${items.length} Action Items`;

    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:#64748b;">No urgent attention items at this time. All follow-ups and proposals are up to date.</td></tr>`;
      return;
    }

    let html = '';
    items.forEach(item => {
      const badgeClass = item.severity === 'urgent' ? 'badge-lost' : (item.severity === 'high' ? 'badge-hold' : 'badge-process');
      html += `
        <tr>
          <td><span class="badge ${badgeClass}">${item.type}</span></td>
          <td><strong class="cell-primary" onclick="crmApp.openProfileDrawer('${item.client}')">${item.client}</strong></td>
          <td><span style="font-family:var(--font-mono); font-size:11.5px; font-weight:600;">${item.oppId}</span></td>
          <td class="cell-amount">${window.crmCharts.formatAmount(item.value, this.currency)}</td>
          <td>${item.owner}</td>
          <td><span style="color:#b45309; font-weight:500;">${item.message}</span></td>
          <td>
            <button class="btn btn-primary btn-xs" onclick="crmApp.openAddActivityModal('Follow-up')">Take Action</button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  }

  applyDashboardFilters() {
    this.dashboardFilters = {
      fy: document.getElementById('dashFilterFY')?.value || '',
      period: document.getElementById('dashFilterPeriod')?.value || '',
      owner: document.getElementById('dashFilterOwner')?.value || '',
      segment: document.getElementById('dashFilterSegment')?.value || '',
      status: document.getElementById('dashFilterStatus')?.value || ''
    };
    this.renderDashboard();
  }

  clearDashboardFilters() {
    ['dashFilterOwner', 'dashFilterSegment', 'dashFilterStatus'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    this.applyDashboardFilters();
  }

  // =========================================================================
  // VIEW 2: CLIENT MASTER (EDITABLE & DELETABLE)
  // =========================================================================
  renderClientsTable() {
    const search = document.getElementById('clientFilterSearch')?.value || '';
    const type = document.getElementById('clientFilterType')?.value || '';
    const segment = document.getElementById('clientFilterSegment')?.value || '';
    const priority = document.getElementById('clientFilterPriority')?.value || '';
    const owner = document.getElementById('clientFilterOwner')?.value || '';

    const clients = window.crmStore.filterClients({ search, clientType: type, segment, priority, bdOwner: owner });
    const tbody = document.getElementById('clientsTableBody');
    const title = document.getElementById('clientsTableTitle');
    if (!tbody) return;

    if (title) title.textContent = `Client Master Directory (${clients.length} Clients)`;

    if (!clients.length) {
      tbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding:24px; color:#64748b;">No client records match the selected filters.</td></tr>`;
      return;
    }

    let html = '';
    clients.forEach(c => {
      const priorityBadge = c.priority === 'High' ? 'badge-priority-high' : (c.priority === 'Medium' ? 'badge-priority-med' : 'badge-priority-low');
      const typeBadge = c.clientType === 'Existing' ? 'badge-won' : 'badge-process';

      html += `
        <tr>
          <td><span style="font-family:var(--font-mono); font-size:11.5px; font-weight:600; color:#64748b;">${c.id}</span></td>
          <td>
            <div class="cell-primary" onclick="crmApp.openProfileDrawer('${c.id}')">${c.name}</div>
            <span class="cell-subtext">${c.company || c.businessGroup || ''}</span>
          </td>
          <td>
            <span style="font-weight:600; color:var(--text-primary);">${c.segment}</span>
            <span class="cell-subtext">${c.industry}</span>
          </td>
          <td>${c.location}</td>
          <td><span class="badge ${typeBadge}">${c.clientType}</span></td>
          <td>
            <strong>${c.contactPerson}</strong>
            <span class="cell-subtext">${c.designation || ''} • ${c.mobile || ''}</span>
          </td>
          <td>${c.bdOwner}</td>
          <td><span class="badge ${priorityBadge}">${c.priority}</span></td>
          <td><span class="badge badge-stage">${c.relationshipStatus || 'Active'}</span></td>
          <td><span style="font-family:var(--font-mono); font-size:11px;">${c.lastInteractionDate || '-'}</span></td>
          <td><span style="font-family:var(--font-mono); font-size:11px; font-weight:600; color:#0284c7;">${c.nextFollowupDate || '-'}</span></td>
          <td style="text-align:right;">
            <div class="cell-actions" style="justify-content:flex-end;">
              <button class="action-icon-btn" title="View 360° Profile" onclick="crmApp.openProfileDrawer('${c.id}')">
                <i data-lucide="eye" style="width:14px; height:14px;"></i>
              </button>
              <button class="action-icon-btn" title="Edit Client" onclick="crmApp.openEditClientModal('${c.id}')">
                <i data-lucide="edit-3" style="width:14px; height:14px; color:#0284c7;"></i>
              </button>
              <button class="action-icon-btn" title="+ Add Opportunity" onclick="crmApp.openAddOpportunityModal('${c.id}')">
                <i data-lucide="plus-circle" style="width:14px; height:14px; color:#16a34a;"></i>
              </button>
              <button class="action-icon-btn" title="Delete Client" onclick="crmApp.deleteClient('${c.id}')" style="color:#dc2626;">
                <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  deleteClient(clientId) {
    const client = window.crmStore.data.clients.find(c => c.id === clientId);
    if (!client) return;

    const linkedOpps = window.crmStore.data.opportunities.filter(o => o.clientId === clientId);
    const oppMsg = linkedOpps.length > 0 ? ` It has ${linkedOpps.length} linked opportunities.` : '';

    if (confirm(`Are you sure you want to delete client "${client.name}" (${clientId})?${oppMsg} This action cannot be undone.`)) {
      window.crmStore.deleteClient(clientId);
      this.showToast(`Client "${client.name}" removed from Master Database.`, 'error');
      this.closeProfileDrawer();
      this.populateDropdowns();
      this.refreshCurrentView();
    }
  }

  clearClientFilters() {
    ['clientFilterSearch', 'clientFilterType', 'clientFilterSegment', 'clientFilterPriority', 'clientFilterOwner'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    this.renderClientsTable();
  }

  // =========================================================================
  // VIEW: BD TEAM & OWNERS MASTER
  // =========================================================================
  renderTeamTable() {
    const search = document.getElementById('teamFilterSearch')?.value || '';
    const status = document.getElementById('teamFilterStatus')?.value || '';
    const region = document.getElementById('teamFilterRegion')?.value || '';

    const team = window.crmStore.getTeamMembers({ search, status, region });
    const tbody = document.getElementById('teamTableBody');
    const title = document.getElementById('teamTableTitle');
    const store = window.crmStore;
    const fmt = (v) => window.crmCharts.formatAmount(v, this.currency);

    if (title) title.textContent = `BD Team Directory & Owner Portfolio (${team.length} Members)`;

    // Calculate Overall Team Stats
    let totalWon = 0;
    let totalPipeline = 0;
    let totalAccounts = 0;

    const teamStats = team.map(member => {
      const myClients = store.data.clients.filter(c => c.bdOwner === member.name);
      const myOpps = store.data.opportunities.filter(o => o.bdOwner === member.name);

      const wonVal = myOpps.filter(o => o.status === 'Won').reduce((sum, o) => sum + (parseFloat(o.finalContractValue || o.estimatedValue) || 0), 0);
      const pipeVal = myOpps.filter(o => o.status === 'In Process' || o.status === 'Open').reduce((sum, o) => sum + (parseFloat(o.estimatedValue) || 0), 0);

      totalWon += wonVal;
      totalPipeline += pipeVal;
      totalAccounts += myClients.length;

      return {
        ...member,
        clientCount: myClients.length,
        oppCount: myOpps.length,
        wonVal,
        pipeVal
      };
    });

    // Update KPIs
    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setTxt('kpiTotalTeamMembers', team.filter(m => m.status === 'Active').length);
    setTxt('kpiTeamWonRevenue', fmt(totalWon));
    setTxt('kpiTeamPipeline', fmt(totalPipeline));
    setTxt('kpiTeamAccountsCount', totalAccounts);

    if (!tbody) return;

    if (!team.length) {
      tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding:24px; color:#64748b;">No BD team members found matching the filters.</td></tr>`;
      return;
    }

    let html = '';
    teamStats.forEach(m => {
      const statusBadge = m.status === 'Active' ? 'badge-won' : 'badge-hold';
      const targetVal = parseFloat(m.target) || 50000000;
      const targetPct = targetVal > 0 ? Math.min(100, Math.round((m.wonVal / targetVal) * 100)) : 0;

      html += `
        <tr>
          <td><span style="font-family:var(--font-mono); font-size:11.5px; font-weight:700;">${m.id}</span></td>
          <td>
            <div style="font-weight:700; color:var(--text-primary); font-size:13.5px;">${m.name}</div>
            <span class="cell-subtext" style="color:var(--brand-primary);">${m.title}</span>
          </td>
          <td>
            <div>${m.email}</div>
            <span class="cell-subtext">${m.phone}</span>
          </td>
          <td><strong>${m.region || 'All Territories'}</strong></td>
          <td><span class="badge badge-stage">${m.segment || 'Multi-Segment'}</span></td>
          <td>
            <div class="cell-amount">${fmt(targetVal)}</div>
            <span class="cell-subtext">${targetPct}% Achieved</span>
          </td>
          <td>
            <strong style="color:#0284c7;">${m.clientCount} Accounts</strong>
            <span class="cell-subtext">${m.oppCount} Opportunities</span>
          </td>
          <td class="cell-amount" style="color:var(--brand-primary);">${fmt(m.pipeVal)}</td>
          <td class="cell-amount" style="color:var(--status-won);">${fmt(m.wonVal)}</td>
          <td><span class="badge ${statusBadge}">${m.status}</span></td>
          <td style="text-align:right;">
            <div class="cell-actions" style="justify-content:flex-end;">
              <button class="action-icon-btn" title="Edit Member" onclick="crmApp.openEditTeamMemberModal('${m.id}')">
                <i data-lucide="edit-3" style="width:14px; height:14px; color:#0284c7;"></i>
              </button>
              <button class="action-icon-btn" title="Deactivate / Delete" onclick="crmApp.openDeleteTeamMemberModal('${m.id}')" style="color:#dc2626;">
                <i data-lucide="user-x" style="width:14px; height:14px;"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  clearTeamFilters() {
    ['teamFilterSearch', 'teamFilterStatus', 'teamFilterRegion'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    this.renderTeamTable();
  }

  // BD Team Modal Handlers
  openAddTeamMemberModal() {
    const form = document.getElementById('formTeamMember');
    if (form) form.reset();
    document.getElementById('teamMemberFormId').value = '';
    document.getElementById('modalTeamTitle').textContent = 'Add New BD Team Member';

    // Populate multi-segment checkboxes with all active segments
    this.populateTeamMemberSegmentCheckboxes([]);

    document.getElementById('modalTeamMember').classList.add('active');
  }

  // Populate segment checkboxes in team member modal
  populateTeamMemberSegmentCheckboxes(selectedSegments = []) {
    const segments = window.crmStore.getSegments ? window.crmStore.getSegments() : [];
    const container = document.getElementById('teamSegmentCheckboxesGrid');
    if (!container) return;

    container.innerHTML = segments.length ? segments.map(s => `
      <label class="perm-checkbox-item">
        <input type="checkbox" name="teamSegmentPerm" value="${s.name}"
          ${selectedSegments.includes(s.name) ? 'checked' : ''}>
        <span>${s.name}${s.code ? ` <span style="font-size:10px; color:#64748b;">(${s.code})</span>` : ''}</span>
      </label>
    `).join('') : `<span style="font-size:12px; color:#64748b;">No segments defined. Add segments first.</span>`;
  }

  openEditTeamMemberModal(memberId) {
    const member = window.crmStore.getTeamMembers().find(m => m.id === memberId);
    if (!member) return;

    this.openAddTeamMemberModal();
    document.getElementById('modalTeamTitle').textContent = `Edit BD Member: ${member.name}`;
    document.getElementById('teamMemberFormId').value = member.id;

    document.getElementById('teamNameInput').value = member.name || '';
    document.getElementById('teamTitleInput').value = member.title || '';
    document.getElementById('teamEmailInput').value = member.email || '';
    document.getElementById('teamPhoneInput').value = member.phone || '';
    document.getElementById('teamRegionSelect').value = member.region || 'West Region';
    document.getElementById('teamTargetInput').value = member.target || 50000000;
    document.getElementById('teamStatusSelect').value = member.status || 'Active';

    // Restore multi-segment selections
    const savedSegs = Array.isArray(member.segments) ? member.segments
      : (member.segment ? [member.segment] : []);
    this.populateTeamMemberSegmentCheckboxes(savedSegs);
  }

  handleTeamMemberSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('teamMemberFormId').value;

    // Collect multi-segment selections
    const segments = [];
    document.querySelectorAll('input[name="teamSegmentPerm"]:checked').forEach(cb => {
      segments.push(cb.value);
    });

    const memberData = {
      name: document.getElementById('teamNameInput').value.trim(),
      title: document.getElementById('teamTitleInput').value.trim(),
      email: document.getElementById('teamEmailInput').value.trim(),
      phone: document.getElementById('teamPhoneInput').value.trim(),
      region: document.getElementById('teamRegionSelect').value,
      segments: segments, // multi-segment array
      segment: segments.length === 1 ? segments[0] : (segments.length > 1 ? segments.join(', ') : 'Multi-Segment'),
      target: parseFloat(document.getElementById('teamTargetInput').value) || 50000000,
      status: document.getElementById('teamStatusSelect').value
    };

    if (id) {
      window.crmStore.updateTeamMember(id, memberData);
      this.showToast(`Team member "${memberData.name}" updated successfully!`, 'success');
    } else {
      window.crmStore.addTeamMember(memberData);
      this.showToast(`New BD Team Member "${memberData.name}" added to Team Master!`, 'success');
    }

    this.populateDropdowns();
    this.closeModals();
    this.refreshCurrentView();
  }

  openDeleteTeamMemberModal(memberId) {
    const member = window.crmStore.getTeamMembers().find(m => m.id === memberId);
    if (!member) return;

    const myClients = window.crmStore.data.clients.filter(c => c.bdOwner === member.name);
    const otherMembers = window.crmStore.getTeamMembers({ status: 'Active' }).filter(m => m.id !== memberId);

    if (!otherMembers.length) {
      alert('Cannot delete the only remaining active team member.');
      return;
    }

    this.pendingDeleteMemberId = memberId;
    document.getElementById('deleteMemberPrompt').innerHTML = `
      You are about to deactivate/delete BD Owner <strong>"${member.name}"</strong>.<br>
      This member is currently assigned to <strong>${myClients.length} client accounts</strong>.
    `;

    const select = document.getElementById('deleteReassignOwnerSelect');
    if (select) {
      select.innerHTML = otherMembers.map(m => `<option value="${m.name}">${m.name} (${m.title})</option>`).join('');
    }

    document.getElementById('modalDeleteTeamMember').classList.add('active');
  }

  confirmDeleteTeamMember() {
    if (!this.pendingDeleteMemberId) return;

    const reassignTo = document.getElementById('deleteReassignOwnerSelect').value;
    const member = window.crmStore.getTeamMembers().find(m => m.id === this.pendingDeleteMemberId);
    const memberName = member ? member.name : 'Team Member';

    window.crmStore.deleteTeamMember(this.pendingDeleteMemberId, reassignTo);
    this.showToast(`BD Member "${memberName}" removed. All accounts reassigned to "${reassignTo}".`, 'info');

    this.pendingDeleteMemberId = null;
    this.closeModals();
    this.populateDropdowns();
    this.refreshCurrentView();
  }

  exportTeamMembersCSV() {
    const team = window.crmStore.getTeamMembers();
    window.crmExport.downloadCSV(team, 'CRM_BD_Team_Members');
  }

  // =========================================================================
  // VIEW: BUSINESS SEGMENTS MASTER
  // =========================================================================
  renderSegmentsTable() {
    const search = document.getElementById('segFilterSearch')?.value || '';
    const status = document.getElementById('segFilterStatus')?.value || '';

    const segments = window.crmStore.getSegments({ search, status });
    const tbody = document.getElementById('segmentsTableBody');
    const title = document.getElementById('segmentsTableTitle');
    const fmt = (v) => window.crmCharts.formatAmount(v, this.currency);

    if (title) title.textContent = `Corporate Business Segments & Targets (${segments.length} Verticals)`;

    // Aggregate Segment Stats
    let totalTarget = 0;
    let totalPipeline = 0;
    let totalWon = 0;

    segments.forEach(s => {
      totalTarget += (parseFloat(s.targetRevenue) || 0);
      totalPipeline += (parseFloat(s.pipelineValue) || 0);
      totalWon += (parseFloat(s.wonRevenue) || 0);
    });

    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setTxt('kpiTotalSegmentsCount', segments.filter(s => s.status === 'Active').length);
    setTxt('kpiSegmentsTotalTarget', fmt(totalTarget));
    setTxt('kpiSegmentsTotalPipeline', fmt(totalPipeline));
    setTxt('kpiSegmentsTotalWon', fmt(totalWon));

    if (!tbody) return;

    if (!segments.length) {
      tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding:24px; color:#64748b;">No business segments found matching the criteria.</td></tr>`;
      return;
    }

    let html = '';
    segments.forEach(s => {
      const statusBadge = s.status === 'Active' ? 'badge-won' : 'badge-hold';
      const targetVal = parseFloat(s.targetRevenue) || 0;
      const pct = Math.min(100, Math.max(0, parseFloat(s.achievementPct) || 0));

      html += `
        <tr>
          <td><span style="font-family:var(--font-mono); font-size:11.5px; font-weight:700; color:var(--brand-navy);">${s.code || s.id}</span></td>
          <td>
            <div style="font-weight:700; color:var(--text-primary); font-size:13.5px;">${s.name}</div>
            <span class="cell-subtext">ID: ${s.id}</span>
          </td>
          <td style="max-width:280px;">
            <div style="font-size:12px; color:var(--text-secondary); line-height:1.4;">${s.description || '-'}</div>
          </td>
          <td>
            <strong style="color:#0284c7;">${s.head || 'Unassigned'}</strong>
          </td>
          <td class="cell-amount"><strong>${fmt(targetVal)}</strong></td>
          <td>
            <strong style="color:var(--brand-primary);">${s.activeClientsCount} Clients</strong>
            <span class="cell-subtext">${s.oppsCount} Opportunities</span>
          </td>
          <td class="cell-amount" style="color:var(--brand-primary);">${fmt(s.pipelineValue)}</td>
          <td class="cell-amount" style="color:var(--status-won); font-weight:700;">${fmt(s.wonRevenue)}</td>
          <td style="min-width:130px;">
            <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:600; margin-bottom:2px;">
              <span>${s.achievementPct}%</span>
              <span style="color:var(--text-muted);">${fmt(s.wonRevenue)} / ${fmt(targetVal)}</span>
            </div>
            <div class="segment-target-bar">
              <div class="segment-target-fill" style="width:${pct}%;"></div>
            </div>
          </td>
          <td><span class="badge ${statusBadge}">${s.status}</span></td>
          <td style="text-align:right;">
            <div class="cell-actions" style="justify-content:flex-end;">
              <button class="action-icon-btn" title="Edit Business Segment" onclick="crmApp.openEditSegmentModal('${s.id}')">
                <i data-lucide="edit-3" style="width:14px; height:14px; color:#0284c7;"></i>
              </button>
              <button class="action-icon-btn" title="Delete Segment" onclick="crmApp.openDeleteSegmentModal('${s.id}')" style="color:#dc2626;">
                <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  resetSegmentFilters() {
    const search = document.getElementById('segFilterSearch');
    const status = document.getElementById('segFilterStatus');
    if (search) search.value = '';
    if (status) status.value = 'Active';
    this.renderSegmentsTable();
  }

  openAddSegmentModal() {
    const form = document.getElementById('formSegment');
    if (form) form.reset();
    document.getElementById('segmentFormId').value = '';
    document.getElementById('modalSegmentTitle').textContent = 'Add New Business Segment';
    document.getElementById('segmentStatusSelect').value = 'Active';

    // Populate segment head options
    const teamMembers = window.crmStore.getTeamMembers({ status: 'Active' });
    const headSelect = document.getElementById('segmentHeadSelect');
    if (headSelect) {
      headSelect.innerHTML = `<option value="">Select Segment Lead</option>` +
        teamMembers.map(m => `<option value="${m.name}">${m.name} (${m.title})</option>`).join('');
    }

    document.getElementById('modalSegment').classList.add('active');
  }

  openEditSegmentModal(segmentId) {
    const seg = window.crmStore.getSegments().find(s => s.id === segmentId);
    if (!seg) return;

    this.openAddSegmentModal();
    document.getElementById('modalSegmentTitle').textContent = `Edit Segment: ${seg.name}`;
    document.getElementById('segmentFormId').value = seg.id;

    document.getElementById('segmentNameInput').value = seg.name || '';
    document.getElementById('segmentCodeInput').value = seg.code || '';
    document.getElementById('segmentHeadSelect').value = seg.head || '';
    document.getElementById('segmentTargetInput').value = seg.targetRevenue || 50000000;
    document.getElementById('segmentStatusSelect').value = seg.status || 'Active';
    document.getElementById('segmentDescInput').value = seg.description || '';
  }

  handleSegmentSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('segmentFormId').value;

    const segmentData = {
      name: document.getElementById('segmentNameInput').value.trim(),
      code: document.getElementById('segmentCodeInput').value.trim().toUpperCase(),
      head: document.getElementById('segmentHeadSelect').value,
      targetRevenue: parseFloat(document.getElementById('segmentTargetInput').value) || 50000000,
      status: document.getElementById('segmentStatusSelect').value,
      description: document.getElementById('segmentDescInput').value.trim()
    };

    if (id) {
      window.crmStore.updateSegment(id, segmentData);
      this.showToast(`Business Segment "${segmentData.name}" updated successfully!`, 'success');
    } else {
      window.crmStore.addSegment(segmentData);
      this.showToast(`New Business Segment "${segmentData.name}" added to CRM!`, 'success');
    }

    this.populateDropdowns();
    this.closeModals();
    this.refreshCurrentView();
  }

  openDeleteSegmentModal(segmentId) {
    const seg = window.crmStore.getSegments().find(s => s.id === segmentId);
    if (!seg) return;

    const clientsInSeg = window.crmStore.data.clients.filter(c => c.segment === seg.name);
    const oppsInSeg = window.crmStore.data.opportunities.filter(o => o.segment === seg.name);
    const otherSegs = window.crmStore.getSegments({ status: 'Active' }).filter(s => s.id !== segmentId);

    if (!otherSegs.length) {
      alert('Cannot delete the only remaining active business segment.');
      return;
    }

    this.activeDeletingSegmentId = segmentId;
    document.getElementById('deleteSegmentPrompt').innerHTML = `
      You are about to deactivate/delete Business Segment <strong>"${seg.name}"</strong>.<br>
      This segment currently has <strong>${clientsInSeg.length} clients</strong> and <strong>${oppsInSeg.length} opportunities</strong> linked to it.
    `;

    const select = document.getElementById('deleteReassignSegmentSelect');
    if (select) {
      select.innerHTML = otherSegs.map(s => `<option value="${s.name}">${s.name} (${s.code || s.id})</option>`).join('');
    }

    document.getElementById('modalDeleteSegment').classList.add('active');
  }

  confirmDeleteSegment() {
    if (!this.activeDeletingSegmentId) return;

    const reassignTo = document.getElementById('deleteReassignSegmentSelect').value;
    const seg = window.crmStore.getSegments().find(s => s.id === this.activeDeletingSegmentId);
    const segName = seg ? seg.name : 'Segment';

    window.crmStore.deleteSegment(this.activeDeletingSegmentId, reassignTo);
    this.showToast(`Segment "${segName}" removed. Associated clients & opps reassigned to "${reassignTo}".`, 'info');

    this.activeDeletingSegmentId = null;
    this.closeModals();
    this.populateDropdowns();
    this.refreshCurrentView();
  }

  // =========================================================================
  // VIEW: ADMIN USER & ROLE PERMISSIONS MASTER
  // =========================================================================
  renderUsersTable() {
    const search = document.getElementById('userFilterSearch')?.value || '';
    const role = document.getElementById('userFilterRole')?.value || '';
    const status = document.getElementById('userFilterStatus')?.value || '';

    const users = window.crmStore.getUsers({ search, role, status });
    const tbody = document.getElementById('usersTableBody');
    const title = document.getElementById('usersTableTitle');
    const currentUserId = window.crmStore.data.currentUserId || 'USR-001';

    if (title) title.textContent = `System User Directory & Role-Based Access Control (${users.length} Users)`;

    // Update KPI counters
    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setTxt('kpiTotalUsersCount', users.length);
    setTxt('kpiAdminCount', users.filter(u => u.role === 'Admin').length);
    setTxt('kpiBDUsersCount', users.filter(u => u.role === 'BD Manager' || u.role === 'BD Executive').length);
    setTxt('kpiActiveUsersCount', users.filter(u => u.status === 'Active').length);

    if (!tbody) return;

    if (!users.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:#64748b;">No system users found matching the filter.</td></tr>`;
      return;
    }

    const tabNameMap = {
      'tab-dashboard': 'Dashboard',
      'tab-clients': 'Clients',
      'tab-team': 'BD Team',
      'tab-segments': 'Segments',
      'tab-opportunities': 'Pipeline',
      'tab-activities': 'Activities',
      'tab-followups': 'Follow-ups',
      'tab-internal': 'Internal',
      'tab-review': 'Review',
      'tab-users': 'Admin Users'
    };

    let html = '';
    users.forEach(u => {
      const isCurrent = u.id === currentUserId;
      const statusBadge = u.status === 'Active' ? 'badge-won' : 'badge-lost';
      const roleClass = u.role === 'Admin' ? 'role-pill-admin' :
                        u.role === 'BD Manager' ? 'role-pill-manager' :
                        u.role === 'BD Executive' ? 'role-pill-exec' : 'role-pill-viewer';

      // Format Permitted Tabs Badges
      let tabBadges = '';
      if (u.role === 'Admin' || (Array.isArray(u.allowedTabs) && u.allowedTabs.length >= 10)) {
        tabBadges = `<span class="permission-pill-tag" style="background:#fee2e2; color:#dc2626; font-weight:700;">★ All 10 Modules (Full Access)</span>`;
      } else if (Array.isArray(u.allowedTabs)) {
        tabBadges = u.allowedTabs.map(t => `<span class="permission-pill-tag">${tabNameMap[t] || t}</span>`).join('');
      }

      // Format Permitted Segments
      let segBadges = '';
      if (u.role === 'Admin' || (Array.isArray(u.allowedSegments) && u.allowedSegments.includes('All'))) {
        segBadges = `<span class="permission-pill-tag" style="background:#e0f2fe; color:#0284c7; font-weight:600;">All Business Segments</span>`;
      } else if (Array.isArray(u.allowedSegments) && u.allowedSegments.length) {
        segBadges = u.allowedSegments.map(s => `<span class="permission-pill-tag" style="background:#f0fdf4; color:#16a34a;">${s}</span>`).join('');
      } else {
        segBadges = `<span style="color:#dc2626; font-size:11px;">No Segments Assigned</span>`;
      }

      html += `
        <tr style="${isCurrent ? 'background: #f0fdf4;' : ''}">
          <td><span style="font-family:var(--font-mono); font-size:11.5px; font-weight:700;">${u.id}</span></td>
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="font-weight:700; font-size:13px; color:var(--text-primary);">${u.name}</div>
              ${isCurrent ? '<span class="badge badge-won" style="font-size:10px;">Current User</span>' : ''}
            </div>
            <div style="margin-top:2px;"><span class="user-role-badge-pill ${roleClass}">${u.role}</span></div>
          </td>
          <td>
            <a href="mailto:${u.email}" style="color:var(--brand-primary); font-size:12.5px;">${u.email}</a>
          </td>
          <td style="max-width:260px;">${tabBadges}</td>
          <td style="max-width:240px;">${segBadges}</td>
          <td><span class="badge ${statusBadge}">${u.status}</span></td>
          <td><span style="font-size:11.5px; color:var(--text-muted);">${u.lastLogin || u.dateCreated || '-'}</span></td>
          <td style="text-align:right;">
            <div class="cell-actions" style="justify-content:flex-end;">
              <button class="btn btn-secondary btn-xs" title="Switch to this user session" onclick="crmApp.switchUser('${u.id}')" style="font-size:11px; padding:3px 8px;">
                <i data-lucide="log-in" style="width:12px; height:12px;"></i> Switch
              </button>
              <button class="action-icon-btn" title="Edit Permissions & User" onclick="crmApp.openEditUserModal('${u.id}')">
                <i data-lucide="shield" style="width:14px; height:14px; color:#0284c7;"></i>
              </button>
              <button class="action-icon-btn" title="Delete User" onclick="crmApp.openDeleteUserModal('${u.id}')" style="color:#dc2626;">
                <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  resetUserFilters() {
    const search = document.getElementById('userFilterSearch');
    const role = document.getElementById('userFilterRole');
    const status = document.getElementById('userFilterStatus');
    if (search) search.value = '';
    if (role) role.value = '';
    if (status) status.value = 'Active';
    this.renderUsersTable();
  }

  openAddUserModal() {
    const form = document.getElementById('formUser');
    if (form) form.reset();
    document.getElementById('userFormId').value = '';
    document.getElementById('modalUserTitle').textContent = 'Add System User & Configure Permissions';
    document.getElementById('userRoleModalSelect').value = 'BD Executive';
    document.getElementById('userStatusSelect').value = 'Active';

    // Populate Segment Checkboxes
    this.populateUserModalSegmentCheckboxes();

    // Set Default Tab Checkboxes for BD Executive
    this.selectAllUserTabs(false);
    ['tab-dashboard', 'tab-clients', 'tab-opportunities', 'tab-activities', 'tab-followups'].forEach(t => {
      const cb = document.querySelector(`input[name="userTabPerm"][value="${t}"]`);
      if (cb) cb.checked = true;
    });

    // Segment scope radio defaults to "all"
    const allRadio = document.querySelector('input[name="userSegScopeRadio"][value="all"]');
    if (allRadio) allRadio.checked = true;
    this.toggleUserSegmentCheckboxes();

    document.getElementById('modalUser').classList.add('active');
  }

  openEditUserModal(userId) {
    const user = window.crmStore.getUsers().find(u => u.id === userId);
    if (!user) return;

    this.openAddUserModal();
    document.getElementById('modalUserTitle').textContent = `Edit User & Permissions: ${user.name}`;
    document.getElementById('userFormId').value = user.id;

    document.getElementById('userNameInput').value = user.name || '';
    document.getElementById('userEmailInput').value = user.email || '';
    document.getElementById('userRoleModalSelect').value = user.role || 'BD Executive';
    document.getElementById('userStatusSelect').value = user.status || 'Active';

    // Set Tab checkboxes based on user.allowedTabs
    this.selectAllUserTabs(false);
    if (user.role === 'Admin' || (Array.isArray(user.allowedTabs) && user.allowedTabs.includes('tab-dashboard'))) {
      const tabs = Array.isArray(user.allowedTabs) ? user.allowedTabs : [];
      tabs.forEach(t => {
        const cb = document.querySelector(`input[name="userTabPerm"][value="${t}"]`);
        if (cb) cb.checked = true;
      });
      if (user.role === 'Admin') this.selectAllUserTabs(true);
    }

    // Set Segment checkboxes based on user.allowedSegments
    const isAll = !user.allowedSegments || user.allowedSegments.includes('All');
    const radio = document.querySelector(`input[name="userSegScopeRadio"][value="${isAll ? 'all' : 'custom'}"]`);
    if (radio) radio.checked = true;

    this.toggleUserSegmentCheckboxes();

    if (!isAll && Array.isArray(user.allowedSegments)) {
      document.querySelectorAll('input[name="userSegPerm"]').forEach(cb => {
        cb.checked = user.allowedSegments.includes(cb.value);
      });
    }

    // Restore Action Permissions checkboxes
    const savedActionPerms = Array.isArray(user.actionPerms) ? user.actionPerms : [];
    document.querySelectorAll('input[name="userActionPerm"]').forEach(cb => {
      cb.checked = (user.role === 'Admin') ? true : savedActionPerms.includes(cb.value);
    });
  }

  populateUserModalSegmentCheckboxes() {
    const segments = window.crmStore.getSegments({ status: 'Active' });
    const container = document.getElementById('userSegmentCheckboxesGrid');
    if (!container) return;

    container.innerHTML = segments.map(s => `
      <label class="perm-checkbox-item">
        <input type="checkbox" name="userSegPerm" value="${s.name}">
        <span>${s.name} (${s.code || s.id})</span>
      </label>
    `).join('');
  }

  handleUserRoleChangeInModal() {
    const role = document.getElementById('userRoleModalSelect').value;

    if (role === 'Admin') {
      this.selectAllUserTabs(true);
      const allRadio = document.querySelector('input[name="userSegScopeRadio"][value="all"]');
      if (allRadio) allRadio.checked = true;
      this.toggleUserSegmentCheckboxes();
      // Admin gets all action permissions
      document.querySelectorAll('input[name="userActionPerm"]').forEach(cb => { cb.checked = true; });
    } else if (role === 'BD Manager') {
      this.selectAllUserTabs(false);
      ['tab-dashboard', 'tab-clients', 'tab-team', 'tab-segments', 'tab-opportunities', 'tab-activities', 'tab-followups', 'tab-internal', 'tab-review'].forEach(t => {
        const cb = document.querySelector(`input[name="userTabPerm"][value="${t}"]`);
        if (cb) cb.checked = true;
      });
      // BD Manager gets most action permissions
      document.querySelectorAll('input[name="userActionPerm"]').forEach(cb => { cb.checked = true; });
      const deleteActCb = document.querySelector('input[name="userActionPerm"][value="delete_activities"]');
      if (deleteActCb) deleteActCb.checked = false;
      const deleteOppCb = document.querySelector('input[name="userActionPerm"][value="delete_opportunities"]');
      if (deleteOppCb) deleteOppCb.checked = false;
      const deleteIntCb = document.querySelector('input[name="userActionPerm"][value="delete_internal_activities"]');
      if (deleteIntCb) deleteIntCb.checked = false;
    } else if (role === 'BD Executive') {
      this.selectAllUserTabs(false);
      ['tab-dashboard', 'tab-clients', 'tab-opportunities', 'tab-activities', 'tab-followups'].forEach(t => {
        const cb = document.querySelector(`input[name="userTabPerm"][value="${t}"]`);
        if (cb) cb.checked = true;
      });
      // BD Executive gets limited action permissions
      document.querySelectorAll('input[name="userActionPerm"]').forEach(cb => { cb.checked = false; });
      ['export_data'].forEach(key => {
        const cb = document.querySelector(`input[name="userActionPerm"][value="${key}"]`);
        if (cb) cb.checked = true;
      });
    } else if (role === 'Management Viewer') {
      this.selectAllUserTabs(false);
      ['tab-dashboard', 'tab-clients', 'tab-opportunities', 'tab-review'].forEach(t => {
        const cb = document.querySelector(`input[name="userTabPerm"][value="${t}"]`);
        if (cb) cb.checked = true;
      });
      // Viewer gets no action permissions
      document.querySelectorAll('input[name="userActionPerm"]').forEach(cb => { cb.checked = false; });
    }
  }

  selectAllUserTabs(selectAll) {
    document.querySelectorAll('input[name="userTabPerm"]').forEach(cb => {
      cb.checked = selectAll;
    });
  }

  toggleUserSegmentCheckboxes() {
    const isCustom = document.querySelector('input[name="userSegScopeRadio"][value="custom"]')?.checked;
    const grid = document.getElementById('userSegmentCheckboxesGrid');
    if (grid) {
      grid.style.opacity = isCustom ? '1' : '0.4';
      grid.style.pointerEvents = isCustom ? 'auto' : 'none';
    }
  }

  handleUserSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('userFormId').value;
    const role = document.getElementById('userRoleModalSelect').value;

    // Collect Tab permissions
    const allowedTabs = [];
    document.querySelectorAll('input[name="userTabPerm"]:checked').forEach(cb => {
      allowedTabs.push(cb.value);
    });

    // Collect Segment permissions
    const segScope = document.querySelector('input[name="userSegScopeRadio"]:checked')?.value;
    let allowedSegments = ['All'];
    if (segScope === 'custom') {
      allowedSegments = [];
      document.querySelectorAll('input[name="userSegPerm"]:checked').forEach(cb => {
        allowedSegments.push(cb.value);
      });
      if (!allowedSegments.length) {
        allowedSegments = ['All']; // Fallback if none checked
      }
    }

    // Collect Action-Level Permissions (granular checklist)
    const actionPerms = [];
    document.querySelectorAll('input[name="userActionPerm"]:checked').forEach(cb => {
      actionPerms.push(cb.value);
    });

    const userData = {
      name: document.getElementById('userNameInput').value.trim(),
      email: document.getElementById('userEmailInput').value.trim(),
      role: role,
      status: document.getElementById('userStatusSelect').value,
      allowedTabs: allowedTabs,
      allowedSegments: allowedSegments,
      actionPerms: actionPerms
    };

    if (id) {
      window.crmStore.updateUser(id, userData);
      this.showToast(`User "${userData.name}" and permissions updated!`, 'success');
    } else {
      window.crmStore.addUser(userData);
      this.showToast(`New user "${userData.name}" created with configured permissions!`, 'success');
    }

    this.closeModals();
    this.updateUserSwitcherUI();
    this.enforceTabPermissions();
    this.refreshCurrentView();
  }

  openDeleteUserModal(userId) {
    const user = window.crmStore.getUsers().find(u => u.id === userId);
    if (!user) return;

    if (user.role === 'Admin') {
      const adminCount = window.crmStore.getUsers().filter(u => u.role === 'Admin').length;
      if (adminCount <= 1) {
        alert('Cannot delete the only remaining Administrator account in the system.');
        return;
      }
    }

    this.activeDeletingUserId = userId;
    document.getElementById('deleteUserPrompt').innerHTML = `
      Are you sure you want to remove user <strong>"${user.name}"</strong> (${user.email}, Role: ${user.role})?
    `;

    document.getElementById('modalDeleteUser').classList.add('active');
  }

  confirmDeleteUser() {
    if (!this.activeDeletingUserId) return;

    const user = window.crmStore.getUsers().find(u => u.id === this.activeDeletingUserId);
    const userName = user ? user.name : 'User';

    try {
      window.crmStore.deleteUser(this.activeDeletingUserId);
      this.showToast(`User "${userName}" removed from CRM system.`, 'info');
    } catch (err) {
      alert(err.message);
    }

    this.activeDeletingUserId = null;
    this.closeModals();
    this.updateUserSwitcherUI();
    this.enforceTabPermissions();
    this.refreshCurrentView();
  }

  // =========================================================================
  // VIEW 3: LEADS & OPPORTUNITIES PIPELINE
  // =========================================================================
  setPipelineView(viewMode) {
    this.pipelineView = viewMode;
    const btnTable = document.getElementById('btnViewTable');
    const btnKanban = document.getElementById('btnViewKanban');
    const tableView = document.getElementById('pipelineTableView');
    const kanbanView = document.getElementById('pipelineKanbanView');

    if (btnTable) btnTable.classList.toggle('active', viewMode === 'table');
    if (btnKanban) btnKanban.classList.toggle('active', viewMode === 'kanban');

    if (tableView) tableView.style.display = viewMode === 'table' ? 'block' : 'none';
    if (kanbanView) kanbanView.style.display = viewMode === 'kanban' ? 'block' : 'none';

    this.renderOpportunitiesView();
  }

  renderOpportunitiesView() {
    const search = document.getElementById('oppFilterSearch')?.value || '';
    const stage = document.getElementById('oppFilterStage')?.value || '';
    const status = document.getElementById('oppFilterStatus')?.value || '';
    const owner = document.getElementById('oppFilterOwner')?.value || '';
    const segment = document.getElementById('oppFilterSegment')?.value || '';

    const opps = window.crmStore.filterOpportunities({ search, stage, status, bdOwner: owner, segment });

    if (this.pipelineView === 'table') {
      this.renderOpportunitiesTable(opps);
    } else {
      this.renderOpportunitiesKanban(opps);
    }
  }

  renderOpportunitiesTable(opps) {
    const tbody = document.getElementById('oppsTableBody');
    const title = document.getElementById('oppsTableTitle');
    if (!tbody) return;

    const canDelete = window.crmStore.isCurrentUserAdmin() || window.crmStore.canDeleteOpportunities();

    if (title) title.textContent = `All Opportunities & Pipeline (${opps.length} Deals)`;

    if (!opps.length) {
      tbody.innerHTML = `<tr><td colspan="13" style="text-align:center; padding:24px; color:#64748b;">No opportunity records match the selected filters.</td></tr>`;
      return;
    }

    let html = '';
    opps.forEach(o => {
      let statusBadge = 'badge-process';
      if (o.status === 'Won') statusBadge = 'badge-won';
      else if (o.status === 'Lost') statusBadge = 'badge-lost';
      else if (o.status === 'On Hold') statusBadge = 'badge-hold';

      const weightedVal = window.crmStore.calculateWeightedValue(o.estimatedValue, o.probability);

      html += `
        <tr>
          <td><span style="font-family:var(--font-mono); font-size:11.5px; font-weight:700;">${o.id}</span></td>
          <td>
            <div class="cell-primary" onclick="crmApp.openProfileDrawer('${o.clientId}')">${o.clientName}</div>
            <span class="cell-subtext">${o.contactPerson || ''}</span>
          </td>
          <td>
            <strong style="color:var(--text-primary); font-size:12.5px;">${o.title}</strong>
            <span class="cell-subtext">${o.product || ''}</span>
          </td>
          <td>${o.segment}</td>
          <td class="cell-amount">${window.crmCharts.formatAmount(o.estimatedValue, this.currency)}</td>
          <td>
            <div style="display:flex; align-items:center; gap:4px;">
              <span style="font-weight:700;">${o.probability}%</span>
            </div>
          </td>
          <td class="cell-amount" style="color:var(--brand-primary);">${window.crmCharts.formatAmount(weightedVal, this.currency)}</td>
          <td><span class="badge badge-stage">${o.stage}</span></td>
          <td><span class="badge ${statusBadge}">${o.status}</span></td>
          <td>${o.bdOwner}</td>
          <td><span style="font-family:var(--font-mono); font-size:11px;">${o.expectedClosureDate || '-'}</span></td>
          <td><span style="font-size:12px; color:var(--text-secondary);">${o.nextAction || '-'}</span></td>
          <td style="text-align:right;">
            <div class="cell-actions" style="justify-content:flex-end;">
              <button class="action-icon-btn" title="Edit Opportunity" onclick="crmApp.openEditOpportunityModal('${o.id}')">
                <i data-lucide="edit-3" style="width:14px; height:14px;"></i>
              </button>
              <button class="action-icon-btn" title="Quick Mark Won" onclick="crmApp.quickMarkOppWon('${o.id}')" style="color:#16a34a;">
                <i data-lucide="check-circle" style="width:14px; height:14px;"></i>
              </button>
              <button class="action-icon-btn" title="Quick Mark Lost" onclick="crmApp.quickMarkOppLost('${o.id}')" style="color:#dc2626;">
                <i data-lucide="x-circle" style="width:14px; height:14px;"></i>
              </button>
              ${canDelete ? `
                <button class="action-icon-btn action-btn-danger" title="Delete Opportunity (Admin)" onclick="crmApp.openDeleteOpportunityModal('${o.id}')" style="color:#dc2626;">
                  <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
    if (window.lucide) setTimeout(() => lucide.createIcons(), 50);
  }

  renderOpportunitiesKanban(opps) {
    const container = document.getElementById('kanbanBoardColumns');
    if (!container) return;

    const canDelete = window.crmStore.isCurrentUserAdmin() || window.crmStore.canDeleteOpportunities();

    // Key stage columns
    const kanbanColumns = [
      { name: 'New Enquiry', stages: ['New Enquiry', 'Initial Contact'] },
      { name: 'Requirement / Meeting', stages: ['Requirement Discussion', 'Meeting Scheduled', 'Meeting Completed', 'Requirement Received'] },
      { name: 'Proposal Preparation', stages: ['Proposal Under Preparation', 'Internal Approval Pending'] },
      { name: 'Proposal & Review', stages: ['Proposal / Commercial Shared', 'Client Review'] },
      { name: 'Negotiation', stages: ['Follow-up', 'Commercial Negotiation', 'Final Discussion'] },
      { name: 'Won', stages: ['Won'] },
      { name: 'Lost / Hold', stages: ['Lost', 'On Hold'] }
    ];

    let html = '';
    kanbanColumns.forEach(col => {
      const colOpps = opps.filter(o => col.stages.includes(o.stage));
      const colVal = colOpps.reduce((sum, o) => sum + (parseFloat(o.estimatedValue) || 0), 0);

      html += `
        <div class="kanban-column">
          <div class="kanban-col-header">
            <div class="kanban-col-title">
              <span>${col.name}</span>
              <span class="badge" style="background:#e2e8f0; font-size:10px;">${colOpps.length}</span>
            </div>
            <div class="kanban-col-total">${window.crmCharts.formatAmount(colVal, this.currency)}</div>
          </div>
          <div class="kanban-cards-list">
      `;

      if (!colOpps.length) {
        html += `<div style="padding:16px; text-align:center; color:#94a3b8; font-size:11.5px;">No deals in this stage</div>`;
      } else {
        colOpps.forEach(o => {
          html += `
            <div class="kanban-card" onclick="crmApp.openEditOpportunityModal('${o.id}')">
              <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div class="kanban-card-company">${o.clientName}</div>
                ${canDelete ? `
                  <button class="action-icon-btn action-btn-danger" title="Delete Opportunity" onclick="event.stopPropagation(); crmApp.openDeleteOpportunityModal('${o.id}')" style="color:#dc2626; padding:2px; margin-top:-2px; margin-right:-2px;">
                    <i data-lucide="trash-2" style="width:13px; height:13px;"></i>
                  </button>
                ` : ''}
              </div>
              <div class="kanban-card-requirement">${o.title}</div>
              <div class="kanban-card-value-row">
                <span class="kanban-card-val">${window.crmCharts.formatAmount(o.estimatedValue, this.currency)}</span>
                <span class="kanban-card-prob">${o.probability}% Prob</span>
              </div>
              <div class="kanban-card-footer">
                <span>👤 ${o.bdOwner.split(' ')[0]}</span>
                <span>📅 ${o.expectedClosureDate || 'No date'}</span>
              </div>
            </div>
          `;
        });
      }

      html += `
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    if (window.lucide) setTimeout(() => lucide.createIcons(), 50);
  }

  clearOppFilters() {
    ['oppFilterSearch', 'oppFilterStage', 'oppFilterStatus', 'oppFilterOwner', 'oppFilterSegment'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    this.renderOpportunitiesView();
  }

  // =========================================================================
  // VIEW 4: CLIENT ENGAGEMENT, INTERACTIONS & ATTACHMENT REPOSITORY
  // =========================================================================
  setActivityView(mode) {
    this.activityView = mode;
    const btnTimeline = document.getElementById('btnActTimeline');
    const btnTable = document.getElementById('btnActTable');
    const btnAttachments = document.getElementById('btnActAttachments');
    const timelineView = document.getElementById('actTimelineView');
    const tableView = document.getElementById('actTableView');
    const attachmentsView = document.getElementById('actAttachmentsView');
    const filterToolbar = document.getElementById('actFilterToolbar');

    if (btnTimeline) btnTimeline.classList.toggle('active', mode === 'timeline');
    if (btnTable) btnTable.classList.toggle('active', mode === 'table');
    if (btnAttachments) btnAttachments.classList.toggle('active', mode === 'attachments');

    if (timelineView) timelineView.style.display = mode === 'timeline' ? 'block' : 'none';
    if (tableView) tableView.style.display = mode === 'table' ? 'block' : 'none';
    if (attachmentsView) attachmentsView.style.display = mode === 'attachments' ? 'block' : 'none';
    if (filterToolbar) filterToolbar.style.display = mode === 'attachments' ? 'none' : 'flex';

    this.renderActivitiesView();
  }

  renderActivitiesView() {
    const docs = window.crmStore.getDocuments ? window.crmStore.getDocuments() : [];
    const badgeActDocs = document.getElementById('badgeActDocsCount');
    if (badgeActDocs) badgeActDocs.textContent = docs.length;

    // Show/hide delete column header based on admin/delete permission
    const showDeleteCol = window.crmStore.isCurrentUserAdmin() || window.crmStore.canDeleteActivities();
    const deleteColHeader = document.getElementById('actDeleteColHeader');
    if (deleteColHeader) deleteColHeader.style.display = showDeleteCol ? '' : 'none';

    if (this.activityView === 'attachments') {
      this.renderDocumentsView();
      return;

    }

    const search = document.getElementById('actFilterSearch')?.value || '';
    const type = document.getElementById('actFilterType')?.value || '';
    const owner = document.getElementById('actFilterOwner')?.value || '';

    const activities = window.crmStore.filterActivities({ search, activityType: type, bdOwner: owner });

    if (this.activityView === 'timeline') {
      this.renderActivitiesTimeline(activities);
    } else {
      this.renderActivitiesTable(activities);
    }
  }

  renderActivitiesTimeline(activities) {
    const container = document.getElementById('activityTimelineList');
    if (!container) return;

    const isAdmin = window.crmStore.isCurrentUserAdmin();
    const canDelete = window.crmStore.canDeleteActivities();

    if (!activities.length) {
      container.innerHTML = `<div style="padding:20px; text-align:center; color:#64748b;">No client interactions match the search.</div>`;
      return;
    }

    let html = '';
    activities.forEach(a => {
      let iconClass = 'meeting';
      let iconName = 'users';

      if (a.activityType.includes('Call')) { iconClass = 'call'; iconName = 'phone-call'; }
      else if (a.activityType.includes('Proposal')) { iconClass = 'proposal'; iconName = 'file-text'; }
      else if (a.activityType.includes('Negotiation')) { iconClass = 'negotiation'; iconName = 'handshake'; }

      // Look up linked documents for this activity or matching attachment name
      const linkedDocs = window.crmStore.getDocuments({ activityId: a.id });
      let attachmentBadgeHtml = '';
      if (linkedDocs && linkedDocs.length) {
        attachmentBadgeHtml = linkedDocs.map(d => `
          <button class="attachment-badge-pill" onclick="crmApp.openDocumentViewer('${d.id}')" title="Click to preview / download document">
            <i data-lucide="paperclip" style="width:11px; height:11px; color:#ec4899;"></i>
            <span>${d.name} (${d.sizeFormatted || 'PDF'})</span>
          </button>
        `).join('');
      } else if (a.attachment) {
        attachmentBadgeHtml = `
          <span class="attachment-badge-pill" style="cursor:default;">
            <i data-lucide="file-text" style="width:11px; height:11px; color:#0284c7;"></i>
            <span>${a.attachment}</span>
          </span>
        `;
      }

      const deleteBtn = (isAdmin || canDelete) ? `
        <button class="action-icon-btn" title="Delete Interaction Entry (Admin Only)" onclick="crmApp.openDeleteActivityModal('${a.id}')"
          style="margin-left:auto; color:#dc2626; border:1px solid #fca5a5; background:#fff5f5; border-radius:6px; padding:3px 8px; display:inline-flex; align-items:center; gap:4px; font-size:11px; cursor:pointer;">
          <i data-lucide="trash-2" style="width:12px; height:12px;"></i>
          <span>Delete</span>
        </button>
      ` : '';

      html += `
        <div class="timeline-item">
          <div class="timeline-node-icon ${iconClass}">
            <i data-lucide="${iconName}" style="width:11px; height:11px;"></i>
          </div>
          <div class="timeline-content-card">
            <div class="timeline-content-header">
              <div class="timeline-type-title">
                <span class="cell-primary" onclick="crmApp.openProfileDrawer('${a.clientId}')">${a.clientName}</span>
                <span class="badge badge-stage">${a.activityType}</span>
                ${a.oppId ? `<span style="font-family:var(--font-mono); font-size:11px; color:#64748b;">[${a.oppId}]</span>` : ''}
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                <div class="timeline-date-stamp">${a.date}</div>
                ${deleteBtn}
              </div>
            </div>
            <div style="font-size:12.5px; font-weight:700; color:var(--text-primary); margin-bottom:4px;">${a.purpose}</div>
            <div class="timeline-summary">${a.summary}</div>
            
            ${attachmentBadgeHtml ? `
              <div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:4px; align-items:center;">
                <span style="font-size:11px; font-weight:600; color:var(--text-muted); margin-right:4px;">Attachments:</span>
                ${attachmentBadgeHtml}
              </div>
            ` : ''}

            <div class="timeline-details-grid" style="margin-top:8px;">
              ${a.contactPerson ? `<div class="timeline-detail-item"><strong>Contact:</strong> ${a.contactPerson}</div>` : ''}
              <div class="timeline-detail-item"><strong>BD Owner:</strong> ${a.bdMember}</div>
              ${a.nextAction ? `<div class="timeline-detail-item"><strong>Next Action:</strong> ${a.nextAction}</div>` : ''}
              ${a.nextFollowupDate ? `<div class="timeline-detail-item"><strong>Follow-up Due:</strong> ${a.nextFollowupDate}</div>` : ''}
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    if (window.lucide) setTimeout(() => lucide.createIcons(), 50);
  }

  renderActivitiesTable(activities) {
    const tbody = document.getElementById('activitiesTableBody');
    if (!tbody) return;

    const isAdmin = window.crmStore.isCurrentUserAdmin();
    const canDelete = window.crmStore.canDeleteActivities();
    const showDeleteCol = isAdmin || canDelete;

    if (!activities.length) {
      tbody.innerHTML = `<tr><td colspan="${showDeleteCol ? 13 : 12}" style="text-align:center; padding:20px; color:#64748b;">No activities found.</td></tr>`;
      return;
    }

    let html = '';
    activities.forEach(a => {
      const linkedDocs = window.crmStore.getDocuments({ activityId: a.id });
      let attachHtml = '-';
      if (linkedDocs && linkedDocs.length) {
        attachHtml = linkedDocs.map(d => `
          <button class="attachment-badge-pill" onclick="crmApp.openDocumentViewer('${d.id}')" title="${d.name}">
            <i data-lucide="paperclip" style="width:11px; height:11px; color:#ec4899;"></i>
            <span>${d.name.length > 18 ? d.name.substring(0, 16) + '...' : d.name}</span>
          </button>
        `).join('');
      } else if (a.attachment) {
        attachHtml = `<span class="attachment-badge-pill">${a.attachment}</span>`;
      }

      html += `
        <tr>
          <td><span style="font-family:var(--font-mono); font-size:11px;">${a.id}</span></td>
          <td><span style="font-family:var(--font-mono); font-size:11px;">${a.date}</span></td>
          <td><strong class="cell-primary" onclick="crmApp.openProfileDrawer('${a.clientId}')">${a.clientName}</strong></td>
          <td><span style="font-family:var(--font-mono); font-size:11px;">${a.oppId || '-'}</span></td>
          <td><span class="badge badge-stage">${a.activityType}</span></td>
          <td>${a.contactPerson || '-'}</td>
          <td>${a.bdMember}</td>
          <td>
            <strong>${a.purpose}</strong>
            <span class="cell-subtext">${a.summary}</span>
          </td>
          <td>${attachHtml}</td>
          <td>${a.nextAction || '-'}</td>
          <td><span style="font-family:var(--font-mono); font-size:11px; font-weight:600; color:#0284c7;">${a.nextFollowupDate || '-'}</span></td>
          <td><span class="badge badge-won">${a.status}</span></td>
          ${showDeleteCol ? `
          <td style="text-align:right;">
            <button class="action-icon-btn" title="Delete Interaction (Admin)" onclick="crmApp.openDeleteActivityModal('${a.id}')" style="color:#dc2626;">
              <i data-lucide="trash-2" style="width:13px; height:13px;"></i>
            </button>
          </td>` : ''}
        </tr>
      `;
    });

    tbody.innerHTML = html;
    if (window.lucide) setTimeout(() => lucide.createIcons(), 50);
  }

  clearActivityFilters() {
    ['actFilterSearch', 'actFilterType', 'actFilterOwner'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    this.renderActivitiesView();
  }

  // --- Admin-Only: Delete Activity / Interaction Entry ---
  openDeleteActivityModal(activityId) {
    const store = window.crmStore;
    if (!store.isCurrentUserAdmin() && !store.canDeleteActivities()) {
      this.showToast('Access Denied: Only Administrators or users with Delete permission can remove interaction log entries.', 'error');
      return;
    }
    const activity = store.data.activities.find(a => a.id === activityId);
    if (!activity) return;

    this.pendingDeleteActivityId = activityId;
    const promptEl = document.getElementById('deleteActivityPrompt');
    if (promptEl) {
      promptEl.innerHTML = `
        You are about to permanently delete the interaction log entry:<br><br>
        <strong style="color:var(--text-primary);">
          [${activity.id}] ${activity.activityType} — ${activity.clientName}
        </strong><br>
        <span style="color:#64748b; font-size:12px;">Date: ${activity.date} &nbsp;|&nbsp; BD Owner: ${activity.bdMember}</span><br><br>
        <span style="color:#dc2626; font-size:12px;">
          ⚠️ Any linked documents will remain in the repository but lose their activity reference.
          This action cannot be undone.
        </span>
      `;
    }
    document.getElementById('modalDeleteActivity').classList.add('active');
  }

  confirmDeleteActivity() {
    if (!this.pendingDeleteActivityId) return;
    const activity = window.crmStore.data.activities.find(a => a.id === this.pendingDeleteActivityId);
    const label = activity ? `${activity.activityType} — ${activity.clientName}` : 'Entry';

    window.crmStore.deleteActivity(this.pendingDeleteActivityId);
    this.showToast(`Interaction log entry "${label}" permanently deleted.`, 'error');
    this.pendingDeleteActivityId = null;
    this.closeModals();
    this.refreshCurrentView();
  }

  // --- Admin/Permission Restricted: Delete Lead / Opportunity ---
  openDeleteOpportunityModal(oppId) {
    const store = window.crmStore;
    if (!store.isCurrentUserAdmin() && !store.canDeleteOpportunities()) {
      this.showToast('Access Denied: Only Administrators or users with Delete Opportunities permission can remove lead & opportunity entries.', 'error');
      return;
    }
    const opp = store.data.opportunities.find(o => o.id === oppId);
    if (!opp) return;

    this.pendingDeleteOppId = oppId;
    const promptEl = document.getElementById('deleteOpportunityPrompt');
    if (promptEl) {
      promptEl.innerHTML = `
        You are about to permanently delete the lead/opportunity pipeline entry:<br><br>
        <strong style="color:var(--text-primary);">
          [${opp.id}] ${opp.title} — ${opp.clientName}
        </strong><br>
        <span style="color:#64748b; font-size:12px;">Stage: ${opp.stage} &nbsp;|&nbsp; Est. Value: ${window.crmCharts.formatAmount(opp.estimatedValue, this.currency)} &nbsp;|&nbsp; Owner: ${opp.bdOwner}</span><br><br>
        <span style="color:#dc2626; font-size:12px;">
          ⚠️ This deal will be removed from all pipeline views, weighted revenue calculations, and management reports.
          This action cannot be undone.
        </span>
      `;
    }
    document.getElementById('modalDeleteOpportunity').classList.add('active');
  }

  confirmDeleteOpportunity() {
    if (!this.pendingDeleteOppId) return;
    const opp = window.crmStore.data.opportunities.find(o => o.id === this.pendingDeleteOppId);
    const label = opp ? `${opp.title} (${opp.clientName})` : 'Opportunity';

    window.crmStore.deleteOpportunity(this.pendingDeleteOppId);
    this.showToast(`Opportunity "${label}" permanently deleted from pipeline.`, 'error');
    this.pendingDeleteOppId = null;
    this.closeModals();
    this.refreshCurrentView();
    if (this.activeDrawerClientId) {
      this.openProfileDrawer(this.activeDrawerClientId);
    }
  }

  // --- Admin/Permission Restricted: Delete Internal BD Coordination Activity ---
  openDeleteInternalModal(id) {
    const store = window.crmStore;
    if (!store.isCurrentUserAdmin() && !store.canDeleteInternalActivities()) {
      this.showToast('Access Denied: Only Administrators or users with Delete Internal Activities permission can remove internal logs.', 'error');
      return;
    }
    const item = store.data.internalActivities.find(i => i.id === id);
    if (!item) return;

    this.pendingDeleteInternalId = id;
    const promptEl = document.getElementById('deleteInternalPrompt');
    if (promptEl) {
      promptEl.innerHTML = `
        You are about to permanently delete the internal BD coordination task:<br><br>
        <strong style="color:var(--text-primary);">
          [${item.id}] ${item.category} — ${item.description}
        </strong><br>
        <span style="color:#64748b; font-size:12px;">Department: ${item.department} &nbsp;|&nbsp; Person: ${item.personCoordinated} &nbsp;|&nbsp; Date: ${item.date}</span><br><br>
        <span style="color:#dc2626; font-size:12px;">
          ⚠️ This internal task log will be permanently removed.
          This action cannot be undone.
        </span>
      `;
    }
    document.getElementById('modalDeleteInternalActivity').classList.add('active');
  }

  confirmDeleteInternal() {
    if (!this.pendingDeleteInternalId) return;
    const item = window.crmStore.data.internalActivities.find(i => i.id === this.pendingDeleteInternalId);
    const label = item ? `${item.category} — ${item.description}` : 'Task';

    window.crmStore.deleteInternalActivity(this.pendingDeleteInternalId);
    this.showToast(`Internal BD activity "${label}" permanently deleted.`, 'error');
    this.pendingDeleteInternalId = null;
    this.closeModals();
    this.refreshCurrentView();
    if (this.activeDrawerClientId) {
      this.openProfileDrawer(this.activeDrawerClientId);
    }
  }

  // =========================================================================
  // DOCUMENT & ATTACHMENT REPOSITORY CONTROLLER (8MB STRICT LIMIT & MULTI-FILE)
  // =========================================================================

  setDocDisplayMode(mode) {
    this.docDisplayMode = mode;
    const btnGrid = document.getElementById('btnDocGrid');
    const btnTable = document.getElementById('btnDocTable');
    const gridContainer = document.getElementById('docGridContainer');
    const tableContainer = document.getElementById('docTableContainer');

    if (btnGrid) btnGrid.classList.toggle('active', mode === 'grid');
    if (btnTable) btnTable.classList.toggle('active', mode === 'table');
    if (gridContainer) gridContainer.style.display = mode === 'grid' ? 'block' : 'none';
    if (tableContainer) tableContainer.style.display = mode === 'table' ? 'block' : 'none';

    this.renderDocumentsView();
  }

  renderDocumentsView() {
    const search = document.getElementById('docFilterSearch')?.value || '';
    const type = document.getElementById('docFilterType')?.value || '';
    const clientId = document.getElementById('docFilterClient')?.value || '';
    const uploader = document.getElementById('docFilterOwner')?.value || '';

    const allDocs = window.crmStore.getDocuments();
    const filteredDocs = window.crmStore.getDocuments({ search, type, clientId, uploader });

    // 1. Calculate and update KPI summaries
    const totalCount = allDocs.length;
    const proposalCount = allDocs.filter(d => d.type && (d.type.includes('Proposal') || d.type.includes('Rate Card') || d.type.includes('Quotation'))).length;
    const approvalCount = allDocs.filter(d => d.type && (d.type.includes('Approval') || d.type.includes('SLA') || d.type.includes('Contract'))).length;
    const totalBytes = allDocs.reduce((acc, d) => acc + (parseFloat(d.size) || 0), 0);

    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setTxt('kpiDocTotalCount', totalCount);
    setTxt('kpiDocProposalCount', proposalCount);
    setTxt('kpiDocApprovalCount', approvalCount);
    setTxt('kpiDocStorageSize', window.crmStore.formatFileSize(totalBytes));

    const badgeActDocs = document.getElementById('badgeActDocsCount');
    if (badgeActDocs) badgeActDocs.textContent = totalCount;

    // Helper for file extension badge style
    const getExtClass = (ext) => {
      const e = (ext || 'pdf').toLowerCase();
      if (e.includes('pdf')) return 'file-type-pdf';
      if (e.includes('doc')) return 'file-type-word';
      if (e.includes('xls') || e.includes('csv')) return 'file-type-excel';
      if (e.includes('jpg') || e.includes('png') || e.includes('img')) return 'file-type-img';
      return 'file-type-other';
    };

    // 2. Render Cards Grid View
    const gridEl = document.getElementById('docCardsGrid');
    if (gridEl) {
      if (!filteredDocs.length) {
        gridEl.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 36px 20px; text-align: center; background: white; border: 1px solid var(--border-light); border-radius: var(--radius-md);">
            <div style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">No attachment documents found</div>
            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 14px;">Upload commercial proposal PDFs, client email approvals, or quotation sheets below.</div>
            <button class="btn btn-primary btn-sm" onclick="crmApp.openUploadDocumentModal()">
              <i data-lucide="paperclip" style="width:13px; height:13px;"></i> Upload Proposal / Approval PDF
            </button>
          </div>
        `;
      } else {
        gridEl.innerHTML = filteredDocs.map(doc => {
          const extClass = getExtClass(doc.fileExt);
          const extLabel = (doc.fileExt || 'PDF').toUpperCase();
          const badgeType = doc.type.includes('Approval') ? 'badge-won' :
                            doc.type.includes('Proposal') ? 'badge-stage-proposal' :
                            doc.type.includes('SLA') ? 'badge-won' : 'badge-stage';

          return `
            <div class="doc-card">
              <div>
                <div class="doc-card-header">
                  <div class="file-type-icon ${extClass}">${extLabel}</div>
                  <div style="flex:1; min-width:0;">
                    <div class="doc-card-title" title="${doc.name}">${doc.name}</div>
                    <div class="doc-card-meta">
                      <span>${doc.sizeFormatted || '1.2 MB'}</span> • 
                      <span>${doc.uploadDate}</span>
                    </div>
                  </div>
                </div>

                <div style="margin-bottom:8px;">
                  <span class="badge ${badgeType}">${doc.type}</span>
                </div>

                <div style="font-size:12px; color:var(--text-secondary); margin-bottom:6px;">
                  <strong>Client:</strong> <span class="cell-primary" onclick="crmApp.openProfileDrawer('${doc.clientId}')">${doc.clientName || 'General'}</span>
                </div>

                ${doc.oppId ? `
                  <div style="font-size:11.5px; color:var(--text-muted); margin-bottom:6px;">
                    <strong>Opp:</strong> <span style="font-family:var(--font-mono);">${doc.oppId}</span>
                  </div>
                ` : ''}

                ${doc.notes ? `
                  <div style="font-size:11.5px; color:var(--text-muted); background:#f8fafc; padding:6px 8px; border-radius:var(--radius-sm); margin-top:6px; line-height:1.35;">
                    ${doc.notes}
                  </div>
                ` : ''}
              </div>

              <div class="doc-card-footer">
                <div style="font-size:11px; color:var(--text-muted); display:flex; align-items:center; gap:4px;">
                  <i data-lucide="user" style="width:11px; height:11px;"></i>
                  <span>${doc.uploadedBy || 'BD Team'}</span>
                </div>
                <div style="display:flex; gap:6px;">
                  <button class="btn btn-secondary btn-xs" title="Preview document details" onclick="crmApp.openDocumentViewer('${doc.id}')">
                    <i data-lucide="eye" style="width:12px; height:12px;"></i> View
                  </button>
                  <button class="btn btn-primary btn-xs" title="Download document" onclick="crmApp.downloadDocument('${doc.id}')">
                    <i data-lucide="download" style="width:12px; height:12px;"></i> Download
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // 3. Render Table View
    const tableBody = document.getElementById('docTableBody');
    if (tableBody) {
      if (!filteredDocs.length) {
        tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:24px; color:#64748b;">No documents found matching filters.</td></tr>`;
      } else {
        tableBody.innerHTML = filteredDocs.map(doc => {
          const extClass = getExtClass(doc.fileExt);
          const extLabel = (doc.fileExt || 'PDF').toUpperCase();
          const badgeType = doc.type.includes('Approval') ? 'badge-won' :
                            doc.type.includes('Proposal') ? 'badge-stage-proposal' : 'badge-stage';

          return `
            <tr>
              <td><span style="font-family:var(--font-mono); font-size:11px; font-weight:700;">${doc.id}</span></td>
              <td>
                <div style="display:flex; align-items:center; gap:8px;">
                  <div class="file-type-icon ${extClass}" style="width:24px; height:24px; font-size:8px;">${extLabel}</div>
                  <strong class="cell-primary" onclick="crmApp.openDocumentViewer('${doc.id}')">${doc.name}</strong>
                </div>
              </td>
              <td><span class="badge ${badgeType}">${doc.type}</span></td>
              <td>
                <strong class="cell-primary" onclick="crmApp.openProfileDrawer('${doc.clientId}')">${doc.clientName || 'General'}</strong>
                ${doc.oppId ? `<div style="font-family:var(--font-mono); font-size:10.5px; color:var(--text-muted);">${doc.oppId}</div>` : ''}
              </td>
              <td><span style="font-family:var(--font-mono); font-size:11.5px;">${doc.sizeFormatted || '1.2 MB'}</span></td>
              <td><span style="font-family:var(--font-mono); font-size:11.5px;">${doc.uploadDate}</span></td>
              <td>${doc.uploadedBy || 'BD Team'}</td>
              <td style="max-width:200px;"><span style="font-size:11.5px; color:var(--text-secondary);">${doc.notes || '-'}</span></td>
              <td style="text-align:right;">
                <div class="cell-actions" style="justify-content:flex-end;">
                  <button class="action-icon-btn" title="View / Inspect" onclick="crmApp.openDocumentViewer('${doc.id}')">
                    <i data-lucide="eye" style="width:14px; height:14px; color:#0284c7;"></i>
                  </button>
                  <button class="action-icon-btn" title="Download" onclick="crmApp.downloadDocument('${doc.id}')">
                    <i data-lucide="download" style="width:14px; height:14px; color:#16a34a;"></i>
                  </button>
                  <button class="action-icon-btn" title="Delete" onclick="crmApp.deleteDocument('${doc.id}')" style="color:#dc2626;">
                    <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    if (window.lucide) setTimeout(() => lucide.createIcons(), 50);
  }

  clearDocFilters() {
    ['docFilterSearch', 'docFilterType', 'docFilterClient', 'docFilterOwner'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    this.renderDocumentsView();
  }

  // Activity Modal Attachment Handlers
  handleActivityFileSelect(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const maxLimit = window.crmStore.MAX_DOCUMENT_SIZE;
    const warningEl = document.getElementById('actFileLimitWarning');
    let hasOversized = false;
    let oversizedMsg = '';

    files.forEach(f => {
      if (f.size > maxLimit) {
        hasOversized = true;
        oversizedMsg = `File "${f.name}" (${window.crmStore.formatFileSize(f.size)}) exceeds the strict 8MB size limit. Upload rejected.`;
      } else {
        // Read file data URL for persistence
        const reader = new FileReader();
        reader.onload = (event) => {
          this.selectedActivityFiles.push({
            name: f.name,
            size: f.size,
            type: f.type,
            dataUrl: event.target.result
          });
          this.renderActivityFilePreviewList();
        };
        reader.readAsDataURL(f);
      }
    });

    if (warningEl) {
      if (hasOversized) {
        warningEl.style.display = 'flex';
        warningEl.innerHTML = `<i data-lucide="alert-triangle" style="width:15px; height:15px;"></i><span>${oversizedMsg}</span>`;
        this.showToast(oversizedMsg, 'error');
      } else {
        warningEl.style.display = 'none';
      }
    }

    e.target.value = '';
  }

  renderActivityFilePreviewList() {
    const listEl = document.getElementById('actFilePreviewList');
    if (!listEl) return;

    if (!this.selectedActivityFiles.length) {
      listEl.innerHTML = '';
      return;
    }

    listEl.innerHTML = this.selectedActivityFiles.map((file, idx) => `
      <div class="file-preview-item">
        <div class="file-preview-info">
          <div class="file-type-icon file-type-pdf" style="width:26px; height:26px; font-size:9px;">DOC</div>
          <div>
            <div style="font-weight:600; font-size:12px; color:var(--text-primary);">${file.name}</div>
            <div style="font-size:10.5px; color:var(--text-muted);">${window.crmStore.formatFileSize(file.size)} • Ready to save</div>
          </div>
        </div>
        <button type="button" class="action-icon-btn" style="color:#dc2626;" onclick="crmApp.removeActivityFile(${idx})" title="Remove">
          <i data-lucide="x" style="width:13px; height:13px;"></i>
        </button>
      </div>
    `).join('');

    if (window.lucide) setTimeout(() => lucide.createIcons(), 50);
  }

  removeActivityFile(index) {
    this.selectedActivityFiles.splice(index, 1);
    this.renderActivityFilePreviewList();
  }

  // Standalone Document Upload Modal Handlers
  openUploadDocumentModal(presetClientId = null, presetOppId = null) {
    const form = document.getElementById('formUploadDoc');
    if (form) form.reset();
    this.selectedModalDocFiles = [];
    this.renderModalDocPreviewList();

    const warningEl = document.getElementById('modalDocLimitWarning');
    if (warningEl) warningEl.style.display = 'none';

    if (presetClientId) {
      const clientSelect = document.getElementById('docClientSelect');
      if (clientSelect) {
        clientSelect.value = presetClientId;
        this.handleUploadDocClientChange();
      }
    }

    if (presetOppId) {
      const oppSelect = document.getElementById('docOppSelect');
      if (oppSelect) oppSelect.value = presetOppId;
    }

    document.getElementById('modalUploadDoc').classList.add('active');
  }

  handleUploadDocClientChange() {
    this.populateClientOppsDropdown('docClientSelect', 'docOppSelect');
  }

  handleQuickDocDropzone(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    this.openUploadDocumentModal();
    this.handleModalDocFileSelect(e);
  }

  handleModalDocFileSelect(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const maxLimit = window.crmStore.MAX_DOCUMENT_SIZE;
    const warningEl = document.getElementById('modalDocLimitWarning');
    let hasOversized = false;
    let oversizedMsg = '';

    files.forEach(f => {
      if (f.size > maxLimit) {
        hasOversized = true;
        oversizedMsg = `File "${f.name}" (${window.crmStore.formatFileSize(f.size)}) exceeds the strict 8MB size limit.`;
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          this.selectedModalDocFiles.push({
            name: f.name,
            size: f.size,
            type: f.type,
            dataUrl: event.target.result
          });

          // Auto populate doc title if empty
          const titleInput = document.getElementById('docTitleInput');
          if (titleInput && !titleInput.value) {
            titleInput.value = f.name;
          }

          this.renderModalDocPreviewList();
        };
        reader.readAsDataURL(f);
      }
    });

    if (warningEl) {
      if (hasOversized) {
        warningEl.style.display = 'flex';
        warningEl.innerHTML = `<i data-lucide="alert-triangle" style="width:15px; height:15px;"></i><span>${oversizedMsg}</span>`;
        this.showToast(oversizedMsg, 'error');
      } else {
        warningEl.style.display = 'none';
      }
    }

    e.target.value = '';
  }

  renderModalDocPreviewList() {
    const listEl = document.getElementById('modalDocPreviewList');
    if (!listEl) return;

    if (!this.selectedModalDocFiles.length) {
      listEl.innerHTML = '';
      return;
    }

    listEl.innerHTML = this.selectedModalDocFiles.map((file, idx) => `
      <div class="file-preview-item">
        <div class="file-preview-info">
          <div class="file-type-icon file-type-pdf" style="width:26px; height:26px; font-size:9px;">FILE</div>
          <div>
            <div style="font-weight:600; font-size:12px; color:var(--text-primary);">${file.name}</div>
            <div style="font-size:10.5px; color:var(--text-muted);">${window.crmStore.formatFileSize(file.size)} • Valid & ready to upload</div>
          </div>
        </div>
        <button type="button" class="action-icon-btn" style="color:#dc2626;" onclick="crmApp.removeModalDocFile(${idx})" title="Remove">
          <i data-lucide="x" style="width:13px; height:13px;"></i>
        </button>
      </div>
    `).join('');

    if (window.lucide) setTimeout(() => lucide.createIcons(), 50);
  }

  removeModalDocFile(index) {
    this.selectedModalDocFiles.splice(index, 1);
    this.renderModalDocPreviewList();
  }

  handleUploadDocSubmit(e) {
    e.preventDefault();
    const clientId = document.getElementById('docClientSelect').value;
    const client = window.crmStore.data.clients.find(c => c.id === clientId);
    const oppId = document.getElementById('docOppSelect').value;
    const category = document.getElementById('docTypeSelect').value;
    const customTitle = document.getElementById('docTitleInput').value.trim();
    const notes = document.getElementById('docNotesInput').value.trim();

    if (!this.selectedModalDocFiles.length && !customTitle) {
      alert('Please select at least one document file to upload.');
      return;
    }

    const currentUser = window.crmStore.getCurrentUser();
    const uploaderName = currentUser ? currentUser.name : 'BD Team';

    // If files are selected, create record for each file
    if (this.selectedModalDocFiles.length) {
      this.selectedModalDocFiles.forEach(file => {
        window.crmStore.addDocument({
          clientId,
          clientName: client ? client.name : 'Client',
          oppId,
          type: category,
          name: customTitle || file.name,
          size: file.size,
          dataUrl: file.dataUrl,
          uploadedBy: uploaderName,
          notes: notes
        });
      });
      this.showToast(`${this.selectedModalDocFiles.length} document(s) uploaded successfully!`, 'success');
    } else {
      // Create metadata record
      window.crmStore.addDocument({
        clientId,
        clientName: client ? client.name : 'Client',
        oppId,
        type: category,
        name: customTitle || `${category}.pdf`,
        size: 1024 * 1024 * 1.5, // 1.5 MB default sample size
        uploadedBy: uploaderName,
        notes: notes
      });
      this.showToast(`Document record created and shared with team!`, 'success');
    }

    this.selectedModalDocFiles = [];
    this.closeModals();
    this.refreshCurrentView();
  }

  // Document Viewer & Preview Modal Handlers
  openDocumentViewer(docId) {
    const doc = window.crmStore.getDocumentById(docId);
    if (!doc) {
      this.showToast('Document not found.', 'error');
      return;
    }

    this.activeViewerDocId = docId;

    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setTxt('viewDocTitle', doc.name);
    setTxt('viewDocSubtitle', `${doc.type} • Uploaded by ${doc.uploadedBy || 'BD Team'}`);
    setTxt('viewDocCanvasName', doc.name);
    setTxt('viewDocCanvasMeta', `${doc.sizeFormatted || '1.2 MB'} • ${doc.type} • Uploaded on ${doc.uploadDate}`);

    setTxt('viewDocId', doc.id);
    setTxt('viewDocFileName', doc.name);
    setTxt('viewDocCategory', doc.type);
    setTxt('viewDocSize', `${doc.sizeFormatted || '1.2 MB'} (Compliant with 8MB limit)`);
    setTxt('viewDocClient', `${doc.clientName || 'General'} (${doc.clientId || '-'})`);
    setTxt('viewDocOpp', doc.oppId || 'General Client Document');
    setTxt('viewDocDate', doc.uploadDate);
    setTxt('viewDocUploader', doc.uploadedBy || 'BD Team');
    setTxt('viewDocNotes', doc.notes || 'No remarks provided.');

    // Icon class
    const extIcon = document.getElementById('viewDocTypeIcon');
    if (extIcon) {
      const ext = (doc.fileExt || 'PDF').toUpperCase();
      extIcon.textContent = ext;
      extIcon.className = `file-type-icon ${ext.includes('PDF') ? 'file-type-pdf' : ext.includes('DOC') ? 'file-type-word' : ext.includes('XLS') ? 'file-type-excel' : 'file-type-img'}`;
    }

    document.getElementById('modalDocumentViewer').classList.add('active');
    if (window.lucide) setTimeout(() => lucide.createIcons(), 50);
  }

  downloadCurrentViewerDoc() {
    if (this.activeViewerDocId) {
      this.downloadDocument(this.activeViewerDocId);
    }
  }

  downloadDocument(docId) {
    const doc = window.crmStore.getDocumentById(docId);
    if (!doc) return;

    if (doc.dataUrl) {
      const a = document.createElement('a');
      a.href = doc.dataUrl;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Mock instant file download generation
      const blob = new Blob([
        `%PDF-1.4\n%CorpBD CRM Master Document Repository\nDocument ID: ${doc.id}\nTitle: ${doc.name}\nClient: ${doc.clientName}\nType: ${doc.type}\nUploaded By: ${doc.uploadedBy}\nDate: ${doc.uploadDate}\nNotes: ${doc.notes || ''}\n\n[Verified Authentic Enterprise BD Document - Max 8MB Limit Compliant]`
      ], { type: 'application/pdf' });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name.endsWith('.pdf') ? doc.name : `${doc.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    this.showToast(`Downloading "${doc.name}"...`, 'success');
  }

  openDocInNewTab() {
    if (!this.activeViewerDocId) return;
    const doc = window.crmStore.getDocumentById(this.activeViewerDocId);
    if (!doc) return;

    if (doc.dataUrl) {
      const win = window.open();
      win.document.write(`<iframe src="${doc.dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    } else {
      this.downloadDocument(this.activeViewerDocId);
    }
  }

  deleteCurrentViewerDoc() {
    if (this.activeViewerDocId) {
      this.deleteDocument(this.activeViewerDocId);
    }
  }

  deleteDocument(docId) {
    const doc = window.crmStore.getDocumentById(docId);
    if (!doc) return;

    if (confirm(`Remove document "${doc.name}" from CRM repository?`)) {
      window.crmStore.deleteDocument(docId);
      this.showToast(`Document "${doc.name}" removed from repository.`, 'info');
      this.closeModals();
      this.refreshCurrentView();
    }
  }

  // =========================================================================
  // VIEW 5: FOLLOW-UP TRACKER
  // =========================================================================
  renderFollowupsBoard() {
    const store = window.crmStore;
    const owner = document.getElementById('followupFilterOwner')?.value || '';
    const search = (document.getElementById('followupFilterSearch')?.value || '').toLowerCase().trim();

    const todayStr = new Date().toISOString().split('T')[0];

    const opps = store.data.opportunities.filter(o => {
      if (owner && o.bdOwner !== owner) return false;
      if (search && !o.clientName.toLowerCase().includes(search) && !o.title.toLowerCase().includes(search)) return false;
      return true;
    });

    const groups = { today: [], upcoming: [], overdue: [], completed: [] };

    opps.forEach(o => {
      if (o.status === 'Won' || o.status === 'Closed') {
        groups.completed.push(o);
      } else if (!o.nextFollowupDate) {
        groups.upcoming.push(o);
      } else {
        const fDate = o.nextFollowupDate.split('T')[0];
        if (fDate < todayStr) {
          groups.overdue.push(o);
        } else if (fDate === todayStr) {
          groups.today.push(o);
        } else {
          groups.upcoming.push(o);
        }
      }
    });

    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setTxt('badgeCountToday', `${groups.today.length} Tasks`);
    setTxt('badgeCountUpcoming', `${groups.upcoming.length} Tasks`);
    setTxt('badgeCountOverdue', `${groups.overdue.length} Urgent`);
    setTxt('badgeCountCompleted', `${groups.completed.length} Closed`);

    const renderCards = (items, isOverdue = false, isToday = false) => {
      if (!items.length) {
        return `<div style="padding:16px; text-align:center; color:#94a3b8; font-size:12px;">No follow-up actions</div>`;
      }
      return items.map(o => `
        <div class="followup-card ${isOverdue ? 'is-overdue' : ''} ${isToday ? 'is-today' : ''}">
          <div class="followup-card-company">
            <span class="cell-primary" onclick="crmApp.openProfileDrawer('${o.clientId}')">${o.clientName}</span>
            <span class="badge badge-stage">${o.stage}</span>
          </div>
          <div class="followup-card-action">
            <strong>Next:</strong> ${o.nextAction || 'Follow up with procurement'}
          </div>
          <div class="followup-card-meta">
            <span>👤 ${o.bdOwner}</span>
            <span>📅 Due: <strong style="${isOverdue ? 'color:#dc2626;' : ''}">${o.nextFollowupDate || 'Pending'}</strong></span>
          </div>
          <div class="followup-quick-actions">
            <button class="btn-xs btn-complete" onclick="crmApp.quickCompleteFollowup('${o.id}')">✓ Mark Done</button>
            <button class="btn-xs" onclick="crmApp.openAddActivityModal('Follow-up', '${o.clientId}')">+ Log Call/Meet</button>
            <button class="btn-xs" onclick="crmApp.openEditOpportunityModal('${o.id}')">Edit Opp</button>
          </div>
        </div>
      `).join('');
    };

    document.getElementById('listFollowupsToday').innerHTML = renderCards(groups.today, false, true);
    document.getElementById('listFollowupsUpcoming').innerHTML = renderCards(groups.upcoming);
    document.getElementById('listFollowupsOverdue').innerHTML = renderCards(groups.overdue, true);
    document.getElementById('listFollowupsCompleted').innerHTML = renderCards(groups.completed);
  }

  quickCompleteFollowup(oppId) {
    const opp = window.crmStore.data.opportunities.find(o => o.id === oppId);
    if (!opp) return;

    // Push date forward 7 days as standard practice
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 7);
    const dateStr = nextDate.toISOString().split('T')[0];

    window.crmStore.updateOpportunity(oppId, {
      nextFollowupDate: dateStr,
      nextAction: 'Follow up on proposal review progress'
    });

    this.showToast(`Follow-up completed! Next follow-up scheduled for ${dateStr}.`, 'success');
    this.refreshCurrentView();
  }

  // =========================================================================
  // VIEW 6: INTERNAL BD ACTIVITIES
  // =========================================================================
  renderInternalTable() {
    const search = document.getElementById('intFilterSearch')?.value || '';
    const category = document.getElementById('intFilterCategory')?.value || '';
    const dept = document.getElementById('intFilterDept')?.value || '';
    const approval = document.getElementById('intFilterApproval')?.value || '';

    const canDelete = window.crmStore.isCurrentUserAdmin() || window.crmStore.canDeleteInternalActivities();

    const items = window.crmStore.filterInternalActivities({ search, category, department: dept, approvalStatus: approval });
    const tbody = document.getElementById('internalTableBody');
    if (!tbody) return;

    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding:20px; color:#64748b;">No internal coordination tasks found.</td></tr>`;
      return;
    }

    let html = '';
    items.forEach(item => {
      let approvalBadge = 'badge-process';
      if (item.approvalStatus === 'Approved') approvalBadge = 'badge-won';
      else if (item.approvalStatus === 'Pending') approvalBadge = 'badge-overdue';
      else if (item.approvalStatus === 'Rejected') approvalBadge = 'badge-lost';

      html += `
        <tr>
          <td><span style="font-family:var(--font-mono); font-size:11px;">${item.id}</span></td>
          <td><span style="font-family:var(--font-mono); font-size:11px;">${item.date}</span></td>
          <td><span class="badge badge-stage">${item.category}</span></td>
          <td>
            <strong>${item.clientName || 'General BD Work'}</strong>
            ${item.oppId ? `<span class="cell-subtext">${item.oppId}</span>` : ''}
          </td>
          <td><strong>${item.department}</strong></td>
          <td>${item.personCoordinated}</td>
          <td>
            <div style="font-size:12.5px; font-weight:600; color:var(--text-primary);">${item.description}</div>
            <span class="cell-subtext">${item.actionTaken || ''}</span>
          </td>
          <td>
            <span class="badge ${approvalBadge}">${item.approvalStatus}</span>
            ${item.approvalStatus === 'Rejected' && item.rejectionReason ? `
              <div style="margin-top:5px; font-size:10.5px; color:#dc2626; background:#fff5f5; border:1px solid #fca5a5; padding:3px 6px; border-radius:4px; line-height:1.3; max-width:180px;" title="${item.rejectionReason}">
                <strong>Reason:</strong> ${item.rejectionReason}
              </div>
            ` : ''}
          </td>
          <td><span style="color:#0284c7; font-weight:600;">${item.output || '-'}</span></td>
          <td>${item.nextAction || '-'}</td>
          <td><span class="badge ${item.approvalStatus === 'Rejected' ? 'badge-lost' : 'badge-won'}">${item.approvalStatus === 'Rejected' ? 'Rejected' : item.status}</span></td>
          <td style="text-align:right;">
            <div class="cell-actions" style="justify-content:flex-end;">
              <button class="action-icon-btn" title="Approve Request" onclick="crmApp.approveInternalTask('${item.id}')" style="color:#16a34a;">
                <i data-lucide="check-circle" style="width:14px; height:14px;"></i>
              </button>
              <button class="action-icon-btn" title="Reject Request with Reason" onclick="crmApp.openRejectInternalModal('${item.id}')" style="color:#dc2626;">
                <i data-lucide="x-circle" style="width:14px; height:14px;"></i>
              </button>
              ${canDelete ? `
                <button class="action-icon-btn action-btn-danger" title="Delete Task (Admin)" onclick="crmApp.openDeleteInternalModal('${item.id}')" style="color:#dc2626;">
                  <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
    if (window.lucide) setTimeout(() => lucide.createIcons(), 50);
  }

  approveInternalTask(id) {
    const item = window.crmStore.data.internalActivities.find(i => i.id === id);
    if (!item) return;

    window.crmStore.updateInternalActivity(id, {
      approvalStatus: 'Approved',
      approvalDate: new Date().toISOString().split('T')[0]
    });

    this.showToast(`Internal activity "${item.category}" marked as Approved.`, 'success');
    this.refreshCurrentView();
    if (this.activeDrawerClientId) {
      this.openProfileDrawer(this.activeDrawerClientId);
    }
  }

  openRejectInternalModal(id) {
    const item = window.crmStore.data.internalActivities.find(i => i.id === id);
    if (!item) return;

    document.getElementById('rejectInternalTaskId').value = id;
    const summaryEl = document.getElementById('rejectInternalTaskSummary');
    const metaEl = document.getElementById('rejectInternalTaskMeta');
    const reasonInput = document.getElementById('rejectInternalReasonInput');

    if (summaryEl) summaryEl.textContent = `[${item.id}] ${item.category} — ${item.description}`;
    if (metaEl) metaEl.textContent = `Department: ${item.department} | Person: ${item.personCoordinated} | Client: ${item.clientName || 'General BD'}`;
    if (reasonInput) reasonInput.value = item.rejectionReason || '';

    document.getElementById('modalRejectInternalActivity').classList.add('active');
  }

  handleRejectInternalSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('rejectInternalTaskId').value;
    const reason = document.getElementById('rejectInternalReasonInput').value.trim();
    if (!id || !reason) return;

    const item = window.crmStore.data.internalActivities.find(i => i.id === id);
    const label = item ? item.category : 'Activity';

    window.crmStore.updateInternalActivity(id, {
      approvalStatus: 'Rejected',
      rejectionReason: reason,
      rejectedDate: new Date().toISOString().split('T')[0]
    });

    this.showToast(`Internal activity "${label}" marked as Rejected with recorded reason.`, 'error');
    this.closeModals();
    this.refreshCurrentView();
    if (this.activeDrawerClientId) {
      this.openProfileDrawer(this.activeDrawerClientId);
    }
  }

  toggleInternalApproval(id) {
    const item = window.crmStore.data.internalActivities.find(i => i.id === id);
    if (!item) return;

    const newStatus = item.approvalStatus === 'Approved' ? 'Pending' : 'Approved';
    window.crmStore.updateInternalActivity(id, {
      approvalStatus: newStatus,
      approvalDate: newStatus === 'Approved' ? new Date().toISOString().split('T')[0] : ''
    });

    this.showToast(`Internal approval status changed to ${newStatus}`, 'info');
    this.refreshCurrentView();
  }

  clearInternalFilters() {
    ['intFilterSearch', 'intFilterCategory', 'intFilterDept', 'intFilterApproval'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    this.renderInternalTable();
  }

  // =========================================================================
  // VIEW 7: MONTHLY MANAGEMENT REVIEW
  // =========================================================================
  renderMonthlyReview() {
    const month = document.getElementById('reviewMonthSelect')?.value || 'September 2026';
    const store = window.crmStore;
    const metrics = store.getMetrics();
    const fmt = (v) => window.crmCharts.formatAmount(v, this.currency);

    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setTxt('repReviewPeriodText', month);
    setTxt('repGeneratedDateStamp', `Report Generated on ${new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}`);

    // 1. Executive Summary Narrative
    const summaryBox = document.getElementById('reviewExecSummaryBox');
    if (summaryBox) {
      summaryBox.innerHTML = `
        <p>During the review period <strong>${month}</strong>, the Business Development team maintained active engagement across <strong>${metrics.totalClients} client accounts</strong> with a total potential business pipeline of <strong>${fmt(metrics.totalPotentialBusinessValue)}</strong>.</p>
        <p style="margin-top:8px;">A total of <strong>${metrics.opportunitiesWon} key opportunities</strong> have been closed successfully with a total realized contract value of <strong>${fmt(metrics.wonBusinessValue)}</strong>, achieving a deal conversion rate of <strong>${metrics.conversionRate}%</strong>. Currently, <strong>${metrics.opportunitiesInProcess} active opportunities</strong> worth <strong>${fmt(metrics.pipelineValue)}</strong> (weighted value: <strong>${fmt(metrics.weightedPipelineValue)}</strong>) are under active commercial discussions and proposal review.</p>
        <p style="margin-top:8px;">The team completed <strong>${metrics.meetingsConducted} executive meetings</strong> and <strong>${metrics.callsCompleted} structured engagements</strong>. Immediate Management attention is requested on <strong>${metrics.criticalAttention.length} critical items</strong>, including high-value pricing sign-offs and delayed client contract reviews.</p>
      `;
    }

    // 2. Scorecard Grid
    const kpiGrid = document.getElementById('reviewKpiGrid');
    if (kpiGrid) {
      kpiGrid.innerHTML = `
        <div class="kpi-card accent-won">
          <div class="kpi-label">Won Business Value</div>
          <div class="kpi-value" style="color:var(--status-won);">${fmt(metrics.wonBusinessValue)}</div>
          <div class="kpi-subtext">${metrics.opportunitiesWon} Deals Closed</div>
        </div>
        <div class="kpi-card accent-pipeline">
          <div class="kpi-label">Active Pipeline Value</div>
          <div class="kpi-value">${fmt(metrics.pipelineValue)}</div>
          <div class="kpi-subtext">Weighted: ${fmt(metrics.weightedPipelineValue)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Conversion Rate</div>
          <div class="kpi-value">${metrics.conversionRate}%</div>
          <div class="kpi-subtext">Won vs Total Decided</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Commercials Shared</div>
          <div class="kpi-value">${metrics.commercialsShared}</div>
          <div class="kpi-subtext">${metrics.proposalsUnderReview} Under Client Review</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Meetings & Calls</div>
          <div class="kpi-value">${metrics.meetingsConducted + metrics.callsCompleted}</div>
          <div class="kpi-subtext">${metrics.meetingsConducted} Meets | ${metrics.callsCompleted} Calls</div>
        </div>
        <div class="kpi-card accent-urgent">
          <div class="kpi-label">Overdue Actions</div>
          <div class="kpi-value" style="color:var(--status-overdue);">${metrics.followupsOverdue}</div>
          <div class="kpi-subtext">Requires BD Follow-up</div>
        </div>
      `;
    }

    // 3. Management Attention Required
    const attentionList = document.getElementById('reviewAttentionList');
    if (attentionList) {
      if (!metrics.criticalAttention.length) {
        attentionList.innerHTML = `<div style="color:#16a34a; font-weight:600;">No critical bottlenecks or stalled high-value deals requiring Management intervention.</div>`;
      } else {
        attentionList.innerHTML = metrics.criticalAttention.map(item => `
          <div class="attention-list-item">
            <span class="badge ${item.severity === 'urgent' ? 'badge-lost' : 'badge-hold'}">${item.type}</span>
            <div>
              <strong>${item.client}</strong> (${fmt(item.value)}) - <span>${item.message}</span>
              <span style="color:#64748b; font-size:11.5px; margin-left:6px;">[Owner: ${item.owner}]</span>
            </div>
          </div>
        `).join('');
      }
    }

    // 4. Key Wins Table
    const winsTbody = document.getElementById('reviewWinsTableBody');
    if (winsTbody) {
      if (!metrics.wonOpps.length) {
        winsTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:16px; color:#64748b;">No opportunities closed as Won during this period.</td></tr>`;
      } else {
        winsTbody.innerHTML = metrics.wonOpps.map(o => `
          <tr>
            <td><strong class="cell-primary" onclick="crmApp.openProfileDrawer('${o.clientId}')">${o.clientName}</strong></td>
            <td>${o.title}</td>
            <td class="cell-amount" style="color:var(--status-won);">${fmt(o.finalContractValue || o.estimatedValue)}</td>
            <td>${o.bdOwner}</td>
            <td><span style="font-family:var(--font-mono); font-size:11px;">${o.wonDate || o.lastActivityDate}</span></td>
            <td>${o.remarks || 'Contract finalized.'}</td>
          </tr>
        `).join('');
      }
    }

    // 5. Key Losses Table
    const lossesTbody = document.getElementById('reviewLossesTableBody');
    if (lossesTbody) {
      if (!metrics.lostOpps.length) {
        lossesTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:16px; color:#64748b;">No lost opportunities recorded during this period.</td></tr>`;
      } else {
        lossesTbody.innerHTML = metrics.lostOpps.map(o => `
          <tr>
            <td><strong class="cell-primary" onclick="crmApp.openProfileDrawer('${o.clientId}')">${o.clientName}</strong></td>
            <td>${o.title}</td>
            <td class="cell-amount">${fmt(o.estimatedValue)}</td>
            <td><span class="badge badge-lost">${o.lostReason || 'Price Issue'}</span></td>
            <td>${o.competitorWon || 'Competitor'}</td>
            <td>${o.remarks || '-'}</td>
          </tr>
        `).join('');
      }
    }

    // 6. Top Pipeline Opportunities Table
    const topOppsTbody = document.getElementById('reviewTopOppsTableBody');
    if (topOppsTbody) {
      const topOpps = [...metrics.inProcessOpps].sort((a, b) => (b.estimatedValue || 0) - (a.estimatedValue || 0)).slice(0, 6);
      topOppsTbody.innerHTML = topOpps.map(o => `
        <tr>
          <td><strong class="cell-primary" onclick="crmApp.openProfileDrawer('${o.clientId}')">${o.clientName}</strong></td>
          <td>${o.title}</td>
          <td class="cell-amount">${fmt(o.estimatedValue)}</td>
          <td><span class="badge badge-stage">${o.stage}</span></td>
          <td><strong>${o.probability}%</strong></td>
          <td><span style="font-family:var(--font-mono); font-size:11px;">${o.expectedClosureDate || '-'}</span></td>
          <td>${o.bdOwner}</td>
          <td><span style="color:var(--brand-primary); font-weight:600;">${o.nextAction || '-'}</span></td>
        </tr>
      `).join('');
    }

    // 7. Team Productivity Table
    const teamTbody = document.getElementById('reviewTeamTableBody');
    if (teamTbody) {
      const teamList = store.getTeamMembers ? store.getTeamMembers() : [];
      const execStats = teamList.map(exec => {
        const myOpps = store.data.opportunities.filter(o => o.bdOwner === exec.name);
        const myActs = store.data.activities.filter(a => a.bdMember === exec.name);
        const myInt = store.data.internalActivities.filter(i => i.teamMember === exec.name);
        const wonVal = myOpps.filter(o => o.status === 'Won').reduce((sum, o) => sum + (parseFloat(o.finalContractValue || o.estimatedValue) || 0), 0);

        return {
          name: exec.name,
          activeOpps: myOpps.filter(o => o.status === 'In Process' || o.status === 'Open').length,
          meets: myActs.filter(a => a.activityType.includes('Meeting') || a.activityType.includes('Visit')).length,
          calls: myActs.filter(a => a.activityType.includes('Call') || a.activityType.includes('WhatsApp')).length,
          proposals: myOpps.filter(o => o.commercialShared === 'Yes').length,
          internalTasks: myInt.length,
          wonVal
        };
      });

      teamTbody.innerHTML = execStats.map(s => `
        <tr>
          <td><strong>${s.name}</strong></td>
          <td>${s.activeOpps} Opportunities</td>
          <td>${s.meets} Meetings</td>
          <td>${s.calls} Calls</td>
          <td>${s.proposals} Proposals</td>
          <td>${s.internalTasks} Tasks</td>
          <td class="cell-amount" style="color:var(--status-won);">${fmt(s.wonVal)}</td>
        </tr>
      `).join('');
    }
  }

  // =========================================================================
  // CLIENT 360° PROFILE DRAWER
  // =========================================================================
  openProfileDrawer(clientIdOrName) {
    const store = window.crmStore;
    const client = store.data.clients.find(c => c.id === clientIdOrName || c.name === clientIdOrName);
    if (!client) return;

    this.activeDrawerClientId = client.id;
    const drawer = document.getElementById('clientProfileDrawer');
    const backdrop = document.getElementById('drawerBackdrop');

    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setTxt('drawClientName', client.name);
    setTxt('drawClientId', client.id);
    setTxt('drawClientSegment', client.segment);
    setTxt('drawClientLocation', client.location);
    setTxt('drawClientPriority', client.priority);

    const clientOpps = store.data.opportunities.filter(o => o.clientId === client.id);
    const clientActs = store.data.activities.filter(a => a.clientId === client.id);
    const clientInt = store.data.internalActivities.filter(i => i.clientId === client.id);
    const clientDocs = store.getDocuments ? store.getDocuments({ clientId: client.id }) : [];

    setTxt('drawOppsCount', clientOpps.length);
    setTxt('drawActsCount', clientActs.length);
    setTxt('drawDocsCount', clientDocs.length);
    setTxt('drawInternalCount', clientInt.length);

    // Render Overview
    const totalPipeline = clientOpps.reduce((sum, o) => sum + (parseFloat(o.estimatedValue) || 0), 0);
    const wonVal = clientOpps.filter(o => o.status === 'Won').reduce((sum, o) => sum + (parseFloat(o.finalContractValue || o.estimatedValue) || 0), 0);

    const overviewContainer = document.getElementById('drawerOverviewContent');
    if (overviewContainer) {
      overviewContainer.innerHTML = `
        <div class="kpi-grid" style="margin-bottom:18px;">
          <div class="kpi-card accent-pipeline">
            <div class="kpi-label">Total Pipeline</div>
            <div class="kpi-value">${window.crmCharts.formatAmount(totalPipeline, this.currency)}</div>
          </div>
          <div class="kpi-card accent-won">
            <div class="kpi-label">Won Business</div>
            <div class="kpi-value" style="color:var(--status-won);">${window.crmCharts.formatAmount(wonVal, this.currency)}</div>
          </div>
        </div>

        <div style="background:var(--bg-subtle); padding:16px; border-radius:var(--radius-md); margin-bottom:18px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <h4 style="font-size:13.5px; font-weight:700; color:var(--text-primary);">Primary Corporate Information</h4>
            <button class="btn btn-secondary btn-xs" onclick="crmApp.openEditClientModal('${client.id}')">
              <i data-lucide="edit-3" style="width:11px; height:11px;"></i> Edit Details
            </button>
          </div>
          <div class="form-grid">
            <div><strong style="color:#64748b; font-size:11.5px;">Registered Company:</strong><div>${client.company || client.name}</div></div>
            <div><strong style="color:#64748b; font-size:11.5px;">Business Group:</strong><div>${client.businessGroup || '-'}</div></div>
            <div><strong style="color:#64748b; font-size:11.5px;">Key Contact Person:</strong><div>${client.contactPerson} (${client.designation || 'Contact'})</div></div>
            <div><strong style="color:#64748b; font-size:11.5px;">Direct Contact:</strong><div>${client.mobile || '-'} • ${client.email || '-'}</div></div>
            <div><strong style="color:#64748b; font-size:11.5px;">Relationship Owner:</strong><div>${client.bdOwner}</div></div>
            <div><strong style="color:#64748b; font-size:11.5px;">Lead Source:</strong><div>${client.leadSource || '-'}</div></div>
          </div>
        </div>

        <div style="background:#f0f9ff; border:1px solid #bae6fd; padding:14px; border-radius:var(--radius-md); margin-bottom:18px;">
          <strong style="color:#0369a1; font-size:12.5px;">Next Planned Follow-up & Action:</strong>
          <div style="font-size:13.5px; font-weight:700; color:#0c4a6e; margin-top:4px;">${client.nextFollowupDate || 'No scheduled follow-up'}</div>
          <div style="font-size:12.5px; color:#0369a1; margin-top:2px;">${client.remarks || 'Maintain continuous BD relationship touchpoints.'}</div>
        </div>

        <div style="margin-bottom:18px;">
          <h4 style="font-size:13px; font-weight:700; margin-bottom:6px;">Existing & Expansion Scope:</h4>
          <p style="font-size:12.5px; color:var(--text-secondary);"><strong>Existing Services:</strong> ${client.existingServices || 'None'}</p>
          <p style="font-size:12.5px; color:var(--text-secondary); margin-top:4px;"><strong>Potential Expansion:</strong> ${client.potentialServices || 'Under discussion'}</p>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:20px; border-top:1px solid var(--border-light); padding-top:14px;">
          <button class="btn btn-secondary btn-xs" onclick="crmApp.openEditClientModal('${client.id}')">Edit Client Record</button>
          <button class="btn btn-danger btn-xs" onclick="crmApp.deleteClient('${client.id}')">Delete / Archive Client</button>
        </div>
      `;
    }

    // Render Linked Opportunities
    const oppsList = document.getElementById('drawerOppsList');
    if (oppsList) {
      if (!clientOpps.length) {
        oppsList.innerHTML = `<div style="padding:16px; text-align:center; color:#64748b;">No opportunities logged for this client yet.</div>`;
      } else {
        oppsList.innerHTML = clientOpps.map(o => `
          <div class="followup-card" style="margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong style="font-size:13.5px;">${o.title}</strong>
              <span class="badge ${o.status === 'Won' ? 'badge-won' : (o.status === 'Lost' ? 'badge-lost' : 'badge-process')}">${o.status}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:6px; font-size:12px;">
              <span>Stage: <strong>${o.stage}</strong> (${o.probability}%)</span>
              <span class="cell-amount">${window.crmCharts.formatAmount(o.estimatedValue, this.currency)}</span>
            </div>
            <div style="font-size:11.5px; color:var(--text-muted); margin-top:6px;">Next: ${o.nextAction || 'Pending action'}</div>
          </div>
        `).join('');
      }
    }

    // Render Timeline Feed
    const timelineList = document.getElementById('drawerTimelineList');
    if (timelineList) {
      if (!clientActs.length) {
        timelineList.innerHTML = `<div style="padding:16px; text-align:center; color:#64748b;">No client meetings or calls logged yet.</div>`;
      } else {
        timelineList.innerHTML = clientActs.map(a => `
          <div class="timeline-item">
            <div class="timeline-node-icon meeting"><i data-lucide="calendar" style="width:10px; height:10px;"></i></div>
            <div class="timeline-content-card">
              <div class="timeline-content-header">
                <strong>${a.activityType} - ${a.purpose}</strong>
                <span class="timeline-date-stamp">${a.date}</span>
              </div>
              <div class="timeline-summary">${a.summary}</div>
              <div style="font-size:11.5px; color:#64748b; margin-top:4px;">BD Member: ${a.bdMember} • Contact: ${a.contactPerson || '-'}</div>
            </div>
          </div>
        `).join('');
      }
    }

    // Render Client Documents & Proposals Repository
    const docsList = document.getElementById('drawerDocsList');
    if (docsList) {
      if (!clientDocs.length) {
        docsList.innerHTML = `
          <div style="padding:24px; text-align:center; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:var(--radius-md);">
            <div style="font-weight:700; font-size:13px; color:var(--text-primary); margin-bottom:4px;">No proposals or email approvals attached yet</div>
            <div style="font-size:11.5px; color:var(--text-muted); margin-bottom:12px;">Attach proposal PDFs, quotations or email approvals (up to 8MB each).</div>
            <button class="btn btn-primary btn-xs" onclick="crmApp.openUploadDocumentModal('${client.id}')">
              <i data-lucide="paperclip" style="width:12px; height:12px;"></i> Upload PDF / Proposal
            </button>
          </div>
        `;
      } else {
        docsList.innerHTML = clientDocs.map(d => `
          <div class="followup-card" style="margin-bottom:10px; border-left: 3px solid #0284c7;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div style="display:flex; align-items:center; gap:8px;">
                <div class="file-type-icon file-type-pdf" style="width:24px; height:24px; font-size:8px;">PDF</div>
                <div>
                  <strong class="cell-primary" onclick="crmApp.openDocumentViewer('${d.id}')" style="font-size:13px;">${d.name}</strong>
                  <div style="font-size:11px; color:var(--text-muted);">${d.sizeFormatted || '1.2 MB'} • Uploaded by ${d.uploadedBy || 'BD Team'} on ${d.uploadDate}</div>
                </div>
              </div>
              <span class="badge badge-stage-proposal" style="font-size:10px;">${d.type}</span>
            </div>
            ${d.notes ? `<div style="font-size:11.5px; color:var(--text-secondary); margin-top:6px; background:#f8fafc; padding:4px 8px; border-radius:var(--radius-sm);">${d.notes}</div>` : ''}
            <div style="display:flex; justify-content:flex-end; gap:6px; margin-top:8px;">
              <button class="btn btn-secondary btn-xs" onclick="crmApp.openDocumentViewer('${d.id}')">
                <i data-lucide="eye" style="width:11px; height:11px;"></i> View
              </button>
              <button class="btn btn-primary btn-xs" onclick="crmApp.downloadDocument('${d.id}')">
                <i data-lucide="download" style="width:11px; height:11px;"></i> Download
              </button>
            </div>
          </div>
        `).join('');
      }
    }

    // Render Internal Tasks
    const internalList = document.getElementById('drawerInternalList');
    if (internalList) {
      if (!clientInt.length) {
        internalList.innerHTML = `<div style="padding:16px; text-align:center; color:#64748b;">No internal coordination tasks logged.</div>`;
      } else {
        const canDeleteInt = window.crmStore.isCurrentUserAdmin() || window.crmStore.canDeleteInternalActivities();
        internalList.innerHTML = clientInt.map(i => `
          <div class="followup-card" style="margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong>${i.category}</strong>
              <div style="display:flex; align-items:center; gap:6px;">
                <span class="badge ${i.approvalStatus === 'Approved' ? 'badge-won' : (i.approvalStatus === 'Rejected' ? 'badge-lost' : 'badge-overdue')}">${i.approvalStatus}</span>
                ${canDeleteInt ? `
                  <button class="action-icon-btn action-btn-danger" title="Delete Internal Activity" onclick="crmApp.openDeleteInternalModal('${i.id}')" style="color:#dc2626; padding:2px;">
                    <i data-lucide="trash-2" style="width:13px; height:13px;"></i>
                  </button>
                ` : ''}
              </div>
            </div>
            <div style="font-size:12.5px; margin-top:4px;">${i.description}</div>
            ${i.approvalStatus === 'Rejected' && i.rejectionReason ? `
              <div style="margin-top:6px; font-size:11.5px; color:#dc2626; background:#fff5f5; border:1px solid #fca5a5; padding:4px 8px; border-radius:var(--radius-sm);">
                <strong>Rejection Reason:</strong> ${i.rejectionReason}
              </div>
            ` : ''}
            <div style="font-size:11.5px; color:#64748b; margin-top:4px;">Dept: ${i.department} • Coordinated with: ${i.personCoordinated}</div>
          </div>
        `).join('');
      }
    }

    this.switchDrawerTab('draw-overview');
    if (drawer) drawer.classList.add('open');
    if (backdrop) backdrop.classList.add('active');

    if (window.lucide) setTimeout(() => lucide.createIcons(), 50);
  }

  closeProfileDrawer() {
    const drawer = document.getElementById('clientProfileDrawer');
    const backdrop = document.getElementById('drawerBackdrop');
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
  }

  switchDrawerTab(tabId) {
    document.querySelectorAll('.drawer-nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-drawertab') === tabId);
    });

    document.querySelectorAll('.drawer-tab-content').forEach(content => {
      content.style.display = content.id === tabId ? 'block' : 'none';
    });
  }

  // =========================================================================
  // MODALS & DATA ENTRY HANDLERS
  // =========================================================================

  closeModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
  }

  // Modal 1: Add/Edit Client
  openAddClientModal() {
    const form = document.getElementById('formClient');
    if (form) form.reset();
    document.getElementById('clientFormId').value = '';
    document.getElementById('modalClientTitle').textContent = 'Add New Master Client Record';
    document.getElementById('clientDuplicateAlert').style.display = 'none';

    document.getElementById('modalClient').classList.add('active');
  }

  openEditClientModal(clientId) {
    const client = window.crmStore.data.clients.find(c => c.id === clientId);
    if (!client) return;

    this.openAddClientModal();
    document.getElementById('modalClientTitle').textContent = `Edit Client: ${client.name}`;
    document.getElementById('clientFormId').value = client.id;

    document.getElementById('clientNameInput').value = client.name || '';
    document.getElementById('clientCompanyInput').value = client.company || '';
    document.getElementById('clientGroupInput').value = client.businessGroup || '';
    document.getElementById('clientSegmentSelect').value = client.segment || '';
    document.getElementById('clientIndustrySelect').value = client.industry || '';
    document.getElementById('clientLocationInput').value = client.location || '';
    document.getElementById('clientWebsiteInput').value = client.website || '';
    document.getElementById('clientTypeSelect').value = client.clientType || 'New';
    document.getElementById('clientContactInput').value = client.contactPerson || '';
    document.getElementById('clientDesignationInput').value = client.designation || '';
    document.getElementById('clientMobileInput').value = client.mobile || '';
    document.getElementById('clientEmailInput').value = client.email || '';
    document.getElementById('clientOwnerSelect').value = client.bdOwner || '';
    document.getElementById('clientSourceSelect').value = client.leadSource || '';
    document.getElementById('clientPrioritySelect').value = client.priority || 'Medium';
    document.getElementById('clientExistingBizSelect').value = client.existingBusiness || 'No';
    document.getElementById('clientExistingServicesInput').value = client.existingServices || '';
    document.getElementById('clientPotentialServicesInput').value = client.potentialServices || '';
    document.getElementById('clientRemarksInput').value = client.remarks || '';
  }

  checkClientDuplicates() {
    const name = document.getElementById('clientNameInput').value;
    const email = document.getElementById('clientEmailInput').value;
    const currentId = document.getElementById('clientFormId').value;

    const dup = window.crmStore.checkDuplicateClient(name, email, currentId);
    const alertBox = document.getElementById('clientDuplicateAlert');
    const msg = document.getElementById('clientDuplicateMsg');

    if (dup && alertBox) {
      alertBox.style.display = 'flex';
      msg.textContent = `Warning: A similar client "${dup.name}" (${dup.id}) already exists with owner ${dup.bdOwner}.`;
    } else if (alertBox) {
      alertBox.style.display = 'none';
    }
  }

  handleClientSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('clientFormId').value;

    const clientData = {
      name: document.getElementById('clientNameInput').value.trim(),
      company: document.getElementById('clientCompanyInput').value.trim(),
      businessGroup: document.getElementById('clientGroupInput').value.trim(),
      segment: document.getElementById('clientSegmentSelect').value,
      industry: document.getElementById('clientIndustrySelect').value,
      location: document.getElementById('clientLocationInput').value.trim(),
      website: document.getElementById('clientWebsiteInput').value.trim(),
      clientType: document.getElementById('clientTypeSelect').value,
      contactPerson: document.getElementById('clientContactInput').value.trim(),
      designation: document.getElementById('clientDesignationInput').value.trim(),
      mobile: document.getElementById('clientMobileInput').value.trim(),
      email: document.getElementById('clientEmailInput').value.trim(),
      bdOwner: document.getElementById('clientOwnerSelect').value,
      leadSource: document.getElementById('clientSourceSelect').value,
      priority: document.getElementById('clientPrioritySelect').value,
      existingBusiness: document.getElementById('clientExistingBizSelect').value,
      existingServices: document.getElementById('clientExistingServicesInput').value.trim(),
      potentialServices: document.getElementById('clientPotentialServicesInput').value.trim(),
      remarks: document.getElementById('clientRemarksInput').value.trim()
    };

    if (id) {
      window.crmStore.updateClient(id, clientData);
      this.showToast(`Client ${clientData.name} updated successfully!`, 'success');
    } else {
      window.crmStore.addClient(clientData);
      this.showToast(`New client ${clientData.name} added to Master Database!`, 'success');
    }

    this.populateClientSelectDropdowns();
    this.closeModals();
    this.refreshCurrentView();
  }

  // Modal 2: Add/Edit Opportunity
  openAddOpportunityModal(presetClientId = null) {
    const form = document.getElementById('formOpportunity');
    if (form) form.reset();
    document.getElementById('oppFormId').value = '';
    document.getElementById('modalOppTitle').textContent = 'Add New Opportunity / Enquiry';
    document.getElementById('oppDateInput').value = new Date().toISOString().split('T')[0];
    document.getElementById('groupLostFields').style.display = 'none';

    if (presetClientId) {
      document.getElementById('oppClientSelect').value = presetClientId;
      this.handleOppClientChange();
    }

    document.getElementById('modalOpportunity').classList.add('active');
  }

  openEditOpportunityModal(oppId) {
    const opp = window.crmStore.data.opportunities.find(o => o.id === oppId);
    if (!opp) return;

    this.openAddOpportunityModal();
    document.getElementById('modalOppTitle').textContent = `Edit Opportunity: ${opp.id}`;
    document.getElementById('oppFormId').value = opp.id;

    document.getElementById('oppClientSelect').value = opp.clientId || '';
    document.getElementById('oppContactInput').value = opp.contactPerson || '';
    document.getElementById('oppTitleInput').value = opp.title || '';
    document.getElementById('oppSegmentSelect').value = opp.segment || '';
    document.getElementById('oppProductInput').value = opp.product || '';
    document.getElementById('oppDateInput').value = opp.leadDate || '';
    document.getElementById('oppOwnerSelect').value = opp.bdOwner || '';
    document.getElementById('oppEstValInput').value = opp.estimatedValue || '';
    document.getElementById('oppMonthlyValInput').value = opp.monthlyValue || '';
    document.getElementById('oppStageSelect').value = opp.stage || '';
    document.getElementById('oppProbInput').value = opp.probability !== undefined ? opp.probability : 50;
    document.getElementById('oppStatusSelect').value = opp.status || 'In Process';
    document.getElementById('oppClosureDateInput').value = opp.expectedClosureDate || '';
    document.getElementById('oppCommercialSharedSelect').value = opp.commercialShared || 'No';
    document.getElementById('oppProposalDateInput').value = opp.proposalDate || '';
    document.getElementById('oppCompetitorInput').value = opp.competitor || '';
    document.getElementById('oppApprovalReqSelect').value = opp.managementApprovalRequired || 'No';
    document.getElementById('oppNextActionInput').value = opp.nextAction || '';
    document.getElementById('oppNextFollowupInput').value = opp.nextFollowupDate || '';
    document.getElementById('oppClientReviewStatusInput').value = opp.clientReviewStatus || '';
    document.getElementById('oppRemarksInput').value = opp.remarks || '';

    this.handleStatusChange();
  }

  handleOppClientChange() {
    const clientId = document.getElementById('oppClientSelect').value;
    const client = window.crmStore.data.clients.find(c => c.id === clientId);
    if (client) {
      document.getElementById('oppContactInput').value = client.contactPerson || '';
      document.getElementById('oppSegmentSelect').value = client.segment || '';
      document.getElementById('oppOwnerSelect').value = client.bdOwner || '';
    }
  }

  handleStageChange() {
    const select = document.getElementById('oppStageSelect');
    const selectedOption = select.options[select.selectedIndex];
    const prob = selectedOption.getAttribute('data-prob');
    if (prob) {
      document.getElementById('oppProbInput').value = prob;
    }
    const stage = select.value;
    if (stage === 'Won') {
      document.getElementById('oppStatusSelect').value = 'Won';
    } else if (stage === 'Lost') {
      document.getElementById('oppStatusSelect').value = 'Lost';
    }
    this.handleStatusChange();
  }

  handleStatusChange() {
    const status = document.getElementById('oppStatusSelect').value;
    const lostGroup = document.getElementById('groupLostFields');
    if (lostGroup) {
      lostGroup.style.display = status === 'Lost' ? 'block' : 'none';
    }
  }

  autoCalcOppValues() {
    const annualVal = parseFloat(document.getElementById('oppEstValInput').value) || 0;
    if (annualVal > 0) {
      document.getElementById('oppMonthlyValInput').value = Math.round(annualVal / 12);
    }
  }

  handleOppSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('oppFormId').value;
    const clientId = document.getElementById('oppClientSelect').value;
    const client = window.crmStore.data.clients.find(c => c.id === clientId);

    const oppData = {
      clientId,
      clientName: client ? client.name : 'Client',
      contactPerson: document.getElementById('oppContactInput').value.trim(),
      title: document.getElementById('oppTitleInput').value.trim(),
      segment: document.getElementById('oppSegmentSelect').value,
      product: document.getElementById('oppProductInput').value.trim(),
      leadDate: document.getElementById('oppDateInput').value,
      bdOwner: document.getElementById('oppOwnerSelect').value,
      estimatedValue: parseFloat(document.getElementById('oppEstValInput').value) || 0,
      monthlyValue: parseFloat(document.getElementById('oppMonthlyValInput').value) || 0,
      annualValue: parseFloat(document.getElementById('oppEstValInput').value) || 0,
      stage: document.getElementById('oppStageSelect').value,
      probability: parseInt(document.getElementById('oppProbInput').value, 10) || 0,
      status: document.getElementById('oppStatusSelect').value,
      expectedClosureDate: document.getElementById('oppClosureDateInput').value,
      commercialShared: document.getElementById('oppCommercialSharedSelect').value,
      proposalDate: document.getElementById('oppProposalDateInput').value,
      competitor: document.getElementById('oppCompetitorInput').value.trim(),
      managementApprovalRequired: document.getElementById('oppApprovalReqSelect').value,
      nextAction: document.getElementById('oppNextActionInput').value.trim(),
      nextFollowupDate: document.getElementById('oppNextFollowupInput').value,
      clientReviewStatus: document.getElementById('oppClientReviewStatusInput').value.trim(),
      remarks: document.getElementById('oppRemarksInput').value.trim()
    };

    if (oppData.status === 'Lost') {
      oppData.lostReason = document.getElementById('oppLostReasonSelect').value;
      oppData.competitorWon = document.getElementById('oppCompetitorWonInput').value.trim();
      oppData.lostDate = new Date().toISOString().split('T')[0];
    }

    if (id) {
      window.crmStore.updateOpportunity(id, oppData);
      this.showToast(`Opportunity ${id} updated successfully!`, 'success');
    } else {
      window.crmStore.addOpportunity(oppData);
      this.showToast(`New Opportunity created! Pipeline & dashboard updated.`, 'success');
    }

    this.closeModals();
    this.refreshCurrentView();
  }

  quickMarkOppWon(oppId) {
    const opp = window.crmStore.data.opportunities.find(o => o.id === oppId);
    if (!opp) return;

    window.crmStore.updateOpportunity(oppId, {
      status: 'Won',
      stage: 'Won',
      probability: 100,
      wonDate: new Date().toISOString().split('T')[0],
      finalContractValue: opp.estimatedValue
    });

    this.showToast(`🎉 Deal Won! ${opp.clientName} closed for ${window.crmCharts.formatAmount(opp.estimatedValue, this.currency)}!`, 'success');
    this.refreshCurrentView();
  }

  quickMarkOppLost(oppId) {
    const opp = window.crmStore.data.opportunities.find(o => o.id === oppId);
    if (!opp) return;

    const reason = prompt('Please enter the reason this opportunity was lost:', 'Price Issue');
    if (reason === null) return;

    window.crmStore.updateOpportunity(oppId, {
      status: 'Lost',
      stage: 'Lost',
      probability: 0,
      lostReason: reason || 'Other',
      lostDate: new Date().toISOString().split('T')[0]
    });

    this.showToast(`Opportunity marked as Lost. Root-cause logged in Review section.`, 'error');
    this.refreshCurrentView();
  }

  // Modal 3: Add Interaction / Activity
  openAddActivityModal(presetType = 'Physical Meeting', presetClientId = null) {
    const form = document.getElementById('formActivity');
    if (form) form.reset();
    this.selectedActivityFiles = [];
    this.renderActivityFilePreviewList();

    const warningEl = document.getElementById('actFileLimitWarning');
    if (warningEl) warningEl.style.display = 'none';

    document.getElementById('actDateInput').value = new Date().toISOString().split('T')[0];
    document.getElementById('actTypeSelect').value = presetType;

    if (presetClientId) {
      document.getElementById('actClientSelect').value = presetClientId;
      this.populateClientOppsDropdown('actClientSelect', 'actOppSelect');
    }

    document.getElementById('modalActivity').classList.add('active');
  }

  handleActivitySubmit(e) {
    e.preventDefault();
    const clientId = document.getElementById('actClientSelect').value;
    const client = window.crmStore.data.clients.find(c => c.id === clientId);
    const oppId = document.getElementById('actOppSelect').value;
    const docCategory = document.getElementById('actDocCategorySelect')?.value || 'Commercial Proposal PDF';
    const docNotes = document.getElementById('actDocNotesInput')?.value.trim() || '';

    // First create activity record
    const actData = {
      clientId,
      clientName: client ? client.name : 'Client',
      oppId: oppId || '',
      date: document.getElementById('actDateInput').value,
      activityType: document.getElementById('actTypeSelect').value,
      contactPerson: document.getElementById('actContactInput').value.trim(),
      bdMember: document.getElementById('actOwnerSelect').value,
      purpose: document.getElementById('actPurposeInput').value.trim(),
      summary: document.getElementById('actSummaryInput').value.trim(),
      clientCommitment: document.getElementById('actClientCommitmentInput').value.trim(),
      bdCommitment: document.getElementById('actBDCommitmentInput').value.trim(),
      nextAction: document.getElementById('actNextActionInput').value.trim(),
      nextFollowupDate: document.getElementById('actNextFollowupInput').value,
      attachment: this.selectedActivityFiles.length ? this.selectedActivityFiles.map(f => f.name).join(', ') : ''
    };

    const newAct = window.crmStore.addActivity(actData);

    // If documents were attached, persist each in the document repository
    if (this.selectedActivityFiles.length > 0) {
      this.selectedActivityFiles.forEach(file => {
        window.crmStore.addDocument({
          clientId,
          clientName: client ? client.name : 'Client',
          oppId: oppId || '',
          activityId: newAct.id,
          type: docCategory,
          name: file.name,
          size: file.size,
          dataUrl: file.dataUrl,
          uploadedBy: actData.bdMember,
          notes: docNotes || `Attached during interaction: ${actData.purpose}`
        });
      });
    }

    this.selectedActivityFiles = [];
    this.showToast(`Client interaction logged with ${actData.attachment ? 'attachments' : 'details'}!`, 'success');

    this.closeModals();
    this.refreshCurrentView();
  }

  // Modal 4: Add Internal Activity
  openAddInternalModal(presetClientId = null) {
    const form = document.getElementById('formInternal');
    if (form) form.reset();
    document.getElementById('intDateInput').value = new Date().toISOString().split('T')[0];

    if (presetClientId) {
      document.getElementById('intClientSelect').value = presetClientId;
      this.populateClientOppsDropdown('intClientSelect', 'intOppSelect');
    }

    document.getElementById('modalInternal').classList.add('active');
  }

  handleInternalSubmit(e) {
    e.preventDefault();
    const clientId = document.getElementById('intClientSelect').value;
    const client = clientId ? window.crmStore.data.clients.find(c => c.id === clientId) : null;

    const internalData = {
      date: document.getElementById('intDateInput').value,
      category: document.getElementById('intCategorySelect').value,
      clientId: clientId || '',
      clientName: client ? client.name : '',
      oppId: document.getElementById('intOppSelect').value,
      department: document.getElementById('intDeptSelect').value,
      personCoordinated: document.getElementById('intPersonInput').value.trim(),
      teamMember: document.getElementById('intOwnerSelect').value,
      approvalRequired: document.getElementById('intApprovalReqSelect').value,
      purpose: document.getElementById('intPurposeInput').value.trim(),
      description: document.getElementById('intPurposeInput').value.trim(),
      approvalStatus: document.getElementById('intApprovalStatusSelect').value,
      output: document.getElementById('intOutputInput').value.trim(),
      nextAction: document.getElementById('intNextActionInput').value.trim()
    };

    window.crmStore.addInternalActivity(internalData);
    this.showToast(`Internal BD task recorded!`, 'success');

    this.closeModals();
    this.refreshCurrentView();
  }

  // Global Search Handler
  handleGlobalSearch(query) {
    const q = (query || '').toLowerCase().trim();
    if (!q) {
      this.refreshCurrentView();
      return;
    }

    // Switch to Clients or Opps tab if matching
    if (this.currentTab === 'tab-clients') {
      document.getElementById('clientFilterSearch').value = q;
      this.renderClientsTable();
    } else if (this.currentTab === 'tab-team') {
      document.getElementById('teamFilterSearch').value = q;
      this.renderTeamTable();
    } else if (this.currentTab === 'tab-opportunities') {
      document.getElementById('oppFilterSearch').value = q;
      this.renderOpportunitiesView();
    } else if (this.currentTab === 'tab-activities') {
      document.getElementById('actFilterSearch').value = q;
      this.renderActivitiesView();
    } else {
      // Auto search clients & opps
      this.dashboardFilters.search = q;
      this.renderDashboard();
    }
  }

  // Close All Active Modals
  closeModals() {
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.classList.remove('active');
    });
    this.activeDeletingMemberId = null;
    this.activeDeletingSegmentId = null;
    this.activeDeletingUserId = null;
  }

  // Reset Factory Seed Data
  resetSampleData() {
    if (confirm('Reset CRM database back to factory sample data? All new local edits will be replaced.')) {
      window.crmStore.resetToDefaults();
      this.populateDropdowns();
      this.showToast('CRM reset to realistic corporate sample data.', 'info');
      this.refreshCurrentView();
    }
  }

  // Toast Notification Trigger
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i data-lucide="${type === 'success' ? 'check-circle' : (type === 'error' ? 'alert-triangle' : 'info')}" style="width:16px; height:16px;"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

// Instantiate and attach globally
window.crmApp = new CRMApplication();

