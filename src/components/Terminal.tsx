import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSSH } from '@/contexts/SSHContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Terminal as TerminalIcon } from 'lucide-react';

interface TerminalOutput {
  id: string;
  command: string;
  output: string;
  timestamp: Date;
  cwd: string;
  user: string;
  host: string;
}

const Terminal = () => {
  const { activeConnection } = useSSH();
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [outputs, setOutputs] = useState<TerminalOutput[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentWorkingDir, setCurrentWorkingDir] = useState('~');
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [outputs]);

  // Focus input when terminal is clicked
  const focusInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Execute command via SSH
  const executeCommand = useCallback(async (cmd: string) => {
    if (!activeConnection?.isConnected || !cmd.trim()) return;

    const trimmedCmd = cmd.trim();
    setIsExecuting(true);
    
    // Add command to history
    setCommandHistory(prev => {
      const newHistory = [trimmedCmd, ...prev.filter(h => h !== trimmedCmd)];
      return newHistory.slice(0, 50); // Keep last 50 commands
    });
    setHistoryIndex(-1);

    try {
      const response = await fetch('/api/ssh/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: activeConnection.id,
          command: trimmedCmd
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Update current working directory if command was 'cd' or 'pwd'
        if (trimmedCmd.startsWith('cd ') || trimmedCmd === 'pwd') {
          const pwdResponse = await fetch('/api/ssh/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              connectionId: activeConnection.id,
              command: 'pwd'
            })
          });
          const pwdData = await pwdResponse.json();
          if (pwdData.success) {
            setCurrentWorkingDir(pwdData.output.trim());
          }
        }

        // Add output to terminal
        const newOutput: TerminalOutput = {
          id: Date.now().toString(),
          command: trimmedCmd,
          output: data.output || '',
          timestamp: new Date(),
          cwd: currentWorkingDir,
          user: activeConnection.username,
          host: activeConnection.host
        };

        setOutputs(prev => [...prev, newOutput]);
      } else {
        toast({
          title: "Command Failed",
          description: data.error || "Failed to execute command",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Execute command error:', error);
      toast({
        title: "Connection Error",
        description: "Failed to execute command. Check your connection.",
        variant: "destructive"
      });
    } finally {
      setIsExecuting(false);
    }
  }, [activeConnection, currentWorkingDir, toast]);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (currentCommand.trim() && !isExecuting) {
      executeCommand(currentCommand);
      setCurrentCommand('');
    }
  }, [currentCommand, isExecuting, executeCommand]);

  // Handle keyboard shortcuts with tab completion
  const handleKeyDown = useCallback(async (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          setCurrentCommand(commandHistory[newIndex] || '');
        }
        break;
      
      case 'ArrowDown':
        e.preventDefault();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setCurrentCommand(commandHistory[newIndex] || '');
        } else if (historyIndex === 0) {
          setHistoryIndex(-1);
          setCurrentCommand('');
        }
        break;
      
      case 'Tab':
        e.preventDefault();
        if (currentCommand.trim() && activeConnection?.isConnected) {
          // Simple tab completion for directories
          try {
            const words = currentCommand.split(' ');
            const lastWord = words[words.length - 1];
            
            if (words[0] === 'cd' && lastWord) {
              // Tab completion for cd command
              const response = await fetch('/api/ssh/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  connectionId: activeConnection.id,
                  command: `ls -d ${lastWord}*/ 2>/dev/null | head -5`
                })
              });
              
              const data = await response.json();
              if (data.success && data.output.trim()) {
                const matches = data.output.trim().split('\n').filter(Boolean);
                if (matches.length === 1) {
                  // Auto-complete if only one match
                  const completed = matches[0].replace(/\/$/, '');
                  words[words.length - 1] = completed;
                  setCurrentCommand(words.join(' '));
                } else if (matches.length > 1) {
                  // Show matches
                  toast({
                    title: 'Completions',
                    description: matches.join(', '),
                  });
                }
              }
            }
          } catch (error) {
            console.error('Tab completion error:', error);
          }
        }
        break;
      
      case 'Escape':
        setCurrentCommand('');
        setHistoryIndex(-1);
        break;
    }
  }, [historyIndex, commandHistory, currentCommand, activeConnection, toast]);

  // Clear terminal
  const clearTerminal = useCallback(() => {
    setOutputs([]);
  }, []);

  // Show connection required state
  if (!activeConnection?.isConnected) {
    return (
      <div className="h-full flex flex-col bg-black text-green-400 font-mono">
        <div className="flex items-center justify-center flex-1 p-8">
          <div className="text-center">
            <TerminalIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">No SSH connection available</p>
            <p className="text-sm text-gray-600 mt-2">Connect to a server to use the terminal</p>
          </div>
        </div>
      </div>
    );
  }

  const getPrompt = () => {
    const shortPath = currentWorkingDir === `/home/${activeConnection.username}` ? '~' : currentWorkingDir.split('/').pop() || currentWorkingDir;
    return `${activeConnection.username}@${activeConnection.host}:${shortPath}$ `;
  };

  return (
    <div className="h-full flex flex-col bg-black text-green-400 font-mono" onClick={focusInput}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Terminal</span>
          <span className="text-xs text-gray-500">
            {activeConnection.username}@{activeConnection.host}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearTerminal}
            className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-gray-300"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div 
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-4 bg-black cursor-text"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Welcome message */}
        {outputs.length === 0 && (
          <div className="text-green-500 mb-4">
            <p>Welcome to KPro Terminal</p>
            <p className="text-sm text-gray-500">Connected to {activeConnection.username}@{activeConnection.host}</p>
            <p className="text-sm text-gray-600">Type commands and press Enter to execute</p>
          </div>
        )}

        {/* Command outputs */}
        {outputs.map((output) => (
          <div key={output.id} className="mb-2">
            {/* Command prompt and input */}
            <div className="flex items-start">
              <span className="text-green-400 select-none">
                {output.user}@{output.host}:{output.cwd === `/home/${output.user}` ? '~' : output.cwd.split('/').pop()}$
              </span>
              <span className="ml-2 text-white">{output.command}</span>
            </div>
            
            {/* Command output */}
            {output.output && (
              <pre className="text-gray-300 whitespace-pre-wrap break-words mt-1 ml-4 text-sm leading-relaxed">
                {output.output}
              </pre>
            )}
          </div>
        ))}

        {/* Current command input */}
        <form onSubmit={handleSubmit} className="flex items-center">
          <span className="text-green-400 select-none">
            {getPrompt()}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isExecuting}
            className="flex-1 ml-2 bg-transparent text-white outline-none caret-green-400"
            placeholder={isExecuting ? "Executing..." : ""}
            autoFocus
          />
          {isExecuting && (
            <Loader2 className="h-4 w-4 animate-spin text-yellow-400 ml-2" />
          )}
        </form>
      </div>
    </div>
  );
};

export default Terminal;
