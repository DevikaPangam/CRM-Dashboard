import React from 'react';
import './ChartSetup';
import { Bar } from 'react-chartjs-2';
import { useCRM } from '../../context/CRMContext';
import { formatCurrency } from '../../utils/formatters';

export const StageBarChart: React.FC = () => {
  const { opportunities, currency } = useCRM();

  // Group deal value by active stages
  const activeStages = [
    'Requirement Discussion',
    'Proposal / Commercial Shared',
    'Client Review',
    'Internal Approval Pending',
    'Commercial Negotiation',
    'Final Discussion',
    'Won',
    'Lost',
  ];

  const stageTotals = activeStages.map(stage => {
    return opportunities
      .filter(o => o.stage === stage)
      .reduce((sum, o) => sum + (o.dealValueINR || 0), 0);
  });

  const data = {
    labels: activeStages.map(s => (s.length > 16 ? s.slice(0, 14) + '...' : s)),
    datasets: [
      {
        label: 'Pipeline Value',
        data: stageTotals,
        backgroundColor: activeStages.map(s => {
          if (s === 'Won') return '#10b981';
          if (s === 'Lost') return '#ef4444';
          if (s.includes('Negotiation') || s.includes('Final')) return '#3b82f6';
          if (s.includes('Proposal')) return '#8b5cf6';
          return '#0ea5e9';
        }),
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items: any) => activeStages[items[0].dataIndex],
          label: (context: any) => `Value: ${formatCurrency(context.raw, currency)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 10.5 } },
      },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: {
          callback: (value: any) => formatCurrency(value, currency, true),
          font: { family: 'Inter', size: 10 },
        },
      },
    },
  };

  return <Bar data={data} options={options} />;
};
