'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { ShineBorder } from '../ui/shine-border';
import { BlurFade } from '../ui/blur-fade';
import { TextAnimate } from '../ui/text-animate';
import { cn } from '../../lib/utils';
import { Shield, Briefcase } from 'lucide-react';
import type { ProfileData } from '../../hooks/useProfile';

interface ProfileHeroProps {
  profile: ProfileData;
  department: ProfileData['department'];
  position: ProfileData['position'];
}

// Static constants extracted outside component to prevent recreation on every render
const ROLE_BADGE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  co_admin: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  hr: 'bg-tup-crimson-subtle text-primary dark:bg-primary/30 dark:text-tup-crimson-light',
  supervisor:
    'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400',
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
} as const;

const SHINE_COLORS: string[] = [
  '#ffffff',
  'var(--tup-crimson-light)',
  'var(--tup-crimson-dark)',
];

export const ProfileHero = memo(function ProfileHero({
  profile,
  department,
  position,
}: ProfileHeroProps) {
  const getInitials = () => {
    const firstInitial = profile.firstName?.[0]?.toUpperCase() || '';
    const lastInitial = profile.lastName?.[0]?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  };

  const getRoleBadgeColor = (role: string) => {
    return ROLE_BADGE_COLORS[role] || ROLE_BADGE_COLORS.default;
  };

  const fullName = `${profile.firstName} ${
    profile.middleName ? profile.middleName + ' ' : ''
  }${profile.lastName}`;

  return (
    <BlurFade delay={0.05} inView>
      <motion.div
        className="relative overflow-hidden rounded-xl bg-gradient-tup p-8 sm:p-10 text-white shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}>
        {/* Subtle Shine Border Effect */}
        <ShineBorder
          borderWidth={2}
          duration={10}
          shineColor={SHINE_COLORS}
          className="opacity-40"
        />

        {/* Clean Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <BlurFade delay={0.1} inView>
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
              <div className="relative">
                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-white/20 shadow-xl ring-4 ring-white/10">
                  <AvatarImage src={profile.avatarUrl || undefined} alt={fullName} />
                  <AvatarFallback className="bg-white/10 backdrop-blur-md text-white text-3xl sm:text-4xl font-bold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                {profile.isActive && (
                  <motion.div
                    className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-green-400 border-4 border-white shadow-lg"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>
            </motion.div>
          </BlurFade>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <BlurFade delay={0.15} inView>
              <div>
                <TextAnimate
                  animation="blurInUp"
                  by="word"
                  className="text-3xl sm:text-4xl font-bold mb-2 drop-shadow-md">
                  {fullName}
                </TextAnimate>
                <motion.p
                  className="text-white/90 text-lg flex items-center justify-center sm:justify-start gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}>
                  <Briefcase className="h-5 w-5" />
                  {position?.title || (profile.userType === 'applicant' ? 'Job Applicant' : 'Government Employee')}
                </motion.p>
              </div>
            </BlurFade>

            <BlurFade delay={0.2} inView>
              <motion.div
                className="flex flex-wrap items-center justify-center sm:justify-start gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400 }}>
                  <Badge
                    className={cn(
                      'px-3 py-1 font-semibold border-white/20 backdrop-blur-sm shadow-sm',
                      profile.userType === 'applicant'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                        : getRoleBadgeColor(profile.role)
                    )}>
                    <Shield className="h-3 w-3 mr-1" />
                    {profile.userType === 'applicant' ? 'APPLICANT' : profile.role.toUpperCase()}
                  </Badge>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400 }}>
                  <Badge className="px-3 py-1 bg-white/10 text-white border-white/20 backdrop-blur-sm hover:bg-white/20 transition-colors shadow-sm">
                    ID:{' '}
                    {profile.userType === 'employee'
                      ? profile.employeeId
                      : profile.applicantId}
                  </Badge>
                </motion.div>
                {department && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 400 }}>
                    <Badge className="px-3 py-1 bg-white/10 text-white border-white/20 backdrop-blur-sm hover:bg-white/20 transition-colors shadow-sm">
                      {department.code}
                    </Badge>
                  </motion.div>
                )}
              </motion.div>
            </BlurFade>
          </div>
        </div>
      </motion.div>
    </BlurFade>
  );
});
