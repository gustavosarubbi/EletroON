import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ChevronRight, 
  BarChart3,
  Wifi,
  WifiOff,
  Power,
  Activity,
  AlertTriangle,
  Timer,
  Database,
  CircleDot,
  LineChart
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import StatsCard from '../components/dashboard/StatsCard';
import Sidebar from '../components/dashboard/Sidebar';
import LoginParticles from '../components/ui/LoginParticles';
import Chart from '../components/dashboard/Chart';
import dashboardService from '../services/dashboardService';
import { DashboardStats, ConsumptionSummary, WeeklySummary } from '../types/dashboard';
import ToastContainer from '../components/ui/ToastContainer';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import '../styles/components/Dashboard.css';

const DashboardPage: React.FC = () => {
  const { toasts, removeToast } = useToast();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [consumption24h, setConsumption24h] = useState<ConsumptionSummary[]>([]);
  const [weeklyReadings, setWeeklyReadings] = useState<WeeklySummary[]>([]);
  const [activityLogs, setActivityLogs] = useState<{ type: string; message: string; time: string; timestamp: Date }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setLoadingCharts(true);
      console.log('Carregando dados do dashboard...');
      
      // Carregar estatísticas principais
      const statsData = await dashboardService.getStats();
      console.log('✅ Dados reais carregados com sucesso:', statsData);
      setStats(statsData);
      setHasError(false);
      
      // Carregar dados dos gráficos em paralelo
      try {
        const [consumptionData, weeklyData, logsData] = await Promise.all([
          dashboardService.getConsumptionLast24Hours(),
          dashboardService.getWeeklyReadings(),
          dashboardService.getActivityLogs(),
        ]);
        
        setConsumption24h(consumptionData);
        setWeeklyReadings(weeklyData);
        setActivityLogs(logsData);
      } catch (chartError) {
        console.error('Erro ao carregar dados dos gráficos:', chartError);
        // Não definir erro crítico, apenas continuar sem os gráficos
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados do dashboard:', error);
      setHasError(true);
      setStats(null);
    } finally {
      setLoading(false);
      setLoadingCharts(false);
    }
  };

  const consumption24hValid = useMemo(
    () => consumption24h.filter(item => item.reliability !== 'no-data'),
    [consumption24h]
  );

  const hasEstimated24h = useMemo(
    () => consumption24hValid.some(item => item.reliability === 'estimated'),
    [consumption24hValid]
  );

  const weeklyValid = useMemo(
    () => weeklyReadings.filter(item => item.reliability !== 'no-data'),
    [weeklyReadings]
  );

  const hasEstimatedWeekly = useMemo(
    () => weeklyValid.some(item => item.reliability === 'estimated'),
    [weeklyValid]
  );

  // Se há erro crítico, mostrar mensagem de erro
  if (hasError && !stats) {
    return (
      <div className="dashboard-page-container">
        <LoginParticles />
        <div className="dashboard-error-card">
          <div className="error-content">
            <h2>❌ Erro ao conectar com a API</h2>
            <p>Não foi possível carregar os dados do dashboard.</p>
            <p>Verifique se a API está rodando em <code>http://localhost:3000</code></p>
            <button 
              className="login-page-button"
              onClick={loadDashboardData}
              style={{ marginTop: '20px' }}
            >
              🔄 Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page-container">
      {/* Partículas animadas de fundo */}
      <LoginParticles />

      {/* Botão de Menu - Visível apenas quando sidebar está fechado */}
      {!sidebarVisible && (
        <button 
          className="dashboard-menu-toggle"
          onClick={() => setSidebarVisible(!sidebarVisible)}
          title="Abrir menu"
          aria-label="Toggle sidebar"
        >
          <svg width="56" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect y="0" width="24" height="6" rx="3" fill="white"/>
            <rect y="10" width="24" height="6" rx="3" fill="white"/>
            <rect y="20" width="24" height="6" rx="3" fill="white"/>
          </svg>
        </button>
      )}
      
      <div className="dashboard-title-section">
        <div className="dashboard-title-header">
          <div className="dashboard-breadcrumb">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
            <ChevronRight size={18} />
            <span className="breadcrumb-active">Visão Geral</span>
          </div>
        </div>
        <h1 className="dashboard-main-title">Visão Geral</h1>
        <p className="dashboard-subtitle">Monitore o desempenho e atividade do sistema</p>
      </div>

      {/* Sidebar */}
      <Sidebar 
        isVisible={sidebarVisible} 
        onClose={() => setSidebarVisible(false)} 
      />

      {/* Main Content */}
      <div className="dashboard-page-content">
        {/* Stats Cards */}
        {stats && (
          <section className="dashboard-stats-section">
            <StatsCard
              title="Total de Medidores"
              value={stats.totalDevices}
              icon={Database}
              color="blue"
              subtitle={`${stats.onlineDevices} online, ${stats.offlineDevices} offline`}
              percentage={100}
            />
            
            <StatsCard
              title="Medidores Online"
              value={stats.onlineDevices}
              icon={Wifi}
              color="green"
              subtitle={`${Math.round((stats.onlineDevices / stats.totalDevices) * 100)}% do total`}
              percentage={Math.round((stats.onlineDevices / stats.totalDevices) * 100)}
            />
            
            <StatsCard
              title="Medidores Offline"
              value={stats.offlineDevices}
              icon={WifiOff}
              color="red"
              subtitle={`${Math.round((stats.offlineDevices / stats.totalDevices) * 100)}% do total`}
              percentage={Math.round((stats.offlineDevices / stats.totalDevices) * 100)}
            />
            
            <StatsCard
              title="Medidores Disponíveis"
              value={stats.availableDevices}
              icon={CircleDot}
              color="amber"
              subtitle="Medidores não associados"
              percentage={stats.totalDevices > 0 ? Math.round((stats.availableDevices / stats.totalDevices) * 100) : 0}
            />
          </section>
        )}

        {/* Gráficos do Sistema */}
        {stats && (
          <section className="dashboard-charts-section">
            <div className="chart-card">
              <div className="chart-header">
                <LineChart size={20} />
                <h3 className="chart-title">Energia Monitorada (Últimas 24h)</h3>
              </div>
              {loadingCharts ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                  Carregando dados...
                </div>
              ) : consumption24hValid.length > 0 ? (
                <>
                  <Chart
                    data={{
                      labels: consumption24hValid.map(item => item.hour),
                      datasets: [
                        {
                          label: 'Consumo Líquido (kWh)',
                          data: consumption24hValid.map(item => item.netConsumption ?? item.consumption ?? 0),
                          borderColor: 'rgba(59, 130, 246, 0.85)',
                          backgroundColor: 'rgba(59, 130, 246, 0.15)',
                          fill: true,
                          tension: 0.4,
                        },
                        {
                          label: 'Consumo da Rede (kWh)',
                          data: consumption24hValid.map(item => item.importConsumption ?? 0),
                          borderColor: 'rgba(34, 197, 94, 0.85)',
                          backgroundColor: 'rgba(34, 197, 94, 0.12)',
                          fill: false,
                          tension: 0.4,
                        },
                        {
                          label: 'Geração Própria (kWh)',
                          data: consumption24hValid.map(item => item.generation ?? 0),
                          borderColor: 'rgba(249, 115, 22, 0.85)',
                          backgroundColor: 'rgba(249, 115, 22, 0.12)',
                          fill: false,
                          tension: 0.4,
                        },
                      ],
                    }}
                    title=""
                    height={300}
                  />
                  {hasEstimated24h && (
                    <p style={{ marginTop: 12, fontSize: '0.75rem', color: 'rgba(148, 163, 184, 0.9)' }}>
                      * Alguns intervalos foram estimados com base na potência média dos medidores.
                    </p>
                  )}
                </>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                  Nenhum dado disponível para o período
                </div>
              )}
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <BarChart3 size={20} />
                <h3 className="chart-title">Leituras de Energia por Período</h3>
              </div>
              {loadingCharts ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                  Carregando dados...
                </div>
              ) : weeklyValid.length > 0 ? (
                <>
                  <Chart
                    type="bar"
                    data={{
                      labels: weeklyValid.map(item => item.day),
                      datasets: [
                        {
                          label: 'Consumo da Rede (kWh)',
                          data: weeklyValid.map(item => item.importConsumption),
                          backgroundColor: 'rgba(59, 130, 246, 0.6)',
                          borderColor: 'rgba(59, 130, 246, 0.85)',
                          borderWidth: 2,
                        },
                        {
                          label: 'Geração Própria (kWh)',
                          data: weeklyValid.map(item => item.generation),
                          backgroundColor: 'rgba(250, 204, 21, 0.6)',
                          borderColor: 'rgba(250, 204, 21, 0.85)',
                          borderWidth: 2,
                        },
                        {
                          label: 'Consumo Líquido (kWh)',
                          data: weeklyValid.map(item => item.netConsumption),
                          type: 'line',
                          borderColor: 'rgba(34, 197, 94, 0.9)',
                          backgroundColor: 'rgba(34, 197, 94, 0.18)',
                          fill: false,
                          tension: 0.3,
                          borderWidth: 2.5,
                        },
                        {
                          label: 'Leituras Realizadas',
                          data: weeklyValid.map(item => item.count),
                          type: 'line',
                          yAxisID: 'y1',
                          borderColor: 'rgba(148, 163, 184, 0.85)',
                          backgroundColor: 'rgba(148, 163, 184, 0.25)',
                          fill: false,
                          tension: 0.2,
                          borderWidth: 2,
                        },
                      ],
                    }}
                    title=""
                    height={300}
                  />
                  {hasEstimatedWeekly && (
                    <p style={{ marginTop: 12, fontSize: '0.75rem', color: 'rgba(148, 163, 184, 0.9)' }}>
                      * Alguns dias foram estimados com base na potência média dos medidores.
                    </p>
                  )}
                </>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                  Nenhum dado disponível para o período
                </div>
              )}
            </div>
          </section>
        )}

        {/* Logs do Sistema */}
        <section className="dashboard-logs-section">
          <div className="logs-card">
            <div className="logs-header">
              <Activity size={18} />
              <h3>Logs do Sistema</h3>
            </div>
            <div className="logs-list">
              {loadingCharts ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                  Carregando logs...
                </div>
              ) : activityLogs.length > 0 ? (
                activityLogs.map((log, index) => {
                  const getIcon = () => {
                    if (log.type === 'success') return <Power size={16} />;
                    if (log.type === 'info') return <BarChart3 size={16} />;
                    if (log.type === 'warning') return <AlertTriangle size={16} />;
                    return <Database size={16} />;
                  };

                  const getIconClass = () => {
                    if (log.type === 'success') return 'success';
                    if (log.type === 'info') return 'info';
                    if (log.type === 'warning') return 'warning';
                    return 'info';
                  };

                  return (
                    <div key={index} className="log-item">
                      <div className={`log-icon ${getIconClass()}`}>
                        {getIcon()}
                      </div>
                      <div className="log-content">
                        <div className="log-message">{log.message}</div>
                        <div className="log-time">
                          <Timer size={14} />
                          <span>{log.time}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                  Nenhum log de atividade disponível
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Loading Overlay */}
      <LoadingOverlay 
        isVisible={loading}
        text="Carregando dashboard..."
        variant="dots"
        size="lg"
      />
      
      {/* Toast Container */}
      <ToastContainer 
        toasts={toasts}
        onRemoveToast={removeToast}
      />
    </div>
  );
};

export default DashboardPage;