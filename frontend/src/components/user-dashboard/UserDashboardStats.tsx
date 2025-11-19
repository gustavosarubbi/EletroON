import React from 'react';
import { Zap, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import StatsCard from '../dashboard/StatsCard';
import '../../styles/components/UserDashboard.css';

interface UserDashboardStatsProps {
  currentConsumption: number; // kW atual
  periodConsumption: number; // kWh do período
  estimatedCost: number; // R$ estimado
  previousPeriodConsumption: number; // kWh do período anterior para calcular diferença
  periodLabel?: string; // Label do período atual (ex: "Últimas 24 horas")
  previousPeriodLabel?: string; // Label do período anterior (ex: "24h anteriores")
  isLoading?: boolean;
}

const UserDashboardStats: React.FC<UserDashboardStatsProps> = ({
  currentConsumption,
  periodConsumption,
  estimatedCost,
  previousPeriodConsumption,
  periodLabel,
  previousPeriodLabel,
  isLoading = false,
}) => {
  // Se estiver carregando, mostrar valores zerados ou placeholders
  const displayConsumption = isLoading ? 0 : currentConsumption;
  const displayPeriod = isLoading ? 0 : periodConsumption;
  const displayCost = isLoading ? 0 : estimatedCost;
  const displayPreviousPeriod = isLoading ? 0 : previousPeriodConsumption;
  
  // Calcular diferença em kWh (não percentual)
  const differenceKWh = displayPeriod - displayPreviousPeriod;
  const isIncrease = differenceKWh >= 0;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 1) => {
    return value.toFixed(decimals).replace('.', ',');
  };

  return (
    <section className="user-dashboard-stats-section">
      <StatsCard
        title="Última Leitura"
        value={isLoading ? '...' : `${formatNumber(displayConsumption, 1)} kW`}
        icon={Zap}
        color="blue"
        subtitle="Potência atual"
      />
      
      <StatsCard
        title="Consumo"
        value={isLoading ? '...' : `${formatNumber(displayPeriod, 1)} kWh`}
        icon={Calendar}
        color="purple"
        subtitle={periodLabel || "Período selecionado"}
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
        value={isLoading ? '...' : `${isIncrease ? '+' : '-'}${formatNumber(Math.abs(differenceKWh), 1)} kWh`}
        icon={TrendingUp}
        color={isIncrease ? 'green' : 'red'}
        subtitle={previousPeriodLabel ? `vs. ${previousPeriodLabel}` : 'vs. período anterior'}
      />
    </section>
  );
};

export default UserDashboardStats;

