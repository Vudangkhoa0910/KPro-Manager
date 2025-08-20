import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import WindowManager from "@/components/WindowManager";
import { SSHConnection } from "@/services/sshService";
import { SSHProvider } from "@/contexts/SSHContext";

const Index = () => {
  const [currentConnection, setCurrentConnection] = useState<SSHConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("connection");

  const handleConnect = (connection: SSHConnection) => {
    setCurrentConnection(connection);
    setIsConnected(true);
  };

  // Handle window creation from Sidebar
  const handleOpenWindow = (type: string, title: string) => {
    console.log(`Opening window: ${type} - ${title}`);
    
    // Wait a moment for WindowManager to initialize global functions
    setTimeout(() => {
      const windowManager = (window as any).kproWindowManager;
      
      if (windowManager) {
        switch (type) {
          case 'connection':
            windowManager.openConnection();
            break;
          case 'filemanager':
            windowManager.openFileManager();
            break;
          case 'editor':
            windowManager.openCodeEditor();
            break;
          case 'terminal':
            windowManager.openTerminal();
            break;
          case 'tasks':
            windowManager.openTasks();
            break;
          default:
            console.warn(`Unknown window type: ${type}`);
        }
      } else {
        console.error('WindowManager not available yet. Please try again.');
      }
    }, 100);
  };

  return (
    <SSHProvider>
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-gray-100 to-white">
        {/* Sidebar - Now absolute positioned */}
        <Sidebar 
          activeSection={activeSection}
          onOpenWindow={handleOpenWindow}
        />
        
        {/* Main Content Area with WindowManager */}
        <div className="flex-1 relative ml-80">          
          {/* WindowManager handles all draggable windows and top tab bar */}
          <WindowManager />
        </div>
      </div>
    </SSHProvider>
  );
};

export default Index;
