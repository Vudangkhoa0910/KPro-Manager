import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { 
  Code, 
  Save, 
  Undo, 
  Redo, 
  FileText,
  Check,
  X,
  Download,
  Upload,
  Search,
  RotateCcw,
  Eye,
  EyeOff,
  Maximize,
  Minimize,
  Settings,
  Map,
  Loader2
} from "lucide-react";
import { useSSH } from "@/contexts/SSHContext";
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  file?: {
    name: string;
    path: string;
    content?: string;
  };
  onClose?: () => void;
}

const CodeEditor = ({ file, onClose }: CodeEditorProps) => {
  const { activeConnection } = useSSH();
  const { toast } = useToast();
  
  const [code, setCode] = useState('');
  const [fileName, setFileName] = useState(file?.name || "new_file.txt");
  const [filePath, setFilePath] = useState(file?.path || "");
  const [saved, setSaved] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [lineNumbers, setLineNumbers] = useState(true);
  const [minimap, setMinimap] = useState(true);
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const editorRef = useRef<any>(null);

  // Load file content when file prop changes
  useEffect(() => {
    if (file && file.path && activeConnection) {
      loadFileContent(file.path);
      setFileName(file.name);
      setFilePath(file.path);
    }
  }, [file, activeConnection]);

  // Load file content from SSH
  const loadFileContent = async (path: string) => {
    if (!activeConnection) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/ssh/read-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          connectionId: activeConnection.id, 
          filePath: path 
        })
      });

      const data = await response.json();
      if (data.success) {
        setCode(data.content);
        setSaved(true);
        toast({
          title: "File Loaded",
          description: `Successfully loaded ${fileName}`,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Load Failed",
        description: `Failed to load file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Save file content to SSH
  const handleSave = async () => {
    if (!activeConnection || !filePath) {
      toast({
        title: "Save Failed",
        description: "No active SSH connection or file path",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ssh/write-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          connectionId: activeConnection.id, 
          filePath: filePath,
          content: code
        })
      });

      const data = await response.json();
      if (data.success) {
        setSaved(true);
        toast({
          title: "File Saved",
          description: `Successfully saved ${fileName}`,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: `Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle text change
  const handleCodeChange = (value: string) => {
    setCode(value);
    setSaved(false);
  };

  // Get language for Monaco editor
  const getLanguage = () => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'js': 'javascript', 'ts': 'typescript', 'tsx': 'typescript', 'jsx': 'javascript',
      'py': 'python', 'html': 'html', 'css': 'css', 'scss': 'scss', 'less': 'less',
      'json': 'json', 'md': 'markdown', 'txt': 'plaintext', 'sh': 'shell',
      'yml': 'yaml', 'yaml': 'yaml', 'xml': 'xml', 'php': 'php', 'cpp': 'cpp',
      'c': 'c', 'java': 'java', 'go': 'go', 'rs': 'rust', 'rb': 'ruby',
      'sql': 'sql', 'dockerfile': 'dockerfile', 'toml': 'toml'
    };
    return langMap[ext || ''] || 'plaintext';
  };

  // Handle Monaco editor mount
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Add custom keybindings safely
    try {
      if (monaco && monaco.KeyMod && monaco.KeyCode) {
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
          handleSave();
        });
      }
    } catch (error) {
      console.warn('Failed to add keybindings:', error);
    }
  };

  // Search functionality for Monaco
  const handleSearch = () => {
    if (editorRef.current) {
      try {
        const action = editorRef.current.getAction('actions.find');
        if (action) {
          action.run();
        }
      } catch (error) {
        console.warn('Search action not available:', error);
      }
    }
  };

  return (
    <Card className={`bg-gradient-card border-accent shadow-card transition-all duration-300 ${
      isMaximized ? 'fixed inset-4 z-50' : ''
    }`}>
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Code className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-foreground text-lg">Code Editor</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {getLanguage().charAt(0).toUpperCase() + getLanguage().slice(1)}
                </Badge>
                {!saved && (
                  <Badge variant="destructive" className="text-xs">
                    Unsaved
                  </Badge>
                )}
                {activeConnection && (
                  <Badge variant="secondary" className="text-xs">
                    {activeConnection.username}@{activeConnection.host}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSearch}
              title="Find (Ctrl+F)"
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Minimap toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMinimap(!minimap)}
              title="Toggle Minimap"
              className={minimap ? "bg-primary/10" : ""}
            >
              <Map className="h-4 w-4" />
            </Button>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
              title="Toggle Theme"
            >
              {theme === 'vs-dark' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>

            {/* Maximize/Minimize */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMaximized(!isMaximized)}
            >
              {isMaximized ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>

            {/* Close */}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Remove old search bar since Monaco has built-in search */}
      </CardHeader>

      <CardContent className="p-0">
        {/* File info bar */}
        <div className="px-4 py-2 bg-muted/20 border-b border-border/30 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>{filePath || 'No file loaded'}</span>
            <span>{code.length} characters • {code.split('\n').length} lines</span>
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="relative">
          <Editor
            height={isMaximized ? "calc(100vh - 300px)" : "500px"}
            language={getLanguage()}
            theme={theme}
            value={code}
            onChange={(value) => handleCodeChange(value || '')}
            onMount={handleEditorDidMount}
            options={{
              selectOnLineNumbers: true,
              roundedSelection: false,
              readOnly: false,
              cursorStyle: 'line',
              automaticLayout: true,
              lineNumbers: lineNumbers ? 'on' : 'off',
              minimap: {
                enabled: minimap,
                scale: 1,
                showSlider: 'always',
                renderCharacters: true,
                maxColumn: 120,
                side: 'right'
              },
              wordWrap: wordWrap ? 'on' : 'off',
              fontSize: 14,
              fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", "Monaco", "Menlo", "Ubuntu Mono", monospace',
              fontLigatures: true,
              tabSize: 2,
              insertSpaces: true,
              detectIndentation: true,
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              renderWhitespace: 'selection',
              renderControlCharacters: true,
              renderLineHighlight: 'all',
              bracketPairColorization: {
                enabled: true
              },
              guides: {
                indentation: true,
                highlightActiveIndentation: true,
                bracketPairs: true,
                bracketPairsHorizontal: true
              },
              suggest: {
                showKeywords: true,
                showSnippets: true
              },
              quickSuggestions: {
                other: true,
                comments: true,
                strings: true
              },
              folding: true,
              foldingStrategy: 'indentation',
              showFoldingControls: 'always',
              contextmenu: true,
              mouseWheelZoom: true,
              multiCursorModifier: 'ctrlCmd',
              accessibilitySupport: 'auto'
            }}
            loading={
              <div className="flex items-center justify-center h-96">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Loading editor...</span>
                </div>
              </div>
            }
          />
        </div>

        {/* Action buttons */}
        <div className="px-4 py-3 bg-muted/10 border-t border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Input
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="h-8 w-48 text-sm"
                placeholder="filename.ext"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadFileContent(filePath)}
                disabled={loading || !filePath}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reload
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  toast({ title: "Copied to clipboard" });
                }}
              >
                <Download className="h-4 w-4 mr-1" />
                Copy
              </Button>

              <Button
                onClick={handleSave}
                disabled={loading || saved || !filePath}
                className="bg-primary hover:bg-primary/90"
              >
                {loading ? (
                  <RotateCcw className="h-4 w-4 mr-1 animate-spin" />
                ) : saved ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                {loading ? 'Saving...' : saved ? 'Saved' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CodeEditor;