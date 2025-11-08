'use client';

import { useEffect } from 'react';
import AppHeader from '@/components/AppHeader';
import MarketWatch from '@/components/MarketWatch';
import OrderPlacement from '@/components/OrderPlacement';
import AccountSummary from '@/components/AccountSummary';
import StrategyControls from '@/components/StrategyControls';
import RealtimeChart from '@/components/RealtimeChart';
import { useMarketDataStore } from '@/store/marketData';
import { useAccountStore } from '@/store/account';
import { useTradingStore } from '@/store/trading';

export default function DashboardPage() {
  const { fetchMarkPrice, fetchKlines, connectWebSocket, currentSymbol } = useMarketDataStore();
  const { fetchBalance, fetchPositions, pollAccount, stopPolling } = useAccountStore();
  const { fetchOpenOrders, fetchActiveStrategies } = useTradingStore();

  useEffect(() => {
    // Initial data fetch
    fetchMarkPrice(currentSymbol);
    fetchKlines(currentSymbol, '1h', 100);
    fetchBalance();
    fetchPositions();
    fetchOpenOrders();
    fetchActiveStrategies();
    pollAccount();

    // Connect WebSocket with symbol-specific endpoint
    const wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
    const wsUrl = `${wsBaseUrl}/market_data/${currentSymbol}`;
    connectWebSocket(wsUrl);

    // Cleanup on unmount or symbol change
    return () => {
      useMarketDataStore.getState().disconnectWebSocket();
      stopPolling();
    };
  }, [
    connectWebSocket,
    currentSymbol,
    fetchActiveStrategies,
    fetchBalance,
    fetchKlines,
    fetchMarkPrice,
    fetchOpenOrders,
    fetchPositions,
    pollAccount,
    stopPolling,
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <MarketWatch />
            <OrderPlacement />
          </div>

          {/* Center Column */}
          <div className="lg:col-span-2 space-y-6">
            <RealtimeChart />
            <AccountSummary />
          </div>

          {/* Right Column - Full Width on Small Screens */}
          <div className="lg:col-span-3">
            <StrategyControls />
          </div>
        </div>
      </main>
    </div>
  );
}
