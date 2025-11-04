import React, { useRef } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartProps {
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor?: string | string[];
      backgroundColor?: string | string[];
      fill?: boolean;
      tension?: number;
      borderWidth?: number;
    }>;
  };
  title: string;
  height?: number;
  type?: 'line' | 'bar' | 'doughnut';
}

const Chart: React.FC<ChartProps> = ({ data, title, height = 300, type = 'line' }) => {
  const chartRef = useRef<ChartJS<'line' | 'bar' | 'doughnut'>>(null);

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'center' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 8,
          color: 'rgba(255, 255, 255, 0.9)',
          font: {
            size: 11,
            weight: '500' as const,
            family: "'Inter', 'Segoe UI', sans-serif"
          },
          boxWidth: 6,
          boxHeight: 6,
          boxPadding: 3,
          generateLabels: function(chart: any) {
            const original = ChartJS.defaults.plugins.legend.labels.generateLabels;
            const labels = original.call(this, chart);
            labels.forEach((label: any) => {
              label.fillStyle = label.strokeStyle || label.backgroundColor;
              label.lineWidth = 0;
              label.pointStyle = 'circle';
              label.usePointStyle = true;
              label.radius = 3;
              label.boxWidth = 6;
              label.boxHeight = 6;
            });
            return labels;
          }
        }
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        color: 'rgba(255, 255, 255, 0.9)',
        padding: {
          bottom: 10
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        titleFont: {
          size: 13,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 12
        },
        displayColors: true,
        boxPadding: 6
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: type === 'bar' ? 'Dia da Semana' : 'Tempo',
          color: 'rgba(255, 255, 255, 0.6)',
          font: {
            size: 11,
            weight: 'normal' as const
          },
          padding: 8
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          display: false,
          drawBorder: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          font: {
            size: 11
          },
          padding: 8
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: type === 'bar' ? 'Consumo (kWh)' : 'Consumo (kWh)',
          color: 'rgba(255, 255, 255, 0.6)',
          font: {
            size: 11,
            weight: 'normal' as const
          },
          padding: 12
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          font: {
            size: 11
          },
          padding: 6
        },
        beginAtZero: true
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Quantidade',
          color: 'rgba(255, 255, 255, 0.6)',
          font: {
            size: 11,
            weight: 'normal' as const
          },
          padding: 12
        },
        grid: {
          drawOnChartArea: false,
          drawBorder: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          font: {
            size: 11
          },
          padding: 6
        },
        beginAtZero: true
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    },
    elements: {
      point: {
        radius: 3,
        hoverRadius: 5,
        hoverBorderWidth: 2,
        borderWidth: 2
      },
      line: {
        tension: 0.4,
        borderWidth: 2.5
      },
      bar: {
        borderRadius: 6,
        borderSkipped: false
      },
      arc: {
        borderWidth: 2
      }
    }
  };

  const doughnutOptions = {
    ...options,
    scales: undefined
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return <Bar ref={chartRef as any} data={data} options={options} />;
      case 'doughnut':
        return <Doughnut ref={chartRef as any} data={data} options={doughnutOptions} />;
      default:
        return <Line ref={chartRef as any} data={data} options={options} />;
    }
  };

  return (
    <div className="chart-container" style={{ height: `${height}px` }}>
      {renderChart()}
    </div>
  );
};

export default Chart;
