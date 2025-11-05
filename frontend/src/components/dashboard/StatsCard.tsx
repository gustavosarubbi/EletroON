import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'orange' | 'red' | 'amber';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  percentage?: number;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  trend,
  subtitle
}) => {
  return (
    <div className={`stats-card ${color}`}>
      <div className="stats-header">
        <div className="stats-title-container">
          <div className={`status-indicator ${color}`}></div>
          <div className="stats-title">{title}</div>
        </div>
        <div className="stats-icon">
          <Icon />
        </div>
      </div>
      
      <div className="stats-content">
        <div className="stats-value">{value}</div>
        {subtitle && (
          <div className="stats-subtitle">{subtitle}</div>
        )}
        <div className="stats-progress">
          <div 
            className={`stats-progress-bar ${color}`}
            style={{ 
              width: '100%'
            }}
          ></div>
        </div>
      </div>
      
      {trend && (
        <div className="stats-trend">
          <span className={`trend-indicator ${trend.isPositive ? 'positive' : 'negative'}`}>
            {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
          </span>
          <span className="trend-label">vs. período anterior</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
