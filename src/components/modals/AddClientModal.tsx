import React, { useState } from 'react';
import {
  X, Building, ShieldCheck, Sparkles, Plus, Trash2, User, Phone, Mail, Award, CheckCircle2,
  Truck, FileText, Upload, Calendar, DollarSign, Clock, MapPin, Paperclip, Download
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { INDUSTRIES, FLEET_SEATER_CAPACITIES, SHIFT_FORMAT_PRESETS, BILLING_FREQUENCIES } from '../../utils/seedData';
import { ClientType, ClientStatus, ClientContact, DeployedFleetContract, FleetSeaterCapacity, BillingFrequency } from '../../types/crm';

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
  const { closeModal, addClient, clients, segments, teamMembers, currentUser } = useCRM();
  const isAdmin = currentUser.role === 'System Administrator' || currentUser.role_name === 'super_admin';

  // Next auto-generated client code
  const autoClientCode = `CLT-${clients.length + 1001}`;

  // Mandatory client information state
  const [formData, setFormData] = useState({
    name: '',
    industry: INDUSTRIES[0] || 'Manufacturing & Heavy Industry',
    segment: segments[0]?.name || 'Employee Transportation',
    city: '',
    status: 'Active' as ClientStatus,
    accountOwner: 'Devika Pangam',

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

  // Existing Business / Deployed Fleets
  const [deployedFleets, setDeployedFleets] = useState<DeployedFleetContract[]>([]);

  // Agreement Document State
  const [agreementDocName, setAgreementDocName] = useState<string>('');
  const [agreementDocSize, setAgreementDocSize] = useState<string>('');
  const [agreementDocDate, setAgreementDocDate] = useState<string>('');

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

  // Add Deployed Fleet Handler
  const handleAddFleet = () => {
    const newFleet: DeployedFleetContract = {
      id: `FLT-${Date.now().toString().slice(-4)}`,
      seaterCapacity: '17 Seater – AC',
      vehicleCount: 1,
      shiftFormat: 'General Shift (9:00 AM - 6:00 PM)',
      location: formData.city || 'Client Site / Hub',
      monthlyRatePerVehicleINR: 65000,
      totalMonthlyBillingINR: 65000,
      billingFrequency: 'Monthly',
      extraKmRateINR: 18,
      extraHourRateINR: 120,
      tollParking: 'Inclusive',
      contractStartDate: new Date().toISOString().split('T')[0],
      contractEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Active',
      agreementDocumentName: agreementDocName || '',
      agreementDocumentSize: agreementDocSize || '',
      agreementUploadDate: agreementDocDate || new Date().toISOString().split('T')[0],
    };
    setDeployedFleets([...deployedFleets, newFleet]);
  };

  // Remove Deployed Fleet Handler
  const handleRemoveFleet = (index: number) => {
    setDeployedFleets(deployedFleets.filter((_, i) => i !== index));
  };

  // Update Fleet Field
  const handleFleetChange = (index: number, field: keyof DeployedFleetContract, value: any) => {
    setDeployedFleets(
      deployedFleets.map((fleet, i) => {
        if (i === index) {
          const updated = { ...fleet, [field]: value };
          if (field === 'vehicleCount' || field === 'monthlyRatePerVehicleINR') {
            const count = field === 'vehicleCount' ? Number(value) : fleet.vehicleCount;
            const rate = field === 'monthlyRatePerVehicleINR' ? Number(value) : fleet.monthlyRatePerVehicleINR;
            updated.totalMonthlyBillingINR = (count || 0) * (rate || 0);
          }
          return updated;
        }
        return fleet;
      })
    );
  };

  // Handle Agreement Document File Upload
  const handleAgreementUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      const today = new Date().toISOString().split('T')[0];
      setAgreementDocName(file.name);
      setAgreementDocSize(sizeStr);
      setAgreementDocDate(today);

      setDeployedFleets(
        deployedFleets.map((f) => ({
          ...f,
          agreementDocumentName: file.name,
          agreementDocumentSize: sizeStr,
          agreementUploadDate: today,
        }))
      );
    }
  };

  const totalDeployedVehicles = deployedFleets.reduce((sum, f) => sum + (Number(f.vehicleCount) || 0), 0);
  const totalMonthlyBilling = deployedFleets.reduce((sum, f) => sum + (Number(f.totalMonthlyBillingINR) || 0), 0);

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
      designation: c.designation.trim() || 'Key Contact Person',
      email: c.email.trim(),
      phone: c.phone.trim(),
      isPrimary: c.isPrimary,
    }));

    addClient({
      name: formData.name.trim(),
      clientType: deployedFleets.length > 0 ? 'Existing Client' : formData.clientType,
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
      deployedFleets: deployedFleets,
      agreementDocumentName: agreementDocName,
      agreementDocumentSize: agreementDocSize,
      agreementUploadDate: agreementDocDate,
      notes: formData.notes,
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
                Account Owner (BD Manager) {!isAdmin && '(System Admin Only)'} <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                required
                className="form-control"
                value={formData.accountOwner}
                disabled={!isAdmin}
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
            {/* ==========================================================================
                Active Contracts, Deployed Fleet & Agreement Documents Section (Existing Business)
                ========================================================================== */}
            <div
              style={{
                marginTop: '22px',
                padding: '16px',
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: '10px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                  marginBottom: '14px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: '#fef3c7',
                      color: '#b45309',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Truck size={17} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Existing Business: Deployed Fleets &amp; Contracts
                    </h4>
                    <p style={{ fontSize: '11.5px', color: '#64748b', margin: '2px 0 0 0' }}>
                      Seater capacity fleets deployed at client site in different shift formats with commercials &amp; agreement
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {deployedFleets.length > 0 && (
                    <>
                      <span
                        className="pill-badge"
                        style={{ background: '#e0f2fe', color: '#0284c7', fontWeight: 700, fontSize: '11.5px' }}
                      >
                        🚍 {totalDeployedVehicles} Total Fleets
                      </span>
                      <span
                        className="pill-badge"
                        style={{ background: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '11.5px' }}
                      >
                        💰 ₹{(totalMonthlyBilling / 100000).toFixed(2)} L/mo Total
                      </span>
                    </>
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={handleAddFleet}
                    style={{
                      background: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Plus size={13} />
                    <span>+ Add Deployed Fleet</span>
                  </button>
                </div>
              </div>

              {/* Master Agreement Document Upload Card */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px dashed #94a3b8',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: agreementDocName ? '#dcfce7' : '#e2e8f0',
                        color: agreementDocName ? '#16a34a' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Paperclip size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
                        {agreementDocName ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{agreementDocName}</span>
                            <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>
                              ✓ Uploaded ({agreementDocSize || 'Active'})
                            </span>
                          </span>
                        ) : (
                          'Upload Client Agreement / Contract Document'
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {agreementDocDate ? `Uploaded on ${agreementDocDate} • PDF / Scanned Copy` : 'Upload signed MSA, Rate Card Addendum or Service Agreement'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label
                      className="btn btn-secondary btn-xs"
                      style={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontWeight: 600,
                        background: '#ffffff',
                      }}
                    >
                      <Upload size={12} />
                      <span>{agreementDocName ? 'Replace Document' : 'Upload Agreement (PDF)'}</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        style={{ display: 'none' }}
                        onChange={handleAgreementUpload}
                      />
                    </label>

                    {agreementDocName && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => alert(`Opening document preview for: ${agreementDocName}`)}
                        title="View / Download Agreement"
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Download size={12} />
                        <span>Preview</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Deployed Fleet List */}
              {deployedFleets.length === 0 ? (
                <div
                  style={{
                    padding: '24px 16px',
                    textAlign: 'center',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <Truck size={28} style={{ color: '#94a3b8', margin: '0 auto 8px auto' }} />
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#475569', margin: 0 }}>
                    No deployed fleets recorded yet (Optional for new prospects)
                  </p>
                  <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: '4px 0 12px 0' }}>
                    If this is an existing client with deployed vehicles, click below to add seater capacity, shift formats &amp; commercials
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={handleAddFleet}
                    style={{ background: '#0284c7', color: '#ffffff', border: 'none', fontWeight: 700 }}
                  >
                    <Plus size={13} />
                    <span>+ Add Deployed Fleet Contract</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {deployedFleets.map((fleet, fIdx) => (
                    <div
                      key={fleet.id || fIdx}
                      style={{
                        padding: '14px 16px',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        position: 'relative',
                      }}
                    >
                      {/* Top Fleet Header */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '12px',
                          paddingBottom: '8px',
                          borderBottom: '1px dashed #e2e8f0',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              background: '#0284c7',
                              color: '#ffffff',
                              fontSize: '11px',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {fIdx + 1}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                            {fleet.seaterCapacity} • {fleet.vehicleCount} {fleet.vehicleCount === 1 ? 'Vehicle' : 'Vehicles'}
                          </span>
                          <span
                            className="pill-badge"
                            style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '10.5px', fontWeight: 700 }}
                          >
                            Billing: {fleet.billingFrequency}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#16a34a' }}>
                            ₹{(fleet.totalMonthlyBillingINR || 0).toLocaleString('en-IN')} / mo
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFleet(fIdx)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#dc2626',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                            }}
                            title="Remove this deployed fleet"
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>

                      {/* Row 1: Seater Capacity, Vehicle Count, Shift Format, Deployed Location */}
                      <div className="form-grid-2" style={{ marginBottom: '10px' }}>
                        <div className="form-group">
                          <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>
                            Seater Capacity Fleet <span style={{ color: '#dc2626' }}>*</span>
                          </label>
                          <select
                            className="form-control"
                            style={{ fontWeight: 600 }}
                            value={fleet.seaterCapacity}
                            onChange={(e) => handleFleetChange(fIdx, 'seaterCapacity', e.target.value as FleetSeaterCapacity)}
                          >
                            {FLEET_SEATER_CAPACITIES.map((cap) => (
                              <option key={cap} value={cap}>
                                {cap}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>
                            Deployed Quantity (Vehicles) <span style={{ color: '#dc2626' }}>*</span>
                          </label>
                          <input
                            type="number"
                            min={1}
                            className="form-control"
                            value={fleet.vehicleCount}
                            onChange={(e) => handleFleetChange(fIdx, 'vehicleCount', Math.max(1, Number(e.target.value)))}
                          />
                        </div>
                      </div>

                      {/* Row 2: Shift Format & Location */}
                      <div className="form-grid-2" style={{ marginBottom: '10px' }}>
                        <div className="form-group">
                          <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>
                            Shift Format &amp; Roster <span style={{ color: '#dc2626' }}>*</span>
                          </label>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g. General Shift (9 AM - 6 PM)"
                              value={fleet.shiftFormat}
                              onChange={(e) => handleFleetChange(fIdx, 'shiftFormat', e.target.value)}
                              list={`add-shift-presets-${fIdx}`}
                            />
                            <datalist id={`add-shift-presets-${fIdx}`}>
                              {SHIFT_FORMAT_PRESETS.map((s) => (
                                <option key={s} value={s} />
                              ))}
                            </datalist>
                          </div>
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>
                            Deployed Location / Client Plant / Hub
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. Pune Chakan Plant / Bengaluru Campus"
                            value={fleet.location}
                            onChange={(e) => handleFleetChange(fIdx, 'location', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Row 3: Commercials & Billing Frequency */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                          gap: '10px',
                          marginBottom: '10px',
                          background: '#ffffff',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <div className="form-group">
                          <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>
                            Billing Frequency <span style={{ color: '#dc2626' }}>*</span>
                          </label>
                          <select
                            className="form-control"
                            style={{ fontWeight: 700, color: '#0284c7' }}
                            value={fleet.billingFrequency}
                            onChange={(e) => handleFleetChange(fIdx, 'billingFrequency', e.target.value as BillingFrequency)}
                          >
                            {BILLING_FREQUENCIES.map((freq) => (
                              <option key={freq} value={freq}>
                                {freq}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>
                            Monthly Rate / Vehicle (₹)
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={fleet.monthlyRatePerVehicleINR}
                            onChange={(e) => handleFleetChange(fIdx, 'monthlyRatePerVehicleINR', Number(e.target.value))}
                          />
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>
                            Total Monthly Billing (₹)
                          </label>
                          <input
                            type="number"
                            disabled
                            className="form-control"
                            style={{ background: '#f8fafc', fontWeight: 800, color: '#16a34a' }}
                            value={fleet.totalMonthlyBillingINR}
                          />
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>
                            Extra KM Rate (₹/KM)
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={fleet.extraKmRateINR || 0}
                            onChange={(e) => handleFleetChange(fIdx, 'extraKmRateINR', Number(e.target.value))}
                          />
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>
                            Extra Hr Rate (₹/Hr)
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={fleet.extraHourRateINR || 0}
                            onChange={(e) => handleFleetChange(fIdx, 'extraHourRateINR', Number(e.target.value))}
                          />
                        </div>
                      </div>

                      {/* Row 4: Dates & Status */}
                      <div className="form-grid-2">
                        <div className="form-group">
                          <label style={{ fontSize: '11px', color: '#64748b' }}>Contract Start Date</label>
                          <input
                            type="date"
                            className="form-control"
                            value={fleet.contractStartDate || ''}
                            onChange={(e) => handleFleetChange(fIdx, 'contractStartDate', e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: '11px', color: '#64748b' }}>Contract End / Renewal Date</label>
                          <input
                            type="date"
                            className="form-control"
                            value={fleet.contractEndDate || ''}
                            onChange={(e) => handleFleetChange(fIdx, 'contractEndDate', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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


