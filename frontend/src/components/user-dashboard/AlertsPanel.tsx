import React from 'react';
import { AlertTriangle, CheckCircle, WifiOff, Zap } from 'lucide-react';
import '../../styles/components/UserDashboard.css';

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'success' | 'info';
  message: string;
  timestamp: Date;
  deviceId?: number;
  deviceName?: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
  isLoading?: boolean;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, isLoading = false }) => {
  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return <WifiOff size={18} />;
      case 'warning':
        return <AlertTriangle size={18} />;
      case 'success':
        return <CheckCircle size={18} />;
      default:
        return <Zap size={18} />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `Há ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
    if (diffHours < 24) return `Há ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    return `Há ${diffDays} dia${diffDays !== 1 ? 's' : ''}`;
  };

  if (isLoading) {
    return (
      <div className="alerts-panel-container">
        <div className="alerts-panel-header">
          <AlertTriangle size={20} />
          <h3>Alertas e Notificações</h3>
        </div>
        <div className="alerts-loading">Carregando alertas...</div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="alerts-panel-container">
        <div className="alerts-panel-header">
          <CheckCircle size={20} />
          <h3>Alertas e Notificações</h3>
        </div>
        <div className="alerts-empty">
          <CheckCircle size={32} />
          <p>Sistema funcionando normalmente</p>
          <span>Nenhum alerta no momento</span>
        </div>
      </div>
    );
  }

  return (
    <div className="alerts-panel-container">
      <div className="alerts-panel-header">
        <AlertTriangle size={20} />
        <h3>Alertas e Notificações</h3>
        {alerts.length > 0 && <span className="alerts-count">{alerts.length}</span>}
      </div>

      <div className="alerts-list">
        {alerts.map((alert) => (
          <div key={alert.id} className={`alert-item ${alert.type}`}>
            <div className={`alert-icon ${alert.type}`}>
              {getAlertIcon(alert.type)}
            </div>
            <div className="alert-content">
              <div className="alert-message">{alert.message}</div>
              {alert.deviceName && (
                <div className="alert-device">{alert.deviceName}</div>
              )}
              <div className="alert-time">{formatTime(alert.timestamp)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertsPanel;

