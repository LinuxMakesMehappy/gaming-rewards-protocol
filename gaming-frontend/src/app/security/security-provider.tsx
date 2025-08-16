'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

// Security context interface
interface SecurityContextType {
  isSecure: boolean;
  securityChecks: SecurityChecks;
  validateInput: (input: string, type: 'steamId' | 'amount' | 'general') => boolean;
  sanitizeInput: (input: string) => string;
  rateLimit: (action: string) => boolean;
  logSecurityEvent: (event: string, details?: any) => void;
}

interface SecurityChecks {
  xssProtection: boolean;
  csrfProtection: boolean;
  clickjackingProtection: boolean;
  inputValidation: boolean;
  rateLimiting: boolean;
  sessionSecurity: boolean;
}

// Create security context
const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

// Security provider component
export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [isSecure, setIsSecure] = useState(false);
  const [securityChecks, setSecurityChecks] = useState<SecurityChecks>({
    xssProtection: false,
    csrfProtection: false,
    clickjackingProtection: false,
    inputValidation: false,
    rateLimiting: false,
    sessionSecurity: false,
  });

  // Rate limiting storage using ref to avoid infinite loops
  const rateLimitMapRef = useRef<Map<string, { count: number; lastReset: number }>>(new Map());

  // Initialize security measures
  useEffect(() => {
    initializeSecurity();
  }, []);

  const initializeSecurity = useCallback(() => {
    // 1. XSS Protection
    setupXSSProtection();
    
    // 2. CSRF Protection
    setupCSRFProtection();
    
    // 3. Clickjacking Protection
    setupClickjackingProtection();
    
    // 4. Input Validation
    setupInputValidation();
    
    // 5. Rate Limiting
    setupRateLimiting();
    
    // 6. Session Security
    setupSessionSecurity();

    setIsSecure(true);
  }, []);

  // XSS Protection
  const setupXSSProtection = useCallback(() => {
    // Content Security Policy
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://solana.com https://phantom.app",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.devnet.solana.com https://solana.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
    document.head.appendChild(cspMeta);

    // XSS Protection header simulation
    const xssMeta = document.createElement('meta');
    xssMeta.httpEquiv = 'X-XSS-Protection';
    xssMeta.content = '1; mode=block';
    document.head.appendChild(xssMeta);

    setSecurityChecks(prev => ({ ...prev, xssProtection: true }));
  }, []);

  // CSRF Protection
  const setupCSRFProtection = useCallback(() => {
    // Generate CSRF token
    const csrfToken = generateCSRFToken();
    sessionStorage.setItem('csrfToken', csrfToken);

    // Add to all forms and API calls
    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      if (init?.method && init.method !== 'GET') {
        const token = sessionStorage.getItem('csrfToken');
        if (token) {
          init.headers = {
            ...init.headers,
            'X-CSRF-Token': token,
          };
        }
      }
      return originalFetch(input, init);
    };

    setSecurityChecks(prev => ({ ...prev, csrfProtection: true }));
  }, []);

  // Clickjacking Protection
  const setupClickjackingProtection = useCallback(() => {
    // Frame busting
    if (window.self !== window.top) {
      window.top.location = window.self.location;
    }

    // X-Frame-Options simulation
    const frameMeta = document.createElement('meta');
    frameMeta.httpEquiv = 'X-Frame-Options';
    frameMeta.content = 'DENY';
    document.head.appendChild(frameMeta);

    setSecurityChecks(prev => ({ ...prev, clickjackingProtection: true }));
  }, []);

  // Input Validation - Safe approach without DOM manipulation
  const setupInputValidation = useCallback(() => {
    // Monitor for dangerous DOM manipulations
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.innerHTML && containsScriptTags(element.innerHTML)) {
                logSecurityEvent('DANGEROUS_HTML_DETECTED', { 
                  element: element.tagName,
                  content: element.innerHTML.substring(0, 100)
                });
              }
            }
          });
        }
      });
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setSecurityChecks(prev => ({ ...prev, inputValidation: true }));
  }, []);

  // Rate Limiting
  const setupRateLimiting = useCallback(() => {
    // Clean up old rate limit entries every minute
    setInterval(() => {
      const now = Date.now();
      const newMap = new Map(rateLimitMapRef.current);
      
      for (const [key, value] of newMap.entries()) {
        if (now - value.lastReset > 60000) { // 1 minute
          newMap.delete(key);
        }
      }
      
      rateLimitMapRef.current = newMap;
    }, 60000);

    setSecurityChecks(prev => ({ ...prev, rateLimiting: true }));
  }, []);

  // Session Security
  const setupSessionSecurity = useCallback(() => {
    // Secure session handling
    const secureSession = {
      id: generateSecureId(),
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };

    sessionStorage.setItem('secureSession', JSON.stringify(secureSession));

    // Update last activity on user interaction
    const updateActivity = () => {
      const session = sessionStorage.getItem('secureSession');
      if (session) {
        const sessionData = JSON.parse(session);
        sessionData.lastActivity = Date.now();
        sessionStorage.setItem('secureSession', JSON.stringify(sessionData));
      }
    };

    ['click', 'keypress', 'mousemove', 'scroll'].forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    setSecurityChecks(prev => ({ ...prev, sessionSecurity: true }));
  }, []);

  // Input validation function
  const validateInput = useCallback((input: string, type: 'steamId' | 'amount' | 'general'): boolean => {
    if (!input || typeof input !== 'string') return false;

    const sanitized = sanitizeInput(input);
    
    switch (type) {
      case 'steamId':
        // Steam ID validation (17 digits)
        return /^\d{17}$/.test(sanitized);
      
      case 'amount':
        // Numeric validation for amounts
        const num = parseFloat(sanitized);
        return !isNaN(num) && num > 0 && num <= 1000000; // Max 1M
      
      case 'general':
        // General input validation
        return sanitized.length <= 1000 && !containsScriptTags(sanitized);
      
      default:
        return false;
    }
  }, []);

  // Input sanitization
  const sanitizeInput = useCallback((input: string): string => {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }, []);

  // Rate limiting
  const rateLimit = useCallback((action: string): boolean => {
    const now = Date.now();
    const limit = 10; // 10 requests per minute
    const window = 60000; // 1 minute

    const current = rateLimitMapRef.current.get(action) || { count: 0, lastReset: now };
    
    if (now - current.lastReset > window) {
      current.count = 1;
      current.lastReset = now;
    } else {
      current.count++;
    }

    rateLimitMapRef.current.set(action, current);

    if (current.count > limit) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { action, count: current.count });
      toast.error('Too many requests. Please wait a moment.');
      return false;
    }

    return true;
  }, []);

  // Security event logging
  const logSecurityEvent = useCallback((event: string, details?: any) => {
    const securityLog = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.warn('🔒 Security Event:', securityLog);
    
    // In production, send to security monitoring service
    // fetch('/api/security/log', { method: 'POST', body: JSON.stringify(securityLog) });
  }, []);

  // Utility functions
  const generateCSRFToken = (): string => {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const generateSecureId = (): string => {
    return crypto.randomUUID();
  };

  const sanitizeHTML = (html: string): string => {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  };

  const containsScriptTags = (input: string): boolean => {
    return /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(input);
  };

  const contextValue: SecurityContextType = {
    isSecure,
    securityChecks,
    validateInput,
    sanitizeInput,
    rateLimit,
    logSecurityEvent,
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
}

// Hook to use security context
export function useSecurity() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}
