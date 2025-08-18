import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Copy, 
  RefreshCw, 
  Play, 
  RotateCcw,
  ArrowRightLeft,
  Settings,
  CheckCircle
} from "lucide-react";

interface TaskButton {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  status: "idle" | "running" | "success" | "error";
}

const TaskPanel = () => {
  const tasks: TaskButton[] = [
    {
      id: "sync-aa05-tele",
      title: "Sync aa05 → tele",
      description: "Copy files from admin to user directory",
      icon: <ArrowRightLeft className="h-4 w-4" />,
      action: "cp -r /home/aa05/Documents/KhoaDevOps/* /home/tele/Documents/KhoaDevOps/",
      status: "idle"
    },
    {
      id: "update-permissions",
      title: "Update Permissions",
      description: "Set correct permissions for tele user",
      icon: <Settings className="h-4 w-4" />,
      action: "chmod -R 755 /home/tele/Documents/KhoaDevOps/",
      status: "idle"
    },
    {
      id: "backup-config",
      title: "Backup Config",
      description: "Create backup of configuration files",
      icon: <Copy className="h-4 w-4" />,
      action: "tar -czf config_backup_$(date +%Y%m%d).tar.gz *.py *.txt",
      status: "success"
    },
    {
      id: "restart-service",
      title: "Restart Service",
      description: "Restart KPro service on remote machine",
      icon: <RefreshCw className="h-4 w-4" />,
      action: "systemctl restart kpro-service",
      status: "idle"
    },
    {
      id: "run-tests",
      title: "Run Tests",
      description: "Execute test suite on remote machine",
      icon: <Play className="h-4 w-4" />,
      action: "python -m pytest tests/ -v",
      status: "idle"
    },
    {
      id: "sync-both",
      title: "Full Sync",
      description: "Synchronize both user directories",
      icon: <RotateCcw className="h-4 w-4" />,
      action: "rsync -av /home/aa05/Documents/KhoaDevOps/ /home/tele/Documents/KhoaDevOps/",
      status: "running"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "bg-yellow-500/20 text-yellow-400";
      case "success": return "bg-green-500/20 text-green-400";
      case "error": return "bg-red-500/20 text-red-400";
      default: return "bg-muted/50 text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running": return <RefreshCw className="h-3 w-3 animate-spin" />;
      case "success": return <CheckCircle className="h-3 w-3" />;
      case "error": return <Zap className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <Card className="bg-gradient-card border-accent shadow-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Zap className="h-5 w-5 text-primary" />
          Custom Tasks
          <Badge className="bg-primary/20 text-primary">6 tasks</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="group relative p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-all duration-300 cursor-pointer hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-md bg-primary/20 text-primary">
                    {task.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{task.title}</h3>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  </div>
                </div>
                <Badge className={`${getStatusColor(task.status)} border-0`}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(task.status)}
                    {task.status}
                  </div>
                </Badge>
              </div>
              
              <div className="text-xs font-mono text-muted-foreground bg-background/50 p-2 rounded border border-border mb-3">
                {task.action}
              </div>
              
              <Button 
                size="sm" 
                className="w-full bg-gradient-button hover:shadow-glow transition-all duration-300"
                disabled={task.status === "running"}
              >
                {task.status === "running" ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Execute
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-accent/20 rounded-lg border border-accent">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-foreground">Quick Actions</h4>
            <Badge variant="outline" className="border-border">All Users</Badge>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" className="bg-gradient-button">
              <Copy className="h-4 w-4 mr-1" />
              Copy All aa05→tele
            </Button>
            <Button size="sm" variant="outline" className="border-border">
              <Settings className="h-4 w-4 mr-1" />
              Fix Permissions
            </Button>
            <Button size="sm" variant="outline" className="border-border">
              <RefreshCw className="h-4 w-4 mr-1" />
              Restart All Services
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskPanel;