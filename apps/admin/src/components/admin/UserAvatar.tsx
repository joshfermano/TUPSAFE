import { memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

/**
 * Size configuration for UserAvatar
 */
const sizeConfig = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
} as const;

export type AvatarSize = keyof typeof sizeConfig;

interface User {
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** Optional avatar image URL */
  avatarUrl?: string | null;
}

interface UserAvatarProps {
  /** User data */
  user: User;
  /** Avatar size */
  size?: AvatarSize;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Generates initials from first and last name
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns Uppercase initials (e.g., "JD" for "John Doe")
 */
function getInitials(firstName: string, lastName: string): string {
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName.charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}`;
}

/**
 * UserAvatar Component
 *
 * Displays a user avatar with automatic fallback to initials.
 * Supports multiple sizes and gracefully handles missing avatar images.
 *
 * @example
 * ```tsx
 * <UserAvatar
 *   user={{ firstName: 'John', lastName: 'Doe', avatarUrl: '/avatar.jpg' }}
 *   size="md"
 * />
 * ```
 */
export const UserAvatar = memo(function UserAvatar({
  user,
  size = 'md',
  className,
}: UserAvatarProps) {
  const initials = getInitials(user.firstName, user.lastName);
  const sizeClass = sizeConfig[size];

  return (
    <Avatar className={cn(sizeClass, className)}>
      {user.avatarUrl && (
        <AvatarImage
          src={user.avatarUrl}
          alt={`${user.firstName} ${user.lastName}`}
        />
      )}
      <AvatarFallback
        className="bg-gradient-to-br from-tup-primary to-tup-secondary text-white font-semibold"
        delayMs={user.avatarUrl ? 600 : 0}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
});

UserAvatar.displayName = 'UserAvatar';
