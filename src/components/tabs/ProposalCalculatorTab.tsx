import React, { useState, useEffect } from 'react';
import {
  Calculator, ExternalLink, RotateCcw, Maximize2, Minimize2,
  FileCheck2, Plus, Clock, ShieldCheck, CheckCircle2, XCircle, AlertCircle,
  Eye, Download, GitPullRequest, ListFilter, FileText, X, Save, RefreshCw,
  UserCheck, Building2
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { proposalService, ProposalRecord, INITIAL_PROPOSALS } from '../../services/proposalService';
import { logAuditEvent, fetchAuditLogs, AuditLogRecord } from '../../services/auditService';
import { DEPARTMENTS } from '../../utils/seedData';

type EmbedTheme = 'light' | 'dark' | 'native' | 'standard';

export const ProposalCalculatorTab: React.FC = () => {
  const { openModal, currentUser, clients, opportunities } = useCRM();
  const { profile, authUser } = useAuth();

  const [iframeKey, setIframeKey] = useState<number>(Date.now());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [themeMode, setThemeMode] = useState<EmbedTheme>('light');

  // Proposals - persisted in localStorage so new entries survive navigation
  const PROPOSALS_STORAGE_KEY = 'CORPBD_CRM_REACT_V5_proposals_v1';
  const loadStoredProposals = (): ProposalRecord[] => {
    try {
      const stored = localStorage.getItem(PROPOSALS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ProposalRecord[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_PROPOSALS;
  };
  const [proposals, setProposals] = useState<ProposalRecord[]>(loadStoredProposals);
  const [showVersions, setShowVersions] = useState<boolean>(true);

  // Modals & Panels State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedProposalForView, setSelectedProposalForView] = useState<ProposalRecord | null>(null);
  const [selectedProposalForDelegate, setSelectedProposalForDelegate] = useState<ProposalRecord | null>(null);

  // Create form state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Delegation form state
  const [isDelegating, setIsDelegating] = useState<boolean>(false);
  const [delegateError, setDelegateError] = useState<string | null>(null);

  // Audit Trail State
  const [showAuditLogs, setShowAuditLogs] = useState<boolean>(false);
  const [auditLogsList, setAuditLogsList] = useState<AuditLogRecord[]>([]);
  const [auditFilter, setAuditFilter] = useState<string>('All');
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);

  // Form State for New Proposal - always pre-filled with valid defaults
  const DEFAULT_CREATE_FORM = {
    opportunityTitle: '',
    clientName: '',
    fleetSize: 25,
    vehicleType: '40 Seater – AC Executive Bus',
    monthlyRateINR: 180000,
    marginPct: 22.0,
    delegatedDepartment: 'Operations',
    delegatedOwner: 'Manish Rawat (VP - Ops)',
    notes: 'Standard 3-year commercial contract with quarterly diesel index escalation.',
  };
  const [createForm, setCreateForm] = useState({ ...DEFAULT_CREATE_FORM });

  // Form State for Delegation Matrix
  const [delegateForm, setDelegateForm] = useState({
    delegatedDepartment: 'Operations',
    delegatedOwner: 'Manish Rawat (VP - Ops)',
    delegationStatus: 'Pending Action',
    delegationMilestone: 'Route survey & vehicle turnaround feasibility analysis',
    slaDaysRemaining: 2,
    delegationRemarks: '',
  });

  const orgId = profile?.organization_id || '00000000-0000-0000-0000-000000000001';

  // Persist proposals to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(PROPOSALS_STORAGE_KEY, JSON.stringify(proposals));
    } catch {
      // ignore
    }
  }, [proposals]);

  // Load proposals from Supabase (if configured) and merge with local
  useEffect(() => {
    proposalService.fetchProposals(orgId).then((data) => {
      if (data && data.length > 0) {
        setProposals((current) => {
          // Merge: keep locally-created proposals not on server, plus all server proposals
          const serverIds = new Set(data.map((p) => p.id));
          const localOnly = current.filter((p) => !serverIds.has(p.id) && p.id.startsWith('prop-'));
          return [...localOnly, ...data];
        });
      }
    });
    refreshAuditLogs();
  }, [orgId]);

  const refreshAuditLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const logs = await fetchAuditLogs(orgId);
      setAuditLogsList(logs);
    } catch (err) {
      console.warn('Failed to load audit logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const getEmbedUrl = (mode: EmbedTheme) => {
    switch (mode) {
      case 'light':
        return 'https://proposal-formula-rispl.streamlit.app/?embed=true&embed_options=light_theme';
      case 'dark':
        return 'https://proposal-formula-rispl.streamlit.app/?embed=true&embed_options=dark_theme';
      case 'native':
        return 'https://proposal-formula-rispl.streamlit.app/?embedded=true';
      case 'standard':
      default:
        return 'https://proposal-formula-rispl.streamlit.app/?embed=true';
    }
  };

  const currentUrl = getEmbedUrl(themeMode);
  const directUrl = 'https://proposal-formula-rispl.streamlit.app/';

  // Auto-dismiss loading overlay after 1.5s
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [iframeKey, themeMode]);

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey(Date.now());
  };

  const handleThemeChange = (newTheme: EmbedTheme) => {
    setThemeMode(newTheme);
    setIsLoading(true);
    setIframeKey(Date.now());
  };

  const handleOpenExternal = () => {
    window.open(directUrl, '_blank', 'noopener,noreferrer');
  };

  // Status badge styling helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0', label: 'Approved' };
      case 'under_review':
      case 'submitted':
        return { bg: '#fef3c7', text: '#b45309', border: '#fde68a', label: 'Under Review' };
      case 'rejected':
        return { bg: '#fee2e2', text: '#dc2626', border: '#fecaca', label: 'Rejected' };
      case 'superseded':
        return { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0', label: 'Superseded' };
      default:
        return { bg: '#f0f9ff', text: '#0284c7', border: '#bae6fd', label: 'Draft' };
    }
  };

  // View proposal version detail & log audit event
  const handleViewProposal = async (p: ProposalRecord) => {
    setSelectedProposalForView(p);
    await logAuditEvent({
      organizationId: orgId,
      userId: authUser?.id,
      userName: profile?.full_name || currentUser?.name || 'Devika Pangam',
      action: 'PROPOSAL_VIEWED',
      entityType: 'proposals',
      entityId: p.id,
      metadata: {
        proposalCode: p.proposalCode,
        clientName: p.clientName,
        totalCommercialValueINR: p.totalCommercialValueINR,
        status: p.status,
      },
    });
    refreshAuditLogs();
  };

  // Download proposal spec sheet file & log audit event
  const handleDownloadProposalSpec = async (p: ProposalRecord) => {
    const textContent = `===================================================================
RAJ MUDRA GROUP - COMMERCIAL PROPOSAL SPECIFICATION SHEET
===================================================================
Proposal Code:          ${p.proposalCode}
Version Label:          ${p.versionLabel}
Client Name:            ${p.clientName || 'Enterprise Client'}
Opportunity Title:      ${p.opportunityTitle || 'N/A'}
Creation Date:          ${p.createdAt}

COMMERCIAL & PRICING SPECIFICATIONS:
-------------------------------------------------------------------
Fleet Size:             ${p.fleetSize} Vehicles / Buses
Vehicle Specification:  ${p.vehicleType}
Monthly Rate per Unit:  ₹${p.monthlyRateINR.toLocaleString('en-IN')}
Total Commercial Value: ₹${p.totalCommercialValueINR.toLocaleString('en-IN')} (₹${(p.totalCommercialValueINR / 10000000).toFixed(2)} Cr)
Target Gross Margin:    ${p.marginPct}%

GOVERNANCE & APPROVAL STATUS:
-------------------------------------------------------------------
Current Status:         ${p.status.toUpperCase()}
Prepared / Submitted:   ${p.submittedByName || 'Author'}
Authorized Approver:    ${p.approvedByName ? `${p.approvedByName} (${p.approvedDate})` : 'Pending Sign-off'}
Rejection Reason:       ${p.rejectionReason || 'None'}

DEPARTMENTAL DELEGATION MATRIX:
-------------------------------------------------------------------
Delegated Department:   ${p.delegatedDepartment || 'Operations'}
Responsible Owner:      ${p.delegatedOwner || 'Manish Rawat (VP - Ops)'}
Delegation Status:      ${p.delegationStatus || 'Pending Action'}
Milestone Deliverable:  ${p.delegationMilestone || 'Technical Feasibility & Cost Modeling'}
SLA Days Remaining:     ${p.slaDaysRemaining ?? 2} Days
Delegation Remarks:     ${p.delegationRemarks || 'None'}

COMMERCIAL & LEGAL NOTES:
-------------------------------------------------------------------
${p.notes || 'Standard 3-Year Master Transport SLA with Quarterly Diesel Fuel Escalation.'}

===================================================================
Generated on: ${new Date().toLocaleString()}
Raj Mudra Transport Governance Platform • Separation of Duties Enforced
===================================================================`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${p.proposalCode}_SpecSheet.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Record Audit Event
    await logAuditEvent({
      organizationId: orgId,
      userId: authUser?.id,
      userName: profile?.full_name || currentUser?.name || 'Devika Pangam',
      action: 'PROPOSAL_DOWNLOADED',
      entityType: 'proposals',
      entityId: p.id,
      metadata: {
        proposalCode: p.proposalCode,
        clientName: p.clientName,
        totalCommercialValueINR: p.totalCommercialValueINR,
        downloadFormat: 'TXT_SPEC_SHEET',
      },
    });
    refreshAuditLogs();
  };

  // Open delegation matrix modal
  const handleOpenDelegationModal = (p: ProposalRecord) => {
    setSelectedProposalForDelegate(p);
    setDelegateForm({
      delegatedDepartment: p.delegatedDepartment || 'Operations',
      delegatedOwner: p.delegatedOwner || 'Manish Rawat (VP - Ops)',
      delegationStatus: p.delegationStatus || 'Pending Action',
      delegationMilestone: p.delegationMilestone || 'Technical Feasibility & Cost Modeling',
      slaDaysRemaining: p.slaDaysRemaining !== undefined ? p.slaDaysRemaining : 2,
      delegationRemarks: p.delegationRemarks || '',
    });
  };

  // Apply delegation changes & log audit event
  const handleSaveDelegation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposalForDelegate) return;
    setIsDelegating(true);
    setDelegateError(null);

    try {
      const res = await proposalService.delegateProposal(selectedProposalForDelegate.id, orgId, delegateForm);
      if (res.success) {
        setProposals((prev) =>
          prev.map((item) =>
            item.id === selectedProposalForDelegate.id
              ? {
                  ...item,
                  delegatedDepartment: delegateForm.delegatedDepartment,
                  delegatedOwner: delegateForm.delegatedOwner,
                  delegationStatus: delegateForm.delegationStatus,
                  delegationMilestone: delegateForm.delegationMilestone,
                  slaDaysRemaining: Number(delegateForm.slaDaysRemaining) || 0,
                  delegationRemarks: delegateForm.delegationRemarks,
                }
              : item
          )
        );

        await logAuditEvent({
          organizationId: orgId,
          userId: authUser?.id,
          userName: profile?.full_name || currentUser.name || 'Devika Pangam',
          action: 'PROPOSAL_DELEGATED',
          entityType: 'proposals',
          entityId: selectedProposalForDelegate.id,
          oldValues: {
            delegatedDepartment: selectedProposalForDelegate.delegatedDepartment,
            delegatedOwner: selectedProposalForDelegate.delegatedOwner,
          },
          newValues: delegateForm,
          metadata: {
            proposalCode: selectedProposalForDelegate.proposalCode,
            department: delegateForm.delegatedDepartment,
            owner: delegateForm.delegatedOwner,
            slaDays: delegateForm.slaDaysRemaining,
          },
        });

        refreshAuditLogs();
        setSelectedProposalForDelegate(null);
      } else {
        setDelegateError(res.error || 'Failed to save delegation.');
      }
    } catch (err: any) {
      setDelegateError(err?.message || 'An unexpected error occurred.');
    } finally {
      setIsDelegating(false);
    }
  };

  // Handle New Proposal Version Creation & log audit event
  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setCreateError(null);

    try {
      if (!createForm.clientName.trim() || !createForm.opportunityTitle.trim()) {
        setCreateError('Client Name and Opportunity Title are required.');
        setIsSaving(false);
        return;
      }

      const totalVal = Number(createForm.monthlyRateINR) * Number(createForm.fleetSize) * 12;

      const res = await proposalService.createProposalVersion({
        organizationId: orgId,
        opportunityTitle: createForm.opportunityTitle,
        clientName: createForm.clientName,
        fleetSize: Number(createForm.fleetSize) || 10,
        vehicleType: createForm.vehicleType,
        monthlyRateINR: Number(createForm.monthlyRateINR) || 150000,
        totalCommercialValueINR: totalVal,
        marginPct: Number(createForm.marginPct) || 20,
        notes: createForm.notes,
        userId: authUser?.id,
        userName: profile?.full_name || currentUser.name || 'Devika Pangam',
        delegatedDepartment: createForm.delegatedDepartment,
        delegatedOwner: createForm.delegatedOwner,
      });

      if (res.success && res.proposal) {
        const newPropWithDelegation: ProposalRecord = {
          ...res.proposal,
          delegatedDepartment: createForm.delegatedDepartment,
          delegatedOwner: createForm.delegatedOwner,
          delegationStatus: 'Pending Action',
          delegationMilestone: 'Technical Feasibility & Pricing Sign-off',
          slaDaysRemaining: 3,
        };

        setProposals((prev) => [newPropWithDelegation, ...prev]);

        await logAuditEvent({
          organizationId: orgId,
          userId: authUser?.id,
          userName: profile?.full_name || currentUser.name || 'Devika Pangam',
          action: 'PROPOSAL_CREATED',
          entityType: 'proposals',
          entityId: res.proposal.id,
          newValues: newPropWithDelegation,
          metadata: {
            proposalCode: res.proposal.proposalCode,
            clientName: res.proposal.clientName,
            totalCommercialValueINR: totalVal,
            marginPct: createForm.marginPct,
          },
        });

        refreshAuditLogs();
        setShowCreateModal(false);
        // Reset form to defaults for next use
        setCreateForm({ ...DEFAULT_CREATE_FORM });
        setCreateError(null);
      } else {
        setCreateError(res.error || 'Failed to create proposal. Please try again.');
      }
    } catch (err: any) {
      setCreateError(err?.message || 'An unexpected error occurred while creating the proposal.');
    } finally {
      setIsSaving(false);
    }
  };

  // Department change helper for delegation form
  const handleDeptChange = (dept: string) => {
    let owner = 'Department Lead';
    let milestone = 'Review and execute delegated action';
    if (dept === 'Operations') {
      owner = 'Manish Rawat (VP - Ops)';
      milestone = 'Route survey & vehicle turnaround feasibility analysis';
    } else if (dept === 'Pricing & Commercials') {
      owner = 'Sunil Mehta (CFO)';
      milestone = 'Discount margin calculation & gross profit threshold approval';
    } else if (dept === 'Legal & Compliance') {
      owner = 'Adv. Preeti Chawla (Legal)';
      milestone = 'SLA terms, liability caps & indemnity clause clearance';
    } else if (dept === 'Fleet / Asset Management') {
      owner = 'Kishore Jha (Fleet Head)';
      milestone = 'Chassis allocation & OEM delivery schedule sign-off';
    } else if (dept === 'Management') {
      owner = 'Devika Pangam (COO/Admin)';
      milestone = 'Executive Board approval on strategic enterprise terms';
    }

    setDelegateForm({
      ...delegateForm,
      delegatedDepartment: dept,
      delegatedOwner: owner,
      delegationMilestone: milestone,
    });
  };

  // Filter audit logs
  const filteredAuditLogs = auditLogsList.filter((log) => {
    if (auditFilter === 'All') return true;
    return log.action === auditFilter;
  });

  return (
    <section style={{ display: 'flex', flexDirection: 'column', height: isFullscreen ? 'calc(100vh - 110px)' : 'calc(100vh - 165px)' }}>
      {/* Top Header & Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '12px',
          background: '#ffffff',
          padding: '12px 18px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)',
            }}
          >
            <Calculator size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '16.5px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Proposal Calculation &amp; Pricing Engine
              </h2>
              <span
                className="pill-badge"
                style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: 700, fontSize: '11px' }}
              >
                ⚡ Live Streamlit App
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
              Enterprise proposal formulas, rate cards, route costing &amp; commercial quotation calculator
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Create Proposal Button */}
          <button
            type="button"
            className="btn btn-primary btn-xs"
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              border: 'none',
            }}
          >
            <Plus size={13} />
            <span>+ Create Proposal Version</span>
          </button>

          {/* Toggle Governance Versions Table */}
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={() => setShowVersions(!showVersions)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              background: showVersions ? '#eff6ff' : '#ffffff',
              borderColor: showVersions ? '#3b82f6' : '#e2e8f0',
              color: showVersions ? '#1d4ed8' : '#334155',
            }}
          >
            <FileCheck2 size={13} />
            <span>Governance Versions ({proposals.length})</span>
          </button>

          {/* Toggle Audit Logs Panel */}
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={() => setShowAuditLogs(!showAuditLogs)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              background: showAuditLogs ? '#fef3c7' : '#ffffff',
              borderColor: showAuditLogs ? '#f59e0b' : '#e2e8f0',
              color: showAuditLogs ? '#b45309' : '#334155',
            }}
          >
            <ShieldCheck size={13} />
            <span>📜 Action Audit Logs ({auditLogsList.length})</span>
          </button>

          {/* Theme Mode Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f1f5f9',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              gap: '2px',
            }}
          >
            {(['light', 'dark'] as EmbedTheme[]).map((theme) => (
              <button
                key={theme}
                type="button"
                onClick={() => handleThemeChange(theme)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: themeMode === theme ? '#ffffff' : 'transparent',
                  color: themeMode === theme ? '#0f172a' : '#64748b',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: themeMode === theme ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {theme === 'light' ? 'Light' : 'Dark'}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={handleReload}
            title="Reload calculation engine"
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}
          >
            <RotateCcw size={12} />
            <span>Reload</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit full screen' : 'Expand full screen'}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}
          >
            {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            <span>{isFullscreen ? 'Normal' : 'Full Screen'}</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-xs"
            onClick={handleOpenExternal}
            style={{
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
            }}
          >
            <ExternalLink size={12} />
            <span>Open in New Tab</span>
          </button>
        </div>
      </div>

      {/* Version Governance Drawer */}
      {showVersions && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 18px',
            marginBottom: '12px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div>
              <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>
                Commercial Proposal Versions &amp; Governance Status (Separation of Duties Enforced)
              </strong>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Proposals versioned in PostgreSQL • Authors cannot self-approve • Multi-tier Departmental Delegation &amp; SLA Tracking
              </div>
            </div>
            <button
              type="button"
              className="btn btn-xs btn-secondary"
              onClick={() => setShowCreateModal(true)}
              style={{ fontWeight: 700, color: '#16a34a', borderColor: '#bbf7d0', background: '#f0fdf4' }}
            >
              <Plus size={12} />
              <span>New Proposal Version</span>
            </button>
          </div>

          <div className="table-responsive" style={{ maxHeight: '220px', overflowY: 'auto' }}>
            <table className="data-table" style={{ fontSize: '12px' }}>
              <thead>
                <tr>
                  <th>Proposal Code &amp; Version</th>
                  <th>Client &amp; Opportunity</th>
                  <th>Fleet Size &amp; Vehicle</th>
                  <th>Commercial Value (INR)</th>
                  <th>Governance Status</th>
                  <th>Departmental Delegation Matrix</th>
                  <th>Submitted / Approved By</th>
                  <th style={{ textAlign: 'right' }}>Actions (View / Download / Delegate / Approve)</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((p) => {
                  const badge = getStatusBadge(p.status);
                  return (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.proposalCode}</strong>
                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>{p.versionLabel}</div>
                      </td>
                      <td>
                        <div><strong>{p.clientName || 'General Proposal'}</strong></div>
                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>{p.opportunityTitle}</div>
                      </td>
                      <td>
                        {p.fleetSize} Buses • {p.vehicleType}
                      </td>
                      <td>
                        <strong>₹{(p.totalCommercialValueINR / 10000000).toFixed(2)} Cr</strong>
                        <div style={{ fontSize: '10.5px', color: '#16a34a' }}>{p.marginPct}% Margin</div>
                      </td>
                      <td>
                        <span
                          className="pill-badge"
                          style={{ background: badge.bg, color: badge.text, borderColor: badge.border, fontWeight: 700 }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '11.5px' }}>
                          {p.delegatedDepartment || 'Operations'}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                          Owner: {p.delegatedOwner || 'Manish Rawat (VP - Ops)'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: p.delegationStatus === 'Approved & Handed Off' ? '#dcfce7' : '#fffbeb',
                              color: p.delegationStatus === 'Approved & Handed Off' ? '#166534' : '#b45309',
                              fontWeight: 700,
                            }}
                          >
                            {p.delegationStatus || 'Pending Action'}
                          </span>
                          {p.slaDaysRemaining !== undefined && (
                            <span style={{ fontSize: '10px', color: '#64748b' }}>
                              ⏱️ SLA: {p.slaDaysRemaining}d left
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>By: <strong>{p.submittedByName || 'Author'}</strong></div>
                        {p.approvedByName ? (
                          <div style={{ fontSize: '10.5px', color: '#16a34a', fontWeight: 600 }}>
                            ✓ Approved: {p.approvedByName} ({p.approvedDate})
                          </div>
                        ) : (
                          <div style={{ fontSize: '10.5px', color: '#d97706' }}>Pending Approver</div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                          {/* VIEW PROPOSAL BUTTON */}
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => handleViewProposal(p)}
                            title="View Proposal Breakdown & Formula Specs"
                            style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#0284c7', padding: '3px 7px' }}
                          >
                            <Eye size={12} />
                            <span>View</span>
                          </button>

                          {/* DOWNLOAD PROPOSAL BUTTON */}
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => handleDownloadProposalSpec(p)}
                            title="Download Proposal Spec Sheet & Terms"
                            style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#16a34a', padding: '3px 7px' }}
                          >
                            <Download size={12} />
                            <span>Download</span>
                          </button>

                          {/* DELEGATE PROPOSAL BUTTON */}
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => handleOpenDelegationModal(p)}
                            title="Delegate to Department & Update SLA"
                            style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#d97706', padding: '3px 7px' }}
                          >
                            <GitPullRequest size={12} />
                            <span>Delegate</span>
                          </button>

                          {/* SIGN-OFF / APPROVE BUTTON */}
                          {p.status === 'under_review' || p.status === 'draft' ? (
                            <button
                              type="button"
                              className="btn btn-primary btn-xs"
                              onClick={() => openModal('approval', { type: 'proposal', item: p })}
                              style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', border: 'none', padding: '3px 7px' }}
                            >
                              <span>Sign-off</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: '10.5px', color: '#94a3b8', padding: '2px 4px' }}>Complete</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Audit Logs Drawer */}
      {showAuditLogs && (
        <div
          style={{
            background: '#0f172a',
            color: '#f8fafc',
            border: '1px solid #1e293b',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 18px',
            marginBottom: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} style={{ color: '#f59e0b' }} />
              <strong style={{ fontSize: '13.5px', color: '#f8fafc' }}>
                Proposal Governance Action Audit Trail &amp; Real-time Activity Logs
              </strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Action Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ListFilter size={13} style={{ color: '#94a3b8' }} />
                <select
                  value={auditFilter}
                  onChange={(e) => setAuditFilter(e.target.value)}
                  style={{
                    background: '#1e293b',
                    color: '#f8fafc',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    fontSize: '11px',
                    padding: '2px 6px',
                  }}
                >
                  <option value="All">All Audit Actions</option>
                  <option value="PROPOSAL_CREATED">PROPOSAL_CREATED</option>
                  <option value="PROPOSAL_VIEWED">PROPOSAL_VIEWED</option>
                  <option value="PROPOSAL_DOWNLOADED">PROPOSAL_DOWNLOADED</option>
                  <option value="PROPOSAL_DELEGATED">PROPOSAL_DELEGATED</option>
                  <option value="PROPOSAL_APPROVED">PROPOSAL_APPROVED</option>
                  <option value="PROPOSAL_REJECTED">PROPOSAL_REJECTED</option>
                </select>
              </div>

              <button
                type="button"
                onClick={refreshAuditLogs}
                style={{
                  background: '#1e293b',
                  color: '#38bdf8',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <RefreshCw size={11} className={isLoadingLogs ? 'animate-spin' : ''} />
                <span>Refresh Logs</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAuditLogs(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="table-responsive" style={{ maxHeight: '180px', overflowY: 'auto' }}>
            <table className="data-table" style={{ fontSize: '11px', color: '#cbd5e1' }}>
              <thead>
                <tr style={{ background: '#1e293b', color: '#94a3b8' }}>
                  <th>Timestamp</th>
                  <th>User / Actor</th>
                  <th>Action Event</th>
                  <th>Target Entity</th>
                  <th>Action Details / Metadata</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '16px', color: '#64748b' }}>
                      No proposal audit log records found for action filter: <strong>{auditFilter}</strong>
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((log) => {
                    const isProposalAction = log.action.startsWith('PROPOSAL_');
                    const badgeColor =
                      log.action === 'PROPOSAL_APPROVED'
                        ? '#22c55e'
                        : log.action === 'PROPOSAL_REJECTED'
                        ? '#ef4444'
                        : log.action === 'PROPOSAL_DELEGATED'
                        ? '#f59e0b'
                        : log.action === 'PROPOSAL_DOWNLOADED'
                        ? '#0ea5e9'
                        : log.action === 'PROPOSAL_VIEWED'
                        ? '#a855f7'
                        : '#3b82f6';

                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ whiteSpace: 'nowrap', color: '#94a3b8' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td>
                          <strong style={{ color: '#f8fafc' }}>{log.userName || 'System Admin'}</strong>
                        </td>
                        <td>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(255,255,255,0.1)',
                              color: badgeColor,
                              fontWeight: 700,
                              fontSize: '10.5px',
                              border: `1px solid ${badgeColor}`,
                            }}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td style={{ color: '#e2e8f0' }}>
                          {log.entityType} ({log.entityId})
                        </td>
                        <td style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                          {log.metadata
                            ? JSON.stringify(log.metadata)
                            : log.newValues
                            ? JSON.stringify(log.newValues)
                            : '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Embedded Iframe Container */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          background: themeMode === 'dark' ? '#0e1726' : '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
          minHeight: '600px',
        }}
      >
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: themeMode === 'dark' ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 5,
              pointerEvents: 'none',
              transition: 'opacity 0.3s ease',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                border: '3px solid #e2e8f0',
                borderTop: '3px solid #f59e0b',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                marginBottom: '10px',
              }}
            />
            <div style={{ fontSize: '13px', fontWeight: 700, color: themeMode === 'dark' ? '#f8fafc' : '#0f172a' }}>
              Calibrating High-Contrast Theme &amp; Formula Engine...
            </div>
            <div style={{ fontSize: '11.5px', color: themeMode === 'dark' ? '#94a3b8' : '#64748b', marginTop: '2px' }}>
              {currentUrl}
            </div>
          </div>
        )}

        <iframe
          key={`${iframeKey}-${themeMode}`}
          src={currentUrl}
          title="Proposal Calculation Formula App"
          onLoad={() => setIsLoading(false)}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
          }}
          allow="clipboard-read; clipboard-write; camera; microphone; geolocation"
        />
      </div>

      {/* CREATE PROPOSAL VERSION MODAL */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content-box" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-section" style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
              <div className="modal-header-title">
                <Plus size={18} style={{ color: '#16a34a' }} />
                <span style={{ color: '#166534' }}>Create New Commercial Proposal Version</span>
              </div>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProposal} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="modal-body-section">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Client Name *</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={createForm.clientName}
                      onChange={(e) => setCreateForm({ ...createForm, clientName: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Opportunity Title *</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={createForm.opportunityTitle}
                      onChange={(e) => setCreateForm({ ...createForm, opportunityTitle: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Fleet Size (Buses / Vehicles) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="form-control"
                      value={createForm.fleetSize}
                      onChange={(e) => setCreateForm({ ...createForm, fleetSize: Number(e.target.value) || 1 })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Vehicle Specification *</label>
                    <select
                      className="form-control"
                      value={createForm.vehicleType}
                      onChange={(e) => setCreateForm({ ...createForm, vehicleType: e.target.value })}
                    >
                      <option value="40 Seater – AC Executive Bus">40 Seater – AC Executive Bus</option>
                      <option value="50 Seater – Non-AC Staff Bus">50 Seater – Non-AC Staff Bus</option>
                      <option value="17 Seater Force Urbania Luxury">17 Seater Force Urbania Luxury</option>
                      <option value="13 Seater Tempo Traveller">13 Seater Tempo Traveller</option>
                      <option value="Electric AC Bus (9m Dedicated)">Electric AC Bus (9m Dedicated)</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Monthly Rate per Unit (INR) *</label>
                    <input
                      type="number"
                      required
                      className="form-control"
                      value={createForm.monthlyRateINR}
                      onChange={(e) => setCreateForm({ ...createForm, monthlyRateINR: Number(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Target Gross Margin (%) *</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      className="form-control"
                      value={createForm.marginPct}
                      onChange={(e) => setCreateForm({ ...createForm, marginPct: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Initial Delegated Review Department</label>
                    <select
                      className="form-control"
                      value={createForm.delegatedDepartment}
                      onChange={(e) => {
                        const dept = e.target.value;
                        let owner = 'Manish Rawat (VP - Ops)';
                        if (dept === 'Pricing & Commercials') owner = 'Sunil Mehta (CFO)';
                        if (dept === 'Legal & Compliance') owner = 'Adv. Preeti Chawla (Legal)';
                        if (dept === 'Fleet / Asset Management') owner = 'Kishore Jha (Fleet Head)';
                        if (dept === 'Management') owner = 'Devika Pangam (COO/Admin)';
                        setCreateForm({ ...createForm, delegatedDepartment: dept, delegatedOwner: owner });
                      }}
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Responsible Delegate Owner</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createForm.delegatedOwner}
                      onChange={(e) => setCreateForm({ ...createForm, delegatedOwner: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Commercial Terms &amp; Special Conditions</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={createForm.notes}
                    onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  />
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px', fontSize: '11.5px' }}>
                  Computed Total Annual Value: <strong>₹{((createForm.monthlyRateINR * createForm.fleetSize * 12) / 10000000).toFixed(2)} Cr</strong> (₹{(createForm.monthlyRateINR * createForm.fleetSize * 12).toLocaleString('en-IN')})
                </div>

                {createError && (
                  <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    marginTop: '10px',
                    color: '#991b1b',
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    ⚠️ {createError}
                  </div>
                )}
              </div>

              <div className="modal-footer-section">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowCreateModal(false); setCreateError(null); }} disabled={isSaving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={14} />
                  <span>{isSaving ? 'Creating...' : 'Create Proposal Version'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PROPOSAL BREAKDOWN MODAL */}
      {selectedProposalForView && (
        <div className="modal-overlay" onClick={() => setSelectedProposalForView(null)}>
          <div className="modal-content-box" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-section" style={{ background: '#f0f9ff', borderBottom: '1px solid #bae6fd' }}>
              <div className="modal-header-title">
                <FileText size={18} style={{ color: '#0284c7' }} />
                <span style={{ color: '#0369a1' }}>
                  Commercial Proposal Specification &amp; Calculation Specs ({selectedProposalForView.proposalCode})
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedProposalForView(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-section" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Proposal Header Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                  color: '#ffffff',
                  padding: '14px 18px',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800 }}>{selectedProposalForView.clientName}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{selectedProposalForView.opportunityTitle}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8' }}>
                    ₹{(selectedProposalForView.totalCommercialValueINR / 10000000).toFixed(2)} Cr
                  </div>
                  <span
                    style={{
                      fontSize: '10.5px',
                      background: '#16a34a',
                      color: '#ffffff',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 700,
                    }}
                  >
                    {selectedProposalForView.marginPct}% Gross Margin
                  </span>
                </div>
              </div>

              {/* Pricing Formula Breakdown */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 10px 0' }}>
                  📐 Pricing Formula &amp; Fleet Cost Structure
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Fleet Count:</span>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedProposalForView.fleetSize} Buses</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Vehicle Model:</span>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedProposalForView.vehicleType}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Monthly Unit Rate:</span>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>₹{selectedProposalForView.monthlyRateINR.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>

              {/* Governance & Delegation Status */}
              <div style={{ background: '#fffbeb', border: '1px solid #fef08a', borderRadius: '8px', padding: '14px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#92400e', margin: '0 0 10px 0' }}>
                  🛡️ Governance Status &amp; Departmental Delegation Matrix
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: '#78350f' }}>Governance Status:</span>
                    <div style={{ fontWeight: 700, color: '#92400e' }}>{selectedProposalForView.status.toUpperCase()}</div>
                  </div>
                  <div>
                    <span style={{ color: '#78350f' }}>Prepared By:</span>
                    <div style={{ fontWeight: 700, color: '#92400e' }}>{selectedProposalForView.submittedByName || 'Author'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#78350f' }}>Delegated Department:</span>
                    <div style={{ fontWeight: 700, color: '#92400e' }}>{selectedProposalForView.delegatedDepartment || 'Operations'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#78350f' }}>Responsible Delegate:</span>
                    <div style={{ fontWeight: 700, color: '#92400e' }}>{selectedProposalForView.delegatedOwner || 'Manish Rawat (VP - Ops)'}</div>
                  </div>
                </div>
                <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#78350f' }}>
                  <strong>Milestone Action:</strong> {selectedProposalForView.delegationMilestone || 'Technical Feasibility & Cost Modeling'}
                </div>
              </div>

              {/* Commercial Terms & Notes */}
              <div style={{ fontSize: '12px', color: '#334155' }}>
                <strong>Commercial Notes:</strong>
                <p style={{ margin: '4px 0 0 0', background: '#f1f5f9', padding: '8px 12px', borderRadius: '6px' }}>
                  {selectedProposalForView.notes || 'Standard 3-Year Master Transport SLA with Quarterly Diesel Fuel Escalation.'}
                </p>
              </div>
            </div>

            <div className="modal-footer-section">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleDownloadProposalSpec(selectedProposalForView)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a' }}
              >
                <Download size={14} />
                <span>Download Spec Sheet (.txt)</span>
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setSelectedProposalForView(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELEGATE PROPOSAL MODAL */}
      {selectedProposalForDelegate && (
        <div className="modal-overlay" onClick={() => setSelectedProposalForDelegate(null)}>
          <div className="modal-content-box" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-section" style={{ background: '#fffbeb', borderBottom: '1px solid #fef08a' }}>
              <div className="modal-header-title">
                <GitPullRequest size={18} style={{ color: '#d97706' }} />
                <span style={{ color: '#92400e' }}>
                  Update Departmental Delegation Matrix ({selectedProposalForDelegate.proposalCode})
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedProposalForDelegate(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDelegation} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="modal-body-section">
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{selectedProposalForDelegate.clientName}</div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Proposal: <strong>{selectedProposalForDelegate.proposalCode}</strong> • Commercial Value: <strong>₹{(selectedProposalForDelegate.totalCommercialValueINR / 10000000).toFixed(2)} Cr</strong>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Delegated Department *</label>
                    <select
                      className="form-control"
                      value={delegateForm.delegatedDepartment}
                      onChange={(e) => handleDeptChange(e.target.value)}
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Responsible Delegate Owner *</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={delegateForm.delegatedOwner}
                      onChange={(e) => setDelegateForm({ ...delegateForm, delegatedOwner: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Delegation Action Status</label>
                    <select
                      className="form-control"
                      value={delegateForm.delegationStatus}
                      onChange={(e) => setDelegateForm({ ...delegateForm, delegationStatus: e.target.value })}
                    >
                      <option value="Pending Action">⏳ Pending Action</option>
                      <option value="In Review">🔍 In Review</option>
                      <option value="Approved & Handed Off">✅ Approved &amp; Handed Off</option>
                      <option value="Action Completed">🎉 Action Completed</option>
                      <option value="Escalated">🚨 Escalated (Urgent)</option>
                      <option value="Rejected">❌ Rejected / Returned with Remarks</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Target SLA (Days Remaining)</label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      className="form-control"
                      value={delegateForm.slaDaysRemaining}
                      onChange={(e) => setDelegateForm({ ...delegateForm, slaDaysRemaining: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Milestone Action Deliverable *</label>
                  <textarea
                    required
                    className="form-control"
                    rows={2}
                    value={delegateForm.delegationMilestone}
                    onChange={(e) => setDelegateForm({ ...delegateForm, delegationMilestone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Delegation Remarks &amp; Conditions</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Add specific remarks for the department head..."
                    value={delegateForm.delegationRemarks}
                    onChange={(e) => setDelegateForm({ ...delegateForm, delegationRemarks: e.target.value })}
                  />
                </div>
              </div>

              {delegateError && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  margin: '0 24px 12px 24px',
                  color: '#991b1b',
                  fontSize: '12.5px',
                }}>
                  ⚠️ {delegateError}
                </div>
              )}

              <div className="modal-footer-section">
                <button type="button" className="btn btn-secondary" onClick={() => { setSelectedProposalForDelegate(null); setDelegateError(null); }} disabled={isDelegating}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isDelegating} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={14} />
                  <span>{isDelegating ? 'Saving...' : 'Apply Delegation Matrix'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
