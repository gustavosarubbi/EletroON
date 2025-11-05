import React from 'react';
import { X, User, Zap, Plus, Wifi, WifiOff, MapPin, UsersRound } from 'lucide-react';
import { UserData } from './types';

interface MeterManagementProps {
  regularUsers: UserData[];
  onAssociateMeter: (userId: number, meterId: number) => void;
  onDisassociateMeter: (userId: number, meterId: number) => void;
  onClose: () => void;
}

const MeterManagement: React.FC<MeterManagementProps> = ({
  regularUsers,
  onAssociateMeter,
  onDisassociateMeter,
  onClose,
}) => {
  const availableMeters = [401, 402, 403, 404, 405];

  return (
    <div className="meter-management-card">
      <div className="card-header">
        <h3>Gerenciamento de Medidores</h3>
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      <div className="card-body">
        {regularUsers.length > 0 ? (
          <div className="meter-users-grid">
            {regularUsers.map(user => (
              <div key={user.id} className="meter-user-card">
                <div className="user-card-header">
                  <div className="user-avatar">
                    <User size={20} />
                  </div>
                  <div className="user-info">
                    <div className="user-email">{user.email}</div>
                    <div className="user-badge">Usuário Regular</div>
                  </div>
                </div>

                <div className="meters-section">
                  <div className="section-title">
                    <Zap size={16} />
                    <span>Medidores Associados ({user.devices.length})</span>
                  </div>
                  <div className="meters-list">
                    {user.devices.length > 0 ? (
                      user.devices.map(device => (
                        <div key={device.meterId} className="meter-item">
                          <div className="meter-info">
                            <div className="meter-name">{device.name}</div>
                            <div className="meter-location">
                              <MapPin size={12} />
                              {device.location}
                            </div>
                            <div className={`meter-status-badge ${device.status.toLowerCase()}`}>
                              {device.status === 'ONLINE' ? <Wifi size={12} /> : <WifiOff size={12} />}
                              {device.status}
                            </div>
                          </div>
                          <button
                            className="remove-meter-btn"
                            onClick={() => onDisassociateMeter(user.id, device.meterId)}
                            title="Remover medidor"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="empty-meters">Nenhum medidor associado</div>
                    )}
                  </div>

                  <div className="available-meters-section">
                    <div className="section-title">
                      <Plus size={16} />
                      <span>Medidores Disponíveis</span>
                    </div>
                    <div className="available-meters-grid">
                      {availableMeters
                        .filter(id => !user.devices.some(d => d.meterId === id))
                        .map(meterId => (
                          <button
                            key={meterId}
                            className="available-meter-btn"
                            onClick={() => onAssociateMeter(user.id, meterId)}
                          >
                            <Zap size={14} />
                            <span>Medidor {meterId}</span>
                            <Plus size={14} />
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <UsersRound size={64} />
            <h4>Nenhum usuário regular encontrado</h4>
            <p>Adicione usuários regulares para gerenciar seus medidores</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeterManagement;
