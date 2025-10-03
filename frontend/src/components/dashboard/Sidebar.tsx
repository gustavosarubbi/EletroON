import React from 'react';
import { 
  Users, 
  X
} from 'lucide-react';

interface SidebarProps {
  isVisible: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isVisible, onClose }) => {


  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Overlay com blur */}
      <div className="sidebar-overlay" onClick={onClose}></div>
      
      {/* Sidebar */}
      <div className="sidebar">
      {/* Header da Sidebar */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Users size={24} />
          </div>
          <div className="brand-text">
            <h2>EletroON</h2>
            <span>Gerenciador de Usuários</span>
          </div>
        </div>
        <button 
          className="sidebar-toggle"
          onClick={onClose}
          title="Fechar"
        >
          <X size={20} />
        </button>
      </div>


      {/* Navegação */}
      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">
            <span>Gerenciamento</span>
          </div>
          <div className="nav-item active">
            <Users size={20} />
            <span>Gerenciador de Usuários</span>
          </div>
        </div>
      </nav>

      </div>
    </>
  );
};

export default Sidebar;
