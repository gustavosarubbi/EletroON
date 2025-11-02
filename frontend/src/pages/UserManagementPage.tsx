import React from 'react';
import { LayoutDashboard, ChevronRight, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import UserManager from '../components/dashboard/UserManager';
import LoginParticles from '../components/ui/LoginParticles';
import Sidebar from '../components/dashboard/Sidebar';
import '../styles/components/Dashboard.css';

const UserManagementPage: React.FC = () => {
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

      {/* Título com Breadcrumb */}
      <div className="dashboard-title-section">
        <div className="dashboard-title-header">
          <div className="dashboard-breadcrumb">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
            <ChevronRight size={18} />
            <span className="breadcrumb-active">Gerenciamento de Usuário</span>
          </div>
        </div>
        <h1 className="dashboard-main-title">Gerenciamento de Usuário</h1>
        <p className="dashboard-subtitle">Gerencie usuários, permissões e medidores associados</p>
      </div>

      {/* Sidebar */}
      <Sidebar 
        isVisible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />

      <div className="dashboard-page-content">
        <UserManager />
      </div>
    </div>
  );
};

export default UserManagementPage;

