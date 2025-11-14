/**
 * Bulk Approve Dialog
 *
 * Dialog for bulk approving multiple registrations with progress tracking.
 * Shows individual success/failure feedback and summary after completion.
 */

'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Loader2, AlertTriangle, X } from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBulkApproveRegistrations } from '@/hooks/useRegistrations';
import type { Registration } from '@/lib/api/registrations';

interface BulkApproveDialogProps {
  registrations: Registration[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BulkApproveDialog({
  registrations,
  open,
  onOpenChange,
  onSuccess,
}: BulkApproveDialogProps) {
  const bulkApproveMutation = useBulkApproveRegistrations();

  const [defaultRole, setDefaultRole] = useState<string>('employee');
  const [notes, setNotes] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setDefaultRole('employee');
      setNotes('');
      setShowResults(false);
    }
  }, [open]);

  const handleBulkApprove = async () => {
    if (registrations.length === 0) return;

    const registrationIds = registrations.map((r) => r.id);

    bulkApproveMutation.mutate(
      {
        registrationIds,
        defaultRole: defaultRole as any,
        notes: notes || undefined,
        sendWelcomeEmails: true,
      },
      {
        onSuccess: (data) => {
          setShowResults(true);
          onSuccess?.();
        },
      }
    );
  };

  const employeeRegistrations = registrations.filter((r) => r.userType === 'employee');
  const applicantRegistrations = registrations.filter((r) => r.userType === 'applicant');

  const results = bulkApproveMutation.data?.results || [];
  const summary = bulkApproveMutation.data?.summary;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-3xl max-h-[90vh]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Bulk Approve Registrations
          </AlertDialogTitle>
          <AlertDialogDescription>
            You are about to approve {registrations.length} registration
            {registrations.length !== 1 ? 's' : ''}.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-4">
            {!showResults ? (
              <>
                {/* Summary */}
                <div className="bg-muted p-4 rounded-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Selected:</span>
                    <Badge variant="secondary" className="text-base">
                      {registrations.length}
                    </Badge>
                  </div>
                  {employeeRegistrations.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Employees:</span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {employeeRegistrations.length}
                      </Badge>
                    </div>
                  )}
                  {applicantRegistrations.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Applicants:</span>
                      <Badge className="bg-orange-100 text-orange-800">
                        {applicantRegistrations.length}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Warning */}
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <strong>Bulk Action:</strong> All selected registrations will be
                    processed simultaneously. Each will receive a welcome email with
                    login credentials.
                  </div>
                </div>

                {/* Selected Registrations List */}
                <div className="space-y-2">
                  <Label>Selected Registrations:</Label>
                  <ScrollArea className="h-48 border rounded-md p-4">
                    <div className="space-y-2">
                      {registrations.map((reg) => {
                        const fullName = [
                          reg.firstName,
                          reg.middleName,
                          reg.lastName,
                        ]
                          .filter(Boolean)
                          .join(' ');
                        return (
                          <div
                            key={reg.id}
                            className="flex items-center justify-between text-sm p-2 bg-muted rounded"
                          >
                            <span>{fullName}</span>
                            <Badge
                              variant={
                                reg.userType === 'employee' ? 'default' : 'secondary'
                              }
                              className={
                                reg.userType === 'employee'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-orange-100 text-orange-800'
                              }
                            >
                              {reg.userType === 'employee' ? 'Employee' : 'Applicant'}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>

                {/* Default Role Selection (for employees) */}
                {employeeRegistrations.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="defaultRole">
                      Default Role (for Employees)
                    </Label>
                    <Select value={defaultRole} onValueChange={setDefaultRole}>
                      <SelectTrigger id="defaultRole">
                        <SelectValue placeholder="Select default role" />
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
                )}

                {/* Bulk Notes */}
                <div className="space-y-2">
                  <Label htmlFor="bulkNotes">
                    Bulk Notes{' '}
                    <span className="text-muted-foreground font-normal">
                      (Optional)
                    </span>
                  </Label>
                  <Textarea
                    id="bulkNotes"
                    placeholder="Add notes that will be applied to all approvals..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {notes.length}/500 characters
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Results Display */}
                <div className="space-y-4">
                  {/* Summary */}
                  {summary && (
                    <div className="bg-muted p-4 rounded-md space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Processed:</span>
                        <Badge variant="secondary">{summary.total}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Successful:</span>
                        <Badge className="bg-green-100 text-green-800">
                          {summary.successful}
                        </Badge>
                      </div>
                      {summary.failed > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Failed:</span>
                          <Badge className="bg-red-100 text-red-800">
                            {summary.failed}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Individual Results */}
                  <div className="space-y-2">
                    <Label>Individual Results:</Label>
                    <ScrollArea className="h-64 border rounded-md p-4">
                      <div className="space-y-2">
                        {results.map((result, index) => (
                          <div
                            key={index}
                            className={`flex items-center justify-between text-sm p-3 rounded ${
                              result.status === 'approved'
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-red-50 border border-red-200'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="font-medium">{result.email}</div>
                              {result.error && (
                                <div className="text-xs text-red-600 mt-1">
                                  Error: {result.error}
                                </div>
                              )}
                            </div>
                            <Badge
                              variant="secondary"
                              className={
                                result.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }
                            >
                              {result.status === 'approved' ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approved
                                </>
                              ) : (
                                <>
                                  <X className="h-3 w-3 mr-1" />
                                  Failed
                                </>
                              )}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <AlertDialogFooter>
          {!showResults ? (
            <>
              <AlertDialogCancel disabled={bulkApproveMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkApprove}
                disabled={
                  bulkApproveMutation.isPending || registrations.length === 0
                }
                className="bg-green-600 hover:bg-green-700"
              >
                {bulkApproveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve All ({registrations.length})
                  </>
                )}
              </AlertDialogAction>
            </>
          ) : (
            <AlertDialogAction onClick={() => onOpenChange(false)}>
              Close
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
