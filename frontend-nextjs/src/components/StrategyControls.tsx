'use client';

import { useEffect, useState } from 'react';
import { useMarketDataStore } from '@/store/marketData';
import { useTradingStore } from '@/store/trading';

const STRATEGY_TYPES = [
  {
    id: 'ema_crossover',
    name: 'EMA Crossover',
    description: 'Buys on bullish EMA crosses and exits when momentum fades.',
  },
];

export default function StrategyControls() {
  const { currentSymbol, markPrice } = useMarketDataStore();
  const {
    activeStrategies,
    fetchActiveStrategies,
    startStrategy,
    stopStrategy,
    loading,
  } = useTradingStore();
  const [selectedStrategyType, setSelectedStrategyType] = useState(STRATEGY_TYPES[0].id);
  const [strategyName, setStrategyName] = useState('EMA_Crossover_1');
  const [symbol, setSymbol] = useState(currentSymbol || 'BTCUSDT');
  const [shortEmaPeriod, setShortEmaPeriod] = useState('9');
  const [longEmaPeriod, setLongEmaPeriod] = useState('20');
  const [quantityPerTrade, setQuantityPerTrade] = useState('0.001');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const selectedStrategy = STRATEGY_TYPES.find(s => s.id === selectedStrategyType);

  // Update symbol when currentSymbol changes
  useEffect(() => {
    if (currentSymbol) {
      setSymbol(currentSymbol);
    }
  }, [currentSymbol]);

  useEffect(() => {
    fetchActiveStrategies();
    const interval = setInterval(fetchActiveStrategies, 4000);
    return () => clearInterval(interval);
  }, [fetchActiveStrategies]);

  const strategies = activeStrategies;

  const handleStart = async () => {
    setMessage(null);
    
    try {
      const quantity = parseFloat(quantityPerTrade);
      const latestPrice = markPrice?.price ?? 0;
      if (Number.isNaN(quantity) || quantity <= 0) {
        setMessage({ type: 'error', text: 'Please enter a valid quantity per trade.' });
        return;
      }

      if (latestPrice > 0 && quantity * latestPrice < 20) {
        const minQty = (20 / latestPrice).toFixed(4);
        setMessage({
          type: 'error',
          text: `Increase quantity per trade to at least ${minQty} ${symbol} to meet the $20 notional minimum.`,
        });
        return;
      }

      await startStrategy({
        name: strategyName,
        symbol,
        short_ema_period: parseInt(shortEmaPeriod, 10),
        long_ema_period: parseInt(longEmaPeriod, 10),
        quantity_per_trade: parseFloat(quantityPerTrade),
      });
      setMessage({ type: 'success', text: `Strategy "${strategyName}" started successfully!` });
    } catch (error: unknown) {
      console.error('Error starting strategy:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start strategy';
      setMessage({ type: 'error', text: errorMessage });
    }
  };

  const handleStop = async (name: string) => {
    setMessage(null);
    
    try {
      await stopStrategy(name);
      setMessage({ type: 'success', text: 'Strategy stopped successfully!' });
    } catch (error: unknown) {
      console.error('Error stopping strategy:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop strategy';
      setMessage({ type: 'error', text: errorMessage });
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="mb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Strategy Controls</p>
        <p className="mt-1 text-lg font-semibold text-slate-800">Set the rules and monitor live bots</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Strategy Type</label>
            <select
              value={selectedStrategyType}
              onChange={(e) => setSelectedStrategyType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            >
              {STRATEGY_TYPES.map((strategy) => (
                <option key={strategy.id} value={strategy.id}>
                  {strategy.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">{selectedStrategy?.description}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Strategy Name</label>
            <input
              type="text"
              value={strategyName}
              onChange={(e) => setStrategyName(e.target.value)}
              placeholder="EMA_Crossover_1"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="BTCUSDT"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>

          {selectedStrategyType === 'ema_crossover' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Short EMA</label>
                <input
                  type="number"
                  min="1"
                  value={shortEmaPeriod}
                  onChange={(e) => setShortEmaPeriod(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                />
                <p className="mt-1 text-xs text-slate-500">Fast line, reacts to new trends quickly.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Long EMA</label>
                <input
                  type="number"
                  min="1"
                  value={longEmaPeriod}
                  onChange={(e) => setLongEmaPeriod(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                />
                <p className="mt-1 text-xs text-slate-500">Keeps positions disciplined against noise.</p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Quantity per Trade</label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={quantityPerTrade}
                  onChange={(e) => setQuantityPerTrade(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                />
                <p className="mt-1 text-xs text-slate-500">Capital to deploy each signal.</p>
              </div>
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={loading}
            className={`w-full rounded-lg border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 ${
              loading ? 'cursor-not-allowed opacity-60' : ''
            }`}
          >
            {loading ? 'Starting…' : 'Start Strategy'}
          </button>

          {message && (
            <div
              className={`rounded-lg border px-3 py-2 text-sm ${
                message.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {message.text}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active Strategies</p>
          {strategies.filter((strategy) => strategy.active).length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No active bots at the moment.
            </div>
          )}

          {strategies
            .filter((strategy) => strategy.active)
            .map((strategy) => (
              <article
                key={strategy.name}
                className="rounded-lg border border-slate-200 px-4 py-4 transition hover:border-slate-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{strategy.name}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-500">{strategy.symbol}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                    Active
                  </span>
                </div>

                {strategy.message && (
                  <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    {strategy.message}
                  </p>
                )}

                {strategy.last_action && (
                  <div className="mt-3 text-xs text-slate-500">
                    <p>Last action: {strategy.last_action}</p>
                    {strategy.last_update && (
                      <p className="mt-1">
                        Updated {new Date(strategy.last_update * 1000).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                <button
                  onClick={() => handleStop(strategy.name)}
                  disabled={loading}
                  className={`mt-4 w-full rounded-lg border border-rose-500 bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:border-rose-600 hover:bg-rose-600 ${
                    loading ? 'cursor-not-allowed opacity-60' : ''
                  }`}
                >
                  Stop Strategy
                </button>
              </article>
            ))}
        </section>
      </div>
    </section>
  );
}
