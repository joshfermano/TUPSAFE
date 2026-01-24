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
  /**
   * Badge to display next to the title.
   * Can be a number, string (rendered as secondary badge),
   * or a React node for custom badges like ValidationBadge.
   */
  badge?: number | string | React.ReactNode;
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

  // Determine how to render the badge
  const renderBadge = () => {
    if (badge === undefined || badge === null) return null;

    // If it's a React element (like our ValidationBadge), render it directly
    if (React.isValidElement(badge)) {
      return <div className="ml-2">{badge}</div>;
    }

    // Otherwise, render as a secondary badge
    return (
      <Badge variant="secondary" className="ml-2">
        {badge}
      </Badge>
    );
  };

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
                {renderBadge()}
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
