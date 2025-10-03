import React, { forwardRef } from 'react';

// ⚠️ IMPORTANTE: Este projeto usa pnpm para gerenciamento de pacotes

interface InputProps {
  label?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  success?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  id?: string;
  name?: string;
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  required = false,
  error,
  success,
  icon,
  iconPosition = 'left',
  size = 'md',
  className = '',
  id,
  name,
  autoComplete,
  maxLength,
  minLength
}, ref) => {
  const baseClasses = 'w-full border-2 border-neutral-200 border-radius-md transition-normal focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg'
  };
  
  const stateClasses = error 
    ? 'border-error-500 focus:ring-error-500 focus:border-error-500' 
    : success 
    ? 'border-success-500 focus:ring-success-500 focus:border-success-500'
    : 'border-neutral-200 focus:ring-primary-500 focus:border-primary-500';
  
  const iconClasses = icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : '';
  
  const inputClasses = `${baseClasses} ${sizeClasses[size]} ${stateClasses} ${iconClasses} ${className}`;
  
  const containerClasses = 'relative';
  
  const labelClasses = 'block text-sm font-medium text-neutral-700 mb-2';
  
  const messageClasses = error 
    ? 'text-error-600 text-sm mt-1' 
    : success 
    ? 'text-success-600 text-sm mt-1' 
    : '';
  
  const renderIcon = () => {
    if (!icon) return null;
    
    const iconClasses = `absolute top-1/2 transform -translate-y-1/2 ${
      iconPosition === 'left' ? 'left-3' : 'right-3'
    } text-neutral-400`;
    
    return (
      <div className={iconClasses}>
        {icon}
      </div>
    );
  };
  
  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={id} className={labelClasses}>
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && renderIcon()}
        
        <input
          ref={ref}
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          maxLength={maxLength}
          minLength={minLength}
          className={inputClasses}
        />
        
        {icon && iconPosition === 'right' && renderIcon()}
      </div>
      
      {(error || success) && (
        <p className={messageClasses}>
          {error || success}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
