'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useSecurity } from '../security/security-provider';

interface SecureInputProps {
  type: 'steamId' | 'amount' | 'general' | 'text';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
}

export function SecureInput({
  type,
  placeholder,
  value,
  onChange,
  onBlur,
  label,
  required = false,
  disabled = false,
  maxLength,
  className = '',
}: SecureInputProps) {
  const { validateInput, sanitizeInput, rateLimit, logSecurityEvent } = useSecurity();
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [lastChangeTime, setLastChangeTime] = useState(0);

  // Debounced input handling to prevent excessive validation
  const debouncedValidation = useCallback(
    (inputValue: string) => {
      const now = Date.now();
      if (now - lastChangeTime < 300) return; // Debounce for 300ms
      setLastChangeTime(now);

      if (!rateLimit('input_validation')) return;

      const validation = validateInput(inputValue, type);
      setIsValid(validation.isValid);
      setErrorMessage(validation.error || '');

      if (validation.isValid) {
        logSecurityEvent('INPUT_VALIDATED', { type, value: inputValue });
      } else {
        logSecurityEvent('INPUT_VALIDATION_FAILED', { type, value: inputValue, error: validation.error });
      }
    },
    [type, validateInput, rateLimit, logSecurityEvent, lastChangeTime]
  );

  // Handle input change with security measures
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Rate limiting
      if (!rateLimit('input_change')) return;

      // Sanitize input
      const sanitizedValue = sanitizeInput(inputValue, type);
      
      // Length validation
      if (maxLength && sanitizedValue.length > maxLength) {
        setErrorMessage(`Maximum length is ${maxLength} characters`);
        setIsValid(false);
        return;
      }

      // Update value
      onChange(sanitizedValue);
      setIsValid(true);
      setErrorMessage('');

      // Debounced validation
      debouncedValidation(sanitizedValue);

      logSecurityEvent('INPUT_CHANGED', { type, value: sanitizedValue });
    },
    [onChange, sanitizeInput, rateLimit, logSecurityEvent, maxLength, debouncedValidation]
  );

  // Handle blur with additional validation
  const handleBlur = useCallback(() => {
    if (!rateLimit('input_blur')) return;

    const validation = validateInput(value, type);
    setIsValid(validation.isValid);
    setErrorMessage(validation.error || '');

    if (validation.isValid) {
      logSecurityEvent('INPUT_BLUR_VALID', { type, value });
    } else {
      logSecurityEvent('INPUT_BLUR_INVALID', { type, value, error: validation.error });
    }

    onBlur?.();
  }, [value, type, validateInput, rateLimit, logSecurityEvent, onBlur]);

  // Handle paste events with security
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (!rateLimit('input_paste')) {
        e.preventDefault();
        return;
      }

      const pastedText = e.clipboardData.getData('text');
      const sanitizedText = sanitizeInput(pastedText, type);

      if (sanitizedText !== pastedText) {
        logSecurityEvent('INPUT_PASTE_SANITIZED', { type, original: pastedText, sanitized: sanitizedText });
      }

      logSecurityEvent('INPUT_PASTED', { type, value: sanitizedText });
    },
    [sanitizeInput, rateLimit, logSecurityEvent]
  );

  // Handle key events for additional security
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Block dangerous key combinations
      if (e.ctrlKey && (e.key === 'v' || e.key === 'c' || e.key === 'x')) {
        logSecurityEvent('INPUT_KEY_COMBO', { type, key: e.key, ctrl: true });
      }

      // Block script injection attempts
      if (e.key === '<' || e.key === '>') {
        logSecurityEvent('INPUT_DANGEROUS_KEY', { type, key: e.key });
      }
    },
    [logSecurityEvent]
  );

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <input
        ref={inputRef}
        type={type === 'amount' ? 'number' : 'text'}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        maxLength={maxLength}
        required={required}
        className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
          isValid ? 'border-gray-700' : 'border-red-500 focus:ring-red-500'
        } ${className}`}
        autoComplete="off"
        spellCheck="false"
        data-secure-input="true"
      />
      {!isValid && errorMessage && (
        <div className="mt-2 text-sm text-red-400 flex items-center">
          <span className="mr-1">⚠️</span>
          {errorMessage}
        </div>
      )}
      {isValid && value && (
        <div className="mt-2 text-sm text-green-400 flex items-center">
          <span className="mr-1">✅</span>
          Valid input
        </div>
      )}
    </div>
  );
}
