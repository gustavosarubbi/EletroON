import React, { useState, useEffect } from 'react';
import { 
  Gauge, 
  Zap, 
  Wifi,
  WifiOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import StatsCard from '../components/dashboard/StatsCard';
import UserManager from '../components/dashboard/UserManager';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import Particles from '../components/dashboard/Particles';
// import Chart from '../components/dashboard/Chart'; // Para uso futuro
import dashboardService from '../services/dashboardService';
import { DashboardStats } from '../types/dashboard';
import ToastContainer from '../components/ui/ToastContainer';
// CSS imports are now handled by the main index.css file

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { toasts, removeToast } = useToast();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Debug: Log para verificar se o componente está sendo renderizado
  console.log('DashboardPage renderizando...', { user, loading, stats });

  // Carregar dados iniciais
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Carregando dados do dashboard...');
      
      // Carregar dados reais da API
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
      <div className="dashboard">
        <div className="dashboard-error">
          <div className="error-content">
            <h2>❌ Erro ao conectar com a API</h2>
            <p>Não foi possível carregar os dados do dashboard.</p>
            <p>Verifique se a API está rodando em <code>http://localhost:3000</code></p>
            <button 
              className="retry-btn"
              onClick={loadDashboardData}
            >
              🔄 Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Animated Background */}
      <Particles />
      
      {/* Header */}
      <Header 
        onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
        sidebarVisible={sidebarVisible}
      />
      
      {/* Sidebar */}
      <Sidebar 
        isVisible={sidebarVisible} 
        onClose={() => setSidebarVisible(false)} 
      />

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Stats Cards */}
        {stats && (
          <section className="stats-section">
            <StatsCard
              title="Total de Medidores"
              value={stats.totalDevices}
              icon={Gauge}
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
              icon={Zap}
              color="purple"
              subtitle="Medidores não associados"
              percentage={stats.totalDevices > 0 ? Math.round((stats.availableDevices / stats.totalDevices) * 100) : 0}
            />
          </section>
        )}

        {/* User Manager Section */}
        <section className="user-manager-section">
          <UserManager />
        </section>
      </div>

      {/* Toast Container */}
      <ToastContainer 
        toasts={toasts}
        onRemoveToast={removeToast}
      />
    </div>
  );
};

export default DashboardPage;
