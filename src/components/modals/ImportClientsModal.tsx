import React, { useState, useEffect } from 'react';
import {
  X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight,
  Download, FileText, Sparkles, Database, Save, Users
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { parseClientsFromCSV, SAMPLE_CLIENTS_CSV } from '../../utils/csvParser';
import { Client } from '../../types/crm';

export const ImportClientsModal: React.FC = () => {
  const { closeModal, importClients } = useCRM();

  const [rawCSV, setRawCSV] = useState<string>(SAMPLE_CLIENTS_CSV);
  const [defaultClientType, setDefaultClientType] = useState<'New Client' | 'Existing Client'>('Existing Client');
  const [replaceExisting, setReplaceExisting] = useState<boolean>(false);
  const [parsedClients, setParsedClients] = useState<Client[]>([]);
  const [fileName, setFileName] = useState<string>('Client_Database_Import.csv');
  const [importSuccess, setImportSuccess] = useState<boolean>(false);

  useEffect(() => {
    try {
      const parsed = parseClientsFromCSV(rawCSV, defaultClientType);
      setParsedClients(parsed);
    } catch {
      setParsedClients([]);
    }
  }, [rawCSV, defaultClientType]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRawCSV(text);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CLIENTS_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Client_Master_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleCommitImport = async () => {
    if (parsedClients.length === 0) {
      alert('No valid client records detected in CSV. Please verify file content.');
      return;
    }

    setIsSubmitting(true);
    await importClients(parsedClients, replaceExisting);
    setIsSubmitting(false);
    setImportSuccess(true);
    setTimeout(() => {
      closeModal();
    }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div
        className="modal-content-box"
        style={{ maxWidth: '920px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header-section" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div className="modal-header-title">
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Database size={18} />
            </div>
            <div>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Bulk Import Client Database (In One Go)
              </span>
              <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                Upload or paste CSV file to import multiple enterprise client records simultaneously
              </div>
            </div>
          </div>

          <button className="modal-close-btn" onClick={closeModal}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body-section" style={{ padding: '20px 24px', overflowY: 'auto' }}>
          {importSuccess ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle2 size={36} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#15803d', marginBottom: '8px' }}>
                Successfully Imported {parsedClients.length} Clients!
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b' }}>
                All corporate accounts and contact persons have been synchronized into the Client Master.
              </p>
            </div>
          ) : (
            <div>
              {/* File Upload & Template Actions */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 0.8fr',
                  gap: '16px',
                  marginBottom: '18px',
                }}
              >
                {/* Drag and Drop Box */}
                <div
                  style={{
                    border: '2px dashed #0284c7',
                    borderRadius: '10px',
                    padding: '16px 20px',
                    background: '#f0f9ff',
                    textAlign: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <input
                    type="file"
                    accept=".csv, .txt, text/csv"
                    onChange={handleFileUpload}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer',
                    }}
                  />
                  <Upload size={24} style={{ color: '#0284c7', margin: '0 auto 6px' }} />
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#0369a1' }}>
                    Click or Drag &amp; Drop CSV File Here
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Active File: <strong>{fileName}</strong>
                  </div>
                </div>

                {/* Quick Presets & Download */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '14px 16px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                      CSV Quick Tools:
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => {
                          setRawCSV(SAMPLE_CLIENTS_CSV);
                          setFileName('Provided_Enterprise_Dataset.csv');
                        }}
                      >
                        <Sparkles size={12} style={{ color: '#8b5cf6' }} />
                        <span>Load Provided Dataset (8 Clients)</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={handleDownloadTemplate}
                      >
                        <Download size={12} style={{ color: '#10b981' }} />
                        <span>Download CSV Template</span>
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>
                    ✓ Auto-detects columns: Code, Name, Industry, Segment, City, State, Region, Tier, Turnover, Employees, Contacts.
                  </div>
                </div>
              </div>

              {/* Raw CSV Preview / Editor Collapsible */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                    CSV Data Content (Editable):
                  </label>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Detected <strong>{parsedClients.length}</strong> valid rows
                  </span>
                </div>
                <textarea
                  className="form-control"
                  rows={4}
                  value={rawCSV}
                  onChange={(e) => setRawCSV(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', whiteSpace: 'pre' }}
                  placeholder="Paste CSV rows here with headers: Client Code, Client Name, Industry, Segment..."
                />
              </div>

              {/* Import Options */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Default Client Type:</label>
                  <select
                    className="form-control"
                    style={{ width: '160px', padding: '4px 8px', fontSize: '12px' }}
                    value={defaultClientType}
                    onChange={(e) => setDefaultClientType(e.target.value as any)}
                  >
                    <option value="Existing Client">Existing Client</option>
                    <option value="New Client">New Client</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={replaceExisting}
                      onChange={(e) => setReplaceExisting(e.target.checked)}
                    />
                    <span>Replace / Overwrite Entire Client Directory</span>
                  </label>
                </div>
              </div>

              {/* Parsed Data Preview Table */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Parsed Records Preview ({parsedClients.length} Accounts Ready to Import)
                  </h4>
                  <span className="pill-badge" style={{ background: '#dcfce7', color: '#15803d', fontWeight: 700 }}>
                    ✓ Mandatory Fields Verified
                  </span>
                </div>

                <div className="table-responsive" style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Client Code (Auto)</th>
                        <th>Client Name</th>
                        <th>Industry</th>
                        <th>Segment</th>
                        <th>City</th>
                        <th>Status</th>
                        <th>Account Owner</th>
                        <th>Primary Contact</th>
                        <th>Email</th>
                        <th>Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedClients.map((client, idx) => {
                        const contact = client.contacts[0] || { name: 'N/A', email: 'N/A', phone: 'N/A' };
                        return (
                          <tr key={client.code || idx}>
                            <td>
                              <strong style={{ color: '#0284c7', fontFamily: 'var(--font-mono)' }}>
                                {client.code || `CLT-${1000 + idx + 1}`}
                              </strong>
                            </td>
                            <td>
                              <strong style={{ color: '#0f172a' }}>{client.name}</strong>
                            </td>
                            <td>
                              <span style={{ fontSize: '11.5px', color: '#334155' }}>{client.industry}</span>
                            </td>
                            <td>
                              <span className="pill-badge" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                                {client.segment}
                              </span>
                            </td>
                            <td>
                              <span>{client.city}</span>
                            </td>
                            <td>
                              <span className="pill-badge" style={{ background: client.status === 'Active' ? '#ecfdf5' : '#fef3c7', color: client.status === 'Active' ? '#047857' : '#b45309' }}>
                                {client.status || 'Active'}
                              </span>
                            </td>
                            <td>
                              <strong>{client.accountOwner}</strong>
                            </td>
                            <td>
                              <div>{contact.name}</div>
                            </td>
                            <td>
                              <span style={{ fontSize: '11px', color: '#0284c7' }}>{contact.email}</span>
                            </td>
                            <td>
                              <span style={{ fontSize: '11px', color: '#475569' }}>{contact.phone}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer-section">
          <button type="button" className="btn btn-secondary" onClick={closeModal}>
            Cancel
          </button>
          {!importSuccess && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCommitImport}
              disabled={parsedClients.length === 0 || isSubmitting}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px' }}
            >
              <Upload size={14} className={isSubmitting ? 'animate-spin' : ''} />
              <span>
                {isSubmitting
                  ? 'Saving Records to Cloud Database...'
                  : `Import All ${parsedClients.length} Clients in One Go`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
