import React, { useEffect, useState } from 'react';
import '../../styles/components/VelocimeterMeter.css';

interface VelocimeterMeterProps {
  currentValue: number;
  maxValue: number;
  period: string;
  isUpdating?: boolean;
  unit?: string;
}

const VelocimeterMeter: React.FC<VelocimeterMeterProps> = ({
  currentValue,
  maxValue,
  period,
  isUpdating = false,
  unit = 'kWh',
}) => {
  const size = 600;
  const radius = size / 2 - 60;
  const centerX = size / 2;
  const centerY = size / 2 + 40;

  // Garantir que o valor não exceda o maxValue
  const clampedValue = Math.min(Math.max(0, currentValue), maxValue);
  const percentage = maxValue > 0 ? (clampedValue / maxValue) * 100 : 0;
  
  // Animação suave do valor usando state
  const [animatedValue, setAnimatedValue] = useState(clampedValue);
  const [animatedAngle, setAnimatedAngle] = useState(0);

  useEffect(() => {
    // Animação suave do valor
    const startValue = animatedValue;
    const endValue = clampedValue;
    
    // Se o valor não mudou, não animar
    if (Math.abs(startValue - endValue) < 0.01) {
      return;
    }
    
    const duration = 1500; // 1.5 segundos
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easeOut;
      
      setAnimatedValue(currentValue);
      const currentPercentage = maxValue > 0 ? (currentValue / maxValue) * 100 : 0;
      setAnimatedAngle((currentPercentage / 100) * 180);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setAnimatedValue(endValue);
        const finalPercentage = maxValue > 0 ? (endValue / maxValue) * 100 : 0;
        setAnimatedAngle((finalPercentage / 100) * 180);
      }
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampedValue, maxValue]);

  // Cores baseadas na porcentagem
  const getColor = () => {
    if (percentage < 33) return '#34d399'; // Verde
    if (percentage < 66) return '#fbbf24'; // Amarelo
    return '#f87171'; // Vermelho
  };

  const color = getColor();

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
        x1={centerX + (radius - (isMajor ? 25 : 12)) * Math.cos(markAngle)}
        y1={centerY + (radius - (isMajor ? 25 : 12)) * Math.sin(markAngle)}
        x2={centerX + radius * Math.cos(markAngle)}
        y2={centerY + radius * Math.sin(markAngle)}
        stroke="rgba(255, 255, 255, 0.4)"
        strokeWidth={isMajor ? 3 : 1.5}
        strokeLinecap="round"
      />
    );

    if (isMajor) {
      const numRadius = radius + 35;
      const numX = centerX + numRadius * Math.cos(markAngle);
      const numY = centerY + numRadius * Math.sin(markAngle);
      
      numbers.push(
        <text
          key={`num-${i}`}
          x={numX}
          y={numY}
          fill="rgba(255, 255, 255, 0.8)"
          fontSize="16"
          fontWeight="600"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {formatNumber(markValue)}
        </text>
      );
    }
  }

  // Função para formatar números
  function formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toFixed(0);
  }

  // Calcular comprimento do arco de progresso
  const arcLength = Math.PI * radius;
  const animatedPercentage = maxValue > 0 ? (animatedValue / maxValue) * 100 : 0;
  const progressLength = (animatedPercentage / 100) * arcLength;

  return (
    <div className="velocimeter-meter-container">
      {/* Indicador de atualização em tempo real */}
      {isUpdating && (
        <div className="update-indicator">
          <div className="update-pulse"></div>
          <span>Atualizando...</span>
        </div>
      )}

      <div className="velocimeter-wrapper">
        <svg width={size} height={size} className="velocimeter-svg">
          {/* Arco de fundo */}
          <path
            d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="30"
            strokeLinecap="round"
            className="meter-background-arc"
          />

          {/* Arco de progresso com animação */}
          <path
            d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
            fill="none"
            stroke={color}
            strokeWidth="30"
            strokeLinecap="round"
            strokeDasharray={`${progressLength} ${arcLength}`}
            strokeDashoffset={arcLength}
            className="meter-progress-arc"
            style={{
              filter: `drop-shadow(0 0 12px ${color})`,
              transition: 'stroke-dasharray 0.3s ease-out',
            }}
          />

          {/* Marcas e números */}
          {marks}
          {numbers}

          {/* Agulha com animação fluida */}
          <g
            className="needle-group"
            style={{
              transformOrigin: `${centerX}px ${centerY}px`,
              transform: `rotate(${animatedAngle}deg)`,
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Círculo central da agulha */}
            <circle
              cx={centerX}
              cy={centerY}
              r="12"
              fill={color}
              className="needle-center"
              style={{ filter: `drop-shadow(0 0 8px ${color})` }}
            />
            
            {/* Linha da agulha */}
            <line
              x1={centerX}
              y1={centerY}
              x2={centerX + radius * 0.88}
              y2={centerY}
              stroke={color}
              strokeWidth="5"
              strokeLinecap="round"
              className="needle-line"
              style={{
                filter: `drop-shadow(0 0 8px ${color})`,
              }}
            />
          </g>

          {/* Centro do medidor */}
          <circle
            cx={centerX}
            cy={centerY}
            r="18"
            fill="rgba(15, 23, 42, 0.95)"
            stroke={color}
            strokeWidth="3"
            className="meter-center"
            style={{ filter: `drop-shadow(0 0 10px ${color})` }}
          />
        </svg>

        {/* Display digital */}
        <div className="velocimeter-display">
          <div className="velocimeter-value-display">
            <span className="velocimeter-value-number">
              {animatedValue.toFixed(2)}
            </span>
            <span className="velocimeter-value-unit">{unit}</span>
          </div>
          <div className="velocimeter-period">{period}</div>
        </div>
      </div>
    </div>
  );
};

export default VelocimeterMeter;

