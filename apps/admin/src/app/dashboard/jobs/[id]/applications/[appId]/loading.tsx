/**
 * Application Review Loading State
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ApplicationReviewLoading() {
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" disabled>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Position
      </Button>

      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-[250px]" />
          <Skeleton className="h-5 w-[200px]" />
        </div>
        <Skeleton className="h-10 w-[130px]" />
      </div>

      {/* Application Summary Card Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <Skeleton className="h-6 w-[200px]" />
              <Skeleton className="h-6 w-[150px]" />
            </div>
            <Skeleton className="h-6 w-[100px]" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[180px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs Skeleton */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[130px]" />
          <Skeleton className="h-10 w-[130px]" />
          <Skeleton className="h-10 w-[150px]" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-3 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[150px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
