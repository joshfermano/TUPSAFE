/**
 * SALN Details Dialog
 *
 * Comprehensive view of SALN submission with year-over-year comparison
 */

'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle, XCircle, TrendingUp, TrendingDown, DollarSign, Building2, Users, Briefcase } from 'lucide-react';
import { useSALNDetails } from '@/hooks/useSubmissions';

interface SALNDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submissionId: string | null;
  onApprove?: () => void;
  onReject?: () => void;
}

export function SALNDetailsDialog({
  open,
  onOpenChange,
  submissionId,
  onApprove,
  onReject,
}: SALNDetailsDialogProps) {
  const { data: salnData, isLoading } = useSALNDetails(submissionId);

  const canApproveReject =
    salnData?.submission.status === 'submitted' ||
    salnData?.submission.status === 'reviewing';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-[300px]" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : salnData ? (
          <>
            {/* Header */}
            <DialogHeader className="px-6 pt-6 pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <DialogTitle className="text-2xl">
                    {salnData.employee.firstName} {salnData.employee.lastName}
                  </DialogTitle>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {salnData.employee.employeeId && (
                      <span>{salnData.employee.employeeId}</span>
                    )}
                    {salnData.employee.department && (
                      <>
                        <span>•</span>
                        <span>{salnData.employee.department.name}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>FY {salnData.submission.fiscalYear}</span>
                  </div>
                </div>
                <Badge
                  variant={
                    salnData.submission.status === 'approved'
                      ? 'default'
                      : salnData.submission.status === 'rejected'
                        ? 'destructive'
                        : 'secondary'
                  }
                >
                  {salnData.submission.status}
                </Badge>
              </div>
            </DialogHeader>

            <Separator />

            {/* Content Tabs */}
            <ScrollArea className="flex-1 px-6">
              <Tabs defaultValue="summary" className="pb-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="summary">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Summary
                  </TabsTrigger>
                  <TabsTrigger value="assets">
                    <Building2 className="h-4 w-4 mr-2" />
                    Assets
                  </TabsTrigger>
                  <TabsTrigger value="liabilities">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Liabilities
                  </TabsTrigger>
                  <TabsTrigger value="business">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Business
                  </TabsTrigger>
                  <TabsTrigger value="relatives">
                    <Users className="h-4 w-4 mr-2" />
                    Relatives
                  </TabsTrigger>
                </TabsList>

                {/* Summary Tab */}
                <TabsContent value="summary" className="space-y-4 mt-4">
                  <SummarySection
                    salnData={salnData.salnData}
                    previousYear={salnData.previousYear}
                  />
                </TabsContent>

                {/* Assets Tab */}
                <TabsContent value="assets" className="space-y-4 mt-4">
                  <AssetsSection
                    realProperties={salnData.salnData.realProperties}
                    personalProperties={salnData.salnData.personalProperties}
                  />
                </TabsContent>

                {/* Liabilities Tab */}
                <TabsContent value="liabilities" className="space-y-4 mt-4">
                  <LiabilitiesSection liabilities={salnData.salnData.liabilities} />
                </TabsContent>

                {/* Business Interests Tab */}
                <TabsContent value="business" className="space-y-4 mt-4">
                  <BusinessSection businessInterests={salnData.salnData.businessInterests} />
                </TabsContent>

                {/* Relatives in Government Tab */}
                <TabsContent value="relatives" className="space-y-4 mt-4">
                  <RelativesSection relatives={salnData.salnData.relativesInGov} />
                </TabsContent>
              </Tabs>
            </ScrollArea>

            {/* Footer Actions */}
            {canApproveReject && (
              <>
                <Separator />
                <div className="px-6 py-4 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Close
                  </Button>
                  <Button variant="destructive" onClick={onReject} className="gap-2">
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                  <Button onClick={onApprove} className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                </div>
              </>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function SummarySection({
  salnData,
  previousYear,
}: {
  salnData: any;
  previousYear: any;
}) {
  const hasComparison = !!previousYear;
  const netWorthChange = previousYear?.netWorthChangePercent || 0;
  const isSignificant = Math.abs(netWorthChange) > 20;

  return (
    <div className="space-y-6">
      {/* Net Worth Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Assets</div>
          <div className="text-2xl font-bold text-green-600">
            ₱{parseFloat(salnData.totalAssets).toLocaleString('en-PH', {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Liabilities</div>
          <div className="text-2xl font-bold text-red-600">
            ₱{parseFloat(salnData.totalLiabilities).toLocaleString('en-PH', {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Net Worth</div>
          <div className="text-2xl font-bold text-blue-600">
            ₱{parseFloat(salnData.netWorth).toLocaleString('en-PH', {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>

      {/* Year-over-Year Comparison */}
      {hasComparison && (
        <div className={`border rounded-lg p-4 ${isSignificant ? 'border-orange-300 bg-orange-50 dark:bg-orange-950' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Year-over-Year Comparison</h3>
            {isSignificant && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                Significant Change
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Previous Year ({previousYear.fiscalYear})</div>
              <div className="text-xl font-semibold">
                ₱{parseFloat(previousYear.netWorth).toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Change</div>
              <div className={`text-xl font-semibold flex items-center gap-2 ${
                netWorthChange > 0 ? 'text-blue-600' : 'text-orange-600'
              }`}>
                {netWorthChange > 0 ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
                {Math.abs(netWorthChange).toFixed(1)}%
                <span className="text-sm">
                  (₱{Math.abs(parseFloat(previousYear.netWorthChange)).toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                  })})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AssetsSection({
  realProperties,
  personalProperties,
}: {
  realProperties: any[];
  personalProperties: any[];
}) {
  return (
    <div className="space-y-6">
      {/* Real Properties */}
      <div>
        <h3 className="font-semibold mb-3">Real Properties</h3>
        {realProperties && realProperties.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Assessed Value</TableHead>
                <TableHead className="text-right">Market Value</TableHead>
                <TableHead className="text-right">Acquisition Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {realProperties.map((prop: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell>{prop.description}</TableCell>
                  <TableCell>{prop.kind}</TableCell>
                  <TableCell>{prop.exactLocation}</TableCell>
                  <TableCell className="text-right">
                    ₱{parseFloat(prop.assessedValue).toLocaleString('en-PH')}
                  </TableCell>
                  <TableCell className="text-right">
                    ₱{parseFloat(prop.currentMarketValue).toLocaleString('en-PH')}
                  </TableCell>
                  <TableCell className="text-right">
                    ₱{parseFloat(prop.acquisitionCost).toLocaleString('en-PH')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-muted-foreground text-center py-8">No real properties</div>
        )}
      </div>

      {/* Personal Properties */}
      <div>
        <h3 className="font-semibold mb-3">Personal Properties</h3>
        {personalProperties && personalProperties.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Year Acquired</TableHead>
                <TableHead className="text-right">Acquisition Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personalProperties.map((prop: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell>{prop.description}</TableCell>
                  <TableCell>{prop.acquisitionYear}</TableCell>
                  <TableCell className="text-right">
                    ₱{parseFloat(prop.acquisitionCost).toLocaleString('en-PH')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-muted-foreground text-center py-8">No personal properties</div>
        )}
      </div>
    </div>
  );
}

function LiabilitiesSection({ liabilities }: { liabilities: any[] }) {
  return (
    <div>
      <h3 className="font-semibold mb-3">Liabilities</h3>
      {liabilities && liabilities.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nature</TableHead>
              <TableHead>Creditor(s)</TableHead>
              <TableHead className="text-right">Outstanding Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {liabilities.map((liability: any, idx: number) => (
              <TableRow key={idx}>
                <TableCell>{liability.nature}</TableCell>
                <TableCell>{liability.nameOfCreditors}</TableCell>
                <TableCell className="text-right">
                  ₱{parseFloat(liability.outstandingBalance).toLocaleString('en-PH')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-muted-foreground text-center py-8">No liabilities</div>
      )}
    </div>
  );
}

function BusinessSection({ businessInterests }: { businessInterests: any[] }) {
  return (
    <div>
      <h3 className="font-semibold mb-3">Business Interests & Financial Connections</h3>
      {businessInterests && businessInterests.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entity Name</TableHead>
              <TableHead>Business Address</TableHead>
              <TableHead>Nature</TableHead>
              <TableHead>Date Acquired</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {businessInterests.map((business: any, idx: number) => (
              <TableRow key={idx}>
                <TableCell>{business.nameOfEntity}</TableCell>
                <TableCell>{business.businessAddress}</TableCell>
                <TableCell>{business.nature}</TableCell>
                <TableCell>{business.dateOfAcquisition}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-muted-foreground text-center py-8">
          No business interests or financial connections
        </div>
      )}
    </div>
  );
}

function RelativesSection({ relatives }: { relatives: any[] }) {
  return (
    <div>
      <h3 className="font-semibold mb-3">Relatives in Government Service</h3>
      {relatives && relatives.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Relationship</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Agency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {relatives.map((relative: any, idx: number) => (
              <TableRow key={idx}>
                <TableCell>{relative.name}</TableCell>
                <TableCell>{relative.relationship}</TableCell>
                <TableCell>{relative.position}</TableCell>
                <TableCell>{relative.nameOfAgency}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-muted-foreground text-center py-8">
          No relatives in government service
        </div>
      )}
    </div>
  );
}
