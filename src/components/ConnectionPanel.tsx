import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Server, Wifi, WifiOff, User, Lock } from "lucide-react";

interface ConnectionPanelProps {
  onConnect: (config: ConnectionConfig) => void;
  isConnected: boolean;
}

interface ConnectionConfig {
  host: string;
  user: string;
  password: string;
  port: number;
}

const ConnectionPanel = ({ onConnect, isConnected }: ConnectionPanelProps) => {
  const [config, setConfig] = useState<ConnectionConfig>({
    host: "",
    user: "aa05",
    password: "",
    port: 22,
  });

  const handleConnect = () => {
    onConnect(config);
  };

  return (
    <Card className="bg-gradient-card border-accent shadow-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Server className="h-5 w-5 text-primary" />
          SSH Connection
          <Badge variant={isConnected ? "default" : "secondary"} className="ml-auto">
            {isConnected ? (
              <><Wifi className="h-3 w-3 mr-1" /> Connected</>
            ) : (
              <><WifiOff className="h-3 w-3 mr-1" /> Disconnected</>
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="host" className="text-foreground">Host</Label>
            <Input
              id="host"
              placeholder="192.168.1.100"
              value={config.host}
              onChange={(e) => setConfig({ ...config, host: e.target.value })}
              className="bg-muted border-border"
            />
          </div>
          <div>
            <Label htmlFor="port" className="text-foreground">Port</Label>
            <Input
              id="port"
              type="number"
              value={config.port}
              onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 22 })}
              className="bg-muted border-border"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="user" className="text-foreground">User</Label>
          <Select value={config.user} onValueChange={(value) => setConfig({ ...config, user: value })}>
            <SelectTrigger className="bg-muted border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aa05">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  aa05 (Admin)
                </div>
              </SelectItem>
              <SelectItem value="tele">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-secondary-foreground" />
                  tele (User)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="password" className="text-foreground">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              value={config.password}
              onChange={(e) => setConfig({ ...config, password: e.target.value })}
              className="bg-muted border-border pl-10"
            />
          </div>
        </div>

        <Button 
          onClick={handleConnect}
          className="w-full bg-gradient-button hover:shadow-glow transition-all duration-300"
          disabled={!config.host || !config.password}
        >
          {isConnected ? "Reconnect" : "Connect to Server"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ConnectionPanel;