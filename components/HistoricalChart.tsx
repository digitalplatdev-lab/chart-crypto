
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface HistoricalChartProps {
  data: {
    prices: [number, number][];
  };
}

export const HistoricalChart: React.FC<HistoricalChartProps> = ({ data }) => {
  const chartData = data?.prices?.map(([timestamp, price]) => ({
    date: new Date(timestamp).toLocaleDateString(),
    price: price,
  })) || [];

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-sm h-[300px]">
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
        Historical Price Trend
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
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
            domain={['auto', 'auto']}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#000000e0',
              border: '1px solid #ffffff20',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            itemStyle={{ color: '#3b82f6' }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
