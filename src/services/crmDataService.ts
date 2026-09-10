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

// ─── ENTITY TRANSFORMERS ──────────────────────────────────────────────────────

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
  if (userId) payload.created_by = userId;

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
  if (opp.code) payload.opportunity_code = opp.code;
  if (opp.title) payload.title = opp.title;
  if (opp.clientId) payload.client_id = opp.clientId;
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
  if (userId) payload.owner_id = userId;
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
    type: (row.activity_type as any) || 'Physical Meeting',
    clientId: row.client_id || '',
    clientName: row.client_name || '',
    clientType: (row.client_type as any) || 'Existing Client',
    opportunityId: row.opportunity_id || '',
    opportunityTitle: row.opportunity_title || '',
    date: row.activity_date ? row.activity_date.split('T')[0] : '',
    time: row.activity_time || '',
    conductedBy: row.conducted_by_name || 'BD Executive',
    contactPerson: row.contact_person || '',
    location: row.location || '',
    keyDiscussion: row.key_discussion || '',
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
    assignedTo: row.assigned_to_name || '',
    type: row.followup_type || 'Call',
    priority: (row.priority as any) || 'Medium',
    description: row.description || '',
    status: (row.status as any) || 'Pending',
    completedDate: row.completed_at ? row.completed_at.split('T')[0] : undefined,
    remarks: row.remarks || '',
  };
}

export function transformDocumentFromDB(row: any): CRMDocument {
  return {
    id: row.id,
    name: row.file_name || 'Document',
    originalFilename: row.original_filename || row.file_name,
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
    manager_id: p.manager_id || undefined,
    status: p.status === 'active' || p.status === 'Active' ? 'Active' : p.status === 'suspended' ? 'Disabled' : 'Inactive',
    annual_target_inr: Number(p.annual_target_inr) || 0,
    achieved_inr: 0,
    active_opps_count: 0,
    phone: p.phone || '',
    avatar_url: p.avatar_url || '',
    avatar_bg: p.avatar_bg || '#3b82f6',
    allowed_tabs: p.role === 'super_admin'
      ? ['tab-dashboard', 'tab-clients', 'tab-employee-master', 'tab-team', 'tab-employee-profile', 'tab-segments', 'tab-opportunities', 'tab-calculator', 'tab-activities', 'tab-followups', 'tab-internal', 'tab-documents', 'tab-review', 'tab-users']
      : ['tab-dashboard', 'tab-clients', 'tab-employee-master', 'tab-team', 'tab-employee-profile', 'tab-opportunities', 'tab-activities', 'tab-followups', 'tab-documents'],
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}

export function transformProfileToDB(user: Partial<User>, orgId: string) {
  const payload: Record<string, any> = {
    organization_id: orgId,
  };
  if (user.id) payload.id = user.id;
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
  if (user.department_id !== undefined) payload.department_id = user.department_id || null;
  if (user.designation) payload.designation = user.designation;
  if (user.employee_id) payload.employee_id = user.employee_id;
  if (user.phone !== undefined) payload.phone = user.phone;
  if (user.region) payload.region = user.region;
  if (user.region_id !== undefined) payload.region_id = user.region_id || null;
  if (user.location) payload.location = user.location;
  if (user.joining_date) payload.joining_date = user.joining_date;
  if (user.employment_type) payload.employment_type = user.employment_type;
  if (user.is_regional_owner !== undefined) payload.is_regional_owner = Boolean(user.is_regional_owner);
  if (user.team_id !== undefined) payload.team_id = user.team_id || null;
  if (user.manager_id !== undefined) payload.manager_id = user.manager_id || null;
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
    const dbPayload = transformOpportunityToDB(opp as any, orgId, userId);
    const { data, error } = await (supabase.from('opportunities') as any).insert(dbPayload).select().single();
    if (error) throw error;
    return transformOpportunityFromDB(data);
  },

  async updateOpportunity(id: string, updates: Partial<Opportunity>, orgId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const dbPayload = transformOpportunityToDB(updates, orgId);
    const { error } = await (supabase.from('opportunities') as any).update(dbPayload).eq('id', id).eq('organization_id', orgId);
    if (error) throw error;
  },

  async deleteOpportunity(id: string, orgId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const { error } = await (supabase.from('opportunities') as any).delete().eq('id', id).eq('organization_id', orgId);
    if (error) throw error;
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
    const { data, error } = await (supabase.from('activities') as any)
      .insert({
        organization_id: orgId,
        client_id: act.clientId || null,
        client_name: act.clientName,
        client_type: act.clientType,
        opportunity_id: act.opportunityId || null,
        opportunity_title: act.opportunityTitle,
        activity_type: act.type as any,
        activity_date: act.date,
        activity_time: act.time,
        conducted_by: userId,
        conducted_by_name: act.conductedBy,
        contact_person: act.contactPerson,
        location: act.location,
        key_discussion: act.keyDiscussion,
        outcome: act.outcome,
        action_items: act.actionItems,
        next_followup_date: act.nextFollowupDate || null,
        status: act.status || 'Completed',
      })
      .select()
      .single();

    if (error) throw error;
    return transformActivityFromDB(data);
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
    const { data, error } = await (supabase.from('followups') as any)
      .insert({
        organization_id: orgId,
        client_id: fol.clientId || null,
        client_name: fol.clientName,
        client_type: fol.clientType,
        opportunity_id: fol.opportunityId || null,
        opportunity_title: fol.opportunityTitle,
        due_date: fol.dueDate,
        assigned_to: userId,
        assigned_to_name: fol.assignedTo,
        followup_type: fol.type,
        priority: fol.priority as any,
        description: fol.description,
        status: fol.status || 'Pending',
      })
      .select()
      .single();

    if (error) throw error;
    return transformFollowupFromDB(data);
  },

  async updateFollowup(id: string, updates: Partial<Followup>, orgId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const dbPayload: any = {};
    if (updates.status) dbPayload.status = updates.status;
    if (updates.remarks) dbPayload.remarks = updates.remarks;
    if (updates.completedDate) dbPayload.completed_at = updates.completedDate;

    const { error } = await (supabase.from('followups') as any).update(dbPayload).eq('id', id).eq('organization_id', orgId);
    if (error) throw error;
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

  // USERS & PROFILES (Unified Single Source of Truth)
  async fetchProfiles(orgId: string): Promise<User[]> {
    if (!isSupabaseConfigured()) return INITIAL_USERS;
    try {
      const { data, error } = await (supabase.from('profiles') as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return INITIAL_USERS;

      return (data as any[]).map(transformProfileFromDB);
    } catch (err) {
      console.warn('Supabase fetchProfiles error, using fallback:', err);
      return INITIAL_USERS;
    }
  },

  async upsertProfile(user: Partial<User>, orgId: string): Promise<User> {
    if (!isSupabaseConfigured()) {
      const id = user.id || `USR-${Date.now()}`;
      return { id, employee_id: user.employee_id || `EMP-${Date.now().toString().slice(-4)}`, ...user } as User;
    }

    const dbPayload = transformProfileToDB(user, orgId);
    if (!dbPayload.id) {
      dbPayload.id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `00000000-0000-0000-0000-${Date.now().toString().slice(-12).padStart(12, '0')}`;
    }

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
