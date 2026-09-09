/**
 * Proposal Governance & Versioning Service
 * Manages proposal versions, commercial terms, lifecycle statuses,
 * and Separation of Duties (SoD) approval workflows.
 */

import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';

export type ProposalStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'superseded';

export interface ProposalRecord {
  id: string;
  proposalCode: string;
  opportunityId?: string;
  opportunityTitle?: string;
  clientId?: string;
  clientName?: string;
  versionNumber: number;
  versionLabel: string; // e.g. "v1.0", "v2.0"
  status: ProposalStatus;
  totalCommercialValueINR: number;
  monthlyRateINR: number;
  marginPct: number;
  fleetSize: number;
  vehicleType: string;
  commercialTerms?: Record<string, any>;
  submittedBy?: string;
  submittedByName?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedDate?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
}

export interface CreateProposalPayload {
  organizationId: string;
  opportunityId?: string;
  opportunityTitle?: string;
  clientId?: string;
  clientName?: string;
  fleetSize: number;
  vehicleType: string;
  monthlyRateINR: number;
  totalCommercialValueINR: number;
  marginPct: number;
  commercialTerms?: Record<string, any>;
  notes?: string;
  userId?: string;
  userName?: string;
}

export const INITIAL_PROPOSALS: ProposalRecord[] = [
  {
    id: 'prop-101',
    proposalCode: 'PROP-2026-001-v1',
    opportunityId: 'OPP-2026-001',
    opportunityTitle: 'TCS Hinjawadi Phase 2 Dedicated Fleet (50 Buses)',
    clientId: 'CLT-1001',
    clientName: 'Tata Consultancy Services',
    versionNumber: 1,
    versionLabel: 'v1.0',
    status: 'approved',
    totalCommercialValueINR: 72000000,
    monthlyRateINR: 6000000,
    marginPct: 22.5,
    fleetSize: 50,
    vehicleType: '40 Seater – AC',
    submittedBy: 'u-bd-exec-1',
    submittedByName: 'Anand Shinde',
    approvedBy: 'u-bd-director',
    approvedByName: 'Vikram Shinde',
    approvedDate: '2026-02-15',
    notes: 'Initial approved annual master commercial proposal.',
    createdAt: '2026-02-10',
  },
  {
    id: 'prop-102',
    proposalCode: 'PROP-2026-002-v1',
    opportunityId: 'OPP-2026-002',
    opportunityTitle: 'Infosys Hinjawadi Fleet Expansion (30 Urbania)',
    clientId: 'CLT-1002',
    clientName: 'Infosys BPM',
    versionNumber: 1,
    versionLabel: 'v1.0',
    status: 'under_review',
    totalCommercialValueINR: 36000000,
    monthlyRateINR: 3000000,
    marginPct: 24.0,
    fleetSize: 30,
    vehicleType: '17 Seater Urbania',
    submittedBy: 'u-bd-exec-2',
    submittedByName: 'Priya Deshmukh',
    notes: 'Submitted for executive pricing review.',
    createdAt: '2026-03-01',
  },
];

export const proposalService = {
  /**
   * Fetches proposal records for the organization
   */
  async fetchProposals(organizationId: string, opportunityId?: string): Promise<ProposalRecord[]> {
    if (!isSupabaseConfigured() || !organizationId) {
      return opportunityId
        ? INITIAL_PROPOSALS.filter((p) => p.opportunityId === opportunityId)
        : INITIAL_PROPOSALS;
    }

    try {
      let query = (supabase.from('proposals') as any)
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (opportunityId) {
        query = query.eq('opportunity_id', opportunityId);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) return INITIAL_PROPOSALS;

      return (data as any[]).map((row) => ({
        id: row.id,
        proposalCode: row.proposal_code || `PROP-${row.id.slice(0, 8)}`,
        opportunityId: row.opportunity_id,
        opportunityTitle: row.opportunity_title,
        clientId: row.client_id,
        clientName: row.client_name,
        versionNumber: row.version_number || 1,
        versionLabel: `v${row.version_number || 1}.0`,
        status: (row.status as ProposalStatus) || 'draft',
        totalCommercialValueINR: Number(row.total_commercial_value_inr) || 0,
        monthlyRateINR: Number(row.monthly_rate_inr) || 0,
        marginPct: Number(row.margin_pct) || 0,
        fleetSize: Number(row.fleet_size) || 0,
        vehicleType: row.vehicle_type || 'Fleet',
        commercialTerms: row.commercial_terms || {},
        submittedBy: row.submitted_by,
        submittedByName: row.submitted_by_name,
        approvedBy: row.approved_by,
        approvedByName: row.approved_by_name,
        approvedDate: row.approved_at ? row.approved_at.split('T')[0] : undefined,
        rejectionReason: row.rejection_reason,
        notes: row.notes,
        createdAt: row.created_at ? row.created_at.split('T')[0] : '',
      }));
    } catch (err) {
      console.warn('Supabase fetchProposals error, using fallback:', err);
      return INITIAL_PROPOSALS;
    }
  },

  /**
   * Creates a new proposal version in PostgreSQL
   */
  async createProposalVersion(payload: CreateProposalPayload): Promise<{ success: boolean; proposal?: ProposalRecord; error?: string }> {
    const {
      organizationId, opportunityId, opportunityTitle, clientId, clientName,
      fleetSize, vehicleType, monthlyRateINR, totalCommercialValueINR, marginPct,
      commercialTerms, notes, userId, userName
    } = payload;

    if (!isSupabaseConfigured()) {
      const newVersion: ProposalRecord = {
        id: `prop-${Date.now()}`,
        proposalCode: `PROP-2026-${Date.now().toString().slice(-3)}-v1`,
        opportunityId,
        opportunityTitle,
        clientId,
        clientName,
        versionNumber: 1,
        versionLabel: 'v1.0',
        status: 'draft',
        totalCommercialValueINR,
        monthlyRateINR,
        marginPct,
        fleetSize,
        vehicleType,
        commercialTerms,
        submittedBy: userId,
        submittedByName: userName,
        notes,
        createdAt: new Date().toISOString().split('T')[0],
      };
      return { success: true, proposal: newVersion };
    }

    try {
      // Find highest current version number for this opportunity
      let nextVersion = 1;
      if (opportunityId) {
        const { data: existing } = await (supabase.from('proposals') as any)
          .select('version_number')
          .eq('organization_id', organizationId)
          .eq('opportunity_id', opportunityId)
          .order('version_number', { ascending: false })
          .limit(1);

        if (existing && existing.length > 0) {
          nextVersion = (existing[0].version_number || 1) + 1;
        }
      }

      const proposalCode = `PROP-2026-${Date.now().toString().slice(-4)}-v${nextVersion}`;

      const { data, error } = await (supabase.from('proposals') as any)
        .insert({
          organization_id: organizationId,
          opportunity_id: opportunityId || null,
          opportunity_title: opportunityTitle || null,
          client_id: clientId || null,
          client_name: clientName || null,
          proposal_code: proposalCode,
          version_number: nextVersion,
          status: 'draft',
          total_commercial_value_inr: totalCommercialValueINR,
          monthly_rate_inr: monthlyRateINR,
          margin_pct: marginPct,
          fleet_size: fleetSize,
          vehicle_type: vehicleType,
          commercial_terms: commercialTerms || {},
          owner_id: userId || null,
          submitted_by: userId || null,
          submitted_by_name: userName || 'System User',
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        proposal: {
          id: data.id,
          proposalCode: data.proposal_code,
          opportunityId: data.opportunity_id,
          opportunityTitle: data.opportunity_title,
          clientId: data.client_id,
          clientName: data.client_name,
          versionNumber: data.version_number,
          versionLabel: `v${data.version_number}.0`,
          status: 'draft',
          totalCommercialValueINR: Number(data.total_commercial_value_inr) || 0,
          monthlyRateINR: Number(data.monthly_rate_inr) || 0,
          marginPct: Number(data.margin_pct) || 0,
          fleetSize: Number(data.fleet_size) || 0,
          vehicleType: data.vehicle_type,
          commercialTerms: data.commercial_terms,
          submittedBy: data.submitted_by,
          submittedByName: data.submitted_by_name,
          notes: data.notes,
          createdAt: data.created_at.split('T')[0],
        },
      };
    } catch (err: any) {
      console.error('Error creating proposal version:', err);
      return { success: false, error: err.message || 'Failed to create proposal.' };
    }
  },

  /**
   * Submits a draft proposal for executive review
   */
  async submitProposalForReview(proposalId: string, organizationId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) return { success: true };

    try {
      const { error } = await (supabase.from('proposals') as any)
        .update({
          status: 'under_review',
          updated_at: new Date().toISOString(),
        })
        .eq('id', proposalId)
        .eq('organization_id', organizationId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Approves a proposal with Separation of Duties verification
   */
  async approveProposal(
    proposal: ProposalRecord,
    organizationId: string,
    approverId: string,
    approverName: string,
    remarks?: string
  ): Promise<{ success: boolean; error?: string }> {
    // 1. Separation of Duties check
    if (approverId && (approverId === proposal.submittedBy)) {
      return {
        success: false,
        error: 'Separation of Duties Violation: You cannot approve a commercial proposal that you created or submitted.',
      };
    }

    if (!isSupabaseConfigured()) return { success: true };

    try {
      const { error } = await (supabase.from('proposals') as any)
        .update({
          status: 'approved',
          approved_by: approverId || null,
          approved_by_name: approverName,
          approved_at: new Date().toISOString(),
          notes: remarks ? `${proposal.notes || ''} [Approval Note: ${remarks}]`.trim() : proposal.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', proposal.id)
        .eq('organization_id', organizationId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Rejects a proposal with mandatory documented reason
   */
  async rejectProposal(
    proposalId: string,
    organizationId: string,
    approverId: string,
    approverName: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!reason || !reason.trim()) {
      return { success: false, error: 'Rejection requires a documented reason.' };
    }

    if (!isSupabaseConfigured()) return { success: true };

    try {
      const { error } = await (supabase.from('proposals') as any)
        .update({
          status: 'rejected',
          approved_by: approverId || null,
          approved_by_name: approverName,
          rejection_reason: reason.trim(),
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', proposalId)
        .eq('organization_id', organizationId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};
