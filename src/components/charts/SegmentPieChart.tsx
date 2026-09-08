import React from 'react';
import './ChartSetup';
import { Doughnut } from 'react-chartjs-2';
import { useCRM } from '../../context/CRMContext';
import { formatCurrency } from '../../utils/formatters';

export const SegmentPieChart: React.FC = () => {
  const { opportunities, currency } = useCRM();

  // Aggregate pipeline by segment
  const segmentMap: { [key: string]: number } = {};
  opportunities.forEach(opp => {
    const seg = opp.segment || 'Other';
    segmentMap[seg] = (segmentMap[seg] || 0) + (opp.dealValueINR || 0);
  });

  const labels = Object.keys(segmentMap);
  const values = Object.values(segmentMap);

  const colors = [
    '#0284c7',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#3b82f6',
    '#64748b',
  ];

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: { boxWidth: 12, font: { family: 'Inter', size: 10.5 } },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const val = context.raw;
            return ` ${label}: ${formatCurrency(val, currency)}`;
          },
        },
      },
    },
    cutout: '65%',
  };

  return <Doughnut data={data} options={options} />;
};
