import React, { useState } from 'react';
import {
  Clock, CheckCircle2, AlertTriangle, Search, Trash2, Calendar
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { formatDate, getPriorityBadgeClass } from '../../utils/formatters';

export const FollowupsTab: React.FC = () => {
  const { followups, completeFollowup, deleteFollowup, openModal } = useCRM();

  const [statusFilter, setStatusFilter] = useState('All');
  const [localSearch, setLocalSearch] = useState('');

  const today = new Date().setHours(0, 0, 0, 0);

  const getComputedStatus = (f: any) => {
    if (f.status === 'Completed') return 'Completed';
    const due = new Date(f.dueDate).getTime();
    if (due < today) return 'Overdue';
    return 'Pending';
  };

  const filteredFollowups = followups.filter((f) => {
    const compStatus = getComputedStatus(f);
    if (statusFilter === 'Pending' && compStatus !== 'Pending') return false;
    if (statusFilter === 'Overdue' && compStatus !== 'Overdue') return false;
    if (statusFilter === 'Completed' && compStatus !== 'Completed') return false;
    if (localSearch) {
      const q = localSearch.toLowerCase();
      const matchClient = f.clientName.toLowerCase().includes(q);
      const matchDesc = f.description.toLowerCase().includes(q);
      const matchAssign = f.assignedTo.toLowerCase().includes(q);
      return matchClient || matchDesc || matchAssign;
    }
    return true;
  });

  const overdueCount = followups.filter((f) => getComputedStatus(f) === 'Overdue').length;

  return (
    <section>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
            Follow-up &amp; Action Item Tracker
          </h2>
          <p style={{ fontSize: '12.5px', color: '#64748b' }}>
            Never lose a lead: track scheduled proposal submissions, client reviews, and meetings
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => openModal('addFollowup')}>
          <Calendar size={15} />
          <span>+ Schedule Follow-up</span>
        </button>
      </div>

      {/* Overdue Banner if overdue items exist */}
      {overdueCount > 0 && (
        <div
          style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#991b1b',
          }}
        >
          <AlertTriangle size={20} style={{ color: '#dc2626' }} />
          <div>
            <strong style={{ fontSize: '13px' }}>Attention: You have {overdueCount} overdue follow-up action items!</strong>
            <div style={{ fontSize: '12px', color: '#b91c1c' }}>
              Please review and mark completed or reschedule with clients to keep your pipeline moving forward.
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="filter-toolbar">
        <div className="filter-group">
          <div className="filter-item">
            <Search size={14} style={{ color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search client, action item, owner..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              style={{ width: '230px' }}
            />
          </div>

          <div className="filter-item">
            <label>Status:</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Follow-ups</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue ({overdueCount})</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
          {filteredFollowups.length} Items Found
        </span>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Due Date</th>
                <th>Client / Opportunity</th>
                <th>Follow-up Type &amp; Action</th>
                <th>Priority</th>
                <th>Assigned BD Owner</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFollowups.map((fol) => {
                const compStatus = getComputedStatus(fol);
                const priorityClass = getPriorityBadgeClass(fol.priority);

                return (
                  <tr key={fol.id} style={{ opacity: compStatus === 'Completed' ? 0.7 : 1 }}>
                    <td>
                      <span
                        className="pill-badge"
                        style={{
                          background:
                            compStatus === 'Overdue'
                              ? '#fee2e2'
                              : compStatus === 'Completed'
                              ? '#dcfce7'
                              : '#fef3c7',
                          color:
                            compStatus === 'Overdue'
                              ? '#dc2626'
                              : compStatus === 'Completed'
                              ? '#16a34a'
                              : '#d97706',
                          fontWeight: 700,
                        }}
                      >
                        {compStatus === 'Overdue' ? '⚠ Overdue' : compStatus}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: compStatus === 'Overdue' ? '#dc2626' : '#0f172a' }}>
                        {formatDate(fol.dueDate)}
                      </strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{fol.clientName}</div>
                      {fol.opportunityTitle && (
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{fol.opportunityTitle}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#334155' }}>{fol.type}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{fol.description}</div>
                    </td>
                    <td>
                      <span
                        className="pill-badge"
                        style={{ background: priorityClass.bg, color: priorityClass.text, fontWeight: 700 }}
                      >
                        {fol.priority}
                      </span>
                    </td>
                    <td>{fol.assignedTo}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {compStatus !== 'Completed' ? (
                          <button
                            className="btn btn-success btn-xs"
                            onClick={() => completeFollowup(fol.id)}
                            title="Mark Completed"
                          >
                            <CheckCircle2 size={12} />
                            <span>Done</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>Completed</span>
                        )}
                        <button
                          className="btn btn-secondary btn-xs"
                          style={{ color: '#dc2626' }}
                          onClick={() => deleteFollowup(fol.id)}
                          title="Delete Follow-up"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
