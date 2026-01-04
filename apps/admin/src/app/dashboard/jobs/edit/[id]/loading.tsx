/**
 * Loading State for Job Edit Page
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditJobLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>

        {/* Main Card Skeleton */}
        <Card className="border-2">
          <CardHeader className="border-b bg-muted/50">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-80 mt-2" />
          </CardHeader>

          <CardContent className="p-0">
            {/* Tabs Skeleton */}
            <div className="border-b">
              <div className="flex gap-2 p-4">
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-28" />
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="p-6 space-y-6">
              <Skeleton className="h-11 w-full" />
              <div className="grid sm:grid-cols-2 gap-6">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </div>
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>

            {/* Actions Skeleton */}
            <div className="border-t bg-muted/50 p-6">
              <div className="flex justify-end gap-3">
                <Skeleton className="h-11 w-24" />
                <Skeleton className="h-11 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
