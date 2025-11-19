import React from 'react';
import { Zap, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import StatsCard from '../dashboard/StatsCard';
import '../../styles/components/UserDashboard.css';

interface UserDashboardStatsProps {
  currentConsumption: number; // kW atual
  periodConsumption: number; // kWh do período
  estimatedCost: number; // R$ estimado
  comparisonPercentage: number; // % vs período anterior
  isLoading?: boolean;
}

const UserDashboardStats: React.FC<UserDashboardStatsProps> = ({
  currentConsumption,
  periodConsumption,
  estimatedCost,
  comparisonPercentage,
  isLoading = false,
}) => {
  // Se estiver carregando, mostrar valores zerados ou placeholders
  const displayConsumption = isLoading ? 0 : currentConsumption;
  const displayPeriod = isLoading ? 0 : periodConsumption;
  const displayCost = isLoading ? 0 : estimatedCost;
  const displayComparison = isLoading ? 0 : comparisonPercentage;
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 1) => {
    return value.toFixed(decimals).replace('.', ',');
  };

  const isPositiveTrend = displayComparison >= 0;

  return (
    <section className="user-dashboard-stats-section">
      <StatsCard
        title="Consumo Atual"
        value={isLoading ? '...' : `${formatNumber(displayConsumption, 1)} kW`}
        icon={Zap}
        color="blue"
        subtitle="Potência instantânea"
      />
      
      <StatsCard
        title="Consumo do Período"
        value={isLoading ? '...' : `${formatNumber(displayPeriod, 1)} kWh`}
        icon={Calendar}
        color="green"
        subtitle="Total acumulado"
      />
      
      <StatsCard
        title="Custo Estimado"
        value={isLoading ? '...' : formatCurrency(displayCost)}
        icon={DollarSign}
        color="amber"
        subtitle="Valor aproximado"
      />
      
      <StatsCard
        title="Comparação"
        value={isLoading ? '...' : `${isPositiveTrend ? '+' : ''}${formatNumber(Math.abs(displayComparison), 1)}%`}
        icon={TrendingUp}
        color={isPositiveTrend ? 'red' : 'green'}
        subtitle="vs período anterior"
        trend={isLoading ? undefined : {
          value: Math.abs(displayComparison),
          isPositive: !isPositiveTrend, // Invertido: negativo é bom (menos consumo)
        }}
      />
    </section>
  );
};

export default UserDashboardStats;

