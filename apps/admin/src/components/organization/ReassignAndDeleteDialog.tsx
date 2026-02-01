/**
 * ReassignAndDeleteDialog Component
 *
 * Multi-step dialog for reassigning employees and positions before deleting a department.
 * Guides users through dependency review, target selection, and confirmation steps.
 *
 * Features:
 * - Three-step wizard with progress indicator
 * - Automatic dependency checking
 * - Grouped department selection
 * - Confirmation with explicit acknowledgment
 * - Loading states and error handling
 * - WCAG 2.1 AA compliant
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Briefcase, AlertCircle, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import type { DepartmentWithStats } from '@tupsafe/types';
import {
  useDepartmentDependencies,
  useReassignmentTargets,
  useReassignAndDelete,
} from '@/hooks/useOrganization';

interface ReassignAndDeleteDialogProps {
  organizationId: string | null;
  organizationName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 1 | 2 | 3;

export function ReassignAndDeleteDialog({
  organizationId,
  organizationName,
  open,
  onOpenChange,
}: ReassignAndDeleteDialogProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [targetDepartmentId, setTargetDepartmentId] = useState<string>('');
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Fetch dependencies for the department to be deleted
  const {
    data: dependencies,
    isLoading: isLoadingDependencies,
    error: dependenciesError,
  } = useDepartmentDependencies(organizationId);

  // Fetch eligible target departments for reassignment
  const {
    data: targets,
    isLoading: isLoadingTargets,
  } = useReassignmentTargets(organizationId);

  // Mutation for reassigning and deleting
  const reassignAndDeleteMutation = useReassignAndDelete();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setTargetDepartmentId('');
      setIsConfirmed(false);
    }
  }, [open]);

  // Handle successful deletion
  useEffect(() => {
    if (reassignAndDeleteMutation.isSuccess) {
      onOpenChange(false);
    }
  }, [reassignAndDeleteMutation.isSuccess, onOpenChange]);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleReassignAndDelete = async () => {
    if (!organizationId || !targetDepartmentId || !isConfirmed) {
      return;
    }

    await reassignAndDeleteMutation.mutateAsync({
      id: organizationId,
      targetDeptId: targetDepartmentId,
      options: {
        reassignEmployees: true,
        reassignPositions: true,
      },
    });
  };

  // Group departments by type for better organization
  const groupedTargets = targets?.reduce(
    (acc, dept) => {
      if (dept.officeType === 'academic' && !dept.parentCollegeId) {
        acc.colleges.push(dept);
      } else if (dept.officeType === 'academic' && dept.parentCollegeId) {
        acc.departments.push(dept);
      } else if (dept.officeType === 'administrative') {
        acc.offices.push(dept);
      }
      return acc;
    },
    {
      colleges: [] as DepartmentWithStats[],
      departments: [] as DepartmentWithStats[],
      offices: [] as DepartmentWithStats[],
    }
  );

  // Find selected target for confirmation display
  const selectedTarget = targets?.find((t) => t.id === targetDepartmentId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Reassign & Delete Department</DialogTitle>
          <DialogDescription>
            Step {currentStep} of 3: {currentStep === 1 && 'Review Dependencies'}
            {currentStep === 2 && 'Select Target Department'}
            {currentStep === 3 && 'Confirm & Execute'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 py-4">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                currentStep >= 1
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
              aria-label="Step 1"
            >
              1
            </div>
            <div
              className={`h-1 w-16 ${
                currentStep >= 2 ? 'bg-primary' : 'bg-muted'
              }`}
              aria-hidden="true"
            />
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                currentStep >= 2
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
              aria-label="Step 2"
            >
              2
            </div>
            <div
              className={`h-1 w-16 ${
                currentStep >= 3 ? 'bg-primary' : 'bg-muted'
              }`}
              aria-hidden="true"
            />
          </div>
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
              currentStep >= 3
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
            aria-label="Step 3"
          >
            3
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {/* Step 1: Review Dependencies */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {isLoadingDependencies ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : dependenciesError ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-destructive" />
                  <p className="text-sm text-muted-foreground">
                    Failed to load dependencies. Please try again.
                  </p>
                </div>
              ) : dependencies ? (
                <>
                  <div>
                    <h3 className="text-base font-semibold">
                      Dependencies for {organizationName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      The following items will be reassigned to another department:
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          Employees
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">
                          {dependencies.employees.length}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Employee{dependencies.employees.length !== 1 ? 's' : ''}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          Positions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">
                          {dependencies.positions.length}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Position{dependencies.positions.length !== 1 ? 's' : ''}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {dependencies.blockingReasons.length > 0 && (
                    <Card className="border-amber-500/50 bg-amber-500/10 dark:bg-amber-500/20">
                      <CardContent className="pt-6">
                        <div className="flex gap-2">
                          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                              Blocking Reasons
                            </p>
                            <ul className="list-inside list-disc space-y-1 text-sm text-amber-700 dark:text-amber-300">
                              {dependencies.blockingReasons.map((reason, index) => (
                                <li key={index}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : null}
            </div>
          )}

          {/* Step 2: Select Target Department */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold">
                  Select Target Department
                </h3>
                <p className="text-sm text-muted-foreground">
                  Choose the department to receive all employees and positions from{' '}
                  {organizationName}
                </p>
              </div>

              {isLoadingTargets ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-3">
                  <label
                    htmlFor="target-department"
                    className="text-sm font-medium"
                  >
                    Target Department
                  </label>
                  <Select
                    value={targetDepartmentId}
                    onValueChange={setTargetDepartmentId}
                  >
                    <SelectTrigger
                      id="target-department"
                      className="w-full"
                      aria-label="Select target department"
                    >
                      <SelectValue placeholder="Select a department..." />
                    </SelectTrigger>
                    <SelectContent>
                      {groupedTargets && groupedTargets.colleges.length > 0 && (
                        <SelectGroup>
                          <SelectLabel>Colleges</SelectLabel>
                          {groupedTargets.colleges.map((college) => (
                            <SelectItem key={college.id} value={college.id}>
                              {college.name} ({college.code}) -{' '}
                              {college.employeeCount} employee
                              {college.employeeCount !== 1 ? 's' : ''}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}

                      {groupedTargets && groupedTargets.departments.length > 0 && (
                        <SelectGroup>
                          <SelectLabel>Departments</SelectLabel>
                          {groupedTargets.departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name} ({dept.code}) -{' '}
                              {dept.employeeCount} employee
                              {dept.employeeCount !== 1 ? 's' : ''}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}

                      {groupedTargets && groupedTargets.offices.length > 0 && (
                        <SelectGroup>
                          <SelectLabel>Offices</SelectLabel>
                          {groupedTargets.offices.map((office) => (
                            <SelectItem key={office.id} value={office.id}>
                              {office.name} ({office.code}) -{' '}
                              {office.employeeCount} employee
                              {office.employeeCount !== 1 ? 's' : ''}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                    </SelectContent>
                  </Select>

                  {targetDepartmentId && selectedTarget && (
                    <Card className="bg-muted/50">
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <p className="text-sm font-medium">
                            Selected Department
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>{selectedTarget.name}</strong> (
                            {selectedTarget.code})
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Currently has {selectedTarget.employeeCount} employee
                            {selectedTarget.employeeCount !== 1 ? 's' : ''} and{' '}
                            {selectedTarget.positionCount} position
                            {selectedTarget.positionCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirm & Execute */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold">
                  Confirm Reassignment & Deletion
                </h3>
                <p className="text-sm text-muted-foreground">
                  Please review the following information before proceeding:
                </p>
              </div>

              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Source Department (will be deleted)
                      </p>
                      <p className="text-sm font-semibold">
                        {organizationName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Target Department (will receive items)
                      </p>
                      <p className="text-sm font-semibold">
                        {selectedTarget?.name} ({selectedTarget?.code})
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      What will be reassigned
                    </p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {dependencies && dependencies.employees.length > 0 && (
                        <li className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          {dependencies.employees.length} employee
                          {dependencies.employees.length !== 1 ? 's' : ''}
                        </li>
                      )}
                      {dependencies && dependencies.positions.length > 0 && (
                        <li className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          {dependencies.positions.length} position
                          {dependencies.positions.length !== 1 ? 's' : ''}
                        </li>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-destructive/50 bg-destructive/10 dark:bg-destructive/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="confirm-delete"
                      checked={isConfirmed}
                      onCheckedChange={(checked) =>
                        setIsConfirmed(checked === true)
                      }
                      aria-label="Confirm deletion"
                    />
                    <label
                      htmlFor="confirm-delete"
                      className="cursor-pointer text-sm leading-relaxed"
                    >
                      I understand that this action cannot be undone. All employees
                      and positions will be permanently moved to the target
                      department, and <strong>{organizationName}</strong> will be
                      deleted.
                    </label>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer with Navigation */}
        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={reassignAndDeleteMutation.isPending}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {currentStep < 3 ? (
              <Button
                onClick={handleNext}
                disabled={
                  (currentStep === 2 && !targetDepartmentId) ||
                  isLoadingDependencies ||
                  isLoadingTargets
                }
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={handleReassignAndDelete}
                disabled={
                  !isConfirmed || reassignAndDeleteMutation.isPending
                }
              >
                {reassignAndDeleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Reassign & Delete'
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
