import React from 'react';
import './ChartSetup';
import { Line } from 'react-chartjs-2';
import { useCRM } from '../../context/CRMContext';
import { formatCurrency } from '../../utils/formatters';
import { computeMonthlyTrendsFromOpportunities } from '../../services/reportingService';

export const MonthlyTrendChart: React.FC = () => {
  const { opportunities, currency } = useCRM();

  const trendData = computeMonthlyTrendsFromOpportunities(opportunities);
  const months = trendData.map((t) => t.month);
  const pipelineTrendsINR = trendData.map((t) => t.pipelineValueINR);
  const wonTrendsINR = trendData.map((t) => t.wonValueINR);

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
