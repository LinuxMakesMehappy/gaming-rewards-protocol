'use client';

import React from 'react';
import type { AppProps } from 'next/app';
import { ClientOnlyProviders } from '../providers';
import { NotificationContainer } from '../components/Notification';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClientOnlyProviders>
      <NotificationContainer>
        <Component {...pageProps} />
      </NotificationContainer>
    </ClientOnlyProviders>
  );
}
