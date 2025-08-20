import React, { useState, useEffect, useCallback } from 'react'
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen, 
  File,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from './ui/use-toast'

interface FileTreeItem {
  name: string
  type: 'file' | 'folder'
  path: string
  size?: number
  permissions?: string
  modified?: string
  children?: FileTreeItem[]
  isLoaded?: boolean
  isExpanded?: boolean
  level: number
}

interface FileTreeProps {
  connectionId?: string
  isConnected?: boolean
  onFileSelect?: (file: FileTreeItem) => void
  className?: string
}

export function FileTree({ connectionId, isConnected, onFileSelect, className }: FileTreeProps) {
  const [tree, setTree] = useState<FileTreeItem[]>([])
  const [loading, setLoading] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  // Load directory contents from backend
  const loadDirectory = useCallback(async (path: string): Promise<FileTreeItem[]> => {
    if (!connectionId || !isConnected) {
      throw new Error('SSH connection not available')
    }

    const response = await fetch('/api/ssh/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId, path })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Failed to load directory')
    }

    return data.files.map((file: any) => ({
      name: file.name,
      type: file.type,
      path: file.path,
      size: file.size,
      permissions: file.permissions,
      modified: file.modified,
      children: file.type === 'folder' ? [] : undefined,
      isLoaded: file.type === 'file',
      isExpanded: false,
      level: 0
    }))
  }, [connectionId, isConnected])

  // Initialize root directory - use current user's home
  useEffect(() => {
    if (connectionId && isConnected) {
      const initTree = async () => {
        setError(null)
        
        // Try to get user's home directory first
        let homePath = '/home'
        try {
          const response = await fetch('/api/ssh/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ connectionId, command: 'pwd' })
          })
          const data = await response.json()
          if (data.success && data.output.trim()) {
            homePath = data.output.trim()
          } else {
            // Fallback: try to get home from environment
            const homeResponse = await fetch('/api/ssh/execute', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ connectionId, command: 'echo $HOME' })
            })
            const homeData = await homeResponse.json()
            if (homeData.success && homeData.output.trim()) {
              homePath = homeData.output.trim()
            }
          }
        } catch (error) {
          console.warn('Could not get home directory, using /home')
          homePath = '/home'
        }
        
        console.log('Using home path:', homePath)
        setLoading(prev => new Set([...prev, homePath]))
        
        try {
          const rootFiles = await loadDirectory(homePath)
          setTree(rootFiles.map(item => ({ ...item, level: 0 })))
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Failed to load file tree'
          setError(errorMsg)
          toast({
            title: 'Error',
            description: errorMsg,
            variant: 'destructive'
          })
        } finally {
          setLoading(prev => {
            const newSet = new Set(prev)
            newSet.delete(homePath)
            return newSet
          })
        }
      }
      
      initTree()
    }
  }, [connectionId, isConnected, loadDirectory])

  // Toggle folder expansion
  const toggleFolder = useCallback(async (targetPath: string) => {
    const updateTree = async (items: FileTreeItem[]): Promise<FileTreeItem[]> => {
      const updatedItems = []
      
      for (const item of items) {
        if (item.path === targetPath && item.type === 'folder') {
          if (!item.isExpanded) {
            // Expand: load children if not already loaded
            if (!item.isLoaded) {
              setLoading(prev => new Set([...prev, targetPath]))
              
              try {
                const children = await loadDirectory(targetPath)
                const childrenWithLevel = children.map(child => ({
                  ...child,
                  level: item.level + 1
                }))
                
                updatedItems.push({
                  ...item,
                  children: childrenWithLevel,
                  isLoaded: true,
                  isExpanded: true
                })
              } catch (error) {
                console.error(`Error loading ${targetPath}:`, error)
                toast({
                  title: 'Error',
                  description: `Failed to load directory: ${item.name}`,
                  variant: 'destructive'
                })
                updatedItems.push({ ...item, isExpanded: false })
              } finally {
                setLoading(prev => {
                  const newSet = new Set(prev)
                  newSet.delete(targetPath)
                  return newSet
                })
              }
            } else {
              updatedItems.push({ ...item, isExpanded: true })
            }
          } else {
            // Collapse
            updatedItems.push({ ...item, isExpanded: false })
          }
        } else {
          // Recursively update children if they exist
          if (item.children && item.children.length > 0) {
            const updatedChildren = await updateTree(item.children)
            updatedItems.push({ ...item, children: updatedChildren })
          } else {
            updatedItems.push(item)
          }
        }
      }
      
      return updatedItems
    }

    setTree(await updateTree(tree))
  }, [tree, loadDirectory])

  // Handle item clicks
  const handleItemClick = useCallback((item: FileTreeItem) => {
    if (item.type === 'folder') {
      toggleFolder(item.path)
    } else {
      onFileSelect?.(item)
    }
  }, [toggleFolder, onFileSelect])

  // Render tree item recursively
  const renderTreeItem = useCallback((item: FileTreeItem, index: number): React.ReactNode => {
    const isLoadingItem = loading.has(item.path)
    const hasChildren = item.children && item.children.length > 0
    const shouldShowChildren = item.isExpanded && hasChildren

    return (
      <div key={`${item.path}-${index}`} className="select-none">
        {/* Item row */}
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 cursor-pointer text-sm transition-all duration-200 group",
            "border-l-2 border-transparent rounded-r-md mx-1",
            item.type === 'file' 
              ? "hover:bg-green-500/20 hover:border-green-400 text-white hover:text-green-200" 
              : "hover:bg-blue-500/20 hover:border-blue-400 text-white hover:text-blue-200"
          )}
          style={{ paddingLeft: `${12 + item.level * 20}px` }}
          onClick={() => handleItemClick(item)}
        >
          {/* Expand/collapse chevron for folders */}
          {item.type === 'folder' ? (
            <div className="w-4 h-4 flex items-center justify-center">
              {isLoadingItem ? (
                <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
              ) : item.isExpanded ? (
                <ChevronDown className="w-3 h-3 text-blue-400" />
              ) : (
                <ChevronRight className="w-3 h-3 text-blue-400" />
              )}
            </div>
          ) : (
            <div className="w-4" />
          )}

          {/* File/folder icon */}
          <div className="w-4 h-4 flex items-center justify-center">
            {item.type === 'folder' ? (
              item.isExpanded ? (
                <FolderOpen className="w-4 h-4 text-blue-400" />
              ) : (
                <Folder className="w-4 h-4 text-blue-500" />
              )
            ) : (
              <File className="w-4 h-4 text-green-400" />
            )}
          </div>

          {/* File/folder name */}
          <span 
            className={cn(
              "truncate flex-1 select-none font-medium",
              item.type === 'folder' 
                ? "text-white" 
                : "text-white"
            )}
            title={`${item.name} - ${item.path}`}
          >
            {item.name}
          </span>

          {/* File size indicator for files */}
          {item.type === 'file' && item.size && (
            <span className="text-xs text-gray-400 ml-2">
              {item.size > 1024 ? `${(item.size / 1024).toFixed(1)}K` : `${item.size}B`}
            </span>
          )}
        </div>

        {/* Children (recursive) */}
        {shouldShowChildren && (
          <div>
            {item.children!.map((child, childIndex) => 
              renderTreeItem(child, childIndex)
            )}
          </div>
        )}
      </div>
    )
  }, [loading, handleItemClick])

  // Show loading state for initial load
  if (!tree.length && loading.size > 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-400" />
        <span className="text-sm text-slate-300">Loading file tree...</span>
      </div>
    )
  }

  // Show error state
  if (error && !tree.length) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-400 text-sm mb-2">Failed to load file tree</div>
        <div className="text-slate-400 text-xs">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-3 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className={cn("overflow-auto", className)}>
      {tree.map((item, index) => renderTreeItem(item, index))}
    </div>
  )
}

export default FileTree
