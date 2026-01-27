'use client';

import { Loader2, Save } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EditUserFormActionsProps {
  isDirty: boolean;
  isUpdating: boolean;
  onCancel: () => void;
}

export function EditUserFormActions({
  isDirty,
  isUpdating,
  onCancel,
}: EditUserFormActionsProps) {
  const canSave = isDirty && !isUpdating;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isUpdating}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={!canSave}
            className={canSave ? '' : 'cursor-not-allowed opacity-50'}
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {isDirty && !isUpdating && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            <p className="text-sm text-muted-foreground">
              You have unsaved changes
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
