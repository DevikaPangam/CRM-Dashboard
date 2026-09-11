/**
 * CRM Data Service — Supabase PostgreSQL Data Layer
 * Handles bidirectional translation between Database schemas (snake_case)
 * and Frontend CRM entities (camelCase) with strict organization_id scoping.
 */

import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import {
  Client, Opportunity, Activity, Followup, InternalTask,
  CRMDocument, TeamMember, BusinessSegment, User, ClientContact
} from '../types/crm';
import {
  INITIAL_CLIENTS, INITIAL_OPPORTUNITIES, INITIAL_ACTIVITIES, INITIAL_FOLLOWUPS,
  INITIAL_INTERNAL_TASKS, INITIAL_TEAM_MEMBERS, INITIAL_SEGMENTS, INITIAL_USERS, INITIAL_DOCUMENTS
} from '../utils/seedData';

// ─── UUID SANITIZER UTILITY ──────────────────────────────────────────────────
export const isValidUUID = (id?: string | null): boolean =>
  Boolean(id && typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim()));

// ─── ENTITY TRANSFORMERS ──────────────────────────────────────────────────────

export function transformSegmentFromDB(row: any): BusinessSegment {
  return {
    id: row.segment_code || row.id,
    name: row.name,
    category: row.category || 'Corporate Mobility',
    targetMarginPct: Number(row.target_margin_pct) || 20,
    leadOwner: row.lead_owner || 'Devika Pangam',
    description: row.description || '',
    activeClientsCount: Number(row.active_clients_count) || 0,
    pipelineValueINR: Number(row.pipeline_value_inr) || 0,
  };
}

export function transformSegmentToDB(seg: Partial<BusinessSegment>, orgId: string) {
  const payload: Record<string, any> = {
    organization_id: orgId,
  };
  if (seg.id) {
    if (isValidUUID(seg.id)) {
      payload.id = seg.id;
    } else {
      payload.segment_code = seg.id;
    }
  }
  if (seg.name) payload.name = seg.name;
  if (seg.category) payload.category = seg.category;
  if (seg.targetMarginPct !== undefined) payload.target_margin_pct = Number(seg.targetMarginPct) || 20;
  if (seg.leadOwner) payload.lead_owner = seg.leadOwner;
  if (seg.description !== undefined) payload.description = seg.description;
  if (seg.activeClientsCount !== undefined) payload.active_clients_count = Number(seg.activeClientsCount) || 0;
  if (seg.pipelineValueINR !== undefined) payload.pipeline_value_inr = Number(seg.pipelineValueINR) || 0;

  return payload;
}

export function transformClientFromDB(row: any, contacts: any[] = []): Client {
  return {
    id: row.id,
    code: row.client_code || row.id.slice(0, 8).toUpperCase(),
    name: row.name,
    clientType: (row.client_type as any) || 'Existing Client',
    industry: row.industry || 'Technology',
    segment: row.segment || 'Enterprise IT & ITeS',
    city: row.city || 'Pune',
    state: row.state || 'Maharashtra',
    region: (row.region as any) || 'West',
    tier: (row.tier as any) || 'Tier 1 (Enterprise)',
    turnoverCr: Number(row.turnover_cr) || 0,
    employees: Number(row.employees_count) || 0,
    status: (row.status as any) || 'Active',
    accountOwner: row.account_owner || 'Unassigned',
    website: row.website || '',
    address: row.address || '',
    createdDate: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    contacts: contacts.map((c) => ({
      id: c.id,
      name: c.name,
      designation: c.designation || '',
      email: c.email || '',
      phone: c.phone || '',
      isPrimary: Boolean(c.is_primary),
    })),
    deployedFleets: row.deployed_fleets || [],
    notes: row.notes || '',
  };
}

export function transformClientToDB(client: Partial<Client>, orgId: string, userId?: string) {
  const payload: Record<string, any> = {
    organization_id: orgId,
  };
  if (client.code) payload.client_code = client.code;
  if (client.name) payload.name = client.name;
  if (client.clientType) payload.client_type = client.clientType;
  if (client.industry) payload.industry = client.industry;
  if (client.segment) payload.segment = client.segment;
  if (client.city) payload.city = client.city;
  if (client.state) payload.state = client.state;
  if (client.region) payload.region = client.region;
  if (client.tier) payload.tier = client.tier;
  if (client.turnoverCr !== undefined) payload.turnover_cr = client.turnoverCr;
  if (client.employees !== undefined) payload.employees_count = client.employees;
  if (client.status) payload.status = client.status;
  if (client.accountOwner) payload.account_owner = client.accountOwner;
  if (client.website !== undefined) payload.website = client.website;
  if (client.address !== undefined) payload.address = client.address;
  if (client.deployedFleets !== undefined) payload.deployed_fleets = client.deployedFleets;
  if (client.notes !== undefined) payload.notes = client.notes;
  if (userId && isValidUUID(userId)) payload.created_by = userId;

  return payload;
}

export function transformOpportunityFromDB(row: any): Opportunity {
  return {
    id: row.id,
    code: row.opportunity_code || row.id.slice(0, 8).toUpperCase(),
    title: row.title,
    clientId: row.client_id || '',
    clientName: row.client_name || 'Client',
    clientType: (row.client_type as any) || 'Existing Client',
    segment: row.segment || 'General Fleet',
    serviceCategory: row.service_category || 'Corporate Mobility',
    contractType: (row.contract_type as any) || 'Annual Contract',
    dealValueINR: Number(row.deal_value_inr) || 0,
    monthlyValueINR: Number(row.monthly_value_inr) || 0,
    stage: row.stage || 'Lead / Inception',
    probability: Number(row.probability_pct) || 10,
    status: (row.status as any) || 'Open',
    owner: row.owner_name || 'BD Owner',
    leadSource: row.lead_source || 'Direct Outreach',
    expectedCloseDate: row.expected_close_date || '',
    createdDate: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    lastActivityDate: row.last_activity_date || '',
    nextFollowupDate: row.next_followup_date || '',
    fleetSize: Number(row.fleet_size) || 0,
    vehicleType: row.vehicle_type || '',
    locations: row.locations || '',
    competition: row.competition || '',
    winProbabilityNotes: row.win_probability_notes || '',
    lostReason: row.lost_reason || '',
    lostRemarks: row.lost_remarks || '',
    internalApprovalsRequired: Boolean(row.internal_approvals_required),
    notes: row.notes || '',
    approvalStatus: (row.approval_status as any) || 'Not Required',
    approvalRemarks: row.approval_remarks || '',
    approvedBy: row.approved_by || '',
    approvedDate: row.approved_at || '',
    delegatedDepartment: (row.delegated_department as any) || 'BD',
    delegatedOwner: row.delegated_owner || '',
    delegationStatus: (row.delegation_status as any) || 'Pending Action',
    delegationMilestone: row.delegation_milestone || '',
    slaDaysRemaining: Number(row.sla_days_remaining) || 0,
    delegationRemarks: row.delegation_remarks || '',
  };
}

export function transformOpportunityToDB(opp: Partial<Opportunity>, orgId: string, userId?: string) {
  const payload: Record<string, any> = {
    organization_id: orgId,
  };
  if (opp.id && isValidUUID(opp.id)) payload.id = opp.id;
  if (opp.code) payload.opportunity_code = opp.code;
  else if (opp.id && !isValidUUID(opp.id)) payload.opportunity_code = opp.id;
  if (opp.title) payload.title = opp.title;
  payload.client_id = isValidUUID(opp.clientId) ? opp.clientId : null;
  if (opp.clientName) payload.client_name = opp.clientName;
  if (opp.clientType) payload.client_type = opp.clientType;
  if (opp.segment) payload.segment = opp.segment;
  if (opp.serviceCategory) payload.service_category = opp.serviceCategory;
  if (opp.contractType) payload.contract_type = opp.contractType;
  if (opp.dealValueINR !== undefined) payload.deal_value_inr = opp.dealValueINR;
  if (opp.monthlyValueINR !== undefined) payload.monthly_value_inr = opp.monthlyValueINR;
  if (opp.stage) payload.stage = opp.stage;
  if (opp.probability !== undefined) payload.probability_pct = opp.probability;
  if (opp.status) payload.status = opp.status;
  if (userId && isValidUUID(userId)) payload.created_by = userId;
  if (opp.owner) payload.owner_name = opp.owner;
  if (opp.leadSource) payload.lead_source = opp.leadSource;
  if (opp.expectedCloseDate) payload.expected_close_date = opp.expectedCloseDate;
  if (opp.fleetSize !== undefined) payload.fleet_size = opp.fleetSize;
  if (opp.vehicleType) payload.vehicle_type = opp.vehicleType;
  if (opp.locations) payload.locations = opp.locations;
  if (opp.competition) payload.competition = opp.competition;
  if (opp.winProbabilityNotes) payload.win_probability_notes = opp.winProbabilityNotes;
  if (opp.lostReason) payload.lost_reason = opp.lostReason;
  if (opp.lostRemarks) payload.lost_remarks = opp.lostRemarks;
  if (opp.internalApprovalsRequired !== undefined) payload.internal_approvals_required = opp.internalApprovalsRequired;
  if (opp.notes) payload.notes = opp.notes;
  if (opp.approvalStatus) payload.approval_status = opp.approvalStatus;
  if (opp.approvalRemarks) payload.approval_remarks = opp.approvalRemarks;
  if (opp.delegatedDepartment) payload.delegated_department = opp.delegatedDepartment;
  if (opp.delegatedOwner) payload.delegated_owner = opp.delegatedOwner;
  if (opp.delegationStatus) payload.delegation_status = opp.delegationStatus;
  if (opp.delegationMilestone) payload.delegation_milestone = opp.delegationMilestone;
  if (opp.slaDaysRemaining !== undefined) payload.sla_days_remaining = opp.slaDaysRemaining;
  if (opp.delegationRemarks) payload.delegation_remarks = opp.delegationRemarks;

  return payload;
}

export function transformActivityFromDB(row: any): Activity {
  return {
    id: row.id,
    type: (row.activity_type || row.type || 'Physical Meeting') as any,
    clientId: row.client_id || '',
    clientName: row.client_name || '',
    clientType: (row.client_type as any) || 'Existing Client',
    opportunityId: row.opportunity_id || '',
    opportunityTitle: row.opportunity_title || '',
    date: row.activity_date ? row.activity_date.split('T')[0] : (row.created_at ? row.created_at.split('T')[0] : ''),
    time: row.activity_time || '',
    conductedBy: row.conducted_by_name || row.conducted_by || 'BD Executive',
    contactPerson: row.contact_person || '',
    location: row.location || '',
    keyDiscussion: row.key_discussion || row.subject || '',
    outcome: row.outcome || '',
    actionItems: row.action_items || '',
    nextFollowupDate: row.next_followup_date || '',
    status: (row.status as any) || 'Completed',
  };
}

export function transformFollowupFromDB(row: any): Followup {
  return {
    id: row.id,
    clientId: row.client_id || '',
    clientName: row.client_name || '',
    clientType: (row.client_type as any) || 'Existing Client',
    opportunityId: row.opportunity_id || '',
    opportunityTitle: row.opportunity_title || '',
    dueDate: row.due_date ? row.due_date.split('T')[0] : '',
    assignedTo: row.assigned_to_name || row.assigned_to || '',
    type: row.followup_type || row.type || 'Call',
    priority: (row.priority as any) || 'Medium',
    description: row.description || '',
    status: (row.status as any) || 'Pending',
    completedDate: row.completed_at ? row.completed_at.split('T')[0] : (row.completed_date ? row.completed_date.split('T')[0] : undefined),
    remarks: row.remarks || '',
  };
}

export function transformInternalTaskFromDB(row: any): InternalTask {
  return {
    id: row.id,
    department: row.department || 'Operations',
    title: row.title,
    clientId: row.client_id || '',
    clientName: row.client_name || '',
    opportunityId: row.opportunity_id || '',
    opportunityTitle: row.opportunity_title || '',
    assignedTo: row.assigned_to || '',
    assignedBy: row.assigned_by || 'System Administrator',
    dueDate: row.due_date ? row.due_date.split('T')[0] : '',
    priority: (row.priority as any) || 'Medium',
    status: (row.status as any) || 'Pending',
    requestDetails: row.request_details || row.title || '',
    responseNotes: row.response_notes || '',
    actionDate: row.action_date ? row.action_date.split('T')[0] : undefined,
    approvalRemarks: row.approval_remarks || '',
    approvedBy: row.approved_by || '',
    approvedDate: row.approved_at ? row.approved_at.split('T')[0] : undefined,
  };
}

export function transformInternalTaskToDB(task: Partial<InternalTask>, orgId: string, userId?: string) {
  const payload: Record<string, any> = {
    organization_id: orgId,
  };
  if (task.id && isValidUUID(task.id)) payload.id = task.id;
  if (task.department) payload.department = task.department;
  if (task.title) payload.title = task.title;
  payload.opportunity_id = isValidUUID(task.opportunityId) ? task.opportunityId : null;
  payload.client_id = isValidUUID(task.clientId) ? task.clientId : null;
  if (task.assignedTo) payload.assigned_to = task.assignedTo;
  if (task.assignedBy) payload.assigned_by = task.assignedBy;
  if (task.dueDate) payload.due_date = task.dueDate;
  if (task.priority) payload.priority = task.priority;
  if (task.status) payload.status = task.status;
  if (task.requestDetails) payload.request_details = task.requestDetails;
  if (task.responseNotes !== undefined) payload.response_notes = task.responseNotes;
  if (task.actionDate) payload.action_date = task.actionDate;
  if (task.approvalRemarks !== undefined) payload.approval_remarks = task.approvalRemarks;
  if (task.approvedBy !== undefined) payload.approved_by = task.approvedBy;
  if (userId && isValidUUID(userId)) payload.created_by = userId;

  return payload;
}

export function transformDocumentFromDB(row: any): CRMDocument {
  return {
    id: row.id,
    name: row.name || row.file_name || 'Document',
    originalFilename: row.original_filename || row.file_name || row.name,
    opportunityId: row.opportunity_id || '',
    opportunityTitle: row.opportunity_title || '',
    clientId: row.client_id || '',
    clientName: row.client_name || '',
    stage: row.stage || 'Lead',
    documentType: row.document_type || 'Proposal',
    fileSize: row.file_size_formatted || `${Math.round((row.file_size_bytes || 1024) / 1024)} KB`,
    fileExtension: row.file_extension || 'pdf',
    uploadedBy: row.uploaded_by_name || 'System Admin',
    uploadedDate: row.created_at ? row.created_at.split('T')[0] : '',
    notes: row.notes || '',
  };
}

export function transformDocumentToDB(doc: Partial<CRMDocument>, orgId: string, userId?: string) {
  const payload: Record<string, any> = {
    organization_id: orgId,
  };
  if (doc.id && isValidUUID(doc.id)) payload.id = doc.id;
  if (doc.name) payload.name = doc.name;
  if (doc.originalFilename || doc.name) payload.original_filename = doc.originalFilename || doc.name;
  payload.client_id = isValidUUID(doc.clientId) ? doc.clientId : null;
  payload.opportunity_id = isValidUUID(doc.opportunityId) ? doc.opportunityId : null;
  if (doc.documentType) payload.document_type = doc.documentType;
  if (doc.stage) payload.stage = doc.stage;
  if (doc.fileExtension) payload.file_extension = doc.fileExtension;
  if (doc.notes !== undefined) payload.notes = doc.notes;
  if (userId && isValidUUID(userId)) payload.uploaded_by = userId;

  return payload;
}

export function deriveAllowedTabsForRole(roleKey?: string, permissions?: any[]): string[] {
  if (!roleKey) return ['tab-dashboard'];

  // If live permissions array exists, derive tabs based on view permissions
  if (permissions && permissions.length > 0) {
    const viewableModules = new Set(
      permissions.filter((p) => p.action === 'view' && p.is_allowed).map((p) => p.module_key)
    );
    const tabs: string[] = ['tab-dashboard'];
    if (viewableModules.has('clients')) tabs.push('tab-clients');
    if (viewableModules.has('team')) tabs.push('tab-employee-master', 'tab-team', 'tab-employee-profile');
    if (viewableModules.has('segments')) tabs.push('tab-segments');
    if (viewableModules.has('opportunities')) tabs.push('tab-opportunities', 'tab-calculator');
    if (viewableModules.has('activities')) tabs.push('tab-activities');
    if (viewableModules.has('followups')) tabs.push('tab-followups');
    if (viewableModules.has('internal')) tabs.push('tab-internal');
    if (viewableModules.has('documents')) tabs.push('tab-documents');
    if (viewableModules.has('review')) tabs.push('tab-review');
    if (viewableModules.has('users')) tabs.push('tab-users');
    return tabs;
  }

  // Role-based derivation matching RBAC matrix
  const tabs: string[] = ['tab-dashboard'];
  const isSuper = roleKey === 'super_admin';
  const isDirector = roleKey === 'bd_director';
  const isManager = roleKey === 'bd_manager';

  tabs.push('tab-clients', 'tab-employee-master', 'tab-team', 'tab-employee-profile');
  if (isSuper || isDirector) tabs.push('tab-segments');
  tabs.push('tab-opportunities', 'tab-calculator', 'tab-activities', 'tab-followups');
  if (isSuper || isDirector || isManager || roleKey === 'operations_manager' || roleKey === 'finance_executive' || roleKey === 'legal_counsel') {
    tabs.push('tab-internal');
  }
  tabs.push('tab-documents');
  if (isSuper || isDirector || isManager || roleKey === 'management_viewer' || roleKey === 'analyst') {
    tabs.push('tab-review');
  }
  if (isSuper || isDirector) {
    tabs.push('tab-users');
  }
  return Array.from(new Set(tabs));
}

export function transformProfileFromDB(p: any): User {
  let mappedRole: any = 'BD Executive';
  if (p.role === 'super_admin') mappedRole = 'System Administrator';
  else if (p.role === 'bd_director' || p.role === 'bd_manager') mappedRole = 'BD Manager';
  else if (p.role === 'management_viewer') mappedRole = 'Management Reviewer';
  else if (p.role === 'bd_sr_exec') mappedRole = 'Senior BD Executive';

  return {
    id: p.id,
    employee_id: p.employee_id || `EMP-${p.id.slice(0, 4).toUpperCase()}`,
    name: p.full_name,
    email: p.email,
    organization_id: p.organization_id,
    role: mappedRole,
    role_name: p.role,
    department: p.department || 'Business Development',
    department_id: p.department_id || undefined,
    designation: p.designation || 'Executive',
    region: p.region || 'West',
    region_id: p.region_id || undefined,
    location: p.location || 'Corporate HQ - Mumbai',
    joining_date: p.joining_date || (p.created_at ? p.created_at.split('T')[0] : '2025-01-01'),
    employment_type: p.employment_type || 'Full-time',
    is_regional_owner: Boolean(p.is_regional_owner),
    team_id: p.team_id || undefined,
    team_name: p.team_name || (p.teams?.name) || undefined,
    manager_id: p.manager_id || undefined,
    manager_name: p.manager_name || undefined,
    status: p.status === 'active' || p.status === 'Active' ? 'Active' : p.status === 'suspended' ? 'Disabled' : 'Inactive',
    annual_target_inr: Number(p.annual_target_inr) || 0,
    achieved_inr: 0,
    active_opps_count: 0,
    phone: p.phone || '',
    avatar_url: p.avatar_url || '',
    avatar_bg: p.avatar_bg || '#3b82f6',
    allowed_tabs: deriveAllowedTabsForRole(p.role),
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}

export function transformProfileToDB(user: Partial<User>, orgId: string) {
  const payload: Record<string, any> = {
    organization_id: orgId,
  };
  if (user.id && isValidUUID(user.id)) payload.id = user.id;
  if (user.name) payload.full_name = user.name;
  if (user.email) payload.email = user.email.trim().toLowerCase();
  if (user.role_name || user.role) {
    const r = user.role_name || user.role;
    if (r === 'System Administrator' || r === 'super_admin') payload.role = 'super_admin';
    else if (r === 'BD Manager' || r === 'bd_manager') payload.role = 'bd_manager';
    else if (r === 'BD Director' || r === 'bd_director') payload.role = 'bd_director';
    else if (r === 'Management Reviewer' || r === 'management_viewer') payload.role = 'management_viewer';
    else if (r === 'Senior BD Executive' || r === 'bd_sr_exec') payload.role = 'bd_sr_exec';
    else if (r === 'Operations Manager' || r === 'operations_manager') payload.role = 'operations_manager';
    else if (r === 'Centralised Ops Supervisor' || r === 'cops_supervisor') payload.role = 'cops_supervisor';
    else if (r === 'Chief Maintenance Engineer' || r === 'maintenance_engineer') payload.role = 'maintenance_engineer';
    else if (r === 'Senior Billing & Collections Specialist' || r === 'finance_executive') payload.role = 'finance_executive';
    else if (r === 'Corporate & Contracts Counsel' || r === 'legal_counsel') payload.role = 'legal_counsel';
    else if (r === 'Commercial Analyst' || r === 'analyst') payload.role = 'analyst';
    else payload.role = r || 'bd_exec';
  }

  if (user.department) payload.department = user.department;
  payload.department_id = isValidUUID(user.department_id) ? user.department_id : null;
  if (user.designation) payload.designation = user.designation;
  if (user.employee_id) payload.employee_id = user.employee_id;
  if (user.phone !== undefined) payload.phone = user.phone;
  if (user.region) payload.region = user.region;
  if (user.region_id !== undefined) payload.region_id = user.region_id && String(user.region_id).trim() ? user.region_id : null;
  if (user.location) payload.location = user.location;
  if (user.joining_date) payload.joining_date = user.joining_date;
  if (user.employment_type) payload.employment_type = user.employment_type;
  if (user.is_regional_owner !== undefined) payload.is_regional_owner = Boolean(user.is_regional_owner);
  if (user.team_id !== undefined) payload.team_id = user.team_id && String(user.team_id).trim() ? user.team_id : null;
  if (user.manager_id !== undefined) payload.manager_id = user.manager_id && String(user.manager_id).trim() ? user.manager_id : null;
  if (user.annual_target_inr !== undefined) payload.annual_target_inr = Number(user.annual_target_inr) || 0;
  if (user.status) {
    const s = String(user.status).toLowerCase();
    payload.status = s === 'active' ? 'active' : s === 'disabled' || s === 'suspended' ? 'suspended' : 'inactive';
  }
  if (user.avatar_bg) payload.avatar_bg = user.avatar_bg;
  if (user.avatar_url) payload.avatar_url = user.avatar_url;

  return payload;
}

// ─── CRUD OPERATIONS ─────────────────────────────────────────────────────────

export const crmDataService = {
  // SEGMENTS
  async fetchSegments(orgId: string): Promise<BusinessSegment[]> {
    if (!isSupabaseConfigured()) return INITIAL_SEGMENTS;
    try {
      const { data, error } = await (supabase.from('segments') as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('segment_code', { ascending: true });

      if (error) {
        console.warn('Supabase fetchSegments error, using initial segments:', error);
        return INITIAL_SEGMENTS;
      }
      if (!data || data.length === 0) return INITIAL_SEGMENTS;
      return (data as any[]).map(transformSegmentFromDB);
    } catch (err) {
      console.warn('Supabase fetchSegments error, returning seed segments:', err);
      return INITIAL_SEGMENTS;
    }
  },

  async insertSegment(seg: Omit<BusinessSegment, 'id'>, orgId: string): Promise<BusinessSegment> {
    if (!isSupabaseConfigured()) {
      const id = 'SEG-' + String(Date.now()).slice(-2);
      return { id, ...seg } as BusinessSegment;
    }
    const nextCode = 'SEG-' + String(Date.now()).slice(-4);
    const dbPayload = transformSegmentToDB({ ...seg, id: nextCode }, orgId);
    
    let { data, error } = await (supabase.from('segments') as any)
      .insert(dbPayload)
      .select()
      .single();

    if (error) {
      console.warn('insertSegment direct insert failed, trying upsert:', error);
      const res = await (supabase.from('segments') as any)
        .upsert(dbPayload)
        .select()
        .single();
      data = res.data;
      error = res.error;
    }

    if (error) {
      console.error('insertSegment error:', error);
      throw error;
    }
    return transformSegmentFromDB(data);
  },

  async updateSegment(id: string, updates: Partial<BusinessSegment>, orgId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const dbPayload = transformSegmentToDB(updates, orgId);
    delete dbPayload.id; // Do not update PK

    if (isValidUUID(id)) {
      const { error } = await (supabase.from('segments') as any).update(dbPayload).eq('id', id).eq('organization_id', orgId);
      if (error) throw error;
    } else {
      const { error } = await (supabase.from('segments') as any).update(dbPayload).eq('segment_code', id).eq('organization_id', orgId);
      if (error) throw error;
    }
  },

  async deleteSegment(id: string, orgId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    if (isValidUUID(id)) {
      const { error } = await (supabase.from('segments') as any).delete().eq('id', id).eq('organization_id', orgId);
      if (error) throw error;
    } else {
      const { error } = await (supabase.from('segments') as any).delete().eq('segment_code', id).eq('organization_id', orgId);
      if (error) throw error;
    }
  },

  // CLIENTS
  async fetchClients(orgId: string): Promise<Client[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data: clients, error: clientErr } = await (supabase.from('clients') as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (clientErr) throw clientErr;
      if (!clients || clients.length === 0) return [];

      const { data: contacts } = await (supabase.from('contacts') as any)
        .select('*')
        .eq('organization_id', orgId);

      return (clients as any[]).map((c) => {
        const clientContacts = ((contacts || []) as any[]).filter((con) => con.client_id === c.id);
        return transformClientFromDB(c, clientContacts);
      });
    } catch (err) {
      console.warn('Supabase fetchClients error, returning empty list:', err);
      return [];
    }
  },

  async insertClient(client: Omit<Client, 'id' | 'code' | 'createdDate'>, orgId: string, userId?: string): Promise<Client> {
    if (!isSupabaseConfigured()) {
      const id = 'cl_' + Date.now();
      return { id, code: 'CL-' + String(Date.now()).slice(-4), createdDate: new Date().toISOString().split('T')[0], ...client } as Client;
    }
    const dbPayload = transformClientToDB(client as any, orgId, userId);
    const { data, error } = await (supabase.from('clients') as any).insert(dbPayload).select().single();
    if (error) throw error;
    return transformClientFromDB(data, client.contacts || []);
  },

  async batchInsertClients(clientsList: Client[], orgId: string, userId?: string): Promise<Client[]> {
    if (!isSupabaseConfigured() || clientsList.length === 0) return clientsList;
    try {
      const dbPayloads = clientsList.map((c) => transformClientToDB(c, orgId, userId));
      
      let insertedClients: any[] = [];
      const { data, error: clientErr } = await (supabase.from('clients') as any)
        .insert(dbPayloads)
        .select();

      if (!clientErr && data) {
        insertedClients = data;
      } else {
        // Try upsert if insert had conflict
        const { data: upsertData } = await (supabase.from('clients') as any)
          .upsert(dbPayloads)
          .select();
        if (upsertData) insertedClients = upsertData;
      }

      // Also insert primary contacts into contacts table
      const contactPayloads: any[] = [];
      clientsList.forEach((c) => {
        const clientDbId = (insertedClients || []).find((ic: any) => ic.client_code === c.code || ic.name === c.name)?.id || c.id;
        c.contacts.forEach((con) => {
          contactPayloads.push({
            organization_id: orgId,
            client_id: clientDbId,
            name: con.name,
            designation: con.designation,
            email: con.email,
            phone: con.phone,
            is_primary: con.isPrimary,
          });
        });
      });

      if (contactPayloads.length > 0) {
        try {
          await (supabase.from('contacts') as any).insert(contactPayloads);
        } catch (cErr) {
          console.warn('Contact insert notice:', cErr);
        }
      }

      return clientsList;
    } catch (err) {
      console.warn('batchInsertClients exception:', err);
      return clientsList;
    }
  },

  async updateClient(id: string, updates: Partial<Client>, orgId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const dbPayload = transformClientToDB(updates, orgId);
    const { error } = await (supabase.from('clients') as any).update(dbPayload).eq('id', id).eq('organization_id', orgId);
    if (error) throw error;
  },

  async deleteClient(id: string, orgId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const { error } = await (supabase.from('clients') as any).delete().eq('id', id).eq('organization_id', orgId);
    if (error) throw error;
  },

  // OPPORTUNITIES
  async fetchOpportunities(orgId: string): Promise<Opportunity[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await (supabase.from('opportunities') as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];
      return (data as any[]).map(transformOpportunityFromDB);
    } catch (err) {
      console.warn('Supabase fetchOpportunities error, returning empty list:', err);
      return [];
    }
  },

  async insertOpportunity(opp: Omit<Opportunity, 'id' | 'code' | 'createdDate' | 'lastActivityDate'>, orgId: string, userId?: string): Promise<Opportunity> {
    if (!isSupabaseConfigured()) {
      const id = 'opp_' + Date.now();
      return { id, code: 'OPP-' + String(Date.now()).slice(-4), createdDate: new Date().toISOString().split('T')[0], lastActivityDate: new Date().toISOString().split('T')[0], ...opp } as Opportunity;
    }
    const oppCode = 'OPP-' + String(Date.now()).slice(-4);
    const dbPayload = transformOpportunityToDB({ ...opp, code: oppCode }, orgId, userId);
    
    let { data, error } = await (supabase.from('opportunities') as any)
      .insert(dbPayload)
      .select()
      .single();

    if (error) {
      console.warn('insertOpportunity direct insert failed, trying upsert:', error);
      const res = await (supabase.from('opportunities') as any)
        .upsert(dbPayload)
        .select()
        .single();
      data = res.data;
      error = res.error;
    }

    if (error) {
      console.error('insertOpportunity error:', error);
      throw error;
    }
    return transformOpportunityFromDB(data);
  },

  async updateOpportunity(id: string, updates: Partial<Opportunity>, orgId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const dbPayload = transformOpportunityToDB(updates, orgId);
    delete dbPayload.id; // Never update primary key

    if (isValidUUID(id)) {
      const { error } = await (supabase.from('opportunities') as any).update(dbPayload).eq('id', id).eq('organization_id', orgId);
      if (error) throw error;
    } else {
      const { error } = await (supabase.from('opportunities') as any).update(dbPayload).eq('opportunity_code', id).eq('organization_id', orgId);
      if (error) throw error;
    }
  },

  async deleteOpportunity(id: string, orgId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    if (isValidUUID(id)) {
      const { error } = await (supabase.from('opportunities') as any).delete().eq('id', id).eq('organization_id', orgId);
      if (error) throw error;
    } else {
      const { error } = await (supabase.from('opportunities') as any).delete().eq('opportunity_code', id).eq('organization_id', orgId);
      if (error) throw error;
    }
  },

  // ACTIVITIES
  async fetchActivities(orgId: string): Promise<Activity[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await (supabase.from('activities') as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];
      return (data as any[]).map(transformActivityFromDB);
    } catch (err) {
      console.warn('Supabase fetchActivities error, returning empty list:', err);
      return [];
    }
  },

  async insertActivity(act: Omit<Activity, 'id'>, orgId: string, userId?: string): Promise<Activity> {
    if (!isSupabaseConfigured()) {
      return { id: 'act_' + Date.now(), ...act };
    }
    const actType = act.type || 'Physical Meeting';
    const payload: Record<string, any> = {
      organization_id: orgId,
      client_id: isValidUUID(act.clientId) ? act.clientId : null,
      client_name: act.clientName || 'General Client',
      client_type: act.clientType || 'Existing Client',
      opportunity_id: isValidUUID(act.opportunityId) ? act.opportunityId : null,
      opportunity_title: act.opportunityTitle || null,
      activity_type: actType,
      type: actType,
      subject: `${actType} with ${act.clientName || 'Client'}`,
      activity_date: act.date || new Date().toISOString().slice(0, 10),
      activity_time: act.time || '11:00',
      conducted_by: act.conductedBy || 'BD Executive',
      contact_person: act.contactPerson || 'Client Contact',
      location: act.location || 'Client Office',
      key_discussion: act.keyDiscussion || '',
      outcome: act.outcome || '',
      action_items: act.actionItems || '',
      next_followup_date: act.nextFollowupDate || null,
      status: act.status || 'Completed',
    };
    if (isValidUUID(userId)) {
      payload.created_by = userId;
    }

    const { data, error } = await (supabase.from('activities') as any)
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('insertActivity error:', error);
      throw error;
    }
    return transformActivityFromDB(data);
  },

  async deleteActivity(id: string, orgId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    if (isValidUUID(id)) {
      const { error } = await (supabase.from('activities') as any).delete().eq('id', id).eq('organization_id', orgId);
      if (error) throw error;
    }
  },

  // FOLLOWUPS
  async fetchFollowups(orgId: string): Promise<Followup[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await (supabase.from('followups') as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return [];
      return (data as any[]).map(transformFollowupFromDB);
    } catch (err) {
      console.warn('Supabase fetchFollowups error, returning empty list:', err);
      return [];
    }
  },

  async insertFollowup(fol: Omit<Followup, 'id'>, orgId: string, userId?: string): Promise<Followup> {
    if (!isSupabaseConfigured()) {
      return { id: 'fol_' + Date.now(), ...fol };
    }
    const folType = fol.type || 'Call';
    const payload: Record<string, any> = {
      organization_id: orgId,
      client_id: isValidUUID(fol.clientId) ? fol.clientId : null,
      client_name: fol.clientName || 'General Account',
      client_type: fol.clientType || 'Existing Client',
      opportunity_id: isValidUUID(fol.opportunityId) ? fol.opportunityId : null,
      opportunity_title: fol.opportunityTitle || null,
      due_date: fol.dueDate || new Date().toISOString().slice(0, 10),
      assigned_to: fol.assignedTo || 'BD Executive',
      followup_type: folType,
      type: folType,
      priority: fol.priority || 'Medium',
      description: fol.description || 'Follow-up with client',
      status: fol.status || 'Pending',
    };
    if (isValidUUID(userId)) {
      payload.created_by = userId;
    }

    const { data, error } = await (supabase.from('followups') as any)
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('insertFollowup error:', error);
      throw error;
    }
    return transformFollowupFromDB(data);
  },

  async updateFollowup(id: string, updates: Partial<Followup>, orgId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const dbPayload: any = {};
    if (updates.status) dbPayload.status = updates.status;
    if (updates.remarks !== undefined) dbPayload.remarks = updates.remarks;
    if (updates.completedDate) dbPayload.completed_at = updates.completedDate;
    if (updates.dueDate) dbPayload.due_date = updates.dueDate;
    if (updates.description) dbPayload.description = updates.description;
    if (updates.priority) dbPayload.priority = updates.priority;

    if (isValidUUID(id)) {
      const { error } = await (supabase.from('followups') as any).update(dbPayload).eq('id', id).eq('organization_id', orgId);
      if (error) throw error;
    }
  },

  async deleteFollowup(id: string, orgId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    if (isValidUUID(id)) {
      const { error } = await (supabase.from('followups') as any).delete().eq('id', id).eq('organization_id', orgId);
      if (error) throw error;
    }
  },

  // INTERNAL TASKS (Delegation Matrix & Operations Tasks)
  async fetchInternalTasks(orgId: string): Promise<InternalTask[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await (supabase.from('internal_tasks') as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];
      return (data as any[]).map(transformInternalTaskFromDB);
    } catch (err) {
      console.warn('Supabase fetchInternalTasks error, returning empty list:', err);
      return [];
    }
  },

  async insertInternalTask(task: Omit<InternalTask, 'id'>, orgId: string, userId?: string): Promise<InternalTask> {
    if (!isSupabaseConfigured()) {
      return { id: 'int_' + Date.now(), ...task } as InternalTask;
    }
    const dbPayload = transformInternalTaskToDB(task as any, orgId, userId);
    const { data, error } = await (supabase.from('internal_tasks') as any).insert(dbPayload).select().single();
    if (error) {
      console.error('insertInternalTask error:', error);
      throw error;
    }
    return transformInternalTaskFromDB(data);
  },

  async updateInternalTask(id: string, updates: Partial<InternalTask>, orgId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const dbPayload = transformInternalTaskToDB(updates, orgId);
    delete dbPayload.id;

    if (isValidUUID(id)) {
      const { error } = await (supabase.from('internal_tasks') as any).update(dbPayload).eq('id', id).eq('organization_id', orgId);
      if (error) throw error;
    } else {
      const { error } = await (supabase.from('internal_tasks') as any).update(dbPayload).eq('task_code', id).eq('organization_id', orgId);
      if (error) throw error;
    }
  },

  async deleteInternalTask(id: string, orgId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    if (isValidUUID(id)) {
      const { error } = await (supabase.from('internal_tasks') as any).delete().eq('id', id).eq('organization_id', orgId);
      if (error) throw error;
    } else {
      const { error } = await (supabase.from('internal_tasks') as any).delete().eq('task_code', id).eq('organization_id', orgId);
      if (error) throw error;
    }
  },

  // DOCUMENTS
  async fetchDocuments(orgId: string): Promise<CRMDocument[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await (supabase.from('documents') as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];
      return (data as any[]).map(transformDocumentFromDB);
    } catch (err) {
      console.warn('Supabase fetchDocuments error, returning empty list:', err);
      return [];
    }
  },

  async insertDocument(doc: Omit<CRMDocument, 'id' | 'uploadedDate'>, orgId: string, userId?: string): Promise<CRMDocument> {
    if (!isSupabaseConfigured()) {
      return { id: 'doc_' + Date.now(), uploadedDate: new Date().toISOString().slice(0, 10), ...doc } as CRMDocument;
    }
    const dbPayload = transformDocumentToDB(doc, orgId, userId);
    const { data, error } = await (supabase.from('documents') as any).insert(dbPayload).select().single();
    if (error) {
      console.error('insertDocument error:', error);
      throw error;
    }
    return transformDocumentFromDB(data);
  },

  async updateDocument(id: string, updates: Partial<CRMDocument>, orgId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const dbPayload = transformDocumentToDB(updates, orgId);
    delete dbPayload.id;

    if (isValidUUID(id)) {
      const { error } = await (supabase.from('documents') as any).update(dbPayload).eq('id', id).eq('organization_id', orgId);
      if (error) throw error;
    }
  },

  async deleteDocument(id: string, orgId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    if (isValidUUID(id)) {
      const { error } = await (supabase.from('documents') as any).delete().eq('id', id).eq('organization_id', orgId);
      if (error) throw error;
    }
  },

  // USERS & PROFILES (Unified Single Source of Truth)
  async fetchProfiles(orgId: string): Promise<User[]> {
    if (!isSupabaseConfigured()) return INITIAL_USERS;
    try {
      // Join teams table to resolve team_name
      const { data, error } = await (supabase.from('profiles') as any)
        .select('*, teams:team_id(name)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return INITIAL_USERS;

      // Transform and resolve manager_name via self-lookup
      const transformed = (data as any[]).map((p: any) => {
        const user = transformProfileFromDB({
          ...p,
          team_name: p.teams?.name || undefined,
        });
        return user;
      });

      // Second pass: resolve manager_name from the same batch
      const profileMap = new Map(transformed.map((u) => [u.id, u.name]));
      return transformed.map((u) => ({
        ...u,
        manager_name: u.manager_id ? profileMap.get(u.manager_id) || u.manager_name : u.manager_name,
      }));
    } catch (err) {
      console.warn('Supabase fetchProfiles error, using fallback:', err);
      return INITIAL_USERS;
    }
  },

export async function validateProfileForeignKeys(
  dbPayload: Record<string, any>,
  orgId: string,
  targetProfileId?: string
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const profileId = targetProfileId || dbPayload.id;

  // 1. Manager Validation (Fail-Closed)
  if (dbPayload.manager_id) {
    if (!isValidUUID(dbPayload.manager_id)) {
      throw new Error('Selected reporting manager ID is invalid. Please select a valid active manager.');
    }

    if (profileId && dbPayload.manager_id === profileId) {
      throw new Error('Hierarchy Integrity Violation: An employee cannot be assigned as their own reporting manager.');
    }

    const { data: mgrProfile, error: mgrErr } = await (supabase.from('profiles') as any)
      .select('id, status, organization_id, full_name')
      .eq('id', dbPayload.manager_id)
      .maybeSingle();

    if (mgrErr) {
      console.error('Error verifying manager profile in database:', mgrErr);
      throw new Error(`Failed to verify reporting manager: ${mgrErr.message}`);
    }

    if (!mgrProfile) {
      throw new Error('Selected reporting manager is no longer available. Please refresh the manager list and select an active manager.');
    }

    if (mgrProfile.status !== 'active') {
      throw new Error(`Selected reporting manager (${mgrProfile.full_name || 'User'}) is inactive. Please select an active manager.`);
    }

    if (mgrProfile.organization_id && mgrProfile.organization_id !== orgId) {
      throw new Error('Cross-Organization Violation: Selected reporting manager belongs to a different organization workspace.');
    }
  }

  // 2. Team Validation (Fail-Closed)
  if (dbPayload.team_id) {
    if (!isValidUUID(dbPayload.team_id)) {
      throw new Error('Selected team ID is invalid. Please select a valid team.');
    }

    const { data: teamRow, error: teamErr } = await (supabase.from('teams') as any)
      .select('id, organization_id, is_active')
      .eq('id', dbPayload.team_id)
      .maybeSingle();

    if (teamErr) {
      console.error('Error verifying team in database:', teamErr);
      throw new Error(`Failed to verify team assignment: ${teamErr.message}`);
    }

    if (!teamRow) {
      throw new Error('Selected team does not exist. Please refresh and select a valid team.');
    }

    if (teamRow.organization_id && teamRow.organization_id !== orgId) {
      throw new Error('Cross-Organization Violation: Selected team belongs to a different organization workspace.');
    }
  }

  // 3. Region Validation (Fail-Closed)
  if (dbPayload.region_id) {
    if (!isValidUUID(dbPayload.region_id)) {
      throw new Error('Selected region ID is invalid. Please select a valid region.');
    }

    const { data: regRow, error: regErr } = await (supabase.from('regions') as any)
      .select('id, organization_id')
      .eq('id', dbPayload.region_id)
      .maybeSingle();

    if (regErr) {
      console.error('Error verifying region in database:', regErr);
      throw new Error(`Failed to verify region assignment: ${regErr.message}`);
    }

    if (!regRow) {
      throw new Error('Selected region does not exist. Please refresh and select a valid region.');
    }

    if (regRow.organization_id && regRow.organization_id !== orgId) {
      throw new Error('Cross-Organization Violation: Selected region belongs to a different organization workspace.');
    }
  }
}

  async upsertProfile(user: Partial<User>, orgId: string): Promise<User> {
    if (!isSupabaseConfigured()) {
      const id = user.id || `USR-${Date.now()}`;
      return { id, employee_id: user.employee_id || `EMP-${Date.now().toString().slice(-4)}`, ...user } as User;
    }

    const dbPayload = transformProfileToDB(user, orgId);
    if (!dbPayload.id) {
      dbPayload.id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `00000000-0000-0000-0000-${Date.now().toString().slice(-12).padStart(12, '0')}`;
    }

    // Fail-Closed Validation: Verify foreign keys strictly before attempting database upsert
    await validateProfileForeignKeys(dbPayload, orgId);

    // Try upsert on public.profiles
    const { data, error } = await (supabase.from('profiles') as any)
      .upsert(dbPayload, { onConflict: 'email' })
      .select()
      .single();

    if (error) {
      console.error('Supabase upsertProfile error:', error);
      throw error;
    }

    return transformProfileFromDB(data);
  },

  async updateProfile(id: string, updates: Partial<User>, orgId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const dbPayload = transformProfileToDB(updates, orgId);
    delete dbPayload.id; // Do not overwrite primary key on update

    // Fail-Closed Validation: Verify foreign keys strictly before attempting database update
    await validateProfileForeignKeys(dbPayload, orgId, id);

    const { error } = await (supabase.from('profiles') as any)
      .update(dbPayload)
      .eq('id', id)
      .eq('organization_id', orgId);
    if (error) {
      console.error('Supabase updateProfile error:', error);
      throw error;
    }
  },

  async deleteProfile(id: string, orgId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const { error } = await (supabase.from('profiles') as any)
      .delete()
      .eq('id', id)
      .eq('organization_id', orgId);
    if (error) {
      console.error('Supabase deleteProfile error:', error);
      throw error;
    }
  },
};
