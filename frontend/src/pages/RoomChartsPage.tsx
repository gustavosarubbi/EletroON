import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginParticles from '../components/ui/LoginParticles';
import Sidebar from '../components/dashboard/Sidebar';
import Chart from '../components/dashboard/Chart';
import '../styles/components/Dashboard.css';

const RoomChartsPage: React.FC = () => {
  const { user } = useAuth();
  const [sidebarVisible, setSidebarVisible] = React.useState(false);

  return (
    <div className="dashboard-page-container">
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
      
      <Sidebar 
        isVisible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />

      <div className="dashboard-page-content">
        <div className="dashboard-title-section">
          <div className="dashboard-title-header">
            <h1 className="dashboard-main-title">Gráfico das Salas</h1>
          </div>
          <p className="dashboard-subtitle">
            Visualize gráficos e estatísticas das salas e medidores
          </p>
        </div>

        <section className="dashboard-charts-section">
          <Chart />
        </section>
      </div>
    </div>
  );
};

export default RoomChartsPage;

