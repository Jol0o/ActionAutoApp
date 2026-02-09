'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
// import { useAuth } from '@/context/AuthContext'; // Replaced with Clerk
import { useClerk, useUser } from "@clerk/nextjs";
import { useTheme } from '@/context/ThemeContext';
import { useAlert } from '@/components/AlertDialog';
import {
  User,
  Mail,
  Lock,
  Bell,
  Moon,
  Sun,
  Crown,
  Calendar,
  Check,
  X,
  Loader2,
  Shield,
  Settings,
  CreditCard,
  Truck,
  MapPin,
  Package,
  Zap,
  Award,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { UserProfile } from '@/types/user';
import { NotificationPreferences } from '@/types/notification';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  // const { user, logout } = useAuth(); // Replaced with Clerk
  const { user } = useUser();
  const { signOut } = useClerk();
  const logout = signOut;

  const { theme, toggleTheme } = useTheme();
  const { showAlert, AlertComponent } = useAlert();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Email change state
  const [emailData, setEmailData] = useState({
    email: '',
    password: '',
  });

  // Notification preferences
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.data);
        setPreferences(data.data.notificationPreferences);
        setEmailData({ ...emailData, email: data.data.email });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showAlert({
        type: 'error',
        title: 'Password Mismatch',
        message: 'New password and confirm password do not match.',
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showAlert({
        type: 'error',
        title: 'Invalid Password',
        message: 'Password must be at least 8 characters long.',
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(passwordData),
      });

      if (response.ok) {
        showAlert({
          type: 'success',
          title: 'Password Changed',
          message: 'Your password has been successfully updated.',
        });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const data = await response.json();
        showAlert({
          type: 'error',
          title: 'Error',
          message: data.message || 'Failed to change password.',
        });
      }
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'An error occurred while changing password.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSaving(true);
    try {
      const response = await fetch('/api/profile/email', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(emailData),
      });

      if (response.ok) {
        showAlert({
          type: 'success',
          title: 'Email Updated',
          message: 'Your email address has been successfully updated.',
        });
        setEmailData({ ...emailData, password: '' });
        fetchProfile();
      } else {
        const data = await response.json();
        showAlert({
          type: 'error',
          title: 'Error',
          message: data.message || 'Failed to update email.',
        });
      }
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'An error occurred while updating email.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;

    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    try {
      const response = await fetch('/api/profile/notification-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ [key]: value }),
      });

      if (!response.ok) {
        setPreferences(preferences);
        showAlert({
          type: 'error',
          title: 'Error',
          message: 'Failed to update notification preferences.',
        });
      }
    } catch (error) {
      setPreferences(preferences);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'An error occurred while updating preferences.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white via-green-50 to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950 px-4">
        <div className="text-center">
          <div className="relative">
            <Truck className="size-12 sm:size-16 text-green-600 dark:text-green-500 animate-bounce" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="size-6 sm:size-8 animate-spin text-green-700 dark:text-green-400" />
            </div>
          </div>
          <p className="mt-4 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950">
      <AlertComponent />

      {/* Automotive Pattern Background */}
      <div className="fixed inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 10 L50 25 L50 45 L30 60 L10 45 L10 25 Z' fill='none' stroke='%23059669' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Modern Hero Header with Car Shadow Design */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-green-600 via-emerald-500 to-teal-600 dark:from-green-700 dark:via-emerald-600 dark:to-teal-700 shadow-xl sm:shadow-2xl">
          {/* Car Silhouette Shadow in Background - Hidden on very small screens */}
          <div className="absolute inset-0 overflow-hidden opacity-20 hidden sm:block">
            <svg
              viewBox="0 0 1200 400"
              className="absolute right-0 bottom-0 w-full h-full"
              preserveAspectRatio="xMaxYMax slice"
            >
              <path
                d="M 100 250 L 200 250 L 200 200 L 250 200 L 280 150 L 400 150 L 450 200 L 800 200 L 850 250 L 1100 250 L 1100 300 L 950 300 Q 950 350 900 350 Q 850 350 850 300 L 350 300 Q 350 350 300 350 Q 250 350 250 300 L 100 300 Z"
                fill="rgba(255, 255, 255, 0.15)"
                className="drop-shadow-2xl"
              />
              <circle cx="300" cy="310" r="35" fill="rgba(255, 255, 255, 0.2)" />
              <circle cx="300" cy="310" r="20" fill="rgba(255, 255, 255, 0.1)" />
              <circle cx="900" cy="310" r="35" fill="rgba(255, 255, 255, 0.2)" />
              <circle cx="900" cy="310" r="20" fill="rgba(255, 255, 255, 0.1)" />
              <path d="M 285 155 L 320 180 L 380 180 L 390 155 Z" fill="rgba(255, 255, 255, 0.1)" />
            </svg>
          </div>

          {/* Animated Road Lines */}
          <div className="absolute inset-0 opacity-10 hidden md:block">
            <div className="absolute inset-0 animate-pulse" style={{
              backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255,255,255,0.3) 50px, rgba(255,255,255,0.3) 60px, transparent 60px, transparent 110px)`,
              animation: 'slideRoad 20s linear infinite',
            }}></div>
          </div>

          {/* Glowing Top Border */}
          <div className="absolute top-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>

          {/* Speed Lines Effect - Hidden on mobile */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-full opacity-10 hidden lg:block">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute h-0.5 bg-white rounded-full"
                style={{
                  top: `${20 + i * 15}%`,
                  left: `${i * 10}%`,
                  width: `${100 - i * 20}px`,
                  animation: `slideLeft ${1.5 + i * 0.3}s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>

          <div className="relative p-4 sm:p-6 md:p-8 lg:p-12">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 md:gap-8">
              {/* Modern Profile Badge */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-white/40 via-emerald-300 to-white/40 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                <div className="relative w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-2xl border-2 sm:border-4 border-white/40 flex items-center justify-center shadow-2xl overflow-hidden">
                  {/* Speedometer Arc */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="rgba(255,255,255,0.6)"
                      strokeWidth="3"
                      strokeDasharray="220 283"
                      strokeLinecap="round"
                      className="animate-spin"
                      style={{ animationDuration: '8s' }}
                    />
                  </svg>
                  <User className="size-8 xs:size-10 sm:size-12 md:size-16 text-white relative z-10" />
                </div>
                {/* Animated Status Dot */}
                <div className="absolute -bottom-0.5 -right-0.5 xs:-bottom-1 xs:-right-1 sm:-bottom-2 sm:-right-2 flex items-center justify-center">
                  <div className="absolute w-4 h-4 xs:w-6 xs:h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-green-400 rounded-full animate-ping opacity-75"></div>
                  <div className="relative w-4 h-4 xs:w-6 xs:h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-2 sm:border-4 border-white shadow-xl flex items-center justify-center">
                    <div className="w-1 h-1 xs:w-2 xs:h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-4 mb-2 sm:mb-3">
                  <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight drop-shadow-lg">
                    My Profile
                  </h1>
                  <div className="hidden xs:flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                    <Truck className="size-3.5 sm:size-5 text-white" />
                    <div className="w-px h-3 sm:h-4 bg-white/40"></div>
                    <span className="text-white text-[10px] sm:text-sm font-medium">Transport Hub</span>
                  </div>
                </div>
                <p className="text-white/95 text-xs xs:text-sm sm:text-base md:text-lg mb-3 sm:mb-5 max-w-3xl leading-relaxed drop-shadow px-2 sm:px-0">
                  Manage your account settings, preferences, and delivery information all in one place
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-3">
                  <Badge className="bg-white/25 text-white border border-white/40 backdrop-blur-md px-2 xs:px-3 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-sm font-semibold hover:bg-white/35 transition-all shadow-lg">
                    <Shield className="size-3 sm:size-4 mr-1 sm:mr-2" />
                    {profile?.role === 'admin' ? 'Fleet Manager' : 'User'}
                  </Badge>
                  <Badge className="bg-white/25 text-white border border-white/40 backdrop-blur-md px-2 xs:px-3 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-sm font-semibold hover:bg-white/35 transition-all shadow-lg">
                    <Check className="size-3 sm:size-4 mr-1 sm:mr-2" />
                    Verified
                  </Badge>
                  <Badge className="bg-white/25 text-white border border-white/40 backdrop-blur-md px-2 xs:px-3 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-sm font-semibold hover:bg-white/35 transition-all shadow-lg">
                    <TrendingUp className="size-3 sm:size-4 mr-1 sm:mr-2" />
                    Active
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Main Settings */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Account Information Card */}
            <Card className="shadow-lg sm:shadow-xl border border-green-100 dark:border-green-900 overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-0.5 sm:h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600"></div>
              <CardHeader className="bg-gradient-to-br from-green-50 via-emerald-50 to-white dark:from-gray-900 dark:via-green-950 dark:to-gray-900 border-b border-green-100 dark:border-green-900 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                      <Mail className="size-5 sm:size-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base sm:text-lg md:text-xl">Account Information</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Update your contact email address</CardDescription>
                    </div>
                  </div>
                  <Package className="size-5 sm:size-6 text-green-500 dark:text-green-400 opacity-50 group-hover:opacity-100 transition-opacity hidden sm:block" />
                </div>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6 bg-white dark:bg-gray-900 p-4 sm:p-6">
                <form onSubmit={handleEmailChange} className="space-y-4 sm:space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <MapPin className="size-3 sm:size-4 text-green-600 dark:text-green-500" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={emailData.email}
                      onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                      required
                      className="text-sm sm:text-base border-2 border-gray-200 dark:border-gray-700 focus:border-green-500 dark:focus:border-green-600 rounded-lg sm:rounded-xl h-10 sm:h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-password" className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <Lock className="size-3 sm:size-4 text-green-600 dark:text-green-500" />
                      Confirm Password
                    </Label>
                    <Input
                      id="email-password"
                      type="password"
                      value={emailData.password}
                      onChange={(e) => setEmailData({ ...emailData, password: e.target.value })}
                      required
                      placeholder="Enter your password to confirm changes"
                      className="text-sm sm:text-base border-2 border-gray-200 dark:border-gray-700 focus:border-green-500 dark:focus:border-green-600 rounded-lg sm:rounded-xl h-10 sm:h-12"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="w-full h-10 sm:h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="size-4 sm:size-5 mr-2 animate-spin" />
                        Updating Email...
                      </>
                    ) : (
                      <>
                        <Check className="size-4 sm:size-5 mr-2" />
                        Update Email Address
                        <ChevronRight className="size-4 sm:size-5 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card className="shadow-lg sm:shadow-xl border border-green-100 dark:border-green-900 overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-0.5 sm:h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600"></div>
              <CardHeader className="bg-gradient-to-br from-emerald-50 via-green-50 to-white dark:from-gray-900 dark:via-emerald-950 dark:to-gray-900 border-b border-green-100 dark:border-green-900 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                      <Shield className="size-5 sm:size-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base sm:text-lg md:text-xl">Security Settings</CardTitle>
                      <CardDescription className="text-xs sm:text-sm hidden sm:block">Keep your account secure with a strong password</CardDescription>
                    </div>
                  </div>
                  <Lock className="size-5 sm:size-6 text-green-500 dark:text-green-400 opacity-50 group-hover:opacity-100 transition-opacity hidden sm:block" />
                </div>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6 bg-white dark:bg-gray-900 p-4 sm:p-6">
                <form onSubmit={handlePasswordChange} className="space-y-4 sm:space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="current-password" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Current Password
                    </Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                      className="text-sm sm:text-base border-2 border-gray-200 dark:border-gray-700 focus:border-green-500 dark:focus:border-green-600 rounded-lg sm:rounded-xl h-10 sm:h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                      New Password
                    </Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      placeholder="Minimum 8 characters required"
                      className="text-sm sm:text-base border-2 border-gray-200 dark:border-gray-700 focus:border-green-500 dark:focus:border-green-600 rounded-lg sm:rounded-xl h-10 sm:h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                      placeholder="Re-enter your new password"
                      className="text-sm sm:text-base border-2 border-gray-200 dark:border-gray-700 focus:border-green-500 dark:focus:border-green-600 rounded-lg sm:rounded-xl h-10 sm:h-12"
                    />
                  </div>

                  <div className="bg-green-50 dark:bg-green-950 border-2 border-green-200 dark:border-green-800 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <Zap className="size-4 sm:size-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-green-800 dark:text-green-300">
                        <p className="font-semibold mb-1">Password Security Tips:</p>
                        <ul className="space-y-1 list-disc list-inside">
                          <li>Use at least 8 characters</li>
                          <li>Include uppercase and lowercase letters</li>
                          <li>Add numbers and special characters</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="w-full h-10 sm:h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="size-4 sm:size-5 mr-2 animate-spin" />
                        Changing Password...
                      </>
                    ) : (
                      <>
                        <Shield className="size-4 sm:size-5 mr-2" />
                        Change Password
                        <ChevronRight className="size-4 sm:size-5 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Notification Preferences Card */}
            <Card className="shadow-lg sm:shadow-xl border border-green-100 dark:border-green-900 overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-0.5 sm:h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
              <CardHeader className="bg-gradient-to-br from-green-50 via-emerald-50 to-white dark:from-gray-900 dark:via-green-950 dark:to-gray-900 border-b border-green-100 dark:border-green-900 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-lg">
                      <Bell className="size-5 sm:size-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base sm:text-lg md:text-xl">Notification Center</CardTitle>
                      <CardDescription className="text-xs sm:text-sm hidden sm:block">Control your delivery and shipment alerts</CardDescription>
                    </div>
                  </div>
                  <Truck className="size-5 sm:size-6 text-green-500 dark:text-green-400 opacity-50 group-hover:opacity-100 transition-opacity hidden sm:block" />
                </div>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6 bg-white dark:bg-gray-900 p-4 sm:p-6">
                {preferences && (
                  <div className="space-y-2 sm:space-y-3">
                    {[
                      { key: 'quoteCreated', label: 'Quote Created', description: 'Get notified when a new shipping quote is generated', icon: Package },
                      { key: 'quoteUpdated', label: 'Quote Updated', description: 'Updates to existing quotes and pricing', icon: TrendingUp },
                      { key: 'quoteDeleted', label: 'Quote Deleted', description: 'When a quote is cancelled or removed', icon: X },
                      { key: 'shipmentCreated', label: 'Shipment Created', description: 'New shipment orders and assignments', icon: Truck },
                      { key: 'shipmentUpdated', label: 'Shipment Updated', description: 'Track status changes and route updates', icon: MapPin },
                      { key: 'shipmentDeleted', label: 'Shipment Deleted', description: 'Cancelled shipments and removals', icon: X },
                      { key: 'passwordChanged', label: 'Password Changed', description: 'Security alerts for password updates', icon: Lock },
                      { key: 'emailChanged', label: 'Email Changed', description: 'Account email modifications', icon: Mail },
                      { key: 'profileUpdated', label: 'Profile Updated', description: 'Changes to your profile information', icon: User },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.key}
                          className="flex items-center justify-between p-2 sm:p-4 rounded-lg sm:rounded-xl border border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 hover:border-green-300 dark:hover:border-green-700 hover:shadow-md transition-all duration-300 group/item"
                        >
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center group-hover/item:bg-green-200 dark:group-hover/item:bg-green-800 transition-colors flex-shrink-0">
                              <Icon className="size-3.5 sm:size-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="space-y-0 flex-1 min-w-0">
                              <Label htmlFor={item.key} className="text-[11px] sm:text-sm font-semibold cursor-pointer text-gray-900 dark:text-gray-100 block truncate">
                                {item.label}
                              </Label>
                              <p className="text-[9px] sm:text-xs text-gray-600 dark:text-gray-400 truncate">
                                {item.description}
                              </p>
                            </div>
                          </div>
                          <Switch
                            id={item.key}
                            checked={preferences[item.key as keyof NotificationPreferences]}
                            onCheckedChange={(checked) =>
                              handlePreferenceChange(item.key as keyof NotificationPreferences, checked)
                            }
                            className="scale-75 sm:scale-100 data-[state=checked]:bg-green-600 dark:data-[state=checked]:bg-green-500 ml-2 flex-shrink-0"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quick Settings & Info */}
          <div className="space-y-4 sm:space-y-6">
            {/* Theme Settings */}
            <Card className="shadow-lg sm:shadow-xl border border-green-100 dark:border-green-900 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-0.5 sm:h-1 bg-gradient-to-r from-gray-500 via-slate-500 to-gray-600"></div>
              <CardHeader className="bg-gradient-to-br from-gray-50 via-slate-50 to-white dark:from-gray-900 dark:via-slate-950 dark:to-gray-900 border-b border-gray-100 dark:border-gray-800 p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-600 to-slate-700 flex items-center justify-center shadow-lg">
                    {theme === 'dark' ? <Moon className="size-5 sm:size-6 text-white" /> : <Sun className="size-5 sm:size-6 text-white" />}
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg">Display Mode</CardTitle>
                    <CardDescription className="text-xs hidden sm:block">Customize your viewing experience</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6 bg-white dark:bg-gray-900 p-4 sm:p-6">
                <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 hover:border-green-300 dark:hover:border-green-700 transition-all">
                  <div className="space-y-0.5 sm:space-y-1">
                    <Label htmlFor="dark-mode" className="text-xs sm:text-sm font-semibold cursor-pointer text-gray-900 dark:text-gray-100">
                      Dark Mode
                    </Label>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {theme === 'dark' ? 'Night mode enabled' : 'Day mode active'}
                    </p>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={theme === 'dark'}
                    onCheckedChange={toggleTheme}
                    className="data-[state=checked]:bg-green-600 dark:data-[state=checked]:bg-green-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Subscription Card with Automotive Theme */}
            <Card className="shadow-lg sm:shadow-xl border border-green-100 dark:border-green-900 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-0.5 sm:h-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600"></div>
              <CardHeader className="bg-gradient-to-br from-amber-50 via-yellow-50 to-white dark:from-gray-900 dark:via-amber-950 dark:to-gray-900 border-b border-amber-100 dark:border-amber-900 p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg">
                    <Crown className="size-5 sm:size-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg">Membership Plan</CardTitle>
                    <CardDescription className="text-xs hidden sm:block">Your fleet access level</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6 bg-white dark:bg-gray-900 p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {/* Plan Badge */}
                  <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-2 border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Current Plan</span>
                      <Badge className={cn(
                        'capitalize text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1',
                        profile?.subscription?.plan === 'free' && 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
                        profile?.subscription?.plan === 'starter' && 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
                        profile?.subscription?.plan === 'professional' && 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
                        profile?.subscription?.plan === 'enterprise' && 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg'
                      )}>
                        {profile?.subscription?.plan === 'enterprise' && <Crown className="size-3 mr-1" />}
                        {profile?.subscription?.plan || 'Basic'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Status</span>
                      <Badge className={cn(
                        'capitalize text-xs sm:text-sm',
                        profile?.subscription?.status === 'active' && 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
                        profile?.subscription?.status === 'trial' && 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
                        profile?.subscription?.status === 'inactive' && 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
                        profile?.subscription?.status === 'cancelled' && 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      )}>
                        <div className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse"></div>
                        {profile?.subscription?.status || 'Active'}
                      </Badge>
                    </div>
                  </div>

                  {profile?.subscription?.startDate && (
                    <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-3 sm:size-4 text-green-600 dark:text-green-500" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Member Since</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                        {new Date(profile.subscription.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  )}

                  <Separator className="bg-green-200 dark:bg-green-800" />

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <Award className="size-3 sm:size-4 text-green-600 dark:text-green-500" />
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">Plan Features</p>
                    </div>
                    <div className="space-y-2 max-h-40 sm:max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {profile?.subscription?.features?.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-950 transition-colors">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="size-2.5 sm:size-3 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="text-xs text-gray-700 dark:text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full h-9 sm:h-11 border-2 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-950 hover:border-green-300 dark:hover:border-green-700 text-green-700 dark:text-green-400 font-semibold rounded-lg sm:rounded-xl transition-all text-xs sm:text-sm"
                    disabled
                  >
                    <CreditCard className="size-3 sm:size-4 mr-2" />
                    Upgrade Plan (Coming Soon)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Card */}
            <Card className="shadow-lg sm:shadow-xl border border-green-100 dark:border-green-900 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-0.5 sm:h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
              <CardHeader className="bg-gradient-to-br from-green-50 via-emerald-50 to-white dark:from-gray-900 dark:via-green-950 dark:to-gray-900 border-b border-green-100 dark:border-green-900 p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <TrendingUp className="size-5 sm:size-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg">Quick Stats</CardTitle>
                    <CardDescription className="text-xs hidden sm:block">Your account overview</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6 bg-white dark:bg-gray-900 p-4 sm:p-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border border-green-200 dark:border-green-800">
                    <Package className="size-5 sm:size-6 text-green-600 dark:text-green-400 mb-2" />
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Quotes</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">0</p>
                  </div>
                  <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border border-blue-200 dark:border-blue-800">
                    <Truck className="size-5 sm:size-6 text-blue-600 dark:text-blue-400 mb-2" />
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Shipments</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">0</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideLeft {
          0% {
            transform: translateX(0);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateX(-200px);
            opacity: 0;
          }
        }
        @keyframes slideRoad {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-110px);
          }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #10b981;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #059669;
        }
      `}</style>
    </div>
  );
}