import axios from 'axios';
import { create } from 'zustand';
import { accountAPI } from '@/services/api';
import type { Balance, AccountInfo, Position } from '@/lib/types';

interface AccountState {
  balance: Balance[];
  accountInfo: AccountInfo | null;
  positions: Position[];
  totalBalance: number;
  totalUnrealizedPnL: number;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchBalance: () => Promise<void>;
  fetchPositions: () => Promise<void>;
  pollAccount: () => void;
  stopPolling: () => void;
  updateBalance: (balance: Balance[]) => void;
  updatePositions: (positions: Position[]) => void;
}

let pollTimer: NodeJS.Timeout | null = null;

export const useAccountStore = create<AccountState>((set, get) => ({
  balance: [],
  accountInfo: null,
  positions: [],
  totalBalance: 0,
  totalUnrealizedPnL: 0,
  loading: false,
  error: null,

  fetchBalance: async () => {
    set({ loading: true, error: null });
    try {
      const response = await accountAPI.getBalance();
      const balance = response.data;
      const totalBalance = balance.reduce(
        (sum: number, b: Balance) => sum + b.walletBalance,
        0
      );
      const totalUnrealizedPnL = balance.reduce(
        (sum: number, b: Balance) => sum + b.crossUnPnl,
        0
      );
      set({ balance, totalBalance, totalUnrealizedPnL, loading: false });
    } catch (error: unknown) {
      console.error('Error fetching balance:', error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.detail ?? error.message
        : error instanceof Error
        ? error.message
        : 'Failed to fetch balance';
      set({ error: message, loading: false });
    }
  },

  fetchPositions: async () => {
    set({ loading: true, error: null });
    try {
      const response = await accountAPI.getPositions();
      const positions = response.data;
      const totalUnrealizedPnL = positions.reduce(
        (sum: number, p: Position) => sum + p.unRealizedProfit,
        0
      );
      set({ positions, totalUnrealizedPnL, loading: false });
    } catch (error: unknown) {
      console.error('Error fetching positions:', error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.detail ?? error.message
        : error instanceof Error
        ? error.message
        : 'Failed to fetch positions';
      set({ error: message, loading: false });
    }
  },

  pollAccount: () => {
    if (pollTimer) return;
    pollTimer = setInterval(async () => {
      try {
        await Promise.all([get().fetchBalance(), get().fetchPositions()]);
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 4000);
  },

  stopPolling: () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  },

  updateBalance: (balance: Balance[]) => {
    const totalBalance = balance.reduce(
      (sum: number, b: Balance) => sum + b.walletBalance,
      0
    );
    const totalUnrealizedPnL = balance.reduce(
      (sum: number, b: Balance) => sum + b.crossUnPnl,
      0
    );
    set({ balance, totalBalance, totalUnrealizedPnL });
  },

  updatePositions: (positions: Position[]) => {
    const totalUnrealizedPnL = positions.reduce(
      (sum: number, p: Position) => sum + p.unRealizedProfit,
      0
    );
    set({ positions, totalUnrealizedPnL });
  },
}));
