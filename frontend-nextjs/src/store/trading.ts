import axios from 'axios';
import { create } from 'zustand';
import { ordersAPI, strategiesAPI } from '@/services/api';
import type {
  Order,
  OrderRequest,
  Strategy,
  StrategyRequest,
  PlaceOrderResponse,
  StopStrategyResponse,
} from '@/lib/types';
import { useAccountStore } from '@/store/account';

interface TradingState {
  openOrders: Order[];
  orderHistory: Order[];
  activeStrategies: Strategy[];
  loading: boolean;
  error: string | null;
  
  // Actions
  placeOrder: (orderData: OrderRequest) => Promise<PlaceOrderResponse>;
  cancelOrder: (symbol: string, orderId: string) => Promise<void>;
  fetchOpenOrders: (symbol?: string) => Promise<void>;
  fetchOrderHistory: (symbol?: string) => Promise<void>;
  startStrategy: (strategyData: StrategyRequest) => Promise<Strategy>;
  stopStrategy: (strategyId: string) => Promise<StopStrategyResponse>;
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
    } catch (error: unknown) {
      console.error('Error placing order:', error);
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { detail?: string } | undefined)?.detail ?? error.message
        : error instanceof Error
        ? error.message
        : 'Failed to place order';
      set({ error: message, loading: false });
      throw new Error(message);
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
    } catch (error: unknown) {
      console.error('Error canceling order:', error);
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { detail?: string } | undefined)?.detail ?? error.message
        : error instanceof Error
        ? error.message
        : 'Failed to cancel order';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  fetchOpenOrders: async (symbol?: string) => {
    set({ loading: true, error: null });
    try {
      const response = await ordersAPI.getOpenOrders(symbol);
      set({ openOrders: response.data, loading: false });
    } catch (error: unknown) {
      console.error('Error fetching open orders:', error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.detail ?? error.message
        : error instanceof Error
        ? error.message
        : 'Failed to fetch open orders';
      set({ error: message, loading: false });
    }
  },

  fetchOrderHistory: async (symbol?: string) => {
    set({ loading: true, error: null });
    try {
      const response = await ordersAPI.getOrderHistory(symbol);
      set({ orderHistory: response.data, loading: false });
    } catch (error: unknown) {
      console.error('Error fetching order history:', error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.detail ?? error.message
        : error instanceof Error
        ? error.message
        : 'Failed to fetch order history';
      set({ error: message, loading: false });
    }
  },

  startStrategy: async (strategyData: StrategyRequest) => {
    set({ loading: true, error: null });
    try {
      const response = await strategiesAPI.startStrategy(strategyData);
      await get().fetchActiveStrategies();
      set({ loading: false });
      return response.data;
    } catch (error: unknown) {
      console.error('Error starting strategy:', error);
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { detail?: string } | undefined)?.detail ?? error.message
        : error instanceof Error
        ? error.message
        : 'Failed to start strategy';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  stopStrategy: async (strategyId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await strategiesAPI.stopStrategy(strategyId);
      await get().fetchActiveStrategies();
      set({ loading: false });
      return response.data;
    } catch (error: unknown) {
      console.error('Error stopping strategy:', error);
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { detail?: string } | undefined)?.detail ?? error.message
        : error instanceof Error
        ? error.message
        : 'Failed to stop strategy';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  fetchActiveStrategies: async () => {
    set({ loading: true, error: null });
    try {
      const response = await strategiesAPI.getActiveStrategies();
      set({ activeStrategies: response.data, loading: false });
    } catch (error: unknown) {
      console.error('Error fetching active strategies:', error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.detail ?? error.message
        : error instanceof Error
        ? error.message
        : 'Failed to fetch active strategies';
      set({ error: message, loading: false });
    }
  },
}));
