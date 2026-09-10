import React, { useState } from 'react';
import { X, Clock, Calendar, User, Tag } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Followup } from '../../types/crm';

export const AddFollowupModal: React.FC = () => {
  const { closeModal, activeModal, addFollowup, clients, opportunities, teamMembers } = useCRM();

  const defaultClientId = activeModal.data?.clientId || clients[0]?.id || '';
  const defaultClient = clients.find((c) => c.id === defaultClientId) || clients[0];
  const initialOppId = activeModal.data?.opportunityId || '';
  const matchedOpp = opportunities.find((o) => o.id === initialOppId);

  const [formData, setFormData] = useState({
    clientId: defaultClient?.id || '',
    clientName: defaultClient?.name || '',
    clientType: defaultClient?.clientType || 'Existing Client',
    opportunityId: initialOppId,
    opportunityTitle: matchedOpp?.title || '',
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    assignedTo: teamMembers[0]?.name || 'Aditya Patil',
    type: 'Call' as Followup['type'],
    priority: 'Medium' as Followup['priority'],
    description: '',
  });

  const handleClientChange = (clientId: string) => {
    const selected = clients.find((c) => c.id === clientId);
    const clientOpps = opportunities.filter((o) => o.clientId === clientId);
    setFormData((prev) => ({
      ...prev,
      clientId,
      clientName: selected ? selected.name : '',
      clientType: selected?.clientType || 'Existing Client',
      opportunityId: clientOpps[0]?.id || '',
      opportunityTitle: clientOpps[0]?.title || '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) return;

    addFollowup({
      clientId: formData.clientId || undefined,
      clientName: formData.clientName || 'General Account',
      clientType: formData.clientType as any,
      opportunityId: formData.opportunityId || undefined,
      opportunityTitle: formData.opportunityTitle || undefined,
      dueDate: formData.dueDate,
      assignedTo: formData.assignedTo,
      type: formData.type,
      priority: formData.priority,
      description: formData.description.trim(),
      status: 'Pending',
    });

    closeModal();
  };

  const clientOpps = opportunities.filter((o) => o.clientId === formData.clientId);

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content-box" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-section">
          <div className="modal-header-title">
            <Clock size={18} style={{ color: '#0284c7' }} />
            <span>Schedule Follow-up / Action Item</span>
          </div>
          <button className="modal-close-btn" onClick={closeModal}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body-section">
            <div className="form-grid-2">
              <div className="form-group">
                <label>Client Account *</label>
                <select
                  className="form-control"
                  value={formData.clientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.clientType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Related Opportunity</label>
                <select
                  className="form-control"
                  value={formData.opportunityId}
                  onChange={(e) => {
                    const opp = opportunities.find((o) => o.id === e.target.value);
                    setFormData({
                      ...formData,
                      opportunityId: e.target.value,
                      opportunityTitle: opp ? opp.title : '',
                    });
                  }}
                >
                  <option value="">-- General Account Follow-up --</option>
                  {clientOpps.map((opp) => (
                    <option key={opp.id} value={opp.id}>
                      {opp.title} ({opp.code || opp.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label>Due Date *</label>
                <input
                  type="date"
                  required
                  className="form-control"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Action Type</label>
                <select
                  className="form-control"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                >
                  <option value="Call">Call</option>
                  <option value="Physical Meeting">Physical Meeting</option>
                  <option value="Proposal Submission">Proposal Submission</option>
                  <option value="Contract Review">Contract Review</option>
                  <option value="Internal Review">Internal Review</option>
                  <option value="Email Communication">Email Communication</option>
                </select>
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select
                  className="form-control"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Assigned BD Owner *</label>
              <select
                className="form-control"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              >
                {teamMembers.map((tm) => (
                  <option key={tm.id} value={tm.name}>
                    {tm.name} ({tm.title || tm.region})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Action Item Description &amp; Deliverables *</label>
              <textarea
                required
                rows={3}
                className="form-control"
                placeholder="e.g. Call client procurement lead to follow up on revised pricing quote and route feasibility study..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer-section">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Clock size={14} />
              <span>Schedule Action Item</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
