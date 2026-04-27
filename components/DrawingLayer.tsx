import React, { useState } from 'react';
import { Drawing, DrawingTool } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface DrawingLayerProps {
  drawings: Drawing[];
  activeTool: DrawingTool;
  onAddDrawing: (drawing: Drawing) => void;
  onRemoveDrawing: (id: string) => void;
  onUpdateDrawing: (drawing: Drawing) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const DrawingLayer: React.FC<DrawingLayerProps> = ({
  drawings,
  activeTool,
  onAddDrawing,
  onRemoveDrawing,
  onUpdateDrawing,
  containerRef
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');

  const getRelativeCoords = (e: React.MouseEvent | MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === DrawingTool.NONE || activeTool === DrawingTool.ERASER) return;

    const coords = getRelativeCoords(e);
    setIsDrawing(true);

    const newDrawing: Drawing = {
      id: Math.random().toString(36).substr(2, 9),
      type: activeTool,
      points: [coords, coords],
      color: activeTool === DrawingTool.TRENDLINE ? '#3b82f6' : '#ef4444',
      timestamp: Date.now()
    };

    setCurrentDrawing(newDrawing);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !currentDrawing) return;

    const coords = getRelativeCoords(e);
    
    if (activeTool === DrawingTool.TRENDLINE) {
      setCurrentDrawing({
        ...currentDrawing,
        points: [currentDrawing.points[0], coords]
      });
    } else if (activeTool === DrawingTool.HORIZONTAL_LINE) {
      setCurrentDrawing({
        ...currentDrawing,
        points: [{ x: 0, y: coords.y }, { x: 100, y: coords.y }]
      });
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentDrawing) return;

    if (activeTool === DrawingTool.TEXT) {
      setEditingTextId(currentDrawing.id);
      setTextInput('');
      onAddDrawing({ ...currentDrawing, text: '' });
    } else {
      onAddDrawing(currentDrawing);
    }

    setIsDrawing(false);
    setCurrentDrawing(null);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTextId) return;

    const drawing = drawings.find(d => d.id === editingTextId);
    if (drawing) {
      onUpdateDrawing({ ...drawing, text: textInput });
    }
    setEditingTextId(null);
    setTextInput('');
  };

  return (
    <div 
      className="absolute inset-0 z-20 cursor-crosshair overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <svg className="w-full h-full pointer-events-none">
        {/* Render existing drawings */}
        {drawings.map((drawing) => (
          <g key={drawing.id}>
            {drawing.type === DrawingTool.TRENDLINE && drawing.points.length >= 2 && (
              <line
                x1={`${drawing.points[0].x}%`}
                y1={`${drawing.points[0].y}%`}
                x2={`${drawing.points[1].x}%`}
                y2={`${drawing.points[1].y}%`}
                stroke={drawing.color}
                strokeWidth="2"
                className="pointer-events-auto cursor-pointer hover:stroke-white transition-colors"
                onClick={(e) => {
                  if (activeTool === DrawingTool.ERASER) {
                    e.stopPropagation();
                    onRemoveDrawing(drawing.id);
                  }
                }}
              />
            )}
            {drawing.type === DrawingTool.HORIZONTAL_LINE && drawing.points.length >= 2 && (
              <line
                x1="0%"
                y1={`${drawing.points[0].y}%`}
                x2="100%"
                y2={`${drawing.points[0].y}%`}
                stroke={drawing.color}
                strokeWidth="2"
                strokeDasharray="4 4"
                className="pointer-events-auto cursor-pointer hover:stroke-white transition-colors"
                onClick={(e) => {
                  if (activeTool === DrawingTool.ERASER) {
                    e.stopPropagation();
                    onRemoveDrawing(drawing.id);
                  }
                }}
              />
            )}
            {drawing.type === DrawingTool.TEXT && drawing.text && (
              <text
                x={`${drawing.points[0].x}%`}
                y={`${drawing.points[0].y}%`}
                fill="white"
                fontSize="14"
                className="pointer-events-auto cursor-pointer select-none"
                onClick={(e) => {
                  if (activeTool === DrawingTool.ERASER) {
                    e.stopPropagation();
                    onRemoveDrawing(drawing.id);
                  }
                }}
              >
                {drawing.text}
              </text>
            )}
          </g>
        ))}

        {/* Render current drawing preview */}
        {currentDrawing && (
          <g>
            {currentDrawing.type === DrawingTool.TRENDLINE && (
              <line
                x1={`${currentDrawing.points[0].x}%`}
                y1={`${currentDrawing.points[0].y}%`}
                x2={`${currentDrawing.points[1].x}%`}
                y2={`${currentDrawing.points[1].y}%`}
                stroke={currentDrawing.color}
                strokeWidth="2"
                opacity="0.5"
              />
            )}
            {currentDrawing.type === DrawingTool.HORIZONTAL_LINE && (
              <line
                x1="0%"
                y1={`${currentDrawing.points[0].y}%`}
                x2="100%"
                y2={`${currentDrawing.points[0].y}%`}
                stroke={currentDrawing.color}
                strokeWidth="2"
                strokeDasharray="4 4"
                opacity="0.5"
              />
            )}
          </g>
        )}
      </svg>

      {/* Text Input Modal */}
      <AnimatePresence>
        {editingTextId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute z-30 bg-slate-900 border border-slate-700 p-2 rounded shadow-xl"
            style={{
              left: `${drawings.find(d => d.id === editingTextId)?.points[0].x}%`,
              top: `${drawings.find(d => d.id === editingTextId)?.points[0].y}%`,
            }}
          >
            <form onSubmit={handleTextSubmit} className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter text..."
                className="bg-slate-800 text-white px-2 py-1 rounded border border-slate-600 focus:outline-none focus:border-blue-500"
              />
              <button 
                type="submit"
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500 transition-colors"
              >
                Add
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
