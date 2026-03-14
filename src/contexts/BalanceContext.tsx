import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { api } from '@/api/client';

interface BalanceContextType {
  balance: number;
  balanceTokens: number;
  tokenRate: number;
  isLoading: boolean;
  refreshBalance: () => Promise<void>;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export function BalanceProvider({ children }: { children: ReactNode }) {
  const { user, isSessionReady } = useAuth();
  const [balance, setBalance] = useState(0);
  const [balanceTokens, setBalanceTokens] = useState(0);
  const [tokenRate, setTokenRate] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  const refreshBalance = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api<{ balance: number; balanceTokens?: number; tokenRate?: number }>('/balance');
      setBalance(typeof data.balance === 'number' ? data.balance : parseFloat(String(data.balance)) || 0);
      setBalanceTokens(typeof data.balanceTokens === 'number' ? data.balanceTokens : Math.round((parseFloat(String(data.balance)) || 0) * (typeof data.tokenRate === 'number' ? data.tokenRate : 10)));
      setTokenRate(typeof data.tokenRate === 'number' ? data.tokenRate : 10);
    } catch (e) {
      console.error('[Balance] Error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isSessionReady || !user) {
      setBalance(0);
      setBalanceTokens(0);
      setTokenRate(10);
      setIsLoading(false);
      return;
    }
    refreshBalance();
  }, [isSessionReady, user, refreshBalance]);

  return (
    <BalanceContext.Provider value={{ balance, balanceTokens, tokenRate, isLoading, refreshBalance }}>
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalance() {
  const context = useContext(BalanceContext);
  if (!context) throw new Error('useBalance must be used within BalanceProvider');
  return context;
}
