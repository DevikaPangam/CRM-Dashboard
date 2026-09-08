import React, { useState } from 'react';
import {
  Building2, Plus, FileSpreadsheet, Search, Phone, Mail, MapPin,
  TrendingUp, Calendar, Trash2, Database, LayoutGrid, Table, Pencil, ShieldCheck
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { INDUSTRIES } from '../../utils/seedData';

export const ClientsTab: React.FC = () => {
  const { clients, deleteClient, openModal, exportClients, searchQuery } = useCRM();

  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [clientTypeFilter, setClientTypeFilter] = useState('All');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('All');
  const [localSearch, setLocalSearch] = useState('');

  const effectiveSearch = (searchQuery || localSearch).toLowerCase();

  const filteredClients = clients.filter((c) => {
    if (clientTypeFilter !== 'All' && c.clientType !== clientTypeFilter) return false;
    if (industryFilter !== 'All' && c.industry !== industryFilter) return false;
    if (tierFilter !== 'All' && c.tier !== tierFilter) return false;
    if (effectiveSearch) {
      const matchName = c.name.toLowerCase().includes(effectiveSearch);
      const matchCode = c.code.toLowerCase().includes(effectiveSearch);
      const matchCity = c.city.toLowerCase().includes(effectiveSearch);
      const matchOwner = c.accountOwner.toLowerCase().includes(effectiveSearch);
      const matchContact = c.contacts.some((ct) => ct.name.toLowerCase().includes(effectiveSearch));
      return matchName || matchCode || matchCity || matchOwner || matchContact;
    }
    return true;
  });

  const newClientsCount = clients.filter((c) => c.clientType === 'New Client').length;
  const existingClientsCount = clients.filter((c) => c.clientType === 'Existing Client').length;

  return (
    <section>
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
            Enterprise accounts • New client onboarding &amp; existing client relationship portfolio
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Bulk Import Clients (CSV) Button */}
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
              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)'
            }}
            onClick={() => openModal('importClients')}
            title="Open Bulk Import Dialog to paste, preview and map columns"
          >
            <Database size={15} />
            <span>📥 Bulk Import Clients (CSV)</span>
          </button>

          <button className="btn btn-primary" onClick={() => openModal('addClient')}>
            <Plus size={15} />
            <span>+ Add Single Client</span>
          </button>

          <button className="btn btn-secondary" onClick={exportClients}>
            <FileSpreadsheet size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar with View Mode Switcher */}
      <div className="filter-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div className="filter-group">
          <div className="filter-item">
            <Search size={14} style={{ color: '#64748b' }} />
            <input
              type="text"
              placeholder="Filter by company, city, contact..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              style={{ width: '220px' }}
            />
          </div>

          <div className="filter-item">
            <label>Client Type:</label>
            <select value={clientTypeFilter} onChange={(e) => setClientTypeFilter(e.target.value)}>
              <option value="All">All Client Types ({clients.length})</option>
              <option value="New Client">New Clients ({newClientsCount})</option>
              <option value="Existing Client">Existing Clients ({existingClientsCount})</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Industry:</label>
            <select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)}>
              <option value="All">All Industries</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Client Tier:</label>
            <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
              <option value="All">All Tiers</option>
              <option value="Tier 1 (Enterprise)">Tier 1 (Enterprise)</option>
              <option value="Tier 2 (Mid-Market)">Tier 2 (Mid-Market)</option>
              <option value="Tier 3 (Emerging)">Tier 3 (Emerging)</option>
            </select>
          </div>
        </div>

        {/* View Switcher (Table View vs Cards Grid View) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
            Showing {filteredClients.length} of {clients.length} Clients
          </span>

          <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
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
              <span>Table View</span>
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
              <span>Cards Grid</span>
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
                Corporate Client Directory Master Table
              </span>
              <span className="pill-badge" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}>
                {filteredClients.length} Records
              </span>
            </div>
            <button
              className="btn btn-primary btn-xs"
              onClick={() => openModal('addClient')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={13} />
              <span>+ Create Client</span>
            </button>
          </div>

          <div className="table-responsive" style={{ maxHeight: '620px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>Client Code</th>
                  <th style={{ minWidth: '180px' }}>Client Name</th>
                  <th>Type</th>
                  <th>Industry</th>
                  <th>Segment</th>
                  <th>City &amp; Region</th>
                  <th>Status</th>
                  <th>Account Owner</th>
                  <th style={{ minWidth: '150px' }}>Primary Contact</th>
                  <th style={{ minWidth: '160px' }}>Contact Info</th>
                  <th>Tier</th>
                  <th>Turnover</th>
                  <th style={{ textAlign: 'center', minWidth: '180px' }}>Actions</th>
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
                    const isNew = client.clientType === 'New Client';

                    return (
                      <tr key={client.id} style={{ transition: 'background 0.15s' }}>
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
                          <span
                            className="pill-badge"
                            style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontSize: '11px' }}
                          >
                            {client.segment}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                            <MapPin size={11} style={{ color: '#64748b' }} />
                            <span>{client.city}, {client.region}</span>
                          </div>
                        </td>
                        <td>
                          <span
                            className="pill-badge"
                            style={{
                              background: client.status === 'Active' ? '#ecfdf5' : '#fef3c7',
                              color: client.status === 'Active' ? '#047857' : '#b45309',
                              fontWeight: 700,
                              fontSize: '11px',
                            }}
                          >
                            {client.status || 'Active'}
                          </span>
                        </td>
                        <td>
                          <strong style={{ fontSize: '12px', color: '#0f172a' }}>{client.accountOwner}</strong>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '12px' }}>{primaryContact.name}</div>
                          {primaryContact.designation && (
                            <span style={{ fontSize: '10.5px', color: '#64748b' }}>{primaryContact.designation}</span>
                          )}
                        </td>
                        <td>
                          {primaryContact.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#475569' }}>
                              <Phone size={10} style={{ color: '#0284c7' }} />
                              <span>{primaryContact.phone}</span>
                            </div>
                          )}
                          {primaryContact.email && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#0284c7' }}>
                              <Mail size={10} />
                              <span>{primaryContact.email}</span>
                            </div>
                          )}
                        </td>
                        <td>
                          <span
                            className="pill-badge"
                            style={{
                              background: client.tier.includes('Tier 1') ? '#fef3c7' : '#f1f5f9',
                              color: client.tier.includes('Tier 1') ? '#b45309' : '#475569',
                              fontWeight: 700,
                              fontSize: '10.5px',
                            }}
                          >
                            {client.tier.split(' ')[0]}
                          </span>
                        </td>
                        <td style={{ fontSize: '11.5px', fontWeight: 600, color: '#0f172a' }}>
                          ₹{client.turnoverCr} Cr
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                            {/* Edit Button */}
                            <button
                              className="btn btn-secondary btn-xs"
                              style={{ color: '#0284c7', background: '#f0f9ff', borderColor: '#bae6fd' }}
                              title="Edit Client Master Record"
                              onClick={() => openModal('editClient', { clientId: client.id })}
                            >
                              <Pencil size={11} />
                              <span>Edit</span>
                            </button>
                            <button
                              className="btn btn-secondary btn-xs"
                              title="Create Opportunity"
                              onClick={() => openModal('addOpportunity', { clientId: client.id })}
                            >
                              <TrendingUp size={11} style={{ color: '#16a34a' }} />
                              <span>+ Opp</span>
                            </button>
                            <button
                              className="btn btn-secondary btn-xs"
                              title="Log Engagement Meeting"
                              onClick={() => openModal('addActivity', { clientId: client.id, clientType: client.clientType })}
                            >
                              <Calendar size={11} style={{ color: '#0284c7' }} />
                              <span>+ Log</span>
                            </button>
                            <button
                              className="btn btn-secondary btn-xs"
                              style={{ color: '#dc2626' }}
                              title="Delete Client"
                              onClick={() => {
                                if (window.confirm(`Delete client "${client.name}"?`)) {
                                  deleteClient(client.id);
                                }
                              }}
                            >
                              <Trash2 size={11} />
                            </button>
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '18px',
            marginBottom: '24px',
          }}
        >
          {filteredClients.map((client) => {
            const primaryContact =
              client.contacts.find((c) => c.isPrimary) || client.contacts[0] || { name: 'N/A', designation: '', email: '', phone: '' };

            const isNew = client.clientType === 'New Client';

            return (
              <div
                key={client.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '18px',
                  boxShadow: 'var(--shadow-xs)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  {/* Header with New Client vs Existing Client badge */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3
                          style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}
                          onClick={() => openModal('editClient', { clientId: client.id })}
                          title="Click to edit client"
                        >
                          {client.name}
                        </h3>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            color: '#0284c7',
                            fontWeight: 700,
                            background: '#e0f2fe',
                            padding: '1px 6px',
                            borderRadius: '4px',
                          }}
                        >
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
                          {isNew ? '★ New Client' : '✓ Existing Client'}
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
                      {/* Quick Edit button on Card Header */}
                      <button
                        className="btn btn-secondary btn-xs"
                        style={{ padding: '3px 6px', color: '#0284c7' }}
                        title="Edit Client Master Record"
                        onClick={() => openModal('editClient', { clientId: client.id })}
                      >
                        <Pencil size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Details pills */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
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

                  {/* Contact box */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #f1f5f9',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      marginBottom: '14px',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                      {primaryContact.name} <span style={{ color: '#64748b', fontWeight: 400 }}>• {primaryContact.designation}</span>
                    </div>
                    {primaryContact.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', marginBottom: '2px' }}>
                        <Phone size={12} style={{ color: '#0284c7' }} />
                        <span>{primaryContact.phone}</span>
                      </div>
                    )}
                    {primaryContact.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                        <Mail size={12} style={{ color: '#0284c7' }} />
                        <span>{primaryContact.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Account Owner & Turnover */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748b', marginBottom: '14px' }}>
                    <div>
                      BD Owner: <strong style={{ color: '#0f172a' }}>{client.accountOwner}</strong>
                    </div>
                    <div>
                      Turnover: <strong style={{ color: '#0f172a' }}>₹{client.turnoverCr} Cr</strong>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <button
                    className="btn btn-secondary btn-xs"
                    style={{ flex: 1, color: '#0284c7', background: '#f0f9ff', borderColor: '#bae6fd' }}
                    onClick={() => openModal('editClient', { clientId: client.id })}
                  >
                    <Pencil size={12} />
                    <span>Edit</span>
                  </button>
                  <button
                    className="btn btn-secondary btn-xs"
                    style={{ flex: 1 }}
                    onClick={() => openModal('addOpportunity', { clientId: client.id })}
                  >
                    <TrendingUp size={12} style={{ color: '#16a34a' }} />
                    <span>+ Opp</span>
                  </button>
                  <button
                    className="btn btn-secondary btn-xs"
                    style={{ flex: 1 }}
                    onClick={() => openModal('addActivity', { clientId: client.id, clientType: client.clientType })}
                  >
                    <Calendar size={12} style={{ color: '#0284c7' }} />
                    <span>+ Log</span>
                  </button>
                  <button
                    className="btn btn-secondary btn-xs"
                    style={{ color: '#dc2626' }}
                    title="Delete Client"
                    onClick={() => {
                      if (window.confirm(`Delete client "${client.name}"?`)) {
                        deleteClient(client.id);
                      }
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

