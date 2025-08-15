import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { SteamAuth } from '../components/SteamAuth';
import { AchievementDisplay } from '../components/AchievementDisplay';
import { RewardClaim } from '../components/RewardClaim';
import { StakingInterface } from '../components/StakingInterface';
import { SecurityStatus } from '../components/SecurityStatus';
import { useGamingRewards } from '../hooks/useGamingRewards';
import { useSteamValidation } from '../hooks/useSteamValidation';

export default function Dashboard() {
    const { publicKey, connected } = useWallet();
    const [steamAuthenticated, setSteamAuthenticated] = useState(false);
    const [steamId, setSteamId] = useState<string | null>(null);
    
    const { 
        userRewards, 
        claimRewards, 
        stakeRewards, 
        unstakeRewards,
        loading: rewardsLoading 
    } = useGamingRewards();
    
    const { 
        validateSteamUser, 
        validateAchievement,
        loading: validationLoading 
    } = useSteamValidation();

    useEffect(() => {
        if (connected && publicKey) {
            toast.success('Solana wallet connected successfully');
        }
    }, [connected, publicKey]);

    const handleSteamAuth = async (steamId: string) => {
        try {
            const validation = await validateSteamUser(steamId);
            if (validation.success) {
                setSteamAuthenticated(true);
                setSteamId(steamId);
                toast.success('Steam authentication successful');
            } else {
                toast.error('Steam authentication failed');
            }
        } catch (error) {
            toast.error('Steam authentication error');
            console.error('Steam auth error:', error);
        }
    };

    const handleAchievementClaim = async (achievementId: string) => {
        if (!connected || !steamAuthenticated) {
            toast.error('Please connect wallet and authenticate with Steam');
            return;
        }

        try {
            const validation = await validateAchievement({
                id: achievementId,
                steamId: steamId!,
                gameId: '730', // Counter-Strike 2
                timestamp: Date.now(),
                sessionTicket: 'mock-session-ticket'
            });

            if (validation.success) {
                await claimRewards(achievementId, validation.achievementData!.rarity);
                toast.success('Achievement claimed successfully');
            } else {
                toast.error('Achievement validation failed');
            }
        } catch (error) {
            toast.error('Achievement claim error');
            console.error('Achievement claim error:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
            {/* Header */}
            <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.5 }}
                            >
                                <h1 className="text-2xl font-bold text-white">
                                    Gaming Rewards Protocol
                                </h1>
                            </motion.div>
                            <div className="text-sm text-gray-300">
                                Zero-CVE Jupiter Core
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <SecurityStatus />
                            <WalletMultiButton className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {!connected ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20"
                    >
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Connect Your Wallet
                        </h2>
                        <p className="text-gray-300 mb-8">
                            Connect your Solana wallet to start earning gaming rewards
                        </p>
                        <WalletMultiButton className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg" />
                    </motion.div>
                ) : !steamAuthenticated ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20"
                    >
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Authenticate with Steam
                        </h2>
                        <p className="text-gray-300 mb-8">
                            Connect your Steam account to verify achievements and earn rewards
                        </p>
                        <SteamAuth onAuthenticate={handleSteamAuth} />
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Achievements */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-2"
                        >
                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                                <h3 className="text-xl font-semibold text-white mb-4">
                                    Your Achievements
                                </h3>
                                <AchievementDisplay 
                                    steamId={steamId!}
                                    onClaim={handleAchievementClaim}
                                    loading={validationLoading}
                                />
                            </div>
                        </motion.div>

                        {/* Right Column - Rewards & Staking */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-6"
                        >
                            {/* Rewards */}
                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                                <h3 className="text-xl font-semibold text-white mb-4">
                                    Rewards
                                </h3>
                                <RewardClaim 
                                    rewards={userRewards}
                                    onClaim={claimRewards}
                                    loading={rewardsLoading}
                                />
                            </div>

                            {/* Staking */}
                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                                <h3 className="text-xl font-semibold text-white mb-4">
                                    Staking
                                </h3>
                                <StakingInterface 
                                    onStake={stakeRewards}
                                    onUnstake={unstakeRewards}
                                    loading={rewardsLoading}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-black/20 backdrop-blur-sm border-t border-white/10 mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center text-gray-400">
                        <p>Gaming Rewards Protocol - Zero-CVE Jupiter Core</p>
                        <p className="text-sm mt-2">
                            Built with NSA/CIA/DOD-level security standards
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
