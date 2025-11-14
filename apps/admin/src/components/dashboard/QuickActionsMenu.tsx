/**
 * Quick Actions Menu
 *
 * Floating action menu for common dashboard actions
 */

'use client';

import { Users, FileText, Download, Activity, Settings, UserCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface QuickAction {
  label: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  variant?: 'default' | 'outline';
}

const quickActions: QuickAction[] = [
  {
    label: 'Review Registrations',
    description: 'Approve pending user registrations',
    icon: <UserCheck className="h-4 w-4" />,
    href: '/dashboard/registrations',
    variant: 'default',
  },
  {
    label: 'Review Submissions',
    description: 'Check PDS and SALN submissions',
    icon: <FileText className="h-4 w-4" />,
    href: '/dashboard/submissions',
    variant: 'default',
  },
  {
    label: 'Manage Users',
    description: 'View and edit user accounts',
    icon: <Users className="h-4 w-4" />,
    href: '/dashboard/users',
    variant: 'outline',
  },
  {
    label: 'Export Reports',
    description: 'Download compliance reports',
    icon: <Download className="h-4 w-4" />,
    href: '/dashboard/reports',
    variant: 'outline',
  },
  {
    label: 'Activity Log',
    description: 'View system audit trail',
    icon: <Activity className="h-4 w-4" />,
    href: '/dashboard/audit-logs',
    variant: 'outline',
  },
  {
    label: 'Settings',
    description: 'Configure system settings',
    icon: <Settings className="h-4 w-4" />,
    href: '/dashboard/settings',
    variant: 'outline',
  },
];

export function QuickActionsMenu() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common administrative tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2">
          {quickActions.map((action) => (
            <Button
              key={action.href}
              variant={action.variant || 'outline'}
              className="h-auto justify-start p-4"
              asChild>
              <Link href={action.href}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">{action.icon}</div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{action.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
