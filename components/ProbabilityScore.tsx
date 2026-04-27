import React from 'react';

interface ProbabilityScoreProps {
  score: number;
  breakdown: {
    patternMatch: number;
    volumeConfirmation: number;
    mtfmAlignment: number;
    keyLevelLiquidity: number;
  };
}

export const ProbabilityScore: React.FC<ProbabilityScoreProps> = ({ score, breakdown }) => {
  const normalizedScore = Math.max(0, Math.min(100, score));
  
  let label = "LOW PROBABILITY";
  let colorClass = "bg-rose-500";
  let textClass = "text-rose-400";

  if (normalizedScore > 75) {
    label = "HIGH PROBABILITY SIGNAL";
    colorClass = "bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]";
    textClass = "text-cyan-400";
  } else if (normalizedScore > 50) {
    label = "MODERATE PROBABILITY";
    colorClass = "bg-yellow-500";
    textClass = "text-yellow-400";
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-sm">
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase font-mono tracking-widest">Confidence Score</span>
          <span className={`text-sm font-black font-mono tracking-tighter ${textClass}`}>{label}</span>
        </div>
        <span className={`text-2xl font-black font-mono ${textClass}`}>{normalizedScore}%</span>
      </div>
      
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden relative">
        <div 
          className={`h-full transition-all duration-1000 ease-out ${colorClass}`} 
          style={{ width: `${normalizedScore}%` }}
        ></div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-slate-800/50">
        <div className="flex flex-col">
          <span className="text-[8px] text-slate-500 font-mono uppercase tracking-tighter">Pattern Match</span>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-slate-400" style={{ width: `${(breakdown.patternMatch / 20) * 100}%` }}></div>
            </div>
            <span className="text-[9px] font-bold text-slate-400">{breakdown.patternMatch}/20</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] text-slate-500 font-mono uppercase tracking-tighter">Volume Conf.</span>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-slate-400" style={{ width: `${(breakdown.volumeConfirmation / 25) * 100}%` }}></div>
            </div>
            <span className="text-[9px] font-bold text-slate-400">{breakdown.volumeConfirmation}/25</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] text-slate-500 font-mono uppercase tracking-tighter">MTFM Alignment</span>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-slate-400" style={{ width: `${(breakdown.mtfmAlignment / 25) * 100}%` }}></div>
            </div>
            <span className="text-[9px] font-bold text-slate-400">{breakdown.mtfmAlignment}/25</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] text-slate-500 font-mono uppercase tracking-tighter">Key Level/Liq.</span>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-slate-400" style={{ width: `${(breakdown.keyLevelLiquidity / 30) * 100}%` }}></div>
            </div>
            <span className="text-[9px] font-bold text-slate-400">{breakdown.keyLevelLiquidity}/30</span>
          </div>
        </div>
      </div>
    </div>
  );
};
