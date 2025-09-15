import React from 'react';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarVisible: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, sidebarVisible }) => {
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
          <h1>Gerenciador de Usuários</h1>
          <p>Dashboard Administrativo</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
