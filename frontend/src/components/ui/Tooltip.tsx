import React, { useState } from 'react';
import { AlertTriangle, Info, XCircle, CheckCircle } from 'lucide-react';

// ⚠️ IMPORTANTE: Este projeto usa pnpm para gerenciamento de pacotes

interface TooltipProps {
  type?: 'error' | 'warning' | 'info' | 'success';
  message: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  type = 'error',
  message,
  children,
  position = 'top',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <XCircle size={16} className="text-red-500" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'info':
        return <Info size={16} className="text-blue-500" />;
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />;
      default:
        return <AlertTriangle size={16} className="text-red-500" />;
    }
  };

  const getTooltipClasses = () => {
    const baseClasses = 'absolute z-50 px-3 py-2 text-sm font-medium rounded-lg shadow-lg border border-opacity-20 transition-all duration-200 ease-in-out whitespace-nowrap';
    
    switch (type) {
      case 'error':
        return `${baseClasses} bg-red-100 text-red-800 border-red-300`;
      case 'warning':
        return `${baseClasses} bg-yellow-100 text-yellow-800 border-yellow-300`;
      case 'info':
        return `${baseClasses} bg-blue-100 text-blue-800 border-blue-300`;
      case 'success':
        return `${baseClasses} bg-green-100 text-green-800 border-green-300`;
      default:
        return `${baseClasses} bg-red-100 text-red-800 border-red-300`;
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-t-red-100 border-l-transparent border-r-transparent border-b-transparent';
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-b-red-100 border-l-transparent border-r-transparent border-t-transparent';
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-l-red-100 border-t-transparent border-b-transparent border-r-transparent';
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-r-red-100 border-t-transparent border-b-transparent border-l-transparent';
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 border-t-red-100 border-l-transparent border-r-transparent border-b-transparent';
    }
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <div className={`${getTooltipClasses()} ${getPositionClasses()}`}>
          <div className="flex items-center gap-2">
            {getIcon()}
            <span>{message}</span>
          </div>
          
          {/* Seta do tooltip */}
          <div className={`absolute w-0 h-0 border-4 ${getArrowClasses()}`} />
        </div>
      )}
    </div>
  );
};

export default Tooltip;

