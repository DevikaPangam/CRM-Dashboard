import React, { useState, useMemo } from 'react';
import {
  Workflow, Plus, CheckCircle, XCircle, Clock, Trash2, Search
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useRBAC } from '../../context/RBACContext';
import { formatDate, getPriorityBadgeClass } from '../../utils/formatters';
import { DEPARTMENTS } from '../../utils/seedData';
import { scopeRecordsByUserRole } from '../../utils/rbacPermissions';

export const InternalTab: React.FC = () => {
  const { internalTasks, updateTaskStatus, deleteInternalTask, openModal, currentUser } = useCRM();
  const { currentRole } = useRBAC();

  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [localSearch, setLocalSearch] = useState('');

  const scopedTasks = useMemo(() => {
    return scopeRecordsByUserRole(internalTasks, currentUser, currentRole, 'assignedTo');
  }, [internalTasks, currentUser, currentRole]);

  const filteredTasks = scopedTasks.filter((t) => {
    if (deptFilter !== 'All' && t.department !== deptFilter) return false;
    if (statusFilter !== 'All' && t.status !== statusFilter) return false;
    if (localSearch) {
      const q = localSearch.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDetails = t.requestDetails.toLowerCase().includes(q);
      const matchClient = (t.clientName || '').toLowerCase().includes(q);
      return matchTitle || matchDetails || matchClient;
    }
    return true;
  });

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
            Internal Cross-Department BD Coordination &amp; Approvals
          </h2>
          <p style={{ fontSize: '12.5px', color: '#64748b' }}>
            Operations feasibility, CFO margin approvals, legal compliance checks, and fleet provisioning
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => openModal('addInternal')}>
          <Plus size={15} />
          <span>+ Log Internal Task</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-toolbar">
        <div className="filter-group">
          <div className="filter-item">
            <Search size={14} style={{ color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search internal requests..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              style={{ width: '220px' }}
            />
          </div>

          <div className="filter-item">
            <label>Department:</label>
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="All">All Departments</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Status:</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
          {filteredTasks.length} Workflows
        </span>
      </div>

      {/* Tasks List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
        {filteredTasks.map((task) => {
          const priority = getPriorityBadgeClass(task.priority);

          return (
            <div
              key={task.id}
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 22px',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      className="pill-badge"
                      style={{ background: '#f8fafc', color: '#0284c7', border: '1px solid #bae6fd', fontWeight: 700 }}
                    >
                      {task.department}
                    </span>
                    <span
                      className="pill-badge"
                      style={{ background: priority.bg, color: priority.text, fontWeight: 700 }}
                    >
                      {task.priority}
                    </span>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{task.title}</strong>
                  </div>

                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                    {task.clientName && <span>Client: <strong>{task.clientName}</strong> • </span>}
                    Assigned to: <strong style={{ color: '#0f172a' }}>{task.assignedTo}</strong> (Requested by {task.assignedBy})
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    className="pill-badge"
                    style={{
                      background:
                        task.status === 'Approved' || task.status === 'Completed'
                          ? '#dcfce7'
                          : task.status === 'Rejected'
                          ? '#fee2e2'
                          : '#fef3c7',
                      color:
                        task.status === 'Approved' || task.status === 'Completed'
                          ? '#16a34a'
                          : task.status === 'Rejected'
                          ? '#dc2626'
                          : '#d97706',
                      fontWeight: 700,
                    }}
                  >
                    {task.status}
                  </span>
                  <button
                    className="btn btn-secondary btn-xs"
                    style={{ color: '#dc2626' }}
                    onClick={() => deleteInternalTask(task.id)}
                    title="Delete Task"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Request Details */}
              <div
                style={{
                  background: '#f8fafc',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '12.5px',
                  color: '#334155',
                  marginBottom: '10px',
                }}
              >
                {task.requestDetails}
              </div>

              {/* Response / Notes or Approval Remarks if present */}
              {(task.responseNotes || task.approvalRemarks) && (
                <div
                  style={{
                    background: task.status === 'Rejected' ? '#fef2f2' : task.status === 'Approved' ? '#f0fdf4' : '#f8fafc',
                    borderLeft: `3px solid ${task.status === 'Rejected' ? '#ef4444' : task.status === 'Approved' ? '#10b981' : '#3b82f6'}`,
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: '#1e293b',
                    marginBottom: '10px',
                    borderRadius: '0 6px 6px 0',
                  }}
                >
                  <strong style={{ color: task.status === 'Rejected' ? '#dc2626' : task.status === 'Approved' ? '#16a34a' : '#0284c7' }}>
                    {task.status === 'Rejected' ? '❌ Rejection Remarks:' : task.status === 'Approved' ? '✅ Approval Conditions & Remarks:' : 'Resolution Notes:'}
                  </strong>{' '}
                  {task.approvalRemarks || task.responseNotes}
                </div>
              )}

              {/* Status Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748b' }}>
                <div>Due Date: <strong>{formatDate(task.dueDate)}</strong></div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {task.status === 'Pending' ? (
                    <>
                      <button
                        className="btn btn-success btn-xs"
                        onClick={() => openModal('approvalModal', { type: 'task', item: task })}
                      >
                        <CheckCircle size={11} />
                        <span>Approve / Reject with Remarks</span>
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn btn-secondary btn-xs"
                      onClick={() => openModal('approvalModal', { type: 'task', item: task })}
                    >
                      <span>Update Remarks / Status</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
