import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboardService';
import { Device, Reading } from '../types/dashboard';
import { Zap, LogOut, LayoutGrid, ChevronRight, DollarSign, Calculator, Clock, Gauge, BarChart3 } from 'lucide-react';
import LoginParticles from '../components/ui/LoginParticles';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import GaugeComponent from 'react-gauge-component';
import UserDashboardStats from '../components/user-dashboard/UserDashboardStats';
import MeterSelector from '../components/user-dashboard/MeterSelector';
import PaymentCalculator from '../components/user-dashboard/PaymentCalculator';
import AlertsPanel, { Alert } from '../components/user-dashboard/AlertsPanel';
import PeriodSelector, { PeriodType } from '../components/user-dashboard/PeriodSelector';
import ConsumptionChart from '../components/ui/ConsumptionChart';
import '../styles/components/UserDashboard.css';

const UserEnergyPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para medidor selecionado
  const [selectedMeterId, setSelectedMeterId] = useState<number | 'all'>('all');
  
  // Estados para consumo
  const [currentConsumption, setCurrentConsumption] = useState<number>(0); // kW atual
  const [periodConsumption, setPeriodConsumption] = useState<number>(0); // kWh do período
  const [lastHourConsumption, setLastHourConsumption] = useState<number>(0); // kWh da última 1 hora
  const [previousPeriodConsumption, setPreviousPeriodConsumption] = useState<number>(0);
  const [previousMonthConsumption, setPreviousMonthConsumption] = useState<number>(0); // kWh do mês anterior (para calculadora)
  const [loadingConsumption, setLoadingConsumption] = useState(false);
  
  // Estados para período
  const [periodType, setPeriodType] = useState<PeriodType>('realtime');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('00:00');
  const [endTime, setEndTime] = useState<string>('23:59');
  const [compareStartDate, setCompareStartDate] = useState<string>('');
  const [compareEndDate, setCompareEndDate] = useState<string>('');

  // Estados para gráfico
  const [chartReadings, setChartReadings] = useState<Reading[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);

  // Estados para alertas
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Estados para atualização em tempo real
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Estado para tarifa
  const [rate, setRate] = useState<string>('0.75');

  // Carregar dispositivos do usuário
  useEffect(() => {
    loadDevices();
  }, []);

  // Carregar dados quando dispositivos ou período mudarem
  useEffect(() => {
    if (devices.length > 0) {
      loadConsumptionData();
      loadChartData();
      generateAlerts();
    }
  }, [devices, selectedMeterId, periodType, startDate, endDate, compareStartDate, compareEndDate]);

  // Atualização em tempo real (a cada 30 segundos)
  useEffect(() => {
    if (periodType === 'realtime' && devices.length > 0) {
      const interval = setInterval(() => {
        setIsUpdating(true);
        loadConsumptionData();
        loadChartData();
        setTimeout(() => setIsUpdating(false), 2000);
      }, 30000); // 30 segundos

      return () => clearInterval(interval);
    }
  }, [periodType, devices]);


  const loadDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardService.getMyDevices(1, 100);
      setDevices(response.data || []);
      
      if (!response.data || response.data.length === 0) {
        setError(null);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dispositivos:', err);
      
      let errorMessage = 'Erro ao carregar dispositivos';
      
      if (err.response) {
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
        errorMessage = 'Erro de conexão. Verifique se o backend está rodando e acessível.';
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const loadConsumptionData = async () => {
    if (devices.length === 0) return;

    try {
      setLoadingConsumption(true);
      const meterIds = selectedMeterId === 'all' 
        ? devices.map(d => d.meterId)
        : [selectedMeterId as number];

      let start: Date;
      let end: Date = new Date();

      if (periodType === 'realtime') {
        // Últimas 24 horas
        start = new Date();
        start.setHours(start.getHours() - 24);
      } else if (periodType === 'custom' && startDate && endDate) {
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        start = new Date(startDate);
        start.setHours(startHour || 0, startMinute || 0, 0, 0);
        end = new Date(endDate);
        end.setHours(endHour || 23, endMinute || 59, 59, 999);
      } else {
        // Mês atual como padrão
        start = new Date();
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
      }

      // Calcular consumo do período atual
      const result = await dashboardService.calculateConsumption(meterIds, start, end);
      setPeriodConsumption(result.totalConsumption);

      // Calcular consumo da última 1 hora
      const lastHourStart = new Date();
      lastHourStart.setHours(lastHourStart.getHours() - 1);
      const lastHourResult = await dashboardService.calculateConsumption(meterIds, lastHourStart, end);
      setLastHourConsumption(lastHourResult.totalConsumption);

      // Calcular período anterior para comparação - SEMPRE mês anterior completo
      const now = new Date();
      const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousStart.setHours(0, 0, 0, 0);
      const previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      previousEnd.setHours(23, 59, 59, 999);
      
      const previousResult = await dashboardService.calculateConsumption(meterIds, previousStart, previousEnd);
      setPreviousPeriodConsumption(previousResult.totalConsumption);

      // Calcular sempre o mês anterior completo para a calculadora de pagamento
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousMonthStart.setHours(0, 0, 0, 0);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      previousMonthEnd.setHours(23, 59, 59, 999);
      
      const previousMonthResult = await dashboardService.calculateConsumption(meterIds, previousMonthStart, previousMonthEnd);
      setPreviousMonthConsumption(previousMonthResult.totalConsumption);

      // Calcular consumo atual (última leitura - penúltima leitura)
      if (result.readings.length >= 2) {
        const sorted = result.readings.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        const last = sorted[sorted.length - 1];
        const prev = sorted[sorted.length - 2];
        const diff = Math.max(0, (last.ept_c || 0) - (prev.ept_c || 0));
        // Converter para kW (assumindo intervalo de 1 hora)
        setCurrentConsumption(diff);
      }

    } catch (err: any) {
      console.error('Erro ao calcular consumo:', err);
    } finally {
      setLoadingConsumption(false);
    }
  };

  const loadChartData = async () => {
    if (devices.length === 0) return;

    try {
      setLoadingChart(true);
      const meterIds = selectedMeterId === 'all' 
        ? devices.map(d => d.meterId)
        : [selectedMeterId as number];

      let start: Date;
      let end: Date = new Date();

      if (periodType === 'realtime') {
        start = new Date();
        start.setHours(start.getHours() - 24);
      } else if (periodType === 'custom' && startDate && endDate) {
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        start = new Date(startDate);
        start.setHours(startHour || 0, startMinute || 0, 0, 0);
        end = new Date(endDate);
        end.setHours(endHour || 23, endMinute || 59, 59, 999);
      } else {
        start = new Date();
        start.setDate(start.getDate() - 7);
      }

      const result = await dashboardService.calculateConsumption(meterIds, start, end);
      setChartReadings(result.readings);

      // Se for modo comparativo, carregar segundo período
      // TODO: Implementar visualização comparativa no gráfico
      if (periodType === 'compare' && compareStartDate && compareEndDate) {
        const compareStart = new Date(compareStartDate);
        const compareEnd = new Date(compareEndDate);
        compareEnd.setHours(23, 59, 59, 999);
        
        const compareResult = await dashboardService.calculateConsumption(meterIds, compareStart, compareEnd);
        // Por enquanto, apenas carregamos os dados mas não exibimos
        // Futuramente, podemos criar um gráfico comparativo
        console.log('Dados comparativos carregados:', compareResult.readings.length, 'leituras');
      }

    } catch (err: any) {
      console.error('Erro ao carregar dados do gráfico:', err);
    } finally {
      setLoadingChart(false);
    }
  };

  const generateAlerts = () => {
    const newAlerts: Alert[] = [];

    // Verificar medidores offline
    devices.forEach(device => {
      if (device.status === 'OFFLINE') {
        newAlerts.push({
          id: `offline-${device.meterId}`,
          type: 'error',
          message: 'Medidor offline',
          timestamp: new Date(),
          deviceId: device.meterId,
          deviceName: device.name || `Medidor ${device.meterId}`,
        });
      }
    });

    // Verificar consumo alto (acima de 20% da média)
    if (previousPeriodConsumption > 0) {
      const increase = ((periodConsumption - previousPeriodConsumption) / previousPeriodConsumption) * 100;
      if (increase > 20) {
        const previousLabel = getPreviousPeriodLabel();
        newAlerts.push({
          id: 'high-consumption',
          type: 'warning',
          message: `Consumo ${increase.toFixed(1)}% acima de ${previousLabel}`,
          timestamp: new Date(),
        });
      }
    }

    setAlerts(newAlerts);
  };

  const handleApplyPeriod = () => {
    loadConsumptionData();
    loadChartData();
  };

  const handleQuickPeriod = (period: '1h' | '24h' | '1m') => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    if (period === '1h') {
      setPeriodType('custom');
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      setStartDate(today);
      setEndDate(today);
      setStartTime(`${oneHourAgo.getHours().toString().padStart(2, '0')}:${oneHourAgo.getMinutes().toString().padStart(2, '0')}`);
      setEndTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    } else if (period === '24h') {
      setPeriodType('realtime');
      setStartDate('');
      setEndDate('');
      setStartTime('00:00');
      setEndTime('23:59');
    } else if (period === '1m') {
      setPeriodType('custom');
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(today);
      setStartTime('00:00');
      setEndTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    }
    
    // Aguardar um pouco para os estados atualizarem
    setTimeout(() => {
      loadConsumptionData();
      loadChartData();
    }, 100);
  };

  const getActiveQuickPeriod = (): '1h' | '24h' | '1m' | null => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    
    if (periodType === 'realtime') {
      return '24h';
    } else if (periodType === 'custom' && startDate && endDate) {
      if (startDate === endDate && startDate === today) {
        // Verificar se é aproximadamente 1 hora
        const start = new Date(`${startDate}T${startTime}`);
        const end = new Date(`${endDate}T${endTime}`);
        const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        if (diffHours >= 0.9 && diffHours <= 1.1) {
          return '1h';
        }
      }
      if (startDate === firstDayOfMonth && endDate === today) {
        return '1m';
      }
    }
    return null;
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  };

  const calculateMaxValue = (consumption: number): number => {
    if (consumption === 0) return 1000;
    const baseValue = consumption * 1.3;
    if (baseValue < 100) return 100;
    if (baseValue < 500) return Math.ceil(baseValue / 50) * 50;
    if (baseValue < 1000) return Math.ceil(baseValue / 100) * 100;
    if (baseValue < 5000) return Math.ceil(baseValue / 500) * 500;
    return Math.ceil(baseValue / 1000) * 1000;
  };

  const getPeriodLabel = (): string => {
    if (periodType === 'realtime') {
      return 'Últimas 24 horas';
    } else if (periodType === 'custom' && startDate && endDate) {
      const startStr = new Date(startDate).toLocaleDateString('pt-BR');
      const endStr = new Date(endDate).toLocaleDateString('pt-BR');
      if (startDate === endDate) {
        return `${startStr} ${startTime} - ${endTime}`;
      }
      return `${startStr} ${startTime} - ${endStr} ${endTime}`;
    }
    return new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const getPreviousPeriodLabel = (): string => {
    // Sempre retorna o mês anterior completo
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return lastMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const getPreviousMonthLabel = (): string => {
    // Sempre retorna o mês anterior completo
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return lastMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const estimatedCost = lastHourConsumption * 0.75; // Taxa padrão baseada na última 1 hora
  const projectedConsumption = periodConsumption > 0 
    ? (periodConsumption / (endDate && startDate 
        ? (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
        : 30)) * 30
    : undefined;

  if (loading) {
    return (
      <div className="user-dashboard-page">
        <LoginParticles />
        <LoadingOverlay isVisible={true} text="Carregando..." />
      </div>
    );
  }

  return (
    <div className="user-dashboard-page">
      <LoginParticles />
      
      <div className="user-dashboard-header">
        {/* Breadcrumb e Logout */}
        <div className="user-dashboard-header-top">
          <div className="user-dashboard-breadcrumb">
            <LayoutGrid size={18} />
            <span>Dashboard</span>
            <ChevronRight size={16} />
            <span className="breadcrumb-current">Meu Consumo</span>
          </div>
          {user && (
            <button className="user-dashboard-logout-btn" onClick={handleLogout} title="Sair">
              <LogOut size={18} />
              <span>Sair</span>
            </button>
          )}
        </div>
        
        {/* Título Principal */}
        <div className="user-dashboard-title-section">
          <h1>Meu Consumo de Energia</h1>
          <p className="user-dashboard-subtitle">
            Acompanhe seu consumo de energia em tempo real
          </p>
        </div>
      </div>

      {error && (
        <div className="user-dashboard-error">
          <p>{error}</p>
          <button className="retry-button" onClick={loadDevices}>
            Tentar Novamente
          </button>
        </div>
      )}

      {!error && devices.length === 0 && !loading ? (
        <div className="user-dashboard-empty">
          <Zap size={48} />
          <p>Nenhum medidor associado à sua conta</p>
          <p>Entre em contato com o administrador para associar medidores à sua conta.</p>
        </div>
      ) : devices.length > 0 ? (
        <div className="user-dashboard-content">
          {/* Grid Principal */}
          <div className="user-dashboard-grid">
            {/* Velocímetro */}
            <div className="velocimeter-section">
              <div className="chart-card">
                <div className="chart-header">
                  <div className="chart-header-left">
                    <Gauge size={20} />
                    <h3 className="chart-title">Medidor de Consumo</h3>
                  </div>
                  <div className="chart-quick-periods">
                    <button
                      className={`quick-period-btn ${getActiveQuickPeriod() === '1h' ? 'active' : ''}`}
                      onClick={() => handleQuickPeriod('1h')}
                      title="Última 1 hora"
                    >
                      1h
                    </button>
                    <button
                      className={`quick-period-btn ${getActiveQuickPeriod() === '24h' ? 'active' : ''}`}
                      onClick={() => handleQuickPeriod('24h')}
                      title="Últimas 24 horas"
                    >
                      24h
                    </button>
                    <button
                      className={`quick-period-btn ${getActiveQuickPeriod() === '1m' ? 'active' : ''}`}
                      onClick={() => handleQuickPeriod('1m')}
                      title="Último mês"
                    >
                      1 mês
                    </button>
                  </div>
                </div>
                <div className="velocimeter-container">
                  {loadingConsumption ? (
                    <div className="loading-spinner-small"></div>
                  ) : (
                    <div className="gauge-chart-wrapper">
                      {isUpdating && (
                        <div className="update-indicator">
                          <div className="update-pulse"></div>
                          <span>Atualizando...</span>
                        </div>
                      )}
                      <div className="gauge-container-with-labels">
                        {(() => {
                          const maxValue = calculateMaxValue(periodConsumption);
                          const currentValue = periodConsumption;
                          
                          // Criar mais ticks para os números ao redor do gauge (0%, 10%, 20%, 30%, 40%, 50%, 60%, 70%, 80%, 90%, 100%)
                          const ticks = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map(percent => ({
                            value: percent * maxValue
                          }));
                          
                          return (
                            <GaugeComponent
                              value={currentValue}
                              minValue={0}
                              maxValue={maxValue}
                              arc={{
                                nbSubArcs: 50,
                                colorArray: ['#3b82f6', '#60a5fa', '#818cf8', '#a78bfa', '#c084fc', '#d946ef'],
                                width: 0.35,
                                padding: 0.02,
                                cornerRadius: 12
                              }}
                              pointer={{
                                type: 'needle',
                                color: '#3b82f6',
                                baseColor: '#6366f1',
                                animate: true,
                                animationDuration: 1500
                              }}
                              labels={{
                                valueLabel: {
                                  formatTextValue: () => ''
                                },
                                tickLabels: {
                                  type: 'outer',
                                  ticks: ticks,
                                  defaultTickValueConfig: {
                                    formatTextValue: (value: number) => value.toFixed(value >= 1000 ? 0 : value >= 100 ? 0 : 1),
                                    style: {
                                      fontSize: '14px',
                                      fill: 'rgba(255, 255, 255, 0.9)',
                                      fontWeight: 700
                                    }
                                  }
                                }
                              }}
                              style={{ height: '400px' }}
                            />
                          );
                        })()}
                      </div>
                      <div className="gauge-display">
                        <div className="gauge-value-display">
                          <Zap className="gauge-icon" size={20} />
                          <span className="gauge-value-number">
                            {periodConsumption.toFixed(2)}
                          </span>
                          <span className="gauge-value-unit">kWh</span>
                        </div>
                        
                        <div className="gauge-cost-display">
                          <DollarSign className="gauge-cost-icon" size={16} />
                          <span className="gauge-cost-label">Custo Total:</span>
                          <span className="gauge-cost-value">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(periodConsumption * (parseFloat(rate) || 0))}
                          </span>
                        </div>

                        <div className="gauge-rate-input">
                          <label htmlFor="gauge-rate">
                            <Calculator className="gauge-rate-icon" size={14} />
                            Tarifa (R$/kWh)
                          </label>
                          <input
                            id="gauge-rate"
                            type="number"
                            step="0.01"
                            min="0"
                            value={rate}
                            onChange={(e) => setRate(e.target.value)}
                            placeholder="0.75"
                          />
                        </div>
                        
                        <div className="gauge-period">
                          <Clock className="gauge-period-icon" size={14} />
                          {getPeriodLabel()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Seletor de Medidores */}
            <div>
              {/* Seletor de Período para Cards */}
              <div className="stats-period-selector">
                <PeriodSelector
                  selectedPeriod={periodType}
                  onSelectPeriod={setPeriodType}
                  startDate={startDate}
                  endDate={endDate}
                  startTime={startTime}
                  endTime={endTime}
                  compareStartDate={compareStartDate}
                  compareEndDate={compareEndDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                  onStartTimeChange={setStartTime}
                  onEndTimeChange={setEndTime}
                  onCompareStartDateChange={setCompareStartDate}
                  onCompareEndDateChange={setCompareEndDate}
                  onApply={handleApplyPeriod}
                />
              </div>

              {/* Cards de Estatísticas */}
              <UserDashboardStats
                currentConsumption={currentConsumption}
                periodConsumption={periodConsumption}
                estimatedCost={estimatedCost}
                previousPeriodConsumption={previousPeriodConsumption}
                periodLabel={getPeriodLabel()}
                previousPeriodLabel={getPreviousPeriodLabel()}
                isLoading={loadingConsumption}
              />
              
              <MeterSelector
                devices={devices}
                selectedMeterId={selectedMeterId}
                onSelectMeter={setSelectedMeterId}
              />
            </div>
          </div>

          {/* Gráfico de Consumo */}
          <div className="user-dashboard-full-width">
            <div className="chart-card">
              <div className="chart-header">
                <BarChart3 size={20} />
                <h3 className="chart-title">Histórico de Consumo</h3>
              </div>
              <div className="chart-container-wrapper">
                <PeriodSelector
                  selectedPeriod={periodType}
                  onSelectPeriod={setPeriodType}
                  startDate={startDate}
                  endDate={endDate}
                  startTime={startTime}
                  endTime={endTime}
                  compareStartDate={compareStartDate}
                  compareEndDate={compareEndDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                  onStartTimeChange={setStartTime}
                  onEndTimeChange={setEndTime}
                  onCompareStartDateChange={setCompareStartDate}
                  onCompareEndDateChange={setCompareEndDate}
                  onApply={handleApplyPeriod}
                />
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
          </div>

          {/* Grid Inferior */}
          <div className="user-dashboard-grid">
            {/* Calculadora de Pagamento */}
            <div>
              <PaymentCalculator
                consumption={periodConsumption}
                defaultRate={parseFloat(rate) || 0.75}
                previousPeriodConsumption={previousMonthConsumption}
                previousPeriodLabel={getPreviousMonthLabel()}
                projectedConsumption={projectedConsumption}
              />
            </div>

            {/* Painel de Alertas */}
            <div>
              <AlertsPanel alerts={alerts} isLoading={false} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default UserEnergyPage;
