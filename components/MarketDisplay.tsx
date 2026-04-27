
import React from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface MarketData {
  name: string;
  symbol: string;
  market_data: {
    current_price: { usd: number };
    price_change_percentage_24h: number;
    high_24h: { usd: number };
    low_24h: { usd: number };
  };
}

interface MarketDisplayProps {
  data: MarketData | null;
}

export const MarketDisplay: React.FC<MarketDisplayProps> = ({ data }) => {
  if (!data) return null;

  const { name, symbol, market_data } = data;
  const currentPrice = market_data?.current_price?.usd;
  const priceChange = market_data?.price_change_percentage_24h;
  const high24h = market_data?.high_24h?.usd;
  const low24h = market_data?.low_24h?.usd;

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{name}</h3>
            <span className="text-xs text-gray-500 uppercase font-mono tracking-widest">{symbol}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white tracking-tighter">
            ${currentPrice?.toLocaleString()}
          </div>
          <div className={`flex items-center justify-end gap-1 text-sm font-medium ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {priceChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(priceChange)?.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-lg p-3 border border-white/5">
          <div className="flex items-center gap-2 text-gray-500 text-[10px] uppercase tracking-wider mb-1">
            <TrendingUp className="w-3 h-3" />
            24h High
          </div>
          <div className="text-sm font-bold text-white font-mono">
            ${high24h?.toLocaleString()}
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/5">
          <div className="flex items-center gap-2 text-gray-500 text-[10px] uppercase tracking-wider mb-1">
            <TrendingDown className="w-3 h-3" />
            24h Low
          </div>
          <div className="text-sm font-bold text-white font-mono">
            ${low24h?.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};
