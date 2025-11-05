import React from 'react';
import { X, Zap, Wifi, WifiOff, MapPin, Clock } from 'lucide-react';
import { UserData } from './types';

interface MetersModalProps {
  user: UserData;
  onClose: () => void;
}

const MetersModal: React.FC<MetersModalProps> = ({ user, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-modern" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-modern">
          <h3>Medidores de {user.email}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="modal-body-modern">
          {user.devices.length > 0 ? (
            <div className="meters-list-modern">
              {user.devices.map(device => (
                <div key={device.meterId} className="meter-card-modern">
                  <div className="meter-header-modern">
                    <div className="meter-icon">
                      <Zap size={20} />
                    </div>
                    <div className="meter-title-modern">
                      <div className="meter-name-modern">{device.name}</div>
                      <div className={`meter-status-modern ${device.status.toLowerCase()}`}>
                        {device.status === 'ONLINE' ? <Wifi size={14} /> : <WifiOff size={14} />}
                        {device.status}
                      </div>
                    </div>
                  </div>
                  <div className="meter-details-modern">
                    <div className="meter-detail-item">
                      <MapPin size={14} />
                      <span>{device.location || 'Localização não definida'}</span>
                    </div>
                    {device.lastReading && (
                      <div className="meter-detail-item">
                        <Clock size={14} />
                        <span>Última leitura: {new Date(device.lastReading.timestamp).toLocaleString('pt-BR')}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Zap size={64} />
              <h4>Nenhum medidor associado</h4>
              <p>Este usuário ainda não possui medidores associados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetersModal;
