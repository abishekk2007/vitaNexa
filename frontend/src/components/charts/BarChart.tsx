import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BarChartProps {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }[];
  title?: string;
  height?: number;
}

export default function BarChart({ labels, datasets, title, height = 300 }: BarChartProps) {
  const data = {
    labels,
    datasets: datasets.map((d) => ({
      ...d,
      backgroundColor: d.backgroundColor || 'rgba(16, 185, 129, 0.7)',
      borderColor: d.borderColor || '#10b981',
      borderWidth: 1,
      borderRadius: 4,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#64748b' } },
      title: title ? { display: true, text: title, color: '#334155', font: { size: 14 } } : undefined,
    },
    scales: {
      x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(100, 116, 139, 0.15)' } },
      y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(100, 116, 139, 0.15)' }, beginAtZero: true },
    },
  };

  return (
    <div style={{ height }} className="w-full">
      <Bar data={data} options={options} />
    </div>
  );
}
