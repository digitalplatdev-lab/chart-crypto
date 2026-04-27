
import React from 'react';
import { motion } from 'motion/react';

interface SentimentMeterProps {
  score: number;
}

export const SentimentMeter: React.FC<SentimentMeterProps> = ({ score }) => {
  const getSentimentLabel = (s: number) => {
    if (s >= 75) return { label: 'Strong Bullish', color: 'text-green-500' };
    if (s >= 55) return { label: 'Bullish', color: 'text-green-400' };
    if (s >= 45) return { label: 'Neutral', color: 'text-gray-400' };
    if (s >= 25) return { label: 'Bearish', color: 'text-red-400' };
    return { label: 'Strong Bearish', color: 'text-red-500' };
  };

  const { label, color } = getSentimentLabel(score);

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Market Sentiment</h3>
        <span className={`text-sm font-bold ${color}`}>{label}</span>
      </div>
      
      <div className="relative h-4 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`absolute h-full rounded-full ${
            score >= 50 ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-orange-400'
          }`}
        />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />
      </div>
      
      <div className="flex justify-between mt-2 text-[10px] text-gray-500 font-mono">
        <span>0 (EXTREME FEAR)</span>
        <span>50 (NEUTRAL)</span>
        <span>100 (EXTREME GREED)</span>
      </div>

      <div className="mt-4 text-center">
        <span className="text-3xl font-bold text-white tracking-tighter">{score}</span>
        <span className="text-sm text-gray-500 ml-1">/ 100</span>
      </div>
    </div>
  );
};
