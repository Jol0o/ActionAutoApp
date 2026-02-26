'use client';

import { useState, useEffect } from 'react';
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
import { useClerk, useUser, useAuth } from "@clerk/nextjs";
import { useTheme } from '@/context/ThemeContext';
import { useAlert } from '@/components/AlertDialog';
import { useOrg } from '@/hooks/useOrg';
import ProfileImageCropper from '@/components/ProfileImageCropper';
import {
  User,
  Mail,
  Lock,
  Bell,
  Moon,
  Sun,
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
  Clock,
  Activity,
  History,
  LogOut,
  HelpCircle,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  UserCog,
  ShieldCheck,
  KeyRound,
  Fingerprint,
  CircleDot,
  Timer,
  Navigation,
  Route,
  Gauge
} from 'lucide-react';
import { UserProfile, OnlineStatus, PersonalInfo, RecentActivity } from '@/types/user';
import { NotificationPreferences } from '@/types/notification';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { format, formatDistanceToNow } from 'date-fns';

// Online status options
const onlineStatusOptions: { value: OnlineStatus; label: string; color: string; description: string }[] = [
  { value: 'online', label: 'Available', color: 'bg-green-500', description: 'Ready for assignments' },
  { value: 'away', label: 'Away', color: 'bg-yellow-500', description: 'Temporarily unavailable' },
  { value: 'busy', label: 'On Delivery', color: 'bg-blue-500', description: 'Currently on a delivery' },
  { value: 'do_not_disturb', label: 'Off Duty', color: 'bg-red-500', description: 'Not accepting assignments' },
  { value: 'offline', label: 'Offline', color: 'bg-gray-500', description: 'Not working' },
];

// Activity type icons
const activityIcons: Record<string, React.ReactNode> = {
  login: <LogOut className="size-4" />,
  logout: <LogOut className="size-4" />,
  profile_update: <Edit3 className="size-4" />,
  password_change: <Lock className="size-4" />,
  email_change: <Mail className="size-4" />,
  settings_change: <Settings className="size-4" />,
  shipment_created: <Truck className="size-4" />,
  delivery_completed: <CheckCircle2 className="size-4" />,
  route_started: <Navigation className="size-4" />,
  avatar_updated: <Camera className="size-4" />,
  other: <Activity className="size-4" />,
};

export default function DriverProfilePage() {
  const { user: clerkUser } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const { getToken } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showAlert, AlertComponent } = useAlert();
  const { organization } = useOrg();

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

  // Notification preferences
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  // Recent activities
  const [activities, setActivities] = useState<RecentActivity[]>([]);

  // Driver stats (mock data - would come from backend)
  const [driverStats] = useState({
    deliveriesCompleted: 156,
    onTimeRate: 98.5,
    totalMiles: 12450,
    rating: 4.9,
    activeDeliveries: 2,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await getToken();
      const response = await apiClient.get('/api/profile', { headers: { Authorization: `Bearer ${token}` } });
      const data = response.data;
      setProfile(data.data);
      setPreferences(data.data.notificationPreferences);
      setOnlineStatus(data.data.onlineStatus || 'online');
      setCustomStatus(data.data.customStatus || '');
      setPersonalInfo(data.data.personalInfo || {});
      setActivities(data.data.recentActivities || []);
    } catch (error) {
      console.error('Error fetching profile:', error);
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

      const token = await getToken();
      const response = await apiClient.patch('/api/profile/avatar', { avatar: croppedImage }, { headers: { Authorization: `Bearer ${token}` } });
      
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
      const token = await getToken();
      await apiClient.patch('/api/profile/online-status', { status: onlineStatus, customStatus }, { headers: { Authorization: `Bearer ${token}` } });
      
      showAlert({
        type: 'success',
        title: 'Status Updated',
        message: 'Your availability status has been updated.',
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
    setIsSaving(true);
    try {
      const token = await getToken();
      await apiClient.patch('/api/profile/personal-info', personalInfo, { headers: { Authorization: `Bearer ${token}` } });
      
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

    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    try {
      const token = await getToken();
      await apiClient.patch('/api/profile/notification-preferences', { [key]: value }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (error: any) {
      setPreferences(preferences);
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update notification preferences.',
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const currentStatusOption = onlineStatusOptions.find(s => s.value === onlineStatus) || onlineStatusOptions[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950 px-4">
        <div className="text-center">
          <div className="relative">
            <Truck className="size-12 sm:size-16 text-emerald-600 dark:text-emerald-500 animate-bounce" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="size-6 sm:size-8 animate-spin text-emerald-700 dark:text-emerald-400" />
            </div>
          </div>
          <p className="mt-4 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950">
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
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 10 L50 25 L50 45 L30 60 L10 45 L10 25 Z' fill='none' stroke='%2310b981' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Hero Header - Driver Specific */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-600 dark:from-emerald-700 dark:via-teal-600 dark:to-cyan-700 shadow-xl sm:shadow-2xl">
          <div className="absolute inset-0 overflow-hidden opacity-20 hidden sm:block">
            <svg viewBox="0 0 1200 400" className="absolute right-0 bottom-0 w-full h-full" preserveAspectRatio="xMaxYMax slice">
              <path d="M 100 250 L 200 250 L 200 200 L 250 200 L 280 150 L 400 150 L 450 200 L 800 200 L 850 250 L 1100 250 L 1100 300 L 950 300 Q 950 350 900 350 Q 850 350 850 300 L 350 300 Q 350 350 300 350 Q 250 350 250 300 L 100 300 Z" fill="rgba(255, 255, 255, 0.15)" />
              <circle cx="300" cy="310" r="35" fill="rgba(255, 255, 255, 0.2)" />
              <circle cx="900" cy="310" r="35" fill="rgba(255, 255, 255, 0.2)" />
            </svg>
          </div>

          <div className="relative p-4 sm:p-6 md:p-8 lg:p-12">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 md:gap-8">
              {/* Profile Picture */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-white/40 via-teal-300 to-white/40 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
                <div 
                  className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-2xl border-4 border-white/40 flex items-center justify-center shadow-2xl overflow-hidden cursor-pointer"
                  onClick={() => setShowImageCropper(true)}
                >
                  {(profile?.avatar || clerkUser?.imageUrl) ? (
                    <img 
                      src={profile?.avatar || clerkUser?.imageUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Truck className="size-10 sm:size-14 md:size-20 text-white" />
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="size-6 sm:size-8 text-white" />
                  </div>
                </div>
                <button 
                  onClick={() => setShowStatusDialog(true)}
                  className={cn(
                    "absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-4 border-white shadow-lg flex items-center justify-center transition-colors",
                    currentStatusOption.color
                  )}
                  title={`Status: ${currentStatusOption.label}`}
                >
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                </button>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 mb-2 sm:mb-3">
                  <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight drop-shadow-lg">
                    {profile?.name || clerkUser?.fullName || 'Driver'}
                  </h1>
                  <Badge className="bg-emerald-500/20 text-white border border-white/30 text-xs sm:text-sm px-3 py-1">
                    <Truck className="size-3 mr-1.5" />Driver
                  </Badge>
                </div>
                <p className="text-white/90 text-sm sm:text-base mb-2">
                  {profile?.email || clerkUser?.primaryEmailAddress?.emailAddress}
                </p>
                {organization && (
                  <p className="text-white/80 text-xs sm:text-sm mb-3 flex items-center justify-center sm:justify-start gap-1">
                    <Building2 className="size-3" />{organization.name}
                  </p>
                )}
                {customStatus && (
                  <p className="text-white/80 text-xs sm:text-sm italic mb-3">"{customStatus}"</p>
                )}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
                  <Badge className="bg-white/20 text-white border border-white/30 backdrop-blur-sm px-3 py-1.5 text-xs font-medium">
                    <div className={cn("w-2 h-2 rounded-full mr-2", currentStatusOption.color)} />
                    {currentStatusOption.label}
                  </Badge>
                  <Badge className="bg-white/20 text-white border border-white/30 backdrop-blur-sm px-3 py-1.5 text-xs font-medium">
                    <Award className="size-3 mr-1.5" />
                    {driverStats.rating} Rating
                  </Badge>
                </div>
              </div>

              <div className="flex flex-row sm:flex-col gap-2">
                <Button onClick={() => setShowStatusDialog(true)} variant="outline" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                  <CircleDot className="size-4 mr-2" />
                  <span className="hidden sm:inline">Set Status</span>
                </Button>
                <Button onClick={handleLogout} variant="outline" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                  <LogOut className="size-4 mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full flex flex-wrap justify-start gap-1 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm p-1 rounded-xl border border-gray-200 dark:border-gray-800">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              <Gauge className="size-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="personal" className="flex items-center gap-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              <UserCog className="size-4" />
              <span className="hidden sm:inline">Personal</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              <ShieldCheck className="size-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              <Bell className="size-4" />
              <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              <History className="size-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              <HelpCircle className="size-4" />
              <span className="hidden sm:inline">Help</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Driver Stats Card */}
                <Card className="shadow-xl border border-emerald-100 dark:border-emerald-900 overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
                  <CardHeader className="bg-gradient-to-br from-emerald-50 to-white dark:from-gray-900 dark:to-gray-900 border-b border-emerald-100 dark:border-emerald-900">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                        <TrendingUp className="size-6 text-white" />
                      </div>
                      <div>
                        <CardTitle>Driver Statistics</CardTitle>
                        <CardDescription>Your performance overview</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border border-emerald-200 dark:border-emerald-800">
                        <Package className="size-6 text-emerald-600 dark:text-emerald-400 mb-2" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">Deliveries</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{driverStats.deliveriesCompleted}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-lime-50 dark:from-green-950 dark:to-lime-950 border border-green-200 dark:border-green-800">
                        <CheckCircle2 className="size-6 text-green-600 dark:text-green-400 mb-2" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">On-Time</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{driverStats.onTimeRate}%</p>
                      </div>
                      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border border-blue-200 dark:border-blue-800">
                        <Route className="size-6 text-blue-600 dark:text-blue-400 mb-2" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Miles</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{driverStats.totalMiles.toLocaleString()}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border border-amber-200 dark:border-amber-800">
                        <Award className="size-6 text-amber-600 dark:text-amber-400 mb-2" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">Rating</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{driverStats.rating}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 border border-purple-200 dark:border-purple-800">
                        <Truck className="size-6 text-purple-600 dark:text-purple-400 mb-2" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{driverStats.activeDeliveries}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bio Card */}
                <Card className="shadow-xl border border-emerald-100 dark:border-emerald-900">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
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
                      <p className="text-gray-600 dark:text-gray-400">{personalInfo.bio}</p>
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500 italic">No bio added yet. Click edit to add one.</p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                      {personalInfo.location && (
                        <span className="flex items-center gap-1"><MapPin className="size-4" />{personalInfo.location}</span>
                      )}
                      {personalInfo.phone && (
                        <span className="flex items-center gap-1"><Phone className="size-4" />{personalInfo.phone}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Theme & Status */}
                <Card className="shadow-xl border border-emerald-100 dark:border-emerald-900">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-600 to-slate-700 flex items-center justify-center">
                        {theme === 'dark' ? <Moon className="size-5 text-white" /> : <Sun className="size-5 text-white" />}
                      </div>
                      <CardTitle>Display & Status</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div>
                        <Label className="text-sm font-semibold">Dark Mode</Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {theme === 'dark' ? 'Night mode active' : 'Day mode active'}
                        </p>
                      </div>
                      <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} className="data-[state=checked]:bg-emerald-600" />
                    </div>
                    <Button onClick={() => setShowStatusDialog(true)} variant="outline" className="w-full">
                      <div className={cn("w-3 h-3 rounded-full mr-2", currentStatusOption.color)} />
                      Change Availability Status
                    </Button>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="shadow-xl border border-emerald-100 dark:border-emerald-900">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                        <Settings className="size-5 text-white" />
                      </div>
                      <CardTitle>Quick Actions</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button onClick={() => setShowImageCropper(true)} variant="outline" className="w-full justify-start">
                      <Camera className="size-4 mr-3" />Update Profile Photo
                    </Button>
                    <Button onClick={() => openUserProfile()} variant="outline" className="w-full justify-start">
                      <Lock className="size-4 mr-3" />Change Password
                    </Button>
                    <Button onClick={() => setActiveTab('notifications')} variant="outline" className="w-full justify-start">
                      <Bell className="size-4 mr-3" />Notification Settings
                    </Button>
                  </CardContent>
                </Card>

                {/* Account Info */}
                <Card className="shadow-xl border border-emerald-100 dark:border-emerald-900">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <Clock className="size-5 text-white" />
                      </div>
                      <CardTitle>Account Info</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Member Since</span>
                      <span className="font-medium">
                        {profile?.createdAt ? format(new Date(profile.createdAt), 'MMM yyyy') : 'N/A'}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Last Active</span>
                      <span className="font-medium">
                        {profile?.accountStatus?.lastActive 
                          ? formatDistanceToNow(new Date(profile.accountStatus.lastActive), { addSuffix: true })
                          : 'Now'
                        }
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400">Status</span>
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        Active
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Personal Info Tab */}
          <TabsContent value="personal" className="mt-6">
            <Card className="shadow-xl border border-emerald-100 dark:border-emerald-900">
              <CardHeader className="bg-gradient-to-br from-emerald-50 to-white dark:from-gray-900 dark:to-gray-900 border-b border-emerald-100 dark:border-emerald-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                      <UserCog className="size-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>Manage your personal details</CardDescription>
                    </div>
                  </div>
                  {!editingPersonalInfo ? (
                    <Button onClick={() => setEditingPersonalInfo(true)}>
                      <Edit3 className="size-4 mr-2" />Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setEditingPersonalInfo(false)}>Cancel</Button>
                      <Button onClick={handleSavePersonalInfo} disabled={isSaving}>
                        {isSaving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Check className="size-4 mr-2" />}
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="bio" className="flex items-center gap-2">
                      <Edit3 className="size-4 text-emerald-600" />Bio / Description
                    </Label>
                    <Textarea
                      id="bio"
                      value={personalInfo.bio || ''}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, bio: e.target.value })}
                      disabled={!editingPersonalInfo}
                      placeholder="Tell us about yourself as a driver..."
                      className="min-h-[100px]"
                    />
                    <p className="text-xs text-gray-500">{(personalInfo.bio?.length || 0)}/500 characters</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="size-4 text-emerald-600" />Phone Number
                    </Label>
                    <Input id="phone" value={personalInfo.phone || ''} onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })} disabled={!editingPersonalInfo} placeholder="+1 (555) 123-4567" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center gap-2">
                      <MapPin className="size-4 text-emerald-600" />Location / Service Area
                    </Label>
                    <Input id="location" value={personalInfo.location || ''} onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })} disabled={!editingPersonalInfo} placeholder="Salt Lake City, UT" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="flex items-center gap-2">
                      <Globe className="size-4 text-emerald-600" />Timezone
                    </Label>
                    <Select value={personalInfo.timezone || ''} onValueChange={(value) => setPersonalInfo({ ...personalInfo, timezone: value })} disabled={!editingPersonalInfo}>
                      <SelectTrigger><SelectValue placeholder="Select timezone" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="America/Phoenix">Arizona Time</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language" className="flex items-center gap-2">
                      <Globe className="size-4 text-emerald-600" />Language
                    </Label>
                    <Select value={personalInfo.language || 'en'} onValueChange={(value) => setPersonalInfo({ ...personalInfo, language: value })} disabled={!editingPersonalInfo}>
                      <SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-xl border border-emerald-100 dark:border-emerald-900">
                <CardHeader className="bg-gradient-to-br from-emerald-50 to-white dark:from-gray-900 dark:to-gray-900 border-b border-emerald-100 dark:border-emerald-900">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                      <ShieldCheck className="size-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>Security Status</CardTitle>
                      <CardDescription>Overview of your account security</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", profile?.securityStatus?.emailVerified ? "bg-green-100 dark:bg-green-900" : "bg-yellow-100 dark:bg-yellow-900")}>
                        <Mail className={cn("size-5", profile?.securityStatus?.emailVerified ? "text-green-600" : "text-yellow-600")} />
                      </div>
                      <div>
                        <p className="font-medium">Email Verification</p>
                        <p className="text-sm text-gray-500">{profile?.email}</p>
                      </div>
                    </div>
                    {profile?.securityStatus?.emailVerified ? (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        <CheckCircle2 className="size-3 mr-1" />Verified
                      </Badge>
                    ) : (
                      <Button size="sm" variant="outline">Verify Now</Button>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", profile?.securityStatus?.hasPassword ? "bg-green-100 dark:bg-green-900" : "bg-gray-100 dark:bg-gray-800")}>
                        <KeyRound className={cn("size-5", profile?.securityStatus?.hasPassword ? "text-green-600" : "text-gray-600")} />
                      </div>
                      <div>
                        <p className="font-medium">Password</p>
                        <p className="text-sm text-gray-500">
                          {profile?.securityStatus?.lastPasswordChange ? `Last changed ${formatDistanceToNow(new Date(profile.securityStatus.lastPasswordChange), { addSuffix: true })}` : 'Managed by Clerk'}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => openUserProfile()}>Change</Button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 opacity-75">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Fingerprint className="size-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-500">Extra layer of security</p>
                      </div>
                    </div>
                    <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">Coming Soon</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border border-emerald-100 dark:border-emerald-900">
                <CardHeader className="bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-900 border-b border-blue-100 dark:border-blue-900">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <Lock className="size-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>Account Security</CardTitle>
                      <CardDescription>Manage via Clerk</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="size-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Managed by Clerk</p>
                          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                            Email and password changes are handled through Clerk for your security.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button onClick={() => openUserProfile()} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                      <Settings className="size-4 mr-2" />Open Security Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-6">
            <Card className="shadow-xl border border-emerald-100 dark:border-emerald-900">
              <CardHeader className="bg-gradient-to-br from-emerald-50 to-white dark:from-gray-900 dark:to-gray-900 border-b border-emerald-100 dark:border-emerald-900">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                    <Bell className="size-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>Control which alerts you receive</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {preferences && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { key: 'shipmentCreated', label: 'New Assignments', description: 'When assigned new deliveries', icon: Truck },
                      { key: 'shipmentUpdated', label: 'Route Updates', description: 'Delivery route changes', icon: Navigation },
                      { key: 'quoteCreated', label: 'New Pickup', description: 'New pickup notifications', icon: Package },
                      { key: 'passwordChanged', label: 'Security Alerts', description: 'Password & security', icon: Lock },
                      { key: 'emailChanged', label: 'Email Updates', description: 'Email change alerts', icon: Mail },
                      { key: 'profileUpdated', label: 'Profile Changes', description: 'Profile updates', icon: User },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                              <Icon className="size-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{item.label}</p>
                              <p className="text-xs text-gray-500">{item.description}</p>
                            </div>
                          </div>
                          <Switch
                            checked={preferences[item.key as keyof NotificationPreferences]}
                            onCheckedChange={(checked) => handlePreferenceChange(item.key as keyof NotificationPreferences, checked)}
                            className="data-[state=checked]:bg-emerald-600"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-6">
            <Card className="shadow-xl border border-emerald-100 dark:border-emerald-900">
              <CardHeader className="bg-gradient-to-br from-emerald-50 to-white dark:from-gray-900 dark:to-gray-900 border-b border-emerald-100 dark:border-emerald-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                      <History className="size-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Your recent actions</CardDescription>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchProfile}>
                    <RefreshCw className="size-4 mr-2" />Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {activities.length > 0 ? (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {activities.map((activity, index) => (
                        <div key={activity._id || index} className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            activity.type === 'login' && "bg-green-100 dark:bg-green-900",
                            activity.type === 'profile_update' && "bg-blue-100 dark:bg-blue-900",
                            activity.type === 'password_change' && "bg-yellow-100 dark:bg-yellow-900",
                            activity.type === 'avatar_updated' && "bg-purple-100 dark:bg-purple-900",
                            !['login', 'profile_update', 'password_change', 'avatar_updated'].includes(activity.type) && "bg-gray-100 dark:bg-gray-800"
                          )}>
                            {activityIcons[activity.type] || <Activity className="size-4" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{activity.title}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{activity.description}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12">
                    <History className="size-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Your actions will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-xl border border-emerald-100 dark:border-emerald-900">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                      <HelpCircle className="size-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>Help & Support</CardTitle>
                      <CardDescription>Get help with your account</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="size-4 mr-3" />Contact Dispatch
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <HelpCircle className="size-4 mr-3" />Driver FAQ
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="size-4 mr-3" />Email: support@actionautoutah.com
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-xl border border-emerald-100 dark:border-emerald-900">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <Building2 className="size-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>About</CardTitle>
                      <CardDescription>App information</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ActionAutoUtah Driver App - Your trusted platform for vehicle transport deliveries.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Version</p>
                      <p className="font-medium">1.0.0</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Last Updated</p>
                      <p className="font-medium">Feb 2026</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Online Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CircleDot className="size-5 text-emerald-600" />Set Your Availability
            </DialogTitle>
            <DialogDescription>Let dispatch know your status</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Availability Status</Label>
              <div className="grid grid-cols-1 gap-2">
                {onlineStatusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setOnlineStatus(option.value)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left",
                      onlineStatus === option.value
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    )}
                  >
                    <div className={cn("w-3 h-3 rounded-full", option.color)} />
                    <div>
                      <span className="text-sm font-medium">{option.label}</span>
                      <p className="text-xs text-gray-500">{option.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customStatus">Status Message (optional)</Label>
              <Input id="customStatus" value={customStatus} onChange={(e) => setCustomStatus(e.target.value)} placeholder="E.g., On break until 2pm" maxLength={100} />
              <p className="text-xs text-gray-500">{customStatus.length}/100 characters</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateOnlineStatus} disabled={isSaving}>
              {isSaving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Check className="size-4 mr-2" />}
              Save Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
