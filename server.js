import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { NodeSSH } from 'node-ssh';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());

// File upload configuration
const upload = multer({ dest: 'temp/' });

// SSH connections pool
const sshConnections = new Map();

// Utility function to format file stats
const formatFileStats = (stats, filename, filepath) => {
  return {
    name: filename,
    type: stats.isDirectory() ? 'folder' : 'file',
    size: stats.isFile() ? stats.size : undefined,
    permissions: stats.mode?.toString(8) || '755',
    modified: stats.mtime?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    path: filepath
  };
};

// SSH Connection endpoint
app.post('/api/ssh/connect', async (req, res) => {
  const { host, username, password, port = 22 } = req.body;
  
  try {
    const ssh = new NodeSSH();
    const connectionId = `${host}-${username}-${Date.now()}`;
    
    // Enhanced connection config
    const connectionConfig = {
      host,
      username,
      password,
      port: parseInt(port),
      readyTimeout: 30000,
      tryKeyboard: true,
      algorithms: {
        kex: [
          'diffie-hellman-group1-sha1',
          'ecdh-sha2-nistp256',
          'ecdh-sha2-nistp384', 
          'ecdh-sha2-nistp521',
          'diffie-hellman-group-exchange-sha256',
          'diffie-hellman-group14-sha1'
        ],
        cipher: [
          'aes128-ctr',
          'aes192-ctr',
          'aes256-ctr',
          'aes128-gcm',
          'aes128-gcm@openssh.com',
          'aes256-gcm',
          'aes256-gcm@openssh.com',
          'aes256-cbc',
          'aes192-cbc',
          'aes128-cbc'
        ],
        serverHostKey: [
          'ssh-rsa',
          'ecdsa-sha2-nistp256',
          'ecdsa-sha2-nistp384',
          'ecdsa-sha2-nistp521',
          'ssh-ed25519'
        ],
        hmac: [
          'hmac-sha2-256',
          'hmac-sha2-512',
          'hmac-sha1'
        ]
      }
    };
    
    console.log(`Attempting SSH connection to ${username}@${host}:${port}`);
    await ssh.connect(connectionConfig);
    
    // Test connection with a simple command
    const testResult = await ssh.execCommand('echo "Connection test successful"');
    if (testResult.code !== 0) {
      throw new Error('Connection test failed');
    }
    
    sshConnections.set(connectionId, ssh);
    console.log(`SSH connected successfully: ${connectionId}`);
    
    res.json({
      success: true,
      connectionId,
      message: `Connected to ${username}@${host}:${port}`
    });
  } catch (error) {
    console.error('SSH Connection error:', error);
    res.status(500).json({
      success: false,
      error: `SSH Connection failed: ${error.message}. Please check your credentials and network connectivity.`
    });
  }
});

// List directory contents
app.post('/api/ssh/list', async (req, res) => {
  const { connectionId, path: remotePath = '/home' } = req.body;
  
  try {
    const ssh = sshConnections.get(connectionId);
    if (!ssh) {
      return res.status(400).json({ success: false, error: 'SSH connection not found' });
    }

    // Expand tilde to home directory if needed
    let expandedPath = remotePath;
    if (remotePath === '~' || remotePath.startsWith('~/')) {
      const homeResult = await ssh.execCommand('echo $HOME');
      if (homeResult.code === 0) {
        const home = homeResult.stdout.trim();
        expandedPath = remotePath === '~' ? home : remotePath.replace('~', home);
      }
    }

    console.log(`Listing directory: ${remotePath} -> ${expandedPath}`);

    // Use simpler, more reliable ls command with numeric format for dates
    const result = await ssh.execCommand(`ls -la --time-style='+%Y-%m-%d %H:%M' "${expandedPath}" 2>/dev/null || ls -la "${expandedPath}"`);
    
    if (result.code !== 0) {
      console.log('ls command failed:', result.stderr);
      return res.json({ 
        success: true, 
        files: [],
        warning: `Cannot access directory: ${result.stderr}`
      });
    }

    // Parse ls output with better error handling
    const files = [];
    const lines = result.stdout.split('\n');
    
    for (const line of lines) {
      if (!line.trim()) continue;
      if (line.startsWith('total ')) continue; // Skip total line
      
      // More robust parsing: handle both standard and time-style formats
      const match = line.match(/^([drwx-]{10})\s+\d+\s+\w+\s+\w+\s+(\d+)\s+(.+?\d{2}:\d{2}|\w{3}\s+\d+\s+\d{4}|\w{3}\s+\d+\s+\d{2}:\d{2})\s+(.+)$/);
      
      if (!match) {
        console.log('Could not parse line:', line);
        continue;
      }
      
      const [, permissions, size, dateTime, filename] = match;
      
      if (filename === '.' || filename === '..') continue;
      
      // Skip problematic system directories
      if (['.gvfs', '.cache', '.gconf', '.dbus', '.local/share/gvfs-metadata'].includes(filename)) {
        continue;
      }
      
      files.push({
        name: filename,
        type: permissions.startsWith('d') ? 'folder' : 'file',
        size: permissions.startsWith('d') ? undefined : parseInt(size),
        permissions,
        modified: dateTime.trim(),
        path: `${expandedPath}/${filename}`.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
      });
    }

    // Sort: folders first, then files, both alphabetically
    files.sort((a, b) => {
      if (a.type === 'folder' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });

    console.log(`✅ Listed ${files.length} files in ${remotePath}`);
    res.json({ success: true, files });
  } catch (error) {
    console.error('List directory error:', error);
    
    // Return empty list with error message instead of failing completely
    res.json({ 
      success: true, 
      files: [
        {
          name: "(Access denied or empty)",
          type: "file",
          size: 0,
          permissions: "-r--r--r--",
          modified: new Date().toLocaleDateString(),
          path: remotePath
        }
      ],
      warning: `Directory access error: ${error.message}`
    });
  }
});

// Execute command
app.post('/api/ssh/execute', async (req, res) => {
  const { connectionId, command, cwd = '/home' } = req.body;
  
  try {
    const ssh = sshConnections.get(connectionId);
    if (!ssh) {
      return res.status(400).json({ success: false, error: 'SSH connection not found' });
    }

    const result = await ssh.execCommand(command, { cwd });
    
    res.json({
      success: true,
      stdout: result.stdout,
      stderr: result.stderr,
      code: result.code
    });
  } catch (error) {
    console.error('Execute command error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Read file content
app.post('/api/ssh/read-file', async (req, res) => {
  const { connectionId, filePath } = req.body;
  
  try {
    const ssh = sshConnections.get(connectionId);
    if (!ssh) {
      return res.status(400).json({ success: false, error: 'SSH connection not found' });
    }

    const result = await ssh.execCommand(`cat "${filePath}"`);
    if (result.code !== 0) {
      throw new Error(result.stderr);
    }

    res.json({
      success: true,
      content: result.stdout,
      filePath
    });
  } catch (error) {
    console.error('Read file error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Write file content
app.post('/api/ssh/write-file', async (req, res) => {
  const { connectionId, filePath, content } = req.body;
  
  try {
    const ssh = sshConnections.get(connectionId);
    if (!ssh) {
      return res.status(400).json({ success: false, error: 'SSH connection not found' });
    }

    // Write content to file (escape quotes and special chars)
    const escapedContent = content.replace(/'/g, "'\"'\"'");
    const result = await ssh.execCommand(`echo '${escapedContent}' > "${filePath}"`);
    
    if (result.code !== 0) {
      throw new Error(result.stderr);
    }

    res.json({
      success: true,
      message: 'File saved successfully',
      filePath
    });
  } catch (error) {
    console.error('Write file error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// File operations (copy, move, delete)
app.post('/api/ssh/file-operation', async (req, res) => {
  const { connectionId, operation, source, destination } = req.body;
  
  try {
    const ssh = sshConnections.get(connectionId);
    if (!ssh) {
      return res.status(400).json({ success: false, error: 'SSH connection not found' });
    }

    let command = '';
    switch (operation) {
      case 'copy':
        command = `cp -r "${source}" "${destination}"`;
        break;
      case 'move':
        command = `mv "${source}" "${destination}"`;
        break;
      case 'delete':
        command = `rm -rf "${source}"`;
        break;
      case 'mkdir':
        command = `mkdir -p "${source}"`;
        break;
      default:
        throw new Error('Unsupported operation');
    }

    const result = await ssh.execCommand(command);
    if (result.code !== 0) {
      throw new Error(result.stderr);
    }

    res.json({
      success: true,
      message: `${operation} operation completed successfully`
    });
  } catch (error) {
    console.error('File operation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// WebSocket for terminal
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      const { type, connectionId, command } = data;
      
      if (type === 'terminal-command') {
        const ssh = sshConnections.get(connectionId);
        if (!ssh) {
          ws.send(JSON.stringify({ type: 'error', message: 'SSH connection not found' }));
          return;
        }
        
        const result = await ssh.execCommand(command);
        ws.send(JSON.stringify({
          type: 'terminal-output',
          stdout: result.stdout,
          stderr: result.stderr,
          code: result.code
        }));
      }
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', message: error.message }));
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Disconnect SSH
app.post('/api/ssh/disconnect', async (req, res) => {
  const { connectionId } = req.body;
  
  try {
    const ssh = sshConnections.get(connectionId);
    if (ssh) {
      await ssh.dispose();
      sshConnections.delete(connectionId);
    }
    
    res.json({
      success: true,
      message: 'SSH connection closed'
    });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', connections: sshConnections.size });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 KPro Backend Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for terminal connections`);
});
