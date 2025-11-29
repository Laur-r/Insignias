import React from 'react';

const Button = ({ 
  children, 
  type = 'button', 
  variant = 'primary', 
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  className = '',
  ...props 
}) => {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const fullWidthClass = fullWidth ? 'btn-full-width' : '';
  const loadingClass = loading ? 'btn-loading' : '';
  const disabledClass = (disabled || loading) ? 'btn-disabled' : '';

  const buttonClass = [
    baseClass,
    variantClass,
    fullWidthClass,
    loadingClass,
    disabledClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="btn-spinner">
          <svg className="spinner" viewBox="0 0 24 24">
            <circle 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4" 
              fill="none"
              strokeDasharray="32"
              strokeDashoffset="32"
            />
          </svg>
        </span>
      )}
      <span className={`btn-text ${loading ? 'btn-text-loading' : ''}`}>
        {children}
      </span>
    </button>
  );
};

export default Button;