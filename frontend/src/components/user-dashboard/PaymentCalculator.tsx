import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import '../../styles/components/UserDashboard.css';

interface PaymentCalculatorProps {
  consumption: number; // kWh
  defaultRate?: number; // R$/kWh
  previousPeriodConsumption?: number; // kWh do período anterior
  previousPeriodLabel?: string; // Label do período anterior (ex: "Janeiro 2025")
  projectedConsumption?: number; // kWh projetado para 30 dias
}

const PaymentCalculator: React.FC<PaymentCalculatorProps> = ({
  consumption,
  defaultRate = 0.75,
  previousPeriodConsumption,
  previousPeriodLabel,
  projectedConsumption,
}) => {
  const [currentPayment, setCurrentPayment] = useState<number>(0);
  const [previousPayment, setPreviousPayment] = useState<number>(0);
  const [difference, setDifference] = useState<number>(0);
  const [differencePercentage, setDifferencePercentage] = useState<number>(0);

  useEffect(() => {
    const rateValue = defaultRate;
    const current = consumption * rateValue;
    setCurrentPayment(current);

    if (previousPeriodConsumption !== undefined) {
      const previous = previousPeriodConsumption * rateValue;
      setPreviousPayment(previous);
      const diff = current - previous;
      setDifference(diff);
      setDifferencePercentage(previous > 0 ? (diff / previous) * 100 : 0);
    }
  }, [consumption, defaultRate, previousPeriodConsumption]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals).replace('.', ',');
  };

  const isIncrease = difference > 0;

  return (
    <div className="payment-calculator-container">
      <div className="payment-calculator-header">
        <DollarSign size={20} />
        <h3>Calculadora de Pagamento</h3>
      </div>

      <div className="payment-calculator-content">
        <div className="payment-results">
          <div className="payment-result-card main">
            <div className="payment-result-label">Valor Total</div>
            <div className="payment-result-value">{formatCurrency(currentPayment)}</div>
            <div className="payment-result-detail">
              {formatNumber(consumption, 2)} kWh × R$ {formatNumber(defaultRate, 2)}
            </div>
          </div>

          {previousPeriodConsumption !== undefined && previousPeriodConsumption > 0 && (
            <div className="payment-comparison">
              <div className="payment-comparison-header">
                <Calendar size={16} />
                <span>Comparação com {previousPeriodLabel || 'Período Anterior'}</span>
              </div>
              <div className="payment-comparison-content">
                <div className="payment-comparison-item">
                  <span className="comparison-label">{previousPeriodLabel || 'Período Anterior'}:</span>
                  <span className="comparison-value">{formatCurrency(previousPayment)}</span>
                </div>
                <div className="payment-comparison-item">
                  <span className="comparison-label">Diferença:</span>
                  <span className={`comparison-value ${isIncrease ? 'increase' : 'decrease'}`}>
                    {isIncrease ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {formatCurrency(Math.abs(difference))} ({isIncrease ? '+' : ''}{formatNumber(differencePercentage, 1)}%)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentCalculator;

