import React from 'react';
import { DrawingTool } from '../types';
import { 
  MousePointer2, 
  TrendingUp, 
  Minus, 
  Type, 
  Eraser, 
  Trash2 
} from 'lucide-react';

interface DrawingToolbarProps {
  activeTool: DrawingTool;
  onSelectTool: (tool: DrawingTool) => void;
  onClearAll: () => void;
}

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  activeTool,
  onSelectTool,
  onClearAll
}) => {
  const tools = [
    { id: DrawingTool.NONE, icon: MousePointer2, label: 'Select' },
    { id: DrawingTool.TRENDLINE, icon: TrendingUp, label: 'Trendline' },
    { id: DrawingTool.HORIZONTAL_LINE, icon: Minus, label: 'Support/Resistance' },
    { id: DrawingTool.TEXT, icon: Type, label: 'Text' },
    { id: DrawingTool.ERASER, icon: Eraser, label: 'Eraser' },
  ];

  return (
    <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md border border-slate-700 p-1 rounded-lg shadow-xl">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onSelectTool(tool.id)}
          title={tool.label}
          className={`p-2 rounded-md transition-all duration-200 group relative ${
            activeTool === tool.id 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <tool.icon size={18} />
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-slate-700">
            {tool.label}
          </span>
        </button>
      ))}
      
      <div className="w-px h-6 bg-slate-700 mx-1" />
      
      <button
        onClick={onClearAll}
        title="Clear All"
        className="p-2 rounded-md text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-all duration-200 group relative"
      >
        <Trash2 size={18} />
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-slate-700">
          Clear All
        </span>
      </button>
    </div>
  );
};
