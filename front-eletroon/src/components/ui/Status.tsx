import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, Clock } from 'lucide-react';

// ⚠️ IMPORTANTE: Este projeto usa pnpm para gerenciamento de pacotes

interface StatusProps {
  type: 'success' | 'error' | 'warning' | 'info' | 'pending';
  text: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const Status: React.FC<StatusProps> = ({
  type,
  text,
  size = 'md',
  showIcon = true,
  className = ''
}) => {
  const getIcon = () => {
    if (!showIcon) return null;
    
    const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24;
    
    switch (type) {
      case 'success':
        return <CheckCircle size={iconSize} className="text-green-500" />;
      case 'error':
        return <XCircle size={iconSize} className="text-red-500" />;
      case 'warning':
        return <AlertTriangle size={iconSize} className="text-yellow-500" />;
      case 'info':
        return <Info size={iconSize} className="text-blue-500" />;
      case 'pending':
        return <Clock size={iconSize} className="text-gray-500" />;
      default:
        return <Info size={iconSize} className="text-blue-500" />;
    }
  };

  const getStatusClasses = () => {
    const baseClasses = 'inline-flex items-center gap-2 px-3 py-2 rounded-md font-medium';
    
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-50 text-green-700 border border-green-200`;
      case 'error':
        return `${baseClasses} bg-red-50 text-red-700 border border-red-200`;
      case 'warning':
        return `${baseClasses} bg-yellow-50 text-yellow-700 border border-yellow-200`;
      case 'info':
        return `${baseClasses} bg-blue-50 text-blue-700 border border-blue-200`;
      case 'pending':
        return `${baseClasses} bg-gray-50 text-gray-700 border border-gray-200`;
      default:
        return `${baseClasses} bg-gray-50 text-gray-700 border border-gray-200`;
    }
  };

  return (
    <div className={`${getStatusClasses()} ${className}`}>
      {getIcon()}
      <span className="text-sm">{text}</span>
    </div>
  );
};

export default Status;
