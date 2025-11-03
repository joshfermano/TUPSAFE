'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ShineBorder } from '@/components/ui/shine-border';
import { cn } from '@/lib/utils';
import { Shield, Briefcase } from 'lucide-react';
import type { Profile, Department, Position } from '@tupsafe/mock-data';

interface ProfileHeroProps {
  profile: Profile;
  department: Department | null;
  position: Position | null;
}

export function ProfileHero({ profile, department, position }: ProfileHeroProps) {
  const getInitials = () => {
    const firstInitial = profile.firstName?.[0]?.toUpperCase() || '';
    const lastInitial = profile.lastName?.[0]?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400';
      case 'hr':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400';
      case 'supervisor':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const fullName = `${profile.firstName} ${profile.middleName ? profile.middleName + ' ' : ''}${profile.lastName}`;

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#093FB4] via-[#0066B3] to-[#0052A3] p-8 sm:p-10 text-white shadow-lg">
      {/* Subtle Shine Border Effect */}
      <ShineBorder
        borderWidth={2}
        duration={10}
        shineColor={['#ffffff', '#0066B3', '#8B1538']}
        className="opacity-40"
      />

      {/* Clean Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#8B1538]/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar */}
        <div className="relative">
          <div className="relative">
            <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-white/20 shadow-xl ring-4 ring-white/10">
              <AvatarFallback className="bg-white/10 backdrop-blur-md text-white text-3xl sm:text-4xl font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            {profile.isActive && (
              <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-green-400 border-4 border-white shadow-lg animate-pulse"></div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left space-y-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 drop-shadow-md">
              {fullName}
            </h1>
            <p className="text-white/90 text-lg flex items-center justify-center sm:justify-start gap-2">
              <Briefcase className="h-5 w-5" />
              {position?.title || 'Government Employee'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <Badge
              className={cn(
                'px-3 py-1 font-semibold border-white/20 backdrop-blur-sm shadow-sm',
                getRoleBadgeColor(profile.role)
              )}
            >
              <Shield className="h-3 w-3 mr-1" />
              {profile.role.toUpperCase()}
            </Badge>
            <Badge className="px-3 py-1 bg-white/10 text-white border-white/20 backdrop-blur-sm hover:bg-white/20 transition-colors shadow-sm">
              ID: {profile.employeeId}
            </Badge>
            {department && (
              <Badge className="px-3 py-1 bg-white/10 text-white border-white/20 backdrop-blur-sm hover:bg-white/20 transition-colors shadow-sm">
                {department.code}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
