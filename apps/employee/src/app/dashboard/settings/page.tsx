'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MagicCard } from '@/components/ui/magic-card';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { DotPattern } from '@/components/ui/dot-pattern';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { cn } from '@/lib/utils';
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
} from 'lucide-react';

export default function SettingsPage() {
  // Security Settings State
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Notification Settings State
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Privacy Settings State
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'private' | 'colleagues'>('colleagues');
  const [dataSharing, setDataSharing] = useState(false);
  const [activityTracking, setActivityTracking] = useState(true);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Subtle Background Pattern */}
      <DotPattern
        className="absolute inset-0 -z-10 opacity-[0.015] dark:opacity-[0.025] text-slate-600"
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
      />

      {/* Centered Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
<<<<<<< HEAD
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-8"
        >
          {/* Page Header */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex items-center gap-4 mb-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#093FB4] to-[#0066B3] shadow-lg">
                <SettingsIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
                  Settings
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Manage your preferences and account settings
                </p>
=======
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}>
          <div className="relative group">
            <BorderBeam
              size={200}
              duration={8}
              delay={0}
              colorFrom="#8B1538"
              colorTo="#B8264D"
            />
            <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B1538] to-[#B8264D] shadow-lg shadow-[#8B1538]/20">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Profile
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    Update your personal details
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="Juan"
                      defaultValue="Juan"
                      className="h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-[#B8264D] dark:focus:border-[#B8264D] transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Dela Cruz"
                      defaultValue="Dela Cruz"
                      className="h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-[#B8264D] dark:focus:border-[#B8264D] transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      defaultValue={user?.email || ''}
                      readOnly
                      className="h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 pr-24"
                    />
                    <Badge className="absolute right-3 top-1/2 -translate-y-1/2 bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-0">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    Email is verified and cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="phone"
                    className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+63 912 345 6789"
                    defaultValue="+63 912 345 6789"
                    className="h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-[#B8264D] dark:focus:border-[#B8264D] transition-colors"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="h-10 px-6 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                    Cancel
                  </Button>
                  <ShimmerButton
                    className="h-10 px-6"
                    shimmerColor="#ffffff"
                    shimmerSize="0.08em"
                    shimmerDuration="2.5s"
                    borderRadius="0.5rem"
                    background="linear-gradient(135deg, #8B1538 0%, #B8264D 100%)">
                    <Zap className="h-4 w-4 mr-2" />
                    Save Changes
                  </ShimmerButton>
                </div>
>>>>>>> 71598573d189041eaa79c66dfb2f6ac4867149a6
              </div>
            </div>
          </motion.div>

<<<<<<< HEAD
          {/* Theme Settings Section */}
          <motion.div variants={itemVariants}>
            <MagicCard
              className="overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border-2 border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300"
              gradientSize={0}
              gradientOpacity={0}
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#093FB4] to-[#0066B3] shadow-md">
                    <Palette className="h-6 w-6 text-white" />
=======
        {/* Security Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}>
          <div className="relative group">
            <BorderBeam
              size={200}
              duration={8}
              delay={2}
              colorFrom="#ef4444"
              colorTo="#dc2626"
            />
            <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/20">
                  <Lock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Security
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    Password and authentication
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="currentPassword"
                    className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Current Password
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="••••••••"
                    className="h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-red-500 dark:focus:border-red-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="newPassword"
                      className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      New Password
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      className="h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-red-500 dark:focus:border-red-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-red-500 dark:focus:border-red-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="relative group/2fa">
                  <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          Two-Factor Authentication
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                          Extra security layer
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 border-0">
                      Not Enabled
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="h-10 px-6 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                    Cancel
                  </Button>
                  <Button className="h-10 px-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/20">
                    Update Password
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Notifications Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}>
          <div className="relative group">
            <BorderBeam
              size={200}
              duration={8}
              delay={4}
              colorFrom="#8b5cf6"
              colorTo="#a855f7"
            />
            <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/20">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Notifications
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    How you receive updates
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <ToggleItem
                  icon={<Bell className="h-5 w-5" />}
                  title="All Notifications"
                  description="Master control"
                  checked={notificationsEnabled}
                  onChange={() =>
                    setNotificationsEnabled(!notificationsEnabled)
                  }
                />

                <ToggleItem
                  icon={<Mail className="h-5 w-5" />}
                  title="Email"
                  description="Updates via email"
                  checked={emailNotifications}
                  onChange={() => setEmailNotifications(!emailNotifications)}
                  disabled={!notificationsEnabled}
                />

                <ToggleItem
                  icon={<Smartphone className="h-5 w-5" />}
                  title="SMS"
                  description="Updates via text"
                  checked={smsNotifications}
                  onChange={() => setSmsNotifications(!smsNotifications)}
                  disabled={!notificationsEnabled}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Appearance & Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Appearance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}>
            <NeonGradientCard
              className="h-full"
              borderSize={1}
              borderRadius={16}
              neonColors={{
                firstColor: '#8B1538',
                secondColor: '#B8264D',
              }}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B1538] to-[#B8264D] shadow-lg shadow-[#8B1538]/20">
                    <Palette className="h-5 w-5 text-white" />
>>>>>>> 71598573d189041eaa79c66dfb2f6ac4867149a6
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

                <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Display Mode
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Choose your preferred theme
                      </p>
                    </div>
                    <ThemeToggle variant="button" size="md" showLabel={true} />
                  </div>
                </div>
              </div>
            </MagicCard>
          </motion.div>

          {/* Security Settings Section */}
          <motion.div variants={itemVariants}>
            <MagicCard
              className="overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border-2 border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300"
              gradientSize={0}
              gradientOpacity={0}
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#093FB4] to-[#0066B3] shadow-md">
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
                          className="text-xs font-medium text-slate-700 dark:text-slate-300"
                        >
                          Current Password
                        </Label>
                        <div className="relative mt-1.5">
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? 'text' : 'password'}
                            placeholder="Enter current password"
                            className="h-11 pr-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#093FB4] focus:border-[#093FB4] transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                          >
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
                            className="text-xs font-medium text-slate-700 dark:text-slate-300"
                          >
                            New Password
                          </Label>
                          <div className="relative mt-1.5">
                            <Input
                              id="newPassword"
                              type={showNewPassword ? 'text' : 'password'}
                              placeholder="Enter new password"
                              className="h-11 pr-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#093FB4] focus:border-[#093FB4] transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                            >
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
                            className="text-xs font-medium text-slate-700 dark:text-slate-300"
                          >
                            Confirm Password
                          </Label>
                          <div className="relative mt-1.5">
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Confirm new password"
                              className="h-11 pr-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#093FB4] focus:border-[#093FB4] transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                            >
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
                      onChange={() => setTwoFactorEnabled(!twoFactorEnabled)}
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
                      className="h-11 px-6 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300"
                    >
                      Cancel
                    </Button>
                    <ShimmerButton
                      className="h-11 px-6 text-sm font-medium"
                      background="linear-gradient(135deg, #093FB4 0%, #0066B3 100%)"
                      shimmerColor="#ffffff"
                    >
                      Update Password
                    </ShimmerButton>
                  </div>
                </div>
              </div>
            </MagicCard>
          </motion.div>

          {/* Privacy Settings Section */}
          <motion.div variants={itemVariants}>
            <MagicCard
              className="overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border-2 border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300"
              gradientSize={0}
              gradientOpacity={0}
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#093FB4] to-[#0066B3] shadow-md">
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
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-[#093FB4]" />
                      <Label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Profile Visibility
                      </Label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <VisibilityOption
                        label="Public"
                        description="Everyone can see"
                        active={profileVisibility === 'public'}
                        onClick={() => setProfileVisibility('public')}
                      />
                      <VisibilityOption
                        label="Colleagues"
                        description="Only colleagues"
                        active={profileVisibility === 'colleagues'}
                        onClick={() => setProfileVisibility('colleagues')}
                      />
                      <VisibilityOption
                        label="Private"
                        description="Only you"
                        active={profileVisibility === 'private'}
                        onClick={() => setProfileVisibility('private')}
                      />
                    </div>
                  </div>

                  <div className="pt-4 space-y-3 border-t border-slate-200 dark:border-slate-700">
                    <ToggleItem
                      icon={<Database className="h-5 w-5" />}
                      title="Data Sharing"
                      description="Allow aggregated data usage for analytics"
                      checked={dataSharing}
                      onChange={() => setDataSharing(!dataSharing)}
                    />
                    <ToggleItem
                      icon={<Activity className="h-5 w-5" />}
                      title="Activity Tracking"
                      description="Track your activity for better recommendations"
                      checked={activityTracking}
                      onChange={() => setActivityTracking(!activityTracking)}
                    />
                  </div>
                </div>
              </div>
            </MagicCard>
          </motion.div>

          {/* Notification Settings Section */}
          <motion.div variants={itemVariants}>
            <MagicCard
              className="overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border-2 border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300"
              gradientSize={0}
              gradientOpacity={0}
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#093FB4] to-[#0066B3] shadow-md">
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
                  <ToggleItem
                    icon={<Bell className="h-5 w-5" />}
                    title="All Notifications"
                    description="Master control for all notification types"
                    checked={notificationsEnabled}
                    onChange={() => setNotificationsEnabled(!notificationsEnabled)}
                  />

                  <div className="ml-8 space-y-3 pl-5 border-l-2 border-slate-200 dark:border-slate-700">
                    <ToggleItem
                      icon={<Mail className="h-5 w-5" />}
                      title="Email Notifications"
                      description="Receive updates via email"
                      checked={emailNotifications}
                      onChange={() => setEmailNotifications(!emailNotifications)}
                      disabled={!notificationsEnabled}
                    />

                    <ToggleItem
                      icon={<Bell className="h-5 w-5" />}
                      title="Push Notifications"
                      description="Browser push notifications"
                      checked={pushNotifications}
                      onChange={() => setPushNotifications(!pushNotifications)}
                      disabled={!notificationsEnabled}
                    />

                    <ToggleItem
                      icon={<Smartphone className="h-5 w-5" />}
                      title="SMS Notifications"
                      description="Receive urgent alerts via text message"
                      checked={smsNotifications}
                      onChange={() => setSmsNotifications(!smsNotifications)}
                      disabled={!notificationsEnabled}
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <ToggleItem
                      icon={<Bell className="h-5 w-5" />}
                      title="Sound Effects"
                      description="Play sound for notifications"
                      checked={soundEnabled}
                      onChange={() => setSoundEnabled(!soundEnabled)}
                      disabled={!notificationsEnabled}
                    />
                  </div>
                </div>
              </div>
            </MagicCard>
          </motion.div>

          {/* Session Information */}
          <motion.div variants={itemVariants}>
            <MagicCard
              className="overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border-2 border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300"
              gradientSize={0}
              gradientOpacity={0}
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#093FB4] to-[#0066B3] shadow-md">
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <SessionItem
                    icon={<Clock className="h-4 w-4" />}
                    label="Last Login"
                    value="Today at 9:45 AM"
                    badge={
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-0">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    }
                  />
                  <SessionItem
                    icon={<Globe className="h-4 w-4" />}
                    label="IP Address"
                    value="192.168.1.1"
                  />
                  <SessionItem
                    icon={<FileText className="h-4 w-4" />}
                    label="Device"
                    value="Chrome on Windows"
                  />
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto h-11 px-6 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-300"
                  >
                    End All Sessions
                  </Button>
                </div>
              </div>
            </MagicCard>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// Helper Components
function ToggleItem({
  icon,
  title,
  description,
  checked,
  onChange,
  disabled = false,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  badge?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 transition-all duration-300',
        !disabled && 'hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm',
        disabled && 'opacity-50'
      )}>
      <div className="flex items-center gap-3 flex-1">
        <div
          className={cn(
            'text-slate-600 dark:text-slate-400 transition-colors',
            checked && !disabled && 'text-[#093FB4] dark:text-blue-400'
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
          'relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200',
          checked && !disabled
            ? 'bg-gradient-to-r from-[#093FB4] to-[#0066B3] shadow-lg shadow-blue-500/30'
            : 'bg-slate-300 dark:bg-slate-700',
          disabled && 'cursor-not-allowed'
        )}>
        <motion.span
          className="inline-block h-5 w-5 transform rounded-full bg-white shadow-lg"
          animate={{ x: checked && !disabled ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}

function VisibilityOption({
  label,
  description,
  active,
  onClick,
}: {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'flex flex-col items-start gap-1 p-5 rounded-xl border-2 transition-all duration-300',
        active
          ? 'border-[#093FB4] bg-blue-50 dark:bg-blue-950/20 shadow-lg shadow-blue-500/10'
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/30'
      )}>
      <span
        className={cn(
          'text-sm font-semibold transition-colors',
          active
            ? 'text-[#093FB4] dark:text-blue-400'
            : 'text-slate-900 dark:text-slate-100'
        )}>
        {label}
      </span>
      <span className="text-xs text-slate-600 dark:text-slate-400">
        {description}
      </span>
    </motion.button>
  );
}

function SessionItem({
  icon,
  label,
  value,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  badge?: React.ReactNode;
}) {
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
}
