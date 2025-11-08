import { create } from 'zustand';
import { ordersAPI, strategiesAPI } from '@/services/api';
import { Order, OrderRequest, Strategy, StrategyRequest } from '@/lib/types';
import { useAccountStore } from '@/store/account';

interface TradingState {
  openOrders: Order[];
  orderHistory: Order[];
  activeStrategies: Strategy[];
  loading: boolean;
  error: string | null;
  
  // Actions
  placeOrder: (orderData: OrderRequest) => Promise<Order>;
  cancelOrder: (symbol: string, orderId: string) => Promise<void>;
  fetchOpenOrders: (symbol?: string) => Promise<void>;
  fetchOrderHistory: (symbol?: string) => Promise<void>;
  startStrategy: (strategyData: StrategyRequest) => Promise<Strategy>;
  stopStrategy: (strategyId: string) => Promise<void>;
  fetchActiveStrategies: () => Promise<void>;
}

export const useTradingStore = create<TradingState>((set, get) => ({
  openOrders: [],
  orderHistory: [],
  activeStrategies: [],
  loading: false,
  error: null,

  placeOrder: async (orderData: OrderRequest) => {
    set({ loading: true, error: null });
    try {
  const response = await ordersAPI.placeOrder(orderData);
  await get().fetchOpenOrders(orderData.symbol);
  const { fetchPositions, fetchBalance } = useAccountStore.getState();
  await Promise.all([fetchPositions(), fetchBalance()]);
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      console.error('Error placing order:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to place order';
      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage);
    }
  },

  cancelOrder: async (symbol: string, orderId: string) => {
    set({ loading: true, error: null });
    try {
      await ordersAPI.cancelOrder(symbol, orderId);
      await get().fetchOpenOrders(symbol);
      const { fetchPositions, fetchBalance } = useAccountStore.getState();
      await Promise.all([fetchPositions(), fetchBalance()]);
      set({ loading: false });
    } catch (error: any) {
      console.error('Error canceling order:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to cancel order';
      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage);
    }
  },

  fetchOpenOrders: async (symbol?: string) => {
    set({ loading: true, error: null });
    try {
      const response = await ordersAPI.getOpenOrders(symbol);
      set({ openOrders: response.data, loading: false });
    } catch (error: any) {
      console.error('Error fetching open orders:', error);
      set({ error: error.message || 'Failed to fetch open orders', loading: false });
    }
  },

  fetchOrderHistory: async (symbol?: string) => {
    set({ loading: true, error: null });
    try {
      const response = await ordersAPI.getOrderHistory(symbol);
      set({ orderHistory: response.data, loading: false });
    } catch (error: any) {
      console.error('Error fetching order history:', error);
      set({ error: error.message || 'Failed to fetch order history', loading: false });
    }
  },

  startStrategy: async (strategyData: StrategyRequest) => {
    set({ loading: true, error: null });
    try {
      const response = await strategiesAPI.startStrategy(strategyData);
      await get().fetchActiveStrategies();
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      console.error('Error starting strategy:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to start strategy';
      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage);
    }
  },

  stopStrategy: async (strategyId: string) => {
    set({ loading: true, error: null });
    try {
      await strategiesAPI.stopStrategy(strategyId);
      await get().fetchActiveStrategies();
      set({ loading: false });
    } catch (error: any) {
      console.error('Error stopping strategy:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to stop strategy';
      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage);
    }
  },

  fetchActiveStrategies: async () => {
    set({ loading: true, error: null });
    try {
      const response = await strategiesAPI.getActiveStrategies();
      set({ activeStrategies: response.data, loading: false });
    } catch (error: any) {
      console.error('Error fetching active strategies:', error);
      set({ error: error.message || 'Failed to fetch active strategies', loading: false });
    }
  },
}));
