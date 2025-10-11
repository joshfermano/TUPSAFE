'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BorderBeam } from '@/components/ui/border-beam';
import { cn } from '@/lib/utils';
import { Shield, Briefcase } from 'lucide-react';
import type { Profile, Department, Position } from '@smartgov/mock-data';

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

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'hr':
        return 'default';
      case 'supervisor':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const fullName = `${profile.firstName} ${profile.middleName ? profile.middleName + ' ' : ''}${profile.lastName}`;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-600 p-8 sm:p-10 text-white shadow-2xl">
      <BorderBeam size={250} duration={12} delay={9} colorFrom="#60a5fa" colorTo="#818cf8" />

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar */}
        <div className="relative">
          <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-white/20 shadow-xl ring-4 ring-blue-400/30">
            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-3xl sm:text-4xl font-bold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          {profile.isActive && (
            <div className="absolute bottom-2 right-2 h-4 w-4 rounded-full bg-green-400 border-2 border-white shadow-lg"></div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left space-y-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">{fullName}</h1>
            <p className="text-blue-100 text-lg flex items-center justify-center sm:justify-start gap-2">
              <Briefcase className="h-5 w-5" />
              {position?.title || 'Government Employee'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <Badge
              variant={getRoleBadgeVariant(profile.role)}
              className="bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm"
            >
              <Shield className="h-3 w-3 mr-1" />
              {profile.role.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="bg-white/10 text-white border-white/30 backdrop-blur-sm">
              ID: {profile.employeeId}
            </Badge>
            {department && (
              <Badge variant="outline" className="bg-white/10 text-white border-white/30 backdrop-blur-sm">
                {department.code}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
