'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import { Kline } from '../lib/types';

interface RealtimeChartClientProps {
  klines: Kline[];
  currentSymbol: string;
  loading: boolean;
}

export default function RealtimeChartClient({ klines, currentSymbol, loading }: RealtimeChartClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;

    const width = containerRef.current.clientWidth || 600;

    const chart = createChart(containerRef.current, {
      width,
      height: 380,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#1f2937',
      },
      grid: {
        vertLines: { color: '#f4f4f5' },
        horzLines: { color: '#f4f4f5' },
      },
      crosshair: {
        mode: 0,
      },
      timeScale: {
        borderColor: '#e5e7eb',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: '#e5e7eb',
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: '#16a34a',
      downColor: '#dc2626',
      borderUpColor: '#166534',
      borderDownColor: '#991b1b',
      wickUpColor: '#16a34a',
      wickDownColor: '#dc2626',
    });

    chartRef.current = chart;
    seriesRef.current = series;
    setChartReady(true);

    const handleResize = () => {
      if (!containerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
    };

    window.addEventListener('resize', handleResize);
    chart.timeScale().fitContent();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [klines.length]);

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || klines.length === 0) return;

    type CandlePoint = { time: UTCTimestamp; open: number; high: number; low: number; close: number };

    const parsed = klines
      .map((kline) => {
        const open = Number.parseFloat(String(kline.open));
        const high = Number.parseFloat(String(kline.high));
        const low = Number.parseFloat(String(kline.low));
        const close = Number.parseFloat(String(kline.close));
        const time = Math.floor(Number(kline.open_time) / 1000) as UTCTimestamp;

        if ([open, high, low, close, time].some((value) => Number.isNaN(value))) {
          return null;
        }

        return {
          time,
          open,
          high,
          low,
          close,
        };
      })
      .filter((item): item is CandlePoint => item !== null)
      .sort((a, b) => a.time - b.time);

    if (parsed.length === 0) return;

    seriesRef.current.setData(parsed);
    chartRef.current?.timeScale().fitContent();
  }, [klines]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Price Chart</p>
          <p className="text-lg font-semibold text-slate-800">{currentSymbol}</p>
        </div>
        <span className="text-xs font-medium text-slate-400">
          {loading ? 'Refreshing…' : chartReady ? `${klines.length} candles` : 'Preparing chart…'}
        </span>
      </header>

      <div className="relative h-[380px] w-full">
        <div ref={containerRef} className="h-full w-full" />

        {klines.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
            {loading ? 'Loading market data…' : 'No candles available yet.'}
          </div>
        )}
      </div>
    </section>
  );
}
