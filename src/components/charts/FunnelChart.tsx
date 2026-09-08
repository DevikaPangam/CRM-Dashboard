import React from 'react';
import './ChartSetup';
import { Bar } from 'react-chartjs-2';
import { useCRM } from '../../context/CRMContext';
import { formatCurrency } from '../../utils/formatters';

export const FunnelChart: React.FC = () => {
  const { opportunities, currency } = useCRM();

  // Aggregate deal counts and pipeline amounts by key funnel stages
  const funnelStages = [
    { label: 'Lead / Enquiry', filter: ['New Enquiry', 'Initial Contact'] },
    { label: 'Discussion & Meeting', filter: ['Requirement Discussion', 'Meeting Scheduled', 'Meeting Completed', 'Requirement Received'] },
    { label: 'Proposal Shared', filter: ['Proposal Under Preparation', 'Internal Approval Pending', 'Proposal / Commercial Shared'] },
    { label: 'Negotiation', filter: ['Client Review', 'Follow-up', 'Commercial Negotiation', 'Final Discussion'] },
    { label: 'Won Deals', filter: ['Won'] },
  ];

  const stageCounts = funnelStages.map(stage => {
    return opportunities.filter(o => stage.filter.includes(o.stage)).length;
  });

  const stageValues = funnelStages.map(stage => {
    return opportunities
      .filter(o => stage.filter.includes(o.stage))
      .reduce((sum, o) => sum + (o.dealValueINR || 0), 0);
  });

  const data = {
    labels: funnelStages.map(s => s.label),
    datasets: [
      {
        label: 'Active Deals',
        data: stageCounts,
        backgroundColor: [
          'rgba(2, 132, 199, 0.85)',
          'rgba(59, 130, 246, 0.85)',
          'rgba(139, 92, 246, 0.85)',
          'rgba(245, 158, 11, 0.85)',
          'rgba(16, 185, 129, 0.85)',
        ],
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#ffffff',
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const count = context.raw;
            const val = stageValues[context.dataIndex];
            return `Deals: ${count} (${formatCurrency(val, currency)})`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: '#f1f5f9' },
        ticks: { precision: 0, font: { family: 'Inter', size: 11 } },
      },
      y: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 11, weight: 'bold' as const } },
      },
    },
  };

  return <Bar data={data} options={options} />;
};
