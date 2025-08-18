import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Terminal as TerminalIcon, 
  Send, 
  Trash, 
  User,
  Server
} from "lucide-react";

interface TerminalLine {
  type: "command" | "output" | "error";
  content: string;
  timestamp: string;
}

const Terminal = () => {
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<TerminalLine[]>([
    {
      type: "output",
      content: "Welcome to KPro SSH Terminal",
      timestamp: new Date().toLocaleTimeString()
    },
    {
      type: "output", 
      content: "Connected to 192.168.1.100 as aa05",
      timestamp: new Date().toLocaleTimeString()
    },
    {
      type: "command",
      content: "ls -la /home/aa05/Documents/KhoaDevOps",
      timestamp: new Date().toLocaleTimeString()
    },
    {
      type: "output",
      content: `drwxr-xr-x 5 aa05 aa05 4096 Jan 15 10:30 .
drwxr-xr-x 3 aa05 aa05 4096 Jan 15 10:25 ..
-rw-r--r-- 1 aa05 aa05 2156 Jan 14 16:45 config.py
-rw-r--r-- 1 aa05 aa05 5432 Jan 13 14:20 main.py
-rw-r--r-- 1 aa05 aa05  456 Jan 12 09:15 requirements.txt`,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  
  const terminalRef = useRef<HTMLDivElement>(null);

  const executeCommand = () => {
    if (!command.trim()) return;

    const newCommand: TerminalLine = {
      type: "command",
      content: command,
      timestamp: new Date().toLocaleTimeString()
    };

    // Simulate command execution
    let output: TerminalLine;
    if (command.includes("ls")) {
      output = {
        type: "output",
        content: "config.py  main.py  requirements.txt  utils/",
        timestamp: new Date().toLocaleTimeString()
      };
    } else if (command.includes("pwd")) {
      output = {
        type: "output",
        content: "/home/aa05/Documents/KhoaDevOps",
        timestamp: new Date().toLocaleTimeString()
      };
    } else if (command.includes("whoami")) {
      output = {
        type: "output",
        content: "aa05",
        timestamp: new Date().toLocaleTimeString()
      };
    } else {
      output = {
        type: "output",
        content: `Command executed: ${command}`,
        timestamp: new Date().toLocaleTimeString()
      };
    }

    setHistory(prev => [...prev, newCommand, output]);
    setCommand("");
  };

  const clearTerminal = () => {
    setHistory([]);
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  return (
    <Card className="bg-gradient-card border-accent shadow-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <TerminalIcon className="h-5 w-5 text-primary" />
            SSH Terminal
            <Badge className="bg-primary/20 text-primary">
              <Server className="h-3 w-3 mr-1" />
              aa05@remote
            </Badge>
          </CardTitle>
          <Button size="sm" variant="outline" onClick={clearTerminal} className="border-border">
            <Trash className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          ref={terminalRef}
          className="bg-background/50 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm border border-border"
        >
          {history.map((line, index) => (
            <div key={index} className="mb-1">
              {line.type === "command" && (
                <div className="flex items-center gap-2">
                  <span className="text-primary">aa05@remote:~$</span>
                  <span className="text-foreground">{line.content}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{line.timestamp}</span>
                </div>
              )}
              {line.type === "output" && (
                <div className="text-muted-foreground whitespace-pre-wrap">{line.content}</div>
              )}
              {line.type === "error" && (
                <div className="text-destructive whitespace-pre-wrap">{line.content}</div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-primary font-mono">
            <User className="h-4 w-4" />
            aa05@remote:~$
          </div>
          <Input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && executeCommand()}
            placeholder="Enter command..."
            className="font-mono bg-muted border-border"
          />
          <Button size="sm" onClick={executeCommand} className="bg-gradient-button">
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-2 flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setCommand("ls -la")} className="border-border">
            ls -la
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCommand("pwd")} className="border-border">
            pwd
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCommand("whoami")} className="border-border">
            whoami
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Terminal;