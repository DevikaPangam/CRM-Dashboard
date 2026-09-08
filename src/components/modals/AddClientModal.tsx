import React, { useState } from 'react';
import { X, Building, ShieldCheck, Sparkles, Plus, Trash2, User, Phone, Mail, Award, CheckCircle2 } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { INDUSTRIES } from '../../utils/seedData';
import { ClientType, ClientStatus, ClientContact } from '../../types/crm';

const DESIGNATION_PRESETS = [
  'VP / Head Procurement',
  'VP Supply Chain & Logistics',
  'Operations Director',
  'Commercial & Contracts Head',
  'Plant / Facility Head',
  'Finance Controller / CFO',
  'Key Account Manager',
  'Managing Director / CEO',
];

export const AddClientModal: React.FC = () => {
  const { closeModal, addClient, clients, segments, teamMembers } = useCRM();

  // Next auto-generated client code
  const autoClientCode = `CLT-${clients.length + 1001}`;

  // Mandatory client information state
  const [formData, setFormData] = useState({
    name: '',
    industry: INDUSTRIES[0] || 'Manufacturing & Heavy Industry',
    segment: segments[0]?.name || 'Employee Transportation',
    city: '',
    status: 'Active' as ClientStatus,
    accountOwner: teamMembers[0]?.name || 'Rahul Sharma',

    // Optional fields (with safe defaults)
    clientType: 'New Client' as ClientType,
    state: '',
    region: 'West' as 'North' | 'South' | 'East' | 'West' | 'Central',
    tier: 'Tier 1 (Enterprise)' as 'Tier 1 (Enterprise)' | 'Tier 2 (Mid-Market)' | 'Tier 3 (Emerging)',
    turnoverCr: 100,
    employees: 500,
    address: '',
    notes: '',
  });

  // Multiple Points of Contact (POCs)
  const [contacts, setContacts] = useState<Array<{ id: string; name: string; designation: string; email: string; phone: string; isPrimary: boolean }>>([
    {
      id: `CON-01`,
      name: '',
      designation: 'VP / Head Procurement',
      email: '',
      phone: '',
      isPrimary: true,
    },
  ]);

  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // Add Contact Handler
  const handleAddContact = () => {
    const nextIdx = contacts.length + 1;
    setContacts([
      ...contacts,
      {
        id: `CON-${Date.now().toString().slice(-4)}-${nextIdx}`,
        name: '',
        designation: DESIGNATION_PRESETS[nextIdx % DESIGNATION_PRESETS.length] || 'Key Contact Person',
        email: '',
        phone: '',
        isPrimary: false,
      },
    ]);
  };

  // Remove Contact Handler
  const handleRemoveContact = (index: number) => {
    if (contacts.length <= 1) {
      alert('At least one primary contact is required.');
      return;
    }
    const filtered = contacts.filter((_, i) => i !== index);
    // If the removed one was primary, make the first one primary
    if (contacts[index].isPrimary && filtered.length > 0) {
      filtered[0].isPrimary = true;
    }
    setContacts(filtered);
  };

  // Update Contact Field
  const handleContactChange = (index: number, field: keyof (typeof contacts)[0], value: any) => {
    setContacts(
      contacts.map((c, i) => {
        if (i === index) {
          return { ...c, [field]: value };
        }
        return c;
      })
    );
  };

  // Set Primary POC
  const handleSetPrimaryContact = (index: number) => {
    setContacts(
      contacts.map((c, i) => ({
        ...c,
        isPrimary: i === index,
      }))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const primaryPOC = contacts.find((c) => c.isPrimary) || contacts[0];

    if (
      !formData.name.trim() ||
      !formData.industry ||
      !formData.segment ||
      !formData.city.trim() ||
      !formData.status ||
      !formData.accountOwner ||
      !primaryPOC ||
      !primaryPOC.name.trim() ||
      !primaryPOC.email.trim() ||
      !primaryPOC.phone.trim()
    ) {
      alert('Please fill out all mandatory fields marked with (*), including Primary Contact Name, Email, and Phone.');
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

    // Format all contacts
    const formattedContacts: ClientContact[] = contacts.map((c, idx) => ({
      id: c.id || `CON-${Date.now().toString().slice(-4)}-${idx + 1}`,
      name: c.name.trim() || `POC ${idx + 1}`,
      designation: c.designation.trim() || 'Key Account Contact',
      email: c.email.trim(),
      phone: c.phone.trim(),
      isPrimary: c.isPrimary,
    }));

    addClient({
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
      contacts: formattedContacts,
      notes: formData.notes || `Created in Master Directory on ${new Date().toISOString().slice(0, 10)}`,
    });

    closeModal();
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content-box" style={{ maxWidth: '780px', maxHeight: '92vh' }} onClick={(e) => e.stopPropagation()}>
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
              <Building size={20} />
            </div>
            <div>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Add Corporate Client
              </span>
              <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                Onboard new enterprise client with multiple points of contact (POCs) &amp; designations
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
                  Client Code (Auto-generated by System):
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
                {autoClientCode}
              </span>
            </div>

            {/* Mandatory Fields Group */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#0f172a' }}>
                Mandatory Company Information
              </span>
              <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700 }}>(* Required)</span>
            </div>

            {/* 1. Client Name */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ fontWeight: 700, fontSize: '12.5px', color: '#1e293b' }}>
                Client / Company Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. ABC Manufacturing Ltd / Tata Advanced Systems"
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
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: 700, fontSize: '12.5px', color: '#1e293b' }}>
                Account Owner (BD Manager) <span style={{ color: '#dc2626' }}>*</span>
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

            {/* ─── MULTIPLE POINTS OF CONTACT (POCs) SECTION ───────────────── */}
            <div
              style={{
                margin: '20px 0 14px 0',
                borderTop: '2px solid #e2e8f0',
                paddingTop: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={16} style={{ color: '#0284c7' }} />
                    <strong style={{ fontSize: '13px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Points of Contact (POCs) at Client End
                    </strong>
                    <span className="pill-badge" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}>
                      {contacts.length} {contacts.length === 1 ? 'Contact' : 'Contacts'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                    Add multiple client stakeholders with their designations, emails, and contact numbers.
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={handleAddContact}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#0284c7',
                    background: '#f0f9ff',
                    borderColor: '#bae6fd',
                    fontWeight: 700,
                  }}
                >
                  <Plus size={13} />
                  <span>+ Add Another POC</span>
                </button>
              </div>

              {/* Contacts List Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {contacts.map((contact, idx) => {
                  const isPrimary = contact.isPrimary;

                  return (
                    <div
                      key={contact.id || idx}
                      style={{
                        background: isPrimary ? '#f8fafc' : '#ffffff',
                        border: `1.5px solid ${isPrimary ? '#0284c7' : '#e2e8f0'}`,
                        borderRadius: '8px',
                        padding: '14px',
                        position: 'relative',
                        boxShadow: isPrimary ? '0 1px 4px rgba(2, 132, 199, 0.12)' : 'none',
                      }}
                    >
                      {/* Header row of contact card */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 800,
                              color: isPrimary ? '#0284c7' : '#475569',
                              background: isPrimary ? '#e0f2fe' : '#f1f5f9',
                              padding: '2px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            POC #{idx + 1}
                          </span>

                          {isPrimary ? (
                            <span
                              className="pill-badge"
                              style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontWeight: 700, fontSize: '11px' }}
                            >
                              ★ Primary Contact
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryContact(idx)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#0284c7',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                padding: 0,
                              }}
                            >
                              Make Primary Contact
                            </button>
                          )}
                        </div>

                        {contacts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveContact(idx)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#dc2626',
                              cursor: 'pointer',
                              padding: '2px 6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                            }}
                            title="Remove this contact"
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      {/* Contact Fields Grid */}
                      <div className="form-grid-2" style={{ marginBottom: '10px' }}>
                        <div className="form-group">
                          <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                            Full Name {isPrimary && <span style={{ color: '#dc2626' }}>*</span>}
                          </label>
                          <input
                            type="text"
                            required={isPrimary}
                            className="form-control"
                            placeholder="e.g. Rajesh Kulkarni"
                            value={contact.name}
                            onChange={(e) => handleContactChange(idx, 'name', e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                            Designation / Role {isPrimary && <span style={{ color: '#dc2626' }}>*</span>}
                          </label>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input
                              type="text"
                              required={isPrimary}
                              className="form-control"
                              placeholder="e.g. VP Procurement"
                              value={contact.designation}
                              onChange={(e) => handleContactChange(idx, 'designation', e.target.value)}
                              list={`designation-suggestions-${idx}`}
                            />
                            <datalist id={`designation-suggestions-${idx}`}>
                              {DESIGNATION_PRESETS.map((d) => (
                                <option key={d} value={d} />
                              ))}
                            </datalist>
                          </div>
                        </div>
                      </div>

                      <div className="form-grid-2">
                        <div className="form-group">
                          <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                            Email Address {isPrimary && <span style={{ color: '#dc2626' }}>*</span>}
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="email"
                              required={isPrimary}
                              className="form-control"
                              placeholder="e.g. rajesh.k@company.com"
                              value={contact.email}
                              onChange={(e) => handleContactChange(idx, 'email', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                            Phone / Mobile Number {isPrimary && <span style={{ color: '#dc2626' }}>*</span>}
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="tel"
                              required={isPrimary}
                              className="form-control"
                              placeholder="e.g. +91 98231 44550"
                              value={contact.phone}
                              onChange={(e) => handleContactChange(idx, 'phone', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Collapsible / Optional Fields Section */}
            <div style={{ marginTop: '16px', borderTop: '1px dashed #e2e8f0', paddingTop: '12px' }}>
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
                <span>{showOptionalFields ? '▲ Hide Additional Company Metadata' : '▼ Show Additional Metadata (Client Tier, Turnover, Address, Notes)'}</span>
              </button>

              {showOptionalFields && (
                <div style={{ marginTop: '12px', padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
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
                      <label style={{ fontSize: '11.5px', color: '#64748b' }}>Employee Headcount</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.employees}
                        onChange={(e) => setFormData({ ...formData, employees: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '11.5px', color: '#64748b' }}>Registered Address / Facility</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. MIDC Chakan Phase II, Pune"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '11.5px', color: '#64748b' }}>Account Notes</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Special relationship requirements, SLA commitments..."
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
              <span>Save &amp; Onboard Client ({contacts.length} {contacts.length === 1 ? 'POC' : 'POCs'})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


