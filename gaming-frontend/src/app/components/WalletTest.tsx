'use client';

import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { toast } from 'react-hot-toast';

export function WalletTest() {
  const { publicKey, connected, connecting, disconnecting, select, wallet, wallets, connect, disconnect } = useWallet();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 Wallet Debug Info:', {
      connected,
      connecting,
      disconnecting,
      publicKey: publicKey?.toString(),
      wallet: wallet?.adapter.name,
      availableWallets: wallets.map(w => w.adapter.name)
    });
  }, [connected, connecting, disconnecting, publicKey, wallet, wallets]);

  const handleConnect = async () => {
    try {
      setError(null);
      console.log('🔄 Attempting to connect wallet...');
      
      if (!wallet) {
        setError('No wallet selected');
        toast.error('Please select a wallet first');
        return;
      }

      await connect();
      console.log('✅ Wallet connection successful');
      toast.success('Wallet connected successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Wallet connection failed:', err);
      setError(errorMessage);
      toast.error(`Connection failed: ${errorMessage}`);
    }
  };

  const handleDisconnect = async () => {
    try {
      setError(null);
      console.log('🔄 Disconnecting wallet...');
      await disconnect();
      console.log('✅ Wallet disconnected successfully');
      toast.success('Wallet disconnected');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Wallet disconnection failed:', err);
      setError(errorMessage);
      toast.error(`Disconnection failed: ${errorMessage}`);
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
      <h3 className="text-xl font-semibold text-white mb-4">Wallet Connection Test</h3>
      
      {/* Debug Info */}
      <div className="mb-4 p-4 bg-gray-900/50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">Debug Information:</h4>
        <div className="text-xs text-gray-400 space-y-1">
          <div>Connected: {connected ? '✅ Yes' : '❌ No'}</div>
          <div>Connecting: {connecting ? '🔄 Yes' : '❌ No'}</div>
          <div>Disconnecting: {disconnecting ? '🔄 Yes' : '❌ No'}</div>
          <div>Public Key: {publicKey ? publicKey.toString() : 'None'}</div>
          <div>Selected Wallet: {wallet?.adapter.name || 'None'}</div>
          <div>Available Wallets: {wallets.map(w => w.adapter.name).join(', ') || 'None'}</div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg">
          <h4 className="text-sm font-semibold text-red-300 mb-2">Error:</h4>
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Wallet Actions */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Available Wallets:</h4>
          <div className="space-y-2">
            {wallets.map((walletItem) => (
              <button
                key={walletItem.adapter.name}
                onClick={() => select(walletItem.adapter.name)}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  walletItem.adapter.name === wallet?.adapter.name
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center">
                  <span className="mr-2">🦊</span>
                  {walletItem.adapter.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleConnect}
            disabled={!wallet || connecting || connected}
            className={`px-4 py-2 rounded-lg font-semibold ${
              !wallet || connecting || connected
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {connecting ? 'Connecting...' : 'Connect'}
          </button>

          <button
            onClick={handleDisconnect}
            disabled={!connected || disconnecting}
            className={`px-4 py-2 rounded-lg font-semibold ${
              !connected || disconnecting
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {disconnecting ? 'Disconnecting...' : 'Disconnect'}
          </button>
        </div>

        {/* Standard Wallet Button */}
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Standard Wallet Button:</h4>
          <WalletMultiButton className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
