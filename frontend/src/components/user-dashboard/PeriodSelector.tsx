import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import '../../styles/components/UserDashboard.css';

export type PeriodType = 'realtime' | 'custom' | 'compare';

interface PeriodSelectorProps {
  selectedPeriod: PeriodType;
  onSelectPeriod: (period: PeriodType) => void;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  compareStartDate?: string;
  compareEndDate?: string;
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
  onStartTimeChange?: (time: string) => void;
  onEndTimeChange?: (time: string) => void;
  onCompareStartDateChange?: (date: string) => void;
  onCompareEndDateChange?: (date: string) => void;
  onApply?: () => void;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedPeriod,
  onSelectPeriod,
  startDate,
  endDate,
  startTime = '00:00',
  endTime = '23:59',
  compareStartDate,
  compareEndDate,
  onStartDateChange,
  onEndDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onCompareStartDateChange,
  onCompareEndDateChange,
  onApply,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  return (
    <div className="period-selector-container">
      <div className="period-selector-header">
        <Calendar size={20} />
        <h3>Selecionar Período</h3>
      </div>

      <div className="period-selector-tabs">
        <button
          className={`period-tab ${selectedPeriod === 'realtime' ? 'active' : ''}`}
          onClick={() => onSelectPeriod('realtime')}
        >
          <Clock size={16} />
          <span>Tempo Real</span>
        </button>
        <button
          className={`period-tab ${selectedPeriod === 'custom' ? 'active' : ''}`}
          onClick={() => onSelectPeriod('custom')}
        >
          <Calendar size={16} />
          <span>Personalizado</span>
        </button>
        <button
          className={`period-tab ${selectedPeriod === 'compare' ? 'active' : ''}`}
          onClick={() => onSelectPeriod('compare')}
        >
          <Calendar size={16} />
          <span>Comparar</span>
        </button>
      </div>

      {selectedPeriod === 'custom' && (
        <div className="period-custom-form">
          <div className="period-date-time-group">
            <div className="period-date-group">
              <label>Data Inicial</label>
              <input
                type="date"
                value={startDate || ''}
                onChange={(e) => onStartDateChange?.(e.target.value)}
                max={endDate || today}
              />
            </div>
            <div className="period-time-group">
              <label>Hora Inicial</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => onStartTimeChange?.(e.target.value)}
              />
            </div>
          </div>
          <div className="period-date-time-group">
            <div className="period-date-group">
              <label>Data Final</label>
              <input
                type="date"
                value={endDate || ''}
                onChange={(e) => onEndDateChange?.(e.target.value)}
                min={startDate}
                max={today}
              />
            </div>
            <div className="period-time-group">
              <label>Hora Final</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => onEndTimeChange?.(e.target.value)}
                max={startDate === today ? currentTime : undefined}
              />
            </div>
          </div>
          {onApply && (
            <button className="period-apply-button" onClick={onApply}>
              Aplicar
            </button>
          )}
        </div>
      )}

      {selectedPeriod === 'compare' && (
        <div className="period-compare-form">
          <div className="period-compare-section">
            <h4>Período 1</h4>
            <div className="period-date-group">
              <label>Data Inicial</label>
              <input
                type="date"
                value={startDate || ''}
                onChange={(e) => onStartDateChange?.(e.target.value)}
                max={endDate || today}
              />
            </div>
            <div className="period-date-group">
              <label>Data Final</label>
              <input
                type="date"
                value={endDate || ''}
                onChange={(e) => onEndDateChange?.(e.target.value)}
                min={startDate}
                max={today}
              />
            </div>
          </div>

          <div className="period-compare-section">
            <h4>Período 2</h4>
            <div className="period-date-group">
              <label>Data Inicial</label>
              <input
                type="date"
                value={compareStartDate || ''}
                onChange={(e) => onCompareStartDateChange?.(e.target.value)}
                max={compareEndDate || today}
              />
            </div>
            <div className="period-date-group">
              <label>Data Final</label>
              <input
                type="date"
                value={compareEndDate || ''}
                onChange={(e) => onCompareEndDateChange?.(e.target.value)}
                min={compareStartDate}
                max={today}
              />
            </div>
          </div>

          {onApply && (
            <button className="period-apply-button" onClick={onApply}>
              Comparar
            </button>
          )}
        </div>
      )}

      {selectedPeriod === 'realtime' && (
        <div className="period-realtime-info">
          <Clock size={16} />
          <span>Mostrando dados das últimas 24 horas com atualização automática</span>
        </div>
      )}
    </div>
  );
};

export default PeriodSelector;

