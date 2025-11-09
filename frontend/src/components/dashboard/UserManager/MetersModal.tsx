import React, { useState } from 'react';
import { X, Zap, Wifi, WifiOff, MapPin, Clock, Activity } from 'lucide-react';
import { UserData } from './types';

interface MetersModalProps {
  user: UserData;
  onClose: () => void;
}

const MetersModal: React.FC<MetersModalProps> = ({ user, onClose }) => {
  const [expandedMeter, setExpandedMeter] = useState<number | null>(null);

  const formatLastReading = (timestamp?: string) => {
    if (!timestamp) return 'Nunca';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h atrás`;
    return date.toLocaleString('pt-BR');
  };

  const formatReadingValue = (qt?: number) => {
    if (!qt) return 'N/A';
    return `${qt.toLocaleString('pt-BR')} kWh`;
  };

  const onlineMeters = user.devices.filter(d => d.status === 'ONLINE').length;
  const offlineMeters = user.devices.filter(d => d.status === 'OFFLINE').length;

  return (
    <div className="meters-modal-overlay" onClick={onClose}>
      <div className="meters-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="meters-modal-header">
          <div className="meters-modal-title-section">
            <h3>Medidores de {user.email}</h3>
            <div className="meters-modal-stats">
              <span className="meter-stat-badge online">
                <Wifi size={12} />
                {onlineMeters} Online
              </span>
              <span className="meter-stat-badge offline">
                <WifiOff size={12} />
                {offlineMeters} Offline
              </span>
              <span className="meter-stat-badge total">
                {user.devices.length} Total
              </span>
            </div>
          </div>
          <button className="meters-modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="meters-modal-body">
          {user.devices.length > 0 ? (
            <div className="meters-grid-enhanced">
              {user.devices.map((device) => {
                const isExpanded = expandedMeter === device.meterId;
                
                return (
                  <div
                    key={device.meterId}
                    className={`meter-card-enhanced ${device.status.toLowerCase()} ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => setExpandedMeter(isExpanded ? null : device.meterId)}
                  >
                    <div className="meter-card-enhanced-header">
                      <div className="meter-card-enhanced-icon">
                        <Zap size={24} />
                      </div>
                      <div className="meter-card-enhanced-info">
                        <div className="meter-card-enhanced-name">{device.name}</div>
                        <div className="meter-card-enhanced-id">ID: {device.meterId}</div>
                      </div>
                      <div className={`meter-card-enhanced-status ${device.status.toLowerCase()}`}>
                        {device.status === 'ONLINE' ? (
                          <>
                            <Wifi size={16} />
                            <span>ONLINE</span>
                          </>
                        ) : (
                          <>
                            <WifiOff size={16} />
                            <span>OFFLINE</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="meter-card-enhanced-body">
                      {device.location && (
                        <div className="meter-detail-row">
                          <MapPin size={14} />
                          <span>{device.location}</span>
                        </div>
                      )}
                      
                      <div className="meter-detail-row">
                        <Clock size={14} />
                        <span>Última leitura: {formatLastReading(device.lastReadingAt)}</span>
                      </div>

                      {device.lastReading && (
                        <div className="meter-reading-card">
                          <div className="meter-reading-header">
                            <Activity size={14} />
                            <span>Última Medição</span>
                          </div>
                          <div className="meter-reading-content">
                            <div className="meter-reading-value">
                              {formatReadingValue(device.lastReading.qt)}
                            </div>
                            <div className="meter-reading-time">
                              {new Date(device.lastReading.timestamp).toLocaleString('pt-BR')}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="meter-card-enhanced-expanded">
                        <div className="meter-expanded-section">
                          <h4>Informações Detalhadas</h4>
                          <div className="meter-expanded-details">
                            <div className="meter-expanded-detail-item">
                              <strong>Status:</strong>
                              <span className={`status-text ${device.status.toLowerCase()}`}>
                                {device.status}
                              </span>
                            </div>
                            <div className="meter-expanded-detail-item">
                              <strong>Medidor ID:</strong>
                              <span>{device.meterId}</span>
                            </div>
                            {device.location && (
                              <div className="meter-expanded-detail-item">
                                <strong>Localização:</strong>
                                <span>{device.location}</span>
                              </div>
                            )}
                            {device.lastReading && (
                              <>
                                <div className="meter-expanded-detail-item">
                                  <strong>Valor da Leitura:</strong>
                                  <span>{formatReadingValue(device.lastReading.qt)}</span>
                                </div>
                                <div className="meter-expanded-detail-item">
                                  <strong>Data/Hora:</strong>
                                  <span>{new Date(device.lastReading.timestamp).toLocaleString('pt-BR')}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="meters-modal-empty-state">
              <Zap size={64} />
              <h4>Nenhum medidor associado</h4>
              <p>Este usuário ainda não possui medidores associados.</p>
              <p className="meters-modal-empty-hint">
                Use o gerenciamento de medidores para associar medidores a este usuário.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetersModal;
