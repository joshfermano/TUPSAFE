/**
 * EnhancedTable Usage Example
 *
 * This file demonstrates how to use the EnhancedTable component
 * with professional animations and enhanced UX.
 */

import {
  EnhancedTable,
  EnhancedTableBody,
  EnhancedTableCell,
  EnhancedTableHead,
  EnhancedTableHeader,
  EnhancedTableRow,
  EnhancedTableCaption,
} from '@/components/admin/EnhancedTable';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Example data type
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  avatar?: string;
}

// Sample data
const sampleUsers: User[] = [
  {
    id: '1',
    name: 'Juan Dela Cruz',
    email: 'juan.delacruz@tup.edu.ph',
    role: 'Faculty',
    status: 'active',
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria.santos@tup.edu.ph',
    role: 'Admin',
    status: 'active',
  },
  {
    id: '3',
    name: 'Pedro Reyes',
    email: 'pedro.reyes@tup.edu.ph',
    role: 'Faculty',
    status: 'pending',
  },
];

export function TableExample() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Enhanced Table Example</h2>

      <EnhancedTable>
        <EnhancedTableCaption>List of TUP Manila users</EnhancedTableCaption>
        <EnhancedTableHeader>
          <EnhancedTableRow>
            <EnhancedTableHead>User</EnhancedTableHead>
            <EnhancedTableHead>Email</EnhancedTableHead>
            <EnhancedTableHead>Role</EnhancedTableHead>
            <EnhancedTableHead>Status</EnhancedTableHead>
          </EnhancedTableRow>
        </EnhancedTableHeader>
        <EnhancedTableBody>
          {sampleUsers.map((user, index) => (
            <EnhancedTableRow key={user.id} index={index}>
              <EnhancedTableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>
                      {user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user.name}</span>
                </div>
              </EnhancedTableCell>
              <EnhancedTableCell className="text-muted-foreground">
                {user.email}
              </EnhancedTableCell>
              <EnhancedTableCell>{user.role}</EnhancedTableCell>
              <EnhancedTableCell>
                <Badge
                  variant={
                    user.status === 'active'
                      ? 'default'
                      : user.status === 'pending'
                        ? 'secondary'
                        : 'destructive'
                  }
                >
                  {user.status}
                </Badge>
              </EnhancedTableCell>
            </EnhancedTableRow>
          ))}
        </EnhancedTableBody>
      </EnhancedTable>
    </div>
  );
}

/**
 * USAGE NOTES:
 *
 * 1. The `index` prop on EnhancedTableRow enables stagger animations
 * 2. Each row will fade in with a slight delay (50ms * index)
 * 3. Hovering over a row shows the TUP Crimson left accent border
 * 4. Animations automatically respect prefers-reduced-motion
 * 5. You can disable animations by passing `animate={false}` to EnhancedTableRow
 *
 * CUSTOMIZATION:
 *
 * - Adjust stagger delay in EnhancedTable.tsx (currently 0.05s)
 * - Customize hover effects via the className prop
 * - Add custom sorting, filtering, or pagination as needed
 */
