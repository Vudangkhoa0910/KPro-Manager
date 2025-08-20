import React, { createContext, useContext, useState, ReactNode } from 'react';
import { sshService } from '@/services/sshService';

export interface SSHConnectionInfo {
  id: string;
  host: string;
  port: number;
  username: string;
  isConnected: boolean;
  homePath: string;
  currentPath: string;
  connectionTime?: Date;
}

interface SSHContextType {
  connections: SSHConnectionInfo[];
  activeConnection: SSHConnectionInfo | null;
  addConnection: (connectionConfig: {
    host: string;
    username: string;
    password: string;
    port: number;
  }) => Promise<SSHConnectionInfo>;
  setActiveConnection: (connection: SSHConnectionInfo | null) => void;
  updateConnectionPath: (connectionId: string, path: string) => void;
  disconnectConnection: (connectionId: string) => void;
}

const SSHContext = createContext<SSHContextType | null>(null);

export const useSSH = () => {
  const context = useContext(SSHContext);
  if (!context) {
    throw new Error('useSSH must be used within SSHProvider');
  }
  return context;
};

interface SSHProviderProps {
  children: ReactNode;
}

export const SSHProvider: React.FC<SSHProviderProps> = ({ children }) => {
  const [connections, setConnections] = useState<SSHConnectionInfo[]>([]);
  const [activeConnection, setActiveConnection] = useState<SSHConnectionInfo | null>(null);

  const addConnection = async (connectionConfig: {
    host: string;
    username: string;
    password: string;
    port: number;
  }): Promise<SSHConnectionInfo> => {
    try {
      // Actually connect to SSH using the backend service
      const sshConnection = await sshService.connect(
        connectionConfig.host,
        connectionConfig.username,
        connectionConfig.password,
        connectionConfig.port
      );
      
      // Create SSH Context connection info using the backend connection ID
      const connectionInfo: SSHConnectionInfo = {
        id: sshConnection.connectionId, // Use backend connection ID!
        host: connectionConfig.host,
        port: connectionConfig.port,
        username: connectionConfig.username,
        isConnected: true,
        homePath: `/home/${connectionConfig.username}`,
        currentPath: `/home/${connectionConfig.username}`,
        connectionTime: new Date()
      };
      
      setConnections(prev => {
        const existing = prev.find(c => c.id === connectionInfo.id);
        if (existing) {
          return prev.map(c => c.id === connectionInfo.id ? connectionInfo : c);
        }
        return [...prev, connectionInfo];
      });
      
      // Set as active connection
      setActiveConnection(connectionInfo);
      
      return connectionInfo;
    } catch (error) {
      console.error('SSH connection failed:', error);
      throw error;
    }
  };

  const updateConnectionPath = (connectionId: string, path: string) => {
    setConnections(prev => 
      prev.map(c => c.id === connectionId ? { ...c, currentPath: path } : c)
    );
    
    if (activeConnection?.id === connectionId) {
      setActiveConnection(prev => prev ? { ...prev, currentPath: path } : null);
    }
  };

  const disconnectConnection = async (connectionId: string) => {
    try {
      // Actually disconnect from backend
      await sshService.disconnect(connectionId);
      
      // Update context state
      setConnections(prev => 
        prev.map(c => c.id === connectionId ? { ...c, isConnected: false } : c)
      );
      
      if (activeConnection?.id === connectionId) {
        setActiveConnection(null);
      }
    } catch (error) {
      console.error('Disconnect failed:', error);
      // Still update UI state even if backend call fails
      setConnections(prev => 
        prev.map(c => c.id === connectionId ? { ...c, isConnected: false } : c)
      );
      
      if (activeConnection?.id === connectionId) {
        setActiveConnection(null);
      }
    }
  };

  return (
    <SSHContext.Provider value={{
      connections,
      activeConnection,
      addConnection,
      setActiveConnection,
      updateConnectionPath,
      disconnectConnection
    }}>
      {children}
    </SSHContext.Provider>
  );
};
