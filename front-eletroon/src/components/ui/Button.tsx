import React from 'react';
import Loading from './Loading';

// ⚠️ IMPORTANTE: Este projeto usa pnpm para gerenciamento de pacotes

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  icon,
  iconPosition = 'left'
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold border-radius-md transition-normal focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-700 focus:ring-primary-500 shadow-md hover:shadow-lg',
    secondary: 'bg-secondary text-white hover:bg-secondary-700 focus:ring-secondary-500 shadow-md hover:shadow-lg',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary-500',
    ghost: 'text-primary hover:bg-primary-50 focus:ring-primary-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };
  
  const iconClasses = icon ? 'gap-2' : '';
  
  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${iconClasses} ${className}`;
  
  const renderIcon = () => {
    if (!icon) return null;
    
    if (loading) {
      return <Loading variant="spinner" size="sm" color="white" />;
    }
    
    return icon;
  };
  
  const renderContent = () => {
    if (iconPosition === 'right') {
      return (
        <>
          {children}
          {renderIcon()}
        </>
      );
    }
    
    return (
      <>
        {renderIcon()}
        {children}
      </>
    );
  };
  
  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {renderContent()}
    </button>
  );
};

export default Button;
