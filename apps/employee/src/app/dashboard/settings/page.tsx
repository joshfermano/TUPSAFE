'use client';

import { useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { ShimmerButton } from '../../../components/ui/shimmer-button';
import { Skeleton } from '../../../components/ui/skeleton';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { useUserSettings, useUpdateSettings } from '../../../hooks/useSettings';
import { useProfile } from '../../../hooks/useProfile';
import { useCurrentSession, useTerminateAllSessions } from '../../../hooks/useSession';
import { useChangePassword } from '../../../hooks/useSecurity';
import { useRealtimeProfile } from '@tupsafe/database/client';
import {
  Lock,
  Bell,
  Shield,
  Mail,
  Smartphone,
  Eye,
  EyeOff,
  CheckCircle2,
  Activity,
  Clock,
  Globe,
  Database,
  FileText,
  Settings as SettingsIcon,
  Palette,
  Sun,
  Moon,
  Monitor,
  AlertCircle,
} from 'lucide-react';

// Memoized Helper Components with proper types
const ToggleItem = memo<{
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  badge?: React.ReactNode;
}>(function ToggleItem({
  icon,
  title,
  description,
  checked,
  onChange,
  disabled = false,
  badge,
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 transition-all duration-200',
        !disabled &&
          'hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm',
        disabled && 'opacity-50'
      )}
      style={{ contain: 'layout style' }}>
      <div className="flex items-center gap-3 flex-1">
        <div
          className={cn(
            'text-slate-600 dark:text-slate-400 transition-colors duration-200',
            checked && !disabled && 'text-primary dark:text-tup-crimson-light'
          )}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {title}
            </p>
            {badge}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {description}
          </p>
        </div>
      </div>
      <button
        onClick={onChange}
        disabled={disabled}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
          checked && !disabled
            ? 'bg-gradient-tup shadow-lg shadow-primary/30'
            : 'bg-slate-300 dark:bg-slate-700',
          disabled && 'cursor-not-allowed'
        )}
        aria-label={`Toggle ${title}`}>
        <motion.span
          className="inline-block h-5 w-5 transform rounded-full bg-white shadow-lg"
          animate={{ x: checked && !disabled ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
});

const VisibilityOption = memo<{
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}>(function VisibilityOption({ label, description, active, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'flex flex-col items-start gap-1 p-5 rounded-xl border-2 transition-all duration-200',
        active
          ? 'border-primary bg-tup-crimson-subtle dark:bg-primary/20 shadow-lg shadow-primary/10'
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900/30'
      )}
      style={{ contain: 'layout style' }}>
      <span
        className={cn(
          'text-sm font-semibold transition-colors duration-200',
          active
            ? 'text-primary dark:text-tup-crimson-light'
            : 'text-slate-900 dark:text-slate-100'
        )}>
        {label}
      </span>
      <span className="text-xs text-slate-600 dark:text-slate-400">
        {description}
      </span>
    </motion.button>
  );
});

const SessionItem = memo<{
  icon: React.ReactNode;
  label: string;
  value: string;
  badge?: React.ReactNode;
}>(function SessionItem({ icon, label, value, badge }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {value}
        </p>
        {badge}
      </div>
    </div>
  );
});

// Optimized Theme Selector Component - fully isolated with CSS containment
const ThemeSelector = memo(function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex gap-3" style={{ contain: 'layout style' }}>
      <Button
        onClick={() => setTheme('light')}
        variant={theme === 'light' ? 'default' : 'outline'}
        className={cn(
          'min-w-[110px] h-11 transition-colors duration-200',
          theme === 'light'
            ? 'bg-gradient-tup text-white shadow-md hover:shadow-lg'
            : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
        )}
        aria-label="Switch to light theme">
        <Sun className="h-4 w-4 mr-2" />
        Light
      </Button>
      <Button
        onClick={() => setTheme('dark')}
        variant={theme === 'dark' ? 'default' : 'outline'}
        className={cn(
          'min-w-[110px] h-11 transition-colors duration-200',
          theme === 'dark'
            ? 'bg-gradient-tup text-white shadow-md hover:shadow-lg'
            : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
        )}
        aria-label="Switch to dark theme">
        <Moon className="h-4 w-4 mr-2" />
        Dark
      </Button>
      <Button
        onClick={() => setTheme('system')}
        variant={theme === 'system' ? 'default' : 'outline'}
        className={cn(
          'min-w-[110px] h-11 transition-colors duration-200',
          theme === 'system'
            ? 'bg-gradient-tup text-white shadow-md hover:shadow-lg'
            : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
        )}
        aria-label="Use system theme preference">
        <Monitor className="h-4 w-4 mr-2" />
        System
      </Button>
    </div>
  );
});

// Memoized Theme Section Component - isolated from main page re-renders
const ThemeSection = memo(function ThemeSection() {
  return (
    <motion.div variants={ITEM_VARIANTS}>
      <div
        className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg transition-shadow duration-200"
        style={{ contain: 'layout paint' }}>
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-tup shadow-md">
              <Palette className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Theme Settings
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Customize your interface appearance
              </p>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 transition-colors duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Display Mode
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Choose your preferred theme
                </p>
              </div>
              <ThemeSelector />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// Animation variants - extracted to prevent recreation on every render
const CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function SettingsPage() {
  // React Query Hooks
  const { data: settings, isLoading: settingsLoading, error: settingsError } = useUserSettings();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: session, isLoading: sessionLoading } = useCurrentSession();
  const updateSettings = useUpdateSettings();
  const changePassword = useChangePassword();
  const terminateAllSessions = useTerminateAllSessions();

  // Enable real-time profile updates
  useRealtimeProfile(profile?.id || '');

  // Local UI State (not stored in database)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Password visibility toggles (local UI state)
  const toggleCurrentPassword = useCallback(
    () => setShowCurrentPassword((prev) => !prev),
    []
  );
  const toggleNewPassword = useCallback(
    () => setShowNewPassword((prev) => !prev),
    []
  );
  const toggleConfirmPassword = useCallback(
    () => setShowConfirmPassword((prev) => !prev),
    []
  );
  const toggleTwoFactor = useCallback(
    () => setTwoFactorEnabled((prev) => !prev),
    []
  );

  // Settings mutation callbacks (API updates)
  const toggleEmailNotifications = useCallback(
    () => {
      if (settings) {
        updateSettings.mutate({
          emailNotificationsEnabled: !settings.emailNotificationsEnabled,
        });
      }
    },
    [settings, updateSettings]
  );

  const togglePushNotifications = useCallback(
    () => {
      if (settings) {
        updateSettings.mutate({
          pushNotificationsEnabled: !settings.pushNotificationsEnabled,
        });
      }
    },
    [settings, updateSettings]
  );

  const toggleSmsNotifications = useCallback(
    () => {
      if (settings) {
        updateSettings.mutate({
          smsNotificationsEnabled: !settings.smsNotificationsEnabled,
        });
      }
    },
    [settings, updateSettings]
  );

  const toggleSound = useCallback(
    () => {
      if (settings) {
        updateSettings.mutate({
          soundEnabled: !settings.soundEnabled,
        });
      }
    },
    [settings, updateSettings]
  );

  const toggleDataSharing = useCallback(
    () => {
      if (settings) {
        updateSettings.mutate({
          dataSharingEnabled: !settings.dataSharingEnabled,
        });
      }
    },
    [settings, updateSettings]
  );

  const toggleActivityTracking = useCallback(
    () => {
      if (settings) {
        updateSettings.mutate({
          activityTrackingEnabled: !settings.activityTrackingEnabled,
        });
      }
    },
    [settings, updateSettings]
  );

  const setPublicVisibility = useCallback(
    () => {
      updateSettings.mutate({ profileVisibility: 'public' });
    },
    [updateSettings]
  );

  const setColleaguesVisibility = useCallback(
    () => {
      updateSettings.mutate({ profileVisibility: 'colleagues' });
    },
    [updateSettings]
  );

  const setPrivateVisibility = useCallback(
    () => {
      updateSettings.mutate({ profileVisibility: 'private' });
    },
    [updateSettings]
  );

  // Password change handler
  const handlePasswordChange = useCallback(() => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return;
    }
    changePassword.mutate(
      {
        currentPassword,
        newPassword,
        confirmPassword,
      },
      {
        onSuccess: () => {
          // Clear password fields on success
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        },
      }
    );
  }, [currentPassword, newPassword, confirmPassword, changePassword]);

  // Session termination handler
  const handleTerminateAllSessions = useCallback(() => {
    terminateAllSessions.mutate();
  }, [terminateAllSessions]);

  // Loading state
  const isLoading = settingsLoading || profileLoading || sessionLoading;

  // Check if all notifications are enabled
  const allNotificationsEnabled =
    settings?.emailNotificationsEnabled ||
    settings?.pushNotificationsEnabled ||
    settings?.smsNotificationsEnabled;

  return (
    <div className="min-h-screen relative">
      {/* Centered Container */}
      <div className="max-w-5xl mx-auto space-y-8 pb-8">
        {/* Error State */}
        {settingsError && (
          <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <h3 className="text-sm font-semibold text-red-900 dark:text-red-100">
                  Failed to load settings
                </h3>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  {settingsError instanceof Error
                    ? settingsError.message
                    : 'An error occurred while loading your settings.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <motion.div
          initial="hidden"
          animate="visible"
          variants={CONTAINER_VARIANTS}
          className="space-y-8">
          {/* Page Header */}
          <motion.div variants={ITEM_VARIANTS} className="mb-8">
            <div className="flex items-center gap-4 mb-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-tup shadow-lg">
                <SettingsIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
                  Settings
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Manage your preferences and account settings
                </p>
              </div>
            </div>
          </motion.div>

          {/* Theme Settings Section - Memoized to prevent re-renders */}
          <ThemeSection />

          {/* Security Settings Section */}
          <motion.div variants={ITEM_VARIANTS}>
            <div
              className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg transition-shadow duration-200"
              style={{ contain: 'layout paint' }}>
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-tup shadow-md">
                    <Lock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                      Security Settings
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                      Password and authentication management
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Password Change */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Change Password
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <Label
                          htmlFor="currentPassword"
                          className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Current Password
                        </Label>
                        <div className="relative mt-1.5">
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? 'text' : 'password'}
                            placeholder="Enter current password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            disabled={changePassword.isPending}
                            className="h-11 pr-10 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                          />
                          <button
                            type="button"
                            onClick={toggleCurrentPassword}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                            aria-label="Toggle current password visibility">
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label
                            htmlFor="newPassword"
                            className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            New Password
                          </Label>
                          <div className="relative mt-1.5">
                            <Input
                              id="newPassword"
                              type={showNewPassword ? 'text' : 'password'}
                              placeholder="Enter new password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              disabled={changePassword.isPending}
                              className="h-11 pr-10 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                            />
                            <button
                              type="button"
                              onClick={toggleNewPassword}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                              aria-label="Toggle new password visibility">
                              {showNewPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <Label
                            htmlFor="confirmPassword"
                            className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            Confirm Password
                          </Label>
                          <div className="relative mt-1.5">
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Confirm new password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              disabled={changePassword.isPending}
                              className="h-11 pr-10 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                            />
                            <button
                              type="button"
                              onClick={toggleConfirmPassword}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                              aria-label="Toggle confirm password visibility">
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <ToggleItem
                      icon={<Shield className="h-5 w-5" />}
                      title="Two-Factor Authentication"
                      description="Add an extra layer of security to your account"
                      checked={twoFactorEnabled}
                      onChange={toggleTwoFactor}
                      badge={
                        twoFactorEnabled ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-0">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Enabled
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 border-0">
                            Not Enabled
                          </Badge>
                        )
                      }
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      disabled={changePassword.isPending}
                      className="h-11 px-6 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300">
                      Cancel
                    </Button>
                    <ShimmerButton
                      onClick={handlePasswordChange}
                      disabled={
                        !currentPassword ||
                        !newPassword ||
                        !confirmPassword ||
                        changePassword.isPending
                      }
                      className="h-11 px-6 text-sm font-medium text-white dark:text-white"
                      background="linear-gradient(135deg, oklch(0.55 0.22 15) 0%, oklch(0.40 0.18 15) 100%)"
                      shimmerColor="#ffffff">
                      {changePassword.isPending ? 'Updating...' : 'Update Password'}
                    </ShimmerButton>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Privacy Settings Section */}
          <motion.div variants={ITEM_VARIANTS}>
            <div
              className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg transition-shadow duration-200"
              style={{ contain: 'layout paint' }}>
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-tup shadow-md">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                      Privacy Settings
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                      Control your data and visibility preferences
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Profile Visibility */}
                  {isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-6 w-40" />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" />
                        <Label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          Profile Visibility
                        </Label>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <VisibilityOption
                          label="Public"
                          description="Everyone can see"
                          active={settings?.profileVisibility === 'public'}
                          onClick={setPublicVisibility}
                        />
                        <VisibilityOption
                          label="Colleagues"
                          description="Only colleagues"
                          active={settings?.profileVisibility === 'colleagues'}
                          onClick={setColleaguesVisibility}
                        />
                        <VisibilityOption
                          label="Private"
                          description="Only you"
                          active={settings?.profileVisibility === 'private'}
                          onClick={setPrivateVisibility}
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-4 space-y-3 border-t border-slate-200 dark:border-slate-700">
                    {isLoading ? (
                      <>
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                      </>
                    ) : (
                      <>
                        <ToggleItem
                          icon={<Database className="h-5 w-5" />}
                          title="Data Sharing"
                          description="Allow aggregated data usage for analytics"
                          checked={settings?.dataSharingEnabled ?? false}
                          onChange={toggleDataSharing}
                        />
                        <ToggleItem
                          icon={<Activity className="h-5 w-5" />}
                          title="Activity Tracking"
                          description="Track your activity for better recommendations"
                          checked={settings?.activityTrackingEnabled ?? false}
                          onChange={toggleActivityTracking}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Notification Settings Section */}
          <motion.div variants={ITEM_VARIANTS}>
            <div
              className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg transition-shadow duration-200"
              style={{ contain: 'layout paint' }}>
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-tup shadow-md">
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                      Notification Settings
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                      Manage how you receive updates and alerts
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-20" />
                      <div className="ml-8 space-y-3 pl-5 border-l-2 border-slate-200 dark:border-slate-700">
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                      </div>
                      <Skeleton className="h-20 mt-4" />
                    </>
                  ) : (
                    <>
                      <ToggleItem
                        icon={<Bell className="h-5 w-5" />}
                        title="Email Notifications"
                        description="Master control for email notifications"
                        checked={settings?.emailNotificationsEnabled ?? false}
                        onChange={toggleEmailNotifications}
                      />

                      <div className="ml-8 space-y-3 pl-5 border-l-2 border-slate-200 dark:border-slate-700">
                        <ToggleItem
                          icon={<Bell className="h-5 w-5" />}
                          title="Push Notifications"
                          description="Browser push notifications"
                          checked={settings?.pushNotificationsEnabled ?? false}
                          onChange={togglePushNotifications}
                          disabled={!allNotificationsEnabled}
                        />

                        <ToggleItem
                          icon={<Smartphone className="h-5 w-5" />}
                          title="SMS Notifications"
                          description="Receive urgent alerts via text message"
                          checked={settings?.smsNotificationsEnabled ?? false}
                          onChange={toggleSmsNotifications}
                          disabled={!allNotificationsEnabled}
                        />
                      </div>

                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <ToggleItem
                          icon={<Bell className="h-5 w-5" />}
                          title="Sound Effects"
                          description="Play sound for notifications"
                          checked={settings?.soundEnabled ?? false}
                          onChange={toggleSound}
                          disabled={!allNotificationsEnabled}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Session Information */}
          <motion.div variants={ITEM_VARIANTS}>
            <div
              className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg transition-shadow duration-200"
              style={{ contain: 'layout paint' }}>
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-tup shadow-md">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                      Session Information
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                      Current session details and activity
                    </p>
                  </div>
                </div>

                {sessionLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                  </div>
                ) : session ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <SessionItem
                      icon={<Clock className="h-4 w-4" />}
                      label="Last Login"
                      value={formatDistanceToNow(new Date(session.loginAt), {
                        addSuffix: true,
                      })}
                      badge={
                        session.isActive ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-0">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : undefined
                      }
                    />
                    <SessionItem
                      icon={<Globe className="h-4 w-4" />}
                      label="IP Address"
                      value={session.ipAddress || 'Unknown'}
                    />
                    <SessionItem
                      icon={<FileText className="h-4 w-4" />}
                      label="Device"
                      value={session.deviceDescription || 'Unknown device'}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    No session information available
                  </p>
                )}

                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    onClick={handleTerminateAllSessions}
                    disabled={terminateAllSessions.isPending}
                    variant="outline"
                    className="w-full sm:w-auto h-11 px-6 border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 dark:hover:border-red-600 transition-all duration-300">
                    {terminateAllSessions.isPending
                      ? 'Ending Sessions...'
                      : 'End All Sessions'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
