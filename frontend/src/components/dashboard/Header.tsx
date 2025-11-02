import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarVisible: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, sidebarVisible }) => {
  const location = useLocation();
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/admin/dashboard':
        return { title: 'Visão Geral', subtitle: 'Dashboard Administrativo' };
      case '/admin/usuarios':
        return { title: 'Gerenciamento de Usuário', subtitle: 'Gerencie usuários e permissões' };
      case '/admin/graficos-salas':
        return { title: 'Gráfico das Salas', subtitle: 'Visualize estatísticas das salas' };
      default:
        return { title: 'Dashboard', subtitle: 'Dashboard Administrativo' };
    }
  };

  const { title, subtitle } = getPageTitle();

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <button 
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          title={sidebarVisible ? 'Ocultar sidebar' : 'Mostrar sidebar'}
        >
          <Menu size={20} />
        </button>
        <div className="header-title">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
