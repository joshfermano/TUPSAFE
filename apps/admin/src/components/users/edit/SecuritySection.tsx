'use client';

import { KeyRound, Mail } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SecuritySectionProps {
  userName: string;
  userEmail?: string;
  onResetPassword: () => void;
}

export function SecuritySection({
  userName,
  userEmail,
  onResetPassword,
}: SecuritySectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Security</CardTitle>
        </div>
        <CardDescription>Manage authentication and credentials</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-1">
            <p className="text-base font-medium">Password Reset</p>
            <p className="text-sm text-muted-foreground">
              Generate a new temporary password for {userName}
            </p>
            {userEmail && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                {userEmail}
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onResetPassword}
          >
            Reset Password
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
