import React, { useState } from 'react';
import { X, Building } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { INDUSTRIES } from '../../utils/seedData';
import { ClientType } from '../../types/crm';

export const AddClientModal: React.FC = () => {
  const { closeModal, addClient, segments, teamMembers } = useCRM();

  const [formData, setFormData] = useState({
    name: '',
    clientType: 'New Client' as ClientType,
    industry: INDUSTRIES[0],
    segment: segments[0]?.name || 'Employee Transportation',
    city: '',
    state: '',
    region: 'West' as const,
    tier: 'Tier 1 (Enterprise)' as const,
    turnoverCr: 100,
    employees: 500,
    status: 'Active' as const,
    accountOwner: teamMembers[0]?.name || 'Rahul Sharma',
    website: '',
    address: '',
    contactName: '',
    contactDesignation: '',
    contactEmail: '',
    contactPhone: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    addClient({
      name: formData.name,
      clientType: formData.clientType,
      industry: formData.industry,
      segment: formData.segment,
      city: formData.city || 'Mumbai',
      state: formData.state || 'Maharashtra',
      region: formData.region,
      tier: formData.tier,
      turnoverCr: Number(formData.turnoverCr) || 0,
      employees: Number(formData.employees) || 0,
      status: formData.status,
      accountOwner: formData.accountOwner,
      website: formData.website,
      address: formData.address,
      contacts: [
        {
          id: `CON-${Date.now().toString().slice(-4)}`,
          name: formData.contactName || 'Primary Contact',
          designation: formData.contactDesignation || 'Manager',
          email: formData.contactEmail || '',
          phone: formData.contactPhone || '',
          isPrimary: true,
        },
      ],
      notes: formData.notes,
    });

    closeModal();
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-section">
          <div className="modal-header-title">
            <Building size={18} style={{ color: '#0284c7' }} />
            <span>Add New Corporate Client</span>
          </div>
          <button className="modal-close-btn" onClick={closeModal}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body-section">
            <div className="form-grid-2">
              <div className="form-group">
                <label>Company / Client Name *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Tata Advanced Systems Ltd"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Client Type *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: `2px solid ${formData.clientType === 'New Client' ? '#0284c7' : '#e2e8f0'}`,
                      background: formData.clientType === 'New Client' ? '#e0f2fe' : '#ffffff',
                      color: formData.clientType === 'New Client' ? '#0369a1' : '#475569',
                      fontWeight: 700,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setFormData({ ...formData, clientType: 'New Client' })}
                  >
                    + New Client
                  </button>
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: `2px solid ${formData.clientType === 'Existing Client' ? '#10b981' : '#e2e8f0'}`,
                      background: formData.clientType === 'Existing Client' ? '#ecfdf5' : '#ffffff',
                      color: formData.clientType === 'Existing Client' ? '#047857' : '#475569',
                      fontWeight: 700,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setFormData({ ...formData, clientType: 'Existing Client' })}
                  >
                    ✓ Existing Client
                  </button>
                </div>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Industry</label>
                <select
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
                <label>Primary Business Segment</label>
                <select
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

            <div className="form-grid-2">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Pune"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>State &amp; Region</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Maharashtra"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                  <select
                    className="form-control"
                    style={{ width: '110px' }}
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value as any })}
                  >
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="West">West</option>
                    <option value="East">East</option>
                    <option value="Central">Central</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Client Tier</label>
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

              <div className="form-group">
                <label>Assigned BD Owner</label>
                <select
                  className="form-control"
                  value={formData.accountOwner}
                  onChange={(e) => setFormData({ ...formData, accountOwner: e.target.value })}
                >
                  {teamMembers.map((tm) => (
                    <option key={tm.id} value={tm.name}>
                      {tm.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ margin: '16px 0 10px 0', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
              <strong style={{ fontSize: '13px', color: '#0f172a' }}>Primary Contact Details</strong>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Contact Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Ramesh Nair"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Designation</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="VP Procurement"
                  value={formData.contactDesignation}
                  onChange={(e) => setFormData({ ...formData, contactDesignation: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="r.nair@company.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Phone / Mobile</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="+91 98200 12345"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer-section">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
