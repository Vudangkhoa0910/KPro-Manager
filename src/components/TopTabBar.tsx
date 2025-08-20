import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Minus, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopTabBarProps {
  windows: Array<{
    id: string;
    type: string;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    zIndex: number;
    isMinimized: boolean;
    isMaximized: boolean;
  }>;
  activeWindowId?: string;
  onFocusWindow: (id: string) => void;
  onCloseWindow: (id: string) => void;
  onMinimizeWindow: (id: string) => void;
}

const TopTabBar: React.FC<TopTabBarProps> = ({
  windows,
  activeWindowId,
  onFocusWindow,
  onCloseWindow,
  onMinimizeWindow
}) => {
  if (windows.length === 0) {
    return (
      <div className="h-12 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 flex items-center px-4">
        <div className="text-slate-400 text-sm">No windows open</div>
      </div>
    );
  }

  const activeWindow = windows.find(w => w.id === activeWindowId);
  const sortedWindows = [...windows].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="h-12 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 flex items-center overflow-x-auto">
      <div className="flex items-center gap-1 px-2 min-w-max">
        {sortedWindows.map((window) => {
          const Icon = window.icon;
          const isActive = window.id === activeWindowId;
          
          return (
            <div
              key={window.id}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-t-lg border-b-2 transition-all duration-200 group cursor-pointer min-w-[180px] max-w-[250px]",
                isActive 
                  ? "bg-slate-700/50 border-blue-400 text-white" 
                  : "bg-slate-800/30 border-transparent text-slate-300 hover:bg-slate-700/30 hover:text-white"
              )}
              onClick={() => onFocusWindow(window.id)}
            >
              {/* Window Icon */}
              <Icon className={cn(
                "h-4 w-4 flex-shrink-0",
                isActive ? "text-blue-400" : "text-slate-400"
              )} />
              
              {/* Window Title */}
              <span className="truncate text-sm font-medium flex-1">
                {window.title}
              </span>
              
              {/* Window State Badges */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {window.isMinimized && (
                  <Badge variant="outline" className="text-xs border-yellow-400/50 text-yellow-400 h-5">
                    Min
                  </Badge>
                )}
                {window.isMaximized && (
                  <Badge variant="outline" className="text-xs border-green-400/50 text-green-400 h-5">
                    Max
                  </Badge>
                )}
              </div>
              
              {/* Tab Controls */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-slate-600/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMinimizeWindow(window.id);
                  }}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-red-600/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseWindow(window.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Active Window Info */}
      {activeWindow && (
        <div className="ml-auto px-4 flex items-center gap-2 text-xs text-slate-400">
          <span>Active:</span>
          <Badge variant="outline" className="border-blue-400/50 text-blue-400">
            {activeWindow.type}
          </Badge>
        </div>
      )}
    </div>
  );
};

export default TopTabBar;
