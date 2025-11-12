import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboardService';
import { Device, Reading } from '../types/dashboard';
import { Zap, Calendar, DollarSign, TrendingUp, LogOut } from 'lucide-react';
import LoginParticles from '../components/ui/LoginParticles';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import EnergyMeter from '../components/ui/EnergyMeter';
import ConsumptionChart from '../components/ui/ConsumptionChart';
import '../styles/components/UserEnergy.css';

const UserEnergyPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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

  // Estados para gráfico de consumo
  const [chartReadings, setChartReadings] = useState<Reading[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);

  // Carregar dispositivos do usuário
  useEffect(() => {
    loadDevices();
  }, []);

  // Calcular consumo mensal ao carregar dispositivos
  useEffect(() => {
    if (devices.length > 0) {
      calculateMonthlyConsumption();
      loadChartData();
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
      setDevices(response.data || []);
      
      // Se não houver dispositivos, não é um erro, apenas informação
      if (!response.data || response.data.length === 0) {
        setError(null); // Limpar qualquer erro anterior
      }
    } catch (err: any) {
      console.error('Erro ao carregar dispositivos:', err);
      
      // Tratar diferentes tipos de erro
      let errorMessage = 'Erro ao carregar dispositivos';
      
      if (err.response) {
        // Erro de resposta do servidor
        const status = err.response.status;
        if (status === 401) {
          errorMessage = 'Sessão expirada. Por favor, faça login novamente.';
        } else if (status === 403) {
          errorMessage = 'Você não tem permissão para acessar os dispositivos.';
        } else if (status === 404) {
          errorMessage = 'Endpoint não encontrado. Verifique se o backend está configurado corretamente.';
        } else if (status >= 500) {
          errorMessage = 'Erro no servidor. Tente novamente mais tarde.';
        } else {
          errorMessage = err.response.data?.message || err.message || errorMessage;
        }
      } else if (err.request) {
        // Erro de rede (sem resposta do servidor)
        errorMessage = 'Erro de conexão. Verifique se o backend está rodando e acessível.';
      } else {
        // Outro tipo de erro
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      setDevices([]); // Garantir que devices está vazio em caso de erro
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
      setChartReadings(result.readings);
    } catch (err: any) {
      console.error('Erro ao calcular consumo personalizado:', err);
      setError(err.message || 'Erro ao calcular consumo personalizado');
    } finally {
      setLoadingCustom(false);
    }
  };

  const loadChartData = async () => {
    if (devices.length === 0) return;

    try {
      setLoadingChart(true);
      const meterIds = devices.map(d => d.meterId);
      
      // Buscar dados dos últimos 7 dias para o gráfico
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const result = await dashboardService.calculateConsumption(meterIds, startDate, endDate);
      setChartReadings(result.readings);
    } catch (err: any) {
      console.error('Erro ao carregar dados do gráfico:', err);
    } finally {
      setLoadingChart(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  };

  const formatNumber = (num: number) => {
    return num.toFixed(2).replace('.', ',');
  };

  const calculateMaxValue = (consumption: number): number => {
    if (consumption === 0) return 1000;
    
    // Calcular um maxValue que seja aproximadamente 30% maior que o consumo atual
    // mas sempre arredondado para um valor "redondo" (múltiplo de 100, 500, 1000, etc)
    const baseValue = consumption * 1.3;
    
    if (baseValue < 100) {
      return 100;
    } else if (baseValue < 500) {
      return Math.ceil(baseValue / 50) * 50;
    } else if (baseValue < 1000) {
      return Math.ceil(baseValue / 100) * 100;
    } else if (baseValue < 5000) {
      return Math.ceil(baseValue / 500) * 500;
    } else {
      return Math.ceil(baseValue / 1000) * 1000;
    }
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
          <div className="user-energy-title-section">
            <div className="user-energy-title">
              <Zap size={32} />
              <h1>Meu Consumo de Energia</h1>
            </div>
            {user && (
              <div className="user-energy-user-info">
                <p className="user-energy-subtitle">Olá, {user.email}</p>
                <button className="logout-button" onClick={handleLogout} title="Sair">
                  <LogOut size={20} />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="user-energy-error">
            <p>{error}</p>
            <button 
              className="retry-button" 
              onClick={loadDevices}
              style={{ marginTop: '1rem' }}
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {!error && devices.length === 0 && !loading ? (
          <div className="user-energy-empty">
            <Zap size={48} />
            <p>Nenhum medidor associado à sua conta</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.7 }}>
              Entre em contato com o administrador para associar medidores à sua conta.
            </p>
          </div>
        ) : devices.length > 0 ? (
          <div className="futuristic-layout">
            {/* Relógio Central - Elemento Principal */}
            <div className="main-meter-container">
              <div className="meter-glow-effect"></div>
              <div className="energy-meter-card energy-meter-card-hero">
                <div className="energy-meter-header hero-header">
                  <Calendar size={28} />
                  <h2>Consumo do Mês Atual</h2>
                </div>
                <div className="energy-meter-wrapper-container">
                  {loadingMonthly ? (
                    <div className="loading-spinner-small"></div>
                  ) : (
                    <EnergyMeter
                      value={monthlyConsumption}
                      maxValue={calculateMaxValue(monthlyConsumption)}
                      unit="kWh"
                      label={new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      size={600}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Grid de Informações Secundárias */}
            <div className="secondary-info-grid">
              {/* Gráfico de Consumo */}
              <div className="energy-meter-card futuristic-card">
                <div className="energy-meter-header">
                  <TrendingUp size={20} />
                  <h2>Gráfico de Consumo</h2>
                </div>
                <div className="chart-container-wrapper">
                  {loadingChart ? (
                    <div className="loading-spinner-small"></div>
                  ) : (
                    <ConsumptionChart
                      readings={chartReadings}
                      title="Consumo de Energia ao Longo do Tempo"
                      height={300}
                    />
                  )}
                </div>
              </div>

              {/* Cálculo de Taxa */}
              <div className="energy-meter-card futuristic-card">
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

              {/* Período Personalizado */}
              <div className="energy-meter-card futuristic-card">
                <div className="energy-meter-header">
                  <Calendar size={20} />
                  <h2>Análise de Período Personalizado</h2>
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
                  <>
                    <div className="energy-meter-display custom-result">
                      <div className="energy-meter-value">
                        <span className="energy-value">{formatNumber(customConsumption)}</span>
                        <span className="energy-unit">kWh</span>
                      </div>
                      <div className="energy-meter-label">
                        Período selecionado
                      </div>
                    </div>
                    {chartReadings.length > 0 && (
                      <div className="chart-container-wrapper" style={{ marginTop: '1.5rem' }}>
                        <ConsumptionChart
                          readings={chartReadings}
                          title="Consumo no Período Selecionado"
                          height={250}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Informações dos Medidores */}
              <div className="energy-meter-card futuristic-card">
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
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default UserEnergyPage;

