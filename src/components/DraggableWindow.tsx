import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Minus, 
  Square, 
  GripHorizontal
} from 'lucide-react';

export interface WindowState {
  id: string;
  type: string;
  title: string;
  component: React.ComponentType<any>;
  icon: React.ComponentType<any>;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  props?: any;
}

interface DraggableWindowProps {
  window: WindowState;
  onUpdate: (id: string, updates: Partial<WindowState>) => void;
  onClose: (id: string) => void;
  onFocus: (id: string) => void;
}

const DraggableWindow: React.FC<DraggableWindowProps> = ({ 
  window, 
  onUpdate, 
  onClose, 
  onFocus 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (window.isMaximized) return; // Don't drag maximized windows
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - window.x,
      y: e.clientY - window.y
    });
    onFocus(window.id);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !window.isMaximized) {
        const newX = Math.max(0, Math.min(e.clientX - dragStart.x, globalThis.innerWidth - window.width));
        const newY = Math.max(0, Math.min(e.clientY - dragStart.y, globalThis.innerHeight - window.height));
        
        onUpdate(window.id, { x: newX, y: newY });
      }
      
      if (isResizing) {
        const newWidth = Math.max(300, e.clientX - window.x);
        const newHeight = Math.max(200, e.clientY - window.y);
        
        onUpdate(window.id, { width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, window, onUpdate]);

  const Component = window.component;

  return (
    <div
      ref={windowRef}
      className={`
        absolute pointer-events-auto select-none
        ${window.isMinimized ? 'hidden' : 'block'}
        ${window.isMaximized ? 'inset-4' : ''}
        transition-all duration-300 ease-out
        ${isDragging ? 'cursor-move scale-[1.02] shadow-2xl' : 'cursor-default shadow-xl'}
        ${isDragging ? 'rotate-[0.5deg]' : 'rotate-0'}
      `}
      style={{
        left: window.isMaximized ? undefined : window.x,
        top: window.isMaximized ? undefined : window.y,
        width: window.isMaximized ? undefined : window.width,
        height: window.isMaximized ? undefined : window.height,
        zIndex: window.zIndex,
      }}
      onMouseDown={(e) => {
        console.log('DraggableWindow clicked:', window.title);
        onFocus(window.id);
      }}
      onClick={(e) => {
        console.log('DraggableWindow onClick:', window.title);
        e.stopPropagation();
      }}
    >
      <Card className="h-full bg-gradient-to-b from-slate-900/95 via-slate-800/90 to-slate-900/95 border-slate-600/30 backdrop-blur-xl">
        {/* Window Header */}
        <CardHeader 
          className={`
            pb-2 pt-2 px-4 border-b border-slate-600/30 bg-slate-800/50
            ${window.isMaximized ? 'cursor-default' : 'cursor-move'}
          `}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <window.icon className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-white truncate">
                {window.title}
              </span>
              <Badge variant="outline" className="text-xs border-blue-400/30 text-blue-300">
                Active
              </Badge>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-slate-700/50 transition-colors"
                onClick={() => onUpdate(window.id, { isMinimized: true })}
              >
                <Minus className="h-3 w-3 text-slate-400" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-slate-700/50 transition-colors"
                onClick={() => onUpdate(window.id, { isMaximized: !window.isMaximized })}
              >
                <Square className="h-3 w-3 text-slate-400" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-red-600/50 transition-colors"
                onClick={() => onClose(window.id)}
              >
                <X className="h-3 w-3 text-red-400" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Window Content */}
        <CardContent className="p-0 flex flex-col overflow-hidden bg-slate-800/20" style={{ height: `calc(100% - 60px)` }}>
          <div className="flex-1 overflow-auto pointer-events-auto">
            {Component ? (
              <Component {...window.props} />
            ) : (
              <div className="p-4 text-white">Component not found</div>
            )}
          </div>
        </CardContent>

        {/* Resize Handle */}
        {!window.isMaximized && (
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-blue-500/20 hover:bg-blue-500/40 transition-colors rounded-tl-md"
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsResizing(true);
              setDragStart({ x: e.clientX, y: e.clientY });
              onFocus(window.id);
            }}
          >
            <GripHorizontal className="h-3 w-3 rotate-45 absolute bottom-0.5 right-0.5 text-blue-400" />
          </div>
        )}
      </Card>
    </div>
  );
};

export default DraggableWindow;
