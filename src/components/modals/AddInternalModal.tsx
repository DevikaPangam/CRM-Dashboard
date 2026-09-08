import React, { useState } from 'react';
import { X, GitPullRequest } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { DEPARTMENTS } from '../../utils/seedData';
import { InternalTask } from '../../types/crm';

export const AddInternalModal: React.FC = () => {
  const { closeModal, addInternalTask, clients, opportunities, teamMembers } = useCRM();

  const [formData, setFormData] = useState({
    title: '',
    department: DEPARTMENTS[0] as InternalTask['department'],
    clientId: clients[0]?.id || '',
    clientName: clients[0]?.name || '',
    opportunityId: '',
    opportunityTitle: '',
    assignedTo: teamMembers[0]?.name || 'Rahul Sharma',
    assignedBy: 'Devika Pangam (Admin)',
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    priority: 'High' as const,
    status: 'Pending' as const,
    requestDetails: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    addInternalTask({
      title: formData.title,
      department: formData.department,
      clientId: formData.clientId || undefined,
      clientName: formData.clientName || undefined,
      opportunityId: formData.opportunityId || undefined,
      opportunityTitle: formData.opportunityTitle || undefined,
      assignedTo: formData.assignedTo,
      assignedBy: formData.assignedBy,
      dueDate: formData.dueDate,
      priority: formData.priority,
      status: formData.status,
      requestDetails: formData.requestDetails,
    });

    closeModal();
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-section">
          <div className="modal-header-title">
            <GitPullRequest size={18} style={{ color: '#d97706' }} />
            <span>Log Cross-Department Internal Activity / Approval</span>
          </div>
          <button className="modal-close-btn" onClick={closeModal}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body-section">
            <div className="form-group">
              <label>Task / Approval Subject *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. Special electricity escalation clause approval for EV contract"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Target Department</label>
                <select
                  className="form-control"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value as any })}
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Priority Level</label>
                <select
                  className="form-control"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                >
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Related Client (Optional)</label>
                <select
                  className="form-control"
                  value={formData.clientId}
                  onChange={(e) => {
                    const c = clients.find((item) => item.id === e.target.value);
                    setFormData({
                      ...formData,
                      clientId: e.target.value,
                      clientName: c ? c.name : '',
                    });
                  }}
                >
                  <option value="">-- None / General Internal --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Assigned BD Member</label>
                <select
                  className="form-control"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                >
                  {teamMembers.map((tm) => (
                    <option key={tm.id} value={tm.name}>
                      {tm.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Requested By</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.assignedBy}
                  onChange={(e) => setFormData({ ...formData, assignedBy: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Detailed Request &amp; Requirements *</label>
              <textarea
                required
                className="form-control"
                rows={3}
                placeholder="Specific cost modeling inputs, margin approval reason, legal clauses to review..."
                value={formData.requestDetails}
                onChange={(e) => setFormData({ ...formData, requestDetails: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer-section">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Internal Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
