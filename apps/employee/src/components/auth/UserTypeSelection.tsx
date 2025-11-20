'use client';

import React from 'react';
import { GraduationCap, Building2, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UserTypeSelectionProps {
  value?: 'employee-faculty' | 'employee-staff' | 'applicant';
  onChange: (
    value: 'employee-faculty' | 'employee-staff' | 'applicant'
  ) => void;
  error?: string;
}

interface UserTypeOption {
  id: 'employee-faculty' | 'employee-staff' | 'applicant';
  icon: React.ElementType;
  title: string;
  description: string;
}

const USER_TYPE_OPTIONS: UserTypeOption[] = [
  {
    id: 'employee-faculty',
    icon: GraduationCap,
    title: 'Faculty Member',
    description: 'Professor, instructor, or academic staff',
  },
  {
    id: 'employee-staff',
    icon: Building2,
    title: 'Administrative Staff',
    description: 'Administrative offices and support',
  },
  {
    id: 'applicant',
    icon: Briefcase,
    title: 'Job Applicant',
    description: 'Applying for a position',
  },
];

export function UserTypeSelection({
  value,
  onChange,
  error,
}: UserTypeSelectionProps) {
  return (
    <div className="space-y-6">
      {/* User Type Cards - Minimalist Design */}
      <div className="grid grid-cols-1 gap-3">
        {USER_TYPE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={cn(
                'relative group w-full text-left transition-all duration-300',
                'rounded-2xl p-6',
                'border',
                isSelected
                  ? 'border-[#8B1538] bg-[#8B1538]/[0.02] dark:bg-[#8B1538]/[0.05]'
                  : 'border-[#E5E5E5] dark:border-[#2A2A2A] hover:border-[#8B1538]/30 dark:hover:border-[#8B1538]/30',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B1538]/20 focus-visible:ring-offset-2'
              )}
              aria-pressed={isSelected}
              aria-label={`Select ${option.title}: ${option.description}`}
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
                    isSelected
                      ? 'bg-[#8B1538] shadow-sm'
                      : 'bg-[#F5F5F5] dark:bg-[#2A2A2A] group-hover:bg-[#8B1538]/10'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-colors duration-300',
                      isSelected
                        ? 'text-white'
                        : 'text-[#666666] dark:text-[#999999] group-hover:text-[#8B1538]'
                    )}
                    strokeWidth={1.5}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4
                    className={cn(
                      'text-base font-normal transition-colors duration-300',
                      isSelected
                        ? 'text-[#8B1538]'
                        : 'text-[#1A1A1A] dark:text-white group-hover:text-[#8B1538]'
                    )}
                  >
                    {option.title}
                  </h4>
                  <p className="text-sm text-[#666666] dark:text-[#999999] mt-0.5 font-light">
                    {option.description}
                  </p>
                </div>

                {/* Selection Indicator */}
                <div className="flex-shrink-0">
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 transition-all duration-300 flex items-center justify-center',
                      isSelected
                        ? 'border-[#8B1538] bg-[#8B1538]'
                        : 'border-[#E5E5E5] dark:border-[#2A2A2A] group-hover:border-[#8B1538]/30'
                    )}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </div>

              {/* Subtle Bottom Border Accent */}
              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#8B1538] to-transparent" />
              )}
            </button>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 font-light"
          role="alert"
          aria-live="polite"
        >
          <div className="w-1 h-1 rounded-full bg-red-600 dark:bg-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-[#666666] dark:text-[#999999] text-center font-light leading-relaxed">
        Your selection determines the registration requirements
      </p>
    </div>
  );
}
