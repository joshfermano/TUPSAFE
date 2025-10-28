'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@tupsafe/mock-data/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { NeonGradientCard } from '@/components/ui/neon-gradient-card';
import { BorderBeam } from '@/components/ui/border-beam';
import { Ripple } from '@/components/ui/ripple';
import { cn } from '@/lib/utils';
import {
  User,
  Lock,
  Bell,
  Palette,
  Shield,
  Mail,
  Smartphone,
  Download,
  Trash2,
  CheckCircle2,
  Moon,
  Sun,
  Monitor,
  Activity,
  FileText,
  Zap,
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  return (
    <div className="relative min-h-screen pb-12">
      {/* Subtle Ripple Background */}
      <Ripple
        className="absolute inset-0 -z-10"
        mainCircleSize={150}
        mainCircleOpacity={0.05}
        numCircles={5}
      />

      {/* Minimal Page Header */}
      <motion.div
        className="mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-slate-100 dark:via-slate-300 dark:to-slate-100 bg-clip-text text-transparent mb-2">
          Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-500">
          Manage your preferences
        </p>
      </motion.div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}>
          <div className="relative group">
            <BorderBeam
              size={200}
              duration={8}
              delay={0}
              colorFrom="#3b82f6"
              colorTo="#8b5cf6"
            />
            <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20">
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
                      className="h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
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
                      className="h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
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
                    className="h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
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
                    background="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)">
                    <Zap className="h-4 w-4 mr-2" />
                    Save Changes
                  </ShimmerButton>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

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
                firstColor: '#6366f1',
                secondColor: '#8b5cf6',
              }}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/20">
                    <Palette className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Theme
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      Interface appearance
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <ThemeOption
                    icon={<Sun className="h-5 w-5" />}
                    label="Light"
                    active={theme === 'light'}
                    onClick={() => setTheme('light')}
                  />
                  <ThemeOption
                    icon={<Moon className="h-5 w-5" />}
                    label="Dark"
                    active={theme === 'dark'}
                    onClick={() => setTheme('dark')}
                  />
                  <ThemeOption
                    icon={<Monitor className="h-5 w-5" />}
                    label="Auto"
                    active={theme === 'system'}
                    onClick={() => setTheme('system')}
                  />
                </div>
              </div>
            </NeonGradientCard>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}>
            <NeonGradientCard
              className="h-full"
              borderSize={1}
              borderRadius={16}
              neonColors={{
                firstColor: '#10b981',
                secondColor: '#059669',
              }}>
              <div className="p-6">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <ActionButton
                    icon={<Activity className="h-4 w-4" />}
                    label="Activity Log"
                  />
                  <ActionButton
                    icon={<FileText className="h-4 w-4" />}
                    label="Export Data"
                  />
                  <ActionButton
                    icon={<Download className="h-4 w-4" />}
                    label="Download"
                  />
                  <Separator className="my-2" />
                  <ActionButton
                    icon={<Trash2 className="h-4 w-4" />}
                    label="Delete Account"
                    danger
                  />
                </div>
              </div>
            </NeonGradientCard>
          </motion.div>
        </div>

        {/* Session Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}>
          <div className="relative bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Session Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <SessionItem
                label="Last Login"
                value="Today at 9:45 AM"
                badge={
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                }
              />
              <SessionItem label="IP Address" value="192.168.1.1" />
              <SessionItem label="Device" value="Chrome on Windows" />
            </div>
          </div>
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
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-200 dark:border-slate-700 transition-all',
        !disabled &&
          'hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm',
        disabled && 'opacity-50'
      )}>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'text-slate-600 dark:text-slate-400',
            checked && !disabled && 'text-purple-600 dark:text-purple-400'
          )}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {title}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500">
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
            ? 'bg-gradient-to-r from-purple-600 to-purple-700 shadow-lg shadow-purple-500/30'
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

function ThemeOption({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
        active
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 shadow-lg shadow-indigo-500/10'
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
      )}>
      <div
        className={cn(
          'transition-colors',
          active
            ? 'text-indigo-600 dark:text-indigo-400'
            : 'text-slate-600 dark:text-slate-400'
        )}>
        {icon}
      </div>
      <span
        className={cn(
          'text-xs font-medium transition-colors',
          active
            ? 'text-indigo-900 dark:text-indigo-100'
            : 'text-slate-700 dark:text-slate-300'
        )}>
        {label}
      </span>
    </motion.button>
  );
}

function ActionButton({
  icon,
  label,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'flex items-center gap-3 w-full p-3 rounded-lg text-left transition-all text-sm font-medium',
        danger
          ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20'
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
      )}>
      {icon}
      {label}
    </motion.button>
  );
}

function SessionItem({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-slate-500 dark:text-slate-500">{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {value}
        </p>
        {badge}
      </div>
    </div>
  );
}
