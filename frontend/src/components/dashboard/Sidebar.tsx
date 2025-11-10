import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  X,
  Power,
  LayoutDashboard,
  BarChart3,
  Zap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isVisible: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isVisible, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  if (!isVisible) {
    return null;
  }

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    onClose();
  };

  return (
    <>
      {/* Overlay com blur */}
      <div className="sidebar-overlay" onClick={onClose}></div>
      
      {/* Sidebar */}
      <div className="dashboard-sidebar">
        {/* Header da Sidebar */}
        <div className="dashboard-sidebar-header">
          <div className="dashboard-sidebar-brand">
            <div className="dashboard-sidebar-logo-wrapper">
              <div className="dashboard-sidebar-logo-glow"></div>
              <img 
                src="/logo_eletroon.png" 
                alt="EletroON Logo" 
                className="dashboard-sidebar-logo"
              />
            </div>
            <div className="dashboard-sidebar-brand-text">
              <h2 className="dashboard-sidebar-brand-title">EletroON</h2>
              <span className="dashboard-sidebar-brand-subtitle">Dashboard Admin</span>
            </div>
          </div>
          <button 
            className="dashboard-sidebar-toggle-btn"
            onClick={onClose}
            title="Fechar"
          >
            <X size={22} />
          </button>
        </div>

        {/* Navegação */}
        <nav className="dashboard-sidebar-nav">
          <div className="dashboard-nav-section">
            <div className="dashboard-nav-section-title">
              <span>Navegação</span>
            </div>
            <div 
              className={`dashboard-nav-item ${isActive('/admin/dashboard') ? 'active' : ''}`}
              onClick={() => handleNavigation('/admin/dashboard')}
            >
              <LayoutDashboard size={20} />
              <span>Visão Geral</span>
            </div>
            <div 
              className={`dashboard-nav-item ${isActive('/admin/usuarios') ? 'active' : ''}`}
              onClick={() => handleNavigation('/admin/usuarios')}
            >
              <Users size={20} />
              <span>Gerenciamento de Usuário</span>
            </div>
            <div 
              className={`dashboard-nav-item ${isActive('/admin/graficos-salas') ? 'active' : ''}`}
              onClick={() => handleNavigation('/admin/graficos-salas')}
            >
              <BarChart3 size={20} />
              <span>Gráfico das Salas</span>
            </div>
            <div 
              className={`dashboard-nav-item ${isActive('/admin/medidores') ? 'active' : ''}`}
              onClick={() => handleNavigation('/admin/medidores')}
            >
              <Zap size={20} />
              <span>Gerenciamento de Medidores</span>
            </div>
          </div>
        </nav>

        {/* Botão de Logout */}
        <div className="dashboard-sidebar-logout-section">
          <button 
            className="dashboard-nav-item dashboard-logout-btn"
            onClick={handleLogout}
          >
            <Power size={20} />
            <span>Sair</span>
          </button>
        </div>

        {/* Footer */}
        <div className="dashboard-sidebar-footer">
          <p>&copy; 2025 EletroON. Todos os direitos reservados.</p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;