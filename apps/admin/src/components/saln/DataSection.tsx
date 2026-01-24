'use client';

import * as React from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface DataSectionProps {
  icon: LucideIcon;
  title: string;
  badge?: number | string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function DataSection({
  icon: Icon,
  title,
  badge,
  defaultOpen = true,
  children,
  className,
}: DataSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <Card className={cn('overflow-visible', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none transition-colors hover:bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardTitle className="text-base">{title}</CardTitle>
                {badge !== undefined && (
                  <Badge variant="secondary" className="ml-2">
                    {badge}
                  </Badge>
                )}
              </div>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">{children}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
