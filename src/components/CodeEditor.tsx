import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Code, 
  Save, 
  Undo, 
  Redo, 
  FileText,
  Check
} from "lucide-react";

const CodeEditor = () => {
  const [code, setCode] = useState(`# KPro Remote File Editor
import os
import sys
from pathlib import Path

def main():
    """Main function for KPro application"""
    print("Welcome to KPro - Remote SSH File Manager")
    
    # Configuration
    config = {
        'ssh_host': '192.168.1.100',
        'users': ['aa05', 'tele'],
        'base_path': '/home/{user}/Documents/KhoaDevOps'
    }
    
    return config

if __name__ == "__main__":
    main()`);
  
  const [fileName, setFileName] = useState("main.py");
  const [saved, setSaved] = useState(true);

  const handleSave = () => {
    // Simulate save operation
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card className="bg-gradient-card border-accent shadow-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Code className="h-5 w-5 text-primary" />
            Code Editor
            <Badge variant="outline" className="border-border">
              <FileText className="h-3 w-3 mr-1" />
              {fileName}
            </Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-border">
              <Undo className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" className="border-border">
              <Redo className="h-4 w-4" />
            </Button>
            <Button size="sm" className="bg-gradient-button" onClick={handleSave}>
              {saved ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <Textarea
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setSaved(false);
            }}
            className="min-h-[400px] font-mono text-sm bg-muted/30 border-border resize-none"
            placeholder="Start editing your code here..."
          />
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
            {code.split('\n').length} lines • {code.length} chars
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <div>Python • UTF-8 • LF</div>
          <div className="flex items-center gap-4">
            <span>Ln 1, Col 1</span>
            <Badge variant={saved ? "default" : "destructive"} className="text-xs">
              {saved ? "Saved" : "Unsaved changes"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CodeEditor;