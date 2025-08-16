import React, { useState, useEffect } from 'react';
import { Wallet, Trophy, Shield, Coins, Gamepad2, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

// Import components
import { SteamAuth } from '../components/SteamAuth';
import { AchievementDisplay } from '../components/AchievementDisplay';
import { RewardClaim } from '../components/RewardClaim';
import { StakingInterface } from '../components/StakingInterface';
import { SecurityStatus } from '../components/SecurityStatus';

interface UserState {
  steamId: string | null;
  isAuthenticated: boolean;
  totalRewards: number;
  stakedAmount: number;
  securityScore: number;
}

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [userState, setUserState] = useState<UserState>({
    steamId: null,
    isAuthenticated: false,
    totalRewards: 0,
    stakedAmount: 0,
    securityScore: 100
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'staking' | 'security'>('overview');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper function to show notifications
  const showNotification = (type: 'success' | 'error', message: string) => {
    if (typeof window !== 'undefined' && (window as any).showNotification) {
      (window as any).showNotification({ type, message });
    }
  };

  // Mock wallet connection for demo
  const handleWalletConnect = () => {
    setLoading(true);
    setTimeout(() => {
      setWalletConnected(true);
      setPublicKey('DemoWallet123456789');
      setUserState(prev => ({
        ...prev,
        totalRewards: 1250,
        stakedAmount: 500,
        securityScore: 95
      }));
      setLoading(false);
      showNotification('success', 'Wallet connected successfully!');
    }, 1000);
  };

  const handleSteamAuthenticate = async (steamId: string) => {
    try {
      setLoading(true);
      // Simulate Steam authentication
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setUserState(prev => ({
        ...prev,
        steamId,
        isAuthenticated: true
      }));
      
      showNotification('success', 'Steam account linked successfully!');
    } catch (error) {
      showNotification('error', 'Failed to link Steam account');
    } finally {
      setLoading(false);
    }
  };

  const handleAchievementClaim = async (achievementId: string) => {
    try {
      setLoading(true);
      // Simulate claiming achievement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setUserState(prev => ({
        ...prev,
        totalRewards: prev.totalRewards + 100
      }));
      
      showNotification('success', `Achievement claimed! +100 rewards`);
    } catch (error) {
      showNotification('error', 'Failed to claim achievement');
    } finally {
      setLoading(false);
    }
  };

  const handleStake = async (amount: number, lockPeriod: number) => {
    try {
      setLoading(true);
      // Simulate staking
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setUserState(prev => ({
        ...prev,
        stakedAmount: prev.stakedAmount + amount
      }));
      
      showNotification('success', `Staked ${amount} tokens for ${lockPeriod} days`);
    } catch (error) {
      showNotification('error', 'Failed to stake tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async (stakeId: string) => {
    try {
      setLoading(true);
      // Simulate unstaking
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      showNotification('success', 'Tokens unstaked successfully');
    } catch (error) {
      showNotification('error', 'Failed to unstake tokens');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'staking', label: 'Staking', icon: Coins },
    { id: 'security', label: 'Security', icon: Shield },
  ] as const;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-white">Loading Gaming Rewards Protocol...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Gamepad2 className="w-8 h-8 text-blue-400" />
                <h1 className="text-2xl font-bold text-white">
                  Gaming Rewards Protocol
                </h1>
              </div>
              <div className="text-sm text-gray-300 bg-blue-500/20 px-2 py-1 rounded-full">
                Zero-CVE Architecture
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {walletConnected && publicKey && (
                <div className="text-sm text-gray-300">
                  {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
                </div>
              )}
              {walletConnected ? (
                <button
                  onClick={() => setWalletConnected(false)}
                  className="gaming-button"
                >
                  Disconnect Wallet
                </button>
              ) : (
                <button
                  onClick={handleWalletConnect}
                  className="gaming-button"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!walletConnected ? (
          // Wallet Connection Required
          <div className="text-center">
            <div className="max-w-md mx-auto">
              <div className="gaming-card text-center">
                <Wallet className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-4">
                  Connect Your Wallet
                </h2>
                <p className="text-gray-300 mb-6">
                  Connect your Solana wallet to start earning gaming rewards
                </p>
                <button
                  onClick={handleWalletConnect}
                  className="gaming-button"
                >
                  Connect Wallet
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Main Dashboard
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="gaming-card">
                <div className="flex items-center space-x-3">
                  <Trophy className="w-8 h-8 text-yellow-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Total Rewards</p>
                    <p className="text-2xl font-bold text-white">{userState.totalRewards}</p>
                  </div>
                </div>
              </div>
              
              <div className="gaming-card">
                <div className="flex items-center space-x-3">
                  <Coins className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Staked Amount</p>
                    <p className="text-2xl font-bold text-white">{userState.stakedAmount}</p>
                  </div>
                </div>
              </div>
              
              <div className="gaming-card">
                <div className="flex items-center space-x-3">
                  <Shield className="w-8 h-8 text-blue-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Security Score</p>
                    <p className="text-2xl font-bold text-white">{userState.securityScore}%</p>
                  </div>
                </div>
              </div>
              
              <div className="gaming-card">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Status</p>
                    <p className="text-2xl font-bold text-white">
                      {userState.isAuthenticated ? 'Active' : 'Pending'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Steam Authentication */}
            {!userState.isAuthenticated && (
              <div className="gaming-card">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Link Your Steam Account
                </h3>
                <SteamAuth onAuthenticate={handleSteamAuthenticate} />
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="gaming-card">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-white mb-6">Dashboard Overview</h3>
                  
                  {userState.isAuthenticated ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-4">Recent Achievements</h4>
                        <AchievementDisplay 
                          steamId={userState.steamId!}
                          onClaim={handleAchievementClaim}
                          loading={loading}
                        />
                      </div>
                      
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-4">Security Status</h4>
                        <SecurityStatus />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                      <p className="text-gray-300">
                        Please link your Steam account to view your achievements and rewards.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'achievements' && userState.isAuthenticated && (
                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">Your Achievements</h3>
                  <AchievementDisplay 
                    steamId={userState.steamId!}
                    onClaim={handleAchievementClaim}
                    loading={loading}
                  />
                </div>
              )}

              {activeTab === 'staking' && (
                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">Staking & Rewards</h3>
                  <StakingInterface 
                    onStake={handleStake}
                    onUnstake={handleUnstake}
                    loading={loading}
                  />
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">Security Center</h3>
                  <SecurityStatus />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 flex items-center space-x-4">
            <div className="loading-spinner"></div>
            <span className="text-white">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
}
