'use client';

import { useAccountStore } from '@/store/account';

export default function AccountSummary() {
  const { balance, positions, totalBalance, totalUnrealizedPnL, loading } = useAccountStore();

  if (loading && balance.length === 0) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Account Summary</p>
        <p className="mt-6 text-center text-sm text-slate-400">Loading account snapshot…</p>
      </section>
    );
  }

  const activePositions = positions.filter((p) => p.positionAmt !== 0);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Account Summary</p>
          <p className="text-lg font-semibold text-slate-800">Spot Overview</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-slate-400">Unrealised PnL</p>
          <p
            className={`text-lg font-semibold ${
              totalUnrealizedPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {totalUnrealizedPnL >= 0 ? '+' : ''}${totalUnrealizedPnL.toFixed(2)}
          </p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Balance</p>
          <p className="mt-2 text-2xl font-semibold text-slate-800">${totalBalance.toFixed(2)}</p>
          <p className="mt-4 text-xs text-slate-500">Breakdown</p>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            {balance.length === 0 ? (
              <li className="text-slate-400">No balances available</li>
            ) : (
              balance.map((item) => (
                <li key={item.asset} className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">{item.asset}</span>
                  <span>{item.walletBalance.toFixed(4)}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-lg border border-slate-100 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Available</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {balance.length === 0 ? (
              <li className="text-slate-400">No funds available</li>
            ) : (
              balance.map((item) => (
                <li key={item.asset} className="flex items-center justify-between">
                  <span>{item.asset}</span>
                  <span>{item.crossWalletBalance.toFixed(4)}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Open Positions</p>
        {activePositions.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-400">
            No open positions right now.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {activePositions.map((position) => (
              <li
                key={position.symbol}
                className="rounded-lg border border-slate-100 bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{position.symbol}</p>
                    <p className="text-xs text-slate-400">Entry ${position.entryPrice.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        position.positionAmt >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {position.positionAmt.toFixed(3)}
                    </p>
                    <p className="text-xs text-slate-400">Mark ${position.markPrice.toFixed(2)}</p>
                  </div>
                </div>
                <p
                  className={`mt-2 text-xs font-medium ${
                    position.unRealizedProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  PnL {position.unRealizedProfit >= 0 ? '+' : ''}${position.unRealizedProfit.toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
