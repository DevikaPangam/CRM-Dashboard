import React, { useState, useMemo, useEffect } from 'react';
import {
  User,
  TrendingUp,
  Target,
  Award,
  Building2,
  GitBranch,
  Calendar,
  Clock,
  FileText,
  Users,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Shield,
  Crown,
  ChevronRight,
  ArrowLeft,
  Edit3,
  PlusCircle,
  Check,
  Download,
  Lock,
  Sparkles,
  Layers,
  CheckCircle2,
  Filter,
  ArrowRight,
  History,
  Plus,
  BarChart3,
  PieChart,
  RefreshCw,
  AlertCircle,
  Eye
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../context/RBACContext';
import { formatCurrency, calculateTenure, getPerformanceStatus } from '../../utils/formatters';
import { EmployeeHistoryEvent, EmployeeEventType, KRAItem, PerformanceReviewItem, EmployeeKRA, EmployeeKPI, EmployeePerformanceReview } from '../../types/crm';
import { fetchEmployeeKRAs } from '../../services/kraKpiService';
import { fetchEmployeeReviewHistory } from '../../services/performanceReviewService';

type ProfileTabKey =
  | 'overview'
  | 'career'
  | 'kra'
  | 'performance'
  | 'clients'
  | 'opportunities'
  | 'activities'
  | 'followups'
  | 'documents'
  | 'team';

type CareerFilterCategory = 'all' | 'promotions' | 'transfers' | 'awards' | 'certifications';

export const EmployeeProfileTab: React.FC = () => {
  const {
    users,
    currentUser,
    selectedProfileUserId,
    setSelectedProfileUserId,
    setCurrentTab,
    clients,
    opportunities,
    activities,
    followups,
    documents,
    currency,
    openModal,
    completeFollowup,
    getEmployeeHistory
  } = useCRM();

  const { profile, authUser } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<ProfileTabKey>('overview');
  const [careerFilter, setCareerFilter] = useState<CareerFilterCategory>('all');

  // 1. Current Session User & RBAC Context
  const currentEmail = (profile?.email || authUser?.email || currentUser?.email || '').toLowerCase();
  const { isSuperAdmin, isOrgAdmin, isManagerOrAbove } = useRBAC();
  const isSuperAdminUser = isSuperAdmin;
  const isManagementUser = isOrgAdmin || isSuperAdmin;
  const isManagerUser = isManagerOrAbove;

  // 2. Resolve Active Target Employee Profile
  const activeEmployee = useMemo(() => {
    if (selectedProfileUserId) {
      const found = users.find(u => u.id === selectedProfileUserId || u.employee_id === selectedProfileUserId);
      if (found) return found;
    }
    const matchedCurrent = users.find(
      u => u.id === profile?.id || u.email.toLowerCase() === currentEmail
    );
    return matchedCurrent || currentUser || users[0];
  }, [selectedProfileUserId, users, profile?.id, currentEmail, currentUser]);

  const isOwnProfile =
    (profile?.id && activeEmployee.id === profile.id) ||
    (currentEmail && activeEmployee.email.toLowerCase() === currentEmail);

  const isDirectReport =
    activeEmployee.manager_id === profile?.id ||
    activeEmployee.manager_name?.toLowerCase() === (profile?.full_name || currentUser.name).toLowerCase();

  const canEditProfile = isSuperAdminUser || isManagementUser || (isManagerUser && isDirectReport);
  const canViewConfidential = isOwnProfile || isSuperAdminUser || isManagementUser || (isManagerUser && isDirectReport);

  // 3. Computed Aggregations for Target Employee
  const employeeClients = useMemo(() => {
    return clients.filter(
      c =>
        c.accountOwner?.toLowerCase() === activeEmployee.name.toLowerCase() ||
        c.accountOwner?.toLowerCase() === activeEmployee.email.toLowerCase()
    );
  }, [clients, activeEmployee]);

  const employeeOpps = useMemo(() => {
    return opportunities.filter(
      o =>
        o.owner?.toLowerCase() === activeEmployee.name.toLowerCase() ||
        o.owner?.toLowerCase() === activeEmployee.email.toLowerCase()
    );
  }, [opportunities, activeEmployee]);

  const activeDeals = useMemo(() => {
    return employeeOpps.filter(o => o.status === 'Open' || o.status === 'In Process');
  }, [employeeOpps]);

  const wonDeals = useMemo(() => {
    return employeeOpps.filter(o => o.status === 'Won' || o.stage === 'Closed Won');
  }, [employeeOpps]);

  const totalPipelineValue = useMemo(() => {
    return activeDeals.reduce((sum, o) => sum + (o.dealValueINR || 0), 0);
  }, [activeDeals]);

  const totalWonRevenue = useMemo(() => {
    return wonDeals.reduce((sum, o) => sum + (o.dealValueINR || 0), 0);
  }, [wonDeals]);

  const quotaTarget = activeEmployee.annual_target_inr || 30000000;
  const quotaAttainedPct = quotaTarget > 0 ? Math.round((totalWonRevenue / quotaTarget) * 100) : 0;
  const winRatePct = employeeOpps.length > 0 ? Math.round((wonDeals.length / employeeOpps.length) * 100) : 0;

  const employeeActivities = useMemo(() => {
    return activities.filter(
      a =>
        a.conductedBy?.toLowerCase() === activeEmployee.name.toLowerCase() ||
        a.conductedBy?.toLowerCase() === activeEmployee.email.toLowerCase()
    );
  }, [activities, activeEmployee]);

  const employeeFollowups = useMemo(() => {
    return followups.filter(
      f =>
        f.assignedTo?.toLowerCase() === activeEmployee.name.toLowerCase() ||
        f.assignedTo?.toLowerCase() === activeEmployee.email.toLowerCase()
    );
  }, [followups, activeEmployee]);

  const pendingFollowups = useMemo(() => {
    return employeeFollowups.filter(f => f.status !== 'Completed' && f.status !== 'Cancelled');
  }, [employeeFollowups]);

  const employeeDocuments = useMemo(() => {
    return documents.filter(
      d =>
        d.uploadedBy?.toLowerCase() === activeEmployee.name.toLowerCase() ||
        employeeOpps.some(o => o.id === d.opportunityId) ||
        employeeClients.some(c => c.id === d.clientId)
    );
  }, [documents, activeEmployee, employeeOpps, employeeClients]);

  const directReports = useMemo(() => {
    return users.filter(
      u =>
        (u.manager_id && u.manager_id === activeEmployee.id) ||
        (u.manager_name && u.manager_name.toLowerCase() === activeEmployee.name.toLowerCase()) ||
        (activeEmployee.is_regional_owner && u.region === activeEmployee.region && u.id !== activeEmployee.id)
    );
  }, [users, activeEmployee]);

  const teamPeers = useMemo(() => {
    return users.filter(
      u =>
        u.id !== activeEmployee.id &&
        ((activeEmployee.team_id && u.team_id === activeEmployee.team_id) ||
          (activeEmployee.region && u.region === activeEmployee.region))
    );
  }, [users, activeEmployee]);

  // 4. Load Live Historical Trajectory from Context/Database
  const rawHistory = useMemo(() => {
    return getEmployeeHistory(activeEmployee.id);
  }, [getEmployeeHistory, activeEmployee.id]);

  // Fallback demo milestones if history has only joining event
  const employeeHistoryList: EmployeeHistoryEvent[] = useMemo(() => {
    if (rawHistory.length > 1) {
      return rawHistory;
    }
    const joining = activeEmployee.joining_date || '2024-04-01';
    const initialEvents: EmployeeHistoryEvent[] = [
      {
        id: `seed-join-${activeEmployee.id}`,
        employee_id: activeEmployee.id,
        organization_id: activeEmployee.organization_id,
        event_type: 'joining',
        effective_date: joining,
        title: 'Joined Rajmudra Group',
        description: `Inducted into ${activeEmployee.department || 'Business Development'} department as BD Executive stationed at ${activeEmployee.location || 'Corporate HQ - Mumbai'}.`,
        designation_after: 'BD Executive',
        department_after: activeEmployee.department || 'Business Development',
        team_after: activeEmployee.team_name || 'Enterprise BD West',
        region_after: activeEmployee.region || 'West Region',
        location_after: activeEmployee.location || 'Corporate HQ - Mumbai',
        created_by_name: 'HR Onboarding Team'
      },
      {
        id: `seed-promo-1-${activeEmployee.id}`,
        employee_id: activeEmployee.id,
        organization_id: activeEmployee.organization_id,
        event_type: 'promotion',
        effective_date: '2025-04-01',
        title: `Promoted to ${activeEmployee.designation || 'Senior BD Executive'}`,
        description: 'Advanced grade following 118% annual quota attainment, excellent client retention, and pipeline leadership.',
        designation_before: 'BD Executive',
        designation_after: activeEmployee.designation || 'Senior BD Executive',
        team_before: activeEmployee.team_name || 'Enterprise BD West',
        team_after: activeEmployee.team_name || 'Enterprise BD West',
        created_by_name: 'Management Review Board'
      }
    ];

    if (activeEmployee.is_regional_owner) {
      initialEvents.push({
        id: `seed-owner-1-${activeEmployee.id}`,
        employee_id: activeEmployee.id,
        organization_id: activeEmployee.organization_id,
        event_type: 'responsibility_change',
        effective_date: '2025-08-15',
        title: `Designated as Regional Territory Owner - ${activeEmployee.region || 'West Region'}`,
        description: `Entrusted with end-to-end commercial command, fleet quota governance, and revenue pipeline leadership across ${activeEmployee.region || 'West Region'}.`,
        region_before: 'West Sub-Territory',
        region_after: activeEmployee.region || 'West Region',
        created_by_name: 'Board of Directors'
      });
    }

    // Merge with any real recorded events
    const existingIds = new Set(rawHistory.map(h => h.id));
    const combined = [...rawHistory, ...initialEvents.filter(e => !existingIds.has(e.id))];
    return combined.sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime());
  }, [rawHistory, activeEmployee]);

  // Filtered Career Events
  const filteredCareerEvents = useMemo(() => {
    if (careerFilter === 'promotions') {
      return employeeHistoryList.filter(e => e.event_type === 'promotion' || e.event_type === 'designation_change');
    }
    if (careerFilter === 'transfers') {
      return employeeHistoryList.filter(e =>
        ['department_change', 'team_change', 'region_change', 'manager_change', 'location_change', 'responsibility_change'].includes(e.event_type)
      );
    }
    if (careerFilter === 'awards') {
      return employeeHistoryList.filter(e => e.event_type === 'achievement' || e.event_type === 'award');
    }
    if (careerFilter === 'certifications') {
      return employeeHistoryList.filter(e => e.event_type === 'training' || e.event_type === 'certification');
    }
    return employeeHistoryList;
  }, [employeeHistoryList, careerFilter]);

  // Dynamic KRA & KPI State across all 6 departments
  const [selectedFY, setSelectedFY] = useState<string>('FY2026-27');
  const [selectedReviewPeriod, setSelectedReviewPeriod] = useState<string>('Annual FY26-27');
  const [selectedKRAFilter, setSelectedKRAFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [employeeKRAs, setEmployeeKRAs] = useState<EmployeeKRA[]>([]);
  const [loadingKRAs, setLoadingKRAs] = useState<boolean>(false);

  const canManageKPIs = isSuperAdminUser || isManagementUser || (isManagerUser && isDirectReport);

  const refreshKRAs = React.useCallback(() => {
    if (activeEmployee) {
      setLoadingKRAs(true);
      fetchEmployeeKRAs(activeEmployee, selectedFY, selectedReviewPeriod).then((kras) => {
        setEmployeeKRAs(kras);
        setLoadingKRAs(false);
      });
    }
  }, [activeEmployee, selectedFY, selectedReviewPeriod]);

  useEffect(() => {
    let isMounted = true;
    if (activeEmployee) {
      setLoadingKRAs(true);
      fetchEmployeeKRAs(activeEmployee, selectedFY, selectedReviewPeriod).then((kras) => {
        if (isMounted) {
          setEmployeeKRAs(kras);
          setLoadingKRAs(false);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [activeEmployee, selectedFY, selectedReviewPeriod]);

  // All flattened KPIs for global aggregation
  const allEmployeeKPIs = useMemo(() => {
    return employeeKRAs.flatMap((k) => k.kpis || []);
  }, [employeeKRAs]);

  const overallKRAScore = useMemo(() => {
    if (!employeeKRAs || employeeKRAs.length === 0) return 0;
    const totalWeightedScore = employeeKRAs.reduce((sum, k) => sum + k.score_pct * k.weightage_pct, 0);
    const totalWeight = employeeKRAs.reduce((sum, k) => sum + k.weightage_pct, 0);
    return totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
  }, [employeeKRAs]);

  const overallKPIAchievement = useMemo(() => {
    if (allEmployeeKPIs.length === 0) return 0;
    const sumAttained = allEmployeeKPIs.reduce((acc, curr) => acc + curr.achievement_pct, 0);
    return Math.round(sumAttained / allEmployeeKPIs.length);
  }, [allEmployeeKPIs]);

  const kraPerformanceStatus = useMemo(() => {
    if (overallKRAScore >= 95) return { label: 'Exceeding Targets', color: '#166534', bg: '#dcfce7', border: '#86efac' };
    if (overallKRAScore >= 75) return { label: 'On Track', color: '#0369a1', bg: '#e0f2fe', border: '#7dd3fc' };
    if (overallKRAScore >= 60) return { label: 'Needs Improvement', color: '#b45309', bg: '#fef3c7', border: '#fde68a' };
    return { label: 'At Risk', color: '#991b1b', bg: '#fee2e2', border: '#fca5a5' };
  }, [overallKRAScore]);

  // Filtered KRAs and KPIs based on filters
  const filteredKRAs = useMemo(() => {
    return employeeKRAs
      .filter((kra) => {
        if (selectedKRAFilter !== 'all' && kra.id !== selectedKRAFilter && kra.name !== selectedKRAFilter) {
          return false;
        }
        if (selectedStatusFilter !== 'all') {
          const matchesKRAStatus = kra.status === selectedStatusFilter;
          const hasMatchingKPI = kra.kpis?.some((p) => p.status === selectedStatusFilter);
          return matchesKRAStatus || hasMatchingKPI;
        }
        return true;
      })
      .map((kra) => {
        if (selectedStatusFilter === 'all') return kra;
        return {
          ...kra,
          kpis: kra.kpis?.filter((p) => p.status === selectedStatusFilter) || []
        };
      });
  }, [employeeKRAs, selectedKRAFilter, selectedStatusFilter]);

  const [employeeReviews, setEmployeeReviews] = useState<EmployeePerformanceReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);
  const [reviewFYFilter, setReviewFYFilter] = useState<string>('all');
  const [reviewPeriodFilter, setReviewPeriodFilter] = useState<string>('all');

  useEffect(() => {
    let isMounted = true;
    if (activeEmployee) {
      setLoadingReviews(true);
      fetchEmployeeReviewHistory(activeEmployee.id, activeEmployee.email, activeEmployee.department).then((revs) => {
        if (isMounted) {
          setEmployeeReviews(revs);
          setLoadingReviews(false);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [activeEmployee]);

  const filteredEmployeeReviews = useMemo(() => {
    return employeeReviews.filter((r) => {
      if (reviewFYFilter !== 'all' && r.financial_year !== reviewFYFilter) return false;
      if (reviewPeriodFilter !== 'all' && r.review_period !== reviewPeriodFilter) return false;
      return true;
    });
  }, [employeeReviews, reviewFYFilter, reviewPeriodFilter]);

  const perfStatus = getPerformanceStatus(totalWonRevenue, quotaTarget);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarBg = (emp: typeof activeEmployee) => {
    if (emp.avatar_bg) return emp.avatar_bg;
    const colors = ['#0284c7', '#0d9488', '#7c3aed', '#d97706', '#e11d48', '#2563eb'];
    let hash = 0;
    for (let i = 0; i < emp.name.length; i++) {
      hash = emp.name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getEventBadgeStyle = (type: EmployeeEventType) => {
    switch (type) {
      case 'joining':
        return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd', label: '🚀 Joining' };
      case 'promotion':
        return { bg: '#dcfce7', text: '#166534', border: '#86efac', label: '👑 Promotion' };
      case 'designation_change':
        return { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', label: '💼 Title Change' };
      case 'department_change':
        return { bg: '#ede9fe', text: '#6b21a8', border: '#ddd6fe', label: '🏢 Department Transfer' };
      case 'team_change':
        return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', label: '👥 Team Transfer' };
      case 'region_change':
        return { bg: '#fef3c7', text: '#b45309', border: '#fde68a', label: '🗺️ Region Transfer' };
      case 'manager_change':
        return { bg: '#fae8ff', text: '#86198f', border: '#f5d0fe', label: '👔 Manager Reassignment' };
      case 'location_change':
        return { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1', label: '📍 Relocation' };
      case 'responsibility_change':
        return { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa', label: '⚡ Ownership Change' };
      case 'achievement':
        return { bg: '#fef9c3', text: '#854d0e', border: '#fef08a', label: '🏆 Achievement' };
      case 'award':
        return { bg: '#fdf4ff', text: '#a21caf', border: '#f0abfc', label: '⭐ Excellence Award' };
      case 'training':
        return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', label: '🎓 Training' };
      case 'certification':
        return { bg: '#e0e7ff', text: '#4338ca', border: '#c7d2fe', label: '📜 Certification' };
      default:
        return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0', label: '📌 Milestone' };
    }
  };

  return (
    <div className="tab-content" style={{ padding: '0 0 40px 0' }}>
      {/* 1. Header Command Bar & Breadcrumbs */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '12px',
          padding: '20px 24px',
          color: '#ffffff',
          marginBottom: '20px',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Navigation Breadcrumb & Quick Switcher */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '18px',
            paddingBottom: '14px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94a3b8' }}>
            <button
              onClick={() => setCurrentTab('tab-team')}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: 0,
                fontWeight: 600
              }}
            >
              <ArrowLeft size={13} /> Back to BD Team
            </button>
            <span>/</span>
            <span>Organization Roster</span>
            <span>/</span>
            <span style={{ color: '#f8fafc', fontWeight: 600 }}>{activeEmployee.name}</span>
            {activeEmployee.employee_id && (
              <span
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'monospace'
                }}
              >
                {activeEmployee.employee_id}
              </span>
            )}
          </div>

          {/* Quick Employee Switcher (For Admins & Managers) */}
          {(isSuperAdminUser || isManagementUser || isManagerUser) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#cbd5e1' }}>Viewing Employee:</span>
              <select
                value={activeEmployee.id}
                onChange={(e) => {
                  setSelectedProfileUserId(e.target.value);
                  setActiveSubTab('overview');
                }}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#f8fafc',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {users.map(u => (
                  <option key={u.id} value={u.id} style={{ background: '#1e293b', color: '#f8fafc' }}>
                    {u.name} ({u.employee_id || 'ID N/A'}) - {u.designation || u.role} {u.is_regional_owner ? '👑' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Profile Hero Section */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
            {/* Avatar with Status indicator */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: getAvatarBg(activeEmployee),
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 800,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  border: '3px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                {getInitials(activeEmployee.name)}
              </div>
              {activeEmployee.is_regional_owner && (
                <div
                  title="Regional Territory Owner"
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-4px',
                    background: '#f59e0b',
                    color: '#ffffff',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    border: '2px solid #0f172a'
                  }}
                >
                  <Crown size={13} />
                </div>
              )}
            </div>

            {/* Core Info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                  {activeEmployee.name}
                </h2>
                <span
                  style={{
                    background:
                      activeEmployee.status === 'Active'
                        ? 'rgba(16, 185, 129, 0.2)'
                        : activeEmployee.status === 'Disabled'
                        ? 'rgba(239, 68, 68, 0.2)'
                        : 'rgba(148, 163, 184, 0.2)',
                    color:
                      activeEmployee.status === 'Active'
                        ? '#34d399'
                        : activeEmployee.status === 'Disabled'
                        ? '#f87171'
                        : '#cbd5e1',
                    border: `1px solid ${
                      activeEmployee.status === 'Active' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.15)'
                    }`,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 700
                  }}
                >
                  ● {activeEmployee.status || 'Active'}
                </span>

                {activeEmployee.is_regional_owner && (
                  <span
                    style={{
                      background: 'rgba(245, 158, 11, 0.2)',
                      color: '#fbbf24',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    👑 Regional Owner ({activeEmployee.region || 'Territory'})
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', color: '#cbd5e1', fontSize: '13px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, color: '#38bdf8' }}>{activeEmployee.designation || 'Business Development Executive'}</span>
                <span>•</span>
                <span>{activeEmployee.department || 'Business Development'}</span>
                <span>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} style={{ color: '#94a3b8' }} />
                  {activeEmployee.location || 'Corporate HQ - Mumbai'} ({activeEmployee.region || 'West Region'})
                </span>
                <span>•</span>
                <span style={{ color: '#e2e8f0', fontWeight: 600 }}>
                  Tenure: {calculateTenure(activeEmployee.joining_date)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => openModal('addActivity', { conductedBy: activeEmployee.name })}
              className="btn btn-sm"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Calendar size={14} /> Log Activity
            </button>

            <button
              onClick={() => openModal('addOpportunity', { owner: activeEmployee.name })}
              className="btn btn-sm"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <GitBranch size={14} /> Add Deal
            </button>

            {canEditProfile && (
              <button
                onClick={() => openModal('editUser', activeEmployee)}
                className="btn btn-sm btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)'
                }}
              >
                <Edit3 size={14} /> Edit Profile &amp; Role
              </button>
            )}
          </div>
        </div>

        {/* Live Quick KPI Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px 14px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Active Pipeline</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
              {formatCurrency(totalPipelineValue, currency)}
              <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 500, marginLeft: '6px' }}>
                ({activeDeals.length} deals)
              </span>
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px 14px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Won Revenue YTD</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#4ade80', marginTop: '2px' }}>
              {formatCurrency(totalWonRevenue, currency)}
              <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 500, marginLeft: '6px' }}>
                ({quotaAttainedPct}% Quota)
              </span>
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px 14px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Managed Accounts</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
              {employeeClients.length} Enterprise Clients
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px 14px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Win Rate &amp; SLA</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>
              {winRatePct}% Win Rate
              <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 500, marginLeft: '6px' }}>
                ({pendingFollowups.length} Open Tasks)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Responsive 10-Tab Navigation Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '6px',
          marginBottom: '20px',
          borderBottom: '1px solid #e2e8f0',
          scrollbarWidth: 'thin'
        }}
      >
        {[
          { key: 'overview', label: 'Overview', icon: <User size={15} /> },
          { key: 'career', label: 'Career Trajectory', icon: <TrendingUp size={15} />, badge: filteredCareerEvents.length },
          { key: 'kra', label: 'KRA & KPI', icon: <Target size={15} /> },
          { key: 'performance', label: 'Performance', icon: <Award size={15} /> },
          { key: 'clients', label: 'Clients', icon: <Building2 size={15} />, badge: employeeClients.length },
          { key: 'opportunities', label: 'Opportunities', icon: <GitBranch size={15} />, badge: employeeOpps.length },
          { key: 'activities', label: 'Activities', icon: <Calendar size={15} />, badge: employeeActivities.length },
          { key: 'followups', label: 'Follow-ups', icon: <Clock size={15} />, badge: pendingFollowups.length },
          { key: 'documents', label: 'Documents', icon: <FileText size={15} />, badge: employeeDocuments.length },
          { key: 'team', label: 'Team', icon: <Users size={15} />, badge: directReports.length > 0 ? directReports.length : teamPeers.length }
        ].map((tab) => {
          const isActive = activeSubTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key as ProfileTabKey)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: isActive ? 700 : 500,
                border: isActive ? '1px solid #0284c7' : '1px solid transparent',
                background: isActive ? '#f0f9ff' : 'transparent',
                color: isActive ? '#0284c7' : '#64748b',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  style={{
                    background: isActive ? '#0284c7' : '#e2e8f0',
                    color: isActive ? '#ffffff' : '#475569',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '10px'
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Tab Content Panels */}

      {/* TAB 1: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {/* Card 1: Identity & Employment Profile */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={16} style={{ color: '#0284c7' }} /> Employment Profile &amp; Credentials
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Employee ID</span>
                <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>{activeEmployee.employee_id || 'EMP-N/A'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Corporate Email</span>
                <span style={{ fontWeight: 600, color: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Mail size={13} /> {activeEmployee.email}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Phone Number</span>
                <span style={{ fontWeight: 600, color: '#0f172a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={13} /> {activeEmployee.phone || '+91 98200 12345'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Employment Type</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{activeEmployee.employment_type || 'Full-time Permanent'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Joining Date</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{activeEmployee.joining_date || '2024-04-01'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Calculated Tenure</span>
                <span style={{ fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                  {calculateTenure(activeEmployee.joining_date)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Base Location</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{activeEmployee.location || 'Corporate HQ - Mumbai'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Account Status</span>
                <span style={{ fontWeight: 700, color: activeEmployee.status === 'Active' ? '#16a34a' : '#dc2626' }}>
                  {activeEmployee.status || 'Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Organizational Matrix & Reporting Line */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={16} style={{ color: '#8b5cf6' }} /> Organizational Matrix &amp; Governance
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Department</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                  {activeEmployee.department || 'Business Development'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Assigned Region</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0284c7', marginTop: '2px' }}>
                    {activeEmployee.region || 'West Region'}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Assigned Team</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {activeEmployee.team_name || 'Enterprise BD West'}
                  </div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Reporting Manager</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    {activeEmployee.manager_name || 'Devika Pangam (Director)'}
                  </span>
                  {activeEmployee.manager_id && (
                    <button
                      onClick={() => setSelectedProfileUserId(activeEmployee.manager_id || null)}
                      className="btn btn-xs btn-secondary"
                      style={{ fontSize: '11px' }}
                    >
                      View Manager
                    </button>
                  )}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>System Role &amp; RBAC Tier</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{activeEmployee.role}</span>
                  <span style={{ fontSize: '11px', background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontFamily: 'monospace' }}>
                    {activeEmployee.role_name || 'bd_exec'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Annual Quota & Target Matrix */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={16} style={{ color: '#16a34a' }} /> Annual Revenue Quota &amp; Attainment
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Annual Quota (FY 2026-27)</span>
                <span style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>
                  {formatCurrency(quotaTarget, currency)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Won Revenue Achieved</span>
                <span style={{ fontWeight: 800, fontSize: '15px', color: '#16a34a' }}>
                  {formatCurrency(totalWonRevenue, currency)}
                </span>
              </div>

              {/* Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, color: '#475569' }}>Progress to Quota</span>
                  <span style={{ fontWeight: 700, color: perfStatus.badgeText }}>{quotaAttainedPct}% ({perfStatus.status})</span>
                </div>
                <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(quotaAttainedPct, 100)}%`,
                      height: '100%',
                      background: perfStatus.badgeBg,
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Deals Won</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a' }}>{wonDeals.length}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Active Pipeline</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0284c7' }}>{activeDeals.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CAREER TRAJECTORY */}
      {activeSubTab === 'career' && (
        <div className="card" style={{ padding: '24px' }}>
          {/* Header & Filter Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} style={{ color: '#0284c7' }} /> Chronological Career Trajectory &amp; Historical States
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                Complete verifiable timeline beginning from induction date ({activeEmployee.joining_date || '2024-04-01'}).
              </p>
            </div>

            {canEditProfile && (
              <button
                onClick={() => openModal('addCareerEvent', { employee: activeEmployee })}
                className="btn btn-sm btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <PlusCircle size={14} /> Add Career Event
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginRight: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={13} /> Filter:
            </span>
            {[
              { id: 'all', label: 'All Milestones' },
              { id: 'promotions', label: '👑 Promotions & Titles' },
              { id: 'transfers', label: '🗺️ Hierarchy & Transfers' },
              { id: 'awards', label: '🏆 Awards & Recognition' },
              { id: 'certifications', label: '📜 Certifications & Training' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setCareerFilter(f.id as CareerFilterCategory)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: careerFilter === f.id ? 700 : 500,
                  background: careerFilter === f.id ? '#0284c7' : '#f1f5f9',
                  color: careerFilter === f.id ? '#ffffff' : '#475569',
                  border: '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Chronological Timeline Container */}
          <div style={{ position: 'relative', paddingLeft: '36px', margin: '10px 0' }}>
            {/* Continuous Vertical Timeline Line */}
            <div
              style={{
                position: 'absolute',
                left: '13px',
                top: '12px',
                bottom: '12px',
                width: '2px',
                background: 'linear-gradient(to bottom, #0284c7, #cbd5e1)'
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {filteredCareerEvents.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  No career events found matching selected filter.
                </div>
              ) : (
                filteredCareerEvents.map((item, index) => {
                  const isLatest = index === 0;
                  const badge = getEventBadgeStyle(item.event_type);

                  return (
                    <div key={item.id} style={{ position: 'relative' }}>
                      {/* Timeline Node Icon */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '-36px',
                          top: '6px',
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: isLatest ? '#0284c7' : '#ffffff',
                          color: isLatest ? '#ffffff' : '#0284c7',
                          border: isLatest ? '3px solid #bae6fd' : '3px solid #94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                          zIndex: 2
                        }}
                      >
                        <Check size={12} />
                      </div>

                      {/* Event Card */}
                      <div
                        style={{
                          background: isLatest ? '#f8fafc' : '#ffffff',
                          border: isLatest ? '1px solid #bae6fd' : '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '18px 20px',
                          boxShadow: isLatest ? '0 2px 8px rgba(2, 132, 199, 0.08)' : '0 1px 3px rgba(0,0,0,0.04)'
                        }}
                      >
                        {/* Event Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              <span
                                style={{
                                  background: badge.bg,
                                  color: badge.text,
                                  border: `1px solid ${badge.border}`,
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '2px 9px',
                                  borderRadius: '6px'
                                }}
                              >
                                {badge.label}
                              </span>
                              <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 700 }}>
                                {item.effective_date}
                              </span>
                              {isLatest && (
                                <span style={{ background: '#dcfce7', color: '#166534', fontSize: '10px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px' }}>
                                  LATEST RECORD
                                </span>
                              )}
                            </div>

                            <h4 style={{ margin: '8px 0 4px 0', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                              {item.title}
                            </h4>
                          </div>

                          {item.created_by_name && (
                            <span style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px' }}>
                              Logged by: <strong>{item.created_by_name}</strong>
                            </span>
                          )}
                        </div>

                        {/* Event Description */}
                        {item.description && (
                          <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                            {item.description}
                          </p>
                        )}

                        {/* Structured Transitions Display */}
                        {item.designation_after && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginTop: '12px',
                              background: '#f8fafc',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid #f1f5f9',
                              fontSize: '12px',
                              flexWrap: 'wrap'
                            }}
                          >
                            <span style={{ color: '#64748b', fontWeight: 600 }}>Designation:</span>
                            {item.designation_before && (
                              <>
                                <span style={{ background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '4px' }}>
                                  {item.designation_before}
                                </span>
                                <ArrowRight size={13} style={{ color: '#94a3b8' }} />
                              </>
                            )}
                            <span style={{ background: '#dcfce7', color: '#15803d', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                              {item.designation_after}
                            </span>
                          </div>
                        )}

                        {item.department_after && item.department_before && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginTop: '8px',
                              background: '#f8fafc',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid #f1f5f9',
                              fontSize: '12px',
                              flexWrap: 'wrap'
                            }}
                          >
                            <span style={{ color: '#64748b', fontWeight: 600 }}>Department:</span>
                            <span style={{ background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '4px' }}>
                              {item.department_before}
                            </span>
                            <ArrowRight size={13} style={{ color: '#94a3b8' }} />
                            <span style={{ background: '#ede9fe', color: '#6b21a8', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                              {item.department_after}
                            </span>
                          </div>
                        )}

                        {item.team_after && item.team_before && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginTop: '8px',
                              background: '#f8fafc',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid #f1f5f9',
                              fontSize: '12px',
                              flexWrap: 'wrap'
                            }}
                          >
                            <span style={{ color: '#64748b', fontWeight: 600 }}>Team:</span>
                            <span style={{ background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '4px' }}>
                              {item.team_before}
                            </span>
                            <ArrowRight size={13} style={{ color: '#94a3b8' }} />
                            <span style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                              {item.team_after}
                            </span>
                          </div>
                        )}

                        {item.region_after && item.region_before && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginTop: '8px',
                              background: '#f8fafc',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid #f1f5f9',
                              fontSize: '12px',
                              flexWrap: 'wrap'
                            }}
                          >
                            <span style={{ color: '#64748b', fontWeight: 600 }}>Territory / Region:</span>
                            <span style={{ background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '4px' }}>
                              {item.region_before}
                            </span>
                            <ArrowRight size={13} style={{ color: '#94a3b8' }} />
                            <span style={{ background: '#fef3c7', color: '#b45309', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                              {item.region_after}
                            </span>
                          </div>
                        )}

                        {item.manager_after && item.manager_before && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginTop: '8px',
                              background: '#f8fafc',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid #f1f5f9',
                              fontSize: '12px',
                              flexWrap: 'wrap'
                            }}
                          >
                            <span style={{ color: '#64748b', fontWeight: 600 }}>Reporting Manager:</span>
                            <span style={{ background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '4px' }}>
                              {item.manager_before}
                            </span>
                            <ArrowRight size={13} style={{ color: '#94a3b8' }} />
                            <span style={{ background: '#fae8ff', color: '#86198f', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                              {item.manager_after}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KRA & KPI */}
      {activeSubTab === 'kra' && (
        <div>
          {!canViewConfidential ? (
            <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
              <Lock size={32} style={{ color: '#94a3b8', margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Confidential KRA &amp; KPI Matrix</h3>
              <p style={{ color: '#64748b', fontSize: '13px', maxWidth: '480px', margin: '6px auto 0 auto' }}>
                Key Result Area scores and individual KPI metrics are confidential and accessible only to the employee, their reporting manager, and executive management.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 1. Department Awareness Context Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        background: '#0284c7',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        letterSpacing: '0.04em'
                      }}
                    >
                      Department Awareness
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                      {activeEmployee.department || 'Business Development'}
                    </span>
                    <span style={{ color: '#64748b' }}>•</span>
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                      Designation: <strong style={{ color: '#38bdf8' }}>{activeEmployee.designation || 'Specialist'}</strong>
                    </span>
                    <span style={{ color: '#64748b' }}>•</span>
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                      Team: <strong style={{ color: '#cbd5e1' }}>{activeEmployee.team_name || 'Enterprise Squad'}</strong>
                    </span>
                    <span style={{ color: '#64748b' }}>•</span>
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                      Role: <strong style={{ color: '#cbd5e1' }}>{activeEmployee.role_name || activeEmployee.role || 'Team Member'}</strong>
                    </span>
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '12px', color: '#94a3b8' }}>
                    🎯 Active KPI framework is department-specific ({activeEmployee.department || 'Business Development'}). Metrics reflect actual role responsibilities and custom scoring algorithms.
                  </div>
                </div>

                {/* Top Quick Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {canManageKPIs && (
                    <>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        onClick={() =>
                          openModal('addKRA', {
                            employee: activeEmployee,
                            defaultFY: selectedFY,
                            defaultReviewPeriod: selectedReviewPeriod,
                            onSaved: refreshKRAs
                          })
                        }
                      >
                        <Plus size={13} /> Add KRA
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        onClick={() =>
                          openModal('addKPI', {
                            employee: activeEmployee,
                            kras: employeeKRAs,
                            defaultFY: selectedFY,
                            defaultReviewPeriod: selectedReviewPeriod,
                            onSaved: refreshKRAs
                          })
                        }
                      >
                        <Plus size={13} /> Add KPI
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ background: 'rgba(255,255,255,0.08)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.15)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    onClick={() =>
                      openModal('kraHistory', {
                        employee: activeEmployee,
                        title: `${activeEmployee.name} - KRA & KPI Audit History`
                      })
                    }
                  >
                    <History size={13} /> View History
                  </button>
                </div>
              </div>

              {/* 2. SUMMARY CARDS (4 Essential Metrics) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '14px'
                }}
              >
                {/* 1. Overall KRA Achievement */}
                <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Overall KRA Achievement
                    </span>
                    <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '6px', borderRadius: '6px' }}>
                      <Target size={16} />
                    </div>
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
                      {overallKRAScore}%
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      Weighted average across {employeeKRAs.length} active KRAs
                    </div>
                  </div>
                  <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(overallKRAScore, 100)}%`, height: '100%', background: overallKRAScore >= 85 ? '#10b981' : overallKRAScore >= 65 ? '#0284c7' : '#f59e0b' }} />
                  </div>
                </div>

                {/* 2. Overall KPI Achievement */}
                <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Overall KPI Achievement
                    </span>
                    <div style={{ background: '#dcfce7', color: '#16a34a', padding: '6px', borderRadius: '6px' }}>
                      <TrendingUp size={16} />
                    </div>
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
                      {overallKPIAchievement}%
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      Calculated across {allEmployeeKPIs.length} operational indicators
                    </div>
                  </div>
                  <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(overallKPIAchievement, 100)}%`, height: '100%', background: overallKPIAchievement >= 90 ? '#10b981' : overallKPIAchievement >= 70 ? '#0284c7' : '#f59e0b' }} />
                  </div>
                </div>

                {/* 3. Weighted Score */}
                <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Weighted Score
                    </span>
                    <div style={{ background: '#fae8ff', color: '#a21caf', padding: '6px', borderRadius: '6px' }}>
                      <Award size={16} />
                    </div>
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
                      {overallKRAScore} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>/ 100</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      Total points awarded from weightage distribution
                    </div>
                  </div>
                  <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(overallKRAScore, 100)}%`, height: '100%', background: '#a855f7' }} />
                  </div>
                </div>

                {/* 4. Performance Status */}
                <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Performance Status
                    </span>
                    <div style={{ background: kraPerformanceStatus.bg, color: kraPerformanceStatus.color, padding: '6px', borderRadius: '6px' }}>
                      <CheckCircle2 size={16} />
                    </div>
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <span
                      style={{
                        background: kraPerformanceStatus.bg,
                        color: kraPerformanceStatus.color,
                        border: `1px solid ${kraPerformanceStatus.border}`,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '13.5px',
                        fontWeight: 800,
                        display: 'inline-block'
                      }}
                    >
                      ● {kraPerformanceStatus.label}
                    </span>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                      Review Period: {selectedReviewPeriod} ({selectedFY})
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. FILTERS BAR */}
              <div
                className="card"
                style={{
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  background: '#f8fafc'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                  <Filter size={15} style={{ color: '#0284c7' }} />
                  <span>KRA &amp; KPI Filters:</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {/* Filter 1: Financial Year */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>FY:</span>
                    <select
                      className="form-control"
                      style={{ padding: '5px 10px', fontSize: '12.5px', width: 'auto' }}
                      value={selectedFY}
                      onChange={(e) => setSelectedFY(e.target.value)}
                    >
                      <option value="FY2026-27">FY 2026-27 (Current)</option>
                      <option value="FY2025-26">FY 2025-26 (Past Year)</option>
                      <option value="FY2024-25">FY 2024-25</option>
                    </select>
                  </div>

                  {/* Filter 2: Review Period */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Period:</span>
                    <select
                      className="form-control"
                      style={{ padding: '5px 10px', fontSize: '12.5px', width: 'auto' }}
                      value={selectedReviewPeriod}
                      onChange={(e) => setSelectedReviewPeriod(e.target.value)}
                    >
                      <option value="Annual FY26-27">Annual Appraisal</option>
                      <option value="Q1">Q1 (Apr - Jun)</option>
                      <option value="Q2">Q2 (Jul - Sep)</option>
                      <option value="Q3">Q3 (Oct - Dec)</option>
                      <option value="Q4">Q4 (Jan - Mar)</option>
                      <option value="H1">H1 (First Half)</option>
                      <option value="H2">H2 (Second Half)</option>
                    </select>
                  </div>

                  {/* Filter 3: KRA */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>KRA:</span>
                    <select
                      className="form-control"
                      style={{ padding: '5px 10px', fontSize: '12.5px', width: 'auto', maxWidth: '200px' }}
                      value={selectedKRAFilter}
                      onChange={(e) => setSelectedKRAFilter(e.target.value)}
                    >
                      <option value="all">All KRAs ({employeeKRAs.length})</option>
                      {employeeKRAs.map((kra) => (
                        <option key={kra.id} value={kra.id}>
                          {kra.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter 4: Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Status:</span>
                    <select
                      className="form-control"
                      style={{ padding: '5px 10px', fontSize: '12.5px', width: 'auto' }}
                      value={selectedStatusFilter}
                      onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="Exceeded">Exceeded Targets</option>
                      <option value="On Track">On Track</option>
                      <option value="Needs Improvement">Needs Improvement</option>
                      <option value="At Risk">At Risk</option>
                    </select>
                  </div>

                  {/* Reset Filters */}
                  {(selectedKRAFilter !== 'all' || selectedStatusFilter !== 'all') && (
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      style={{ padding: '5px 10px', fontSize: '12px' }}
                      onClick={() => {
                        setSelectedKRAFilter('all');
                        setSelectedStatusFilter('all');
                      }}
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* 4. KRA & KPI TABLE / SCORECARD VIEW */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '15.5px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                      Key Result Areas &amp; Performance Indicators
                    </h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                      Showing {filteredKRAs.length} of {employeeKRAs.length} KRAs for {selectedReviewPeriod} ({selectedFY})
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    onClick={refreshKRAs}
                  >
                    <RefreshCw size={13} className={loadingKRAs ? 'spin' : ''} /> Refresh
                  </button>
                </div>

                {loadingKRAs ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <RefreshCw size={24} className="spin" style={{ margin: '0 auto 8px auto', color: '#0284c7' }} />
                    <div>Loading department KRA scorecard...</div>
                  </div>
                ) : filteredKRAs.length === 0 ? (
                  <div style={{ padding: '36px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                    <Target size={28} style={{ color: '#94a3b8', margin: '0 auto 8px auto' }} />
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>No KRA/KPI records match the selected filters</div>
                    <p style={{ fontSize: '12.5px', color: '#64748b', margin: '4px 0 12px 0' }}>
                      Try adjusting the filter criteria or create a new KRA / KPI for this period.
                    </p>
                    {canManageKPIs && (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() =>
                            openModal('addKRA', {
                              employee: activeEmployee,
                              defaultFY: selectedFY,
                              defaultReviewPeriod: selectedReviewPeriod,
                              onSaved: refreshKRAs
                            })
                          }
                        >
                          <Plus size={13} /> Add KRA
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {filteredKRAs.map((kra) => (
                      <div
                        key={kra.id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                      >
                        {/* KRA Header Bar */}
                        <div
                          style={{
                            background: '#f8fafc',
                            padding: '14px 18px',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            flexWrap: 'wrap',
                            gap: '12px'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: '260px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ background: '#e2e8f0', color: '#334155', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                                {kra.category}
                              </span>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7' }}>
                                Weightage: {kra.weightage_pct}%
                              </span>
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                FY: {kra.financial_year || selectedFY} • {kra.review_period || selectedReviewPeriod}
                              </span>
                            </div>
                            <h4 style={{ margin: '2px 0 4px 0', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                              {kra.name}
                            </h4>
                            <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>{kra.description}</p>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'right' }}>
                            <div>
                              <span
                                style={{
                                  background:
                                    kra.status === 'Exceeded'
                                      ? '#dcfce7'
                                      : kra.status === 'On Track'
                                      ? '#e0f2fe'
                                      : kra.status === 'Needs Improvement'
                                      ? '#fef3c7'
                                      : '#fee2e2',
                                  color:
                                    kra.status === 'Exceeded'
                                      ? '#166534'
                                      : kra.status === 'On Track'
                                      ? '#0369a1'
                                      : kra.status === 'Needs Improvement'
                                      ? '#b45309'
                                      : '#991b1b',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  display: 'inline-block'
                                }}
                              >
                                ● {kra.status}
                              </span>
                              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginTop: '3px' }}>
                                KRA Score: {kra.score_pct}%
                              </div>
                            </div>

                            {/* Quick Add KPI to KRA & History */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {canManageKPIs && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-secondary"
                                  style={{ padding: '4px 8px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  title="Add KPI to this KRA"
                                  onClick={() =>
                                    openModal('addKPI', {
                                      employee: activeEmployee,
                                      kras: employeeKRAs,
                                      selectedKRAId: kra.id,
                                      defaultFY: selectedFY,
                                      defaultReviewPeriod: selectedReviewPeriod,
                                      onSaved: refreshKRAs
                                    })
                                  }
                                >
                                  <Plus size={12} /> Add KPI
                                </button>
                              )}

                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                title="View KRA Revision Trail"
                                onClick={() =>
                                  openModal('kraHistory', {
                                    employee: activeEmployee,
                                    kraId: kra.id,
                                    title: `KRA History - ${kra.name}`
                                  })
                                }
                              >
                                <History size={12} /> History
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* KRA Score Bar */}
                        <div style={{ width: '100%', height: '4px', background: '#e2e8f0', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(kra.score_pct, 100)}%`,
                              height: '100%',
                              background: kra.score_pct >= 85 ? '#10b981' : kra.score_pct >= 50 ? '#0284c7' : '#f59e0b'
                            }}
                          />
                        </div>

                        {/* Underlying KPIs Table */}
                        {kra.kpis && kra.kpis.length > 0 ? (
                          <div style={{ padding: '0', overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                              <thead>
                                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                                  <th style={{ padding: '8px 14px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>KPI Indicator</th>
                                  <th style={{ padding: '8px 10px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', textAlign: 'center' }}>Target</th>
                                  <th style={{ padding: '8px 10px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', textAlign: 'center' }}>Actual</th>
                                  <th style={{ padding: '8px 10px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', textAlign: 'center' }}>Attainment %</th>
                                  <th style={{ padding: '8px 10px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', textAlign: 'center' }}>Weightage</th>
                                  <th style={{ padding: '8px 10px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', textAlign: 'center' }}>Score</th>
                                  <th style={{ padding: '8px 10px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', textAlign: 'center' }}>Status</th>
                                  <th style={{ padding: '8px 14px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {kra.kpis.map((kpi, idx) => (
                                  <tr
                                    key={kpi.id}
                                    style={{
                                      borderBottom: idx < (kra.kpis?.length ?? 0) - 1 ? '1px solid #f1f5f9' : 'none',
                                      background: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                                    }}
                                  >
                                    {/* KPI Name & Description */}
                                    <td style={{ padding: '12px 14px', verticalAlign: 'top', minWidth: '220px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{kpi.name}</span>
                                        <span
                                          style={{
                                            fontSize: '9.5px',
                                            fontWeight: 700,
                                            padding: '1px 5px',
                                            borderRadius: '3px',
                                            background: kpi.kpi_type === 'lower_is_better' ? '#fef3c7' : '#e0f2fe',
                                            color: kpi.kpi_type === 'lower_is_better' ? '#92400e' : '#0369a1'
                                          }}
                                        >
                                          {kpi.kpi_type === 'lower_is_better' ? '▼ Lower is Better' : kpi.kpi_type === 'target_range' ? '⇄ Range' : kpi.kpi_type === 'boolean_completion' ? '✓ Milestone' : '▲ Higher is Better'}
                                        </span>
                                      </div>
                                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                                        {kpi.description}
                                      </div>

                                      {/* Comments Preview */}
                                      {(kpi.manager_comment || kpi.employee_comment) && (
                                        <div style={{ marginTop: '6px', fontSize: '11px', background: '#f8fafc', padding: '5px 8px', borderRadius: '4px', borderLeft: '3px solid #0284c7' }}>
                                          {kpi.manager_comment && (
                                            <div style={{ color: '#0369a1' }}>
                                              <strong>Manager:</strong> {kpi.manager_comment}
                                            </div>
                                          )}
                                          {kpi.employee_comment && (
                                            <div style={{ color: '#166534', marginTop: '2px' }}>
                                              <strong>Self:</strong> {kpi.employee_comment}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </td>

                                    {/* Target */}
                                    <td style={{ padding: '12px 10px', verticalAlign: 'middle', textAlign: 'center' }}>
                                      <span style={{ fontWeight: 700, color: '#334155' }}>
                                        {kpi.target_display || `${kpi.target_value} ${kpi.unit}`}
                                      </span>
                                    </td>

                                    {/* Actual */}
                                    <td style={{ padding: '12px 10px', verticalAlign: 'middle', textAlign: 'center' }}>
                                      <span style={{ fontWeight: 700, color: '#059669' }}>
                                        {kpi.actual_display || `${kpi.actual_value} ${kpi.unit}`}
                                      </span>
                                    </td>

                                    {/* Attainment % */}
                                    <td style={{ padding: '12px 10px', verticalAlign: 'middle', textAlign: 'center' }}>
                                      <span style={{ fontWeight: 800, color: '#0284c7', fontSize: '13px' }}>
                                        {kpi.achievement_pct}%
                                      </span>
                                    </td>

                                    {/* Weightage */}
                                    <td style={{ padding: '12px 10px', verticalAlign: 'middle', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                                      {kpi.weightage_pct}%
                                    </td>

                                    {/* Score */}
                                    <td style={{ padding: '12px 10px', verticalAlign: 'middle', textAlign: 'center' }}>
                                      <span style={{ fontWeight: 700, color: '#0f172a' }}>
                                        {kpi.score}
                                      </span>
                                      <span style={{ fontSize: '10.5px', color: '#94a3b8' }}> / {kpi.weightage_pct}</span>
                                    </td>

                                    {/* Status */}
                                    <td style={{ padding: '12px 10px', verticalAlign: 'middle', textAlign: 'center' }}>
                                      <span
                                        style={{
                                          background:
                                            kpi.status === 'Exceeded'
                                              ? '#dcfce7'
                                              : kpi.status === 'On Track'
                                              ? '#e0f2fe'
                                              : kpi.status === 'Needs Improvement'
                                              ? '#fef3c7'
                                              : '#fee2e2',
                                          color:
                                            kpi.status === 'Exceeded'
                                              ? '#166534'
                                              : kpi.status === 'On Track'
                                              ? '#0369a1'
                                              : kpi.status === 'Needs Improvement'
                                              ? '#b45309'
                                              : '#991b1b',
                                          fontSize: '10.5px',
                                          fontWeight: 700,
                                          padding: '2px 6px',
                                          borderRadius: '4px',
                                          display: 'inline-block'
                                        }}
                                      >
                                        ● {kpi.status}
                                      </span>
                                    </td>

                                    {/* Row Actions */}
                                    <td style={{ padding: '12px 14px', verticalAlign: 'middle', textAlign: 'right' }}>
                                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        <button
                                          type="button"
                                          className="btn btn-secondary"
                                          style={{ padding: '3px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                          title="Update actuals and comments"
                                          onClick={() => {
                                            openModal('editKPI', {
                                              kpi,
                                              onSaved: (updated: EmployeeKPI) => {
                                                setEmployeeKRAs((prev) =>
                                                  prev.map((k) => ({
                                                    ...k,
                                                    kpis: k.kpis?.map((p) => (p.id === updated.id ? updated : p))
                                                  }))
                                                );
                                              }
                                            });
                                          }}
                                        >
                                          <Edit3 size={11} /> Edit
                                        </button>

                                        <button
                                          type="button"
                                          className="btn btn-secondary"
                                          style={{ padding: '3px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                          title="View metric revision audit history"
                                          onClick={() =>
                                            openModal('kraHistory', {
                                              employee: activeEmployee,
                                              kpiId: kpi.id,
                                              title: `KPI Audit History - ${kpi.name}`
                                            })
                                          }
                                        >
                                          <History size={11} /> History
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div style={{ padding: '16px 20px', fontSize: '12.5px', color: '#64748b', background: '#ffffff', textAlign: 'center' }}>
                            No KPIs recorded under this KRA for the selected status.
                            {canManageKPIs && (
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                style={{ marginLeft: '10px', fontSize: '11.5px' }}
                                onClick={() =>
                                  openModal('addKPI', {
                                    employee: activeEmployee,
                                    kras: employeeKRAs,
                                    selectedKRAId: kra.id,
                                    defaultFY: selectedFY,
                                    defaultReviewPeriod: selectedReviewPeriod,
                                    onSaved: refreshKRAs
                                  })
                                }
                              >
                                + Add KPI to {kra.name}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PERFORMANCE */}
      {activeSubTab === 'performance' && (
        <div>
          {!canViewConfidential ? (
            <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
              <Lock size={32} style={{ color: '#94a3b8', margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Confidential Performance Data</h3>
              <p style={{ color: '#64748b', fontSize: '13px', maxWidth: '480px', margin: '6px auto 0 auto' }}>
                Appraisal reviews and individual performance evaluations are restricted to the employee, their reporting manager, and executive management.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Header & Filter Command Bar */}
              <div
                className="card"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '14px',
                  background: '#f8fafc'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '15.5px', fontWeight: 700, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={18} style={{ color: '#0284c7' }} />
                    <span>Formal Performance Appraisals &amp; Review History ({filteredEmployeeReviews.length})</span>
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                    Historical evaluation cycles across {activeEmployee.department || 'Business Development'} department.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {/* FY Filter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>FY:</span>
                    <select
                      className="form-control"
                      style={{ padding: '5px 10px', fontSize: '12.5px', width: 'auto' }}
                      value={reviewFYFilter}
                      onChange={(e) => setReviewFYFilter(e.target.value)}
                    >
                      <option value="all">All Financial Years</option>
                      <option value="FY2026-27">FY 2026-27 (Current)</option>
                      <option value="FY2025-26">FY 2025-26 (Past Year)</option>
                      <option value="FY2024-25">FY 2024-25</option>
                    </select>
                  </div>

                  {/* Period Filter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Period:</span>
                    <select
                      className="form-control"
                      style={{ padding: '5px 10px', fontSize: '12.5px', width: 'auto' }}
                      value={reviewPeriodFilter}
                      onChange={(e) => setReviewPeriodFilter(e.target.value)}
                    >
                      <option value="all">All Review Periods</option>
                      <option value="Annual Appraisal">Annual Appraisal</option>
                      <option value="Annual FY25-26">Annual FY25-26</option>
                      <option value="Q1 (Apr - Jun)">Q1 (Apr - Jun)</option>
                      <option value="Q2 (Jul - Sep)">Q2 (Jul - Sep)</option>
                      <option value="Q3 (Oct - Dec)">Q3 (Oct - Dec)</option>
                      <option value="Q4 (Jan - Mar)">Q4 (Jan - Mar)</option>
                    </select>
                  </div>

                  {canManageKPIs && (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      onClick={() =>
                        openModal('addPerformanceReview', {
                          employee: activeEmployee,
                          defaultFY: selectedFY,
                          defaultReviewPeriod: selectedReviewPeriod,
                          kraScore: overallKRAScore,
                          kpiScore: overallKPIAchievement,
                          onSaved: (newRev: EmployeePerformanceReview) => {
                            setEmployeeReviews((prev) => [newRev, ...prev]);
                          }
                        })
                      }
                    >
                      <Plus size={13} /> Conduct Appraisal
                    </button>
                  )}
                </div>
              </div>

              {/* Reviews List */}
              {loadingReviews ? (
                <div className="card" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <RefreshCw size={24} className="spin" style={{ margin: '0 auto 8px auto', color: '#0284c7' }} />
                  <div>Loading performance evaluations...</div>
                </div>
              ) : filteredEmployeeReviews.length === 0 ? (
                <div className="card" style={{ padding: '36px', textAlign: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                  <Award size={28} style={{ color: '#94a3b8', margin: '0 auto 8px auto' }} />
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>No formal appraisals recorded for the selected filter</div>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: '4px 0 12px 0' }}>
                    Formal appraisal reviews preserve historical evaluations and rate weighted KRA/KPI performance.
                  </p>
                  {canManageKPIs && (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() =>
                        openModal('addPerformanceReview', {
                          employee: activeEmployee,
                          defaultFY: selectedFY,
                          defaultReviewPeriod: selectedReviewPeriod,
                          kraScore: overallKRAScore,
                          kpiScore: overallKPIAchievement,
                          onSaved: (newRev: EmployeePerformanceReview) => {
                            setEmployeeReviews((prev) => [newRev, ...prev]);
                          }
                        })
                      }
                    >
                      <Plus size={13} /> Log First Appraisal
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filteredEmployeeReviews.map((rev) => (
                    <div
                      key={rev.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '18px 20px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}
                    >
                      {/* Top Review Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                              {rev.review_period} ({rev.financial_year})
                            </span>
                            <span
                              style={{
                                background:
                                  rev.performance_status === 'Exceeding Targets'
                                    ? '#dcfce7'
                                    : rev.performance_status === 'On Track'
                                    ? '#e0f2fe'
                                    : rev.performance_status === 'Needs Improvement'
                                    ? '#fef3c7'
                                    : '#fee2e2',
                                color:
                                  rev.performance_status === 'Exceeding Targets'
                                    ? '#166534'
                                    : rev.performance_status === 'On Track'
                                    ? '#0369a1'
                                    : rev.performance_status === 'Needs Improvement'
                                    ? '#b45309'
                                    : '#991b1b',
                                fontSize: '11px',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '12px'
                              }}
                            >
                              ● {rev.performance_status}
                            </span>
                            <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                              {rev.status || 'Finalized'}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                            Department: <strong>{rev.department}</strong> • Designation at Review: <strong>{rev.designation}</strong> • Reviewed on {rev.review_date} by <strong>{rev.reviewer_name}</strong> ({rev.reviewer_role})
                          </div>
                        </div>

                        {/* Ratings & Score Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '6px', textAlign: 'center' }}>
                            <div style={{ fontSize: '17px', fontWeight: 800, color: rev.overall_score >= 85 ? '#059669' : '#0284c7' }}>
                              {rev.overall_score} <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>/100</span>
                            </div>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Overall Score</div>
                          </div>

                          <div style={{ background: '#fef9c3', border: '1px solid #fef08a', color: '#854d0e', padding: '6px 12px', borderRadius: '6px', textAlign: 'center' }}>
                            <div style={{ fontSize: '17px', fontWeight: 800 }}>⭐ {rev.manager_rating?.toFixed(1)}</div>
                            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Manager Rating</div>
                          </div>
                        </div>
                      </div>

                      {/* Metric Attainment Sub-strip */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                          gap: '10px',
                          background: '#f8fafc',
                          padding: '10px 14px',
                          borderRadius: '6px',
                          marginTop: '14px',
                          border: '1px solid #f1f5f9'
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>KRA Achievement:</span>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#0284c7', marginLeft: '6px' }}>
                            {rev.kra_achievement_pct}%
                          </span>
                        </div>

                        <div>
                          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>KPI Achievement:</span>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#10b981', marginLeft: '6px' }}>
                            {rev.kpi_achievement_pct}%
                          </span>
                        </div>

                        <div>
                          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Evaluation Status:</span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginLeft: '6px' }}>
                            {rev.performance_status}
                          </span>
                        </div>
                      </div>

                      {/* Qualitative Strengths & Improvement */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginTop: '14px' }}>
                        <div style={{ background: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>Key Strengths &amp; Milestones</div>
                          <div style={{ fontSize: '12.5px', color: '#334155', marginTop: '4px', lineHeight: 1.4 }}>{rev.key_strengths}</div>
                        </div>

                        <div style={{ background: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#d97706', textTransform: 'uppercase' }}>Areas of Improvement</div>
                          <div style={{ fontSize: '12.5px', color: '#334155', marginTop: '4px', lineHeight: 1.4 }}>{rev.areas_of_improvement}</div>
                        </div>
                      </div>

                      {/* Goals & Remarks */}
                      <div style={{ marginTop: '10px', background: '#eff6ff', padding: '10px 14px', borderRadius: '6px', border: '1px solid #dbeafe', fontSize: '12.5px', color: '#1e40af' }}>
                        <strong>Goals for Next Cycle:</strong> {rev.goals_for_next_period}
                      </div>

                      {rev.manager_remarks && (
                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b', fontStyle: 'italic', paddingLeft: '4px' }}>
                          “{rev.manager_remarks}”
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CLIENTS */}
      {activeSubTab === 'clients' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Managed Corporate Accounts ({employeeClients.length})
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                Enterprise clients where {activeEmployee.name} is the designated Account Owner.
              </p>
            </div>
            <button
              onClick={() => openModal('addClient', { accountOwner: activeEmployee.name })}
              className="btn btn-sm btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <PlusCircle size={14} /> Add Client Account
            </button>
          </div>

          {employeeClients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#64748b', fontSize: '13px' }}>
              No client accounts currently assigned to this employee.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client Code</th>
                    <th>Company Name</th>
                    <th>Segment / Industry</th>
                    <th>Tier</th>
                    <th>Region / City</th>
                    <th>Fleets</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeClients.map((client) => (
                    <tr key={client.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{client.code}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{client.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{client.contacts?.[0]?.name || 'Primary Contact'}</div>
                      </td>
                      <td>
                        <div>{client.segment}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{client.industry}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '11px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          {client.tier}
                        </span>
                      </td>
                      <td>{client.city}, {client.region}</td>
                      <td style={{ fontWeight: 700, color: '#0284c7' }}>
                        {client.deployedFleets?.length || 0} contracts
                      </td>
                      <td>
                        <span style={{ color: client.status === 'Active' ? '#16a34a' : '#64748b', fontWeight: 700 }}>
                          ● {client.status}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => openModal('viewClient', client)}
                          className="btn btn-xs btn-secondary"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: OPPORTUNITIES */}
      {activeSubTab === 'opportunities' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Pipeline Deals &amp; Opportunities ({employeeOpps.length})
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                Active and won commercial agreements owned by {activeEmployee.name}.
              </p>
            </div>
            <button
              onClick={() => openModal('addOpportunity', { owner: activeEmployee.name })}
              className="btn btn-sm btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <PlusCircle size={14} /> New Opportunity
            </button>
          </div>

          {employeeOpps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#64748b', fontSize: '13px' }}>
              No deals or opportunities currently registered under this employee.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Deal Code</th>
                    <th>Opportunity Title</th>
                    <th>Client Name</th>
                    <th>Segment</th>
                    <th>Deal Value</th>
                    <th>Stage</th>
                    <th>Probability</th>
                    <th>Expected Close</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeOpps.map((opp) => (
                    <tr key={opp.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{opp.code}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{opp.title}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{opp.serviceCategory}</div>
                      </td>
                      <td>{opp.clientName}</td>
                      <td>{opp.segment}</td>
                      <td style={{ fontWeight: 800, color: '#0f172a' }}>
                        {formatCurrency(opp.dealValueINR, currency)}
                      </td>
                      <td>
                        <span style={{ fontSize: '11px', background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          {opp.stage}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: opp.probability >= 70 ? '#16a34a' : '#d97706' }}>
                        {opp.probability}%
                      </td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>{opp.expectedCloseDate}</td>
                      <td>
                        <span
                          style={{
                            color: opp.status === 'Won' ? '#16a34a' : opp.status === 'Lost' ? '#dc2626' : '#0284c7',
                            fontWeight: 700
                          }}
                        >
                          ● {opp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: ACTIVITIES */}
      {activeSubTab === 'activities' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Client Interactions &amp; Logged Activities ({employeeActivities.length})
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                Meetings, phone calls, demos, and site visits conducted by {activeEmployee.name}.
              </p>
            </div>
            <button
              onClick={() => openModal('addActivity', { conductedBy: activeEmployee.name })}
              className="btn btn-sm btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <PlusCircle size={14} /> Log Interaction
            </button>
          </div>

          {employeeActivities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#64748b', fontSize: '13px' }}>
              No activities logged by this employee yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {employeeActivities.map((act) => (
                <div
                  key={act.id}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '14px 18px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                          {act.type}
                        </span>
                        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{act.clientName}</span>
                        {act.contactPerson && (
                          <span style={{ fontSize: '12px', color: '#64748b' }}>with {act.contactPerson}</span>
                        )}
                      </div>
                      <p style={{ margin: '8px 0 4px 0', fontSize: '13px', color: '#334155' }}>
                        <strong>Discussion:</strong> {act.keyDiscussion}
                      </p>
                      {act.outcome && (
                        <p style={{ margin: 0, fontSize: '12px', color: '#059669' }}>
                          <strong>Outcome:</strong> {act.outcome}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '12px', color: '#64748b' }}>
                      <span style={{ fontWeight: 600 }}>{act.date}</span>
                      {act.status && (
                        <div style={{ marginTop: '4px', fontWeight: 700, color: act.status === 'Completed' ? '#16a34a' : '#d97706' }}>
                          ● {act.status}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 8: FOLLOW-UPS */}
      {activeSubTab === 'followups' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Follow-ups &amp; Action Tasks ({employeeFollowups.length})
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                Commercial action items and follow-ups assigned to {activeEmployee.name}.
              </p>
            </div>
            <button
              onClick={() => openModal('addFollowup', { assignedTo: activeEmployee.name })}
              className="btn btn-sm btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <PlusCircle size={14} /> Add Follow-up Task
            </button>
          </div>

          {employeeFollowups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#64748b', fontSize: '13px' }}>
              No pending follow-ups for this employee.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {employeeFollowups.map((fol) => {
                const isOverdue = fol.status !== 'Completed' && new Date(fol.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);
                return (
                  <div
                    key={fol.id}
                    style={{
                      background: fol.status === 'Completed' ? '#f8fafc' : isOverdue ? '#fff1f2' : '#f8fafc',
                      border: `1px solid ${fol.status === 'Completed' ? '#e2e8f0' : isOverdue ? '#fecdd3' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <button
                        onClick={() => completeFollowup(fol.id)}
                        disabled={fol.status === 'Completed'}
                        style={{
                          background: fol.status === 'Completed' ? '#16a34a' : '#ffffff',
                          color: '#ffffff',
                          border: `2px solid ${fol.status === 'Completed' ? '#16a34a' : '#cbd5e1'}`,
                          borderRadius: '50%',
                          width: '22px',
                          height: '22px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: fol.status === 'Completed' ? 'default' : 'pointer',
                          marginTop: '2px'
                        }}
                      >
                        {fol.status === 'Completed' && <Check size={14} />}
                      </button>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{fol.clientName}</span>
                          <span
                            style={{
                              background:
                                fol.priority === 'High'
                                  ? '#fee2e2'
                                  : fol.priority === 'Medium'
                                  ? '#fef3c7'
                                  : '#f1f5f9',
                              color:
                                fol.priority === 'High'
                                  ? '#dc2626'
                                  : fol.priority === 'Medium'
                                  ? '#b45309'
                                  : '#475569',
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '4px'
                            }}
                          >
                            {fol.priority}
                          </span>
                        </div>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#475569' }}>{fol.description}</p>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: isOverdue ? '#dc2626' : '#0f172a' }}>
                        Due: {fol.dueDate} {isOverdue && '(OVERDUE)'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Type: {fol.type}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 9: DOCUMENTS */}
      {activeSubTab === 'documents' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Employment &amp; CRM Stage Documents ({employeeDocuments.length})
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                Client contracts, stage documents, offer letters, and territory appointment collateral.
              </p>
            </div>
            <button
              onClick={() => openModal('addDocument', { uploadedBy: activeEmployee.name })}
              className="btn btn-sm btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <PlusCircle size={14} /> Upload Document
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {/* Standard HR Documents */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={24} style={{ color: '#0284c7' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>Employment Offer &amp; Agreement</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>PDF • Signed on {activeEmployee.joining_date || '2024-04-01'}</div>
                </div>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-xs btn-secondary" onClick={() => alert('Downloading official employment agreement...')}>
                  <Download size={12} /> Download
                </button>
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield size={24} style={{ color: '#8b5cf6' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>Corporate NDA &amp; Code of Conduct</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>PDF • Verified Active</div>
                </div>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-xs btn-secondary" onClick={() => alert('Downloading signed NDA...')}>
                  <Download size={12} /> Download
                </button>
              </div>
            </div>

            {activeEmployee.is_regional_owner && (
              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Crown size={24} style={{ color: '#d97706' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#92400e' }}>Regional Owner Authorization Letter</div>
                    <div style={{ fontSize: '11px', color: '#b45309' }}>PDF • {activeEmployee.region} Command</div>
                  </div>
                </div>
                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-xs btn-secondary" onClick={() => alert('Downloading regional appointment letter...')}>
                    <Download size={12} /> Download
                  </button>
                </div>
              </div>
            )}

            {employeeDocuments.map((doc) => (
              <div key={doc.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={24} style={{ color: '#ec4899' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{doc.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{doc.documentType} • {doc.fileSize}</div>
                  </div>
                </div>
                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-xs btn-secondary" onClick={() => alert(`Downloading ${doc.name}...`)}>
                    <Download size={12} /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 10: TEAM */}
      {activeSubTab === 'team' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* If Manager or Regional Owner: Display Direct Reports Roster */}
          {directReports.length > 0 && (
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} style={{ color: '#0284c7' }} /> Direct Reports &amp; Territory Team Roster ({directReports.length})
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
                Executives reporting directly to {activeEmployee.name}.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                {directReports.map((member) => (
                  <div
                    key={member.id}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: getAvatarBg(member),
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '14px'
                        }}
                      >
                        {getInitials(member.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{member.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{member.designation || member.role}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{member.employee_id} • {member.region}</div>
                      </div>
                    </div>

                    <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: member.status === 'Active' ? '#16a34a' : '#94a3b8' }}>
                        ● {member.status || 'Active'}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedProfileUserId(member.id);
                          setActiveSubTab('overview');
                        }}
                        className="btn btn-xs btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        View Profile <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Peers Roster */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} style={{ color: '#10b981' }} /> Team Colleagues &amp; Regional Peers ({teamPeers.length})
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
              Colleagues working within {activeEmployee.team_name || 'Enterprise BD'} and {activeEmployee.region || 'West Region'}.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              {teamPeers.map((peer) => (
                <div
                  key={peer.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        background: getAvatarBg(peer),
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '12px'
                      }}
                    >
                      {getInitials(peer.name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{peer.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{peer.designation || peer.role}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedProfileUserId(peer.id);
                      setActiveSubTab('overview');
                    }}
                    className="btn btn-xs btn-secondary"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
