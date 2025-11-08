'use client';

import { useEffect, useRef } from 'react';
import type { Kline } from '@/lib/types';

interface SimpleChartProps {
  klines: Kline[];
}

export default function SimpleChart({ klines }: SimpleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('SimpleChart: Component mounted');
    console.log('SimpleChart: Klines count:', klines.length);
    console.log('SimpleChart: Container ref:', containerRef.current);
  }, [klines]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Simple Chart Test</h2>
      <div 
        ref={containerRef}
        className="w-full h-[400px] bg-gradient-to-br from-blue-50 to-blue-100 border-4 border-blue-500 rounded flex items-center justify-center"
      >
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-800 mb-2">Chart Container</p>
          <p className="text-blue-600">Klines: {klines.length}</p>
          <p className="text-sm text-blue-500 mt-2">
            Container width: {containerRef.current?.clientWidth || 0}px
          </p>
        </div>
      </div>
    </div>
  );
}
