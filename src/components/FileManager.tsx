import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Folder, 
  File, 
  Copy, 
  Move, 
  Trash2, 
  Plus, 
  Download, 
  Upload, 
  RefreshCw,
  User,
  Shield
} from "lucide-react";

interface FileItem {
  name: string;
  type: "file" | "folder";
  size?: string;
  modified: string;
  permissions: string;
}

const mockFiles: FileItem[] = [
  { name: "KhoaDevOps", type: "folder", modified: "2024-01-15", permissions: "drwxr-xr-x" },
  { name: "config.py", type: "file", size: "2.1 KB", modified: "2024-01-14", permissions: "-rw-r--r--" },
  { name: "main.py", type: "file", size: "5.4 KB", modified: "2024-01-13", permissions: "-rw-r--r--" },
  { name: "requirements.txt", type: "file", size: "456 B", modified: "2024-01-12", permissions: "-rw-r--r--" },
];

const FileManager = () => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [activeUser, setActiveUser] = useState<"aa05" | "tele">("aa05");

  const handleFileSelect = (fileName: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileName) 
        ? prev.filter(f => f !== fileName)
        : [...prev, fileName]
    );
  };

  const FileList = ({ user }: { user: "aa05" | "tele" }) => (
    <div className="space-y-2">
      {mockFiles.map((file) => (
        <div
          key={file.name}
          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
            selectedFiles.includes(file.name)
              ? "bg-accent border border-primary/50"
              : "bg-muted/50 hover:bg-muted border border-transparent"
          }`}
          onClick={() => handleFileSelect(file.name)}
        >
          {file.type === "folder" ? (
            <Folder className="h-5 w-5 text-primary" />
          ) : (
            <File className="h-5 w-5 text-muted-foreground" />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="font-medium text-foreground truncate">{file.name}</div>
            <div className="text-sm text-muted-foreground">
              {file.size && `${file.size} • `}{file.modified} • {file.permissions}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Card className="bg-gradient-card border-accent shadow-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Folder className="h-5 w-5 text-primary" />
            File Manager
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-border">
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button size="sm" className="bg-gradient-button">
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeUser} onValueChange={(value) => setActiveUser(value as "aa05" | "tele")}>
          <TabsList className="grid w-full grid-cols-2 bg-muted">
            <TabsTrigger value="aa05" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Shield className="h-4 w-4 mr-2" />
              aa05 (Admin)
            </TabsTrigger>
            <TabsTrigger value="tele" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <User className="h-4 w-4 mr-2" />
              tele (User)
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="aa05" className="mt-4">
            <div className="mb-4 p-3 bg-muted/30 rounded-lg">
              <div className="text-sm font-medium text-foreground">/home/aa05/Documents/KhoaDevOps</div>
              <Badge className="mt-2 bg-primary/20 text-primary">Full Access</Badge>
            </div>
            <FileList user="aa05" />
          </TabsContent>
          
          <TabsContent value="tele" className="mt-4">
            <div className="mb-4 p-3 bg-muted/30 rounded-lg">
              <div className="text-sm font-medium text-foreground">/home/tele/Documents/KhoaDevOps</div>
              <Badge className="mt-2 bg-secondary/60 text-secondary-foreground">Read & Execute</Badge>
            </div>
            <FileList user="tele" />
          </TabsContent>
        </Tabs>

        {selectedFiles.length > 0 && (
          <div className="mt-4 p-4 bg-accent/20 rounded-lg border border-accent">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">
                {selectedFiles.length} item(s) selected
              </span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setSelectedFiles([])}
                className="border-border"
              >
                Clear
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" className="bg-gradient-button">
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
              <Button size="sm" variant="outline" className="border-border">
                <Move className="h-4 w-4 mr-1" />
                Move
              </Button>
              <Button size="sm" variant="outline" className="border-border">
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <Button size="sm" variant="destructive">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileManager;