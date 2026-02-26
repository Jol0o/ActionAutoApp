'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useClerk, useUser } from "@clerk/nextjs";
import { useTheme } from '@/context/ThemeContext';
import { useAlert } from '@/components/AlertDialog';
import ProfileImageCropper from '@/components/ProfileImageCropper';
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
  Truck,
  MapPin,
  Package,
  Award,
  TrendingUp,
  Camera,
  Edit3,
  Globe,
  Phone,
  Building2,
  Briefcase,
  Link2,
  Clock,
  Activity,
  History,
  LogOut,
  HelpCircle,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
  UserCog,
  ShieldCheck,
  KeyRound,
  Fingerprint,
  CircleDot,
  Timer,
  BellRing,
  BellOff,
  Zap,
  Star,
  Palette,
  Plus,
  Trash2
} from 'lucide-react';
import { UserProfile, OnlineStatus, PersonalInfo, RecentActivity, SocialLink } from '@/types/user';
import { NotificationPreferences } from '@/types/notification';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { format, formatDistanceToNow } from 'date-fns';

// Country codes for phone
const countryCodes = [
  { code: '+1', country: 'United States / Canada' },
  { code: '+63', country: 'Philippines' },
  { code: '+44', country: 'United Kingdom' },
  { code: '+61', country: 'Australia' },
  { code: '+49', country: 'Germany' },
  { code: '+33', country: 'France' },
  { code: '+81', country: 'Japan' },
  { code: '+82', country: 'South Korea' },
  { code: '+86', country: 'China' },
  { code: '+91', country: 'India' },
  { code: '+52', country: 'Mexico' },
  { code: '+55', country: 'Brazil' },
  { code: '+234', country: 'Nigeria' },
  { code: '+27', country: 'South Africa' },
  { code: '+971', country: 'United Arab Emirates' },
];

// Standard timezone abbreviations
const timezoneOptions = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', abbr: 'UTC' },
  { value: 'EST', label: 'EST (Eastern Standard Time)', abbr: 'EST/EDT' },
  { value: 'CST', label: 'CST (Central Standard Time)', abbr: 'CST/CDT' },
  { value: 'MST', label: 'MST (Mountain Standard Time)', abbr: 'MST/MDT' },
  { value: 'PST', label: 'PST (Pacific Standard Time)', abbr: 'PST/PDT' },
  { value: 'AKST', label: 'AKST (Alaska Standard Time)', abbr: 'AKST' },
  { value: 'HST', label: 'HST (Hawaii Standard Time)', abbr: 'HST' },
  { value: 'GMT', label: 'GMT (Greenwich Mean Time)', abbr: 'GMT' },
  { value: 'CET', label: 'CET (Central European Time)', abbr: 'CET' },
  { value: 'IST', label: 'IST (India Standard Time)', abbr: 'IST' },
  { value: 'JST', label: 'JST (Japan Standard Time)', abbr: 'JST' },
  { value: 'KST', label: 'KST (Korea Standard Time)', abbr: 'KST' },
  { value: 'PHT', label: 'PHT (Philippine Time)', abbr: 'PHT' },
  { value: 'SGT', label: 'SGT (Singapore Time)', abbr: 'SGT' },
  { value: 'AEST', label: 'AEST (Australian Eastern)', abbr: 'AEST' },
  { value: 'GST', label: 'GST (Gulf Standard Time)', abbr: 'GST' },
];

// Expanded language options
const languageOptions = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'it', name: 'Italian (Italiano)' },
  { code: 'pt', name: 'Portuguese (Português)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'ko', name: 'Korean (한국어)' },
  { code: 'zh', name: 'Chinese (中文)' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'fil', name: 'Filipino (Tagalog)' },
  { code: 'vi', name: 'Vietnamese (Tiếng Việt)' },
  { code: 'th', name: 'Thai (ไทย)' },
  { code: 'ru', name: 'Russian (Русский)' },
];

// Curse word filter
const curseWords = ['fuck', 'shit', 'ass', 'damn', 'bitch', 'crap', 'dick', 'piss', 'bastard', 'cunt'];
const containsCurseWord = (text: string): boolean => {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return curseWords.some(word => lowerText.includes(word));
};

// Online status options with idle added
const onlineStatusOptions: { value: OnlineStatus; label: string; color: string; description: string }[] = [
  { value: 'online', label: 'Online', color: 'bg-green-500', description: 'Available' },
  { value: 'idle', label: 'Idle', color: 'bg-amber-500', description: 'Away from keyboard' },
  { value: 'away', label: 'Away', color: 'bg-yellow-500', description: 'Stepped away' },
  { value: 'busy', label: 'Busy', color: 'bg-red-500', description: 'Do not interrupt' },
  { value: 'do_not_disturb', label: 'DND', color: 'bg-purple-500', description: 'No notifications' },
  { value: 'offline', label: 'Invisible', color: 'bg-gray-500', description: 'Appear offline' },
];

// Activity type icons
const activityIcons: Record<string, React.ReactNode> = {
  login: <LogOut className="size-4" />,
  logout: <LogOut className="size-4" />,
  profile_update: <Edit3 className="size-4" />,
  password_change: <Lock className="size-4" />,
  email_change: <Mail className="size-4" />,
  settings_change: <Settings className="size-4" />,
  quote_created: <Package className="size-4" />,
  shipment_created: <Truck className="size-4" />,
  appointment_created: <Calendar className="size-4" />,
  vehicle_added: <Truck className="size-4" />,
  avatar_updated: <Camera className="size-4" />,
  google_calendar_connected: <Calendar className="size-4" />,
  other: <Activity className="size-4" />,
};

// Notification categories with better grouping
const notificationCategories = [
  {
    title: 'Quotes & Sales',
    icon: Package,
    color: 'from-blue-500 to-cyan-500',
    items: [
      { key: 'quoteCreated', label: 'New Quotes', description: 'When a quote is created', icon: Package },
      { key: 'quoteUpdated', label: 'Quote Updates', description: 'When a quote is modified', icon: TrendingUp },
      { key: 'quoteDeleted', label: 'Quote Removed', description: 'When a quote is deleted', icon: X },
    ]
  },
  {
    title: 'Shipments & Logistics',
    icon: Truck,
    color: 'from-emerald-500 to-teal-500',
    items: [
      { key: 'shipmentCreated', label: 'New Shipments', description: 'When a shipment is created', icon: Truck },
      { key: 'shipmentUpdated', label: 'Shipment Updates', description: 'When shipment status changes', icon: MapPin },
      { key: 'shipmentDeleted', label: 'Shipment Removed', description: 'When a shipment is removed', icon: X },
    ]
  },
  {
    title: 'Account & Security',
    icon: Shield,
    color: 'from-violet-500 to-purple-500',
    items: [
      { key: 'passwordChanged', label: 'Password Changes', description: 'Security alerts for password', icon: Lock },
      { key: 'emailChanged', label: 'Email Changes', description: 'When email is updated', icon: Mail },
      { key: 'profileUpdated', label: 'Profile Updates', description: 'When profile is modified', icon: User },
    ]
  }
];

export default function ProfilePage() {
  const { user: clerkUser } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const { theme, toggleTheme } = useTheme();
  const { showAlert, AlertComponent } = useAlert();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Image cropper state
  const [showImageCropper, setShowImageCropper] = useState(false);

  // Online status state
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>('online');
  const [customStatus, setCustomStatus] = useState('');
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  // Personal info state
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({});
  const [editingPersonalInfo, setEditingPersonalInfo] = useState(false);
  const [phoneCountryCode, setPhoneCountryCode] = useState('+1');
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [bioError, setBioError] = useState<string>('');

  // Delete account confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Notification preferences
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [savingPreference, setSavingPreference] = useState<string | null>(null);

  // Recent activities
  const [activities, setActivities] = useState<RecentActivity[]>([]);

  // Error states
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Custom status validation - max 20 chars
  const MAX_CUSTOM_STATUS_LENGTH = 20;
  const customStatusError = customStatus.length > MAX_CUSTOM_STATUS_LENGTH 
    ? `Max ${MAX_CUSTOM_STATUS_LENGTH} characters` 
    : '';

  const handleCustomStatusChange = (value: string) => {
    if (value.length <= MAX_CUSTOM_STATUS_LENGTH) {
      setCustomStatus(value);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setFetchError(null);
    try {
      const response = await apiClient.get('/api/profile');
      const data = response.data;
      setProfile(data.data);
      setPreferences(data.data.notificationPreferences || {
        quoteCreated: true,
        quoteUpdated: true,
        quoteDeleted: true,
        shipmentCreated: true,
        shipmentUpdated: true,
        shipmentDeleted: true,
        passwordChanged: true,
        emailChanged: true,
        profileUpdated: true,
      });
      setOnlineStatus(data.data.onlineStatus || 'online');
      setCustomStatus((data.data.customStatus || '').slice(0, MAX_CUSTOM_STATUS_LENGTH));
      setPersonalInfo(data.data.personalInfo || {});
      setPhoneCountryCode(data.data.personalInfo?.phoneCountryCode || '+1');
      setSocialLinks(data.data.personalInfo?.socialLinks || []);
      setActivities(data.data.recentActivities || []);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load profile. Please refresh the page.';
      setFetchError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfilePicture = async (croppedImage: string) => {
    setIsSaving(true);
    try {
      // Check image size (base64 string, ~33% larger than binary)
      const imageSizeInBytes = croppedImage.length * 0.75;
      const imageSizeInMB = imageSizeInBytes / (1024 * 1024);
      
      if (imageSizeInMB > 5) {
        showAlert({
          type: 'error',
          title: 'Image Too Large',
          message: `Image size is ${imageSizeInMB.toFixed(2)}MB. Please use a smaller image (max 5MB).`,
        });
        setIsSaving(false);
        return;
      }

      const response = await apiClient.patch('/api/profile/avatar', { avatar: croppedImage });
      
      showAlert({
        type: 'success',
        title: 'Profile Picture Updated',
        message: 'Your profile picture has been successfully updated.',
      });
      fetchProfile();
    } catch (error: any) {
      console.error('Error updating profile picture:', error);
      const status = error.response?.status;
      const errorMessage = error.response?.data?.message || 'Failed to update profile picture.';
      
      // Handle specific error codes
      if (status === 413) {
        showAlert({
          type: 'error',
          title: 'Image Too Large',
          message: 'The image is too large. Please use a smaller image.',
        });
      } else if (status === 400) {
        showAlert({
          type: 'error',
          title: 'Invalid Image',
          message: errorMessage,
        });
      } else {
        showAlert({
          type: 'error',
          title: 'Error',
          message: errorMessage,
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateOnlineStatus = async () => {
    setIsSaving(true);
    try {
      await apiClient.patch('/api/profile/online-status', { status: onlineStatus, customStatus });
      
      showAlert({
        type: 'success',
        title: 'Status Updated',
        message: 'Your online status has been updated.',
      });
      setShowStatusDialog(false);
      fetchProfile();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update status.';
      showAlert({
        type: 'error',
        title: 'Error',
        message: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePersonalInfo = async () => {
    // Validate bio
    if (personalInfo.bio && personalInfo.bio.length > 500) {
      showAlert({
        type: 'error',
        title: 'Bio Too Long',
        message: 'Bio must be 500 characters or less.',
      });
      return;
    }

    // Check for inappropriate content
    const fieldsToCheck = [
      personalInfo.bio,
      personalInfo.jobTitle,
      personalInfo.department,
      customStatus,
    ].filter(Boolean);

    for (const field of fieldsToCheck) {
      if (field && containsCurseWord(field)) {
        showAlert({
          type: 'error',
          title: 'Inappropriate Content',
          message: 'Please remove inappropriate language from your profile.',
        });
        return;
      }
    }

    // Check social links for curse words
    for (const link of socialLinks) {
      if (containsCurseWord(link.label)) {
        showAlert({
          type: 'error',
          title: 'Inappropriate Content',
          message: 'Please remove inappropriate language from your links.',
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      const updatedInfo = {
        ...personalInfo,
        phoneCountryCode,
        socialLinks,
      };

      await apiClient.patch('/api/profile/personal-info', updatedInfo);
      
      showAlert({
        type: 'success',
        title: 'Information Saved',
        message: 'Your personal information has been updated.',
      });
      setEditingPersonalInfo(false);
      fetchProfile();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to save information.';
      showAlert({
        type: 'error',
        title: 'Error',
        message: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;

    setSavingPreference(key);
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    try {
      await apiClient.patch('/api/profile/notification-preferences', { [key]: value });
    } catch (error: any) {
      setPreferences(preferences);
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update notification preferences.',
      });
    } finally {
      setSavingPreference(null);
    }
  };

  // Enable all notifications
  const handleEnableAllNotifications = async () => {
    if (!preferences) return;

    const allEnabled: NotificationPreferences = {
      quoteCreated: true,
      quoteUpdated: true,
      quoteDeleted: true,
      shipmentCreated: true,
      shipmentUpdated: true,
      shipmentDeleted: true,
      passwordChanged: true,
      emailChanged: true,
      profileUpdated: true,
    };

    const previousPreferences = { ...preferences };
    setPreferences(allEnabled);

    try {
      await apiClient.patch('/api/profile/notification-preferences', allEnabled);
      
      showAlert({
        type: 'success',
        title: 'Notifications Enabled',
        message: 'All notifications have been enabled.',
      });
    } catch (error: any) {
      setPreferences(previousPreferences);
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to enable all notifications.',
      });
    }
  };

  // Disable all notifications
  const handleDisableAllNotifications = async () => {
    if (!preferences) return;

    const allDisabled: NotificationPreferences = {
      quoteCreated: false,
      quoteUpdated: false,
      quoteDeleted: false,
      shipmentCreated: false,
      shipmentUpdated: false,
      shipmentDeleted: false,
      passwordChanged: false,
      emailChanged: false,
      profileUpdated: false,
    };

    const previousPreferences = { ...preferences };
    setPreferences(allDisabled);

    try {
      await apiClient.patch('/api/profile/notification-preferences', allDisabled);
      
      showAlert({
        type: 'success',
        title: 'Notifications Disabled',
        message: 'All notifications have been disabled.',
      });
    } catch (error: any) {
      setPreferences(previousPreferences);
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to disable all notifications.',
      });
    }
  };

  // Calculate notification stats
  const getNotificationStats = () => {
    if (!preferences) return { enabled: 0, total: 9 };
    const keys = Object.keys(preferences) as (keyof NotificationPreferences)[];
    const enabled = keys.filter(key => preferences[key]).length;
    return { enabled, total: keys.length };
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Social Links handlers
  const addSocialLink = () => {
    if (socialLinks.length >= 4) {
      showAlert({
        type: 'warning',
        title: 'Limit Reached',
        message: 'You can only add up to 4 links.',
      });
      return;
    }
    setSocialLinks([...socialLinks, { label: '', url: '' }]);
  };

  const updateSocialLink = (index: number, field: 'label' | 'url', value: string) => {
    const updated = [...socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    setSocialLinks(updated);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  // Verify email handler
  const handleVerifyEmail = async () => {
    try {
      // Use Clerk's built-in verification
      openUserProfile();
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to open verification. Please try again.',
      });
    }
  };

  // Google Calendar connect handler
  const handleConnectGoogleCalendar = async () => {
    try {
      // Redirect to Google Calendar OAuth endpoint
      const response = await apiClient.get('/api/google-calendar/auth-url');
      const data = response.data;
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        showAlert({
          type: 'info',
          title: 'Coming Soon',
          message: 'Google Calendar integration is being configured. Please try again later.',
        });
      }
    } catch (error: any) {
      showAlert({
        type: 'info',
        title: 'Coming Soon',
        message: 'Google Calendar integration will be available soon.',
      });
    }
  };

  // Disconnect Google Calendar
  const handleDisconnectGoogleCalendar = async () => {
    try {
      await apiClient.post('/api/google-calendar/disconnect');
      
      showAlert({
        type: 'success',
        title: 'Disconnected',
        message: 'Google Calendar has been disconnected.',
      });
      fetchProfile();
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to disconnect Google Calendar.',
      });
    }
  };

  // Delete account handlers (double confirmation)
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      showAlert({
        type: 'error',
        title: 'Confirmation Required',
        message: 'Please type DELETE to confirm account deletion.',
      });
      return;
    }

    try {
      await apiClient.delete('/api/profile/delete-account');
      await signOut();
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete account.',
      });
    }
  };

  // Bio change handler with validation
  const handleBioChange = (value: string) => {
    if (value.length > 500) {
      setBioError('Bio cannot exceed 500 characters');
      return;
    }
    if (containsCurseWord(value)) {
      setBioError('Please avoid inappropriate language');
    } else {
      setBioError('');
    }
    setPersonalInfo({ ...personalInfo, bio: value.slice(0, 500) });
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return { label: 'Super Admin', className: 'bg-purple-500/10 text-purple-600 border-purple-200' };
      case 'admin':
        return { label: 'Administrator', className: 'bg-blue-500/10 text-blue-600 border-blue-200' };
      case 'driver':
        return { label: 'Driver', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' };
      default:
        return { label: 'Member', className: 'bg-gray-500/10 text-gray-600 border-gray-200' };
    }
  };

  const currentStatusOption = onlineStatusOptions.find(s => s.value === onlineStatus) || onlineStatusOptions[0];

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

  const roleBadge = getRoleBadge(profile?.role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950">
      <AlertComponent />
      <ProfileImageCropper
        isOpen={showImageCropper}
        onClose={() => setShowImageCropper(false)}
        onSave={handleSaveProfilePicture}
        currentImage={profile?.avatar || clerkUser?.imageUrl}
      />

      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 10 L50 25 L50 45 L30 60 L10 45 L10 25 Z' fill='none' stroke='%23059669' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-green-600 via-emerald-500 to-teal-600 dark:from-green-700 dark:via-emerald-600 dark:to-teal-700 shadow-xl sm:shadow-2xl animate-gradient">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            
            {/* Floating particles */}
            <div className="absolute top-10 left-[10%] w-3 h-3 bg-white/20 rounded-full animate-float" style={{ animationDelay: '0s' }} />
            <div className="absolute top-20 left-[25%] w-2 h-2 bg-white/15 rounded-full animate-float" style={{ animationDelay: '1s' }} />
            <div className="absolute top-8 right-[20%] w-4 h-4 bg-white/10 rounded-full animate-float" style={{ animationDelay: '2s' }} />
            <div className="absolute bottom-16 right-[15%] w-2 h-2 bg-white/20 rounded-full animate-float" style={{ animationDelay: '0.5s' }} />
            <div className="absolute bottom-24 left-[40%] w-3 h-3 bg-white/15 rounded-full animate-float" style={{ animationDelay: '1.5s' }} />
            
            {/* Glowing orbs */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse-glow" />
            <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-emerald-300/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
          </div>
          
          {/* Truck SVG decoration */}
          <div className="absolute inset-0 overflow-hidden opacity-20 hidden sm:block">
            <svg viewBox="0 0 1200 400" className="absolute right-0 bottom-0 w-full h-full animate-float" preserveAspectRatio="xMaxYMax slice" style={{ animationDuration: '8s' }}>
              <path d="M 100 250 L 200 250 L 200 200 L 250 200 L 280 150 L 400 150 L 450 200 L 800 200 L 850 250 L 1100 250 L 1100 300 L 950 300 Q 950 350 900 350 Q 850 350 850 300 L 350 300 Q 350 350 300 350 Q 250 350 250 300 L 100 300 Z" fill="rgba(255, 255, 255, 0.15)" />
              <circle cx="300" cy="310" r="35" fill="rgba(255, 255, 255, 0.2)" />
              <circle cx="900" cy="310" r="35" fill="rgba(255, 255, 255, 0.2)" />
            </svg>
          </div>

          <div className="relative p-4 sm:p-6 md:p-8 lg:p-12">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 md:gap-8">
              {/* Profile Picture */}
              <div className="relative group animate-slide-in-left">
                <div className="absolute -inset-1 bg-gradient-to-r from-white/40 via-emerald-300 to-white/40 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
                <div 
                  className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-2xl border-4 border-white/40 flex items-center justify-center shadow-2xl overflow-hidden cursor-pointer transition-all hover:scale-110 profile-picture-animate profile-picture-glow"
                  onClick={() => setShowImageCropper(true)}
                >
                  {(profile?.avatar || clerkUser?.imageUrl) ? (
                    <img 
                      src={profile?.avatar || clerkUser?.imageUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="size-10 sm:size-14 md:size-20 text-white" />
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-fade-in-up">
                    <Camera className="size-6 sm:size-8 text-white animate-subtle-scale" />
                  </div>
                </div>
                <button 
                  onClick={() => setShowStatusDialog(true)}
                  className={cn(
                    "absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-4 border-white shadow-lg flex items-center justify-center transition-all hover:scale-125 animate-throb",
                    currentStatusOption.color
                  )}
                  title={`Status: ${currentStatusOption.label}`}
                >
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                </button>
              </div>

              <div className="flex-1 text-center sm:text-left animate-slide-in-right">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 mb-2 sm:mb-3">
                  <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight drop-shadow-lg">
                    {profile?.name || clerkUser?.fullName || 'User'}
                  </h1>
                  <Badge className={cn("text-xs sm:text-sm px-3 py-1 border transition-transform hover:scale-105", roleBadge.className)}>
                    {roleBadge.label}
                  </Badge>
                </div>
                <p className="text-white/90 text-sm sm:text-base mb-3">
                  {profile?.email || clerkUser?.primaryEmailAddress?.emailAddress}
                </p>
                {customStatus && (
                  <p className="text-white/80 text-xs sm:text-sm italic mb-3 animate-fade-in-up">"{customStatus}"</p>
                )}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
                  <Badge className="bg-white/20 text-white border border-white/30 backdrop-blur-sm px-3 py-1.5 text-xs font-medium transition-all hover:bg-white/30">
                    <div className={cn("w-2 h-2 rounded-full mr-2 animate-throb", currentStatusOption.color)} />
                    {currentStatusOption.label}
                  </Badge>
                  {profile?.securityStatus?.emailVerified && (
                    <Badge className="bg-white/20 text-white border border-white/30 backdrop-blur-sm px-3 py-1.5 text-xs font-medium transition-all hover:bg-white/30">
                      <CheckCircle2 className="size-3 mr-1.5" />
                      Verified
                    </Badge>
                  )}
                  {profile?.googleCalendar?.connected && (
                    <Badge className="bg-white/20 text-white border border-white/30 backdrop-blur-sm px-3 py-1.5 text-xs font-medium transition-all hover:bg-white/30">
                      <Calendar className="size-3 mr-1.5" />
                      Calendar Synced
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-row sm:flex-col gap-2">
                <Button onClick={() => setShowImageCropper(true)} variant="outline" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30 btn-hover-scale animate-button-entry" style={{ animationDelay: '0s' }}>
                  <Camera className="size-4 mr-2" />
                  <span className="hidden sm:inline">Change Photo</span>
                </Button>
                <Button onClick={handleLogout} variant="outline" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30 btn-hover-scale animate-button-entry" style={{ animationDelay: '0.1s' }}>
                  <LogOut className="size-4 mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full flex flex-wrap justify-start gap-1.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-2 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg animate-slide-down">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/25 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <User className="size-4" />
              <span className="hidden sm:inline font-medium">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="personal" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <UserCog className="size-4" />
              <span className="hidden sm:inline font-medium">Personal Info</span>
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/25 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ShieldCheck className="size-4" />
              <span className="hidden sm:inline font-medium">Security</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-green-500/25 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Bell className="size-4" />
              <span className="hidden sm:inline font-medium">Notifications</span>
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <History className="size-4" />
              <span className="hidden sm:inline font-medium">Activity</span>
            </TabsTrigger>
            <TabsTrigger 
              value="support" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/25 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <HelpCircle className="size-4" />
              <span className="hidden sm:inline font-medium">Support</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 animate-fade-in-up">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Account Status Card */}
                <Card className="shadow-xl border border-green-100 dark:border-green-900 overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 animate-gradient"></div>
                  <CardHeader className="bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-900 border-b border-green-100 dark:border-green-900">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg animate-bounce-in">
                          <Award className="size-6 text-white" />
                        </div>
                        <div>
                          <CardTitle>Account Status</CardTitle>
                          <CardDescription>Your account overview and statistics</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                          profile?.accountStatus?.isActive 
                            ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 animate-glow" 
                            : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400"
                        )}>
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            profile?.accountStatus?.isActive ? "bg-green-500 animate-pulse" : "bg-red-500"
                          )} />
                          {profile?.accountStatus?.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="group p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border border-green-200 dark:border-green-800 transition-all hover:shadow-lg hover:-translate-y-1 animate-slide-up stagger-1">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Package className="size-5 text-white" />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Quotes</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.accountStatus?.totalQuotes || 0}</p>
                      </div>
                      <div className="group p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border border-blue-200 dark:border-blue-800 transition-all hover:shadow-lg hover:-translate-y-1 animate-slide-up stagger-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Truck className="size-5 text-white" />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Shipments</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.accountStatus?.totalShipments || 0}</p>
                      </div>
                      <div className="group p-4 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 border border-purple-200 dark:border-purple-800 transition-all hover:shadow-lg hover:-translate-y-1 animate-slide-up stagger-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Calendar className="size-5 text-white" />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Appointments</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.accountStatus?.totalAppointments || 0}</p>
                      </div>
                      <div className="group p-4 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border border-amber-200 dark:border-amber-800 transition-all hover:shadow-lg hover:-translate-y-1 animate-slide-up stagger-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Clock className="size-5 text-white" />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Member Since</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {profile?.createdAt ? format(new Date(profile.createdAt), 'MMM yyyy') : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-3 mb-6">
                      <Badge className={cn(
                        "px-4 py-2 text-sm gap-2 transition-all",
                        profile?.accountStatus?.isActive 
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-300 dark:border-green-700" 
                          : "bg-red-100 text-red-700 border-red-300"
                      )}>
                        {profile?.accountStatus?.isActive ? (
                          <CheckCircle2 className="size-4" />
                        ) : (
                          <XCircle className="size-4" />
                        )}
                        {profile?.accountStatus?.isActive ? 'Active Account' : 'Inactive Account'}
                      </Badge>
                      <Badge className={cn(
                        "px-4 py-2 text-sm gap-2 transition-all",
                        profile?.accountStatus?.isVerified 
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-700" 
                          : "bg-gray-100 text-gray-700 border-gray-300"
                      )}>
                        <Shield className="size-4" />
                        {profile?.accountStatus?.isVerified ? 'Email Verified' : 'Unverified'}
                      </Badge>
                      <Badge className="bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 dark:from-purple-900 dark:to-violet-900 dark:text-purple-300 border-purple-300 dark:border-purple-700 px-4 py-2 text-sm gap-2">
                        <Crown className="size-4" />
                        {profile?.subscription?.plan || 'Free'} Plan
                      </Badge>
                    </div>

                    {/* Last Active */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Activity className="size-4" />
                        <span>Last Activity</span>
                      </div>
                      <span className="text-sm font-medium">
                        {profile?.accountStatus?.lastActive 
                          ? formatDistanceToNow(new Date(profile.accountStatus.lastActive), { addSuffix: true })
                          : 'Just now'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Bio Card */}
                <Card className="shadow-xl border border-green-100 dark:border-green-900">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                          <Edit3 className="size-5 text-white" />
                        </div>
                        <CardTitle>About Me</CardTitle>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('personal')}>
                        <Edit3 className="size-4 mr-2" />Edit
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {personalInfo.bio ? (
                      <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words overflow-hidden">{personalInfo.bio}</p>
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500 italic">No bio added yet. Click edit to add one.</p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                      {personalInfo.location && (
                        <span className="flex items-center gap-1"><MapPin className="size-4" />{personalInfo.location}</span>
                      )}
                      {personalInfo.jobTitle && (
                        <span className="flex items-center gap-1"><Briefcase className="size-4" />{personalInfo.jobTitle}</span>
                      )}
                      {personalInfo.phone && (
                        <span className="flex items-center gap-1"><Phone className="size-4" />{phoneCountryCode} {personalInfo.phone}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Theme Settings */}
                <Card className="shadow-xl border border-green-100 dark:border-green-900">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-600 to-slate-700 flex items-center justify-center">
                        {theme === 'dark' ? <Moon className="size-5 text-white" /> : <Sun className="size-5 text-white" />}
                      </div>
                      <CardTitle>Display</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div>
                        <Label className="text-sm font-semibold">Dark Mode</Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {theme === 'dark' ? 'Night mode active' : 'Day mode active'}
                        </p>
                      </div>
                      <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} className="data-[state=checked]:bg-emerald-600" />
                    </div>
                  </CardContent>
                </Card>

                {/* Subscription Card */}
                <Card className="shadow-xl border border-green-100 dark:border-green-900">
                  <CardHeader className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-gray-900 dark:to-amber-950 border-b border-amber-100 dark:border-amber-900">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
                        <Crown className="size-5 text-white" />
                      </div>
                      <div>
                        <CardTitle>Membership</CardTitle>
                        <CardDescription>Your plan details</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Current Plan</span>
                        <Badge className={cn("capitalize", profile?.subscription?.plan === 'enterprise' && 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white')}>
                          {profile?.subscription?.plan || 'Free'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Status</span>
                        <Badge className={cn(profile?.subscription?.status === 'active' && 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300')}>
                          {profile?.subscription?.status || 'Active'}
                        </Badge>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500">Features</p>
                        {profile?.subscription?.features?.slice(0, 4).map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <Check className="size-4 text-green-500" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                      <Button variant="outline" className="w-full" disabled>
                        <Sparkles className="size-4 mr-2" />
                        Upgrade (Coming Soon)
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Google Calendar */}
                <Card className="shadow-xl border border-green-100 dark:border-green-900">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                        <Calendar className="size-5 text-white" />
                      </div>
                      <div>
                        <CardTitle>Google Calendar</CardTitle>
                        <CardDescription>Sync appointments</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {profile?.googleCalendar?.connected ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="size-5" />
                          <span className="font-medium">Connected</span>
                        </div>
                        {profile.googleCalendar.connectedAt && (
                          <p className="text-xs text-gray-500">
                            Connected {formatDistanceToNow(new Date(profile.googleCalendar.connectedAt), { addSuffix: true })}
                          </p>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-red-600 hover:text-red-700"
                          onClick={handleDisconnectGoogleCalendar}
                        >
                          <X className="size-4 mr-2" />Disconnect
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
                        onClick={handleConnectGoogleCalendar}
                      >
                        <Calendar className="size-4 mr-2" />Connect Google Calendar
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Personal Info Tab */}
          <TabsContent value="personal" className="mt-6 animate-tab-switch">
            <Card className="shadow-xl border border-green-100 dark:border-green-900 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 animate-gradient"></div>
              <CardHeader className="bg-gradient-to-br from-green-50 to-emerald-50/50 dark:from-gray-900 dark:to-gray-800 border-b border-green-100 dark:border-green-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 animate-slide-in-left">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg hover:scale-110 transition-transform animate-bounce-in">
                      <UserCog className="size-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Personal Information</CardTitle>
                      <CardDescription>Manage your personal details</CardDescription>
                    </div>
                  </div>
                  {!editingPersonalInfo ? (
                    <Button onClick={() => setEditingPersonalInfo(true)} className="hover-lift">
                      <Edit3 className="size-4 mr-2" />Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2 animate-slide-in-right">
                      <Button variant="outline" onClick={() => setEditingPersonalInfo(false)} className="transition-all hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</Button>
                      <Button onClick={handleSavePersonalInfo} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 transition-all hover-lift">
                        {isSaving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Check className="size-4 mr-2" />}
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
                  <div className="md:col-span-2 space-y-3 animate-slide-up stagger-1">
                    <Label htmlFor="bio" className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
                      <Edit3 className="size-4 text-emerald-600" />Bio / Description
                    </Label>
                    <Textarea
                      id="bio"
                      value={personalInfo.bio || ''}
                      onChange={(e) => handleBioChange(e.target.value)}
                      disabled={!editingPersonalInfo}
                      placeholder="Tell us about yourself..."
                      className="min-h-[120px] p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors duration-200 focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 disabled:bg-gray-50 dark:disabled:bg-gray-900 font-medium resize-none"
                      maxLength={500}
                    />
                    <div className="flex justify-between items-center">
                      <span className={cn("text-xs font-medium transition-colors", bioError ? "text-red-500" : "text-gray-500")}>
                        {bioError || `${(personalInfo.bio?.length || 0)}/500 characters`}
                      </span>
                      {(personalInfo.bio?.length || 0) > 450 && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold animate-soft-pulse">{500 - (personalInfo.bio?.length || 0)} remaining</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 animate-slide-up stagger-2">
                    <Label htmlFor="phone" className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
                      <Phone className="size-4 text-emerald-600" />Phone Number
                    </Label>
                    <div className="flex gap-2">
                      <Select value={phoneCountryCode} onValueChange={setPhoneCountryCode} disabled={!editingPersonalInfo}>
                        <SelectTrigger className="w-[140px] rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors hover:border-gray-300">
                          <SelectValue placeholder="Code" />
                        </SelectTrigger>
                        <SelectContent>
                          {countryCodes.map((cc) => (
                            <SelectItem key={cc.code} value={cc.code}>
                              {cc.code} - {cc.country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input 
                        id="phone" 
                        value={personalInfo.phone || ''} 
                        onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })} 
                        disabled={!editingPersonalInfo} 
                        placeholder="(555) 123-4567"
                        className="flex-1 rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 disabled:bg-gray-50 dark:disabled:bg-gray-900 font-medium p-3"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 animate-slide-up stagger-3">
                    <Label htmlFor="location" className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
                      <MapPin className="size-4 text-emerald-600" />Location
                    </Label>
                    <Input id="location" value={personalInfo.location || ''} onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })} disabled={!editingPersonalInfo} placeholder="City, State" 
                      className="rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 disabled:bg-gray-50 dark:disabled:bg-gray-900 font-medium p-3"
                    />
                  </div>

                  <div className="space-y-3 animate-slide-up stagger-4">
                    <Label htmlFor="dateOfBirth" className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
                      <Calendar className="size-4 text-emerald-600" />Date of Birth
                    </Label>
                    <Input 
                      id="dateOfBirth" 
                      type="date"
                      value={personalInfo.dateOfBirth || ''} 
                      onChange={(e) => setPersonalInfo({ ...personalInfo, dateOfBirth: e.target.value })} 
                      disabled={!editingPersonalInfo}
                      className="rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 disabled:bg-gray-50 dark:disabled:bg-gray-900 font-medium p-3"
                    />
                  </div>

                  <div className="space-y-3 animate-slide-up stagger-5">
                    <Label htmlFor="gender" className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
                      <User className="size-4 text-emerald-600" />Gender
                    </Label>
                    <Select value={personalInfo.gender || ''} onValueChange={(value) => setPersonalInfo({ ...personalInfo, gender: value })} disabled={!editingPersonalInfo}>
                      <SelectTrigger className="rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors hover:border-gray-300"><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3 animate-slide-up stagger-1">
                    <Label htmlFor="jobTitle" className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
                      <Briefcase className="size-4 text-emerald-600" />Job Title
                    </Label>
                    <Input id="jobTitle" value={personalInfo.jobTitle || ''} onChange={(e) => setPersonalInfo({ ...personalInfo, jobTitle: e.target.value })} disabled={!editingPersonalInfo} placeholder="Sales Manager" 
                      className="rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 disabled:bg-gray-50 dark:disabled:bg-gray-900 font-medium p-3"
                    />
                  </div>

                  <div className="space-y-3 animate-slide-up stagger-2">
                    <Label htmlFor="department" className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
                      <Building2 className="size-4 text-emerald-600" />Department
                    </Label>
                    <Input id="department" value={personalInfo.department || ''} onChange={(e) => setPersonalInfo({ ...personalInfo, department: e.target.value })} disabled={!editingPersonalInfo} placeholder="Sales" 
                      className="rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 disabled:bg-gray-50 dark:disabled:bg-gray-900 font-medium p-3"
                    />
                  </div>

                  <div className="space-y-3 animate-slide-up stagger-3">
                    <Label htmlFor="timezone" className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
                      <Clock className="size-4 text-emerald-600" />Timezone
                    </Label>
                    <Select value={personalInfo.timezone || ''} onValueChange={(value) => setPersonalInfo({ ...personalInfo, timezone: value })} disabled={!editingPersonalInfo}>
                      <SelectTrigger className="rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors hover:border-gray-300"><SelectValue placeholder="Select timezone" /></SelectTrigger>
                      <SelectContent>
                        {timezoneOptions.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            <span className="font-medium">{tz.abbr}</span>
                            <span className="text-gray-500 text-xs ml-2">- {tz.label.split('(')[1]?.replace(')', '') || tz.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3 animate-slide-up stagger-4">
                    <Label htmlFor="language" className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
                      <Globe className="size-4 text-emerald-600" />Language
                    </Label>
                    <Select value={personalInfo.language || 'en'} onValueChange={(value) => setPersonalInfo({ ...personalInfo, language: value })} disabled={!editingPersonalInfo}>
                      <SelectTrigger className="rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors hover:border-gray-300"><SelectValue placeholder="Select language" /></SelectTrigger>
                      <SelectContent>
                        {languageOptions.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Social Links Section */}
                  <div className="md:col-span-2 space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700 animate-slide-up stagger-5">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
                        <Link2 className="size-4 text-emerald-600" />Additional Links ({socialLinks.length}/4)
                      </Label>
                      {editingPersonalInfo && socialLinks.length < 4 && (
                        <Button type="button" variant="outline" size="sm" onClick={addSocialLink} className="hover-lift transition-all">
                          <Plus className="mr-1 size-3" /> Add Link
                        </Button>
                      )}
                    </div>
                    {socialLinks.length === 0 ? (
                      <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">No additional links added. Click "Add Link" to add up to 4 links.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {socialLinks.map((link, index) => (
                          <div key={index} className="flex gap-2 items-start animate-smooth-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
                            <div className="flex-1 space-y-2">
                              <Input
                                value={link.label}
                                onChange={(e) => updateSocialLink(index, 'label', e.target.value)}
                                disabled={!editingPersonalInfo}
                                placeholder="Label (e.g., Twitter, GitHub)"
                                className="text-sm rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 disabled:bg-gray-50 dark:disabled:bg-gray-900 p-3"
                              />
                              <Input
                                value={link.url}
                                onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                                disabled={!editingPersonalInfo}
                                placeholder="https://..."
                                className="text-sm rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 disabled:bg-gray-50 dark:disabled:bg-gray-900 p-3"
                              />
                            </div>
                            {editingPersonalInfo && (
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeSocialLink(index)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                              >
                                <X className="size-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="mt-6 animate-tab-switch">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-xl border border-emerald-100 dark:border-emerald-900 overflow-hidden hover-lift">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-green-500 animate-gradient"></div>
                <CardHeader className="bg-gradient-to-br from-emerald-50 to-green-50/50 dark:from-gray-900 dark:to-gray-800 border-b border-emerald-100 dark:border-emerald-900">
                  <div className="flex items-center gap-3 animate-slide-in-left">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                      <ShieldCheck className="size-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Security Status</CardTitle>
                      <CardDescription>Overview of your account security</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors animate-slide-up stagger-1">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shadow-md", profile?.securityStatus?.emailVerified ? "bg-emerald-100 dark:bg-emerald-900" : "bg-amber-100 dark:bg-amber-900")}>
                        <Mail className={cn("size-5", profile?.securityStatus?.emailVerified ? "text-emerald-600" : "text-amber-600")} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Email Verification</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{profile?.email}</p>
                      </div>
                    </div>
                    {profile?.securityStatus?.emailVerified ? (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700 font-medium">
                        <CheckCircle2 className="size-3 mr-1.5" />Verified
                      </Badge>
                    ) : (
                      <Button size="sm" variant="outline" onClick={handleVerifyEmail} className="hover-lift">Verify Now</Button>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors animate-slide-up stagger-2">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shadow-md", profile?.securityStatus?.hasPassword ? "bg-emerald-100 dark:bg-emerald-900" : "bg-gray-100 dark:bg-gray-800")}>
                        <KeyRound className={cn("size-5", profile?.securityStatus?.hasPassword ? "text-emerald-600" : "text-gray-600")} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Password</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {profile?.securityStatus?.lastPasswordChange ? `Last changed ${formatDistanceToNow(new Date(profile.securityStatus.lastPasswordChange), { addSuffix: true })}` : 'Managed by Clerk'}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => openUserProfile()} className="hover-lift">Change</Button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 opacity-70 animate-slide-up stagger-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shadow-md">
                        <Fingerprint className="size-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Extra layer of security</p>
                      </div>
                    </div>
                    <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700 font-medium">Coming Soon</Badge>
                  </div>

                  {profile?.securityStatus?.lastLogin && (
                    <div className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors animate-slide-up stagger-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center shadow-md">
                          <Timer className="size-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">Last Login</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{format(new Date(profile.securityStatus.lastLogin), 'PPpp')}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-xl border border-blue-100 dark:border-blue-900 overflow-hidden hover-lift">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 animate-gradient"></div>
                <CardHeader className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-gray-900 dark:to-gray-800 border-b border-blue-100 dark:border-blue-900">
                  <div className="flex items-center gap-3 animate-slide-in-right">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                      <Lock className="size-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Account Security</CardTitle>
                      <CardDescription>Manage via Clerk</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4 animate-fade-in-up">
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/50 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors animate-slide-up stagger-2">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="size-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Managed by Clerk</p>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1.5 leading-relaxed">
                            Email changes, password updates, and account recovery are handled through Clerk.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button onClick={() => openUserProfile()} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                      <Settings className="size-4 mr-2" />Open Security Settings
                    </Button>

                    <Separator />

                    <div className="space-y-3">
                      <p className="text-sm font-medium">Quick Actions</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" size="sm" onClick={() => openUserProfile()}>
                          <Mail className="size-4 mr-2" />Change Email
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openUserProfile()}>
                          <Lock className="size-4 mr-2" />Change Password
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-6 space-y-6 animate-tab-switch">
            {/* Quick Actions Card */}
            <Card className="shadow-xl border border-green-100 dark:border-green-900 overflow-hidden hover-lift">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 animate-gradient"></div>
              <CardHeader className="bg-gradient-to-br from-green-50 to-emerald-50/50 dark:from-gray-900 dark:to-gray-800 border-b border-green-100 dark:border-green-900">
                <div className="flex items-center justify-between animate-fade-in-left">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-lg animate-bounce-in hover:scale-110 transition-transform">
                      <Bell className="size-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Notification Preferences</CardTitle>
                      <CardDescription>Control which notifications you receive</CardDescription>
                    </div>
                  </div>
                  {preferences && (
                    <div className="flex items-center gap-3 animate-fade-in-right">
                      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          getNotificationStats().enabled > 0 ? "bg-green-500 animate-pulse" : "bg-gray-400"
                        )} />
                        <span className="text-sm font-medium">
                          {getNotificationStats().enabled}/{getNotificationStats().total}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Quick Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Quick Actions:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEnableAllNotifications}
                    disabled={savingPreference !== null}
                    className="gap-2 border-green-200 hover:bg-green-50 hover:border-green-400 dark:border-green-800 dark:hover:bg-green-900/30 transition-all hover:scale-105"
                  >
                    <BellRing className="size-4 text-green-600" />
                    Enable All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisableAllNotifications}
                    disabled={savingPreference !== null}
                    className="gap-2 border-red-200 hover:bg-red-50 hover:border-red-400 dark:border-red-800 dark:hover:bg-red-900/30 transition-all hover:scale-105"
                  >
                    <BellOff className="size-4 text-red-600" />
                    Disable All
                  </Button>
                  <div className="hidden sm:block h-6 w-px bg-gray-300 dark:bg-gray-600" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!preferences) return;
                      // Enable only important notifications
                      const importantKeys = ['passwordChanged', 'emailChanged', 'shipmentCreated', 'quoteCreated'];
                      importantKeys.forEach(key => {
                        if (!preferences[key as keyof NotificationPreferences]) {
                          handlePreferenceChange(key as keyof NotificationPreferences, true);
                        }
                      });
                    }}
                    disabled={savingPreference !== null}
                    className="gap-2 border-amber-200 hover:bg-amber-50 hover:border-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/30 transition-all hover:scale-105"
                  >
                    <Zap className="size-4 text-amber-600" />
                    Important Only
                  </Button>
                </div>

                {/* Notification Categories */}
                {preferences && (
                  <div className="space-y-6">
                    {notificationCategories.map((category, categoryIndex) => {
                      const CategoryIcon = category.icon;
                      const categoryEnabled = category.items.filter(
                        item => preferences[item.key as keyof NotificationPreferences]
                      ).length;
                      const allEnabled = categoryEnabled === category.items.length;
                      const someEnabled = categoryEnabled > 0 && categoryEnabled < category.items.length;
                      
                      return (
                        <div 
                          key={category.title} 
                          className="space-y-3 animate-slide-up"
                          style={{ animationDelay: `${categoryIndex * 0.1}s` }}
                        >
                          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                category.title === 'Quotes & Sales' && "bg-gradient-to-br from-blue-500 to-cyan-500",
                                category.title === 'Shipments & Logistics' && "bg-gradient-to-br from-emerald-500 to-teal-500",
                                category.title === 'Account & Security' && "bg-gradient-to-br from-violet-500 to-purple-500"
                              )}>
                                <CategoryIcon className="size-5 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold">{category.title}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {categoryEnabled} of {category.items.length} enabled
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Category toggle indicator */}
                              <div className={cn(
                                "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all",
                                allEnabled && "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400",
                                someEnabled && "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
                                !categoryEnabled && "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                              )}>
                                {allEnabled ? (
                                  <>
                                    <CheckCircle2 className="size-3" />
                                    All On
                                  </>
                                ) : someEnabled ? (
                                  <>
                                    <AlertCircle className="size-3" />
                                    Partial
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="size-3" />
                                    All Off
                                  </>
                                )}
                              </div>
                              {/* Category bulk toggle */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => {
                                  const turnOn = categoryEnabled < category.items.length;
                                  category.items.forEach(item => {
                                    if (preferences[item.key as keyof NotificationPreferences] !== turnOn) {
                                      handlePreferenceChange(item.key as keyof NotificationPreferences, turnOn);
                                    }
                                  });
                                }}
                              >
                                {categoryEnabled === category.items.length ? 'Disable' : 'Enable'} All
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pl-2">
                            {category.items.map((item, itemIndex) => {
                              const Icon = item.icon;
                              const isEnabled = preferences[item.key as keyof NotificationPreferences];
                              const isSaving = savingPreference === item.key;
                              
                              return (
                                <div 
                                  key={item.key} 
                                  className={cn(
                                    "group relative flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 hover-card-lift",
                                    isEnabled 
                                      ? "border-green-300 bg-gradient-to-br from-green-50 to-emerald-50/50 dark:border-green-700 dark:from-green-900/30 dark:to-emerald-900/20 shadow-sm" 
                                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900",
                                    isSaving && "opacity-70 pointer-events-none"
                                  )}
                                  style={{ animationDelay: `${(categoryIndex * 0.1) + (itemIndex * 0.05)}s` }}
                                >
                                  {/* Saving indicator */}
                                  {isSaving && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 rounded-xl z-10">
                                      <Loader2 className="size-5 animate-spin text-green-600" />
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300",
                                      isEnabled 
                                        ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25" 
                                        : "bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700"
                                    )}>
                                      <Icon className={cn(
                                        "size-5 transition-all duration-300",
                                        isEnabled 
                                          ? "text-white" 
                                          : "text-gray-500 dark:text-gray-400"
                                      )} />
                                    </div>
                                    <div>
                                      <p className={cn(
                                        "text-sm font-semibold transition-colors",
                                        isEnabled && "text-green-700 dark:text-green-400"
                                      )}>{item.label}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                                    </div>
                                  </div>
                                  <Switch
                                    checked={isEnabled}
                                    onCheckedChange={(checked) => handlePreferenceChange(item.key as keyof NotificationPreferences, checked)}
                                    disabled={isSaving}
                                    className={cn(
                                      "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-emerald-600",
                                      "transition-all duration-300"
                                    )}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Additional Settings */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Settings className="size-4 text-gray-500" />
                    Additional Settings
                  </h4>
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                          <Mail className="size-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Email Notifications</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Receive notifications via email</p>
                        </div>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">Coming Soon</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                          <Moon className="size-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Do Not Disturb</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Pause all notifications temporarily</p>
                        </div>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">Coming Soon</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-6 animate-tab-switch">
            <Card className="shadow-xl border border-purple-100 dark:border-purple-900 overflow-hidden hover-lift">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 animate-gradient"></div>
              <CardHeader className="bg-gradient-to-br from-purple-50 to-violet-50/50 dark:from-gray-900 dark:to-gray-800 border-b border-purple-100 dark:border-purple-900">
                <div className="flex items-center justify-between animate-fade-in-left">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg animate-bounce-in hover:scale-110 transition-transform">
                      <History className="size-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Recent Activity</CardTitle>
                      <CardDescription>Your recent actions and events</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 animate-fade-in-right">
                    <Badge variant="outline" className="hidden sm:flex gap-1.5 border-purple-200 dark:border-purple-700">
                      <Activity className="size-3" />
                      {activities.length} events
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchProfile}
                      className="gap-2 border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all hover:scale-105 hover-lift"
                    >
                      <RefreshCw className="size-4" />
                      <span className="hidden sm:inline">Refresh</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {activities.length > 0 ? (
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-violet-500 to-transparent" />
                      
                      <div className="space-y-4">
                        {activities.map((activity, index) => (
                          <div 
                            key={activity._id || index} 
                            className="relative flex items-start gap-4 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 hover:shadow-md hover:-translate-y-1 ml-2 animate-slide-up"
                            style={{ animationDelay: `${index * 0.05}s` }}
                          >
                            {/* Timeline dot */}
                            <div className="absolute -left-4 top-6 w-3 h-3 rounded-full bg-purple-500 border-2 border-white dark:border-gray-900 shadow-md animate-pulse" />
                            
                            <div className={cn(
                              "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-110 shadow-md",
                              activity.type === 'login' && "bg-gradient-to-br from-green-500 to-emerald-600 text-white",
                              activity.type === 'profile_update' && "bg-gradient-to-br from-blue-500 to-indigo-600 text-white",
                              activity.type === 'password_change' && "bg-gradient-to-br from-amber-500 to-orange-600 text-white",
                              activity.type === 'avatar_updated' && "bg-gradient-to-br from-purple-500 to-violet-600 text-white",
                              activity.type === 'quote_created' && "bg-gradient-to-br from-cyan-500 to-blue-600 text-white",
                              activity.type === 'shipment_created' && "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
                              activity.type === 'google_calendar_connected' && "bg-gradient-to-br from-red-500 to-rose-600 text-white",
                              !['login', 'profile_update', 'password_change', 'avatar_updated', 'quote_created', 'shipment_created', 'google_calendar_connected'].includes(activity.type) && "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                            )}>
                              {activityIcons[activity.type] || <Activity className="size-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-gray-100">{activity.title}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{activity.description}</p>
                                </div>
                                <Badge variant="outline" className="text-[10px] flex-shrink-0 hidden sm:flex border-gray-300 dark:border-gray-600 font-medium">
                                  {activity.type.replace(/_/g, ' ')}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-3">
                                <Clock className="size-3 text-gray-400" />
                                <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-16 animate-fade-in-up">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-950 dark:to-violet-950 rounded-full animate-pulse-glow" />
                      <div className="relative w-full h-full flex items-center justify-center">
                        <History className="size-10 text-purple-400 dark:text-purple-500" />
                      </div>
                    </div>
                    <p className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No recent activity</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 max-w-[250px] mx-auto leading-relaxed">
                      Your actions like profile updates, logins, and changes will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="mt-6 animate-tab-switch">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-xl border border-cyan-100 dark:border-cyan-900 overflow-hidden hover-lift">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500 animate-gradient"></div>
                <CardHeader className="bg-gradient-to-br from-cyan-50 to-blue-50/50 dark:from-gray-900 dark:to-gray-800 border-b border-cyan-100 dark:border-cyan-900">
                  <div className="flex items-center gap-3 animate-slide-in-left">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                      <HelpCircle className="size-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Help & Support</CardTitle>
                      <CardDescription>Get help with your account</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-6 animate-fade-in-up">
                  <div className="relative animate-slide-up stagger-1">
                    <Button variant="outline" className="w-full justify-start opacity-60 hover:opacity-80 transition-opacity" disabled>
                      <MessageSquare className="size-4 mr-3" />Contact Support
                    </Button>
                    <Badge className="absolute top-1/2 right-3 -translate-y-1/2 bg-amber-100 text-amber-700 text-[10px] animate-soft-pulse">Coming Soon</Badge>
                  </div>
                  <div className="relative animate-slide-up stagger-2">
                    <Button variant="outline" className="w-full justify-start opacity-60 hover:opacity-80 transition-opacity" disabled>
                      <HelpCircle className="size-4 mr-3" />FAQ & Documentation
                    </Button>
                    <Badge className="absolute top-1/2 right-3 -translate-y-1/2 bg-amber-100 text-amber-700 text-[10px] animate-soft-pulse">Coming Soon</Badge>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start btn-hover-scale animate-slide-up stagger-3"
                    onClick={() => window.open('https://mail.google.com/mail/?view=cm&to=support@actionautoutah.com&su=Support%20Request', '_blank')}
                  >
                    <Mail className="size-4 mr-3" />Email: support@actionautoutah.com
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-xl border border-blue-100 dark:border-blue-900 overflow-hidden hover-lift">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-gradient"></div>
                <CardHeader className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-gray-900 dark:to-gray-800 border-b border-blue-100 dark:border-blue-900">
                  <div className="flex items-center gap-3 animate-slide-in-right">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg animate-bounce-in hover:scale-110 transition-transform">
                      <Building2 className="size-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">About ActionAutoUtah</CardTitle>
                      <CardDescription>Company information</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-6 animate-fade-in-up">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-gray-800 dark:to-gray-700 border border-blue-100 dark:border-blue-900 animate-slide-up stagger-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ActionAutoUtah is your trusted partner for vehicle transport and logistics solutions.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm animate-slide-up stagger-2">
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-gray-800 border border-blue-100 dark:border-blue-900">
                      <p className="text-gray-500 text-xs">Version</p>
                      <p className="font-medium">1.0.0</p>
                    </div>
                    <div className="p-3 rounded-lg bg-indigo-50 dark:bg-gray-800 border border-indigo-100 dark:border-indigo-900">
                      <p className="text-gray-500 text-xs">Last Updated</p>
                      <p className="font-medium">Feb 2026</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border border-red-200 dark:border-red-900 md:col-span-2 overflow-hidden hover-lift">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-rose-500 animate-gradient"></div>
                <CardHeader className="bg-gradient-to-br from-red-50 to-orange-50/50 dark:from-gray-900 dark:to-gray-800 border-b border-red-200 dark:border-red-900">
                  <div className="flex items-center gap-3 animate-fade-in-down">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg animate-bounce-in hover:scale-110 transition-transform">
                      <AlertCircle className="size-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-red-700 dark:text-red-400">Danger Zone</CardTitle>
                      <CardDescription>Irreversible actions</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 animate-slide-up">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">Delete Account</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950 btn-hover-scale animate-button-entry"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* First Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="size-5" />
              Delete Account?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This will permanently remove:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <X className="size-4 text-red-500" />
                All your personal information
              </li>
              <li className="flex items-center gap-2">
                <X className="size-4 text-red-500" />
                Your quotes and shipment history
              </li>
              <li className="flex items-center gap-2">
                <X className="size-4 text-red-500" />
                All notification preferences
              </li>
              <li className="flex items-center gap-2">
                <X className="size-4 text-red-500" />
                Connected services (Google Calendar, etc.)
              </li>
            </ul>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                setShowDeleteDialog(false);
                setShowDeleteConfirmDialog(true);
              }}
            >
              Yes, I want to delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Second Delete Confirmation Dialog (Type to confirm) */}
      <Dialog open={showDeleteConfirmDialog} onOpenChange={(open) => {
        setShowDeleteConfirmDialog(open);
        if (!open) setDeleteConfirmText('');
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="size-5" />
              Final Confirmation
            </DialogTitle>
            <DialogDescription>
              This action is PERMANENT and cannot be undone. Type <strong>DELETE</strong> below to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-950/50 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                ⚠️ Warning: All your data will be permanently deleted and cannot be recovered.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deleteConfirm">Type DELETE to confirm:</Label>
              <Input
                id="deleteConfirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setShowDeleteConfirmDialog(false);
              setDeleteConfirmText('');
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              disabled={deleteConfirmText !== 'DELETE'}
              onClick={handleDeleteAccount}
            >
              Permanently Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Online Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CircleDot className="size-5 text-emerald-600" />Set Your Status
            </DialogTitle>
            <DialogDescription>Let others know your availability</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Online Status</Label>
              <div className="grid grid-cols-2 gap-2">
                {onlineStatusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setOnlineStatus(option.value)}
                    className={cn(
                      "flex flex-col items-start gap-1 p-3 rounded-lg border-2 transition-all",
                      onlineStatus === option.value
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 shadow-md"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", option.color)} />
                      <span className="text-sm font-medium">{option.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-left">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customStatus">Custom Status Message</Label>
              <Input 
                id="customStatus" 
                value={customStatus} 
                onChange={(e) => handleCustomStatusChange(e.target.value)} 
                placeholder="What's on your mind?" 
                maxLength={MAX_CUSTOM_STATUS_LENGTH}
                className={cn(
                  customStatusError && "border-red-500 focus-visible:ring-red-500"
                )}
              />
              <div className="flex items-center justify-between">
                {customStatusError ? (
                  <p className="text-xs text-red-500">{customStatusError}</p>
                ) : (
                  <p className="text-xs text-gray-500">Keep it short and fun!</p>
                )}
                <p className={cn(
                  "text-xs",
                  customStatus.length >= MAX_CUSTOM_STATUS_LENGTH ? "text-red-500" : "text-gray-500"
                )}>
                  {customStatus.length}/{MAX_CUSTOM_STATUS_LENGTH}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateOnlineStatus} disabled={isSaving || !!customStatusError}>
              {isSaving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Check className="size-4 mr-2" />}
              Save Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
