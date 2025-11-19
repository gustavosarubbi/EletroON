import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboardService';
import { Device, Reading } from '../types/dashboard';
import { Zap, LogOut } from 'lucide-react';
import LoginParticles from '../components/ui/LoginParticles';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import VelocimeterMeter from '../components/user-dashboard/VelocimeterMeter';
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
  const [previousPeriodConsumption, setPreviousPeriodConsumption] = useState<number>(0);
  const [loadingConsumption, setLoadingConsumption] = useState(false);
  
  // Estados para período
  const [periodType, setPeriodType] = useState<PeriodType>('realtime');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [compareStartDate, setCompareStartDate] = useState<string>('');
  const [compareEndDate, setCompareEndDate] = useState<string>('');

  // Estados para gráfico
  const [chartReadings, setChartReadings] = useState<Reading[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);

  // Estados para alertas
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Estados para atualização em tempo real
  const [isUpdating, setIsUpdating] = useState(false);

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
        start = new Date(startDate);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      } else {
        // Mês atual como padrão
        start = new Date();
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
      }

      // Calcular consumo do período atual
      const result = await dashboardService.calculateConsumption(meterIds, start, end);
      setPeriodConsumption(result.totalConsumption);

      // Calcular período anterior para comparação
      const previousStart = new Date(start);
      const previousEnd = new Date(start);
      previousStart.setTime(previousStart.getTime() - (end.getTime() - start.getTime()));
      
      const previousResult = await dashboardService.calculateConsumption(meterIds, previousStart, previousEnd);
      setPreviousPeriodConsumption(previousResult.totalConsumption);

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
        start = new Date(startDate);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
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
        newAlerts.push({
          id: 'high-consumption',
          type: 'warning',
          message: `Consumo ${increase.toFixed(1)}% acima do período anterior`,
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
      return `${new Date(startDate).toLocaleDateString('pt-BR')} - ${new Date(endDate).toLocaleDateString('pt-BR')}`;
    }
    return new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const comparisonPercentage = previousPeriodConsumption > 0
    ? ((periodConsumption - previousPeriodConsumption) / previousPeriodConsumption) * 100
    : 0;

  const estimatedCost = periodConsumption * 0.75; // Taxa padrão
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
        <div className="user-dashboard-title">
          <Zap size={32} />
          <div>
            <h1>Meu Consumo de Energia</h1>
            {user && (
              <p className="user-dashboard-subtitle">
                Olá, {user.email}
                <button className="logout-button-inline" onClick={handleLogout} title="Sair">
                  <LogOut size={16} />
                </button>
              </p>
            )}
          </div>
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
          {/* Cards de Estatísticas */}
          <UserDashboardStats
            currentConsumption={currentConsumption}
            periodConsumption={periodConsumption}
            estimatedCost={estimatedCost}
            comparisonPercentage={comparisonPercentage}
            isLoading={loadingConsumption}
          />

          {/* Grid Principal */}
          <div className="user-dashboard-grid">
            {/* Velocímetro */}
            <div className="velocimeter-section">
              <div className="chart-card">
                <div className="chart-header">
                  <Zap size={20} />
                  <h3 className="chart-title">Consumo de Energia</h3>
                </div>
                <div className="velocimeter-container">
                  {loadingConsumption ? (
                    <div className="loading-spinner-small"></div>
                  ) : (
                    <VelocimeterMeter
                      currentValue={periodConsumption}
                      maxValue={calculateMaxValue(periodConsumption)}
                      period={getPeriodLabel()}
                      isUpdating={isUpdating}
                      unit="kWh"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Seletor de Medidores */}
            <div>
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
                <Zap size={20} />
                <h3 className="chart-title">Histórico de Consumo</h3>
              </div>
              <div className="chart-container-wrapper">
                <PeriodSelector
                  selectedPeriod={periodType}
                  onSelectPeriod={setPeriodType}
                  startDate={startDate}
                  endDate={endDate}
                  compareStartDate={compareStartDate}
                  compareEndDate={compareEndDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
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
                defaultRate={0.75}
                previousPeriodConsumption={previousPeriodConsumption}
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
