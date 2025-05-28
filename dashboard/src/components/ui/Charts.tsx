import React from 'react';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import type { ChartOptions, ChartData } from 'chart.js';
import { cn } from '../../lib/utils';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface BaseChartProps {
  data: ChartData<any>;
  options?: ChartOptions<any>;
  className?: string;
  height?: number;
}

// Default chart options with dark mode support
const getDefaultOptions = (type: string): ChartOptions<any> => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 15,
        color: 'hsl(var(--foreground))',
      },
    },
    tooltip: {
      backgroundColor: 'hsl(var(--popover))',
      titleColor: 'hsl(var(--popover-foreground))',
      bodyColor: 'hsl(var(--popover-foreground))',
      borderColor: 'hsl(var(--border))',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12,
    },
  },
  scales:
    type === 'line' || type === 'bar'
      ? {
          x: {
            grid: {
              color: 'hsl(var(--border))',
              display: true,
            },
            ticks: {
              color: 'hsl(var(--muted-foreground))',
            },
          },
          y: {
            grid: {
              color: 'hsl(var(--border))',
              display: true,
            },
            ticks: {
              color: 'hsl(var(--muted-foreground))',
            },
          },
        }
      : undefined,
});

// Line Chart Component
export const LineChart: React.FC<BaseChartProps> = ({
  data,
  options,
  className,
  height = 300,
}) => {
  const defaultOptions = getDefaultOptions('line');
  const mergedOptions = { ...defaultOptions, ...options };

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <Line data={data} options={mergedOptions} />
    </div>
  );
};

// Bar Chart Component
export const BarChart: React.FC<BaseChartProps> = ({
  data,
  options,
  className,
  height = 300,
}) => {
  const defaultOptions = getDefaultOptions('bar');
  const mergedOptions = { ...defaultOptions, ...options };

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <Bar data={data} options={mergedOptions} />
    </div>
  );
};

// Doughnut Chart Component
export const DoughnutChart: React.FC<BaseChartProps> = ({
  data,
  options,
  className,
  height = 300,
}) => {
  const defaultOptions = getDefaultOptions('doughnut');
  const mergedOptions = { ...defaultOptions, ...options };

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <Doughnut data={data} options={mergedOptions} />
    </div>
  );
};

// Pie Chart Component
export const PieChart: React.FC<BaseChartProps> = ({
  data,
  options,
  className,
  height = 300,
}) => {
  const defaultOptions = getDefaultOptions('pie');
  const mergedOptions = { ...defaultOptions, ...options };

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <Pie data={data} options={mergedOptions} />
    </div>
  );
};

// Sample data generators for demo purposes
export const generateSampleLineData = () => ({
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Revenue',
      data: [12000, 19000, 15000, 25000, 22000, 30000],
      borderColor: 'hsl(var(--primary))',
      backgroundColor: 'hsl(var(--primary) / 0.1)',
      tension: 0.4,
    },
    {
      label: 'Expenses',
      data: [8000, 12000, 9000, 15000, 14000, 18000],
      borderColor: 'hsl(var(--destructive))',
      backgroundColor: 'hsl(var(--destructive) / 0.1)',
      tension: 0.4,
    },
  ],
});

export const generateSampleBarData = () => ({
  labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  datasets: [
    {
      label: 'Sales',
      data: [65000, 78000, 90000, 81000],
      backgroundColor: 'hsl(var(--primary))',
      borderRadius: 4,
    },
    {
      label: 'Target',
      data: [70000, 80000, 85000, 90000],
      backgroundColor: 'hsl(var(--muted))',
      borderRadius: 4,
    },
  ],
});

export const generateSampleDoughnutData = () => ({
  labels: ['Desktop', 'Mobile', 'Tablet'],
  datasets: [
    {
      data: [60, 30, 10],
      backgroundColor: [
        'hsl(var(--primary))',
        'hsl(var(--secondary))',
        'hsl(var(--muted))',
      ],
      borderWidth: 0,
    },
  ],
});

export const generateTenantDistributionData = () => ({
  labels: ['Enterprise', 'Pro', 'Free'],
  datasets: [
    {
      data: [45, 35, 20],
      backgroundColor: [
        'hsl(var(--primary))',
        'hsl(var(--secondary))',
        'hsl(var(--muted))',
      ],
      borderWidth: 0,
    },
  ],
});

export const generateUserActivityData = () => ({
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Active Users',
      data: [1200, 1900, 1500, 2200, 2000, 800, 600],
      borderColor: 'hsl(var(--primary))',
      backgroundColor: 'hsl(var(--primary) / 0.1)',
      tension: 0.4,
      fill: true,
    },
  ],
});

export const generateInventoryMetricsData = () => ({
  labels: ['In Stock', 'Low Stock', 'Out of Stock', 'Pending'],
  datasets: [
    {
      data: [65, 15, 8, 12],
      backgroundColor: [
        'hsl(var(--primary))',
        'hsl(142 71% 45%)', // Success color
        'hsl(var(--destructive))',
        'hsl(var(--muted))',
      ],
      borderWidth: 2,
      borderColor: 'hsl(var(--background))',
    },
  ],
});
