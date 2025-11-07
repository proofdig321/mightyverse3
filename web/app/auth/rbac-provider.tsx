"use client";

import React, { createContext, useContext, ReactNode } from 'react';

interface RBACContextType {
  isAdmin: boolean;
  isAnimator: boolean;
  isCurator: boolean;
  wallet: string | null;
  loading: boolean;
  connectWallet: (walletAddress?: string) => Promise<void>;
}

const RBACContext = createContext<RBACContextType>({
  isAdmin: false,
  isAnimator: false,
  isCurator: false,
  wallet: null,
  loading: false,
  connectWallet: async (walletAddress?: string) => {}
});

export function RBACProvider({ children }: { children: ReactNode }) {
  // Simplified RBAC for build compatibility
  const value = {
    isAdmin: true, // Mock admin for development
    isAnimator: true,
    isCurator: true, // Mock curator for development
    wallet: "0x860Ec697167Ba865DdE1eC9e172004100613e970",
    loading: false,
    connectWallet: async (walletAddress?: string) => {
      // Mock wallet connection for development
      console.log('Mock wallet connection', walletAddress);
    }
  };

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  );
}

export const useRBAC = () => useContext(RBACContext);
