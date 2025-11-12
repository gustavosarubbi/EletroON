import React, { useMemo } from 'react';
import Chart from '../dashboard/Chart';
import { Reading } from '../../types/dashboard';

interface ConsumptionChartProps {
  readings: Reading[];
  title?: string;
  height?: number;
}

const ConsumptionChart: React.FC<ConsumptionChartProps> = ({
  readings,
  title = 'Consumo de Energia',
  height = 300,
}) => {
  const chartData = useMemo(() => {
    if (!readings || readings.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    // Ordenar leituras por timestamp
    const sortedReadings = [...readings].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Calcular consumo incremental (diferença entre leituras consecutivas)
    const consumptionData: number[] = [];
    const labels: string[] = [];
    
    for (let i = 0; i < sortedReadings.length; i++) {
      const reading = sortedReadings[i];
      const date = new Date(reading.timestamp);
      
      // Formatar label de data/hora
      labels.push(
        date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      );

      if (i === 0) {
        consumptionData.push(0);
      } else {
        const prevReading = sortedReadings[i - 1];
        const consumption = Math.max(0, reading.ept_c - prevReading.ept_c);
        consumptionData.push(consumption);
      }
    }

    // Calcular consumo acumulado para linha de tendência
    const cumulativeData: number[] = [];
    let cumulative = 0;
    for (let i = 0; i < sortedReadings.length; i++) {
      if (i === 0) {
        cumulative = 0;
      } else {
        cumulative += consumptionData[i];
      }
      cumulativeData.push(cumulative);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Consumo Acumulado (kWh)',
          data: cumulativeData,
          borderColor: '#00ffff',
          backgroundColor: 'rgba(0, 255, 255, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#00ffff',
          pointBorderColor: '#000000',
          pointBorderWidth: 2,
        },
        {
          label: 'Consumo por Período (kWh)',
          data: consumptionData,
          borderColor: '#8a2be2',
          backgroundColor: 'rgba(138, 43, 226, 0.2)',
          fill: false,
          tension: 0.4,
          borderWidth: 2.5,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: '#8a2be2',
          pointBorderColor: '#000000',
          pointBorderWidth: 2,
        },
      ],
    };
  }, [readings]);

  if (!readings || readings.length === 0) {
    return (
      <div
        style={{
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255, 255, 255, 0.5)',
        }}
      >
        <p>Nenhum dado disponível para exibir</p>
      </div>
    );
  }

  return <Chart data={chartData} title={title} height={height} type="line" />;
};

export default ConsumptionChart;

