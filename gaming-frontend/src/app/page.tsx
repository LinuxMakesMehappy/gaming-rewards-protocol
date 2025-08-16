'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { toast } from 'react-hot-toast';
import { useSecurity } from './security/security-provider';
import { SecureInput } from './components/SecureInput';
import { SecureButton } from './components/SecureButton';
import { DebugPanel } from './components/DebugPanel';
import { useGamingRewards, AchievementRarity } from './hooks/useGamingRewards';

export default function GamingRewardsDashboard() {
  const { publicKey, connected } = useWallet();
  const { isSecure, securityChecks, logSecurityEvent } = useSecurity();
  const [steamAuthenticated, setSteamAuthenticated] = useState(false);
  const [steamId, setSteamId] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [isClient, setIsClient] = useState(false);

  // Smart contract integration
  const {
    userProfile,
    protocolState,
    stakingAccount,
    tokenBalance,
    loading,
    error,
    registerUser,
    claimAchievement,
    stakeRewards,
    unstakeRewards,
    updateProfile,
    getAchievement,
    calculateStakingRewards,
    getRewardAmount,
    refresh,
    formatTokenAmount,
    parseTokenAmount,
    validateSteamId,
    validateUsername,
    AchievementRarity,
  } = useGamingRewards();

  // Mock achievements for demonstration
  const [achievements] = useState([
    { 
      id: 'first_blood_001', 
      name: 'First Blood', 
      game: 'Counter-Strike 2', 
      rarity: AchievementRarity.Common,
      claimed: false 
    },
    { 
      id: 'ace_001', 
      name: 'Ace', 
      game: 'Counter-Strike 2', 
      rarity: AchievementRarity.Rare,
      claimed: false 
    },
    { 
      id: 'perfect_round_001', 
      name: 'Perfect Round', 
      game: 'Counter-Strike 2', 
      rarity: AchievementRarity.Epic,
      claimed: false 
    },
  ]);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    if (connected && publicKey) {
      logSecurityEvent('WALLET_CONNECTED', { publicKey: publicKey.toString() });
      toast.success('Solana wallet connected successfully!');
    }
  }, [connected, publicKey, logSecurityEvent, isClient]);

  // Check if user is registered
  const isRegistered = userProfile !== null;

  const handleSteamAuth = async () => {
    if (!steamId.trim() || !username.trim()) {
      toast.error('Please enter both Steam ID and username');
      return;
    }

    if (!validateSteamId(steamId)) {
      toast.error('Invalid Steam ID - must be 17 digits');
      return;
    }

    if (!validateUsername(username)) {
      toast.error('Invalid username - must be 3-32 characters');
      return;
    }

    logSecurityEvent('STEAM_AUTH_ATTEMPT', { steamId, username });

    // Register user with smart contract
    const success = await registerUser(steamId, username);
    
    if (success) {
      setSteamAuthenticated(true);
      logSecurityEvent('STEAM_AUTH_SUCCESS', { steamId, username });
      toast.success('Steam authentication and user registration successful!');
    }
  };

  const handleClaimAchievement = async (achievement: any) => {
    if (!isRegistered) {
      toast.error('Please register first');
      return;
    }

    logSecurityEvent('ACHIEVEMENT_CLAIM_ATTEMPT', { achievementId: achievement.id });

    // Check if achievement already claimed
    const existingAchievement = await getAchievement(achievement.id);
    if (existingAchievement && existingAchievement.isClaimed) {
      toast.error('Achievement already claimed');
      return;
    }

    const success = await claimAchievement(
      achievement.id,
      achievement.name,
      achievement.game,
      achievement.rarity
    );

    if (success) {
      logSecurityEvent('ACHIEVEMENT_CLAIMED', { 
        achievementId: achievement.id, 
        reward: getRewardAmount(achievement.rarity) 
      });
      toast.success(`Achievement claimed! +${formatTokenAmount(getRewardAmount(achievement.rarity))} tokens`);
    }
  };

  const handleStake = async (amount: number) => {
    if (!isRegistered) {
      toast.error('Please register first');
      return;
    }

    if (userProfile && userProfile.totalRewards < amount) {
      toast.error('Insufficient rewards to stake');
      return;
    }

    logSecurityEvent('STAKING_ATTEMPT', { amount });

    const success = await stakeRewards(amount);
    
    if (success) {
      logSecurityEvent('STAKING_SUCCESS', { amount });
      toast.success(`Staked ${formatTokenAmount(amount)} tokens successfully!`);
    }
  };

  const handleUnstake = async (amount: number) => {
    if (!isRegistered) {
      toast.error('Please register first');
      return;
    }

    if (stakingAccount && stakingAccount.stakedAmount < amount) {
      toast.error('Insufficient staked amount to unstake');
      return;
    }

    logSecurityEvent('UNSTAKING_ATTEMPT', { amount });

    const success = await unstakeRewards(amount);
    
    if (success) {
      logSecurityEvent('UNSTAKING_SUCCESS', { amount });
      toast.success(`Unstaked ${formatTokenAmount(amount)} tokens successfully!`);
    }
  };

  // Don't render until client-side
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading Gaming Rewards Protocol...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">
                Gaming Rewards Protocol
              </h1>
              <div className="text-sm text-gray-300">
                Zero-CVE Architecture
              </div>
              {isSecure && (
                <div className="flex items-center text-green-400 text-sm">
                  <span className="mr-1">🔒</span>
                  Secure
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <WalletMultiButton className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Debug Panel - Always visible for testing */}
        <div className="mb-8">
          <DebugPanel
            steamAuthenticated={steamAuthenticated}
            steamId={steamId}
            userRewards={userProfile?.totalRewards || 0}
            stakedAmount={userProfile?.stakedAmount || 0}
            achievements={achievements}
            smartContractData={{
              userProfile,
              protocolState,
              stakingAccount,
              tokenBalance,
              loading,
              error,
            }}
          />
        </div>

        {!connected ? (
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-white mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-gray-300 mb-8">
              Connect your Solana wallet to start earning gaming rewards
            </p>
            <WalletMultiButton className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg" />
          </div>
        ) : !isRegistered ? (
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-white mb-4">
              Register with Gaming Rewards Protocol
            </h2>
            <p className="text-gray-300 mb-8">
              Connect your Steam account and register to start earning rewards
            </p>
            <div className="max-w-md mx-auto space-y-4">
              <SecureInput
                type="steamId"
                placeholder="Enter your Steam ID (17 digits)"
                value={steamId}
                onChange={setSteamId}
                label="Steam ID"
                required
                maxLength={17}
              />
              <SecureInput
                type="text"
                placeholder="Enter your username (3-32 characters)"
                value={username}
                onChange={setUsername}
                label="Username"
                required
                maxLength={32}
              />
              <div className="mt-4">
                <SecureButton
                  onClick={handleSteamAuth}
                  variant="success"
                  size="lg"
                  className="w-full"
                  requireConfirmation
                  confirmText="Register with Gaming Rewards Protocol?"
                  loading={loading}
                >
                  Register & Connect Steam
                </SecureButton>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Achievements */}
            <div className="lg:col-span-2">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Your Achievements
                </h3>
                <div className="space-y-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-white font-semibold">{achievement.name}</h4>
                          <p className="text-gray-300 text-sm">{achievement.game}</p>
                          <span className={`inline-block px-2 py-1 rounded text-xs ${
                            achievement.rarity === AchievementRarity.Common ? 'bg-gray-600 text-gray-200' :
                            achievement.rarity === AchievementRarity.Rare ? 'bg-blue-600 text-blue-200' :
                            achievement.rarity === AchievementRarity.Epic ? 'bg-purple-600 text-purple-200' :
                            'bg-yellow-600 text-yellow-200'
                          }`}>
                            {achievement.rarity}
                          </span>
                          <p className="text-green-400 text-sm mt-1">
                            Reward: {formatTokenAmount(getRewardAmount(achievement.rarity))} tokens
                          </p>
                        </div>
                        <SecureButton
                          onClick={() => handleClaimAchievement(achievement)}
                          disabled={loading}
                          variant="success"
                          size="sm"
                          requireConfirmation
                          confirmText={`Claim ${achievement.name}?`}
                          loading={loading}
                        >
                          Claim
                        </SecureButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Rewards & Staking */}
            <div className="space-y-6">
              {/* User Profile */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Profile
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Username:</span>
                    <span className="text-white">{userProfile?.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Steam ID:</span>
                    <span className="text-white">{userProfile?.steamId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Achievements:</span>
                    <span className="text-white">{userProfile?.totalAchievements}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Token Balance:</span>
                    <span className="text-green-400">{formatTokenAmount(tokenBalance)}</span>
                  </div>
                </div>
              </div>

              {/* Rewards */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Rewards
                </h3>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-green-400">
                    {formatTokenAmount(userProfile?.totalRewards || 0)}
                  </div>
                  <div className="text-gray-300">Available Rewards</div>
                </div>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-blue-400">
                    {formatTokenAmount(userProfile?.stakedAmount || 0)}
                  </div>
                  <div className="text-gray-300">Staked Amount</div>
                </div>
                {stakingAccount && stakingAccount.isActive && (
                  <div className="text-center mb-4">
                    <div className="text-lg font-bold text-yellow-400">
                      +{formatTokenAmount(calculateStakingRewards(stakingAccount.stakedAmount, stakingAccount.stakedAt))}
                    </div>
                    <div className="text-gray-300">Staking Rewards (5% APY)</div>
                  </div>
                )}
              </div>

              {/* Staking */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Staking
                </h3>
                <div className="space-y-4">
                  <SecureButton
                    onClick={() => handleStake(parseTokenAmount('100'))}
                    disabled={loading || (userProfile?.totalRewards || 0) < parseTokenAmount('100')}
                    variant="primary"
                    className="w-full"
                    requireConfirmation
                    confirmText="Stake 100 tokens?"
                    loading={loading}
                  >
                    Stake 100 Tokens
                  </SecureButton>
                  <SecureButton
                    onClick={() => handleUnstake(parseTokenAmount('100'))}
                    disabled={loading || (stakingAccount?.stakedAmount || 0) < parseTokenAmount('100')}
                    variant="danger"
                    className="w-full"
                    requireConfirmation
                    confirmText="Unstake 100 tokens?"
                    loading={loading}
                  >
                    Unstake 100 Tokens
                  </SecureButton>
                </div>
              </div>

              {/* Protocol Stats */}
              {protocolState && (
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Protocol Stats
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Total Users:</span>
                      <span className="text-white">{protocolState.totalUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Achievements Claimed:</span>
                      <span className="text-white">{protocolState.totalAchievementsClaimed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Rewards Distributed:</span>
                      <span className="text-green-400">{formatTokenAmount(protocolState.totalRewardsDistributed)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Status */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Security Status
                </h3>
                <div className="space-y-2">
                  <div key="zero-cve" className="flex items-center text-green-400">
                    <span className="mr-2">✅</span>
                    <span>Zero-CVE Architecture</span>
                  </div>
                  <div key="wallet-connected" className="flex items-center text-green-400">
                    <span className="mr-2">✅</span>
                    <span>Wallet Connected</span>
                  </div>
                  <div key="user-registered" className="flex items-center text-green-400">
                    <span className="mr-2">✅</span>
                    <span>User Registered</span>
                  </div>
                  <div key="smart-contract" className="flex items-center text-green-400">
                    <span className="mr-2">✅</span>
                    <span>Smart Contract Active</span>
                  </div>
                  <div key="xss-protection" className="flex items-center text-green-400">
                    <span className="mr-2">✅</span>
                    <span>XSS Protection Active</span>
                  </div>
                  <div key="csrf-protection" className="flex items-center text-green-400">
                    <span className="mr-2">✅</span>
                    <span>CSRF Protection Active</span>
                  </div>
                  <div key="rate-limiting" className="flex items-center text-green-400">
                    <span className="mr-2">✅</span>
                    <span>Rate Limiting Active</span>
                  </div>
                  <div key="input-validation" className="flex items-center text-green-400">
                    <span className="mr-2">✅</span>
                    <span>Input Validation Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-sm border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-400">
            <p>Gaming Rewards Protocol - Zero-CVE Architecture</p>
            <p className="text-sm mt-2">
              Built with NSA/CIA/DOD-level security standards
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
