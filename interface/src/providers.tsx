'use client';

import React, { FC, ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

// Simple provider without wallet adapters
export const ClientOnlyProviders: FC<ProvidersProps> = ({ children }) => {
  return <>{children}</>;
};
