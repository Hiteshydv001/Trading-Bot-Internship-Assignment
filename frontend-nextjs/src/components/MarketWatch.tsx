'use client';

import { useMarketDataStore } from '@/store/marketData';

export default function MarketWatch() {
  const { markPrice, loading } = useMarketDataStore();

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Market Watch</p>

      {loading && !markPrice ? (
        <p className="mt-6 text-sm text-slate-400">Loading price…</p>
      ) : !markPrice ? (
        <p className="mt-6 text-sm text-slate-400">No price data.</p>
      ) : (
        <div className="mt-4">
          <p className="text-sm font-medium text-slate-500">{markPrice.symbol}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            ${markPrice.price.toFixed(2)}
          </p>
          <p className="mt-2 text-xs text-slate-400">Streaming from feed</p>
        </div>
      )}
    </section>
  );
}
