/**
 * Type definitions for Skeleton Components
 *
 * These types provide better IDE support and type safety
 * when using skeleton components throughout the application.
 */

/**
 * Base props shared by all skeleton components
 */
export interface BaseSkeletonProps {
  /**
   * Additional CSS classes to apply to the skeleton
   */
  className?: string;
}

/**
 * Props for CardSkeleton component
 */
export interface CardSkeletonProps extends BaseSkeletonProps {
  /**
   * Number of content rows to display
   * @default 3
   */
  rows?: number;

  /**
   * Whether to show an image/icon placeholder at the top
   * @default false
   */
  hasImage?: boolean;

  /**
   * Whether to show footer section
   * @default false
   */
  hasFooter?: boolean;

  /**
   * Number of cards to render
   * @default 1
   */
  count?: number;
}

/**
 * Props for CardSkeletonGrid component
 */
export interface CardSkeletonGridProps extends Omit<CardSkeletonProps, 'count'> {
  /**
   * Number of cards to display in the grid
   * @default 3
   */
  count?: number;

  /**
   * Number of columns in the grid (1-4)
   * @default 3
   */
  columns?: 1 | 2 | 3 | 4;
}

/**
 * Props for TableSkeleton component
 */
export interface TableSkeletonProps extends BaseSkeletonProps {
  /**
   * Number of columns to display
   * @default 5
   */
  columns?: number;

  /**
   * Number of rows to display
   * @default 5
   */
  rows?: number;

  /**
   * Whether to show action buttons column
   * @default false
   */
  hasActions?: boolean;

  /**
   * Whether to show checkboxes column
   * @default false
   */
  hasCheckboxes?: boolean;

  /**
   * Whether to show pagination
   * @default true
   */
  hasPagination?: boolean;
}

/**
 * Props for ListSkeleton component
 */
export interface ListSkeletonProps extends BaseSkeletonProps {
  /**
   * Number of list items to display
   * @default 5
   */
  rows?: number;
}

/**
 * Props for DataTableSkeleton component
 */
export interface DataTableSkeletonProps {
  /**
   * Number of columns to display
   * @default 5
   */
  columns?: number;

  /**
   * Number of rows to display
   * @default 8
   */
  rows?: number;

  /**
   * Whether to show action buttons column
   * @default true
   */
  hasActions?: boolean;
}

/**
 * Layout options for FormSkeleton
 */
export type FormLayout = 'single' | 'two-column' | 'mixed';

/**
 * Props for FormSkeleton component
 */
export interface FormSkeletonProps extends BaseSkeletonProps {
  /**
   * Number of input fields to display
   * @default 5
   */
  fields?: number;

  /**
   * Whether to show section headers
   * @default false
   */
  hasSections?: boolean;

  /**
   * Whether to show form actions (buttons)
   * @default true
   */
  hasActions?: boolean;

  /**
   * Layout style for the form
   * @default 'single'
   */
  layout?: FormLayout;
}

/**
 * Props for MultiStepFormSkeleton component
 */
export interface MultiStepFormSkeletonProps {
  /**
   * Number of steps in the form
   * @default 4
   */
  steps?: number;

  /**
   * Number of fields per step
   * @default 5
   */
  fieldsPerStep?: number;
}

/**
 * Props for CompactFormSkeleton component
 */
export interface CompactFormSkeletonProps {
  /**
   * Number of input fields to display
   * @default 3
   */
  fields?: number;
}

/**
 * Animation speed options
 */
export type AnimationSpeed = 'fast' | 'normal' | 'slow';

/**
 * Common skeleton variant types
 */
export type SkeletonVariant = 'default' | 'compact' | 'detailed';

/**
 * Skeleton loading state
 */
export interface SkeletonLoadingState {
  /**
   * Whether the skeleton should be displayed
   */
  isLoading: boolean;

  /**
   * Optional delay before showing skeleton (prevents flash)
   */
  delay?: number;

  /**
   * Minimum time to display skeleton
   */
  minDisplayTime?: number;
}

/**
 * Configuration for skeleton animations
 */
export interface SkeletonAnimationConfig {
  /**
   * Animation speed
   * @default 'normal'
   */
  speed?: AnimationSpeed;

  /**
   * Whether to use shimmer effect
   * @default true
   */
  useShimmer?: boolean;

  /**
   * Whether to use pulse effect
   * @default true
   */
  usePulse?: boolean;
}

/**
 * Skeleton theme configuration
 */
export interface SkeletonTheme {
  /**
   * Base background color
   */
  baseColor?: string;

  /**
   * Skeleton element color
   */
  highlightColor?: string;

  /**
   * Border color
   */
  borderColor?: string;

  /**
   * Border radius
   */
  borderRadius?: string;
}

/**
 * Utility type for skeleton component variants
 */
export type SkeletonComponent<T = Record<string, never>> = React.FC<T>;

/**
 * Skeleton component collection
 */
export interface SkeletonComponents {
  Dashboard: SkeletonComponent;
  Profile: SkeletonComponent;
  Card: SkeletonComponent<CardSkeletonProps>;
  CardGrid: SkeletonComponent<CardSkeletonGridProps>;
  CardList: SkeletonComponent<CardSkeletonProps>;
  Table: SkeletonComponent<TableSkeletonProps>;
  List: SkeletonComponent<ListSkeletonProps>;
  DataTable: SkeletonComponent<DataTableSkeletonProps>;
  Form: SkeletonComponent<FormSkeletonProps>;
  MultiStepForm: SkeletonComponent<MultiStepFormSkeletonProps>;
  CompactForm: SkeletonComponent<CompactFormSkeletonProps>;
  AuthForm: SkeletonComponent;
}

/**
 * Hook return type for skeleton loading state
 */
export interface UseSkeletonReturn {
  /**
   * Whether to show the skeleton
   */
  showSkeleton: boolean;

  /**
   * Function to manually set skeleton visibility
   */
  setShowSkeleton: (show: boolean) => void;
}

/**
 * Options for useSkeleton hook
 */
export interface UseSkeletonOptions {
  /**
   * Loading state from React Query or other data fetching
   */
  isLoading: boolean;

  /**
   * Minimum time to show skeleton (ms)
   * @default 300
   */
  minDisplayTime?: number;

  /**
   * Delay before showing skeleton (ms)
   * @default 0
   */
  delay?: number;
}
