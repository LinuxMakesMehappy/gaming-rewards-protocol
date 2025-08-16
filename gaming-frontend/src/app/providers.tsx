'use client';

import React from 'react';
import { WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { Toaster } from 'react-hot-toast';
import '@solana/wallet-adapter-react-ui/styles.css';
import { SecurityProvider } from './security/security-provider';

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const network = clusterApiUrl('devnet');
  const endpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT || network;
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ];

  return (
    <SecurityProvider>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </WalletModalProvider>
      </WalletProvider>
    </SecurityProvider>
  );
}
