import React, { useState, useEffect } from 'react';
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
import { DashboardStats } from '../types/dashboard';
import ToastContainer from '../components/ui/ToastContainer';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import '../styles/components/Dashboard.css';

const DashboardPage: React.FC = () => {
  const { toasts, removeToast } = useToast();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Carregando dados do dashboard...');
      
      const statsData = await dashboardService.getStats();
      console.log('✅ Dados reais carregados com sucesso:', statsData);
      setStats(statsData);
      setHasError(false);
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados do dashboard:', error);
      setHasError(true);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

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
                <h3 className="chart-title">Consumo de Energia (Últimas 24h)</h3>
              </div>
              <Chart
                data={{
                  labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
                  datasets: [{
                    label: 'Consumo (kWh)',
                    data: [125, 98, 145, 167, 189, 156, 142],
                    borderColor: 'rgba(59, 130, 246, 0.8)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                  }]
                }}
                title=""
                height={300}
              />
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <BarChart3 size={20} />
                <h3 className="chart-title">Leituras de Energia por Período</h3>
              </div>
              <Chart
                type="bar"
                data={{
                  labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
                  datasets: [{
                    label: 'Consumo Total (kWh)',
                    data: [1250, 1380, 1190, 1420, 1560, 1680, 1450],
                    backgroundColor: 'rgba(139, 92, 246, 0.6)',
                    borderColor: 'rgba(139, 92, 246, 0.8)',
                    borderWidth: 2
                  }, {
                    label: 'Leituras Realizadas',
                    data: [45, 52, 48, 55, 58, 62, 50],
                    backgroundColor: 'rgba(59, 130, 246, 0.6)',
                    borderColor: 'rgba(59, 130, 246, 0.8)',
                    borderWidth: 2
                  }]
                }}
                title=""
                height={300}
              />
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
              <div className="log-item">
                <div className="log-icon success">
                  <Power size={16} />
                </div>
                <div className="log-content">
                  <div className="log-message">Medidor #401 conectado com sucesso</div>
                  <div className="log-time">
                    <Timer size={14} />
                    <span>Há 2 minutos</span>
                  </div>
                </div>
              </div>
              <div className="log-item">
                <div className="log-icon info">
                  <BarChart3 size={16} />
                </div>
                <div className="log-content">
                  <div className="log-message">Leitura de energia realizada em 5 medidores</div>
                  <div className="log-time">
                    <Timer size={14} />
                    <span>Há 15 minutos</span>
                  </div>
                </div>
              </div>
              <div className="log-item">
                <div className="log-icon warning">
                  <AlertTriangle size={16} />
                </div>
                <div className="log-content">
                  <div className="log-message">Medidor #305 offline - verificando conexão</div>
                  <div className="log-time">
                    <Timer size={14} />
                    <span>Há 32 minutos</span>
                  </div>
                </div>
              </div>
              <div className="log-item">
                <div className="log-icon success">
                  <Power size={16} />
                </div>
                <div className="log-content">
                  <div className="log-message">Medidor #402 conectado com sucesso</div>
                  <div className="log-time">
                    <Timer size={14} />
                    <span>Há 1 hora</span>
                  </div>
                </div>
              </div>
              <div className="log-item">
                <div className="log-icon info">
                  <Database size={16} />
                </div>
                <div className="log-content">
                  <div className="log-message">Backup do banco de dados realizado</div>
                  <div className="log-time">
                    <Timer size={14} />
                    <span>Há 2 horas</span>
                  </div>
                </div>
              </div>
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