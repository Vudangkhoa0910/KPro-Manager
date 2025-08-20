import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { 
  Wifi,
  WifiOff,
  FolderOpen,
  File,
  Edit3,
  Eye,
  Download,
  Loader2,
  X,
  Maximize2,
  Copy
} from "lucide-react";
import { useSSH } from "@/contexts/SSHContext";
import FileTree from "./FileTree";

const FileManager = ({ onOpenInEditor }: { onOpenInEditor?: (file: any) => void }) => {
  const { activeConnection } = useSSH();
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [previewMaximized, setPreviewMaximized] = useState(false);
  const { toast } = useToast();

  // Handle file selection from tree
  const handleFileSelect = (file: any) => {
    setSelectedFile(file);
    setShowPreview(false);
    setPreviewContent('');
    
    if (file.type === 'file') {
      toast({
        title: "File Selected",
        description: `Selected: ${file.name}`,
      });
    }
  };

  // Load file content for preview or editing
  const loadFileContent = async (filePath: string) => {
    if (!activeConnection?.isConnected) return null;
    
    setIsLoadingFile(true);
    try {
      const response = await fetch('/api/ssh/read-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: activeConnection.id,
          filePath: filePath
        })
      });

      const data = await response.json();
      if (data.success) {
        return data.content;
      } else {
        throw new Error(data.error || 'Failed to read file');
      }
    } catch (error) {
      console.error('Load file error:', error);
      toast({
        title: "Error",
        description: `Failed to load file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoadingFile(false);
    }
  };

  // Handle preview button
  const handlePreview = async () => {
    if (!selectedFile) return;
    
    const content = await loadFileContent(selectedFile.path);
    if (content !== null) {
      setPreviewContent(content);
      setShowPreview(true);
      toast({
        title: "File Preview",
        description: `Loaded ${selectedFile.name} for preview`,
        className: "border-blue-400/50 bg-blue-950/90 text-blue-100",
      });
    }
  };

  // Handle preview close
  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewContent('');
    setPreviewMaximized(false);
    toast({
      title: "Preview Closed",
      description: "File preview has been closed",
    });
  };

  // Copy preview content to clipboard
  const handleCopyPreview = async () => {
    try {
      await navigator.clipboard.writeText(previewContent);
      toast({
        title: "Content Copied",
        description: "File content copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy content to clipboard",
        variant: "destructive"
      });
    }
  };

  // Get file icon based on extension
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconMap: Record<string, string> = {
      'js': '📄', 'ts': '📘', 'tsx': '⚛️', 'jsx': '⚛️',
      'py': '🐍', 'html': '🌐', 'css': '🎨', 'scss': '🎨',
      'json': '📋', 'md': '📝', 'txt': '📄', 'sh': '⚡',
      'yml': '📝', 'yaml': '📝', 'xml': '📋', 'php': '🐘',
      'java': '☕', 'cpp': '⚙️', 'c': '⚙️', 'go': '🐹',
      'rs': '🦀', 'rb': '💎', 'sql': '🗃️'
    };
    return iconMap[ext || ''] || '📄';
  };

  // Handle open in editor button
  const handleOpenInEditor = async () => {
    if (!selectedFile) return;
    
    // Open via global window manager
    if (typeof window !== 'undefined') {
      const windowManager = (window as any).kproWindowManager;
      if (windowManager?.openFileInEditor) {
        const content = await loadFileContent(selectedFile.path);
        windowManager.openFileInEditor(selectedFile.path, content);
        toast({
          title: "Opening in Editor",
          description: `${selectedFile.name} opened in Code Editor`,
          className: "border-green-400/50 bg-green-950/90 text-green-100",
        });
        return;
      }
    }
    
    // Fallback to callback
    onOpenInEditor?.(selectedFile);
  };

  // Show connection required state
  if (!activeConnection) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <WifiOff className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No SSH Connection</h3>
        <p className="text-gray-500 text-center">
          Please establish an SSH connection to access file management features.
        </p>
      </div>
    );
  }

  if (!activeConnection.isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <WifiOff className="h-16 w-16 text-orange-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Connection Disconnected</h3>
        <p className="text-gray-500 text-center">
          The SSH connection has been lost. Please reconnect to access files.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header with better styling */}
      <div className="flex items-center justify-between p-4 border-b border-blue-400/20 bg-slate-800/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <FolderOpen className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">File Explorer</h2>
          <Badge variant="outline" className="border-green-400/50 text-green-300 bg-green-400/5">
            <Wifi className="h-3 w-3 mr-1" />
            {activeConnection.username}@{activeConnection.host}
          </Badge>
        </div>
      </div>

      {/* File Tree with improved styling */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full bg-slate-800/30 rounded-lg border border-slate-700/50 backdrop-blur-sm">
          <FileTree
            connectionId={activeConnection.id}
            isConnected={activeConnection.isConnected}
            onFileSelect={handleFileSelect}
            className="h-full"
          />
        </div>
      </div>

      {/* Selected file info with enhanced design */}
      {selectedFile && (
        <div className="p-4 border-t border-blue-400/20 bg-slate-800/30 backdrop-blur-sm">
          <div className="bg-gradient-to-r from-blue-600/10 to-green-600/10 rounded-lg border border-blue-400/20 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-400/30">
                  <span className="text-2xl">{getFileIcon(selectedFile.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-lg text-white mb-2">{selectedFile.name}</div>
                  <div className="text-sm text-slate-300 space-y-1">
                    <div className="truncate" title={selectedFile.path}>
                      <span className="text-blue-400">📁 Path:</span> {selectedFile.path}
                    </div>
                    <div className="flex items-center gap-6 text-xs">
                      <span><span className="text-green-400">🔒 Permissions:</span> {selectedFile.permissions}</span>
                      {selectedFile.size && <span><span className="text-yellow-400">📊 Size:</span> {selectedFile.size} bytes</span>}
                      {selectedFile.modified && <span><span className="text-purple-400">🕒 Modified:</span> {selectedFile.modified}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced action buttons */}
              {selectedFile.type === 'file' && (
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500 transition-all"
                    onClick={handlePreview}
                    disabled={isLoadingFile}
                  >
                    {isLoadingFile ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4 mr-2" />
                    )}
                    Preview
                  </Button>
                  
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg border border-green-500/50"
                    onClick={handleOpenInEditor}
                    disabled={isLoadingFile}
                  >
                    {isLoadingFile ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Edit3 className="h-4 w-4 mr-2" />
                    )}
                    Open in Editor
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced File Preview Panel */}
      {showPreview && selectedFile && previewContent && (
        <div className={`border-t border-blue-400/20 bg-slate-800/30 backdrop-blur-sm transition-all duration-300 ${
          previewMaximized ? 'fixed inset-4 z-50 bg-slate-900/95' : 'p-4'
        }`}>
          <div className={`bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg border border-slate-600/50 ${
            previewMaximized ? 'h-full flex flex-col' : 'max-h-96 overflow-auto'
          }`}>
            {/* Preview Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-600/30">
              <div className="flex items-center gap-3">
                <span className="text-xl">{getFileIcon(selectedFile.name)}</span>
                <div>
                  <h3 className="text-lg font-semibold text-white">Preview: {selectedFile.name}</h3>
                  <p className="text-sm text-slate-400">{selectedFile.path}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Copy content button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyPreview}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
                  title="Copy to clipboard"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                
                {/* Maximize/minimize button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPreviewMaximized(!previewMaximized)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
                  title={previewMaximized ? "Minimize" : "Maximize"}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                
                {/* Close button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClosePreview}
                  className="border-red-600/50 text-red-300 hover:bg-red-700/30 hover:border-red-500"
                  title="Close preview"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Preview Content */}
            <div className={`${previewMaximized ? 'flex-1 overflow-auto' : ''}`}>
              <pre className={`text-sm text-slate-200 whitespace-pre-wrap font-mono bg-black/30 rounded border border-slate-600/30 overflow-auto ${
                previewMaximized ? 'm-4 h-full' : 'p-3 m-4'
              }`}>
                {previewContent}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManager;
