import React, { useState, useEffect } from 'react';
import {
  X, TrendingUp, Calendar, Award, Shield, Briefcase, MapPin, Users,
  CheckCircle2, AlertCircle, FileText, Check, ChevronRight, Sparkles
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { EmployeeEventType, EmployeeHistoryEvent, User as CRMUser } from '../../types/crm';
import { addCareerHistoryEvent } from '../../services/careerHistoryService';

export const AddCareerEventModal: React.FC = () => {
  const { activeModal, closeModal, users, currentUser } = useCRM();
  const { profile } = useAuth();

  const employee: CRMUser | undefined = activeModal.data?.employee || users.find(u => u.id === activeModal.data?.employeeId);

  const [eventType, setEventType] = useState<EmployeeEventType>('promotion');
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Structured transition fields
  const [designationBefore, setDesignationBefore] = useState<string>('');
  const [designationAfter, setDesignationAfter] = useState<string>('');
  const [departmentBefore, setDepartmentBefore] = useState<string>('');
  const [departmentAfter, setDepartmentAfter] = useState<string>('');
  const [teamBefore, setTeamBefore] = useState<string>('');
  const [teamAfter, setTeamAfter] = useState<string>('');
  const [regionBefore, setRegionBefore] = useState<string>('');
  const [regionAfter, setRegionAfter] = useState<string>('');
  const [managerBefore, setManagerBefore] = useState<string>('');
  const [managerAfter, setManagerAfter] = useState<string>('');
  const [locationBefore, setLocationBefore] = useState<string>('');
  const [locationAfter, setLocationAfter] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize previous fields from current employee state
  useEffect(() => {
    if (employee) {
      setDesignationBefore(employee.designation || 'BD Executive');
      setDepartmentBefore(employee.department || 'Business Development');
      setTeamBefore(employee.team_name || 'Enterprise BD West');
      setRegionBefore(employee.region || 'West Region');
      setManagerBefore(employee.manager_name || 'Devika Pangam');
      setLocationBefore(employee.location || 'Corporate HQ - Mumbai');
    }
  }, [employee]);

  // Update default title when event type changes
  useEffect(() => {
    switch (eventType) {
      case 'promotion':
        setTitle(`Promoted to ${designationAfter || 'Senior BD Executive'}`);
        break;
      case 'designation_change':
        setTitle(`Designation Updated to ${designationAfter || 'New Title'}`);
        break;
      case 'department_change':
        setTitle(`Transferred to ${departmentAfter || 'Department'}`);
        break;
      case 'team_change':
        setTitle(`Assigned to ${teamAfter || 'New Team'}`);
        break;
      case 'region_change':
        setTitle(`Territory Transferred to ${regionAfter || 'New Region'}`);
        break;
      case 'manager_change':
        setTitle(`Reporting Manager Reassigned to ${managerAfter || 'Manager'}`);
        break;
      case 'location_change':
        setTitle(`Base Location Relocated to ${locationAfter || 'Branch'}`);
        break;
      case 'responsibility_change':
        setTitle('Regional Territory Leadership Assignment');
        break;
      case 'achievement':
        setTitle('Special Commercial Achievement');
        break;
      case 'award':
        setTitle('Annual Excellence Award');
        break;
      case 'training':
        setTitle('Executive Transportation & Fleet Certification');
        break;
      case 'certification':
        setTitle('Professional CRM & Compliance Certification');
        break;
      default:
        setTitle('Career Milestone Event');
    }
  }, [eventType, designationAfter, departmentAfter, teamAfter, regionAfter, managerAfter, locationAfter]);

  if (!employee) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please enter an event title.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const authorName = profile?.full_name || currentUser.name || 'System Administrator';

      const newEvent: Omit<EmployeeHistoryEvent, 'id' | 'created_at' | 'updated_at'> = {
        employee_id: employee.id,
        organization_id: employee.organization_id,
        event_type: eventType,
        effective_date: effectiveDate,
        title: title.trim(),
        description: description.trim() || undefined,
        designation_before: designationBefore.trim() || undefined,
        designation_after: designationAfter.trim() || undefined,
        department_before: departmentBefore.trim() || undefined,
        department_after: departmentAfter.trim() || undefined,
        team_before: teamBefore.trim() || undefined,
        team_after: teamAfter.trim() || undefined,
        region_before: regionBefore.trim() || undefined,
        region_after: regionAfter.trim() || undefined,
        manager_before: managerBefore.trim() || undefined,
        manager_after: managerAfter.trim() || undefined,
        location_before: locationBefore.trim() || undefined,
        location_after: locationAfter.trim() || undefined,
        created_by: profile?.id || currentUser.id,
        created_by_name: authorName,
      };

      await addCareerHistoryEvent(newEvent, currentUser);

      setSuccessMessage('Career milestone logged successfully!');
      setTimeout(() => {
        closeModal();
        if (activeModal.data?.onSuccess) {
          activeModal.data.onSuccess();
        }
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record career event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div
        className="modal-content-box"
        style={{ maxWidth: '640px', width: '92vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="modal-header-section"
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            padding: '16px 20px',
            borderTopLeftRadius: 'var(--radius-lg)',
            borderTopRightRadius: 'var(--radius-lg)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.2)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(56, 189, 248, 0.4)'
              }}
            >
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>
                Add Career Milestone Event
              </h3>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                {employee.name} ({employee.employee_id || 'EMP-N/A'}) • {employee.designation || employee.role}
              </span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={closeModal} style={{ color: '#cbd5e1' }}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {successMessage && (
            <div
              style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#065f46',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              <CheckCircle2 size={16} /> {successMessage}
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              <AlertCircle size={16} /> {errorMessage}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            {/* Event Type */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Career Event Type <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EmployeeEventType)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  fontWeight: 600,
                  outline: 'none'
                }}
              >
                <option value="promotion">👑 Promotion / Grade Advancement</option>
                <option value="designation_change">💼 Designation / Title Change</option>
                <option value="department_change">🏢 Department Transfer</option>
                <option value="team_change">👥 Team Reassignment</option>
                <option value="region_change">🗺️ Region / Territory Transfer</option>
                <option value="manager_change">👔 Reporting Manager Reassignment</option>
                <option value="location_change">📍 Base Location Relocation</option>
                <option value="responsibility_change">⚡ Responsibility / Ownership Change</option>
                <option value="achievement">🏆 Major Commercial Achievement</option>
                <option value="award">⭐ Performance Award &amp; Recognition</option>
                <option value="training">🎓 Professional Training Completed</option>
                <option value="certification">📜 Regulatory / Industry Certification</option>
                <option value="other">📌 Other Milestone</option>
              </select>
            </div>

            {/* Effective Date */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Effective Date <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Dynamic Structured Transition Inputs based on event type */}
          {(eventType === 'promotion' || eventType === 'designation_change') && (
            <div
              style={{
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px',
                padding: '14px',
                marginBottom: '16px'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1', marginBottom: '10px' }}>
                Designation Transition Matrix
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Previous Designation</label>
                  <input
                    type="text"
                    value={designationBefore}
                    onChange={(e) => setDesignationBefore(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700 }}>New Designation *</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior BD Executive"
                    value={designationAfter}
                    onChange={(e) => setDesignationAfter(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #0284c7', fontSize: '12px', fontWeight: 600 }}
                  />
                </div>
              </div>
            </div>
          )}

          {eventType === 'department_change' && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Previous Department</label>
                  <input
                    type="text"
                    value={departmentBefore}
                    onChange={(e) => setDepartmentBefore(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700 }}>New Department *</label>
                  <input
                    type="text"
                    placeholder="e.g. Strategic Key Accounts"
                    value={departmentAfter}
                    onChange={(e) => setDepartmentAfter(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #0284c7', fontSize: '12px', fontWeight: 600 }}
                  />
                </div>
              </div>
            </div>
          )}

          {eventType === 'team_change' && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Previous Team</label>
                  <input
                    type="text"
                    value={teamBefore}
                    onChange={(e) => setTeamBefore(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700 }}>New Team *</label>
                  <input
                    type="text"
                    placeholder="e.g. Pune Enterprise BD Team"
                    value={teamAfter}
                    onChange={(e) => setTeamAfter(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #0284c7', fontSize: '12px', fontWeight: 600 }}
                  />
                </div>
              </div>
            </div>
          )}

          {eventType === 'region_change' && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Previous Region</label>
                  <input
                    type="text"
                    value={regionBefore}
                    onChange={(e) => setRegionBefore(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700 }}>New Region *</label>
                  <input
                    type="text"
                    placeholder="e.g. North Region"
                    value={regionAfter}
                    onChange={(e) => setRegionAfter(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #0284c7', fontSize: '12px', fontWeight: 600 }}
                  />
                </div>
              </div>
            </div>
          )}

          {eventType === 'manager_change' && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Previous Manager</label>
                  <input
                    type="text"
                    value={managerBefore}
                    onChange={(e) => setManagerBefore(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700 }}>New Reporting Manager *</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Shinde"
                    value={managerAfter}
                    onChange={(e) => setManagerAfter(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #0284c7', fontSize: '12px', fontWeight: 600 }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Event Title */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Milestone Headline / Title <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Promoted to Senior BD Executive"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                fontWeight: 600,
                outline: 'none'
              }}
            />
          </div>

          {/* Event Description & Remarks */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Detailed Description &amp; Authorization Remarks
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context, metrics achieved, board approval references, or project responsibilities..."
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={closeModal}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {isSubmitting ? (
                <span>Recording Milestone...</span>
              ) : (
                <>
                  <Check size={14} />
                  <span>Log Milestone Event</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
