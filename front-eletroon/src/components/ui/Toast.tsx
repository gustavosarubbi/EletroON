import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
// CSS imports are now handled by the main index.css file

// ⚠️ IMPORTANTE: Este projeto usa pnpm para gerenciamento de pacotes

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 1000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const [progressWidth, setProgressWidth] = useState('100%');

  useEffect(() => {
    // start enter animation
    const enterTimer = setTimeout(() => setIsEntering(false), 10);

    // auto close timer
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    // start progress animation
    requestAnimationFrame(() => {
      setProgressWidth('0%');
    });

    return () => {
      clearTimeout(timer);
      clearTimeout(enterTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose(id);
    }, 300);
  };

  const getIcon = () => {
    const size = 16;
    switch (type) {
      case 'success':
        return <CheckCircle size={size} />;
      case 'error':
        return <XCircle size={size} />;
      case 'warning':
        return <AlertTriangle size={size} />;
      case 'info':
      default:
        return <Info size={size} />;
    }
  };

  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`toast ${
        isExiting ? 'exiting' : isEntering ? 'entering' : 'visible'
      }`}
    >
      {/* Left accent bar */}
      <div className={`toast-accent ${type}`} />

      {/* Icon container */}
      <div className={`toast-icon ${type}`}>
        {getIcon()}
      </div>

      {/* Content */}
      <div className="toast-content">
        <p className="toast-title">{title}</p>
        {message && (
          <p className="toast-message">{message}</p>
        )}
      </div>

      {/* Close button */}
      <span
        onClick={handleClose}
        className="toast-close"
        aria-label="Fechar notificação"
      >
        ×
      </span>

      {/* Progress bar */}
      <div className="toast-progress">
        <div
          className={`toast-progress-bar ${type}`}
          style={{ width: progressWidth, transition: `width ${duration}ms linear` }}
        />
      </div>
    </div>
  );
};

export default Toast;
