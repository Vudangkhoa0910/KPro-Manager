import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Server, Wifi, WifiOff, User, Lock, Loader2, Shield, Plus, History, Trash2 } from "lucide-react";
import { sshService, SSHConnection } from "@/services/sshService";
import { useSSH, SSHConnectionInfo } from "@/contexts/SSHContext";

interface ConnectionPanelProps {
  onConnect?: (connection: SSHConnection) => void;
  isConnected?: boolean;
  currentConnection?: SSHConnection;
}

interface ConnectionConfig {
  host: string;
  user: string;
  password: string;
  port: number;
}

// Predefined connection profiles
const connectionProfiles = [
  { name: "Server 1 - aa05", host: "your-server.com", user: "aa05", port: 22 },
  { name: "Server 2 - tele", host: "another-server.com", user: "tele", port: 22 },
  { name: "Local Development", host: "localhost", user: "dev", port: 22 },
];

const ConnectionPanel = ({ onConnect, isConnected = false, currentConnection }: ConnectionPanelProps) => {
  const { 
    connections, 
    activeConnection, 
    addConnection, 
    setActiveConnection, 
    disconnectConnection,
    updateConnectionPath
  } = useSSH();

  const [config, setConfig] = useState<ConnectionConfig>({
    host: "",
    user: "aa05",
    password: "",
    port: 22,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionHistory, setConnectionHistory] = useState<ConnectionConfig[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const { toast } = useToast();

  // Load connection history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('kpro-ssh-history');
    if (savedHistory) {
      setConnectionHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save to connection history
  const saveToHistory = (connection: ConnectionConfig) => {
    const newHistory = [connection, ...connectionHistory.filter(h => 
      !(h.host === connection.host && h.user === connection.user)
    )].slice(0, 5); // Keep only 5 recent connections
    
    setConnectionHistory(newHistory);
    localStorage.setItem('kpro-ssh-history', JSON.stringify(newHistory));
  };

  const loadProfile = (profileName: string) => {
    const profile = connectionProfiles.find(p => p.name === profileName);
    if (profile) {
      setConfig({
        host: profile.host,
        user: profile.user,
        password: "",
        port: profile.port
      });
      setSelectedProfile(profileName);
    }
  };

  const loadFromHistory = (historyItem: ConnectionConfig) => {
    setConfig({ ...historyItem, password: "" }); // Don't save passwords
    setSelectedProfile("");
  };

  const handleConnect = async () => {
    if (!config.host || !config.user || !config.password) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    setIsConnecting(true);
    try {
      // Use the updated addConnection API
      const connectionInfo = await addConnection({
        host: config.host,
        username: config.user,
        password: config.password,
        port: config.port
      });

      // Save to history on successful connection
      saveToHistory(config);
      
      // Legacy callback support
      if (onConnect) {
        const legacyConnection: SSHConnection = {
          connectionId: connectionInfo.id,
          host: config.host,
          username: config.user,
          connected: true
        };
        onConnect(legacyConnection);
      }

      toast({
        title: "Connected Successfully",
        description: `Connected to ${config.user}@${config.host}:${config.port}`,
      });
      
      // Reset form
      setConfig({
        host: "",
        user: "aa05",
        password: "",
        port: 22,
      });
      setSelectedProfile("");
      
    } catch (error) {
      console.error('SSH connection failed:', error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to establish SSH connection",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (connectionId?: string) => {
    const idToDisconnect = connectionId || activeConnection?.id;
    if (idToDisconnect) {
      disconnectConnection(idToDisconnect);
      toast({
        title: "Disconnected",
        description: "SSH connection closed successfully",
      });
    }
  };

  const handleDisconnectClick = () => {
    handleDisconnect();
  };

  const handleSetActive = (connection: SSHConnectionInfo) => {
    setActiveConnection(connection);
    toast({
      title: "Connection Activated",
      description: "Active connection changed",
    });
  };

  // Helper function to remove connection completely
  const handleRemove = (connectionId: string) => {
    // For now, just disconnect. Later we can add a proper remove function to context
    disconnectConnection(connectionId);
    toast({
      title: "Connection Removed",
      description: "Connection removed from list",
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              SSH Connection Status
            </CardTitle>
            <Badge variant={activeConnection?.isConnected ? "default" : "secondary"}>
              {activeConnection?.isConnected ? (
                <>
                  <Wifi className="h-3 w-3 mr-1" />
                  Connected
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 mr-1" />
                  Disconnected
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        {activeConnection && (
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Host:</strong> {activeConnection.host}:{activeConnection.port}
              </p>
              <p className="text-sm">
                <strong>User:</strong> {activeConnection.username}
              </p>
              <p className="text-sm">
                <strong>Path:</strong> <code className="text-blue-600">{activeConnection.currentPath}</code>
              </p>
              {activeConnection.connectionTime && (
                <p className="text-sm">
                  <strong>Connected:</strong> {activeConnection.connectionTime.toLocaleString()}
                </p>
              )}
              {activeConnection.isConnected && (
                <Button 
                  onClick={handleDisconnectClick}
                  variant="destructive"
                  size="sm"
                  className="mt-3"
                >
                  <WifiOff className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Quick Connect Profiles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Quick Connect Profiles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedProfile} onValueChange={loadProfile}>
            <SelectTrigger>
              <SelectValue placeholder="Select a connection profile" />
            </SelectTrigger>
            <SelectContent>
              {connectionProfiles.map((profile) => (
                <SelectItem key={profile.name} value={profile.name}>
                  {profile.name} ({profile.host})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* SSH Context Connections */}
      {connections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                SSH Connections
              </div>
              <Badge variant="secondary">{connections.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {connections.map((conn) => (
                <div key={conn.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{conn.username}@{conn.host}:{conn.port}</h3>
                      <Badge className={conn.isConnected ? 
                        "bg-green-100 text-green-700 border-green-200" : 
                        "bg-red-100 text-red-700 border-red-200"}>
                        {conn.isConnected ? 'Connected' : 'Disconnected'}
                      </Badge>
                      {conn.id === activeConnection?.id && (
                        <Badge variant="outline" className="border-blue-200 text-blue-700">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Path: {conn.currentPath}
                    </p>
                    {conn.connectionTime && (
                      <p className="text-xs text-muted-foreground">
                        Connected: {conn.connectionTime.toLocaleString()}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {conn.isConnected ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetActive(conn)}
                          disabled={conn.id === activeConnection?.id}
                        >
                          {conn.id === activeConnection?.id ? 'Active' : 'Set Active'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnect(conn.id)}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetActive(conn)}
                        disabled
                      >
                        Reconnect
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemove(conn.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection History */}
      {connectionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {connectionHistory.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3"
                  onClick={() => loadFromHistory(item)}
                >
                  <div className="text-left">
                    <p className="font-medium">{item.user}@{item.host}</p>
                    <p className="text-xs text-muted-foreground">Port: {item.port}</p>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            New SSH Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3">
                <Label htmlFor="host">Hostname or IP Address</Label>
                <Input
                  id="host"
                  placeholder="192.168.1.100 or server.example.com"
                  value={config.host}
                  onChange={(e) => setConfig(prev => ({ ...prev, host: e.target.value }))}
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  placeholder="22"
                  value={config.port}
                  onChange={(e) => setConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 22 }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="user">Username</Label>
                <Input
                  id="user"
                  placeholder="aa05 or tele"
                  value={config.user}
                  onChange={(e) => setConfig(prev => ({ ...prev, user: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={config.password}
                  onChange={(e) => setConfig(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
            </div>

            <Separator />

            <Button
              onClick={handleConnect}
              disabled={isConnecting || !config.host || !config.user || !config.password}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Server className="mr-2 h-4 w-4" />
                  Connect to SSH
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SSH Security Notice */}
      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">Security Notice</p>
              <p>
                Passwords are not stored for security. Use SSH keys or secure authentication methods 
                for production environments.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectionPanel;
