'use client';

import React from 'react';
import { GraduationCap, Building2, Briefcase } from 'lucide-react';
import { MagicCard } from '@/components/ui/magic-card';
import { BorderBeam } from '@/components/ui/border-beam';
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
  gradient: string;
  hoverGradient: string;
}

const USER_TYPE_OPTIONS: UserTypeOption[] = [
  {
    id: 'employee-faculty',
    icon: GraduationCap,
    title: 'Faculty Member',
    description:
      'I am a professor, instructor, or academic staff member at TUP Manila',
    gradient: 'from-[#8B1538]/10 to-[#B8264D]/10',
    hoverGradient: 'from-[#8B1538]/20 to-[#B8264D]/20',
  },
  {
    id: 'employee-staff',
    icon: Building2,
    title: 'Administrative Staff',
    description: 'I work in administrative offices (OSA, Registrar, HR, etc.)',
    gradient: 'from-blue-500/10 to-cyan-500/10',
    hoverGradient: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    id: 'applicant',
    icon: Briefcase,
    title: 'Job Applicant',
    description: 'I am applying for a position at TUP Manila',
    gradient: 'from-violet-500/10 to-purple-500/10',
    hoverGradient: 'from-violet-500/20 to-purple-500/20',
  },
];

export function UserTypeSelection({
  value,
  onChange,
  error,
}: UserTypeSelectionProps) {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Welcome to TUPSAFE
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Please select your relationship with TUP Manila
        </p>
      </div>

      {/* User Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {USER_TYPE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange(option.id);
                }
              }}
              className={cn(
                'relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B1538] focus-visible:ring-offset-2 rounded-lg transition-all duration-300',
                isSelected && 'ring-2 ring-[#8B1538] ring-offset-2'
              )}
              aria-pressed={isSelected}
              aria-label={`Select ${option.title}: ${option.description}`}
              role="radio">
              <MagicCard
                className={cn(
                  'relative overflow-hidden bg-white dark:bg-slate-900 border transition-all duration-300 h-full',
                  isSelected
                    ? 'border-[#8B1538] dark:border-[#8B1538]/80 shadow-lg scale-105'
                    : 'border-slate-200 dark:border-slate-700 hover:border-[#8B1538]/40 dark:hover:border-[#8B1538]/60 hover:shadow-md hover:scale-102'
                )}
                gradientColor={
                  isSelected
                    ? 'rgba(139, 21, 56, 0.1)'
                    : 'rgba(139, 21, 56, 0.05)'
                }
                gradientOpacity={0.3}>
                {isSelected && (
                  <BorderBeam
                    size={200}
                    duration={8}
                    delay={0}
                    colorFrom="#8B1538"
                    colorTo="#B8264D"
                  />
                )}

                <div className="p-6 space-y-4 text-left">
                  {/* Icon */}
                  <div
                    className={cn(
                      'w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300',
                      isSelected
                        ? 'bg-gradient-to-br from-[#8B1538] to-[#B8264D] shadow-lg'
                        : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 group-hover:from-[#8B1538]/20 group-hover:to-[#B8264D]/20'
                    )}>
                    <Icon
                      className={cn(
                        'h-7 w-7 transition-colors duration-300',
                        isSelected
                          ? 'text-white'
                          : 'text-slate-600 dark:text-slate-400 group-hover:text-[#8B1538] dark:group-hover:text-[#8B1538]/90'
                      )}
                    />
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <h4
                      className={cn(
                        'text-lg font-semibold transition-colors duration-300',
                        isSelected
                          ? 'text-[#8B1538] dark:text-[#8B1538]/90'
                          : 'text-slate-900 dark:text-slate-100 group-hover:text-[#8B1538] dark:group-hover:text-[#8B1538]/90'
                      )}>
                      {option.title}
                    </h4>

                    {/* Description */}
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {option.description}
                    </p>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="flex items-center justify-center mt-4">
                      <div className="flex items-center space-x-2 text-[#8B1538] dark:text-[#8B1538]/90">
                        <div className="w-5 h-5 rounded-full bg-[#8B1538] dark:bg-[#8B1538]/90 flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium">Selected</span>
                      </div>
                    </div>
                  )}
                </div>
              </MagicCard>
            </button>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm"
          role="alert"
          aria-live="polite">
          <svg
            className="w-4 h-4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Help Text */}
      <div className="text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Your selection will determine the registration process and required
          information
        </p>
      </div>
    </div>
  );
}
