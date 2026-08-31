import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface LineChartProps {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
  }[];
  title?: string;
  height?: number;
}

export default function LineChart({ labels, datasets, title, height = 300 }: LineChartProps) {
  const data = {
    labels,
    datasets: datasets.map((d) => ({
      ...d,
      borderColor: d.borderColor || '#10b981',
      backgroundColor: d.backgroundColor || 'rgba(16, 185, 129, 0.1)',
      tension: 0.3,
      pointRadius: 3,
      borderWidth: 2,
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
      <Line data={data} options={options} />
    </div>
  );
}
