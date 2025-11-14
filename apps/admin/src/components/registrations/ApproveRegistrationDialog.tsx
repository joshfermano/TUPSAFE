/**
 * Approve Registration Dialog
 *
 * Confirmation dialog for approving a pending registration with optional overrides.
 * Allows setting role, department, position, and admin notes.
 */

'use client';

import { useState } from 'react';
import { CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useApproveRegistration } from '@/hooks/useRegistrations';
import type { Registration } from '@/lib/api/registrations';

interface ApproveRegistrationDialogProps {
  registration: Registration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments?: Array<{ id: string; name: string }>;
  positions?: Array<{ id: string; title: string }>;
}

export function ApproveRegistrationDialog({
  registration,
  open,
  onOpenChange,
  departments = [],
  positions = [],
}: ApproveRegistrationDialogProps) {
  const approveMutation = useApproveRegistration();

  const [role, setRole] = useState<string>('employee');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [positionId, setPositionId] = useState<string>('');
  const [notes, setNotes] = useState('');

  const handleApprove = async () => {
    if (!registration) return;

    const data: any = {
      notes: notes || undefined,
      sendWelcomeEmail: true,
    };

    // Only send overrides if changed from defaults
    if (registration.userType === 'employee') {
      if (role && role !== 'employee') {
        data.role = role;
      }
      if (departmentId) {
        data.assignedDepartmentId = departmentId;
      }
      if (positionId) {
        data.assignedPositionId = positionId;
      }
    }

    approveMutation.mutate(
      { id: registration.id, data },
      {
        onSuccess: () => {
          onOpenChange(false);
          // Reset form
          setRole('employee');
          setDepartmentId('');
          setPositionId('');
          setNotes('');
        },
      }
    );
  };

  if (!registration) return null;

  const fullName = [registration.firstName, registration.middleName, registration.lastName]
    .filter(Boolean)
    .join(' ');

  const isEmployee = registration.userType === 'employee';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Approve Registration
          </AlertDialogTitle>
          <AlertDialogDescription>
            You are about to approve the registration request for{' '}
            <strong>{fullName}</strong>. This action will:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* User Details */}
          <div className="bg-muted p-4 rounded-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Applicant Name:</span>
              <span className="text-sm">{fullName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm">{registration.email || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">User Type:</span>
              <Badge
                variant={isEmployee ? 'default' : 'secondary'}
                className={
                  isEmployee
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-orange-100 text-orange-800'
                }
              >
                {isEmployee ? 'Employee' : 'Applicant'}
              </Badge>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md flex gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <strong>Important:</strong> Approving this registration will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Create an active user account</li>
                <li>
                  Generate a temporary password and send welcome email to{' '}
                  {registration.email}
                </li>
                {isEmployee && <li>Assign an employee ID</li>}
                {!isEmployee && <li>Assign an applicant ID</li>}
                <li>Grant access to the respective portal</li>
              </ul>
            </div>
          </div>

          <Separator />

          {/* Optional Overrides (for Employees only) */}
          {isEmployee && (
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Optional Overrides</h4>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="role">Role Assignment</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="hr">HR Personnel</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="auditor">Auditor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Department Override */}
              {departments.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="department">Department (Override)</Label>
                  <Select value={departmentId} onValueChange={setDepartmentId}>
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Keep current or select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Keep Current</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Position Override */}
              {positions.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="position">Position (Override)</Label>
                  <Select value={positionId} onValueChange={setPositionId}>
                    <SelectTrigger id="position">
                      <SelectValue placeholder="Keep current or select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Keep Current</SelectItem>
                      {positions.map((pos) => (
                        <SelectItem key={pos.id} value={pos.id}>
                          {pos.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Admin Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Admin Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this approval..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">
              {notes.length}/500 characters
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={approveMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleApprove}
            disabled={approveMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {approveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Registration
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
