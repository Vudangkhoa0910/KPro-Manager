import React, { useState, useCallback, useEffect } from 'react';
import DraggableWindow, { WindowState } from '@/components/DraggableWindow';
import TopTabBar from '@/components/TopTabBar';
import ConnectionPanel from '@/components/ConnectionPanel';
import FileManager from '@/components/FileManager';
import CodeEditor from '@/components/CodeEditor';
import Terminal from '@/components/Terminal';
import TaskPanel from '@/components/TaskPanel';
import { Monitor, FolderOpen, FileEdit, Terminal as TerminalIcon, CheckSquare } from 'lucide-react';

interface WindowManagerProps {
  onOpenWindow?: (type: string, title: string) => void;
  initialWindows?: WindowState[];
}

const WindowManager: React.FC<WindowManagerProps> = ({ 
  onOpenWindow, 
  initialWindows = [] 
}) => {
  const [windows, setWindows] = useState<WindowState[]>(initialWindows);
  const [nextZIndex, setNextZIndex] = useState(1000);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);

  // Window creation function - allow multiple windows of same type
  const openWindow = useCallback((
    type: string, 
    title: string, 
    component: React.ComponentType<any>, 
    icon: React.ComponentType<{ className?: string }>,
    props: any = {},
    allowMultiple: boolean = false
  ) => {
    console.log(`WindowManager: Creating ${type} window - ${title}`);
    
    // Check if window already exists (only for single-instance types)
    if (!allowMultiple) {
      const existingWindow = windows.find(w => w.type === type && !w.props?.filePath);
      if (existingWindow) {
        console.log(`WindowManager: Window ${type} already exists, focusing...`);
        focusWindow(existingWindow.id);
        return existingWindow;
      }
    }

    // For editors with same file, focus existing one
    if (type === 'editor' && props?.filePath) {
      const existingEditor = windows.find(w => w.type === 'editor' && w.props?.filePath === props.filePath);
      if (existingEditor) {
        console.log(`WindowManager: Editor for ${props.filePath} already exists, focusing...`);
        focusWindow(existingEditor.id);
        return existingEditor;
      }
    }

    // Default positioning and sizing
    let x = 300; // Account for sidebar
    let y = 100;
    let width = 800;
    let height = 600;
    
    // Window type specific sizing - LARGER FILE MANAGER
    switch (type) {
      case 'editor':
        width = 1000;
        height = 700;
        break;
      case 'filemanager':
        width = 950;
        height = 750;
        break;
      case 'terminal':
        width = 850;
        height = 550;
        break;
      case 'connection':
        width = 450;
        height = 400;
        break;
      case 'tasks':
        width = 350;
        height = 500;
        break;
    }
    
    // Smart positioning - auto-arrange windows
    if (windows.length > 0) {
      const cols = Math.ceil(Math.sqrt(windows.length + 1));
      const rowIndex = Math.floor(windows.length / cols);
      const colIndex = windows.length % cols;
      
      x = 300 + (colIndex * Math.min(400, width * 0.6));
      y = 100 + (rowIndex * 60);
      
      // Prevent overflow off screen
      const maxX = window.innerWidth - width - 50;
      const maxY = window.innerHeight - height - 100;
      x = Math.min(x, maxX);
      y = Math.min(y, maxY);
    }

    const newWindow: WindowState = {
      id: `${type}-${Date.now()}`,
      type,
      title,
      component,
      icon,
      x,
      y,
      width,
      height,
      zIndex: nextZIndex,
      isMinimized: false,
      isMaximized: false,
      props
    };

    console.log(`WindowManager: Created window:`, newWindow);
    setWindows(prev => [...prev, newWindow]);
    setNextZIndex(prev => prev + 1);
    setActiveWindowId(newWindow.id);
    
    return newWindow;
  }, [windows, nextZIndex]);

  // Window management functions
  const updateWindow = useCallback((id: string, updates: Partial<WindowState>) => {
    setWindows(prev => 
      prev.map(window => 
        window.id === id ? { ...window, ...updates } : window
      )
    );
  }, []);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => {
      const newWindows = prev.filter(window => window.id !== id);
      // Update active window if the closed window was active
      if (activeWindowId === id && newWindows.length > 0) {
        const topWindow = newWindows.reduce((top, win) => win.zIndex > top.zIndex ? win : top);
        setActiveWindowId(topWindow.id);
      } else if (newWindows.length === 0) {
        setActiveWindowId(null);
      }
      return newWindows;
    });
  }, [activeWindowId]);

  const focusWindow = useCallback((id: string) => {
    setWindows(prev => {
      const window = prev.find(w => w.id === id);
      if (!window) return prev;
      
      const newZIndex = Math.max(...prev.map(w => w.zIndex)) + 1;
      setActiveWindowId(id);
      
      return prev.map(w => 
        w.id === id 
          ? { ...w, zIndex: newZIndex, isMinimized: false }
          : w
      );
    });
  }, []);

  // Individual window opening functions - allow multiple terminals/editors
  const openConnectionWindow = useCallback(() => {
    return openWindow('connection', 'SSH Connection', ConnectionPanel, Monitor, {}, false);
  }, [openWindow]);
  
  const openFileManagerWindow = useCallback(() => {
    return openWindow('filemanager', 'File Manager', FileManager, FolderOpen, {}, false);
  }, [openWindow]);
  
  const openCodeEditorWindow = useCallback(() => {
    const timestamp = Date.now();
    return openWindow('editor', `Code Editor ${timestamp}`, CodeEditor, FileEdit, {}, true);
  }, [openWindow]);
  
  const openTerminalWindow = useCallback(() => {
    const timestamp = Date.now();
    return openWindow('terminal', `Terminal ${timestamp}`, Terminal, TerminalIcon, {}, true);
  }, [openWindow]);
  
  const openTaskPanelWindow = useCallback(() => {
    return openWindow('tasks', 'Task Panel', TaskPanel, CheckSquare, {}, false);
  }, [openWindow]);

  // Handle opening files in editor
  const handleOpenInEditor = useCallback((filePath: string, content?: string) => {
    const fileName = filePath.split('/').pop() || 'Untitled';
    return openWindow('editor', `${fileName} - Editor`, CodeEditor, FileEdit, {
      filePath,
      initialContent: content
    }, true);
  }, [openWindow]);

  // Expose window management functions globally
  useEffect(() => {
    console.log('Setting up global WindowManager functions');
    (window as any).kproWindowManager = {
      openConnection: openConnectionWindow,
      openFileManager: openFileManagerWindow,
      openCodeEditor: openCodeEditorWindow,
      openTerminal: openTerminalWindow,
      openTasks: openTaskPanelWindow,
      openFileInEditor: handleOpenInEditor,
    };
    console.log('WindowManager functions available:', Object.keys((window as any).kproWindowManager || {}));
  }, [
    openConnectionWindow,
    openFileManagerWindow, 
    openCodeEditorWindow,
    openTerminalWindow,
    openTaskPanelWindow,
    handleOpenInEditor
  ]);

  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col">
      {/* Top Tab Bar */}
      <div className="pointer-events-auto">
        <TopTabBar
          windows={windows}
          activeWindowId={activeWindowId}
          onFocusWindow={focusWindow}
          onCloseWindow={closeWindow}
          onMinimizeWindow={(id) => updateWindow(id, { isMinimized: true })}
        />
      </div>
      
      {/* Windows Container */}
      <div className="flex-1 relative">
        {windows.map(window => (
          <DraggableWindow
            key={window.id}
            window={window}
            onUpdate={updateWindow}
            onClose={closeWindow}
            onFocus={focusWindow}
          />
        ))}
      </div>
    </div>
  );
};

export default WindowManager;