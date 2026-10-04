'use client';

import { useState, useCallback, useRef, DragEvent, ChangeEvent } from 'react';
import { cn } from '@/lib/utils';
import { Upload, X, FileText, Image, Video } from 'lucide-react';
import { Button } from './Button';

export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'pdf' | 'video' | 'other';
  progress?: number;
  error?: string;
}

interface FileUploadProps {
  accept?: string;
  maxFiles?: number;
  maxSize?: number;
  multiple?: boolean;
  onFilesChange: (files: UploadedFile[]) => void;
  initialFiles?: UploadedFile[];
  disabled?: boolean;
  className?: string;
  label?: string;
  description?: string;
}

const FILE_ICONS = {
  image: Image,
  pdf: FileText,
  video: Video,
  other: FileText,
};

function getFileType(file: File): 'image' | 'pdf' | 'video' | 'other' {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type.startsWith('video/')) return 'video';
  return 'other';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({
  accept = 'image/*,.pdf,video/*',
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024,
  multiple = true,
  onFilesChange,
  initialFiles = [],
  disabled = false,
  className,
  label = 'Attach files',
  description = 'Drag and drop or click to upload',
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>(initialFiles);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateFiles = useCallback((newFiles: UploadedFile[]) => {
    setFiles(newFiles);
    onFilesChange(newFiles);
  }, [onFilesChange]);

  const removeFile = useCallback((id: string) => {
    updateFiles(files.filter(f => f.id !== id));
  }, [files, updateFiles]);

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: UploadedFile[] = [];

    for (const file of fileArray) {
      if (files.length + validFiles.length >= maxFiles) break;
      
      if (file.size > maxSize) {
        validFiles.push({
          id: Math.random().toString(36).substring(7),
          file,
          type: getFileType(file),
          error: `File size exceeds ${formatFileSize(maxSize)}`,
        });
        continue;
      }

      const type = getFileType(file);
      let preview: string | undefined;

      if (type === 'image') {
        preview = URL.createObjectURL(file);
      }

      validFiles.push({
        id: Math.random().toString(36).substring(7),
        file,
        preview,
        type,
      });
    }

    updateFiles([...files, ...validFiles]);
  }, [files, maxFiles, maxSize, updateFiles]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }, [disabled, handleFiles]);

  const handleClick = useCallback(() => {
    if (!disabled) fileInputRef.current?.click();
  }, [disabled]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length) {
      handleFiles(e.target.files);
    }
    e.target.value = '';
  }, [handleFiles]);

  return (
    <div className={cn('relative', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleChange}
        className="sr-only"
        aria-label={label}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          'border-2 border-dashed rounded-xl transition-smooth cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          isDragging ? 'border-primary bg-primary-light' : 'border-border-strong hover:border-primary/50 hover:bg-muted',
          disabled && 'opacity-50 cursor-not-allowed',
          'p-6 text-center'
        )}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      >
        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
        {files.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">{files.length}/{maxFiles} files</p>
        )}
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2" role="list" aria-label="Uploaded files">
          {files.map((file) => {
            const FileIcon = FILE_ICONS[file.type];
            return (
            <div key={file.id} className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg" role="listitem">
              <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{file.file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.file.size)}</p>
                {file.error && <p className="text-xs text-error mt-0.5">{file.error}</p>}
              </div>
              {file.progress !== undefined && (
                <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${file.progress}%` }} />
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFile(file.id)}
                disabled={disabled}
                aria-label={`Remove ${file.file.name}`}
                className="text-muted-foreground hover:text-error"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
