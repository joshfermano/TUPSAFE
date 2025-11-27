/**
 * Job Details Loading State
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function JobDetailsLoading() {
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" disabled>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Jobs
      </Button>

      {/* Position Details Card Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <Skeleton className="h-8 w-[300px]" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-[80px]" />
                <Skeleton className="h-6 w-[100px]" />
                <Skeleton className="h-6 w-[90px]" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-[80px]" />
              <Skeleton className="h-10 w-[140px]" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Stats Skeleton */}
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[60px]" />
                  <Skeleton className="h-3 w-[80px]" />
                </div>
              </div>
            ))}
          </div>

          {/* Tabs Skeleton */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-10 w-[120px]" />
              <Skeleton className="h-10 w-[120px]" />
              <Skeleton className="h-10 w-[120px]" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-6 w-[200px]" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications Section Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-[150px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
            <Skeleton className="h-9 w-[150px]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
