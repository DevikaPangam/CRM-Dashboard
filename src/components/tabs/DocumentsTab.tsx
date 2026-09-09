import React, { useState } from 'react';
import {
  FileText, Upload, Edit2, Trash2, Download, Search, Filter, Tag, Check, Calendar, Eye, X
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatters';
import { PIPELINE_STAGES, DOCUMENT_TYPES } from '../../utils/seedData';
import { storageService } from '../../services/storageService';
import { logAuditEvent } from '../../services/auditService';

export const DocumentsTab: React.FC = () => {
  const { documents, deleteDocument, openModal, currentUser } = useCRM();
  const { profile, authUser } = useAuth();

  const [stageFilter, setStageFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [localSearch, setLocalSearch] = useState('');
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);

  const orgId = profile?.organization_id || '00000000-0000-0000-0000-000000000001';

  const filteredDocs = documents.filter((doc) => {
    if (stageFilter !== 'All' && doc.stage !== stageFilter) return false;
    if (typeFilter !== 'All' && doc.documentType !== typeFilter) return false;
    if (localSearch) {
      const q = localSearch.toLowerCase();
      const matchName = doc.name.toLowerCase().includes(q);
      const matchClient = (doc.clientName || '').toLowerCase().includes(q);
      const matchOpp = (doc.opportunityTitle || '').toLowerCase().includes(q);
      return matchName || matchClient || matchOpp;
    }
    return true;
  });

  const getFileIconColor = (ext: string) => {
    const e = ext.toLowerCase();
    if (e.includes('pdf')) return '#ef4444';
    if (e.includes('xls') || e.includes('csv')) return '#10b981';
    if (e.includes('doc')) return '#2563eb';
    if (e.includes('ppt')) return '#f59e0b';
    return '#8b5cf6';
  };

  const handleViewDocument = async (doc: any) => {
    setViewingDoc(doc);
    await logAuditEvent({
      organizationId: orgId,
      userId: authUser?.id,
      userName: profile?.full_name || currentUser?.name || 'Devika Pangam',
      action: 'DOCUMENT_VIEWED',
      entityType: 'documents',
      entityId: doc.id,
      metadata: {
        documentName: doc.name,
        documentType: doc.documentType,
        stage: doc.stage,
        clientName: doc.clientName,
      },
    });
  };

  const handleDownload = async (doc: any) => {
    await logAuditEvent({
      organizationId: orgId,
      userId: authUser?.id,
      userName: profile?.full_name || currentUser?.name || 'Devika Pangam',
      action: 'DOCUMENT_DOWNLOADED',
      entityType: 'documents',
      entityId: doc.id,
      metadata: {
        documentName: doc.name,
        documentType: doc.documentType,
        fileSize: doc.fileSize,
        clientName: doc.clientName,
      },
    });

    if (doc.filePath) {
      try {
        const res = await storageService.getSignedDownloadUrl(doc.filePath, 300);
        if (res.success && res.signedUrl) {
          window.open(res.signedUrl, '_blank');
          return;
        }
      } catch (err) {
        console.warn('Could not generate signed URL, falling back:', err);
      }
    }

    const dummyContent = `===================================================================\nRAJ MUDRA GROUP - REPOSITORY DOCUMENT SUMMARY\n===================================================================\nDocument Name: ${doc.name}\nPipeline Stage: ${doc.stage}\nDocument Type: ${doc.documentType}\nClient Name: ${doc.clientName || 'N/A'}\nOpportunity: ${doc.opportunityTitle || 'N/A'}\nUploaded By: ${doc.uploadedBy || 'N/A'} on ${doc.uploadedDate || 'N/A'}\nNotes: ${doc.notes || 'N/A'}\n===================================================================`;
    const blob = new Blob([dummyContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
            Pipeline Stage Documents &amp; Proposal Attachments
          </h2>
          <p style={{ fontSize: '12.5px', color: '#64748b' }}>
            Central repository of stage-wise documents • Edit filenames, update stage associations, and manage commercial proposals
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => openModal('uploadDoc')}>
          <Upload size={15} />
          <span>+ Upload &amp; Tag Document</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-toolbar">
        <div className="filter-group">
          <div className="filter-item">
            <Search size={14} style={{ color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search file name, client, opportunity..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              style={{ width: '240px' }}
            />
          </div>

          <div className="filter-item">
            <label>Pipeline Stage:</label>
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
              <option value="All">All Pipeline Stages</option>
              {PIPELINE_STAGES.map((stg) => (
                <option key={stg} value={stg}>
                  {stg}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Document Type:</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="All">All Categories</option>
              {DOCUMENT_TYPES.map((dt) => (
                <option key={dt} value={dt}>
                  {dt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
          {filteredDocs.length} Documents Across Stages
        </span>
      </div>

      {/* Documents Table with Horizontal & Vertical Scroll Protection */}
      <div className="table-card">
        <div className="table-header-bar">
          <div className="table-title">Attached Stage Files &amp; Proposals</div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>File Name &amp; Format</th>
                <th>Associated Pipeline Stage</th>
                <th>Document Category</th>
                <th>Client / Opportunity</th>
                <th>File Size</th>
                <th>Uploaded By &amp; Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((doc) => {
                const iconColor = getFileIconColor(doc.fileExtension || 'pdf');

                return (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            background: '#f8fafc',
                            border: `1px solid ${iconColor}40`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: iconColor,
                            fontWeight: 800,
                            fontSize: '11px',
                          }}
                        >
                          {(doc.fileExtension || 'PDF').toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{doc.name}</div>
                          {doc.notes && (
                            <div style={{ fontSize: '11px', color: '#64748b', maxWidth: '280px' }}>
                              {doc.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className="pill-badge"
                        style={{
                          background: doc.stage.includes('Won') ? '#dcfce7' : '#eff6ff',
                          color: doc.stage.includes('Won') ? '#16a34a' : '#2563eb',
                          fontWeight: 700,
                        }}
                      >
                        {doc.stage}
                      </span>
                    </td>
                    <td>
                      <span className="pill-badge" style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>
                        {doc.documentType}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{doc.clientName || 'General Account'}</div>
                      {doc.opportunityTitle && (
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{doc.opportunityTitle}</div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#64748b' }}>
                        {doc.fileSize}
                      </span>
                    </td>
                    <td>
                      <div>{doc.uploadedBy}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{formatDate(doc.uploadedDate)}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={() => handleViewDocument(doc)}
                          title="View / Preview Document"
                        >
                          <Eye size={12} style={{ color: '#0284c7' }} />
                          <span>View</span>
                        </button>
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={() => openModal('editDoc', doc)}
                          title="Edit File Name & Stage"
                        >
                          <Edit2 size={12} style={{ color: '#64748b' }} />
                          <span>Edit</span>
                        </button>
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={() => handleDownload(doc)}
                          title="Download File"
                        >
                          <Download size={12} style={{ color: '#16a34a' }} />
                        </button>
                        <button
                          className="btn btn-secondary btn-xs"
                          style={{ color: '#dc2626' }}
                          onClick={() => {
                            if (window.confirm(`Delete document "${doc.name}"?`)) {
                              deleteDocument(doc.id);
                            }
                          }}
                          title="Delete Document"
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

      {/* DOCUMENT PREVIEW MODAL */}
      {viewingDoc && (
        <div className="modal-overlay" onClick={() => setViewingDoc(null)}>
          <div className="modal-content-box" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-section" style={{ background: '#f0f9ff', borderBottom: '1px solid #bae6fd' }}>
              <div className="modal-header-title">
                <FileText size={18} style={{ color: '#0284c7' }} />
                <span style={{ color: '#0369a1' }}>Document Preview: {viewingDoc.name}</span>
              </div>
              <button className="modal-close-btn" onClick={() => setViewingDoc(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-section" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{viewingDoc.name}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Category: <strong>{viewingDoc.documentType}</strong> • Stage: <strong>{viewingDoc.stage}</strong>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Client Name:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{viewingDoc.clientName || 'General Account'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Opportunity Title:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{viewingDoc.opportunityTitle || 'N/A'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Uploaded By:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{viewingDoc.uploadedBy}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>File Size:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{viewingDoc.fileSize}</div>
                </div>
              </div>

              {viewingDoc.notes && (
                <div style={{ background: '#fffbeb', border: '1px solid #fef08a', borderRadius: '6px', padding: '10px', fontSize: '12px', color: '#92400e' }}>
                  <strong>Notes:</strong> {viewingDoc.notes}
                </div>
              )}
            </div>

            <div className="modal-footer-section">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleDownload(viewingDoc)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a' }}
              >
                <Download size={14} />
                <span>Download File</span>
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setViewingDoc(null)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
