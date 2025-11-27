/**
 * Update Application Status Dialog
 *
 * Dialog for updating job application status with conditional fields
 */

'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { updateApplicationStatusSchema, type UpdateApplicationStatusData, type ApplicationStatus } from '@tupsafe/types';

interface UpdateStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: {
    id: string;
    applicationNumber: string;
    applicantName: string;
    positionTitle: string;
    currentStatus: ApplicationStatus;
  } | null;
  onSubmit: (data: UpdateApplicationStatusData) => void;
  isLoading?: boolean;
}

export function UpdateStatusDialog({
  open,
  onOpenChange,
  application,
  onSubmit,
  isLoading,
}: UpdateStatusDialogProps) {
  const form = useForm<UpdateApplicationStatusData>({
    resolver: zodResolver(updateApplicationStatusSchema),
    defaultValues: {
      status: 'pending',
      notes: '',
      interviewDate: undefined,
      interviewLocation: '',
      interviewNotes: '',
      rejectionReason: '',
      finalDecision: '',
    },
  });

  const selectedStatus = form.watch('status');

  // Reset form when dialog opens with new application
  useEffect(() => {
    if (application && open) {
      form.reset({
        status: application.currentStatus,
        notes: '',
        interviewDate: undefined,
        interviewLocation: '',
        interviewNotes: '',
        rejectionReason: '',
        finalDecision: '',
      });
    }
  }, [application, open, form]);

  const handleSubmit = (data: UpdateApplicationStatusData) => {
    onSubmit(data);
  };

  if (!application) return null;

  const showInterviewFields = selectedStatus === 'for_interview' || selectedStatus === 'interviewed';
  const showRejectionField = selectedStatus === 'rejected';
  const showFinalDecisionField = selectedStatus === 'accepted' || selectedStatus === 'hired';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Application Status</DialogTitle>
          <DialogDescription>
            Update the status for {application.applicantName}&apos;s application
          </DialogDescription>
        </DialogHeader>

        {/* Application Details */}
        <div className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{application.applicantName}</div>
              <div className="text-sm text-muted-foreground">{application.positionTitle}</div>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {application.applicationNumber}
            </Badge>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Status Selection */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Status *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="shortlisted">Shortlisted</SelectItem>
                      <SelectItem value="for_interview">For Interview</SelectItem>
                      <SelectItem value="interviewed">Interviewed</SelectItem>
                      <SelectItem value="for_final_review">For Final Review</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="withdrawn">Withdrawn</SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* General Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes about this status change..."
                      rows={3}
                      maxLength={1000}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0}/1000 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Interview Fields (conditional) */}
            {showInterviewFields && (
              <>
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      Interview scheduling information is required for this status
                    </p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="interviewDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Interview Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interviewLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interview Location</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Room 301, Main Building"
                          maxLength={500}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interviewNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interview Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional interview details or instructions..."
                          rows={3}
                          maxLength={1000}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Rejection Reason (conditional) */}
            {showRejectionField && (
              <>
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                    <p className="text-sm text-red-800 dark:text-red-300">
                      A rejection reason is required and will be communicated to the applicant
                    </p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="rejectionReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rejection Reason *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a professional reason for rejection..."
                          rows={4}
                          maxLength={1000}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum 20 characters. Be professional and constructive.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Final Decision (conditional) */}
            {showFinalDecisionField && (
              <>
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                    <p className="text-sm text-green-800 dark:text-green-300">
                      {selectedStatus === 'hired'
                        ? 'Applicant will be marked for employee conversion'
                        : 'Offer details will be communicated to the applicant'}
                    </p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="finalDecision"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Final Decision Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes about the decision..."
                          rows={3}
                          maxLength={500}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Status'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
