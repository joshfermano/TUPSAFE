'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BorderBeam } from '@/components/ui/border-beam';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[oklch(0.38_0.2_260)] via-blue-700 to-indigo-600 p-8 sm:p-10 text-white shadow-2xl">
      <BorderBeam size={280} duration={14} delay={0} colorFrom="#60a5fa" colorTo="#c7d2fe" />

      {/* Animated Background Effects */}
      <motion.div
        className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      />

      {/* Shimmer overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatDelay: 2,
          ease: "easeInOut"
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar */}
        <motion.div
          className="relative"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <motion.div
            whileHover={{ scale: 1.05, rotate: 2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-white/30 shadow-2xl ring-4 ring-blue-400/40">
              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-3xl sm:text-4xl font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </motion.div>
          {profile.isActive && (
            <motion.div
              className="absolute bottom-2 right-2 h-5 w-5 rounded-full bg-green-400 border-2 border-white shadow-lg"
              animate={{
                scale: [1, 1.2, 1],
                boxShadow: [
                  '0 0 0 0 rgba(74, 222, 128, 0.4)',
                  '0 0 0 8px rgba(74, 222, 128, 0)',
                  '0 0 0 0 rgba(74, 222, 128, 0)'
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </motion.div>

        {/* Info */}
        <motion.div
          className="flex-1 text-center sm:text-left space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div>
            <motion.h1
              className="text-3xl sm:text-4xl font-bold mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {fullName}
            </motion.h1>
            <motion.p
              className="text-blue-100 text-lg flex items-center justify-center sm:justify-start gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Briefcase className="h-5 w-5" />
              {position?.title || 'Government Employee'}
            </motion.p>
          </div>

          <motion.div
            className="flex flex-wrap items-center justify-center sm:justify-start gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Badge
                variant={getRoleBadgeVariant(profile.role)}
                className="bg-white/20 text-white border-white/40 hover:bg-white/30 backdrop-blur-sm shadow-lg"
              >
                <Shield className="h-3 w-3 mr-1" />
                {profile.role.toUpperCase()}
              </Badge>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Badge variant="outline" className="bg-white/10 text-white border-white/40 backdrop-blur-sm shadow-md">
                ID: {profile.employeeId}
              </Badge>
            </motion.div>
            {department && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Badge variant="outline" className="bg-white/10 text-white border-white/40 backdrop-blur-sm shadow-md">
                  {department.code}
                </Badge>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
