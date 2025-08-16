'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useSecurity } from '../security/security-provider';

interface SecureButtonProps {
  children: React.ReactNode;
  onClick: () => void | Promise<void>;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  confirmText?: string;
  requireConfirmation?: boolean;
}

export function SecureButton({
  children,
  onClick,
  className = '',
  disabled = false,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  confirmText = 'Are you sure?',
  requireConfirmation = false,
}: SecureButtonProps) {
  const { rateLimit, logSecurityEvent } = useSecurity();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const lastClickTime = useRef(0);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Prevent rapid clicking
  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      
      const now = Date.now();
      const timeSinceLastClick = now - lastClickTime.current;
      
      // Rate limiting
      if (!rateLimit('button_click')) {
        logSecurityEvent('BUTTON_RATE_LIMIT_EXCEEDED', { buttonText: children });
        return;
      }

      // Prevent rapid clicking (less than 500ms apart)
      if (timeSinceLastClick < 500) {
        logSecurityEvent('RAPID_CLICK_ATTEMPT', { timeSinceLastClick });
        return;
      }

      lastClickTime.current = now;
      setClickCount(prev => prev + 1);

      // Require confirmation for sensitive actions
      if (requireConfirmation && !showConfirmation) {
        setShowConfirmation(true);
        // Auto-hide confirmation after 5 seconds
        setTimeout(() => setShowConfirmation(false), 5000);
        return;
      }

      // Prevent double execution
      if (isProcessing || loading) {
        logSecurityEvent('BUTTON_ALREADY_PROCESSING', { buttonText: children });
        return;
      }

      setIsProcessing(true);
      logSecurityEvent('BUTTON_CLICK', { buttonText: children, variant, type });

      try {
        // Add a small delay to prevent accidental clicks
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await onClick();
        
        // Reset confirmation state
        if (showConfirmation) {
          setShowConfirmation(false);
        }
      } catch (error) {
        logSecurityEvent('BUTTON_CLICK_ERROR', { 
          buttonText: children, 
          error: error instanceof Error ? error.message : String(error) 
        });
        console.error('SecureButton error:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    [
      onClick,
      rateLimit,
      logSecurityEvent,
      children,
      requireConfirmation,
      showConfirmation,
      isProcessing,
      loading,
      variant,
      type
    ]
  );

  // Handle keyboard events for accessibility and security
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Prevent certain key combinations
      if (e.ctrlKey && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        logSecurityEvent('BLOCKED_KEYBOARD_COMBO', { key: e.key });
        return;
      }

      // Allow Enter and Space for button activation
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick(e as any);
      }
    },
    [handleClick, logSecurityEvent]
  );

  // Handle focus events for security monitoring
  const handleFocus = useCallback(() => {
    logSecurityEvent('BUTTON_FOCUS', { buttonText: children });
  }, [logSecurityEvent, children]);

  // Get button styles based on variant and state
  const getButtonStyles = () => {
    const baseStyles = 'font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900';
    
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    const variantStyles = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
      success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    };

    const stateStyles = (isProcessing || loading || disabled) 
      ? 'opacity-50 cursor-not-allowed' 
      : 'cursor-pointer hover:scale-105 active:scale-95';

    return `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${stateStyles} ${className}`;
  };

  const isDisabled = disabled || isProcessing || loading;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type={type}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        disabled={isDisabled}
        className={getButtonStyles()}
        data-secure-button="true"
        data-variant={variant}
        data-processing={isProcessing || loading}
      >
        {isProcessing || loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing...
          </div>
        ) : showConfirmation ? (
          <div className="flex items-center">
            <span className="mr-2">⚠️</span>
            {confirmText}
          </div>
        ) : (
          children
        )}
      </button>

      {/* Security indicator */}
      {clickCount > 0 && (
        <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {clickCount}
        </div>
      )}

      {/* Confirmation overlay */}
      {showConfirmation && requireConfirmation && (
        <div className="absolute -top-12 left-0 bg-yellow-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          Click again to confirm
        </div>
      )}
    </div>
  );
}
