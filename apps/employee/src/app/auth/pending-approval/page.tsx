/**
 * Pending Approval Page - Premium Redesign
 *
 * A visually stunning, modern approval status page with:
 * - Premium animated backgrounds and effects
 * - Enhanced status cards with detailed information
 * - Smooth entrance animations and micro-interactions
 * - Feature cards highlighting approval process
 * - Real-time status updates
 * - Mobile-first responsive design
 *
 * Shown to users after registration when their account is awaiting admin approval.
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  ClockIcon,
  CheckCircledIcon,
  CrossCircledIcon,
  ExclamationTriangleIcon,
  ReloadIcon,
  EnvelopeClosedIcon,
  PersonIcon,
  CheckIcon,
  InfoCircledIcon,
} from '@radix-ui/react-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { MagicCard } from '../../../components/ui/magic-card';
import { BorderBeam } from '../../../components/ui/border-beam';
import { AnimatedGradientText } from '../../../components/ui/animated-gradient-text';
import AnimatedGridPattern from '../../../components/ui/animated-grid-pattern';
import { ShimmerButton } from '../../../components/ui/shimmer-button';
import { SparklesText } from '../../../components/ui/sparkles-text';
import { NeonGradientCard } from '../../../components/ui/neon-gradient-card';
import { Meteors } from '../../../components/ui/meteors';
import { Particles } from '../../../components/ui/particles';
import { cn } from '../../../lib/utils';
import { useRealtimeProfile, type Profile } from '@tupsafe/database';

type AccountStatus = 'pending' | 'active' | 'rejected' | 'suspended';

interface FeatureCard {
  icon: typeof InfoCircledIcon;
  title: string;
  description: string;
  color: string;
}

interface StatusConfig {
  icon: typeof ClockIcon;
  title: string;
  message: string;
  description: string;
  color: string;
  bgGradient: string;
  iconBg: string;
  glowColor: string;
  borderColor: string;
  points: string[];
  features: FeatureCard[];
}

function PendingApprovalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<AccountStatus>('pending');
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [authError, setAuthError] = useState(false);

  // Set up Realtime subscription for profile changes
  // Only activate when userId is available to prevent session corruption
  // This will automatically detect when accountStatus changes to 'active'
  useRealtimeProfile(userId || '', {
    showToast: false, // We'll handle toast manually for better UX
    notifyOnFields: ['isActive'], // Monitor significant changes
    onProfileUpdate: (
      oldProfile: Partial<Profile>,
      newProfile: Partial<Profile>,
      changedFields: string[]
    ) => {
      // Check if accountStatus changed to 'active'
      if (
        changedFields.includes('accountStatus') &&
        newProfile.accountStatus === 'active'
      ) {
        console.log('[Realtime] Account approved, redirecting to dashboard...');

        // Show success toast
        toast.success('Your account has been approved!', {
          description: 'Redirecting to dashboard...',
          duration: 3000,
        });

        // Update local state
        setStatus('active');

        // Redirect to dashboard after a short delay to show the toast
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else if (
        changedFields.includes('accountStatus') &&
        newProfile.accountStatus === 'rejected'
      ) {
        console.log('[Realtime] Account rejected');

        // Show error toast
        toast.error('Registration Not Approved', {
          description:
            'Your registration could not be approved. Please contact HR for more information.',
          duration: 5000,
        });

        // Update local state
        setStatus('rejected');
      } else if (
        changedFields.includes('accountStatus') &&
        newProfile.accountStatus === 'suspended'
      ) {
        console.log('[Realtime] Account suspended');

        // Show warning toast
        toast.error('Account Suspended', {
          description:
            'Your account has been suspended. Please contact the administrator.',
          duration: 5000,
        });

        // Update local state
        setStatus('suspended');
      }
    },
  });

  const checkStatus = async () => {
    setRefreshing(true);

    const urlStatus = searchParams.get('status') as AccountStatus | null;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Use getUser() to fetch FRESH user data from auth server
    // This ensures we get the latest metadata including account_status updates
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Don't auto-redirect to login - let user manually navigate
      console.log('[Pending Approval] No authenticated user found');
      setAuthError(true);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // Set userId for Realtime subscription
    setUserId(user.id);

    // Get FRESH account status from user metadata (just fetched from auth server)
    const userStatus = user.user_metadata?.account_status as AccountStatus;
    const finalStatus = urlStatus || userStatus || 'pending';

    console.log(
      `[Pending Approval] User ${user.id} - status: ${finalStatus} (url: ${urlStatus}, metadata: ${userStatus})`
    );

    setStatus(finalStatus);
    setUserEmail(user.email || '');

    // If approved, redirect to dashboard
    if (finalStatus === 'active') {
      console.log(
        `[Pending Approval] Account is active, redirecting to dashboard...`
      );
      toast.success('Your account has been approved!', {
        description: 'Redirecting to dashboard...',
        duration: 2000,
      });

      // Small delay to show the toast
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
      return;
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusConfig = (currentStatus: AccountStatus): StatusConfig => {
    switch (currentStatus) {
      case 'pending':
        return {
          icon: ClockIcon,
          title: 'Registration Under Review',
          message: 'Your account is being verified by our HR team',
          description:
            'We are carefully reviewing your registration to ensure all information is accurate and complete. This process typically takes 1-3 business days.',
          color: 'text-amber-600 dark:text-amber-400',
          bgGradient: 'from-amber-500/10 via-orange-500/5 to-amber-500/10',
          iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
          glowColor: 'rgba(251, 191, 36, 0.3)',
          borderColor: 'border-amber-500/20',
          points: [
            'Typical review time: 1-3 business days',
            'Email notification upon approval',
            'HR department verification in progress',
            'You can safely close this page',
          ],
          features: [
            {
              icon: PersonIcon,
              title: 'Identity Verification',
              description: 'HR is verifying your credentials and employment status',
              color: 'text-amber-600 dark:text-amber-400',
            },
            {
              icon: EnvelopeClosedIcon,
              title: 'Email Confirmation',
              description: "You'll receive an email once your account is approved",
              color: 'text-blue-600 dark:text-blue-400',
            },
            {
              icon: CheckIcon,
              title: 'Auto Approval',
              description: 'Your access will be automatically granted upon approval',
              color: 'text-green-600 dark:text-green-400',
            },
          ],
        };
      case 'active':
        return {
          icon: CheckCircledIcon,
          title: 'Account Approved',
          message: 'Welcome to TUP Manila Employee Portal',
          description:
            'Your account has been successfully approved. Redirecting you to the dashboard...',
          color: 'text-green-600 dark:text-green-400',
          bgGradient: 'from-green-500/10 via-emerald-500/5 to-green-500/10',
          iconBg: 'bg-green-500/10 dark:bg-green-500/20',
          glowColor: 'rgba(34, 197, 94, 0.3)',
          borderColor: 'border-green-500/20',
          points: [
            'Full access to all features',
            'PDS and SALN submission available',
            'Dashboard access granted',
            'Profile customization enabled',
          ],
          features: [
            {
              icon: CheckIcon,
              title: 'Full Access',
              description: 'Complete access to all portal features',
              color: 'text-green-600 dark:text-green-400',
            },
            {
              icon: PersonIcon,
              title: 'Profile Ready',
              description: 'Your employee profile is now active',
              color: 'text-blue-600 dark:text-blue-400',
            },
            {
              icon: InfoCircledIcon,
              title: 'Get Started',
              description: 'Begin submitting your PDS and SALN documents',
              color: 'text-purple-600 dark:text-purple-400',
            },
          ],
        };
      case 'rejected':
        return {
          icon: CrossCircledIcon,
          title: 'Registration Not Approved',
          message: 'Your registration could not be approved at this time',
          description:
            'Unfortunately, we were unable to approve your registration. Please contact HR for detailed information about the decision and next steps.',
          color: 'text-red-600 dark:text-red-400',
          bgGradient: 'from-red-500/10 via-rose-500/5 to-red-500/10',
          iconBg: 'bg-red-500/10 dark:bg-red-500/20',
          glowColor: 'rgba(239, 68, 68, 0.3)',
          borderColor: 'border-red-500/20',
          points: [
            'Contact HR department for details',
            'Email: hr@tup.edu.ph',
            'You may reapply if eligible',
            'Review required documentation',
          ],
          features: [
            {
              icon: EnvelopeClosedIcon,
              title: 'Contact HR',
              description: 'Reach out to HR for clarification on the decision',
              color: 'text-red-600 dark:text-red-400',
            },
            {
              icon: InfoCircledIcon,
              title: 'Review Details',
              description: 'Check your registration information for accuracy',
              color: 'text-orange-600 dark:text-orange-400',
            },
            {
              icon: ReloadIcon,
              title: 'Reapplication',
              description: 'You may be eligible to reapply after corrections',
              color: 'text-blue-600 dark:text-blue-400',
            },
          ],
        };
      case 'suspended':
        return {
          icon: ExclamationTriangleIcon,
          title: 'Account Suspended',
          message: 'Your account access has been temporarily restricted',
          description:
            'This account has been suspended. Please contact the administrator immediately for more information about the suspension and resolution process.',
          color: 'text-orange-600 dark:text-orange-400',
          bgGradient: 'from-orange-500/10 via-red-500/5 to-orange-500/10',
          iconBg: 'bg-orange-500/10 dark:bg-orange-500/20',
          glowColor: 'rgba(249, 115, 22, 0.3)',
          borderColor: 'border-orange-500/20',
          points: [
            'Contact administrator immediately',
            'Email: admin@tup.edu.ph',
            'Account review may be requested',
            'Temporary access restriction',
          ],
          features: [
            {
              icon: ExclamationTriangleIcon,
              title: 'Immediate Action',
              description: 'Contact administration for account restoration',
              color: 'text-orange-600 dark:text-orange-400',
            },
            {
              icon: EnvelopeClosedIcon,
              title: 'Support Available',
              description: 'Our team is ready to assist you',
              color: 'text-blue-600 dark:text-blue-400',
            },
            {
              icon: InfoCircledIcon,
              title: 'Review Process',
              description: 'Account suspension can be appealed',
              color: 'text-purple-600 dark:text-purple-400',
            },
          ],
        };
      default:
        return {
          icon: ClockIcon,
          title: 'Status Unknown',
          message: 'Unable to determine account status',
          description: 'Please contact support for assistance.',
          color: 'text-slate-600 dark:text-slate-400',
          bgGradient: 'from-slate-500/10 via-gray-500/5 to-slate-500/10',
          iconBg: 'bg-slate-500/10 dark:bg-slate-500/20',
          glowColor: 'rgba(148, 163, 184, 0.3)',
          borderColor: 'border-slate-500/20',
          points: ['Contact support', 'Verify your account details'],
          features: [
            {
              icon: InfoCircledIcon,
              title: 'Need Help?',
              description: 'Contact our support team for assistance',
              color: 'text-slate-600 dark:text-slate-400',
            },
          ],
        };
    }
  };

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const handleRefresh = () => {
    checkStatus();
  };

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden">
        <Particles
          className="absolute inset-0 pointer-events-none"
          quantity={60}
          staticity={30}
          color="#8B1538"
          ease={50}
        />
        <AnimatedGridPattern
          numSquares={40}
          maxOpacity={0.1}
          duration={3}
          repeatDelay={1}
          className={cn(
            '[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]',
            'inset-x-0 inset-y-[-30%] h-[200%] skew-y-12'
          )}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-[#8B1538] dark:border-t-red-400 blur-sm"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#8B1538]/20 border-t-[#8B1538] dark:border-red-400/20 dark:border-t-red-400"></div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-slate-800 dark:text-slate-100 font-bold text-xl">
              Checking account status...
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Please wait a moment
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Show auth error state with manual back to login button
  if (authError) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-red-50 dark:from-slate-950 dark:via-slate-900 dark:to-rose-950/30 px-4 overflow-hidden">
        <Particles
          className="absolute inset-0 pointer-events-none"
          quantity={40}
          staticity={40}
          color="#DC2626"
          ease={60}
        />
        <AnimatedGridPattern
          numSquares={35}
          maxOpacity={0.08}
          duration={3}
          repeatDelay={1}
          className={cn(
            '[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]',
            'inset-x-0 inset-y-[-30%] h-[200%] skew-y-12'
          )}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md mx-auto">
          <NeonGradientCard
            className="relative overflow-hidden bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-0 shadow-2xl"
            borderSize={2}
            borderRadius={16}
            neonColors={{
              firstColor: '#DC2626',
              secondColor: '#EF4444',
            }}>
            <Meteors number={15} />
            <div className="p-8 lg:p-10 space-y-6 text-center relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 rounded-full bg-red-500/20 dark:bg-red-500/30 blur-xl"></div>
                <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br from-red-500/10 to-rose-500/20 dark:from-red-500/20 dark:to-rose-500/30 border-2 border-red-500/30 dark:border-red-500/40">
                  <ExclamationTriangleIcon className="h-12 w-12 text-red-600 dark:text-red-400" />
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3">
                <h1 className="text-3xl font-bold text-red-600 dark:text-red-400">
                  Authentication Required
                </h1>
                <p className="text-slate-700 dark:text-slate-200 text-base leading-relaxed">
                  No active session found. Please log in to continue accessing your account.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}>
                <ShimmerButton
                  onClick={() => router.push('/auth/login')}
                  className="w-full h-12 bg-[#8B1538] hover:bg-[#6B0F2A] dark:bg-[#8B1538] dark:hover:bg-[#B8264D] text-white font-semibold transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl"
                  shimmerColor="#ffffff"
                  shimmerSize="0.15em"
                  shimmerDuration="2s"
                  background="rgba(139, 21, 56, 1)">
                  Back to Login
                </ShimmerButton>
              </motion.div>
            </div>
          </NeonGradientCard>
        </motion.div>
      </div>
    );
  }

  const config = getStatusConfig(status);
  const StatusIcon = config.icon;

  return (
    <div className="relative min-h-screen pt-20 flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 py-8 sm:py-12 overflow-hidden">
      {/* Animated Background Grid Pattern */}
      <AnimatedGridPattern
        numSquares={50}
        maxOpacity={0.05}
        duration={3}
        repeatDelay={1}
        className={cn(
          '[mask-image:radial-gradient(800px_circle_at_center,white,transparent)]',
          'inset-x-0 inset-y-[-30%] h-[200%] skew-y-12 opacity-30 dark:opacity-20'
        )}
      />

      {/* Main Content Container - More compact max-width */}
      <div className="relative z-10 w-full max-w-[600px] mx-auto space-y-6 sm:space-y-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-2 sm:space-y-3">
          <AnimatedGradientText className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            <span className="bg-gradient-to-r from-[#8B1538] via-[#6B0F2A] to-[#B8264D] bg-clip-text text-transparent dark:from-red-400 dark:via-red-300 dark:to-pink-400">
              TUPSAFE
            </span>
          </AnimatedGradientText>
          <p className="text-base sm:text-lg text-slate-700 dark:text-slate-200 font-medium">
            TUP Manila Employee Portal
          </p>
        </motion.div>

        {/* Status Card - More compact padding */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}>
          <MagicCard
            className="relative overflow-hidden bg-white dark:bg-slate-800 backdrop-blur-xl border border-slate-200 dark:border-slate-600 shadow-2xl rounded-2xl"
            gradientColor="rgba(139, 21, 56, 0.04)"
            gradientOpacity={0.15}>
            <BorderBeam
              size={280}
              duration={12}
              delay={9}
              className="opacity-40 dark:opacity-60"
            />

            <div className="p-6 sm:p-8 lg:p-10 space-y-6 sm:space-y-8">
              {/* Status Icon and Header - More compact spacing */}
              <div className="flex flex-col items-center text-center space-y-4 sm:space-y-5">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                    delay: 0.2,
                  }}
                  className={cn(
                    'w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg',
                    config.iconBg,
                    `bg-gradient-to-br ${config.bgGradient}`
                  )}>
                  <StatusIcon
                    className={cn('h-10 w-10 sm:h-12 sm:w-12', config.color)}
                    aria-hidden="true"
                  />
                </motion.div>

                <div className="space-y-2 sm:space-y-3">
                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className={cn(
                      'text-2xl sm:text-3xl font-bold leading-tight',
                      config.color
                    )}>
                    {config.title}
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-base sm:text-lg font-medium text-slate-800 dark:text-slate-100 px-2">
                    {config.message}
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-sm text-slate-700 dark:text-slate-200 max-w-md mx-auto px-2">
                    {config.description}
                  </motion.p>

                  {/* Admin Approval Required Notice - Prominent */}
                  {status === 'pending' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.55, type: 'spring' }}
                      className="mt-4 mx-auto max-w-md">
                      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 dark:from-amber-500/20 dark:via-orange-500/20 dark:to-amber-500/20 border-2 border-amber-500/30 dark:border-amber-500/40 p-4 shadow-lg">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5 dark:from-amber-500/10 dark:to-orange-500/10"></div>
                        <div className="relative flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 dark:bg-amber-500/30 flex items-center justify-center">
                              <InfoCircledIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-bold text-amber-900 dark:text-amber-300">
                              Admin Approval Required
                            </p>
                            <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                              You cannot log in until an administrator approves your registration. You'll receive an email notification once approved.
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* User Email Badge - More compact */}
                {userEmail && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Account:
                    </span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 break-all">
                      {userEmail}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Information Points - Enhanced with backgrounds */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="space-y-3 sm:space-y-4">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />

                <div className="grid gap-2 sm:gap-2.5">
                  {config.points.map((point, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200 shadow-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#8B1538] dark:bg-red-400 mt-1.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-100 leading-relaxed font-medium">
                        {point}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Action Buttons - Side-by-side on desktop */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="flex flex-col sm:flex-row gap-3 pt-2 sm:pt-4">
                {status === 'pending' && (
                  <ShimmerButton
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex-1 h-11 sm:h-12 bg-[#8B1538] hover:bg-[#6B0F2A] dark:bg-[#8B1538] dark:hover:bg-[#B8264D] text-white font-medium transition-all duration-300 rounded-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    shimmerColor="#ffffff"
                    shimmerSize="0.1em"
                    shimmerDuration="2s"
                    background="rgba(139, 21, 56, 1)">
                    {refreshing ? (
                      <>
                        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <ReloadIcon className="mr-2 h-4 w-4" />
                        Refresh Status
                      </>
                    )}
                  </ShimmerButton>
                )}

                <button
                  onClick={handleLogout}
                  className={cn(
                    'h-11 sm:h-12 rounded-lg border-2 border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-medium transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#8B1538] focus:ring-offset-2 dark:focus:ring-offset-slate-800',
                    status === 'pending' ? 'flex-1' : 'w-full'
                  )}>
                  Sign Out
                </button>
              </motion.div>
            </div>
          </MagicCard>
        </motion.div>

        {/* Help Section - More compact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center px-4">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-200 font-medium">
            Need assistance?{' '}
            <a
              href="mailto:hr@tup.edu.ph"
              className="text-[#8B1538] dark:text-red-300 font-semibold hover:text-[#6B0F2A] dark:hover:text-red-200 transition-colors inline-flex items-center gap-1 hover:underline">
              Contact HR Support
            </a>
          </p>
        </motion.div>
      </div>

      {/* Decorative Elements - Adjusted positions for better responsiveness */}
      <div className="absolute top-10 sm:top-20 left-5 sm:left-10 w-16 sm:w-20 h-16 sm:h-20 bg-[#8B1538]/10 dark:bg-[#8B1538]/20 rounded-full blur-xl pointer-events-none"></div>
      <div className="absolute bottom-10 sm:bottom-20 right-5 sm:right-10 w-24 sm:w-32 h-24 sm:h-32 bg-[#B8264D]/10 dark:bg-[#B8264D]/20 rounded-full blur-xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/4 w-12 sm:w-16 h-12 sm:h-16 bg-[#8B1538]/10 dark:bg-[#8B1538]/15 rounded-full blur-lg pointer-events-none"></div>
    </div>
  );
}

export default function PendingApprovalPage() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-screen pt-20 flex items-center justify-center bg-gradient-to-br from-slate-50 via-red-50 to-[#B8264D]/20 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#8B1538]/20 border-t-[#8B1538]"></div>
        </div>
      }>
      <PendingApprovalContent />
    </Suspense>
  );
}
