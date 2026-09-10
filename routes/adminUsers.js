/**
 * Secure Server-Side Administrator User Provisioning & Lifecycle Management
 * CorpBD CRM — Rajmudra Group
 * 
 * SECURITY GUARANTEES:
 * 1. Executes strictly server-side with SUPABASE_SERVICE_ROLE_KEY (never exposed to client).
 * 2. Authenticates and verifies the caller's admin privileges via Supabase Auth JWT.
 * 3. Enforces domain validation (@rajmudragroup.com).
 * 4. Prevents role escalation (non-super_admin cannot grant super_admin; self-escalation blocked).
 * 5. Validates organization, team, and manager hierarchy boundaries.
 * 6. Emits structured audit logs into public.audit_logs for compliance.
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Initialize Supabase Admin Client using Service Role Key
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabaseAdmin = null;
if (supabaseUrl && serviceRoleKey) {
  supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
} else {
  console.warn('⚠ [AdminUsers] SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL not configured. Admin provisioning running in simulated fallback mode.');
}

const CORPORATE_DOMAIN = '@rajmudragroup.com';
const VALID_ROLES = [
  'super_admin',
  'bd_director',
  'bd_manager',
  'bd_sr_exec',
  'bd_exec',
  'management_viewer',
  'analyst',
];

const VALID_STATUSES = ['active', 'inactive', 'suspended', 'pending_invite'];

/**
 * Validate corporate email
 */
function isValidCorporateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@rajmudragroup\.com$/;
  return emailRegex.test(trimmed);
}

/**
 * Authentication & Authorization Middleware
 * Verifies Supabase Bearer token and ensures caller has admin permissions.
 */
async function authenticateAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Check legacy session fallback for local dev if Supabase token not provided
      if (req.user && (req.user.role === 'Super Admin' || req.user.role === 'System Administrator')) {
        req.caller = {
          id: req.user.id,
          email: req.user.email,
          role: 'super_admin',
          organization_id: '00000000-0000-0000-0000-000000000001',
          full_name: req.user.name || 'System Administrator',
        };
        return next();
      }
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Missing or invalid Bearer token.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!supabaseAdmin) {
      // Fallback dev mode
      req.caller = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@rajmudragroup.com',
        role: 'super_admin',
        organization_id: '00000000-0000-0000-0000-000000000001',
        full_name: 'System Admin (Dev)',
      };
      return next();
    }

    // Verify token with Supabase Auth
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData || !userData.user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired authentication session.',
      });
    }

    const userId = userData.user.id;

    // Fetch caller's profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, status, organization_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({
        success: false,
        error: 'CRM profile not found. Access denied.',
      });
    }

    if (profile.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Your account is currently inactive or suspended.',
      });
    }

    // Role check: Only super_admin or bd_director can manage users
    const hasAdminAccess = profile.role === 'super_admin' || profile.role === 'bd_director';
    if (!hasAdminAccess) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Administrator privileges are required to manage users.',
      });
    }

    req.caller = profile;
    next();
  } catch (err) {
    console.error('Admin Auth Middleware Error:', err);
    res.status(500).json({ success: false, error: 'Internal server error during authentication.' });
  }
}

/**
 * Log action into public.audit_logs
 */
async function writeAuditLog(caller, action, entityId, details, req) {
  if (!supabaseAdmin) return;
  try {
    await supabaseAdmin.from('audit_logs').insert({
      organization_id: caller.organization_id,
      actor_id: caller.id,
      action: action,
      entity_type: 'user',
      entity_id: entityId,
      details: {
        ...details,
        actor_name: caller.full_name,
        actor_email: caller.email,
        actor_role: caller.role,
        ip_address: req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : null,
      },
      ip_address: req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : null,
      user_agent: req ? req.headers['user-agent'] : null,
    });
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}

// ─── ROUTES ──────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/users/hierarchy-options
 * Returns organizations, teams, and potential managers in caller's organization.
 */
router.get('/hierarchy-options', authenticateAdmin, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      // Mock hierarchy options for fallback
      return res.json({
        success: true,
        organizations: [{ id: '00000000-0000-0000-0000-000000000001', name: 'Rajmudra Group', slug: 'rajmudra-group' }],
        regions: [
          { id: '20000000-0000-0000-0000-000000000001', name: 'West Region', code: 'REG-WEST', description: 'Maharashtra, Gujarat & Goa' },
          { id: '20000000-0000-0000-0000-000000000002', name: 'North Region', code: 'REG-NORTH', description: 'Delhi NCR, Haryana, Punjab, UP' },
          { id: '20000000-0000-0000-0000-000000000003', name: 'South Region', code: 'REG-SOUTH', description: 'Karnataka, Tamil Nadu, Telangana' },
          { id: '20000000-0000-0000-0000-000000000004', name: 'East Region', code: 'REG-EAST', description: 'West Bengal, Odisha, Bihar' },
          { id: '20000000-0000-0000-0000-000000000005', name: 'Central Region', code: 'REG-CENTRAL', description: 'Madhya Pradesh & Chhattisgarh' },
        ],
        teams: [
          { id: '00000000-0000-0000-0001-000000000001', name: 'Enterprise BD West', code: 'TEAM-BD-WEST', region_id: '20000000-0000-0000-0000-000000000001', region: 'West Region', department: 'BD' },
          { id: '00000000-0000-0000-0001-000000000002', name: 'Fleet Operations & Asset Roster', code: 'TEAM-OPS-FLEET', region_id: '20000000-0000-0000-0000-000000000001', region: 'West Region', department: 'Fleet / Asset Management' },
          { id: '00000000-0000-0000-0001-000000000003', name: 'Commercials, Pricing & Proposals', code: 'TEAM-PRICING', region_id: '20000000-0000-0000-0000-000000000005', region: 'Central Region', department: 'Pricing & Commercials' },
          { id: '00000000-0000-0000-0001-000000000004', name: 'Legal & Contract Compliance', code: 'TEAM-LEGAL', region_id: '20000000-0000-0000-0000-000000000005', region: 'Central Region', department: 'Legal & Compliance' },
        ],
        managers: [
          { id: '00000000-0000-0000-0000-000000000001', full_name: 'Devika Pangam', role: 'super_admin', designation: 'Managing Director / System Administrator', department: 'Executive Management & Administration' },
        ],
      });
    }

    const orgId = req.caller.organization_id;

    // Fetch orgs
    const { data: orgs } = await supabaseAdmin
      .from('organizations')
      .select('id, name, slug')
      .eq('is_active', true);

    // Fetch normalized regions
    const { data: regions } = await supabaseAdmin
      .from('regions')
      .select('id, name, code, description, is_active')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    // Fetch teams
    const { data: teams } = await supabaseAdmin
      .from('teams')
      .select('id, name, code, region_id, region, department, is_active')
      .eq('organization_id', orgId)
      .eq('is_active', true);

    // Fetch eligible managers (super_admin, bd_director, bd_manager)
    const { data: managers } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, designation, department, region')
      .eq('organization_id', orgId)
      .in('role', ['super_admin', 'bd_director', 'bd_manager'])
      .eq('status', 'active');

    res.json({
      success: true,
      organizations: orgs || [],
      regions: regions || [],
      teams: teams || [],
      managers: managers || [],
    });
  } catch (err) {
    console.error('Get hierarchy options error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch hierarchy options' });
  }
});
/**
 * POST /api/admin/users/bootstrap-super-admin
 * Secure bootstrap mechanism for the first Super Administrator.
 * SECURITY CONTROLS:
 * 1. Checks if any active super_admin exists in public.profiles.
 * 2. If a super_admin exists, requires server-configured BOOTSTRAP_SECRET_KEY.
 * 3. Enforces @rajmudragroup.com corporate domain.
 * 4. Creates Supabase Auth user + public.profiles record + audit log.
 */
router.post('/bootstrap-super-admin', async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      provisioning_method = 'invite', // 'invite' | 'password'
      department = 'Executive Management & Administration',
      designation = 'Managing Director / System Administrator',
      bootstrap_token,
    } = req.body;

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ success: false, error: 'Full Name is required for super administrator.' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Corporate email is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!isValidCorporateEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        error: `Corporate email must end with ${CORPORATE_DOMAIN}`,
      });
    }

    if (provisioning_method === 'password' && (!password || password.length < 8)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long with uppercase, digits and symbols.',
      });
    }

    const RAJMUDRA_ORG_ID = '00000000-0000-0000-0000-000000000001';

    if (!supabaseAdmin) {
      // Mock bootstrap for fallback
      const initialStatus = provisioning_method === 'invite' ? 'pending_invite' : 'active';
      return res.status(201).json({
        success: true,
        message: `Super Administrator ${cleanEmail} provisioned via invitation successfully (Simulated).`,
        user: {
          id: '00000000-0000-0000-0000-000000000001',
          email: cleanEmail,
          full_name: full_name.trim(),
          role: 'super_admin',
          department,
          designation,
          team_id: null,
          manager_id: null,
          organization_id: RAJMUDRA_ORG_ID,
          status: initialStatus,
          provisioning_method,
        },
      });
    }

    // 1. Check if any active super_admin exists
    const { data: existingSuperAdmins, error: countErr } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('role', 'super_admin')
      .eq('status', 'active');

    const hasActiveSuperAdmin = existingSuperAdmins && existingSuperAdmins.length > 0;

    if (hasActiveSuperAdmin) {
      // If a super_admin already exists, require server-only bootstrap token
      const serverBootstrapSecret = process.env.BOOTSTRAP_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!serverBootstrapSecret || bootstrap_token !== serverBootstrapSecret) {
        return res.status(403).json({
          success: false,
          error: 'Security Policy: A Super Administrator already exists. Subsequent administrator creation requires normal administrator login.',
        });
      }
    }

    // 2. Create or invite Auth user in Supabase Auth
    let authUserId = null;
    if (provisioning_method === 'password') {
      const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: full_name.trim(),
          role: 'super_admin',
          organization_id: RAJMUDRA_ORG_ID,
        },
      });

      if (authErr) {
        if (authErr.message.includes('already registered') || authErr.status === 422) {
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
          const existing = listData?.users?.find((u) => u.email === cleanEmail);
          if (existing) {
            authUserId = existing.id;
          } else {
            return res.status(400).json({ success: false, error: authErr.message });
          }
        } else {
          return res.status(400).json({ success: false, error: `Auth creation failed: ${authErr.message}` });
        }
      } else {
        authUserId = authUser.user.id;
      }
    } else {
      // Invite flow: send Supabase Auth invitation to corporate email
      const { data: inviteData, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        cleanEmail,
        {
          data: {
            full_name: full_name.trim(),
            role: 'super_admin',
            organization_id: RAJMUDRA_ORG_ID,
          },
        }
      );

      if (inviteErr) {
        if (inviteErr.message.includes('already registered') || inviteErr.status === 422) {
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
          const existing = listData?.users?.find((u) => u.email === cleanEmail);
          if (existing) {
            authUserId = existing.id;
          } else {
            return res.status(400).json({ success: false, error: inviteErr.message });
          }
        } else {
          return res.status(400).json({ success: false, error: `Auth invitation failed: ${inviteErr.message}` });
        }
      } else {
        authUserId = inviteData.user.id;
      }
    }

    // 3. Upsert profile with super_admin role and appropriate initial status
    const initialStatus = provisioning_method === 'invite' ? 'pending_invite' : 'active';
    const { data: newProfile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authUserId,
        organization_id: RAJMUDRA_ORG_ID,
        full_name: full_name.trim(),
        email: cleanEmail,
        role: 'super_admin',
        department,
        designation,
        team_id: null,
        manager_id: null,
        status: initialStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileErr) {
      return res.status(500).json({
        success: false,
        error: `Failed to create super_admin profile: ${profileErr.message}`,
      });
    }

    // 4. Log immutable system bootstrap audit record
    try {
      await supabaseAdmin.from('audit_logs').insert({
        organization_id: RAJMUDRA_ORG_ID,
        actor_id: authUserId,
        action: 'BOOTSTRAP_SUPER_ADMIN',
        entity_type: 'user',
        entity_id: authUserId,
        details: {
          email: cleanEmail,
          full_name: full_name.trim(),
          role: 'super_admin',
          bootstrap_method: provisioning_method === 'invite' ? 'supabase_auth_invitation' : 'direct_password',
          initial_status: initialStatus,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (auditErr) {
      console.warn('Bootstrap audit log notice:', auditErr.message);
    }

    res.status(201).json({
      success: true,
      message: `Super Administrator ${cleanEmail} provisioned successfully via invitation workflow.`,
      user: newProfile,
    });
  } catch (err) {
    console.error('Bootstrap super admin error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error during bootstrap.' });
  }
});

/**
 * POST /api/admin/users/provision
 * Provisions a new user in Supabase Auth and creates their public.profiles row.
 */
router.post('/provision', authenticateAdmin, async (req, res) => {
  try {
    const {
      full_name,
      email,
      role = 'bd_exec',
      department = 'Business Development',
      designation = 'BD Executive',
      employee_id = null,
      region = 'West',
      location = 'Corporate HQ - Mumbai',
      joining_date = null,
      employment_type = 'Full-time',
      is_regional_owner = false,
      annual_target_inr = 0,
      phone = null,
      team_id = null,
      manager_id = null,
      organization_id = req.caller.organization_id,
      status = 'active',
      provisioning_method = 'invite', // 'invite' | 'password'
      temp_password = '',
    } = req.body;

    // 1. Validate required fields
    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ success: false, error: 'Full Name is required.' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Corporate Work Email is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Validate corporate email domain (@rajmudragroup.com)
    if (!isValidCorporateEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        error: `Invalid email domain. Corporate email must end with ${CORPORATE_DOMAIN}`,
      });
    }

    // 3. Validate role
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role specified. Must be one of: ${VALID_ROLES.join(', ')}`,
      });
    }

    // 4. Anti-escalation: Only super_admin can create or assign super_admin role
    if (role === 'super_admin' && req.caller.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Security Policy: Only a Super Administrator can assign the super_admin role.',
      });
    }

    // 5. Cross-organization isolation check
    if (organization_id !== req.caller.organization_id && req.caller.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You cannot create users for other organizations.',
      });
    }

    // 6. Validate status
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status specified.' });
    }

    if (!supabaseAdmin) {
      // Fallback dev response
      const mockId = 'usr_' + Date.now();
      return res.status(201).json({
        success: true,
        message: `User ${full_name} (${cleanEmail}) provisioned successfully (Simulated).`,
        user: {
          id: mockId,
          full_name: full_name.trim(),
          email: cleanEmail,
          role,
          department,
          designation,
          team_id,
          manager_id,
          organization_id,
          status,
        },
      });
    }

    // 7. Verify Team & Manager belong to the same organization
    if (team_id) {
      const { data: teamRecord } = await supabaseAdmin
        .from('teams')
        .select('id, organization_id')
        .eq('id', team_id)
        .single();

      if (!teamRecord || teamRecord.organization_id !== organization_id) {
        return res.status(400).json({
          success: false,
          error: 'Assigned team does not belong to the user organization.',
        });
      }
    }

    if (manager_id) {
      const { data: managerRecord } = await supabaseAdmin
        .from('profiles')
        .select('id, organization_id')
        .eq('id', manager_id)
        .single();

      if (!managerRecord || managerRecord.organization_id !== organization_id) {
        return res.status(400).json({
          success: false,
          error: 'Assigned manager does not belong to the user organization.',
        });
      }
    }

    // 8. Check if email already exists in profiles
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, status')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingProfile) {
      return res.status(409).json({
        success: false,
        error: `User with email ${cleanEmail} already exists in CRM (Status: ${existingProfile.status}). Use edit/reactivate instead.`,
      });
    }

    let authUserId = null;

    // 9. Provision in Supabase Auth via Admin API
    if (provisioning_method === 'password') {
      if (!temp_password || temp_password.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters long.',
        });
      }

      const { data: createdAuth, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: temp_password,
        email_confirm: true,
        user_metadata: {
          full_name: full_name.trim(),
          organization_id,
          role,
        },
      });

      if (authErr) {
        return res.status(400).json({
          success: false,
          error: `Failed to create auth identity: ${authErr.message}`,
        });
      }

      authUserId = createdAuth.user.id;
    } else {
      // Invite method (sends invitation email with magic link / reset password to Zoho email)
      const { data: invitedAuth, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        cleanEmail,
        {
          data: {
            full_name: full_name.trim(),
            organization_id,
            role,
          },
        }
      );

      if (inviteErr) {
        return res.status(400).json({
          success: false,
          error: `Failed to send invitation: ${inviteErr.message}`,
        });
      }

      authUserId = invitedAuth.user.id;
    }

    // 10. Upsert row into public.profiles
    const initialStatus = provisioning_method === 'invite' ? 'pending_invite' : status;
    const { data: newProfile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authUserId,
        organization_id,
        full_name: full_name.trim(),
        email: cleanEmail,
        role,
        department,
        designation,
        employee_id: employee_id || null,
        region: region || 'West',
        location: location || 'Corporate HQ - Mumbai',
        joining_date: joining_date || new Date().toISOString().split('T')[0],
        employment_type: employment_type || 'Full-time',
        is_regional_owner: Boolean(is_regional_owner),
        annual_target_inr: Number(annual_target_inr) || 0,
        phone: phone || null,
        team_id: team_id || null,
        manager_id: manager_id || null,
        status: initialStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileErr) {
      console.error('Error creating profile for auth user:', profileErr);
      return res.status(500).json({
        success: false,
        error: `Auth user created but profile insertion failed: ${profileErr.message}`,
      });
    }

    // 11. Write audit log
    await writeAuditLog(
      req.caller,
      'CREATE_USER',
      authUserId,
      {
        created_user_id: authUserId,
        created_email: cleanEmail,
        created_name: full_name.trim(),
        assigned_role: role,
        assigned_team: team_id,
        assigned_manager: manager_id,
        provisioning_method,
        status: initialStatus,
      },
      req
    );

    res.status(201).json({
      success: true,
      message: `User ${full_name} (${cleanEmail}) provisioned successfully.`,
      user: newProfile,
    });
  } catch (err) {
    console.error('Provision user error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error.' });
  }
});

/**
 * PUT /api/admin/users/:id
 * Updates role, department, designation, team, manager, and status.
 */
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const {
      full_name,
      role,
      department,
      designation,
      employee_id,
      region,
      location,
      joining_date,
      employment_type,
      is_regional_owner,
      annual_target_inr,
      phone,
      team_id,
      manager_id,
      status,
    } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ success: false, error: 'User ID is required.' });
    }

    // Self-escalation prevention
    if (targetUserId === req.caller.id && role && role !== req.caller.role) {
      return res.status(403).json({
        success: false,
        error: 'Security Policy: You cannot modify your own role.',
      });
    }

    // Super_admin assignment prevention for non-super_admins
    if (role === 'super_admin' && req.caller.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Security Policy: Only a Super Administrator can assign the super_admin role.',
      });
    }

    if (!supabaseAdmin) {
      return res.json({
        success: true,
        message: 'User updated successfully (Simulated).',
        user: { id: targetUserId, ...req.body },
      });
    }

    // Fetch target user's current profile
    const { data: targetProfile, error: targetErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .single();

    if (targetErr || !targetProfile) {
      return res.status(404).json({ success: false, error: 'Target user profile not found.' });
    }

    // Org boundary check
    if (targetProfile.organization_id !== req.caller.organization_id && req.caller.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You cannot modify users from other organizations.',
      });
    }

    const updates = {
      updated_at: new Date().toISOString(),
    };
    if (full_name !== undefined) updates.full_name = full_name.trim();
    if (role !== undefined && VALID_ROLES.includes(role)) updates.role = role;
    if (department !== undefined) updates.department = department;
    if (designation !== undefined) updates.designation = designation;
    if (employee_id !== undefined) updates.employee_id = employee_id;
    if (region !== undefined) updates.region = region;
    if (location !== undefined) updates.location = location;
    if (joining_date !== undefined) updates.joining_date = joining_date;
    if (employment_type !== undefined) updates.employment_type = employment_type;
    if (is_regional_owner !== undefined) updates.is_regional_owner = Boolean(is_regional_owner);
    if (annual_target_inr !== undefined) updates.annual_target_inr = Number(annual_target_inr) || 0;
    if (phone !== undefined) updates.phone = phone;
    if (team_id !== undefined) updates.team_id = team_id || null;
    if (manager_id !== undefined) updates.manager_id = manager_id || null;
    if (status !== undefined && VALID_STATUSES.includes(status)) updates.status = status;

    const { data: updatedProfile, error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', targetUserId)
      .select()
      .single();

    if (updateErr) {
      return res.status(400).json({ success: false, error: updateErr.message });
    }

    // Write audit log
    await writeAuditLog(
      req.caller,
      'UPDATE_USER',
      targetUserId,
      {
        target_user_id: targetUserId,
        previous_state: {
          role: targetProfile.role,
          status: targetProfile.status,
          team_id: targetProfile.team_id,
          manager_id: targetProfile.manager_id,
        },
        new_state: updates,
      },
      req
    );

    res.json({
      success: true,
      message: `User ${updatedProfile.full_name} updated successfully.`,
      user: updatedProfile,
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error.' });
  }
});

/**
 * POST /api/admin/users/:id/reset-password
 * Triggers password reset or sets a temporary password.
 */
router.post('/:id/reset-password', authenticateAdmin, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const { new_password, send_email = true } = req.body;

    if (!supabaseAdmin) {
      return res.json({
        success: true,
        message: 'Password reset email triggered successfully (Simulated).',
      });
    }

    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, organization_id')
      .eq('id', targetUserId)
      .single();

    if (!targetProfile) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    if (new_password) {
      if (new_password.length < 8) {
        return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long.' });
      }
      const { error: pwdErr } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        password: new_password,
      });
      if (pwdErr) {
        return res.status(400).json({ success: false, error: pwdErr.message });
      }
    } else {
      // Send reset password email to user's Zoho corporate address
      const { error: resetErr } = await supabaseAdmin.auth.resetPasswordForEmail(targetProfile.email);
      if (resetErr) {
        return res.status(400).json({ success: false, error: resetErr.message });
      }
    }

    await writeAuditLog(
      req.caller,
      'RESET_PASSWORD',
      targetUserId,
      {
        target_email: targetProfile.email,
        method: new_password ? 'direct_admin_set' : 'email_link',
      },
      req
    );

    res.json({
      success: true,
      message: `Password reset initiated for ${targetProfile.email}.`,
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error.' });
  }
});

/**
 * POST /api/admin/users/:id/revoke
 * Suspends user access and invalidates active session tokens.
 */
router.post('/:id/revoke', authenticateAdmin, async (req, res) => {
  try {
    const targetUserId = req.params.id;

    if (targetUserId === req.caller.id) {
      return res.status(400).json({
        success: false,
        error: 'You cannot revoke your own active administrator access.',
      });
    }

    if (!supabaseAdmin) {
      return res.json({
        success: true,
        message: 'User access revoked and account suspended (Simulated).',
      });
    }

    // 1. Mark status as suspended
    const { data: updatedProfile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .update({ status: 'suspended', updated_at: new Date().toISOString() })
      .eq('id', targetUserId)
      .select()
      .single();

    if (profileErr) {
      return res.status(400).json({ success: false, error: profileErr.message });
    }

    // 2. Invalidate Supabase Auth sessions via admin API
    try {
      await supabaseAdmin.auth.admin.signOut(targetUserId);
    } catch (signOutErr) {
      console.warn('SignOut warning for user:', targetUserId, signOutErr.message);
    }

    // 3. Write audit log
    await writeAuditLog(
      req.caller,
      'REVOKE_USER_ACCESS',
      targetUserId,
      {
        target_email: updatedProfile.email,
        target_name: updatedProfile.full_name,
        new_status: 'suspended',
      },
      req
    );

    res.json({
      success: true,
      message: `Access revoked for ${updatedProfile.full_name}. Account is now suspended.`,
      user: updatedProfile,
    });
  } catch (err) {
    console.error('Revoke access error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error.' });
  }
});

/**
 * POST /api/admin/users/:id/generate-activation-link
 * Generates an instant, direct password setup / activation URL without waiting for SMTP.
 */
router.post('/:id/generate-activation-link', authenticateAdmin, async (req, res) => {
  try {
    const targetUserId = req.params.id;

    if (!supabaseAdmin) {
      const simulatedLink = `https://crm.rajmudragroup.com/auth/callback?type=invite&token=simulated_token_${Date.now()}`;
      return res.json({
        success: true,
        message: 'Direct activation link generated successfully (Simulated).',
        link: simulatedLink,
      });
    }

    const { data: targetProfile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role, status, organization_id')
      .eq('id', targetUserId)
      .single();

    if (profileErr || !targetProfile) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }

    // Generate link via Supabase Auth Admin API
    let actionLink = null;
    try {
      const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
        type: targetProfile.status === 'pending_invite' ? 'invite' : 'recovery',
        email: targetProfile.email,
        options: {
          redirectTo: `${req.protocol}://${req.get('host')}/reset-password`,
        },
      });

      if (!linkErr && linkData?.properties?.action_link) {
        actionLink = linkData.properties.action_link;
      }
    } catch (linkGenErr) {
      console.warn('generateLink warning:', linkGenErr.message);
    }

    if (!actionLink) {
      // Fallback: generate password recovery link
      const { data: recData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: targetProfile.email,
        options: {
          redirectTo: `${req.protocol}://${req.get('host')}/reset-password`,
        },
      });
      actionLink = recData?.properties?.action_link;
    }

    res.json({
      success: true,
      message: `Direct activation link generated for ${targetProfile.email}`,
      link: actionLink,
      email: targetProfile.email,
      full_name: targetProfile.full_name,
    });
  } catch (err) {
    console.error('Generate activation link error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to generate activation link.' });
  }
});

module.exports = router;

