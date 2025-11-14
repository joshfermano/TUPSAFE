/**
 * Bulk Approve Dialog
 *
 * Dialog for bulk approving multiple submissions with progress tracking
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, FileText, FileSpreadsheet } from 'lucide-react';
import type { SubmissionListItem, BulkApproveResponse } from '@tupsafe/types';

interface BulkApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submissions: SubmissionListItem[];
  onConfirm: (notes?: string) => Promise<BulkApproveResponse>;
}

export function BulkApproveDialog({
  open,
  onOpenChange,
  submissions,
  onConfirm,
}: BulkApproveDialogProps) {
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<BulkApproveResponse | null>(null);

  const pdsCount = submissions.filter((s) => s.type === 'pds').length;
  const salnCount = submissions.filter((s) => s.type === 'saln').length;
  const totalCount = submissions.length;

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const response = await onConfirm(notes || undefined);
      setResults(response);
    } catch (error) {
      console.error('Bulk approve error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setNotes('');
    setResults(null);
    onOpenChange(false);
  };

  const showResults = results !== null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {showResults ? 'Bulk Approval Results' : 'Bulk Approve Submissions'}
          </DialogTitle>
          <DialogDescription>
            {showResults
              ? 'Review the results of the bulk approval operation.'
              : `You are about to approve ${totalCount} submission${totalCount > 1 ? 's' : ''}.`}
          </DialogDescription>
        </DialogHeader>

        {!showResults ? (
          <div className="space-y-4 py-4">
            {/* Submission Summary */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Selected Submissions</h4>
                <Badge variant="secondary">{totalCount} total</Badge>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span>{pdsCount} PDS</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-purple-600" />
                  <span>{salnCount} SALN</span>
                </div>
              </div>
            </div>

            {/* Preview List (first 10) */}
            <div className="space-y-2">
              <Label>Submissions to Approve</Label>
              <ScrollArea className="h-[200px] rounded-md border p-4">
                <div className="space-y-2">
                  {submissions.slice(0, 10).map((submission) => (
                    <div
                      key={submission.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-3">
                        {submission.type === 'pds' ? (
                          <FileText className="h-4 w-4 text-blue-600" />
                        ) : (
                          <FileSpreadsheet className="h-4 w-4 text-purple-600" />
                        )}
                        <div>
                          <div className="font-medium text-sm">
                            {submission.employee.firstName} {submission.employee.lastName}
                          </div>
                          {submission.employee.employeeId && (
                            <div className="text-xs text-muted-foreground">
                              {submission.employee.employeeId}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant={submission.type === 'pds' ? 'default' : 'secondary'}>
                        {submission.type.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                  {totalCount > 10 && (
                    <div className="text-sm text-muted-foreground text-center py-2 border-t">
                      +{totalCount - 10} more submission{totalCount - 10 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Bulk Notes */}
            <div className="space-y-2">
              <Label htmlFor="bulk-notes">
                Bulk Approval Notes <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Textarea
                id="bulk-notes"
                placeholder="Add notes that will apply to all approved submissions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={1000}
                disabled={isProcessing}
              />
              <div className="text-xs text-muted-foreground text-right">
                {notes.length}/1000
              </div>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <Label>Processing...</Label>
                <Progress value={undefined} className="w-full" />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Results Summary */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Summary</h4>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{results.summary.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {results.summary.approved}
                  </div>
                  <div className="text-sm text-muted-foreground">Approved</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {results.summary.failed}
                  </div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="space-y-2">
              <Label>Detailed Results</Label>
              <ScrollArea className="h-[300px] rounded-md border p-4">
                <div className="space-y-2">
                  {results.results.map((result) => {
                    const submission = submissions.find((s) => s.id === result.id);
                    const isSuccess = result.status === 'approved';

                    return (
                      <div
                        key={result.id}
                        className={`flex items-center justify-between py-2 px-3 rounded-md ${
                          isSuccess
                            ? 'bg-green-50 dark:bg-green-950'
                            : 'bg-red-50 dark:bg-red-950'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isSuccess ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <div>
                            <div className="font-medium text-sm">
                              {submission?.employee.firstName} {submission?.employee.lastName}
                            </div>
                            {result.error && (
                              <div className="text-xs text-red-600">{result.error}</div>
                            )}
                          </div>
                        </div>
                        <Badge variant={result.type === 'pds' ? 'default' : 'secondary'}>
                          {result.type.toUpperCase()}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        <DialogFooter>
          {!showResults ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isProcessing || totalCount === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing
                  ? 'Approving...'
                  : `Approve ${totalCount} Submission${totalCount > 1 ? 's' : ''}`}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
