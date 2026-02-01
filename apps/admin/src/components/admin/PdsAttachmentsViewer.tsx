'use client';

/**
 * PDS Attachments Viewer Component
 *
 * Displays civil service eligibilities and training/seminars with their attachments
 * for a specific PDS submission. Used in admin user detail page.
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
  ChevronDown,
  ChevronRight,
  Award,
  BookOpen,
  Paperclip,
  Calendar,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { PDSSubmissionDetail, PdsAttachment } from '@tupsafe/types';

interface PdsSubmissionListItem {
  id: string;
  status: string;
  year?: number;
  submittedAt: Date | string | null;
}

interface PdsAttachmentsViewerProps {
  userId: string;
  submissions: PdsSubmissionListItem[];
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

function AttachmentChip({ attachment }: { attachment: PdsAttachment }) {
  const isImage = isImageFile(attachment.mimeType || '');
  const [showPreview, setShowPreview] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/50 text-sm">
        {isImage ? (
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
        ) : (
          <FileText className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="flex-1 truncate max-w-[150px]" title={attachment.fileName}>
          {attachment.fileName}
        </span>
        {attachment.sizeBytes !== undefined && (
          <span className="text-xs text-muted-foreground">
            {formatFileSize(attachment.sizeBytes)}
          </span>
        )}
        <div className="flex items-center gap-1">
          {isImage && attachment.fileUrl && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowPreview(true)}
              title="Preview"
            >
              <Eye className="h-3 w-3" />
            </Button>
          )}
          {attachment.fileUrl && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              asChild
            >
              <a
                href={attachment.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Download"
              >
                <Download className="h-3 w-3" />
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {showPreview && attachment.fileUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setShowPreview(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 text-white dark:text-white hover:bg-white/20 dark:hover:bg-white/20"
              onClick={() => setShowPreview(false)}
            >
              ✕
            </Button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachment.fileUrl}
              alt={attachment.fileName}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
}

export function PdsAttachmentsViewer({
  userId,
  submissions,
}: PdsAttachmentsViewerProps) {
  // Get unique years from submissions (excluding drafts)
  const years = useMemo(() => {
    const yearSet = new Set<number>();
    submissions
      .filter((s) => s.status !== 'draft' && s.year)
      .forEach((s) => {
        if (s.year) yearSet.add(s.year);
      });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [submissions]);

  const [selectedYear, setSelectedYear] = useState<number | null>(
    years.length > 0 ? years[0] : null
  );

  // Find the latest non-draft submission for the selected year
  const selectedSubmission = useMemo(() => {
    if (!selectedYear) return null;
    return submissions.find(
      (s) => s.year === selectedYear && s.status !== 'draft'
    );
  }, [submissions, selectedYear]);

  // Fetch full PDS details for the selected submission
  const { data: pdsDetail, isLoading } = useQuery<PDSSubmissionDetail>({
    queryKey: ['pds-submission-detail', selectedSubmission?.id],
    queryFn: async () => {
      if (!selectedSubmission?.id) throw new Error('No submission selected');
      const res = await fetch(`/api/submissions/pds/${selectedSubmission.id}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch PDS details');
      }
      return res.json();
    },
    enabled: !!selectedSubmission?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter civil service entries with attachments
  const civilServiceWithAttachments = useMemo(() => {
    if (!pdsDetail?.pdsData?.civilService) return [];
    return pdsDetail.pdsData.civilService.filter(
      (cs) => cs.attachments && cs.attachments.length > 0
    );
  }, [pdsDetail]);

  // Filter training entries with attachments
  const trainingWithAttachments = useMemo(() => {
    if (!pdsDetail?.pdsData?.training) return [];
    return pdsDetail.pdsData.training.filter(
      (t) => t.attachments && t.attachments.length > 0
    );
  }, [pdsDetail]);

  // Total attachment count
  const totalAttachments = useMemo(() => {
    let count = 0;
    pdsDetail?.pdsData?.civilService?.forEach((cs) => {
      count += cs.attachments?.length || 0;
    });
    pdsDetail?.pdsData?.training?.forEach((t) => {
      count += t.attachments?.length || 0;
    });
    return count;
  }, [pdsDetail]);

  if (years.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Seminars & Certifications
          </CardTitle>
          <CardDescription>
            No submitted PDS found. Attachments are only available for submitted PDS.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
              Seminars & Certifications
            </CardTitle>
            <CardDescription>
              Training certificates and civil service eligibility documents
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedYear?.toString() || ''}
              onValueChange={(v) => setSelectedYear(parseInt(v, 10))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading...</span>
          </div>
        ) : !pdsDetail ? (
          <div className="text-center py-8 text-muted-foreground">
            Select a year to view attachments
          </div>
        ) : totalAttachments === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No attachments found for {selectedYear}
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {/* Civil Service Eligibilities */}
            {civilServiceWithAttachments.length > 0 && (
              <AccordionItem value="civil-service" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    <span>Civil Service Eligibilities</span>
                    <Badge variant="secondary" className="ml-2">
                      {civilServiceWithAttachments.reduce(
                        (acc, cs) => acc + (cs.attachments?.length || 0),
                        0
                      )}{' '}
                      attachments
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    {civilServiceWithAttachments.map((cs, idx) => (
                      <div
                        key={cs.id || idx}
                        className="border-l-2 border-primary/20 pl-4 space-y-2"
                      >
                        <div className="font-medium">
                          {cs.careerService || 'Unnamed Eligibility'}
                        </div>
                        {cs.dateOfExamination && (
                          <div className="text-sm text-muted-foreground">
                            Exam Date:{' '}
                            {format(new Date(cs.dateOfExamination), 'MMM d, yyyy')}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {cs.attachments?.map((att) => (
                            <AttachmentChip key={att.id} attachment={att} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Training/Seminars */}
            {trainingWithAttachments.length > 0 && (
              <AccordionItem value="training" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span>Training & Seminars</span>
                    <Badge variant="secondary" className="ml-2">
                      {trainingWithAttachments.reduce(
                        (acc, t) => acc + (t.attachments?.length || 0),
                        0
                      )}{' '}
                      attachments
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    {trainingWithAttachments.map((t, idx) => (
                      <div
                        key={t.id || idx}
                        className="border-l-2 border-primary/20 pl-4 space-y-2"
                      >
                        <div className="font-medium">
                          {t.title || 'Unnamed Training'}
                        </div>
                        {t.dateFrom && t.dateTo && (
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(t.dateFrom), 'MMM d, yyyy')} -{' '}
                            {format(new Date(t.dateTo), 'MMM d, yyyy')}
                            {t.hours && ` (${t.hours} hours)`}
                          </div>
                        )}
                        {t.conductedBy && (
                          <div className="text-sm text-muted-foreground">
                            Conducted by: {t.conductedBy}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {t.attachments?.map((att) => (
                            <AttachmentChip key={att.id} attachment={att} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}

