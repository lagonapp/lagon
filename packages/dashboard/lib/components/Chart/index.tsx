import { useRef } from 'react';
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

type ChartProps = {
  labels: string[];
  datasets: {
    label: string;
    color: string;
    data: number[];
  }[];
};

const Chart = ({ labels, datasets }: ChartProps) => {
  const ref = useRef<ChartJS<'line'>>();

  return (
    <Line
      ref={ref}
      data={{
        labels,
        datasets: datasets.map(({ label, color, data }) => ({
          label,
          borderColor: color,
          borderWidth: 2,
          pointBorderColor: 'transparent',
          pointBackgroundColor: 'transparent',
          backgroundColor: context => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;

            if (!chartArea) {
              return undefined;
            }

            const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            // 40 in hex = 64 in decimals, so 64 * 100 / 255 = 25% of the border color
            gradient.addColorStop(1, `${color}40`);
            gradient.addColorStop(0, `${color}00`);

            return gradient;
          },
          fill: true,
          data,
        })),
      }}
      style={{ height: '288px' }}
      options={{
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#78716c',
              maxRotation: 0,
              maxTicksLimit: 10,
            },
          },
          y: {
            grid: {
              display: false,
            },
            beginAtZero: true,
            ticks: {
              color: '#78716c',
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            intersect: false,
            backgroundColor: '#F9FAFB',
            borderColor: '#D1D5DB',
            titleColor: '#111827',
            titleMarginBottom: 8,
            bodyColor: '#1F2937',
            borderWidth: 1,
            cornerRadius: 4,
            padding: {
              left: 8,
              right: 8,
              top: 4,
              bottom: 4,
            },
            callbacks: {
              labelColor: tooltipItem => ({
                borderColor: tooltipItem.dataset.borderColor as string,
                backgroundColor: tooltipItem.dataset.borderColor as string,
              }),
            },
          },
        },
      }}
    />
  );
};

export default Chart;
