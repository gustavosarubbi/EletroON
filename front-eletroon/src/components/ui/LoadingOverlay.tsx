import React from 'react';
import Loading from './Loading';


interface LoadingOverlayProps {
  isVisible: boolean;
  text?: string;
  variant?: 'spinner' | 'dots' | 'bars' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  text = 'Carregando...',
  variant = 'spinner',
  size = 'lg',
  className = ''
}) => {
  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg p-8 shadow-2xl flex flex-col items-center space-y-4">
        <Loading 
          variant={variant} 
          size={size} 
          color="primary" 
          text={text}
        />
      </div>
    </div>
  );
};

export default LoadingOverlay;
