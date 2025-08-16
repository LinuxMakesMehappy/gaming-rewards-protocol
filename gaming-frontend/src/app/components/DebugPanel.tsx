'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSecurity } from '../security/security-provider';

interface DebugPanelProps {
  steamAuthenticated: boolean;
  steamId: string;
  userRewards: number;
  stakedAmount: number;
  achievements: Array<{
    id: string;
    name: string;
    game: string;
    rarity: string;
    claimed: boolean;
  }>;
  smartContractData?: {
    userProfile: any;
    protocolState: any;
    stakingAccount: any;
    tokenBalance: number;
    loading: boolean;
    error: string | null;
  };
}

export function DebugPanel({
  steamAuthenticated,
  steamId,
  userRewards,
  stakedAmount,
  achievements,
  smartContractData,
}: DebugPanelProps) {
  const { publicKey, connected, connecting, disconnecting, wallet } = useWallet();
  const { isSecure, securityChecks } = useSecurity();
  const [securityEvents, setSecurityEvents] = useState<Array<{ timestamp: string; event: string; details?: any }>>([]);
  const [systemStats, setSystemStats] = useState({
    pageLoadTime: Date.now(),
    lastActivity: Date.now(),
    totalClicks: 0,
    totalTransactions: 0,
  });
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update system stats
  useEffect(() => {
    if (!isClient) return;
    setSystemStats(prev => ({
      ...prev,
      lastActivity: Date.now(),
    }));
  }, [userRewards, stakedAmount, achievements, isClient]);

  // Simulate security events for demo
  useEffect(() => {
    if (!isClient) return;
    const events = [
      { event: 'PAGE_LOADED', details: { timestamp: Date.now() } },
      { event: 'SECURITY_INITIALIZED', details: { checks: Object.keys(securityChecks).length } },
      { event: 'WALLET_DETECTED', details: { wallet: wallet?.adapter.name || 'None' } },
    ];

    setSecurityEvents(events.map(event => ({
      timestamp: new Date().toISOString(),
      ...event,
    })));
  }, [securityChecks, wallet, isClient]);

  const claimedAchievements = achievements.filter(a => a.claimed).length;
  const totalAchievements = achievements.length;
  const unclaimedAchievements = totalAchievements - claimedAchievements;

  // Don't render until client-side
  if (!isClient) {
    return (
      <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <span className="mr-2">🔍</span>
          Debug Information Panel
        </h3>
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
        <span className="mr-2">🔍</span>
        Debug Information Panel
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Wallet Status */}
        <div className="space-y-2">
          <h4 className="text-lg font-medium text-white">Wallet Status</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Connected:</span>
              <span className={connected ? 'text-green-400' : 'text-red-400'}>
                {connected ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Connecting:</span>
              <span className={connecting ? 'text-yellow-400' : 'text-gray-400'}>
                {connecting ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Wallet:</span>
              <span className="text-white">{wallet?.adapter.name || 'None'}</span>
            </div>
            {publicKey && (
              <div className="text-xs text-gray-400 break-all">
                {publicKey.toString()}
              </div>
            )}
          </div>
        </div>

        {/* Steam Authentication */}
        <div className="space-y-2">
          <h4 className="text-lg font-medium text-white">Steam Authentication</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Authenticated:</span>
              <span className={steamAuthenticated ? 'text-green-400' : 'text-red-400'}>
                {steamAuthenticated ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Steam ID:</span>
              <span className="text-white">{steamId || 'Not set'}</span>
            </div>
          </div>
        </div>

        {/* Smart Contract Data */}
        {smartContractData && (
          <div className="space-y-2">
            <h4 className="text-lg font-medium text-white">Smart Contract</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Loading:</span>
                <span className={smartContractData.loading ? 'text-yellow-400' : 'text-green-400'}>
                  {smartContractData.loading ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">User Profile:</span>
                <span className={smartContractData.userProfile ? 'text-green-400' : 'text-red-400'}>
                  {smartContractData.userProfile ? 'Found' : 'Not found'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Protocol State:</span>
                <span className={smartContractData.protocolState ? 'text-green-400' : 'text-red-400'}>
                  {smartContractData.protocolState ? 'Found' : 'Not found'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Token Balance:</span>
                <span className="text-green-400">
                  {(smartContractData.tokenBalance / 1e9).toFixed(2)}
                </span>
              </div>
              {smartContractData.error && (
                <div className="text-red-400 text-xs">
                  Error: {smartContractData.error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Achievements */}
        <div className="space-y-2">
          <h4 className="text-lg font-medium text-white">Achievements</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Total:</span>
              <span className="text-white">{totalAchievements}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Claimed:</span>
              <span className="text-green-400">{claimedAchievements}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Unclaimed:</span>
              <span className="text-yellow-400">{unclaimedAchievements}</span>
            </div>
          </div>
        </div>

        {/* Rewards & Staking */}
        <div className="space-y-2">
          <h4 className="text-lg font-medium text-white">Rewards & Staking</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">User Rewards:</span>
              <span className="text-green-400">{userRewards}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Staked Amount:</span>
              <span className="text-blue-400">{stakedAmount}</span>
            </div>
          </div>
        </div>

        {/* Security Status */}
        <div className="space-y-2">
          <h4 className="text-lg font-medium text-white">Security Status</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Overall:</span>
              <span className={isSecure ? 'text-green-400' : 'text-red-400'}>
                {isSecure ? 'Secure' : 'Insecure'}
              </span>
            </div>
            {Object.entries(securityChecks).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-300">{key}:</span>
                <span className={value ? 'text-green-400' : 'text-red-400'}>
                  {value ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* System Statistics */}
        <div className="space-y-2">
          <h4 className="text-lg font-medium text-white">System Stats</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Page Load:</span>
              <span className="text-white">
                {new Date(systemStats.pageLoadTime).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Last Activity:</span>
              <span className="text-white">
                {new Date(systemStats.lastActivity).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Total Clicks:</span>
              <span className="text-white">{systemStats.totalClicks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Transactions:</span>
              <span className="text-white">{systemStats.totalTransactions}</span>
            </div>
          </div>
        </div>

        {/* Recent Security Events */}
        <div className="space-y-2">
          <h4 className="text-lg font-medium text-white">Security Events</h4>
          <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
            {securityEvents.slice(-5).map((event, index) => (
              <div key={index} className="text-gray-300">
                <div className="text-xs text-gray-400">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
                <div className="text-white">{event.event}</div>
                {event.details && (
                  <div className="text-xs text-gray-400">
                    {JSON.stringify(event.details)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
