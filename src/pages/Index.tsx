import { useState } from "react";
import KProLogo from "@/components/KProLogo";
import ConnectionPanel from "@/components/ConnectionPanel";
import FileManager from "@/components/FileManager";
import CodeEditor from "@/components/CodeEditor";
import Terminal from "@/components/Terminal";
import TaskPanel from "@/components/TaskPanel";

interface ConnectionConfig {
  host: string;
  user: string;
  password: string;
  port: number;
}

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = (config: ConnectionConfig) => {
    // Simulate connection
    setIsConnected(true);
    console.log("Connecting to:", config);
  };

  return (
    <div className="min-h-screen bg-gradient-primary">
      {/* Header */}
      <header className="border-b border-accent/20 bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <KProLogo size="lg" />
            <div className="text-right">
              <h1 className="text-xl font-bold text-foreground">KPro Remote Manager</h1>
              <p className="text-sm text-muted-foreground">SSH File Management & Development Tool</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Connection Panel */}
          <div className="lg:col-span-1">
            <ConnectionPanel onConnect={handleConnect} isConnected={isConnected} />
          </div>

          {/* File Manager */}
          <div className="lg:col-span-2">
            <FileManager />
          </div>

          {/* Code Editor */}
          <div className="lg:col-span-2">
            <CodeEditor />
          </div>

          {/* Terminal */}
          <div className="lg:col-span-1">
            <Terminal />
          </div>

          {/* Task Panel */}
          <div className="lg:col-span-3">
            <TaskPanel />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-accent/20 bg-card/50 backdrop-blur-sm mt-12">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <KProLogo size="sm" />
              <span>© 2024 KPro Remote Manager</span>
            </div>
            <div>
              Built with React & TypeScript
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
