'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
  TableFooter,
} from '@/components/ui/table';

/**
 * EnhancedTable - Premium table wrapper with professional animations
 *
 * Built on top of shadcn Table components with added features:
 * - Smooth row hover states with TUP Crimson accent border
 * - Fade-in stagger animation for rows
 * - Better spacing and typography
 * - Enhanced header styles
 * - Respects prefers-reduced-motion
 */

type EnhancedTableProps = React.ComponentProps<typeof Table>;

function EnhancedTable({ className, ...props }: EnhancedTableProps) {
  return (
    <Table
      className={cn('border-separate border-spacing-0', className)}
      {...props}
    />
  );
}

type EnhancedTableHeaderProps = React.ComponentProps<typeof TableHeader>;

function EnhancedTableHeader({ className, ...props }: EnhancedTableHeaderProps) {
  return (
    <TableHeader
      className={cn(
        'bg-muted/50 [&_tr]:border-b-0 sticky top-0 z-10',
        className
      )}
      {...props}
    />
  );
}

type EnhancedTableBodyProps = React.ComponentProps<typeof TableBody>;

function EnhancedTableBody({ className, ...props }: EnhancedTableBodyProps) {
  return (
    <TableBody
      className={cn('[&_tr:last-child]:border-b-0', className)}
      {...props}
    />
  );
}

interface EnhancedTableRowProps extends React.ComponentProps<typeof TableRow> {
  animate?: boolean;
  index?: number;
}

function EnhancedTableRow({
  animate = true,
  index = 0,
  className,
  children,
  ...props
}: EnhancedTableRowProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const baseClassName = cn(
    'group relative border-b transition-all duration-200',
    'hover:bg-muted/50',
    // Left accent border on hover (TUP Crimson)
    'before:absolute before:left-0 before:top-0 before:h-full before:w-0.5',
    'before:bg-primary before:opacity-0 before:transition-opacity before:duration-200',
    'hover:before:opacity-100',
    // Better spacing
    '[&>td]:py-3 [&>td]:px-4',
    className
  );

  // Skip animation if user prefers reduced motion or animation is disabled
  if (prefersReducedMotion || !animate) {
    return (
      <TableRow className={baseClassName} {...props}>
        {children}
      </TableRow>
    );
  }

  // Extract only the props we need for motion.tr
  const { onClick, onMouseEnter, onMouseLeave } = props;

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05, // Stagger delay
        ease: [0.4, 0, 0.2, 1],
      }}
      className={baseClassName}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </motion.tr>
  );
}

type EnhancedTableHeadProps = React.ComponentProps<typeof TableHead>;

function EnhancedTableHead({ className, ...props }: EnhancedTableHeadProps) {
  return (
    <TableHead
      className={cn(
        'h-12 px-4 text-left align-middle font-semibold text-muted-foreground',
        'uppercase text-xs tracking-wider',
        'bg-muted/30',
        'first:rounded-tl-lg last:rounded-tr-lg',
        className
      )}
      {...props}
    />
  );
}

type EnhancedTableCellProps = React.ComponentProps<typeof TableCell>;

function EnhancedTableCell({ className, ...props }: EnhancedTableCellProps) {
  return (
    <TableCell
      className={cn(
        'py-3 px-4 align-middle',
        'text-sm text-foreground',
        className
      )}
      {...props}
    />
  );
}

// Re-export TableCaption and TableFooter without changes
const EnhancedTableCaption = TableCaption;
const EnhancedTableFooter = TableFooter;

export {
  EnhancedTable,
  EnhancedTableHeader,
  EnhancedTableBody,
  EnhancedTableFooter,
  EnhancedTableHead,
  EnhancedTableRow,
  EnhancedTableCell,
  EnhancedTableCaption,
};

// Type exports for convenience
export type {
  EnhancedTableProps,
  EnhancedTableHeaderProps,
  EnhancedTableBodyProps,
  EnhancedTableRowProps,
  EnhancedTableHeadProps,
  EnhancedTableCellProps,
};
