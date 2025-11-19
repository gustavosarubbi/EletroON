import React from 'react';
import '../../styles/components/EnergyMeter.css';

interface EnergyMeterProps {
  value: number;
  maxValue?: number;
  unit?: string;
  label?: string;
  size?: number;
}

const EnergyMeter: React.FC<EnergyMeterProps> = ({
  value,
  maxValue = 1000,
  unit = 'kWh',
  label = 'Consumo',
  size = 280,
}) => {
  // Garantir que o valor não exceda o maxValue
  const clampedValue = Math.min(value, maxValue);
  const percentage = maxValue > 0 ? (clampedValue / maxValue) * 100 : 0;
  const angle = (percentage / 100) * 180; // 0 a 180 graus
  const radius = size / 2 - 50;
  const centerX = size / 2;
  const centerY = size / 2 + 30;

  // Cores baseadas na porcentagem
  const getColor = () => {
    if (percentage < 33) return '#34d399'; // Verde
    if (percentage < 66) return '#fbbf24'; // Amarelo
    return '#f87171'; // Vermelho
  };

  const color = getColor();

  // Função para formatar números grandes
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toFixed(0);
  };

  // Calcular posição dos números no arco
  const getNumberPosition = (num: number) => {
    const numAngle = ((num / maxValue) * 180) * (Math.PI / 180);
    const numRadius = radius + 30;
    return {
      x: centerX + numRadius * Math.cos(numAngle),
      y: centerY + numRadius * Math.sin(numAngle),
    };
  };

  // Gerar marcas e números
  const marks = [];
  const numbers = [];
  const numMarks = 10;
  for (let i = 0; i <= numMarks; i++) {
    const markValue = (i / numMarks) * maxValue;
    const markAngle = ((markValue / maxValue) * 180) * (Math.PI / 180);
    const isMajor = i % (numMarks / 5) === 0;

    marks.push(
      <line
        key={`mark-${i}`}
        x1={centerX + (radius - (isMajor ? 20 : 10)) * Math.cos(markAngle)}
        y1={centerY + (radius - (isMajor ? 20 : 10)) * Math.sin(markAngle)}
        x2={centerX + radius * Math.cos(markAngle)}
        y2={centerY + radius * Math.sin(markAngle)}
        stroke="rgba(255, 255, 255, 0.5)"
        strokeWidth={isMajor ? 3 : 1.5}
      />
    );

    if (isMajor) {
      const pos = getNumberPosition(markValue);
      numbers.push(
        <text
          key={`num-${i}`}
          x={pos.x}
          y={pos.y}
          fill="rgba(255, 255, 255, 0.8)"
          fontSize={size > 400 ? "16" : "14"}
          fontWeight="600"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {formatNumber(markValue)}
        </text>
      );
    }
  }

  return (
    <div className="energy-meter-wrapper">
      <svg width={size} height={size} className="energy-meter-svg">
        {/* Arco de fundo - semicírculo de 0 a 180 graus */}
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={size > 400 ? "25" : "20"}
          strokeLinecap="round"
          className="meter-background-arc"
        />

        {/* Arco de progresso - semicírculo de 0 a 180 graus */}
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
          fill="none"
          stroke={color}
          strokeWidth={size > 400 ? "25" : "20"}
          strokeLinecap="round"
          strokeDasharray={`${(percentage / 100) * Math.PI * radius} ${Math.PI * radius}`}
          strokeDashoffset={Math.PI * radius}
          className="meter-progress-arc"
          style={{
            filter: `drop-shadow(0 0 12px ${color})`,
            transition: 'stroke-dasharray 0.6s ease-out',
          }}
        />

        {/* Marcas e números */}
        {marks}
        {numbers}

        {/* Agulha */}
        <g 
          className="needle-group"
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: `${centerX}px ${centerY}px`,
          }}
        >
          <circle 
            cx={centerX} 
            cy={centerY} 
            r={size > 400 ? "10" : "8"} 
            fill={color} 
            className="needle-center"
            style={{ filter: `drop-shadow(0 0 6px ${color})` }} 
          />
          <line
            x1={centerX}
            y1={centerY}
            x2={centerX + radius * 0.85}
            y2={centerY}
            stroke={color}
            strokeWidth={size > 400 ? "5" : "4"}
            strokeLinecap="round"
            className="needle-line"
            style={{
              filter: `drop-shadow(0 0 6px ${color})`,
            }}
          />
        </g>

        {/* Centro do medidor */}
        <circle 
          cx={centerX} 
          cy={centerY} 
          r={size > 400 ? "16" : "12"} 
          fill="rgba(15, 23, 42, 0.95)" 
          stroke={color} 
          strokeWidth={size > 400 ? "3" : "2"}
          className="meter-center"
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>

      {/* Display digital */}
      <div className="energy-meter-display">
        <div className="energy-meter-value-display">
          <span className="energy-value-number">{value.toFixed(2)}</span>
          <span className="energy-value-unit">{unit}</span>
        </div>
        <div className="energy-meter-label-display">{label}</div>
      </div>
    </div>
  );
};

export default EnergyMeter;

