import React, { useState, useEffect } from 'react';
import { X, Building, ShieldCheck, Sparkles, Pencil } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { INDUSTRIES } from '../../utils/seedData';
import { ClientType, ClientStatus } from '../../types/crm';

export const EditClientModal: React.FC = () => {
  const { closeModal, clients, updateClient, segments, teamMembers, activeModal } = useCRM();

  const clientId = activeModal.data?.clientId || activeModal.data?.id;
  const existingClient = clients.find((c) => c.id === clientId);

  const [formData, setFormData] = useState({
    name: '',
    industry: INDUSTRIES[0] || 'Manufacturing & Heavy Industry',
    segment: segments[0]?.name || 'Employee Transportation',
    city: '',
    status: 'Active' as ClientStatus,
    accountOwner: teamMembers[0]?.name || 'Rahul Sharma',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    clientType: 'Existing Client' as ClientType,
    state: '',
    region: 'West' as 'North' | 'South' | 'East' | 'West' | 'Central',
    tier: 'Tier 1 (Enterprise)' as 'Tier 1 (Enterprise)' | 'Tier 2 (Mid-Market)' | 'Tier 3 (Emerging)',
    turnoverCr: 100,
    employees: 500,
    contactDesignation: 'Key Account Manager',
    address: '',
    notes: '',
  });

  const [showOptionalFields, setShowOptionalFields] = useState(false);

  useEffect(() => {
    if (existingClient) {
      const primaryContact =
        existingClient.contacts.find((c) => c.isPrimary) ||
        existingClient.contacts[0] || {
          name: '',
          designation: 'Key Account Manager',
          email: '',
          phone: '',
        };

      setFormData({
        name: existingClient.name || '',
        industry: existingClient.industry || INDUSTRIES[0],
        segment: existingClient.segment || segments[0]?.name || 'Employee Transportation',
        city: existingClient.city || '',
        status: (existingClient.status as ClientStatus) || 'Active',
        accountOwner: existingClient.accountOwner || teamMembers[0]?.name || 'Rahul Sharma',
        contactName: primaryContact.name || '',
        contactEmail: primaryContact.email || '',
        contactPhone: primaryContact.phone || '',
        clientType: existingClient.clientType || 'Existing Client',
        state: existingClient.state || '',
        region: existingClient.region || 'West',
        tier: existingClient.tier || 'Tier 1 (Enterprise)',
        turnoverCr: existingClient.turnoverCr || 100,
        employees: existingClient.employees || 500,
        contactDesignation: primaryContact.designation || 'Key Account Manager',
        address: existingClient.address || '',
        notes: existingClient.notes || '',
      });
    }
  }, [existingClient, segments, teamMembers]);

  if (!existingClient) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name.trim() ||
      !formData.industry ||
      !formData.segment ||
      !formData.city.trim() ||
      !formData.status ||
      !formData.accountOwner ||
      !formData.contactName.trim() ||
      !formData.contactEmail.trim() ||
      !formData.contactPhone.trim()
    ) {
      alert('Please fill out all mandatory fields marked with (*).');
      return;
    }

    const defaultState =
      formData.region === 'North'
        ? 'Delhi / NCR'
        : formData.region === 'South'
        ? 'Karnataka'
        : formData.region === 'East'
        ? 'West Bengal'
        : formData.region === 'Central'
        ? 'Madhya Pradesh'
        : 'Maharashtra';

    updateClient(existingClient.id, {
      name: formData.name.trim(),
      clientType: formData.clientType,
      industry: formData.industry,
      segment: formData.segment,
      city: formData.city.trim(),
      state: formData.state.trim() || defaultState,
      region: formData.region,
      tier: formData.tier,
      turnoverCr: Number(formData.turnoverCr) || 100,
      employees: Number(formData.employees) || 500,
      status: formData.status,
      accountOwner: formData.accountOwner,
      address: formData.address,
      contacts: [
        {
          id: existingClient.contacts[0]?.id || `CON-${Date.now().toString().slice(-4)}`,
          name: formData.contactName.trim(),
          designation: formData.contactDesignation || 'Primary POC',
          email: formData.contactEmail.trim(),
          phone: formData.contactPhone.trim(),
          isPrimary: true,
        },
        ...existingClient.contacts.slice(1),
      ],
      notes: formData.notes,
    });

    closeModal();
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content-box" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-section" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div className="modal-header-title">
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Pencil size={18} />
            </div>
            <div>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Edit Client: {existingClient.name}
              </span>
              <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                Modify client master information and contact records
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={closeModal}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body-section" style={{ padding: '20px 24px', overflowY: 'auto' }}>
            {/* Auto-generated Client Code Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} style={{ color: '#0284c7' }} />
                <span style={{ fontSize: '12.5px', color: '#0369a1', fontWeight: 600 }}>
                  Client Code (System Assigned):
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#0284c7',
                  background: '#ffffff',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  border: '1px solid #93c5fd',
                  boxShadow: '0 1px 2px rgba(2, 132, 199, 0.1)',
                }}
              >
                {existingClient.code}
              </span>
            </div>

            {/* Mandatory Fields Group Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#0f172a' }}>
                Mandatory Client Information
              </span>
              <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700 }}>(* Required)</span>
            </div>

            {/* 1. Client Name */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ fontWeight: 700, fontSize: '12.5px', color: '#1e293b' }}>
                Client Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. ABC Manufacturing Ltd"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* 2. Industry & 3. Segment */}
            <div className="form-grid-2" style={{ marginBottom: '14px' }}>
              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '12.5px', color: '#1e293b' }}>
                  Industry <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  required
                  className="form-control"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '12.5px', color: '#1e293b' }}>
                  Segment <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  required
                  className="form-control"
                  value={formData.segment}
                  onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                >
                  {segments.map((seg) => (
                    <option key={seg.id} value={seg.name}>
                      {seg.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. City & 5. Status */}
            <div className="form-grid-2" style={{ marginBottom: '14px' }}>
              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '12.5px', color: '#1e293b' }}>
                  City <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Pune, Mumbai, Gurugram, Bengaluru"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '12.5px', color: '#1e293b' }}>
                  Status <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  required
                  className="form-control"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ClientStatus })}
                >
                  <option value="Active">Active (Live Relationship)</option>
                  <option value="Prospect">Prospect (Onboarding / Lead)</option>
                  <option value="Dormant">Dormant (Inactive)</option>
                  <option value="Blacklisted">Blacklisted</option>
                </select>
              </div>
            </div>

            {/* 6. Account Owner */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ fontWeight: 700, fontSize: '12.5px', color: '#1e293b' }}>
                Account Owner <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                required
                className="form-control"
                value={formData.accountOwner}
                onChange={(e) => setFormData({ ...formData, accountOwner: e.target.value })}
              >
                {teamMembers.map((tm) => (
                  <option key={tm.id} value={tm.name}>
                    {tm.name} ({tm.title} - {tm.region})
                  </option>
                ))}
              </select>
            </div>

            {/* Primary Contact Section */}
            <div
              style={{
                margin: '16px 0 12px 0',
                borderTop: '1px solid #e2e8f0',
                paddingTop: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <strong style={{ fontSize: '12.5px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Primary Contact Details
              </strong>
              <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700 }}>(* Required)</span>
            </div>

            {/* 7. Primary Contact (Name) */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ fontWeight: 700, fontSize: '12.5px', color: '#1e293b' }}>
                Primary Contact <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. Rajesh Kulkarni"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              />
            </div>

            {/* 8. Email & 9. Phone */}
            <div className="form-grid-2" style={{ marginBottom: '14px' }}>
              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '12.5px', color: '#1e293b' }}>
                  Email <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="email"
                  required
                  className="form-control"
                  placeholder="e.g. contact@clientcorp.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '12.5px', color: '#1e293b' }}>
                  Phone <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="tel"
                  required
                  className="form-control"
                  placeholder="e.g. +91 98231 44550"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>
            </div>

            {/* Collapsible / Optional Fields Section */}
            <div style={{ marginTop: '10px', borderTop: '1px dashed #e2e8f0', paddingTop: '10px' }}>
              <button
                type="button"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#0284c7',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '4px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                onClick={() => setShowOptionalFields(!showOptionalFields)}
              >
                <span>{showOptionalFields ? '▲ Hide Optional Fields' : '▼ Show Optional Fields (Client Type, Tier, Turnover, Address)'}</span>
              </button>

              {showOptionalFields && (
                <div style={{ marginTop: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div className="form-grid-2" style={{ marginBottom: '10px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '11.5px', color: '#64748b' }}>Client Type</label>
                      <select
                        className="form-control"
                        value={formData.clientType}
                        onChange={(e) => setFormData({ ...formData, clientType: e.target.value as ClientType })}
                      >
                        <option value="New Client">New Client</option>
                        <option value="Existing Client">Existing Client</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '11.5px', color: '#64748b' }}>Client Tier</label>
                      <select
                        className="form-control"
                        value={formData.tier}
                        onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
                      >
                        <option value="Tier 1 (Enterprise)">Tier 1 (Enterprise)</option>
                        <option value="Tier 2 (Mid-Market)">Tier 2 (Mid-Market)</option>
                        <option value="Tier 3 (Emerging)">Tier 3 (Emerging)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-grid-2" style={{ marginBottom: '10px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '11.5px', color: '#64748b' }}>Annual Turnover (₹ Cr)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.turnoverCr}
                        onChange={(e) => setFormData({ ...formData, turnoverCr: Number(e.target.value) })}
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '11.5px', color: '#64748b' }}>Contact Designation</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="VP / Head Procurement"
                        value={formData.contactDesignation}
                        onChange={(e) => setFormData({ ...formData, contactDesignation: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '11.5px', color: '#64748b' }}>Address / Headquarter</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. MIDC Industrial Area, Phase II"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '11.5px', color: '#64748b' }}>Relationship Notes</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer-section">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} />
              <span>Update Client Master</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
