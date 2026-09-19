import React, { useState, useMemo } from 'react';
import {
  Building2, Plus, FileSpreadsheet, Search, Phone, Mail, MapPin,
  TrendingUp, Calendar, Trash2, Database, LayoutGrid, Table, Pencil,
  ShieldCheck, Truck, Paperclip, Download, CheckCircle2, Clock, DollarSign,
  AlertCircle, X
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useRBAC } from '../../context/RBACContext';
import { scopeRecordsByUserRole } from '../../utils/rbacPermissions';
import { INDUSTRIES } from '../../utils/seedData';

export const ClientsTab: React.FC = () => {
  const { currentUser, clients, deleteClient, openModal, exportClients, searchQuery } = useCRM();
  const { currentRole, canCreate, canEdit, canDelete, canExport } = useRBAC();

  const handleExportClients = () => {
    if (!canExport('clients')) {
      alert('Security Policy Violation: You do not have permission to export client data.');
      return;
    }
    exportClients();
  };

  const handleOpenAddClient = () => {
    if (!canCreate('clients')) {
      alert('Security Policy Violation: You do not have permission to create clients.');
      return;
    }
    openModal('addClient');
  };

  const handleOpenImport = () => {
    if (!canCreate('clients')) {
      alert('Security Policy Violation: You do not have permission to bulk import clients.');
      return;
    }
    openModal('importClients');
  };

  const handleDeleteClient = (id: string, name: string) => {
    if (!canDelete('clients')) {
      alert('Security Policy Violation: You do not have permission to delete clients.');
      return;
    }
    if (window.confirm(`Delete client "${name}"?`)) {
      deleteClient(id);
    }
  };

  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [clientTypeFilter, setClientTypeFilter] = useState('All');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('All');
  const [localSearch, setLocalSearch] = useState('');

  const effectiveSearch = (searchQuery || localSearch).toLowerCase();

  const scopedClients = useMemo(() => {
    return scopeRecordsByUserRole(clients, currentUser, currentRole, 'accountOwner');
  }, [clients, currentUser, currentRole]);

  const filteredClients = scopedClients.filter((c) => {
    if (clientTypeFilter !== 'All') {
      if (clientTypeFilter === 'Existing Business') {
        if (!c.deployedFleets || c.deployedFleets.length === 0) return false;
      } else if (c.clientType !== clientTypeFilter) {
        return false;
      }
    }
    if (industryFilter !== 'All' && c.industry !== industryFilter) return false;
    if (tierFilter !== 'All' && c.tier !== tierFilter) return false;
    if (effectiveSearch) {
      const matchName = c.name.toLowerCase().includes(effectiveSearch);
      const matchCode = c.code.toLowerCase().includes(effectiveSearch);
      const matchCity = c.city.toLowerCase().includes(effectiveSearch);
      const matchOwner = c.accountOwner.toLowerCase().includes(effectiveSearch);
      const matchContact = c.contacts.some((ct) => ct.name.toLowerCase().includes(effectiveSearch));
      const matchFleet = c.deployedFleets?.some((f) =>
        f.seaterCapacity.toLowerCase().includes(effectiveSearch) ||
        f.shiftFormat.toLowerCase().includes(effectiveSearch) ||
        f.billingFrequency.toLowerCase().includes(effectiveSearch)
      );
      return matchName || matchCode || matchCity || matchOwner || matchContact || matchFleet;
    }
    return true;
  });

  // ─── Bulk Select & Delete State ──────────────────────────────────────────
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const masterCheckboxRef = React.useRef<HTMLInputElement>(null);

  const displayedClientIds = useMemo(() => filteredClients.map((c) => c.id), [filteredClients]);

  const isAllSelected = useMemo(() => {
    return displayedClientIds.length > 0 && displayedClientIds.every((id) => selectedClientIds.has(id));
  }, [displayedClientIds, selectedClientIds]);

  const isSomeSelected = useMemo(() => {
    return displayedClientIds.some((id) => selectedClientIds.has(id)) && !isAllSelected;
  }, [displayedClientIds, selectedClientIds, isAllSelected]);

  React.useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);

  // Auto-dismiss success notification after 5 seconds
  React.useEffect(() => {
    if (notification && notification.type === 'success') {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedClientIds((prev) => {
        const next = new Set(prev);
        displayedClientIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedClientIds((prev) => {
        const next = new Set(prev);
        displayedClientIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedClientIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirmBulkDelete = async () => {
    if (!canDelete('clients')) {
      alert('Security Policy Violation: You do not have permission to delete clients.');
      return;
    }

    const idsToDelete = Array.from(selectedClientIds);
    const count = idsToDelete.length;
    if (count === 0) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      for (const id of idsToDelete) {
        await deleteClient(id);
      }

      setSelectedClientIds(new Set());
      setShowDeleteModal(false);
      setNotification({
        type: 'success',
        message: `${count} client${count === 1 ? '' : 's'} deleted successfully.`,
      });
    } catch (err: any) {
      console.error('Failed to bulk delete clients:', err);
      const errMsg = err?.message || 'Failed to delete selected clients. Please try again.';
      setDeleteError(errMsg);
      setNotification({
        type: 'error',
        message: `Deletion failed: ${errMsg}`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const totalDeployedFleetsAll = clients.reduce((sum, c) => {
    return sum + (c.deployedFleets?.reduce((fSum, f) => fSum + (Number(f.vehicleCount) || 0), 0) || 0);
  }, 0);

  const totalMonthlyBillingAll = clients.reduce((sum, c) => {
    return sum + (c.deployedFleets?.reduce((fSum, f) => fSum + (Number(f.totalMonthlyBillingINR) || 0), 0) || 0);
  }, 0);

  const clientsWithAgreementsCount = clients.filter((c) => !!c.agreementDocumentName).length;

  return (
    <section>
      {/* Local styles guaranteeing checkbox rendering, visibility and sizing */}
      <style>{`
        .client-checkbox-col {
          width: 44px !important;
          min-width: 44px !important;
          max-width: 44px !important;
          padding: 8px 0 !important;
          text-align: center !important;
          vertical-align: middle !important;
        }
        .client-master-checkbox {
          -webkit-appearance: checkbox !important;
          -moz-appearance: checkbox !important;
          appearance: auto !important;
          display: inline-block !important;
          width: 18px !important;
          height: 18px !important;
          min-width: 18px !important;
          min-height: 18px !important;
          max-width: 18px !important;
          max-height: 18px !important;
          opacity: 1 !important;
          visibility: visible !important;
          position: static !important;
          z-index: 2 !important;
          margin: 0 auto !important;
          vertical-align: middle !important;
          accent-color: #0284c7 !important;
          cursor: pointer !important;
          outline: none !important;
        }
        .client-master-checkbox:disabled {
          cursor: not-allowed !important;
          opacity: 0.5 !important;
        }
      `}</style>
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
            Corporate Client Master Directory
          </h2>
          <p style={{ fontSize: '12.5px', color: '#64748b' }}>
            Enterprise accounts • Active deployed fleets, shift formats, monthly commercials &amp; agreement documents
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {canDelete('clients') && (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={selectedClientIds.size === 0 || isDeleting}
              onClick={() => {
                setDeleteError(null);
                setShowDeleteModal(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: selectedClientIds.size > 0 ? '#dc2626' : '#94a3b8',
                borderColor: selectedClientIds.size > 0 ? '#fca5a5' : '#e2e8f0',
                background: selectedClientIds.size > 0 ? '#fef2f2' : '#f8fafc',
                cursor: selectedClientIds.size === 0 || isDeleting ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                transition: 'all 0.15s ease',
              }}
              title={
                selectedClientIds.size === 0
                  ? 'Select client rows below to delete'
                  : `Delete ${selectedClientIds.size} selected client${selectedClientIds.size === 1 ? '' : 's'}`
              }
            >
              <Trash2 size={15} />
              <span>
                {selectedClientIds.size > 0
                  ? `Delete Selected (${selectedClientIds.size})`
                  : 'Delete Selected'}
              </span>
            </button>
          )}

          {canCreate('clients') && (
            <button
              type="button"
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
              }}
              onClick={handleOpenImport}
              title="Open Bulk Import Dialog to paste, preview and map columns"
            >
              <Database size={15} />
              <span>📥 Bulk Import Clients (CSV)</span>
            </button>
          )}

          {canExport('clients') && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleExportClients}
              title="Export full client database to CSV file"
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <FileSpreadsheet size={15} />
              <span>Export CSV</span>
            </button>
          )}

          {canCreate('clients') && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenAddClient}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} />
              <span>+ Add Client</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification Banner */}
      {notification && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            background: notification.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${notification.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: notification.type === 'success' ? '#065f46' : '#991b1b',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {notification.type === 'success' ? (
              <CheckCircle2 size={16} style={{ color: '#10b981' }} />
            ) : (
              <AlertCircle size={16} style={{ color: '#ef4444' }} />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* KPI Stats & Existing Business Overview Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Building2 size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Total Clients
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              {clients.length} Accounts
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: '#fef3c7',
              color: '#b45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Truck size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Deployed Fleets
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              {totalDeployedFleetsAll} Active Vehicles
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: '#dcfce7',
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <DollarSign size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Monthly Commercials
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a' }}>
              ₹{(totalMonthlyBillingAll / 100000).toFixed(2)} Lakhs / mo
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: '#f3e8ff',
              color: '#7e22ce',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Paperclip size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Agreement Docs
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              {clientsWithAgreementsCount} Signed &amp; Active
            </div>
          </div>
        </div>
      </div>

      {/* Filters & View Toggle Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
          background: '#ffffff',
          padding: '12px 18px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search by client, fleet, shift, contact..."
              className="form-control"
              style={{ paddingLeft: '32px', fontSize: '12.5px', height: '34px' }}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>

          <select
            className="form-control"
            style={{ width: 'auto', fontSize: '12.5px', height: '34px', fontWeight: 600 }}
            value={clientTypeFilter}
            onChange={(e) => setClientTypeFilter(e.target.value)}
          >
            <option value="All">All Client Types</option>
            <option value="Existing Business">🚍 Existing Business &amp; Deployed Fleets</option>
            <option value="Existing Client">✓ Existing Clients</option>
            <option value="New Client">★ New Clients / Prospects</option>
          </select>

          <select
            className="form-control"
            style={{ width: 'auto', fontSize: '12.5px', height: '34px' }}
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
          >
            <option value="All">All Industries</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>

          <select
            className="form-control"
            style={{ width: 'auto', fontSize: '12.5px', height: '34px' }}
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
          >
            <option value="All">All Tiers</option>
            <option value="Tier 1 (Enterprise)">Tier 1 (Enterprise)</option>
            <option value="Tier 2 (Mid-Market)">Tier 2 (Mid-Market)</option>
            <option value="Tier 3 (Emerging)">Tier 3 (Emerging)</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              borderRadius: '8px',
              padding: '2px',
              border: '1px solid #e2e8f0',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'table' ? '#ffffff' : 'transparent',
                color: viewMode === 'table' ? '#0284c7' : '#64748b',
                fontWeight: viewMode === 'table' ? 700 : 500,
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <Table size={14} />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'cards' ? '#ffffff' : 'transparent',
                color: viewMode === 'cards' ? '#0284c7' : '#64748b',
                fontWeight: viewMode === 'cards' ? 700 : 500,
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: viewMode === 'cards' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <LayoutGrid size={14} />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── TABLE VIEW ──────────────────────────────────────────────────────── */}
      {viewMode === 'table' && (
        <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-xs)', marginBottom: '24px' }}>
          <div style={{ padding: '12px 18px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={16} style={{ color: '#0284c7' }} />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                Corporate Client Directory
              </span>
              <span className="pill-badge" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}>
                {filteredClients.length} Records
              </span>
              {selectedClientIds.size > 0 && (
                <span className="pill-badge" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 700 }}>
                  {selectedClientIds.size} Selected
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {canDelete('clients') && selectedClientIds.size > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => {
                    setDeleteError(null);
                    setShowDeleteModal(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#dc2626',
                    borderColor: '#fca5a5',
                    background: '#fef2f2',
                    fontWeight: 700,
                  }}
                >
                  <Trash2 size={12} />
                  <span>Delete Selected ({selectedClientIds.size})</span>
                </button>
              )}
              <button
                className="btn btn-primary btn-xs"
                onClick={() => openModal('addClient')}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={13} />
                <span>+ Create Client</span>
              </button>
            </div>
          </div>

          <div className="table-responsive" style={{ maxHeight: '640px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th
                    className="client-checkbox-col"
                    style={{
                      width: '44px',
                      minWidth: '44px',
                      maxWidth: '44px',
                      padding: '8px 0',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '20px' }}>
                      <input
                        ref={masterCheckboxRef}
                        type="checkbox"
                        className="client-master-checkbox"
                        checked={isAllSelected}
                        onChange={handleToggleSelectAll}
                        disabled={displayedClientIds.length === 0}
                        style={{
                          appearance: 'auto',
                          WebkitAppearance: 'checkbox',
                          width: '18px',
                          height: '18px',
                          minWidth: '18px',
                          minHeight: '18px',
                          cursor: displayedClientIds.length === 0 ? 'not-allowed' : 'pointer',
                          accentColor: '#0284c7',
                          opacity: 1,
                          visibility: 'visible',
                          display: 'inline-block',
                          verticalAlign: 'middle',
                          margin: '0 auto',
                        }}
                        title={isAllSelected ? 'Deselect All Displayed Clients' : 'Select All Displayed Clients'}
                        aria-label="Select All Displayed Clients"
                      />
                    </div>
                  </th>
                  <th style={{ width: '95px' }}>Client Code</th>
                  <th style={{ minWidth: '160px' }}>Client Name</th>
                  <th>Type</th>
                  <th>Industry</th>
                  <th>City &amp; Hub</th>
                  <th style={{ minWidth: '220px' }}>Deployed Fleets &amp; Shifts</th>
                  <th style={{ minWidth: '160px' }}>Commercials &amp; Billing</th>
                  <th style={{ minWidth: '160px' }}>Agreement Document</th>
                  <th style={{ minWidth: '150px' }}>Primary Contact</th>
                  <th style={{ minWidth: '150px' }}>Contact Info</th>
                  <th>BD Owner</th>
                  <th style={{ textAlign: 'center', minWidth: '160px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={13} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No corporate clients found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => {
                    const primaryContact =
                      client.contacts.find((c) => c.isPrimary) || client.contacts[0] || { name: 'N/A', designation: '', email: '', phone: '' };
                    const otherContacts = client.contacts.filter((c) => c !== primaryContact);
                    const isNew = client.clientType === 'New Client';
                    const fleets = client.deployedFleets || [];
                    const totalVehicles = fleets.reduce((sum, f) => sum + (Number(f.vehicleCount) || 0), 0);
                    const totalMonthly = fleets.reduce((sum, f) => sum + (Number(f.totalMonthlyBillingINR) || 0), 0);
                    const isSelected = selectedClientIds.has(client.id);

                    return (
                      <tr
                        key={client.id}
                        style={{
                          transition: 'background 0.15s',
                          background: isSelected ? '#f0f9ff' : undefined,
                        }}
                      >
                        <td
                          className="client-checkbox-col"
                          style={{
                            width: '44px',
                            minWidth: '44px',
                            maxWidth: '44px',
                            padding: '8px 0',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '20px' }}>
                            <input
                              type="checkbox"
                              className="client-master-checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleRow(client.id)}
                              style={{
                                appearance: 'auto',
                                WebkitAppearance: 'checkbox',
                                width: '18px',
                                height: '18px',
                                minWidth: '18px',
                                minHeight: '18px',
                                cursor: 'pointer',
                                accentColor: '#0284c7',
                                opacity: 1,
                                visibility: 'visible',
                                display: 'inline-block',
                                verticalAlign: 'middle',
                                margin: '0 auto',
                              }}
                              aria-label={`Select client ${client.name}`}
                            />
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '11px',
                              color: '#0284c7',
                              fontWeight: 800,
                              background: '#e0f2fe',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {client.code}
                          </span>
                        </td>
                        <td>
                          <div
                            style={{ fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}
                            onClick={() => openModal('editClient', { clientId: client.id })}
                            title="Click to edit client"
                          >
                            {client.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{client.segment}</div>
                        </td>
                        <td>
                          <span
                            className="pill-badge"
                            style={{
                              background: isNew ? '#e0f2fe' : '#ecfdf5',
                              color: isNew ? '#0369a1' : '#047857',
                              border: `1px solid ${isNew ? '#bae6fd' : '#a7f3d0'}`,
                              fontWeight: 700,
                              fontSize: '10.5px',
                            }}
                          >
                            {isNew ? '★ New' : '✓ Existing'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '11.5px', color: '#475569' }}>{client.industry}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                            <MapPin size={11} style={{ color: '#64748b' }} />
                            <span>{client.city}</span>
                          </div>
                        </td>

                        {/* Deployed Fleets & Shifts Column */}
                        <td>
                          {fleets.length === 0 ? (
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>No active fleet</span>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="pill-badge" style={{ background: '#fef3c7', color: '#b45309', fontWeight: 800, fontSize: '10.5px' }}>
                                  🚍 {totalVehicles} Vehicles
                                </span>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>
                                  ({fleets.length} {fleets.length === 1 ? 'Roster' : 'Rosters'})
                                </span>
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                                {fleets.map((f, fIdx) => (
                                  <span
                                    key={fIdx}
                                    className="pill-badge"
                                    style={{ background: '#f1f5f9', color: '#334155', fontSize: '9.5px', padding: '1px 5px' }}
                                    title={`${f.seaterCapacity} (${f.vehicleCount} units) - ${f.shiftFormat} - Billing: ${f.billingFrequency}`}
                                  >
                                    {f.seaterCapacity.replace(' Seater', 'S')} (x{f.vehicleCount})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Commercials & Billing Frequency Column */}
                        <td>
                          {totalMonthly > 0 ? (
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 800, color: '#16a34a' }}>
                                ₹{totalMonthly.toLocaleString('en-IN')} / mo
                              </div>
                              <div style={{ fontSize: '10.5px', color: '#0284c7', fontWeight: 600 }}>
                                Billing: {fleets[0]?.billingFrequency || 'Monthly'}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>On quotation</span>
                          )}
                        </td>

                        {/* Agreement Document Column */}
                        <td>
                          {client.agreementDocumentName ? (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                background: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                padding: '3px 7px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                              }}
                              onClick={() => alert(`Opening agreement: ${client.agreementDocumentName}`)}
                              title="Click to preview/download agreement"
                            >
                              <Paperclip size={12} style={{ color: '#16a34a' }} />
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {client.agreementDocumentName}
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Pending Upload</span>
                          )}
                        </td>

                        {/* Primary Contact */}
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '12px' }}>
                            {primaryContact.name}
                          </div>
                          {primaryContact.designation && (
                            <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600 }}>
                              {primaryContact.designation}
                            </div>
                          )}
                          {otherContacts.length > 0 && (
                            <div style={{ marginTop: '2px' }}>
                              <span
                                className="pill-badge"
                                style={{ background: '#f1f5f9', color: '#475569', fontSize: '9.5px', cursor: 'pointer' }}
                                onClick={() => openModal('editClient', { clientId: client.id })}
                                title={otherContacts.map((c) => `${c.name} (${c.designation})`).join('\n')}
                              >
                                +{otherContacts.length} more POCs
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Contact Info */}
                        <td>
                          {primaryContact.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#475569', marginBottom: '2px' }}>
                              <Phone size={10} style={{ color: '#0284c7' }} />
                              <span>{primaryContact.phone}</span>
                            </div>
                          )}
                          {primaryContact.email && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#0284c7' }}>
                              <Mail size={10} />
                              <span style={{ wordBreak: 'break-all' }}>{primaryContact.email}</span>
                            </div>
                          )}
                        </td>

                        <td>
                          <strong style={{ fontSize: '11.5px', color: '#0f172a' }}>{client.accountOwner}</strong>
                        </td>

                        {/* Actions */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                            {canEdit('clients') && (
                              <button
                                className="btn btn-secondary btn-xs"
                                style={{ color: '#0284c7', background: '#f0f9ff', borderColor: '#bae6fd' }}
                                title="Edit Client Master, Fleets & Agreement"
                                onClick={() => openModal('editClient', { clientId: client.id })}
                              >
                                <Pencil size={11} />
                                <span>Edit</span>
                              </button>
                            )}
                            {canCreate('opportunities') && (
                              <button
                                className="btn btn-secondary btn-xs"
                                title="Create Opportunity"
                                onClick={() => openModal('addOpportunity', { clientId: client.id })}
                              >
                                <TrendingUp size={11} style={{ color: '#16a34a' }} />
                              </button>
                            )}
                            {canCreate('activities') && (
                              <button
                                className="btn btn-secondary btn-xs"
                                title="Log Meeting"
                                onClick={() => openModal('addActivity', { clientId: client.id, clientType: client.clientType })}
                              >
                                <Calendar size={11} style={{ color: '#0284c7' }} />
                              </button>
                            )}
                            {canDelete('clients') && (
                              <button
                                className="btn btn-secondary btn-xs"
                                style={{ color: '#dc2626' }}
                                title="Delete Client"
                                onClick={() => handleDeleteClient(client.id, client.name)}
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
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

      {/* ─── CARDS GRID VIEW ─────────────────────────────────────────────────── */}
      {viewMode === 'cards' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(370px, 1fr))',
            gap: '18px',
            marginBottom: '24px',
          }}
        >
          {filteredClients.map((client) => {
            const isNew = client.clientType === 'New Client';
            const contactsList = client.contacts && client.contacts.length > 0 ? client.contacts : [];
            const fleets = client.deployedFleets || [];
            const totalVehicles = fleets.reduce((sum, f) => sum + (Number(f.vehicleCount) || 0), 0);
            const totalMonthly = fleets.reduce((sum, f) => sum + (Number(f.totalMonthlyBillingINR) || 0), 0);

            return (
              <div
                key={client.id}
                style={{
                  background: selectedClientIds.has(client.id) ? '#f0f9ff' : '#ffffff',
                  border: selectedClientIds.has(client.id) ? '1px solid #7dd3fc' : '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '18px',
                  boxShadow: 'var(--shadow-xs)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                }}
              >
                <div>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          className="client-master-checkbox"
                          checked={selectedClientIds.has(client.id)}
                          onChange={() => handleToggleRow(client.id)}
                          style={{
                            appearance: 'auto',
                            WebkitAppearance: 'checkbox',
                            width: '18px',
                            height: '18px',
                            minWidth: '18px',
                            minHeight: '18px',
                            cursor: 'pointer',
                            accentColor: '#0284c7',
                            opacity: 1,
                            visibility: 'visible',
                            display: 'inline-block',
                            verticalAlign: 'middle',
                          }}
                          aria-label={`Select client ${client.name}`}
                        />
                        <h3
                          style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}
                          onClick={() => openModal('editClient', { clientId: client.id })}
                        >
                          {client.name}
                        </h3>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#0284c7', fontWeight: 700, background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px' }}>
                          {client.code}
                        </span>
                        <span
                          className="pill-badge"
                          style={{
                            background: isNew ? '#e0f2fe' : '#ecfdf5',
                            color: isNew ? '#0369a1' : '#047857',
                            border: `1px solid ${isNew ? '#bae6fd' : '#a7f3d0'}`,
                            fontWeight: 700,
                          }}
                        >
                          {isNew ? '★ New' : '✓ Existing'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        className="pill-badge"
                        style={{
                          background: client.tier.includes('Tier 1') ? '#fef3c7' : '#f1f5f9',
                          color: client.tier.includes('Tier 1') ? '#b45309' : '#475569',
                          fontWeight: 700,
                        }}
                      >
                        {client.tier.split(' ')[0]}
                      </span>
                      <button
                        className="btn btn-secondary btn-xs"
                        style={{ padding: '3px 6px', color: '#0284c7' }}
                        title="Edit Client Master & Fleets"
                        onClick={() => openModal('editClient', { clientId: client.id })}
                      >
                        <Pencil size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Details pills */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                    <span className="pill-badge" style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>
                      {client.industry}
                    </span>
                    <span className="pill-badge" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                      {client.segment}
                    </span>
                    <span className="pill-badge" style={{ background: '#f8fafc', color: '#64748b' }}>
                      <MapPin size={11} /> {client.city}, {client.region}
                    </span>
                  </div>

                  {/* Existing Business: Deployed Fleets Card Section */}
                  {fleets.length > 0 && (
                    <div
                      style={{
                        background: '#fefce8',
                        border: '1px solid #fef08a',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        marginBottom: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', borderBottom: '1px dashed #fde047', paddingBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Truck size={13} style={{ color: '#b45309' }} />
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#854d0e', textTransform: 'uppercase' }}>
                            Deployed Fleets ({totalVehicles} Vehicles)
                          </span>
                        </div>
                        <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#16a34a' }}>
                          ₹{totalMonthly.toLocaleString('en-IN')}/mo
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {fleets.map((f, fIdx) => (
                          <div
                            key={fIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '11.5px',
                              background: '#ffffff',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid #fef08a',
                            }}
                          >
                            <div>
                              <strong style={{ color: '#0f172a' }}>{f.seaterCapacity}</strong>
                              <span style={{ color: '#b45309', fontWeight: 700, marginLeft: '4px' }}>x{f.vehicleCount}</span>
                              <div style={{ fontSize: '10.5px', color: '#64748b' }}>{f.shiftFormat}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 700, color: '#16a34a' }}>₹{f.totalMonthlyBillingINR.toLocaleString('en-IN')}</div>
                              <span className="pill-badge" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '9px', padding: '0 4px' }}>
                                {f.billingFrequency}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Agreement Document link */}
                      {client.agreementDocumentName && (
                        <div
                          style={{
                            marginTop: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                          onClick={() => alert(`Opening agreement: ${client.agreementDocumentName}`)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontWeight: 700 }}>
                            <Paperclip size={11} />
                            <span>{client.agreementDocumentName}</span>
                          </div>
                          <span style={{ color: '#15803d', fontSize: '10px' }}>📄 Valid Agreement</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Points of Contact (POCs) Box with multiple contacts */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #f1f5f9',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      marginBottom: '12px',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Points of Contact ({contactsList.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => openModal('editClient', { clientId: client.id })}
                        style={{ background: 'transparent', border: 'none', color: '#0284c7', fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                      >
                        + Manage POCs
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {contactsList.map((contact, cIdx) => (
                        <div key={contact.id || cIdx} style={{ paddingBottom: cIdx < contactsList.length - 1 ? '6px' : '0', borderBottom: cIdx < contactsList.length - 1 ? '1px dashed #e2e8f0' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>
                              {contact.name}
                            </div>
                            {contact.isPrimary && (
                              <span className="pill-badge" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '9.5px', padding: '1px 5px' }}>
                                Primary
                              </span>
                            )}
                          </div>
                          {contact.designation && (
                            <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600, marginBottom: '2px' }}>
                              {contact.designation}
                            </div>
                          )}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                            {contact.phone && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Phone size={10} style={{ color: '#0284c7' }} />
                                <span>{contact.phone}</span>
                              </div>
                            )}
                            {contact.email && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Mail size={10} style={{ color: '#0284c7' }} />
                                <span style={{ wordBreak: 'break-all' }}>{contact.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  {canEdit('clients') && (
                    <button
                      className="btn btn-secondary btn-xs"
                      style={{ flex: 1, color: '#0284c7', background: '#f0f9ff', borderColor: '#bae6fd' }}
                      onClick={() => openModal('editClient', { clientId: client.id })}
                    >
                      <Pencil size={12} />
                      <span>Edit</span>
                    </button>
                  )}
                  {canCreate('opportunities') && (
                    <button
                      className="btn btn-secondary btn-xs"
                      style={{ flex: 1 }}
                      onClick={() => openModal('addOpportunity', { clientId: client.id })}
                    >
                      <TrendingUp size={12} style={{ color: '#16a34a' }} />
                      <span>+ Opp</span>
                    </button>
                  )}
                  {canCreate('activities') && (
                    <button
                      className="btn btn-secondary btn-xs"
                      style={{ flex: 1 }}
                      onClick={() => openModal('addActivity', { clientId: client.id, clientType: client.clientType })}
                    >
                      <Calendar size={12} style={{ color: '#0284c7' }} />
                      <span>+ Log</span>
                    </button>
                  )}
                  {canDelete('clients') && (
                    <button
                      className="btn btn-secondary btn-xs"
                      style={{ color: '#dc2626' }}
                      title="Delete Client"
                      onClick={() => handleDeleteClient(client.id, client.name)}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── BULK DELETE CONFIRMATION MODAL ───────────────────────────────── */}
      {showDeleteModal && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
          }}
          onClick={() => {
            if (!isDeleting) {
              setShowDeleteModal(false);
              setDeleteError(null);
            }
          }}
        >
          <div
            className="modal-content-box"
            style={{
              maxWidth: '460px',
              width: '90%',
              background: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Trash2 size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Delete {selectedClientIds.size} selected client{selectedClientIds.size === 1 ? '' : 's'}?
                </h3>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '20px', lineHeight: 1.55 }}>
              Are you sure you want to delete the selected client records? This action cannot be undone.
            </p>

            {deleteError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  color: '#991b1b',
                  fontSize: '12.5px',
                  marginBottom: '16px',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{deleteError}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                style={{ fontSize: '12.5px', padding: '6px 14px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                onClick={handleConfirmBulkDelete}
                disabled={isDeleting}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  padding: '6px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 2px rgba(220, 38, 38, 0.25)',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.7 : 1,
                }}
              >
                {isDeleting ? (
                  <>
                    <Clock size={14} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
