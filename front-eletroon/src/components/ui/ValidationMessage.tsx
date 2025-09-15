import React from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

// ⚠️ IMPORTANTE: Este projeto usa pnpm para gerenciamento de pacotes

interface ValidationMessageProps {
  type: 'success' | 'error' | 'warning';
  message: string;
  show: boolean;
  className?: string;
}

const ValidationMessage: React.FC<ValidationMessageProps> = ({
  type,
  message,
  show,
  className = ''
}) => {
  if (!show) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'error':
        return <XCircle size={16} className="text-red-500" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      default:
        return <XCircle size={16} className="text-red-500" />;
    }
  };

  const getMessageClasses = () => {
    const baseClasses = 'flex items-center gap-2 text-sm font-medium mt-2 transition-all duration-200 ease-in-out';
    
    switch (type) {
      case 'success':
        return `${baseClasses} text-green-600`;
      case 'error':
        return `${baseClasses} text-red-600`;
      case 'warning':
        return `${baseClasses} text-yellow-600`;
      default:
        return `${baseClasses} text-red-600`;
    }
  };

  return (
    <div className={`${getMessageClasses()} ${className}`}>
      {getIcon()}
      <span>{message}</span>
    </div>
  );
};

export default ValidationMessage;

