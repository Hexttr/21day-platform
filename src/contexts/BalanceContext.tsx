import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { api } from '@/api/client';

interface BalanceContextType {
  balance: number;
  isLoading: boolean;
  refreshBalance: () => Promise<void>;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export function BalanceProvider({ children }: { children: ReactNode }) {
  const { user, isSessionReady } = useAuth();
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refreshBalance = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api<{ balance: number }>('/balance');
      setBalance(typeof data.balance === 'number' ? data.balance : parseFloat(String(data.balance)) || 0);
    } catch (e) {
      console.error('[Balance] Error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isSessionReady || !user) {
      setBalance(0);
      setIsLoading(false);
      return;
    }
    refreshBalance();
  }, [isSessionReady, user, refreshBalance]);

  return (
    <BalanceContext.Provider value={{ balance, isLoading, refreshBalance }}>
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalance() {
  const context = useContext(BalanceContext);
  if (!context) throw new Error('useBalance must be used within BalanceProvider');
  return context;
}
