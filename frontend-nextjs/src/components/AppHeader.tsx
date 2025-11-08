'use client';

import { useMarketDataStore } from '@/store/marketData';
import { useAccountStore } from '@/store/account';

const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT'];

export default function AppHeader() {
  const { currentSymbol, setCurrentSymbol, wsConnected, lastPrice, priceChange } = useMarketDataStore();
  const { totalBalance, totalUnrealizedPnL } = useAccountStore();

  const formatCurrency = (value: number) =>
    value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const priceAccent = () => {
    if (priceChange > 0) return 'text-emerald-200';
    if (priceChange < 0) return 'text-rose-200';
    return 'text-slate-500';
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full flex-wrap items-center justify-between gap-6 px-6 py-4">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-lg font-semibold text-slate-900">Trading Bot</p>
            <div className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-500">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-2 py-1 ${
                  wsConnected ? 'border-emerald-200 text-emerald-600' : 'border-rose-200 text-rose-600'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
                ></span>
                {wsConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium text-slate-600">Symbol</span>
          <select
            value={currentSymbol}
            onChange={(e) => setCurrentSymbol(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-slate-500 focus:outline-none"
          >
            {SYMBOLS.map((symbol) => (
              <option key={symbol} value={symbol}>
                {symbol}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium text-slate-600">Price</span>
          <span className="text-lg font-semibold text-slate-900">
            ${formatCurrency(Number.parseFloat(lastPrice || '0'))}
          </span>
          <span className={`text-sm font-semibold ${priceAccent()}`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
          </span>
        </div>

        <div className="flex items-center gap-6 text-right text-xs font-medium text-slate-500">
          <div>
            <div className="uppercase tracking-wide">Total Balance</div>
            <div className="text-base font-semibold text-slate-900">
              ${formatCurrency(totalBalance)}
            </div>
          </div>
          <div>
            <div className="uppercase tracking-wide">Unrealized P&amp;L</div>
            <div
              className={`text-base font-semibold ${
                totalUnrealizedPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {totalUnrealizedPnL >= 0 ? '+' : '-'}${formatCurrency(Math.abs(totalUnrealizedPnL))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
