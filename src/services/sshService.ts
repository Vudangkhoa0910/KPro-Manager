const API_BASE_URL = 'http://localhost:3001/api';

export interface SSHConnection {
  connectionId: string;
  host: string;
  username: string;
  connected: boolean;
}

export interface FileItem {
  name: string;
  type: 'file' | 'folder';
  size?: number;
  permissions: string;
  modified: string;
  path: string;
}

export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  code: number;
}

class SSHService {
  private connections: Map<string, SSHConnection> = new Map();

  async connect(host: string, username: string, password: string, port: number = 22): Promise<SSHConnection> {
    try {
      const response = await fetch(`${API_BASE_URL}/ssh/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ host, username, password, port }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      const connection: SSHConnection = {
        connectionId: result.connectionId,
        host,
        username,
        connected: true,
      };

      this.connections.set(result.connectionId, connection);
      return connection;
    } catch (error) {
      console.error('SSH Connect Error:', error);
      throw error;
    }
  }

  async listDirectory(connectionId: string, path: string = '/home'): Promise<FileItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/ssh/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionId, path }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.files;
    } catch (error) {
      console.error('List Directory Error:', error);
      throw error;
    }
  }

  async executeCommand(connectionId: string, command: string, cwd?: string): Promise<CommandResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/ssh/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionId, command, cwd }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Execute Command Error:', error);
      throw error;
    }
  }

  async readFile(connectionId: string, filePath: string): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/ssh/read-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionId, filePath }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.content;
    } catch (error) {
      console.error('Read File Error:', error);
      throw error;
    }
  }

  async writeFile(connectionId: string, filePath: string, content: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/ssh/write-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionId, filePath, content }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Write File Error:', error);
      throw error;
    }
  }

  async fileOperation(
    connectionId: string,
    operation: 'copy' | 'move' | 'delete' | 'mkdir',
    source: string,
    destination?: string
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/ssh/file-operation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionId, operation, source, destination }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('File Operation Error:', error);
      throw error;
    }
  }

  async disconnect(connectionId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/ssh/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionId }),
      });

      const result = await response.json();
      
      if (result.success) {
        this.connections.delete(connectionId);
      }
    } catch (error) {
      console.error('Disconnect Error:', error);
      throw error;
    }
  }

  getConnection(connectionId: string): SSHConnection | undefined {
    return this.connections.get(connectionId);
  }

  getAllConnections(): SSHConnection[] {
    return Array.from(this.connections.values());
  }

  // WebSocket for terminal
  createTerminalWebSocket(): WebSocket {
    const ws = new WebSocket('ws://localhost:3001');
    return ws;
  }
}

export const sshService = new SSHService();
