import React from 'react';


interface LoadingProps {
  variant?: 'spinner' | 'dots' | 'bars' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white' | 'neutral';
  text?: string;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({
  variant = 'spinner',
  size = 'md',
  color = 'primary',
  text,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    white: 'text-white',
    neutral: 'text-neutral-500'
  };

  const renderSpinner = () => (
    <div className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}>
      <svg fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  );

  const renderDots = () => (
    <div className={`flex space-x-1 ${colorClasses[color]}`}>
      <div className={`${sizeClasses.sm} bg-current rounded-full animate-pulse`} style={{ animationDelay: '0ms' }} />
      <div className={`${sizeClasses.sm} bg-current rounded-full animate-pulse`} style={{ animationDelay: '150ms' }} />
      <div className={`${sizeClasses.sm} bg-current rounded-full animate-pulse`} style={{ animationDelay: '300ms' }} />
    </div>
  );

  const renderBars = () => (
    <div className={`flex space-x-1 ${colorClasses[color]}`}>
      <div className={`${sizeClasses.sm} bg-current animate-pulse`} style={{ animationDelay: '0ms', animationDuration: '1s' }} />
      <div className={`${sizeClasses.sm} bg-current animate-pulse`} style={{ animationDelay: '200ms', animationDuration: '1s' }} />
      <div className={`${sizeClasses.sm} bg-current animate-pulse`} style={{ animationDelay: '400ms', animationDuration: '1s' }} />
    </div>
  );

  const renderPulse = () => (
    <div className={`${sizeClasses[size]} ${colorClasses[color]} bg-current rounded-full animate-pulse`} />
  );

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'bars':
        return renderBars();
      case 'pulse':
        return renderPulse();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      {renderLoader()}
      {text && (
        <p className={`text-sm font-medium ${colorClasses[color]} animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );
};

export default Loading;
