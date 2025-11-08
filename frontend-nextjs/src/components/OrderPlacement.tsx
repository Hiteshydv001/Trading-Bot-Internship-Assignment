'use client';

import { useState } from 'react';
import { useMarketDataStore } from '@/store/marketData';
import { useTradingStore } from '@/store/trading';
import { OrderType, OrderSide, TimeInForce } from '@/lib/types';

export default function OrderPlacement() {
  const { currentSymbol, markPrice } = useMarketDataStore();
  const { placeOrder, loading } = useTradingStore();

  const [orderForm, setOrderForm] = useState({
    side: 'BUY' as OrderSide,
    type: 'MARKET' as OrderType,
    quantity: '',
    price: '',
    stopPrice: '',
    timeInForce: 'GTC' as TimeInForce,
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setOrderForm({ ...orderForm, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!orderForm.quantity || parseFloat(orderForm.quantity) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid quantity' });
      return;
    }

    if (orderForm.type === 'LIMIT' && (!orderForm.price || parseFloat(orderForm.price) <= 0)) {
      setMessage({ type: 'error', text: 'Please enter a valid price for LIMIT order' });
      return;
    }

    if (orderForm.type === 'STOP_MARKET' && (!orderForm.stopPrice || parseFloat(orderForm.stopPrice) <= 0)) {
      setMessage({ type: 'error', text: 'Please enter a valid stop price' });
      return;
    }

    const quantity = parseFloat(orderForm.quantity);
    const estimatedPrice =
      orderForm.type === 'LIMIT'
        ? parseFloat(orderForm.price || '0')
        : orderForm.type === 'STOP_MARKET'
        ? parseFloat(orderForm.stopPrice || '0')
        : markPrice?.price ?? 0;

    if (estimatedPrice > 0 && quantity * estimatedPrice < 20) {
      const minQty = (20 / estimatedPrice).toFixed(4);
      setMessage({
        type: 'error',
        text: `Order notional must be at least $20. Try quantity ≥ ${minQty}.`,
      });
      return;
    }

    try {
      const orderData: any = {
        symbol: currentSymbol,
        side: orderForm.side,
        type: orderForm.type,
        quantity: orderForm.quantity,
      };

      if (orderForm.type === 'LIMIT') {
        orderData.price = orderForm.price;
        orderData.timeInForce = orderForm.timeInForce;
      }

      if (orderForm.type === 'STOP_MARKET') {
        orderData.stopPrice = orderForm.stopPrice;
      }

      await placeOrder(orderData);
      setMessage({ type: 'success', text: `${orderForm.side} order placed successfully!` });
      
      // Reset form
      setOrderForm({
        ...orderForm,
        quantity: '',
        price: '',
        stopPrice: '',
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to place order' });
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="mb-4">
        <p className="text-sm font-medium text-slate-500">Place Order</p>
        <p className="text-lg font-semibold text-slate-800">{orderForm.side === 'BUY' ? 'Buy' : 'Sell'} {currentSymbol}</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          {(['BUY', 'SELL'] as OrderSide[]).map((side) => (
            <button
              key={side}
              type="button"
              onClick={() => handleInputChange('side', side)}
              className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                orderForm.side === side
                  ? side === 'BUY'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-rose-500 bg-rose-50 text-rose-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {side}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Order Type</label>
          <select
            value={orderForm.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
          >
            <option value="MARKET">Market</option>
            <option value="LIMIT">Limit</option>
            <option value="STOP_MARKET">Stop Market</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Quantity</label>
          <input
            type="number"
            step="0.001"
            value={orderForm.quantity}
            onChange={(e) => handleInputChange('quantity', e.target.value)}
            placeholder="0.000"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
          />
        </div>

        {orderForm.type === 'LIMIT' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Limit Price</label>
            <input
              type="number"
              step="0.01"
              value={orderForm.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              placeholder="0.00"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>
        )}

        {orderForm.type === 'STOP_MARKET' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Stop Price</label>
            <input
              type="number"
              step="0.01"
              value={orderForm.stopPrice}
              onChange={(e) => handleInputChange('stopPrice', e.target.value)}
              placeholder="0.00"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>
        )}

        {orderForm.type === 'LIMIT' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Time in Force</label>
            <select
              value={orderForm.timeInForce}
              onChange={(e) => handleInputChange('timeInForce', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            >
              <option value="GTC">Good till cancel</option>
              <option value="IOC">Immediate or cancel</option>
              <option value="FOK">Fill or kill</option>
            </select>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-lg border px-4 py-2 text-sm font-semibold transition ${
            orderForm.side === 'BUY'
              ? 'border-emerald-500 bg-emerald-500 text-white hover:border-emerald-600 hover:bg-emerald-600'
              : 'border-rose-500 bg-rose-500 text-white hover:border-rose-600 hover:bg-rose-600'
          } ${loading ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          {loading ? 'Submitting…' : `Place ${orderForm.side} Order`}
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
      </form>
    </section>
  );
}
