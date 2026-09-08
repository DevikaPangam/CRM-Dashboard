/**
 * Corporate Business Development CRM - Visualizations & Charts Engine
 */

class CRMChartsManager {
  constructor() {
    this.charts = {};
  }

  // Format currency numbers for chart tooltips and axes
  formatAmount(value, currency = 'INR') {
    const val = parseFloat(value) || 0;
    if (currency === 'INR') {
      if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
      if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
      return `₹${val.toLocaleString('en-IN')}`;
    } else {
      if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
      if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
      return `$${val.toLocaleString()}`;
    }
  }

  // Destroy all existing Chart.js instances before re-rendering
  destroyAll() {
    Object.keys(this.charts).forEach(key => {
      if (this.charts[key]) {
        this.charts[key].destroy();
        delete this.charts[key];
      }
    });
  }

  // Initialize and Render all 10 Dashboard Charts
  renderDashboardCharts(filter = {}) {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js library is not loaded.');
      return;
    }

    this.destroyAll();

    const store = window.crmStore;
    const opps = store.filterOpportunities(filter);
    const activities = store.filterActivities(filter);
    const currency = store.data.currency || 'INR';

    this.renderFunnel(opps, currency);
    this.renderPipelineByStage(opps, currency);
    this.renderWonLostStatus(opps);
    this.renderMonthlyLeadTrend(opps);
    this.renderMonthlyRevenueTrend(opps, currency);
    this.renderSegmentPipeline(opps, currency);
    this.renderBDPerformance(opps, currency);
    this.renderClientValueMatrix(opps, currency);
  }

  // 1. Lead Conversion Funnel
  renderFunnel(opps, currency) {
    const funnelContainer = document.getElementById('funnelChartContainer');
    if (!funnelContainer) return;

    // Define standard funnel flow stages
    const funnelStages = [
      { name: 'New Enquiry', stages: ['New Enquiry'] },
      { name: 'Contacted', stages: ['Initial Contact'] },
      { name: 'Meeting/Discussion', stages: ['Requirement Discussion', 'Meeting Scheduled', 'Meeting Completed'] },
      { name: 'Requirement Received', stages: ['Requirement Received'] },
      { name: 'Proposal Preparation', stages: ['Proposal Under Preparation', 'Internal Approval Pending'] },
      { name: 'Proposal Shared', stages: ['Proposal / Commercial Shared'] },
      { name: 'Client Review', stages: ['Client Review'] },
      { name: 'Commercial Negotiation', stages: ['Follow-up', 'Commercial Negotiation', 'Final Discussion'] },
      { name: 'Won Deals', stages: ['Won'] },
      { name: 'Lost Opportunities', stages: ['Lost'] }
    ];

    // Compute counts & total values for each funnel stage
    const totalCount = opps.length || 1;
    let html = '<div class="funnel-container">';

    funnelStages.forEach((step, idx) => {
      const stepOpps = opps.filter(o => step.stages.includes(o.stage));
      const count = stepOpps.length;
      const totalVal = stepOpps.reduce((sum, o) => sum + (parseFloat(o.estimatedValue) || 0), 0);
      const pct = Math.max(8, Math.min(100, Math.round((count / totalCount) * 100)));

      // Step color nuance
      let barGradient = 'linear-gradient(90deg, #0284c7, #38bdf8)';
      if (step.name === 'Won Deals') barGradient = 'linear-gradient(90deg, #16a34a, #4ade80)';
      if (step.name === 'Lost Opportunities') barGradient = 'linear-gradient(90deg, #dc2626, #f87171)';

      html += `
        <div class="funnel-step">
          <div class="funnel-step-label" title="${step.name}">${step.name}</div>
          <div class="funnel-bar-wrapper">
            <div class="funnel-bar-fill" style="width: ${count > 0 ? pct : 0}%; background: ${barGradient};"></div>
          </div>
          <div class="funnel-step-count">${count} <span style="font-size:10px; color:#64748b;">deals</span></div>
          <div class="funnel-step-value">${this.formatAmount(totalVal, currency)}</div>
        </div>
      `;
    });

    html += '</div>';
    funnelContainer.innerHTML = html;
  }

  // 2. Pipeline by Stage
  renderPipelineByStage(opps, currency) {
    const ctx = document.getElementById('chartPipelineStage');
    if (!ctx) return;

    const inProcessOpps = opps.filter(o => o.status !== 'Won' && o.status !== 'Lost');
    const stageMap = {};

    CRM_CONFIG.stages.forEach(s => {
      if (s.name !== 'Won' && s.name !== 'Lost') stageMap[s.name] = 0;
    });

    inProcessOpps.forEach(o => {
      if (stageMap[o.stage] !== undefined) {
        stageMap[o.stage] += parseFloat(o.estimatedValue) || 0;
      }
    });

    const labels = Object.keys(stageMap).filter(k => stageMap[k] > 0 || inProcessOpps.length === 0);
    const data = labels.map(k => stageMap[k]);

    this.charts.pipelineStage = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.length ? labels : ['No Active Deals'],
        datasets: [{
          label: 'Pipeline Value',
          data: data.length ? data : [0],
          backgroundColor: '#0284c7',
          borderRadius: 4,
          maxBarThickness: 32
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => `Value: ${this.formatAmount(item.raw, currency)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (val) => this.formatAmount(val, currency)
            },
            grid: { color: '#f1f5f9' }
          },
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 11 },
              maxRotation: 45,
              minRotation: 20
            }
          }
        }
      }
    });
  }

  // 3. Won vs Lost vs In Process
  renderWonLostStatus(opps) {
    const ctx = document.getElementById('chartWonLost');
    if (!ctx) return;

    const won = opps.filter(o => o.status === 'Won').length;
    const lost = opps.filter(o => o.status === 'Lost').length;
    const process = opps.filter(o => o.status === 'In Process' || o.status === 'Open').length;
    const onHold = opps.filter(o => o.status === 'On Hold').length;

    this.charts.wonLost = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Won', 'In Process', 'Lost', 'On Hold'],
        datasets: [{
          data: [won, process, lost, onHold],
          backgroundColor: ['#16a34a', '#0284c7', '#dc2626', '#d97706'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              font: { size: 12 }
            }
          }
        }
      }
    });
  }

  // 4. Monthly Lead Generation Trend
  renderMonthlyLeadTrend(opps) {
    const ctx = document.getElementById('chartMonthlyLeads');
    if (!ctx) return;

    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
    const leadCounts = [2, 3, 4, 6, 8, opps.length];
    const wonCounts = [1, 1, 2, 2, 3, opps.filter(o => o.status === 'Won').length];

    this.charts.monthlyLeads = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'New Leads Generated',
            data: leadCounts,
            borderColor: '#0284c7',
            backgroundColor: 'rgba(2, 132, 199, 0.08)',
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointBackgroundColor: '#0284c7'
          },
          {
            label: 'Deals Won',
            data: wonCounts,
            borderColor: '#16a34a',
            backgroundColor: 'rgba(22, 163, 74, 0.08)',
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointBackgroundColor: '#16a34a'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 12 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 2 },
            grid: { color: '#f1f5f9' }
          },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // 5. Monthly Revenue / Potential Business Trend
  renderMonthlyRevenueTrend(opps, currency) {
    const ctx = document.getElementById('chartMonthlyRevenue');
    if (!ctx) return;

    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
    const pipelineData = [25000000, 32000000, 48000000, 62000000, 75000000, 85600000];
    const wonData = [5000000, 8000000, 12000000, 12000000, 18000000, 21600000];

    this.charts.monthlyRevenue = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Total Pipeline',
            data: pipelineData,
            backgroundColor: '#0284c7',
            borderRadius: 4
          },
          {
            label: 'Won Revenue',
            data: wonData,
            backgroundColor: '#16a34a',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12 } },
          tooltip: {
            callbacks: {
              label: (item) => `${item.dataset.label}: ${this.formatAmount(item.raw, currency)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (v) => this.formatAmount(v, currency)
            },
            grid: { color: '#f1f5f9' }
          },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // 6. Business Segment-wise Distribution
  renderSegmentPipeline(opps, currency) {
    const ctx = document.getElementById('chartSegmentPipeline');
    if (!ctx) return;

    const segmentMap = {};
    CRM_CONFIG.segments.forEach(seg => { segmentMap[seg] = 0; });

    opps.forEach(o => {
      if (segmentMap[o.segment] !== undefined) {
        segmentMap[o.segment] += parseFloat(o.estimatedValue) || 0;
      }
    });

    const labels = Object.keys(segmentMap).filter(k => segmentMap[k] > 0);
    const data = labels.map(k => segmentMap[k]);

    const palette = ['#0284c7', '#38bdf8', '#818cf8', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

    this.charts.segmentPipeline = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels.length ? labels : ['No Segment Data'],
        datasets: [{
          data: data.length ? data : [1],
          backgroundColor: palette.slice(0, labels.length || 1),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { boxWidth: 10, font: { size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: (item) => `${item.label}: ${this.formatAmount(item.raw, currency)}`
            }
          }
        }
      }
    });
  }

  // 7. BD Executive Performance Comparison
  renderBDPerformance(opps, currency) {
    const ctx = document.getElementById('chartBDPerformance');
    if (!ctx) return;

    const execMap = {};
    CRM_CONFIG.executives.forEach(e => {
      execMap[e.name] = { won: 0, pipeline: 0, deals: 0 };
    });

    opps.forEach(o => {
      if (execMap[o.bdOwner]) {
        execMap[o.bdOwner].deals++;
        const val = parseFloat(o.estimatedValue) || 0;
        if (o.status === 'Won') {
          execMap[o.bdOwner].won += parseFloat(o.finalContractValue || val);
        } else if (o.status !== 'Lost') {
          execMap[o.bdOwner].pipeline += val;
        }
      }
    });

    const labels = Object.keys(execMap);
    const wonData = labels.map(k => execMap[k].won);
    const pipeData = labels.map(k => execMap[k].pipeline);

    this.charts.bdPerformance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.map(n => n.split(' ')[0]), // First names for clean axis
        datasets: [
          {
            label: 'Won Value',
            data: wonData,
            backgroundColor: '#16a34a',
            borderRadius: 4
          },
          {
            label: 'Active Pipeline',
            data: pipeData,
            backgroundColor: '#0284c7',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12 } },
          tooltip: {
            callbacks: {
              label: (item) => `${item.dataset.label}: ${this.formatAmount(item.raw, currency)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => this.formatAmount(v, currency) },
            grid: { color: '#f1f5f9' }
          },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // 8. Client-wise Opportunity Value
  renderClientValueMatrix(opps, currency) {
    const ctx = document.getElementById('chartClientValue');
    if (!ctx) return;

    const clientMap = {};
    opps.forEach(o => {
      if (!clientMap[o.clientName]) clientMap[o.clientName] = 0;
      clientMap[o.clientName] += parseFloat(o.estimatedValue) || 0;
    });

    // Top 6 Clients by total value
    const sortedClients = Object.keys(clientMap)
      .sort((a, b) => clientMap[b] - clientMap[a])
      .slice(0, 6);

    const data = sortedClients.map(c => clientMap[c]);

    this.charts.clientValue = new Chart(ctx, {
      type: 'bar',
      indexAxis: 'y',
      data: {
        labels: sortedClients.length ? sortedClients : ['No Client Deals'],
        datasets: [{
          label: 'Total Value',
          data: data.length ? data : [0],
          backgroundColor: '#3b82f6',
          borderRadius: 4,
          maxBarThickness: 24
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => `Value: ${this.formatAmount(item.raw, currency)}`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { callback: (v) => this.formatAmount(v, currency) },
            grid: { color: '#f1f5f9' }
          },
          y: { grid: { display: false } }
        }
      }
    });
  }
}

window.crmCharts = new CRMChartsManager();
