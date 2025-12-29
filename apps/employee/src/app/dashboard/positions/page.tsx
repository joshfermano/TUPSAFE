'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Briefcase,
  Building2,
  Calendar,
  DollarSign,
  Users,
  Filter,
  Search,
  Sparkles,
  CheckCircle,
  Clock,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Card } from '../../../components/ui/card';
import { Separator } from '../../../components/ui/separator';
import { cn } from '../../../lib/utils';
import {
  useOpenPositionsQuery,
  type OpenPosition,
} from '../../../hooks/useApplicationsQuery';
import { BlurFade } from '../../../components/ui/blur-fade';
import { ShineBorder } from '../../../components/ui/shine-border';
import { ShimmerButton } from '../../../components/ui/shimmer-button';
import AnimatedGradientText from '../../../components/ui/animated-gradient-text';
import { BorderBeam } from '../../../components/ui/border-beam';

/**
 * Position card component
 */
function PositionCard({ position }: { position: OpenPosition }) {
  const router = useRouter();
  const daysUntilDeadline = Math.ceil(
    (new Date(position.applicationDeadline).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <BlurFade delay={0.1} inView>
      <ShineBorder
        className="relative overflow-hidden rounded-xl p-6 transition-all duration-300 hover:shadow-lg"
        shineColor={
          position.isFeatured
            ? ['#FFD700', '#FFA500', '#FF6347']
            : ['#8B1538', '#B8264D', '#D4345F']
        }
        borderWidth={position.isFeatured ? 3 : 2}>
        {position.isFeatured && (
          <BorderBeam size={250} duration={12} delay={9} />
        )}

        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            {position.isFeatured && (
              <div className="rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 p-2">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            )}
            <div className="flex-1 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {position.positionTitle}
                </h3>
                {position.hasApplied && (
                  <Badge
                    className="bg-green-100 text-green-800 border-green-200"
                    variant="outline">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Applied
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {position.positionCode}
              </p>
            </div>
          </div>

          {position.isFeatured && (
            <div className="flex items-center gap-2 text-sm font-medium text-orange-600 dark:text-orange-400">
              <Sparkles className="h-4 w-4" />
              <span>Featured Position</span>
            </div>
          )}

          <Separator />

          {/* Details Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Department */}
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-[#8B1538]" />
              <span className="text-slate-700 dark:text-slate-300">
                {position.departmentName}
              </span>
            </div>

            {/* Employment Category */}
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-[#8B1538]" />
              <span className="text-slate-700 dark:text-slate-300 capitalize">
                {position.employmentCategory}
              </span>
            </div>

            {/* Salary Range */}
            {position.salaryRangeMin && position.salaryRangeMax && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-[#8B1538]" />
                <span className="text-slate-700 dark:text-slate-300">
                  ₱{position.salaryRangeMin.toLocaleString()} - ₱
                  {position.salaryRangeMax.toLocaleString()}
                </span>
              </div>
            )}

            {/* Openings */}
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-[#8B1538]" />
              <span className="text-slate-700 dark:text-slate-300">
                {position.numberOfOpenings} opening(s)
              </span>
            </div>

            {/* Deadline */}
            <div className="flex items-center gap-2 text-sm col-span-2">
              <Calendar className="h-4 w-4 text-[#8B1538]" />
              <span className="text-slate-700 dark:text-slate-300">
                Deadline:{' '}
                {format(new Date(position.applicationDeadline), 'MMM dd, yyyy')}
              </span>
              {daysUntilDeadline <= 7 && (
                <Badge variant="destructive" className="ml-auto">
                  <Clock className="h-3 w-3 mr-1" />
                  {daysUntilDeadline} {daysUntilDeadline === 1 ? 'day' : 'days'}{' '}
                  left
                </Badge>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
              {position.description}
            </p>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              asChild
              variant="outline"
              className="flex-1 gap-2 hover:bg-slate-50 dark:hover:bg-slate-800">
              <Link href={`/dashboard/positions/${position.id}`}>
                View Details
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
            {!position.hasApplied && (
              <ShimmerButton
                className="flex-1"
                shimmerColor="#8B1538"
                shimmerSize="0.1em"
                borderRadius="0.5rem"
                background="linear-gradient(to right, #8B1538, #B8264D)"
                onClick={() => router.push(`/dashboard/positions/${position.id}`)}>
                <span className="flex items-center justify-center gap-2">
                  Apply Now
                  <ChevronRight className="h-4 w-4" />
                </span>
              </ShimmerButton>
            )}
            {position.hasApplied && (
              <Button asChild className="flex-1 gap-2" variant="secondary">
                <Link href={`/dashboard/applications`}>
                  View Application
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </ShineBorder>
    </BlurFade>
  );
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <BlurFade delay={0.2} inView>
      <Card className="border-dashed border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
          <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-4">
            <Briefcase className="h-8 w-8 text-slate-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              No Open Positions
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm">
              There are currently no open positions matching your criteria.
              Check back later for new opportunities.
            </p>
          </div>
        </div>
      </Card>
    </BlurFade>
  );
}

/**
 * Browse Open Positions Page
 * Shows all available job positions for applicants
 */
export default function OpenPositionsPage() {
  const [employmentCategoryFilter, setEmploymentCategoryFilter] =
    useState<string>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'salary' | 'posted'>(
    'deadline'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error } = useOpenPositionsQuery({
    employmentCategory: employmentCategoryFilter !== 'all' ? employmentCategoryFilter : undefined,
    sort: sortBy,
  });

  // Filter positions by search query (client-side)
  const filteredPositions =
    data?.positions.filter(
      (pos) =>
        pos.positionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pos.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pos.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const featuredPositions = filteredPositions.filter((p) => p.isFeatured);
  const regularPositions = filteredPositions.filter((p) => !p.isFeatured);

  return (
    <div className="space-y-8">
      {/* Header */}
      <BlurFade delay={0.05} inView>
        <div className="space-y-2">
          <AnimatedGradientText>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl">
              Open Positions
            </h1>
          </AnimatedGradientText>
          <p className="text-slate-600 dark:text-slate-400">
            Browse and apply to available job opportunities
          </p>
        </div>
      </BlurFade>

      {/* Filters */}
      <BlurFade delay={0.1} inView>
        <Card className="p-4">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search positions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="h-4 w-4 text-slate-600 dark:text-slate-400" />

                {/* Employment Category Filter */}
                <Select
                  value={employmentCategoryFilter}
                  onValueChange={setEmploymentCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="faculty">Faculty</SelectItem>
                    <SelectItem value="administrative">
                      Administrative
                    </SelectItem>
                    <SelectItem value="contractual">Contractual</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort By */}
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as any)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deadline">Deadline (Soonest)</SelectItem>
                    <SelectItem value="salary">Salary (Highest)</SelectItem>
                    <SelectItem value="posted">Posted (Newest)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Results Count */}
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {filteredPositions.length} position
                {filteredPositions.length !== 1 ? 's' : ''} available
              </div>
            </div>
          </div>
        </Card>
      </BlurFade>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#8B1538]" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <BlurFade delay={0.2} inView>
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <div className="p-6 text-center">
              <p className="text-red-800 dark:text-red-400">
                Failed to load positions. Please try again later.
              </p>
            </div>
          </Card>
        </BlurFade>
      )}

      {/* Positions Grid */}
      {!isLoading && !error && (
        <>
          {filteredPositions.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-8">
              {/* Featured Positions */}
              {featuredPositions.length > 0 && (
                <div className="space-y-4">
                  <BlurFade delay={0.15} inView>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-orange-500" />
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                        Featured Positions
                      </h2>
                    </div>
                  </BlurFade>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {featuredPositions.map((position) => (
                      <PositionCard key={position.id} position={position} />
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Positions */}
              {regularPositions.length > 0 && (
                <div className="space-y-4">
                  {featuredPositions.length > 0 && (
                    <BlurFade delay={0.2} inView>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-[#8B1538]" />
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                          All Positions
                        </h2>
                      </div>
                    </BlurFade>
                  )}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {regularPositions.map((position) => (
                      <PositionCard key={position.id} position={position} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
