import React, { useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Settings, 
  User, 
  UserPlus, 
  Edit3, 
  Trash2,
  MoreVertical,
  Clock
} from 'lucide-react';
import { Device } from '../../types/dashboard';

interface DeviceCardProps {
  device: Device;
  onUpdateName: (meterId: number, name: string) => void;
  onCreateUser: (meterId: number, email: string, password: string) => void;
  onUpdateUser: (meterId: number, email?: string, password?: string) => void;
  onDeleteUser: (meterId: number) => void;
  onAssociateUser?: (meterId: number, userId: number) => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  onUpdateName,
  onCreateUser,
  onUpdateUser,
  onDeleteUser
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [newName, setNewName] = useState(device.name);

  const handleSaveName = () => {
    if (newName.trim() && newName !== device.name) {
      onUpdateName(device.meterId, newName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setNewName(device.name);
    setIsEditing(false);
  };

  const formatLastReading = (timestamp?: string) => {
    if (!timestamp) return 'Nunca';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="device-card">
      <div className="device-card-header">
        <div className="device-info">
          <div className="device-status">
            {device.status === 'ONLINE' ? (
              <div className="status-indicator online">
                <Wifi className="status-icon" size={16} />
                <span className="status-text">ONLINE</span>
              </div>
            ) : (
              <div className="status-indicator offline">
                <WifiOff className="status-icon" size={16} />
                <span className="status-text">OFFLINE</span>
              </div>
            )}
          </div>
          
          <div className="device-title">
            {isEditing ? (
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                className="device-name-input"
                autoFocus
              />
            ) : (
              <h3 className="device-name">{device.name}</h3>
            )}
            <p className="device-id">ID: {device.meterId}</p>
          </div>
        </div>

        <div className="device-actions">
          {isEditing ? (
            <div className="edit-actions">
              <button
                onClick={handleSaveName}
                className="action-btn save"
                title="Salvar"
              >
                ✓
              </button>
              <button
                onClick={handleCancelEdit}
                className="action-btn cancel"
                title="Cancelar"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="device-menu">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="menu-trigger"
                title="Opções"
              >
                <MoreVertical size={16} />
              </button>
              
              {showMenu && (
                <div className="device-menu-dropdown">
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    className="menu-item"
                  >
                    <Edit3 size={14} />
                    Editar nome
                  </button>
                  
                  {!device.associated ? (
                    <button
                      onClick={() => {
                        const email = prompt('Email do usuário:');
                        const password = prompt('Senha:');
                        if (email && password) {
                          onCreateUser(device.meterId, email, password);
                        }
                        setShowMenu(false);
                      }}
                      className="menu-item"
                    >
                      <UserPlus size={14} />
                      Criar usuário
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          const email = prompt('Novo email (deixe vazio para manter):');
                          const password = prompt('Nova senha (deixe vazio para manter):');
                          onUpdateUser(device.meterId, email || undefined, password || undefined);
                          setShowMenu(false);
                        }}
                        className="menu-item"
                      >
                        <User size={14} />
                        Editar usuário
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Tem certeza que deseja remover o usuário?')) {
                            onDeleteUser(device.meterId);
                          }
                          setShowMenu(false);
                        }}
                        className="menu-item danger"
                      >
                        <Trash2 size={14} />
                        Remover usuário
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="device-card-body">
        <div className="device-details">
          <div className="detail-item">
            <Clock size={14} />
            <span>Última leitura: {formatLastReading(device.lastReadingAt)}</span>
          </div>
          
          {device.location && (
            <div className="detail-item">
              <Settings size={14} />
              <span>Local: {device.location}</span>
            </div>
          )}
          
          {device.associated && device.user && (
            <div className="detail-item">
              <User size={14} />
              <span>Usuário: {device.user.email}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeviceCard;
