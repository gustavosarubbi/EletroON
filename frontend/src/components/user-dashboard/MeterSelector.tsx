import React from 'react';
import { Device } from '../../types/dashboard';
import { Wifi, WifiOff } from 'lucide-react';
import '../../styles/components/UserDashboard.css';

interface MeterSelectorProps {
  devices: Device[];
  selectedMeterId: number | 'all';
  onSelectMeter: (meterId: number | 'all') => void;
}

const MeterSelector: React.FC<MeterSelectorProps> = ({
  devices,
  selectedMeterId,
  onSelectMeter,
}) => {
  const getDeviceStatus = (device: Device) => {
    // Verificar se o dispositivo está online (baseado em status)
    return device.status === 'ONLINE';
  };

  return (
    <div className="meter-selector-container">
      <div className="meter-selector-header">
        <h3>📍 Meus Medidores</h3>
        <span className="meter-count">{devices.length} medidor{devices.length !== 1 ? 'es' : ''}</span>
      </div>

      <div className="meter-selector-filters">
        <button
          className={`meter-filter-button ${selectedMeterId === 'all' ? 'active' : ''}`}
          onClick={() => onSelectMeter('all')}
        >
          Todos
        </button>
        {devices.map((device) => (
          <button
            key={device.meterId}
            className={`meter-filter-button ${selectedMeterId === device.meterId ? 'active' : ''}`}
            onClick={() => onSelectMeter(device.meterId)}
          >
            {device.name || `Medidor ${device.meterId}`}
          </button>
        ))}
      </div>

      <div className="meter-cards-grid">
        {devices.map((device) => {
          const isOnline = getDeviceStatus(device);
          const isSelected = selectedMeterId === device.meterId || selectedMeterId === 'all';

          return (
            <div
              key={device.meterId}
              className={`meter-card ${isSelected ? 'selected' : ''} ${isOnline ? 'online' : 'offline'}`}
              onClick={() => onSelectMeter(device.meterId)}
            >
              <div className="meter-card-header">
                <div className="meter-card-status">
                  {isOnline ? (
                    <>
                      <Wifi size={16} />
                      <span>Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff size={16} />
                      <span>Offline</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="meter-card-body">
                <h4 className="meter-card-name">
                  {device.name || `Medidor ${device.meterId}`}
                </h4>
                {device.location && (
                  <p className="meter-card-location">{device.location}</p>
                )}
                <p className="meter-card-id">ID: {device.meterId}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MeterSelector;

