'use client';

import dynamic from 'next/dynamic';
import { useMarketDataStore } from '@/store/marketData';

const RealtimeChartClient = dynamic(() => import('./RealtimeChartClient'), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Price Chart</h2>
      </div>
      <div className="h-[400px] flex items-center justify-center text-gray-500">
        Loading chart...
      </div>
    </div>
  ),
});

export default function RealtimeChart() {
  const { klines, currentSymbol, loading } = useMarketDataStore();

  return <RealtimeChartClient klines={klines} currentSymbol={currentSymbol} loading={loading} />;
}
