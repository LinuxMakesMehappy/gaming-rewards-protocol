import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStakingManager, useSecurityManager } from '../hooks/useWasmCore';

interface StakingPosition {
    id: string;
    amount: number;
    stakedAt: number;
    lockPeriod: number;
    rewards: number;
    status: 'active' | 'locked' | 'completed';
}

interface StakingInterfaceProps {
    onStake: (amount: number, lockPeriod: number) => Promise<void>;
    onUnstake: (stakeId: string) => Promise<void>;
    loading: boolean;
}

export const StakingInterface: React.FC<StakingInterfaceProps> = ({
    onStake,
    onUnstake,
    loading
}) => {
    // WASM Core hooks
    const { createStakingPosition, calculateRewards, unstakePosition, loading: wasmLoading, error: wasmError } = useStakingManager();
    const { encryptData } = useSecurityManager();
    
    const [stakeAmount, setStakeAmount] = useState('');
    const [lockPeriod, setLockPeriod] = useState(30);
    const [showStakeForm, setShowStakeForm] = useState(false);

    // Mock staking positions - in real app, this would come from props
    const stakingPositions: StakingPosition[] = [
        {
            id: '1',
            amount: 10.5,
            stakedAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
            lockPeriod: 30,
            rewards: 0.25,
            status: 'active'
        },
        {
            id: '2',
            amount: 5.2,
            stakedAt: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
            lockPeriod: 30,
            rewards: 0.15,
            status: 'active'
        }
    ];

    const totalStaked = stakingPositions.reduce((sum, pos) => sum + pos.amount, 0);
    const totalRewards = stakingPositions.reduce((sum, pos) => sum + pos.rewards, 0);

    const handleStake = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(stakeAmount);
        
        if (isNaN(amount) || amount <= 0) {
            return;
        }

        try {
            // 🔒 SECURE: Use WASM core for staking operations
            console.log('🔒 Creating staking position with WASM core...');
            
            // Step 1: Create staking position with WASM
            const stakingResult = await createStakingPosition(amount, lockPeriod);
            console.log('✅ Staking position created:', stakingResult);
            
            // Step 2: Encrypt staking data for security
            const stakingData = JSON.stringify({ amount, lockPeriod, timestamp: Date.now() });
            const encryptedData = await encryptData(stakingData);
            console.log('🔐 Encrypted staking data:', encryptedData);
            
            // Step 3: Call the original onStake handler
            await onStake(amount, lockPeriod);
            setStakeAmount('');
            setShowStakeForm(false);
            
        } catch (error) {
            console.error('❌ Staking failed:', error);
            throw error;
        }
    };

    const handleUnstake = async (stakeId: string) => {
        try {
            // 🔒 SECURE: Use WASM core for unstaking operations
            console.log('🔒 Processing unstake with WASM core...');
            
            // Step 1: Calculate rewards with WASM
            const rewardsResult = await calculateRewards(stakeId);
            console.log('✅ Rewards calculation:', rewardsResult);
            
            // Step 2: Unstake position with WASM
            const unstakeResult = await unstakePosition(stakeId);
            console.log('✅ Unstake result:', unstakeResult);
            
            // Step 3: Call the original onUnstake handler
            await onUnstake(stakeId);
            
        } catch (error) {
            console.error('❌ Unstaking failed:', error);
            throw error;
        }
    };

    const getTimeRemaining = (stakedAt: number, lockPeriod: number) => {
        const endTime = stakedAt + (lockPeriod * 24 * 60 * 60 * 1000);
        const remaining = endTime - Date.now();
        
        if (remaining <= 0) return 'Unlock available';
        
        const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
        const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        
        return `${days}d ${hours}h remaining`;
    };

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-4"
                >
                    <div className="text-purple-400 text-sm font-medium">Total Staked</div>
                    <div className="text-2xl font-bold text-white">
                        {totalStaked.toFixed(2)} SOL
                    </div>
                </motion.div>
                
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg p-4"
                >
                    <div className="text-blue-400 text-sm font-medium">Earned Rewards</div>
                    <div className="text-2xl font-bold text-white">
                        {totalRewards.toFixed(4)} SOL
                    </div>
                </motion.div>
            </div>

            {/* Stake Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowStakeForm(!showStakeForm)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Stake Rewards</span>
            </motion.button>

            {/* Stake Form */}
            {showStakeForm && (
                <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleStake}
                    className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-4"
                >
                    <div>
                        <label htmlFor="stakeAmount" className="block text-sm font-medium text-gray-300 mb-2">
                            Amount to Stake (SOL)
                        </label>
                        <input
                            type="number"
                            id="stakeAmount"
                            value={stakeAmount}
                            onChange={(e) => setStakeAmount(e.target.value)}
                            placeholder="0.0"
                            step="0.1"
                            min="0"
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="lockPeriod" className="block text-sm font-medium text-gray-300 mb-2">
                            Lock Period (days)
                        </label>
                        <select
                            id="lockPeriod"
                            value={lockPeriod}
                            onChange={(e) => setLockPeriod(parseInt(e.target.value))}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value={7}>7 days (5% APY)</option>
                            <option value={30}>30 days (15% APY)</option>
                            <option value={90}>90 days (25% APY)</option>
                            <option value={180}>180 days (35% APY)</option>
                        </select>
                    </div>

                    <div className="flex space-x-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                        >
                            {loading ? 'Staking...' : 'Confirm Stake'}
                        </motion.button>
                        
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => setShowStakeForm(false)}
                            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                        >
                            Cancel
                        </motion.button>
                    </div>
                </motion.form>
            )}

            {/* Staking Positions */}
            {stakingPositions.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-300">Active Positions</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {stakingPositions.map((position) => (
                            <motion.div
                                key={position.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white/5 border border-white/10 rounded-lg p-4"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-white font-medium">
                                        {position.amount.toFixed(2)} SOL
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {getTimeRemaining(position.stakedAt, position.lockPeriod)}
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-blue-400">
                                        +{position.rewards.toFixed(4)} SOL rewards
                                    </div>
                                    
                                    {getTimeRemaining(position.stakedAt, position.lockPeriod) === 'Unlock available' && (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleUnstake(position.id)}
                                            disabled={loading}
                                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs px-3 py-1 rounded transition-colors"
                                        >
                                            Unstake
                                        </motion.button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {stakingPositions.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                >
                    <div className="text-gray-400 text-sm">
                        No staking positions yet. Stake your rewards to earn more!
                    </div>
                </motion.div>
            )}
        </div>
    );
};
