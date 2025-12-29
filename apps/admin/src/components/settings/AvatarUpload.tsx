'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  currentAvatar?: string | null;
  userName?: string;
  /** Called when user selects a file for upload */
  onUpload?: (file: File) => void | Promise<void>;
  /** Called when user wants to remove their avatar */
  onRemove?: () => void | Promise<void>;
  /** Show loading state during upload/remove */
  isLoading?: boolean;
  className?: string;
}

export function AvatarUpload({
  currentAvatar,
  userName = 'User',
  onUpload,
  onRemove,
  isLoading = false,
  className,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when currentAvatar changes
  useEffect(() => {
    setPreview(currentAvatar || null);
  }, [currentAvatar]);

  // Get user initials for fallback
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleFileChange = useCallback(
    async (file: File | null) => {
      if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert('Please upload an image file');
          return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('Image size must be less than 5MB');
          return;
        }

        // Create preview immediately for UX
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Call the upload callback if provided
        if (onUpload) {
          await onUpload(file);
        }
      }
    },
    [onUpload]
  );

  const handleClick = () => {
    if (!isLoading) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isLoading) return;

    // Call the remove callback if provided
    if (onRemove) {
      await onRemove();
    }

    // Clear preview and input
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileChange(file);
    }
  };

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Avatar Preview */}
      <div className="relative group">
        <div
          className={cn(
            'relative rounded-full overflow-hidden border-4 transition-all duration-200 cursor-pointer',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}>
          <Avatar className="h-32 w-32">
            <AvatarImage src={preview || currentAvatar || undefined} alt={userName} />
            <AvatarFallback className="text-2xl font-semibold bg-primary text-primary-foreground">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>

          {/* Overlay */}
          <div
            className={cn(
              'absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-200',
              isLoading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            )}>
            {isLoading ? (
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            ) : (
              <Camera className="h-8 w-8 text-white" />
            )}
          </div>
        </div>

        {/* Remove button */}
        {preview && !isLoading && (
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg flex items-center justify-center transition-colors duration-200 z-10"
            type="button">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Upload Button */}
      <div className="flex flex-col items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={isLoading}
          className="disabled:opacity-50">
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {isLoading ? 'Uploading...' : 'Upload Photo'}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          JPG, PNG or GIF. Max size 5MB.
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileChange(file);
          }
        }}
      />
    </div>
  );
}

