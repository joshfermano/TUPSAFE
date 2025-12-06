'use client';

/**
 * Shared Array Item Header Component
 * Reusable header with remove button for all array items
 *
 * Features:
 * - Consistent numbering display
 * - Standardized remove button styling
 * - Conditional removal based on minimum requirements
 */

import React from 'react';
import { Button } from '../../ui/button';
import { X } from 'lucide-react';

interface ArrayItemHeaderProps {
  title: string;
  index: number;
  onRemove: () => void;
  canRemove?: boolean;
}

export const ArrayItemHeader: React.FC<ArrayItemHeaderProps> = ({
  title,
  index,
  onRemove,
  canRemove = true,
}) => {
  return (
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
          {index + 1}
        </div>
        <p className="text-sm font-medium">
          {title} #{index + 1}
        </p>
      </div>
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
