'use client';

import { useState, useRef, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface AvatarUploadProps {
  currentAvatar?: string;
  userName?: string;
  onAvatarChange?: (file: File | null) => void;
  className?: string;
}

export function AvatarUpload({
  currentAvatar,
  userName = 'User',
  onAvatarChange,
  className,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get user initials for fallback
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleFileChange = useCallback(
    (file: File | null) => {
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

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Notify parent component
        onAvatarChange?.(file);
      }
    },
    [onAvatarChange]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onAvatarChange?.(null);
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
      <motion.div
        className="relative group"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div
          className={cn(
            'relative rounded-full overflow-hidden border-4 transition-all duration-200',
            isDragging
              ? 'border-red-500 bg-red-500/5'
              : 'border-slate-200 dark:border-slate-700',
            'hover:border-red-500/50 dark:hover:border-red-500/50'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Avatar className="h-32 w-32">
            <AvatarImage src={preview || currentAvatar} alt={userName} />
            <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-red-700 to-red-800 text-white">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>

          {/* Overlay on hover */}
          <motion.div
            className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            onClick={handleClick}
          >
            <Camera className="h-8 w-8 text-white" />
          </motion.div>
        </div>

        {/* Remove button */}
        <AnimatePresence>
          {preview && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={handleRemove}
              className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg flex items-center justify-center transition-colors duration-200 z-10"
              type="button"
            >
              <X className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Upload Button */}
      <div className="flex flex-col items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClick}
          className="border-red-700 text-red-500 hover:bg-red-500/5 dark:border-red-600 dark:text-red-600 dark:hover:bg-red-600/10"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Photo
        </Button>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
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
