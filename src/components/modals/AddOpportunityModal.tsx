import React, { useState } from 'react';
import { X, TrendingUp } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { PIPELINE_STAGES, LEAD_SOURCES } from '../../utils/seedData';

export const AddOpportunityModal: React.FC = () => {
  const { closeModal, addOpportunity, clients, segments, teamMembers } = useCRM();

  const [formData, setFormData] = useState({
    title: '',
    clientId: clients[0]?.id || '',
    clientName: clients[0]?.name || '',
    segment: segments[0]?.name || 'Employee Transportation',
    serviceCategory: 'Staff Transport Fleet',
    contractType: 'Annual Contract' as const,
    dealValueINR: 12000000,
    monthlyValueINR: 1000000,
    stage: 'Requirement Discussion',
    probability: 30,
    status: 'In Process' as const,
    owner: teamMembers[0]?.name || 'Rahul Sharma',
    leadSource: LEAD_SOURCES[0],
    expectedCloseDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    fleetSize: 10,
    vehicleType: 'Tempo / AC Bus',
    locations: 'Mumbai & Pune',
    competition: 'Local Transporters',
    internalApprovalsRequired: false,
    notes: '',
  });

  const handleClientChange = (clientId: string) => {
    const selected = clients.find((c) => c.id === clientId);
    setFormData((prev) => ({
      ...prev,
      clientId,
      clientName: selected ? selected.name : '',
      segment: selected ? selected.segment : prev.segment,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const selectedClient = clients.find((c) => c.id === formData.clientId);

    addOpportunity({
      title: formData.title,
      clientId: formData.clientId,
      clientName: formData.clientName,
      clientType: selectedClient?.clientType || 'New Client',
      segment: formData.segment,
      serviceCategory: formData.serviceCategory,
      contractType: formData.contractType,
      dealValueINR: Number(formData.dealValueINR) || 0,
      monthlyValueINR: Number(formData.monthlyValueINR) || 0,
      stage: formData.stage,
      probability: Number(formData.probability) || 50,
      status: formData.status,
      owner: formData.owner,
      leadSource: formData.leadSource,
      expectedCloseDate: formData.expectedCloseDate,
      nextFollowupDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      fleetSize: Number(formData.fleetSize) || 0,
      vehicleType: formData.vehicleType,
      locations: formData.locations,
      competition: formData.competition,
      internalApprovalsRequired: formData.internalApprovalsRequired,
      delegatedDepartment: 'BD',
      delegatedOwner: formData.owner,
      delegationStatus: 'Pending Action',
      delegationMilestone: 'Initial Lead Qualification & Scope Alignment',
      slaDaysRemaining: 5,
      notes: formData.notes,
    });

    closeModal();
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-section">
          <div className="modal-header-title">
            <TrendingUp size={18} style={{ color: '#16a34a' }} />
            <span>Create New Opportunity / Lead</span>
          </div>
          <button className="modal-close-btn" onClick={closeModal}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body-section">
            <div className="form-group">
              <label>Opportunity / Enquiry Title *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. Pune Tech Park 25 Bus Employee Shuttle"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Corporate Client</label>
                <select
                  className="form-control"
                  value={formData.clientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Business Segment</label>
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
                <label>Deal Value (Annual INR ₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.dealValueINR}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setFormData({
                      ...formData,
                      dealValueINR: val,
                      monthlyValueINR: Math.round(val / 12),
                    });
                  }}
                />
              </div>

              <div className="form-group">
                <label>Monthly Revenue (INR ₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.monthlyValueINR}
                  onChange={(e) => setFormData({ ...formData, monthlyValueINR: Number(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Pipeline Stage</label>
                <select
                  className="form-control"
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                >
                  {PIPELINE_STAGES.map((stg) => (
                    <option key={stg} value={stg}>
                      {stg}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Win Probability (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="form-control"
                  value={formData.probability}
                  onChange={(e) => setFormData({ ...formData, probability: Number(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>BD Owner</label>
                <select
                  className="form-control"
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                >
                  {teamMembers.map((tm) => (
                    <option key={tm.id} value={tm.name}>
                      {tm.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Expected Close Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.expectedCloseDate}
                  onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Key Scope &amp; Notes</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Details on fleet requirements, routing, key decision makers..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer-section">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success">
              Create Opportunity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
