import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SecurityStatusProps {}

export const SecurityStatus: React.FC<SecurityStatusProps> = () => {
    const [securityLevel, setSecurityLevel] = useState<'secure' | 'warning' | 'critical'>('secure');
    const [lastCheck, setLastCheck] = useState<Date>(new Date());

    useEffect(() => {
        // Simulate security status updates
        const interval = setInterval(() => {
            setLastCheck(new Date());
        }, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
    }, []);

    const getSecurityIcon = () => {
        switch (securityLevel) {
            case 'secure':
                return (
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                );
            case 'critical':
                return (
                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                );
        }
    };

    const getSecurityColor = () => {
        switch (securityLevel) {
            case 'secure':
                return 'text-green-400 bg-green-900/20 border-green-500/30';
            case 'warning':
                return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
            case 'critical':
                return 'text-red-400 bg-red-900/20 border-red-500/30';
        }
    };

    const getSecurityText = () => {
        switch (securityLevel) {
            case 'secure':
                return 'SECURE';
            case 'warning':
                return 'WARNING';
            case 'critical':
                return 'CRITICAL';
        }
    };

    return (
        <div
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${getSecurityColor()} backdrop-blur-sm hover:scale-105 transition-transform`}
        >
            {getSecurityIcon()}
            <div className="flex flex-col">
                <div className="text-xs font-semibold">
                    {getSecurityText()}
                </div>
                <div className="text-xs opacity-75">
                    {lastCheck.toLocaleTimeString()}
                </div>
            </div>
        </div>
    );
};
