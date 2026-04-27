
import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface BacktestChartProps {
  data: Array<{ date: string; pnl: number }>;
}

export const BacktestChart: React.FC<BacktestChartProps> = ({ data }) => {
  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-sm h-[300px]">
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
        Backtest Performance
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#ffffff40"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#ffffff40"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#000000e0',
              border: '1px solid #ffffff20',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            itemStyle={{ color: '#10b981' }}
          />
          <Area
            type="monotone"
            dataKey="pnl"
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#colorPnl)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
