/**
 * Corporate Business Development CRM - Export & Reporting Engine
 */

class CRMExportManager {
  // Convert JSON array to CSV and trigger browser download
  downloadCSV(data, filename) {
    if (!data || !data.length) {
      alert('No data available to export.');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Header row
    csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

    // Value rows
    data.forEach(row => {
      const values = headers.map(header => {
        let val = row[header];
        if (val === null || val === undefined) val = '';
        if (typeof val === 'object') val = JSON.stringify(val);
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });

    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Export Specific Modules
  exportClients() {
    const clients = window.crmStore.data.clients;
    this.downloadCSV(clients, 'CRM_Master_Clients');
  }

  exportOpportunities() {
    const opps = window.crmStore.data.opportunities;
    this.downloadCSV(opps, 'CRM_Leads_Pipeline');
  }

  exportActivities() {
    const activities = window.crmStore.data.activities;
    this.downloadCSV(activities, 'CRM_Client_Interactions');
  }

  exportInternalActivities() {
    const internal = window.crmStore.data.internalActivities;
    this.downloadCSV(internal, 'CRM_Internal_BD_Activities');
  }

  exportTeamMembers() {
    const team = window.crmStore.getTeamMembers();
    this.downloadCSV(team, 'CRM_BD_Team_Members');
  }

  exportSegments() {
    const segments = window.crmStore.getSegments();
    this.downloadCSV(segments, 'CRM_Business_Segments');
  }

  exportUsers() {
    const users = window.crmStore.getUsers();
    this.downloadCSV(users, 'CRM_System_Users_Permissions');
  }

  // Export Full CRM Database Backup as JSON
  exportJSONBackup() {
    const store = window.crmStore.data;
    const jsonStr = JSON.stringify(store, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BD_CRM_Full_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Import JSON Backup File
  importJSONBackup(fileInput) {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (imported.clients && imported.opportunities) {
          window.crmStore.saveToStorage(imported);
          window.crmStore.data = imported;
          window.crmApp.showToast('CRM data restored successfully!', 'success');
          window.crmApp.refreshCurrentView();
        } else {
          alert('Invalid CRM backup format.');
        }
      } catch (err) {
        alert('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  }

  // Print Monthly BD Review Report
  printMonthlyReview() {
    window.crmApp.switchTab('tab-review');
    setTimeout(() => {
      window.print();
    }, 250);
  }
}

window.crmExport = new CRMExportManager();
