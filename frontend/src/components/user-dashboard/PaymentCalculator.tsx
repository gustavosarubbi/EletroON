import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import '../../styles/components/UserDashboard.css';

interface PaymentCalculatorProps {
  consumption: number; // kWh
  defaultRate?: number; // R$/kWh
  previousPeriodConsumption?: number; // kWh do período anterior
  projectedConsumption?: number; // kWh projetado para 30 dias
}

const PaymentCalculator: React.FC<PaymentCalculatorProps> = ({
  consumption,
  defaultRate = 0.75,
  previousPeriodConsumption,
  projectedConsumption,
}) => {
  const [rate, setRate] = useState<string>(defaultRate.toString());
  const [currentPayment, setCurrentPayment] = useState<number>(0);
  const [previousPayment, setPreviousPayment] = useState<number>(0);
  const [projectedPayment, setProjectedPayment] = useState<number>(0);
  const [difference, setDifference] = useState<number>(0);
  const [differencePercentage, setDifferencePercentage] = useState<number>(0);

  useEffect(() => {
    const rateValue = parseFloat(rate) || 0;
    const current = consumption * rateValue;
    setCurrentPayment(current);

    if (previousPeriodConsumption !== undefined) {
      const previous = previousPeriodConsumption * rateValue;
      setPreviousPayment(previous);
      const diff = current - previous;
      setDifference(diff);
      setDifferencePercentage(previous > 0 ? (diff / previous) * 100 : 0);
    }

    if (projectedConsumption !== undefined) {
      const projected = projectedConsumption * rateValue;
      setProjectedPayment(projected);
    }
  }, [consumption, rate, previousPeriodConsumption, projectedConsumption]);

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
        <div className="payment-input-group">
          <label htmlFor="rate-input">Tarifa de Energia (R$ por kWh)</label>
          <input
            id="rate-input"
            type="number"
            step="0.01"
            min="0"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="0.75"
          />
        </div>

        <div className="payment-results">
          <div className="payment-result-card main">
            <div className="payment-result-label">Valor Total</div>
            <div className="payment-result-value">{formatCurrency(currentPayment)}</div>
            <div className="payment-result-detail">
              {formatNumber(consumption, 2)} kWh × R$ {formatNumber(parseFloat(rate) || 0, 2)}
            </div>
          </div>

          {previousPeriodConsumption !== undefined && previousPeriodConsumption > 0 && (
            <div className="payment-comparison">
              <div className="payment-comparison-header">
                <Calendar size={16} />
                <span>Comparação com Período Anterior</span>
              </div>
              <div className="payment-comparison-content">
                <div className="payment-comparison-item">
                  <span className="comparison-label">Período Anterior:</span>
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

          {projectedConsumption !== undefined && projectedConsumption > 0 && (
            <div className="payment-projection">
              <div className="payment-projection-header">
                <Calendar size={16} />
                <span>Projeção (30 dias)</span>
              </div>
              <div className="payment-projection-value">{formatCurrency(projectedPayment)}</div>
              <div className="payment-projection-detail">
                Baseado em {formatNumber(projectedConsumption, 2)} kWh estimados
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentCalculator;

