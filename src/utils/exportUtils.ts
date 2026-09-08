import { Client, Opportunity, Activity, Followup, InternalTask, TeamMember, BusinessSegment, User } from '../types/crm';

/**
 * Trigger browser file download for a blob or string content
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export opportunities to CSV
 */
export function exportOpportunitiesToCSV(opportunities: Opportunity[]) {
  const headers = [
    'Opportunity Code',
    'Title',
    'Client Name',
    'Segment',
    'Deal Value (INR)',
    'Monthly Value (INR)',
    'Stage',
    'Probability (%)',
    'Status',
    'BD Owner',
    'Lead Source',
    'Expected Close Date',
    'Created Date',
    'Notes'
  ];

  const rows = opportunities.map(opp => [
    `"${opp.code || opp.id}"`,
    `"${(opp.title || '').replace(/"/g, '""')}"`,
    `"${(opp.clientName || '').replace(/"/g, '""')}"`,
    `"${(opp.segment || '').replace(/"/g, '""')}"`,
    opp.dealValueINR,
    opp.monthlyValueINR,
    `"${opp.stage}"`,
    opp.probability,
    `"${opp.status}"`,
    `"${(opp.owner || '').replace(/"/g, '""')}"`,
    `"${(opp.leadSource || '').replace(/"/g, '""')}"`,
    opp.expectedCloseDate || '',
    opp.createdDate || '',
    `"${(opp.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const filename = `CorpBD_Opportunities_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export clients to CSV
 */
export function exportClientsToCSV(clients: Client[]) {
  const headers = [
    'Client Code',
    'Client Name',
    'Industry',
    'Segment',
    'City',
    'State',
    'Region',
    'Tier',
    'Turnover (Cr)',
    'Employees',
    'Status',
    'Account Owner',
    'Primary Contact',
    'Email',
    'Phone'
  ];

  const rows = clients.map(client => {
    const primaryContact = client.contacts.find(c => c.isPrimary) || client.contacts[0] || { name: '', email: '', phone: '' };
    return [
      `"${client.code || client.id}"`,
      `"${(client.name || '').replace(/"/g, '""')}"`,
      `"${(client.industry || '').replace(/"/g, '""')}"`,
      `"${(client.segment || '').replace(/"/g, '""')}"`,
      `"${client.city}"`,
      `"${client.state}"`,
      `"${client.region}"`,
      `"${client.tier}"`,
      client.turnoverCr,
      client.employees,
      `"${client.status}"`,
      `"${(client.accountOwner || '').replace(/"/g, '""')}"`,
      `"${(primaryContact.name || '').replace(/"/g, '""')}"`,
      `"${primaryContact.email || ''}"`,
      `"${primaryContact.phone || ''}"`
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const filename = `CorpBD_Clients_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Full JSON Backup download
 */
export function exportFullJSONBackup(data: {
  clients: Client[];
  opportunities: Opportunity[];
  activities: Activity[];
  followups: Followup[];
  internalTasks: InternalTask[];
  teamMembers: TeamMember[];
  segments: BusinessSegment[];
  users: User[];
}) {
  const payload = {
    appName: 'CorpBD CRM Enterprise Suite',
    version: '2.0',
    exportTimestamp: new Date().toISOString(),
    data
  };

  const jsonContent = JSON.stringify(payload, null, 2);
  const filename = `CorpBD_CRM_FullBackup_${new Date().toISOString().slice(0, 10)}.json`;
  downloadFile(jsonContent, filename, 'application/json');
}
