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

// ─── CRUD OPERATIONS ─────────────────────────────────────────────────────────

export const crmDataService = {
  // CLIENTS
  async fetchClients(orgId: string): Promise<Client[]> {
    if (!isSupabaseConfigured()) return INITIAL_CLIENTS;
    try {
      const { data: clients, error: clientErr } = await (supabase.from('clients') as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (clientErr) throw clientErr;
      if (!clients || clients.length === 0) return INITIAL_CLIENTS;

      const { data: contacts } = await (supabase.from('contacts') as any)
        .select('*')
        .eq('organization_id', orgId);

      return (clients as any[]).map((c) => {
        const clientContacts = ((contacts || []) as any[]).filter((con) => con.client_id === c.id);
        return transformClientFromDB(c, clientContacts);
      });
    } catch (err) {
      console.warn('Supabase fetchClients error, using fallback:', err);
      return INITIAL_CLIENTS;
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
    if (!isSupabaseConfigured()) return INITIAL_OPPORTUNITIES;
    try {
      const { data, error } = await (supabase.from('opportunities') as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return INITIAL_OPPORTUNITIES;
      return (data as any[]).map(transformOpportunityFromDB);
    } catch (err) {
      console.warn('Supabase fetchOpportunities error, using fallback:', err);
      return INITIAL_OPPORTUNITIES;
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
    if (!isSupabaseConfigured()) return INITIAL_ACTIVITIES;
    try {
      const { data, error } = await (supabase.from('activities') as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return INITIAL_ACTIVITIES;
      return (data as any[]).map(transformActivityFromDB);
    } catch (err) {
      console.warn('Supabase fetchActivities error, using fallback:', err);
      return INITIAL_ACTIVITIES;
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
    if (!isSupabaseConfigured()) return INITIAL_FOLLOWUPS;
    try {
      const { data, error } = await (supabase.from('followups') as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return INITIAL_FOLLOWUPS;
      return (data as any[]).map(transformFollowupFromDB);
    } catch (err) {
      console.warn('Supabase fetchFollowups error, using fallback:', err);
      return INITIAL_FOLLOWUPS;
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
    if (!isSupabaseConfigured()) return INITIAL_DOCUMENTS;
    try {
      const { data, error } = await (supabase.from('documents') as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return INITIAL_DOCUMENTS;
      return (data as any[]).map(transformDocumentFromDB);
    } catch (err) {
      console.warn('Supabase fetchDocuments error, using fallback:', err);
      return INITIAL_DOCUMENTS;
    }
  },

  // USERS & PROFILES
  async fetchProfiles(orgId: string): Promise<User[]> {
    if (!isSupabaseConfigured()) return INITIAL_USERS;
    try {
      const { data, error } = await (supabase.from('profiles') as any)
        .select('*')
        .eq('organization_id', orgId);

      if (error) throw error;
      if (!data || data.length === 0) return INITIAL_USERS;

      return (data as any[]).map((p) => ({
        id: p.id,
        name: p.full_name,
        email: p.email,
        role: p.role === 'super_admin' ? 'System Administrator' : p.role === 'bd_director' || p.role === 'bd_manager' ? 'BD Manager' : p.role === 'management_viewer' ? 'Management Reviewer' : 'BD Executive',
        role_name: p.role,
        status: p.status === 'active' ? 'Active' : 'Inactive',
        allowed_tabs: ['tab-dashboard', 'tab-clients', 'tab-opportunities', 'tab-activities', 'tab-followups'],
      }));
    } catch (err) {
      console.warn('Supabase fetchProfiles error, using fallback:', err);
      return INITIAL_USERS;
    }
  },
};
