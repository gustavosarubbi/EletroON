import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboardService';
import { Device } from '../types/dashboard';
import { Zap, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import LoginParticles from '../components/ui/LoginParticles';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import '../styles/components/UserEnergy.css';

const UserEnergyPage: React.FC = () => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para consumo
  const [monthlyConsumption, setMonthlyConsumption] = useState<number>(0);
  const [customConsumption, setCustomConsumption] = useState<number>(0);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [loadingCustom, setLoadingCustom] = useState(false);
  
  // Estados para período personalizado
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Estados para cálculo de taxa
  const [taxRate, setTaxRate] = useState<string>('0.50');
  const [monthlyPayment, setMonthlyPayment] = useState<number>(0);
  const [customPayment, setCustomPayment] = useState<number>(0);

  // Carregar dispositivos do usuário
  useEffect(() => {
    loadDevices();
  }, []);

  // Calcular consumo mensal ao carregar dispositivos
  useEffect(() => {
    if (devices.length > 0) {
      calculateMonthlyConsumption();
    }
  }, [devices]);

  // Calcular pagamentos quando consumo ou taxa mudarem
  useEffect(() => {
    const rate = parseFloat(taxRate) || 0;
    setMonthlyPayment(monthlyConsumption * rate);
    setCustomPayment(customConsumption * rate);
  }, [monthlyConsumption, customConsumption, taxRate]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardService.getMyDevices(1, 100);
      setDevices(response.data);
    } catch (err: any) {
      console.error('Erro ao carregar dispositivos:', err);
      setError(err.message || 'Erro ao carregar dispositivos');
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyConsumption = async () => {
    if (devices.length === 0) return;

    try {
      setLoadingMonthly(true);
      const meterIds = devices.map(d => d.meterId);
      
      // Primeiro e último dia do mês atual
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const result = await dashboardService.calculateConsumption(meterIds, firstDay, lastDay);
      setMonthlyConsumption(result.totalConsumption);
    } catch (err: any) {
      console.error('Erro ao calcular consumo mensal:', err);
      setError(err.message || 'Erro ao calcular consumo mensal');
    } finally {
      setLoadingMonthly(false);
    }
  };

  const calculateCustomConsumption = async () => {
    if (devices.length === 0 || !startDate || !endDate) {
      alert('Por favor, selecione as datas inicial e final');
      return;
    }

    try {
      setLoadingCustom(true);
      const meterIds = devices.map(d => d.meterId);
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      if (start > end) {
        alert('A data inicial deve ser anterior à data final');
        return;
      }

      const result = await dashboardService.calculateConsumption(meterIds, start, end);
      setCustomConsumption(result.totalConsumption);
    } catch (err: any) {
      console.error('Erro ao calcular consumo personalizado:', err);
      setError(err.message || 'Erro ao calcular consumo personalizado');
    } finally {
      setLoadingCustom(false);
    }
  };

  const formatNumber = (num: number) => {
    return num.toFixed(2).replace('.', ',');
  };

  if (loading) {
    return (
      <div className="user-energy-page">
        <LoginParticles />
        <LoadingOverlay isVisible={true} text="Carregando..." />
      </div>
    );
  }

  return (
    <div className="user-energy-page">
      <LoginParticles />
      
      <div className="user-energy-container">
        <div className="user-energy-header">
          <div className="user-energy-title">
            <Zap size={32} />
            <h1>Meu Consumo de Energia</h1>
          </div>
          {user && (
            <p className="user-energy-subtitle">Olá, {user.email}</p>
          )}
        </div>

        {error && (
          <div className="user-energy-error">
            <p>{error}</p>
          </div>
        )}

        {devices.length === 0 ? (
          <div className="user-energy-empty">
            <Zap size={48} />
            <p>Nenhum medidor associado à sua conta</p>
          </div>
        ) : (
          <>
            {/* Relógio de Energia - Consumo Mensal */}
            <div className="energy-meter-card">
              <div className="energy-meter-header">
                <Calendar size={20} />
                <h2>Consumo do Mês Atual</h2>
              </div>
              <div className="energy-meter-display">
                <div className="energy-meter-value">
                  {loadingMonthly ? (
                    <div className="loading-spinner-small"></div>
                  ) : (
                    <>
                      <span className="energy-value">{formatNumber(monthlyConsumption)}</span>
                      <span className="energy-unit">kWh</span>
                    </>
                  )}
                </div>
                <div className="energy-meter-label">
                  {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Período Personalizado */}
            <div className="energy-meter-card">
              <div className="energy-meter-header">
                <TrendingUp size={20} />
                <h2>Período Personalizado</h2>
              </div>
              <div className="custom-period-form">
                <div className="date-input-group">
                  <label>Data Inicial</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={endDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="date-input-group">
                  <label>Data Final</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <button
                  className="calculate-button"
                  onClick={calculateCustomConsumption}
                  disabled={loadingCustom || !startDate || !endDate}
                >
                  {loadingCustom ? 'Calculando...' : 'Calcular Consumo'}
                </button>
              </div>
              {customConsumption > 0 && (
                <div className="energy-meter-display custom-result">
                  <div className="energy-meter-value">
                    <span className="energy-value">{formatNumber(customConsumption)}</span>
                    <span className="energy-unit">kWh</span>
                  </div>
                  <div className="energy-meter-label">
                    Período selecionado
                  </div>
                </div>
              )}
            </div>

            {/* Cálculo de Taxa */}
            <div className="energy-meter-card">
              <div className="energy-meter-header">
                <DollarSign size={20} />
                <h2>Cálculo de Pagamento</h2>
              </div>
              <div className="tax-input-group">
                <label>Taxa de Energia (R$ por kWh)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  placeholder="0.50"
                />
              </div>
              
              <div className="payment-results">
                <div className="payment-item">
                  <div className="payment-label">Pagamento Mensal</div>
                  <div className="payment-value">
                    R$ {formatNumber(monthlyPayment)}
                  </div>
                  <div className="payment-detail">
                    {formatNumber(monthlyConsumption)} kWh × R$ {formatNumber(parseFloat(taxRate) || 0)}
                  </div>
                </div>
                
                {customConsumption > 0 && (
                  <div className="payment-item">
                    <div className="payment-label">Pagamento Período Personalizado</div>
                    <div className="payment-value">
                      R$ {formatNumber(customPayment)}
                    </div>
                    <div className="payment-detail">
                      {formatNumber(customConsumption)} kWh × R$ {formatNumber(parseFloat(taxRate) || 0)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Informações dos Medidores */}
            <div className="energy-meter-card">
              <div className="energy-meter-header">
                <Zap size={20} />
                <h2>Medidores Associados</h2>
              </div>
              <div className="devices-list">
                {devices.map((device) => (
                  <div key={device.meterId} className="device-item">
                    <div className="device-name">{device.name}</div>
                    <div className="device-info">
                      <span>ID: {device.meterId}</span>
                      {device.location && <span>• {device.location}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserEnergyPage;

