import React from 'react';
import './ChartSetup';
import { Line } from 'react-chartjs-2';
import { useCRM } from '../../context/CRMContext';
import { formatCurrency } from '../../utils/formatters';

export const MonthlyTrendChart: React.FC = () => {
  const { currency } = useCRM();

  const months = ['Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026 (YTD)'];
  // Scaled realistic revenue trends in INR
  const pipelineTrendsINR = [45000000, 52000000, 68000000, 74000000, 89000000, 104800000];
  const wonTrendsINR = [12000000, 15000000, 22000000, 31000000, 39000000, 51200000];

  const data = {
    labels: months,
    datasets: [
      {
        label: 'Total Pipeline Value',
        data: pipelineTrendsINR,
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.1)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#0284c7',
        pointRadius: 4,
      },
      {
        label: 'Won Deal Value',
        data: wonTrendsINR,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#10b981',
        pointRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { font: { family: 'Inter', size: 11 }, usePointStyle: true },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${formatCurrency(context.raw, currency)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: '#f8fafc' },
        ticks: { font: { family: 'Inter', size: 11 } },
      },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: {
          callback: (value: any) => formatCurrency(value, currency, true),
          font: { family: 'Inter', size: 10.5 },
        },
      },
    },
  };

  return <Line data={data} options={options} />;
};
