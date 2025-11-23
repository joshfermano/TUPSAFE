'use client';

import React, { useEffect } from 'react';
import { Building2, Search } from 'lucide-react';
import {
  useColleges,
  useDepartmentsByCollege,
  useOffices,
  type College,
  type Department,
  type Office,
} from '@/hooks';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export interface OrganizationSelectorProps {
  userType: 'faculty' | 'administrative';
  collegeValue?: string;
  departmentValue?: string;
  officeValue?: string;
  onCollegeChange?: (collegeId: string) => void;
  onDepartmentChange?: (departmentId: string) => void;
  onOfficeChange?: (officeId: string) => void;
  errors?: {
    college?: string;
    department?: string;
    office?: string;
  };
}

export function OrganizationSelector({
  userType,
  collegeValue,
  departmentValue,
  officeValue,
  onCollegeChange,
  onDepartmentChange,
  onOfficeChange,
  errors,
}: OrganizationSelectorProps) {
  // Faculty: Fetch colleges and departments
  const {
    data: colleges,
    isLoading: isLoadingColleges,
    isError: isErrorColleges,
    refetch: refetchColleges,
  } = useColleges();

  const {
    data: departments,
    isLoading: isLoadingDepartments,
    isError: isErrorDepartments,
    refetch: refetchDepartments,
  } = useDepartmentsByCollege(collegeValue ?? undefined);

  // Staff: Fetch offices
  const {
    data: offices,
    isLoading: isLoadingOffices,
    isError: isErrorOffices,
    refetch: refetchOffices,
  } = useOffices();

  // Reset department when college changes
  useEffect(() => {
    if (userType === 'faculty' && collegeValue && departmentValue) {
      // Check if current department belongs to the new college
      const currentDepartmentValid = departments?.some(
        (dept: Department) => dept.id === departmentValue
      );
      if (!currentDepartmentValid && onDepartmentChange) {
        onDepartmentChange('');
      }
    }
  }, [collegeValue, departments, departmentValue, onDepartmentChange, userType]);

  // Faculty Selection (College → Department)
  if (userType === 'faculty') {
    return (
      <div className="space-y-5">
        {/* College Selection */}
        <div className="space-y-2">
          <Label htmlFor="college" className="text-sm font-medium">
            College *
          </Label>
          {isLoadingColleges ? (
            <Skeleton className="h-10 w-full" />
          ) : isErrorColleges ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  Failed to load colleges
                </p>
                <button
                  type="button"
                  onClick={() => refetchColleges()}
                  className="text-sm text-red-600 dark:text-red-400 hover:underline focus:outline-none"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <Select value={collegeValue} onValueChange={onCollegeChange}>
              <SelectTrigger
                id="college"
                className={`bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-[#8B1538] focus:ring-[#8B1538] text-slate-900 dark:text-slate-100 transition-all duration-300 hover:bg-white hover:border-[#8B1538]/40 dark:hover:bg-slate-700/80 dark:hover:border-[#8B1538]/50 ${
                  errors?.college ? 'border-red-500 focus:border-red-500' : ''
                }`}
                aria-describedby={errors?.college ? 'college-error' : undefined}
              >
                <SelectValue placeholder="Select your college">
                  {collegeValue && (
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-slate-500" />
                      <span>
                        {colleges?.find((c: College) => c.id === collegeValue)?.name}
                      </span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center space-x-2 px-2 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                    <Search className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {colleges?.length || 0} colleges available
                    </span>
                  </div>
                </div>
                {colleges?.map((college: College) => (
                  <SelectItem key={college.id} value={college.id}>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-[#8B1538]/10 dark:bg-[#8B1538]/20 rounded-md flex items-center justify-center">
                        <span className="text-xs font-semibold text-[#8B1538] dark:text-[#8B1538]/90">
                          {college.code}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {college.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {college.code}
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {errors?.college && (
            <p
              id="college-error"
              className="text-sm text-red-600 dark:text-red-400 mt-1"
              role="alert"
            >
              {errors.college}
            </p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select the college where you are assigned
          </p>
        </div>

        {/* Department Selection (Only shown after college is selected) */}
        {collegeValue && (
          <div className="space-y-2">
            <Label htmlFor="department" className="text-sm font-medium">
              Department *
            </Label>
            {isLoadingDepartments ? (
              <Skeleton className="h-10 w-full" />
            ) : isErrorDepartments ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Failed to load departments
                  </p>
                  <button
                    type="button"
                    onClick={() => refetchDepartments()}
                    className="text-sm text-red-600 dark:text-red-400 hover:underline focus:outline-none"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : departments && departments.length > 0 ? (
              <Select value={departmentValue} onValueChange={onDepartmentChange}>
                <SelectTrigger
                  id="department"
                  className={`bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-[#8B1538] focus:ring-[#8B1538] text-slate-900 dark:text-slate-100 transition-all duration-300 hover:bg-white hover:border-[#8B1538]/40 dark:hover:bg-slate-700/80 dark:hover:border-[#8B1538]/50 ${
                    errors?.department ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  aria-describedby={errors?.department ? 'department-error' : undefined}
                >
                  <SelectValue placeholder="Select your department">
                    {departmentValue && (
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-slate-500" />
                        <span>
                          {departments?.find((d: Department) => d.id === departmentValue)?.name}
                        </span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center space-x-2 px-2 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                      <Search className="h-4 w-4 text-slate-400" />
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {departments?.length || 0} departments in{' '}
                        {colleges?.find((c: College) => c.id === collegeValue)?.code}
                      </span>
                    </div>
                  </div>
                  {departments.map((department: Department) => (
                    <SelectItem key={department.id} value={department.id}>
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500/10 dark:bg-blue-500/20 rounded-md flex items-center justify-center">
                          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                            {department.code}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {department.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {department.code}
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  No departments found for the selected college
                </p>
              </div>
            )}
            {errors?.department && (
              <p
                id="department-error"
                className="text-sm text-red-600 dark:text-red-400 mt-1"
                role="alert"
              >
                {errors.department}
              </p>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select your specific department within the college
            </p>
          </div>
        )}
      </div>
    );
  }

  // Administrative Staff Selection (Office only)
  return (
    <div className="space-y-2">
      <Label htmlFor="office" className="text-sm font-medium">
        Office/Unit *
      </Label>
      {isLoadingOffices ? (
        <Skeleton className="h-10 w-full" />
      ) : isErrorOffices ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              Failed to load offices
            </p>
            <button
              type="button"
              onClick={() => refetchOffices()}
              className="text-sm text-red-600 dark:text-red-400 hover:underline focus:outline-none"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <Select value={officeValue} onValueChange={onOfficeChange}>
          <SelectTrigger
            id="office"
            className={`bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-[#8B1538] focus:ring-[#8B1538] text-slate-900 dark:text-slate-100 transition-all duration-300 hover:bg-white hover:border-[#8B1538]/40 dark:hover:bg-slate-700/80 dark:hover:border-[#8B1538]/50 ${
              errors?.office ? 'border-red-500 focus:border-red-500' : ''
            }`}
            aria-describedby={errors?.office ? 'office-error' : undefined}
          >
            <SelectValue placeholder="Select your office">
              {officeValue && (
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  <span>
                    {offices?.find((o: Office) => o.id === officeValue)?.name}
                  </span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <div className="p-2 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-2 px-2 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                <Search className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {offices?.length || 0} administrative offices
                </span>
              </div>
            </div>
            {offices?.map((office: Office) => (
              <SelectItem key={office.id} value={office.id}>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500/10 dark:bg-blue-500/20 rounded-md flex items-center justify-center">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {office.code}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {office.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {office.code}
                    </p>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {errors?.office && (
        <p
          id="office-error"
          className="text-sm text-red-600 dark:text-red-400 mt-1"
          role="alert"
        >
          {errors.office}
        </p>
      )}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Select the administrative office where you are assigned
      </p>
    </div>
  );
}
