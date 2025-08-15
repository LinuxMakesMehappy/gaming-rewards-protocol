import React from 'react';
import { motion } from 'framer-motion';
import { useRewardEngine, useSecurityManager } from '../hooks/useWasmCore';

interface Reward {
    id: string;
    amount: number;
    currency: string;
    status: 'pending' | 'claimed' | 'staked';
    timestamp: number;
    achievementId?: string;
}

interface RewardClaimProps {
    rewards: Reward[];
    onClaim: (rewardId: string) => Promise<void>;
    loading: boolean;
}

export const RewardClaim: React.FC<RewardClaimProps> = ({ 
    rewards, 
    onClaim, 
    loading 
}) => {
    // WASM Core hooks
    const { processClaim, loading: wasmLoading, error: wasmError } = useRewardEngine();
    const { encryptData } = useSecurityManager();
    
    const pendingRewards = rewards.filter(r => r.status === 'pending');
    const claimedRewards = rewards.filter(r => r.status === 'claimed');
    const totalPending = pendingRewards.reduce((sum, r) => sum + r.amount, 0);
    const totalClaimed = claimedRewards.reduce((sum, r) => sum + r.amount, 0);

    const handleClaim = async (rewardId: string) => {
        try {
            // 🔒 SECURE: Use WASM core for reward processing
            console.log('🔒 Processing reward claim with WASM core...');
            
            // Step 1: Process claim with WASM reward engine
            const claimResult = await processClaim(rewardId);
            console.log('✅ Claim processing result:', claimResult);
            
            // Step 2: Encrypt claim data for security
            const claimData = JSON.stringify({ rewardId, timestamp: Date.now() });
            const encryptedData = await encryptData(claimData);
            console.log('🔐 Encrypted claim data:', encryptedData);
            
            // Step 3: Call the original onClaim handler
            await onClaim(rewardId);
            
        } catch (error) {
            console.error('❌ Reward claim failed:', error);
            throw error;
        }
    };

    const handleClaimAll = async () => {
        try {
            await Promise.all(pendingRewards.map(r => onClaim(r.id)));
        } catch (error) {
            console.error('Failed to claim all rewards:', error);
        }
    };

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-4"
                >
                    <div className="text-yellow-400 text-sm font-medium">Pending</div>
                    <div className="text-2xl font-bold text-white">
                        {totalPending.toFixed(2)} SOL
                    </div>
                </motion.div>
                
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-4"
                >
                    <div className="text-green-400 text-sm font-medium">Claimed</div>
                    <div className="text-2xl font-bold text-white">
                        {totalClaimed.toFixed(2)} SOL
                    </div>
                </motion.div>
            </div>

            {/* Claim All Button */}
            {pendingRewards.length > 0 && (
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClaimAll}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                >
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Claiming...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            <span>Claim All ({pendingRewards.length})</span>
                        </>
                    )}
                </motion.button>
            )}

            {/* Pending Rewards List */}
            {pendingRewards.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-300">Pending Rewards</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {pendingRewards.map((reward) => (
                            <motion.div
                                key={reward.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between"
                            >
                                <div className="flex-1">
                                    <div className="text-white font-medium">
                                        {reward.amount.toFixed(4)} SOL
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {new Date(reward.timestamp).toLocaleDateString()}
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleClaim(reward.id)}
                                    disabled={loading}
                                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs px-3 py-1 rounded transition-colors"
                                >
                                    Claim
                                </motion.button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Claims */}
            {claimedRewards.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-300">Recent Claims</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {claimedRewards.slice(0, 5).map((reward) => (
                            <motion.div
                                key={reward.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-green-500/10 border border-green-500/20 rounded-lg p-3"
                            >
                                <div className="text-green-400 font-medium">
                                    {reward.amount.toFixed(4)} SOL
                                </div>
                                <div className="text-xs text-gray-400">
                                    Claimed {new Date(reward.timestamp).toLocaleDateString()}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {rewards.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                >
                    <div className="text-gray-400 text-sm">
                        No rewards yet. Complete achievements to earn rewards!
                    </div>
                </motion.div>
            )}
        </div>
    );
};
