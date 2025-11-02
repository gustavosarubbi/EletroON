import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginParticles from '../components/ui/LoginParticles';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import Chart from '../components/dashboard/Chart';
import '../styles/components/Dashboard.css';

const RoomChartsPage: React.FC = () => {
  const { user } = useAuth();
  const [sidebarVisible, setSidebarVisible] = React.useState(false);

  return (
    <div className="dashboard-page-container">
      <LoginParticles />
      
      <Header 
        onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
        sidebarVisible={sidebarVisible}
      />
      
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

