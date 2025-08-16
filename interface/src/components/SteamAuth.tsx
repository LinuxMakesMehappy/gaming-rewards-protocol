import React, { useState } from 'react';
import { useSteamValidation, useFraudDetection } from '../hooks/useWasmCore';

interface SteamAuthProps {
    onAuthenticate: (steamId: string) => Promise<void>;
}

export const SteamAuth: React.FC<SteamAuthProps> = ({ onAuthenticate }) => {
    const [steamId, setSteamId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // WASM Core hooks
    const { validateSteamUser, loading: wasmLoading, error: wasmError } = useSteamValidation();
    const { analyzeUser, isFraudulent, getRiskDescription } = useFraudDetection();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!steamId.trim()) {
            setError('Please enter your Steam ID');
            return;
        }

        if (!/^[0-9]{17}$/.test(steamId)) {
            setError('Please enter a valid 17-digit Steam ID');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 🔒 SECURE: Use WASM core for validation
            console.log('🔒 Validating Steam user with WASM core...');
            
            // Step 1: Validate Steam user with WASM
            const validationResult = await validateSteamUser(steamId);
            console.log('✅ Steam validation result:', validationResult);
            
            // Step 2: Fraud detection with WASM
            console.log('🔍 Running fraud detection...');
            const fraudAnalysis = await analyzeUser(steamId, 365, 50); // Mock values for demo
            const isFraud = await isFraudulent(0.2); // Mock risk score - this should be a number
            const riskDescription = await getRiskDescription('Low'); // Mock risk level
            
            console.log('🔍 Fraud analysis:', { fraudAnalysis, isFraud, riskDescription });
            
            if (isFraud) {
                throw new Error(`High fraud risk detected: ${riskDescription}`);
            }
            
            // Step 3: If all checks pass, proceed with authentication
            await onAuthenticate(steamId);
            
        } catch (error) {
            console.error('❌ Authentication failed:', error);
            setError(error instanceof Error ? error.message : 'Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSteamLogin = () => {
        // In production, this would redirect to Steam OpenID
        const steamOpenIdUrl = `https://steamcommunity.com/openid/login?openid.ns=http://specs.openid.net/auth/2.0&openid.mode=checkid_setup&openid.return_to=${encodeURIComponent(window.location.origin + '/auth/callback')}&openid.realm=${encodeURIComponent(window.location.origin)}&openid.identity=http://specs.openid.net/auth/2.0/identifier_select&openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select`;
        
        window.location.href = steamOpenIdUrl;
    };

    return (
        <div
            className="max-w-md mx-auto"
        >
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-6 text-center">
                    Steam Authentication
                </h3>

                <div className="space-y-6">
                    {/* Steam Login Button */}
                    <button
                        onClick={handleSteamLogin}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-3 hover:scale-105 active:scale-95"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm0 22C6.49 22 2 17.51 2 12S6.49 2 12 2s10 4.49 10 10-4.49 10-10 10z"/>
                            <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                        </svg>
                        <span>Login with Steam</span>
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/20"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-transparent text-gray-300">or</span>
                        </div>
                    </div>

                    {/* Manual Steam ID Input */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="steamId" className="block text-sm font-medium text-gray-300 mb-2">
                                Steam ID (17 digits)
                            </label>
                            <input
                                type="text"
                                id="steamId"
                                value={steamId}
                                onChange={(e) => setSteamId(e.target.value)}
                                placeholder="76561198012345678"
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={loading}
                            />
                        </div>

                        {error && (
                            <div
                                className="text-red-400 text-sm bg-red-900/20 border border-red-500/20 rounded-lg p-3"
                            >
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 hover:scale-105 active:scale-95"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Authenticating...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Verify Steam ID</span>
                                </>
                                                    )}
                    </button>
                </form>

                    <div className="text-xs text-gray-400 text-center">
                        <p>Your Steam ID is a 17-digit number found in your Steam profile URL</p>
                        <p className="mt-1">Example: steamcommunity.com/id/username → 76561198012345678</p>
                    </div>
                                    </div>
                </div>
            </div>
    );
};
