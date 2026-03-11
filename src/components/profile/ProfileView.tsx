'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useClerk, useUser, useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useProfileContext } from '@/context/ProfileContext';
import { useProfileToast } from '@/components/ProfileToast';
import { apiClient } from '@/lib/api-client';
import { UserProfile, OnlineStatus, PersonalInfo, RecentActivity, SocialLink } from '@/types/user';
import { NotificationPreferences } from '@/types/notification';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    User,
    Settings,
    Shield,
    Bell,
    Activity,
    HelpCircle,
    Sparkles,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Import sub-components
import { ProfileHeader } from './ProfileHeader';
import { ProfileOverviewTab } from './ProfileOverviewTab';
import { PersonalInfoTab } from './PersonalInfoTab';
import { SecurityTab } from './SecurityTab';
import { NotificationsTab } from './NotificationsTab';
import { ActivityTab } from './ActivityTab';
import { SupportTab } from './SupportTab';
import { ProfileDialogs } from './ProfileDialogs';
import { allNotificationCategories, containsCurseWord } from './profile-constants';

export const ProfileView: React.FC = () => {
    const { user: clerkUser } = useUser();
    const { signOut, openUserProfile } = useClerk();
    const { getToken } = useAuth();
    const { setAvatarUrl, triggerRefresh } = useProfileContext();
    const toast = useProfileToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    // State Management
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

    // Personal Info State
    const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({});
    const [editingPersonalInfo, setEditingPersonalInfo] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [bioError, setBioError] = useState('');
    const [phoneCountryCode, setPhoneCountryCode] = useState('+1');
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

    // Notification State
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [savingPreference, setSavingPreference] = useState<string | null>(null);

    // Activity State
    const [activities, setActivities] = useState<RecentActivity[]>([]);

    // Online Status State
    const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>('online');
    const [customStatus, setCustomStatus] = useState('');
    const [customStatusError, setCustomStatusError] = useState<string | null>(null);

    // Dialog States
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false);
    const [showStatusDialog, setShowStatusDialog] = useState(false);

    const fetchProfile = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = await getToken();
            const response = await apiClient.get('/api/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data.data;
            setProfile(data);
            setPersonalInfo(data.personalInfo || {});
            setPhoneCountryCode(data.personalInfo?.phoneCountryCode || '+1');
            setSocialLinks(data.socialLinks || []);
            setPreferences(data.notificationPreferences);
            setActivities(data.recentActivity || []);
            setOnlineStatus(data.onlineStatus || 'online');
            setCustomStatus(data.customStatus || '');

            if (data.avatarUrl) {
                setAvatarUrl(data.avatarUrl);
            }
        } catch (error: any) {
            toast.addToast({
                type: 'error',
                title: 'Error',
                message: 'Failed to load profile data.'
            });
        } finally {
            setIsLoading(false);
        }
    }, [getToken, setAvatarUrl, toast]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
    };

    const handleBioChange = (value: string) => {
        setPersonalInfo({ ...personalInfo, bio: value });
        if (value.length > 500) {
            setBioError('Bio must be 500 characters or less');
        } else {
            setBioError('');
        }
    };

    const addSocialLink = () => {
        if (socialLinks.length < 4) {
            setSocialLinks([...socialLinks, { label: '', url: '' }]);
        }
    };

    const updateSocialLink = (index: number, field: 'label' | 'url', value: string) => {
        const newLinks = [...socialLinks];
        newLinks[index] = { ...newLinks[index], [field]: value };
        setSocialLinks(newLinks);
    };

    const removeSocialLink = (index: number) => {
        setSocialLinks(socialLinks.filter((_, i) => i !== index));
    };

    const handleSavePersonalInfo = async () => {
        setShowSaveConfirmDialog(false);
        if (personalInfo.bio && personalInfo.bio.length > 500) {
            toast.addToast({ type: 'error', title: 'Bio Too Long', message: 'Bio must be 500 characters or less.' });
            return;
        }

        const fieldsToCheck = [personalInfo.bio, personalInfo.jobTitle, personalInfo.department, customStatus].filter(Boolean);
        for (const field of fieldsToCheck) {
            if (field && containsCurseWord(field)) {
                toast.addToast({ type: 'error', title: 'Inappropriate Content', message: 'Please remove inappropriate language.' });
                return;
            }
        }

        setIsSaving(true);
        try {
            const updatedInfo = { ...personalInfo, phoneCountryCode, socialLinks };
            const token = await getToken();
            await apiClient.patch('/api/profile/personal-info', updatedInfo, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.addToast({ type: 'success', title: 'Information Saved', message: 'Your personal information has been updated.' });
            setEditingPersonalInfo(false);
            fetchProfile();
        } catch (error: any) {
            toast.addToast({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Failed to save information.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handlePreferenceChange = async (key: keyof NotificationPreferences, value: boolean) => {
        if (!preferences) return;
        setSavingPreference(key);
        const oldPreferences = { ...preferences };
        setPreferences({ ...preferences, [key]: value });

        try {
            const token = await getToken();
            await apiClient.patch('/api/profile/notification-preferences', { [key]: value }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error: any) {
            setPreferences(oldPreferences);
            toast.addToast({ type: 'error', title: 'Error', message: 'Failed to update preferences.' });
        } finally {
            setSavingPreference(null);
        }
    };

    const handleEnableAllNotifications = async () => {
        if (!preferences) return;
        setSavingPreference('all');
        try {
            const token = await getToken();
            const updates: any = {};
            Object.keys(preferences).forEach(key => {
                if (typeof preferences[key as keyof NotificationPreferences] === 'boolean') {
                    updates[key] = true;
                }
            });
            await apiClient.patch('/api/profile/notification-preferences', updates, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchProfile();
            toast.addToast({ type: 'success', title: 'Notifications Enabled', message: 'All notifications have been turned on.' });
        } catch (error) {
            toast.addToast({ type: 'error', title: 'Error', message: 'Failed to enable all notifications.' });
        } finally {
            setSavingPreference(null);
        }
    };

    const handleDisableAllNotifications = async () => {
        if (!preferences) return;
        setSavingPreference('all');
        try {
            const token = await getToken();
            const updates: any = {};
            Object.keys(preferences).forEach(key => {
                if (typeof preferences[key as keyof NotificationPreferences] === 'boolean') {
                    updates[key] = false;
                }
            });
            await apiClient.patch('/api/profile/notification-preferences', updates, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchProfile();
            toast.addToast({ type: 'success', title: 'Notifications Disabled', message: 'All notifications have been turned off.' });
        } catch (error) {
            toast.addToast({ type: 'error', title: 'Error', message: 'Failed to disable all notifications.' });
        } finally {
            setSavingPreference(null);
        }
    };

    const handleCustomStatusChange = (text: string) => {
        setCustomStatus(text);
        if (containsCurseWord(text)) {
            setCustomStatusError('Please remove inappropriate language');
        } else {
            setCustomStatusError(null);
        }
    };

    const handleUpdateOnlineStatus = async () => {
        setIsSaving(true);
        try {
            const token = await getToken();
            await apiClient.patch('/api/profile/personal-info', {
                onlineStatus,
                customStatus
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.addToast({ type: 'success', title: 'Status Updated', message: 'Your online status has been updated.' });
            setShowStatusDialog(false);
            fetchProfile();
        } catch (error) {
            toast.addToast({ type: 'error', title: 'Error', message: 'Failed to update status.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleVerifyEmail = async () => {
        toast.addToast({ type: 'info', title: 'Verification', message: 'Please check your email for a verification link from Clerk.' });
        openUserProfile();
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') return;
        try {
            const token = await getToken();
            await apiClient.delete('/api/profile/delete-account', {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.addToast({ type: 'success', title: 'Account Deleted', message: 'Your account has been permanently removed.' });
            signOut();
            router.push('/');
        } catch (error) {
            toast.addToast({ type: 'error', title: 'Error', message: 'Failed to delete account. Please contact support.' });
        }
    };

    const handleLogout = () => {
        signOut();
        router.push('/');
    };

    const getNotificationStats = () => {
        if (!preferences) return { enabled: 0, total: 0 };
        const keys = Object.keys(preferences).filter(key => typeof preferences[key as keyof NotificationPreferences] === 'boolean');
        const enabled = keys.filter(key => preferences[key as keyof NotificationPreferences]).length;
        return { enabled, total: keys.length };
    };

    if (isLoading && !profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <Loader2 className="size-12 animate-spin text-indigo-600" />
                    <div className="absolute inset-0 blur-xl bg-indigo-500/20 animate-pulse"></div>
                </div>
                <p className="text-gray-500 font-black uppercase tracking-widest animate-pulse">Loading Profile...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
            <ProfileHeader
                profile={profile}
                clerkUser={clerkUser}
                onlineStatus={onlineStatus}
                customStatus={customStatus}
                triggerRefresh={triggerRefresh}
                setAvatarUrl={setAvatarUrl}
                getToken={getToken}
                setShowStatusDialog={setShowStatusDialog}
                addToast={toast.addToast}
            />

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className="flex items-center justify-between mb-8 bg-white/50 dark:bg-gray-900/50 p-2 rounded-2xl border border-gray-200 dark:border-gray-800 backdrop-blur-sm sticky top-24 z-30 shadow-sm overflow-x-auto">
                    <TabsList className="bg-transparent h-auto gap-2 p-0">
                        {[
                            { value: 'overview', label: 'Overview', icon: Sparkles },
                            { value: 'personal', label: 'Personal', icon: User },
                            { value: 'security', label: 'Security', icon: Shield },
                            { value: 'notifications', label: 'Alerts', icon: Bell },
                            { value: 'activity', label: 'Feed', icon: Activity },
                            { value: 'support', label: 'Support', icon: HelpCircle },
                        ].map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-lg rounded-xl px-5 py-2.5 transition-all flex items-center gap-2 group border-2 border-transparent data-[state=active]:border-indigo-500/20"
                            >
                                <tab.icon className="size-4 group-data-[state=active]:text-indigo-500 transition-colors" />
                                <span className="font-bold text-xs uppercase tracking-wider">{tab.label}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <TabsContent value="overview">
                    <ProfileOverviewTab
                        profile={profile}
                        clerkUser={clerkUser}
                        activities={activities}
                        handleTabChange={handleTabChange}
                    />
                </TabsContent>

                <TabsContent value="personal">
                    <PersonalInfoTab
                        personalInfo={personalInfo}
                        editingPersonalInfo={editingPersonalInfo}
                        isSaving={isSaving}
                        phoneCountryCode={phoneCountryCode}
                        socialLinks={socialLinks}
                        bioError={bioError}
                        setEditingPersonalInfo={setEditingPersonalInfo}
                        setPersonalInfo={setPersonalInfo}
                        setPhoneCountryCode={setPhoneCountryCode}
                        setSocialLinks={setSocialLinks}
                        handleBioChange={handleBioChange}
                        setShowSaveConfirmDialog={setShowSaveConfirmDialog}
                        addSocialLink={addSocialLink}
                        updateSocialLink={updateSocialLink}
                        removeSocialLink={removeSocialLink}
                    />
                </TabsContent>

                <TabsContent value="security">
                    <SecurityTab
                        profile={profile}
                        openUserProfile={openUserProfile}
                        handleVerifyEmail={handleVerifyEmail}
                    />
                </TabsContent>

                <TabsContent value="notifications">
                    <NotificationsTab
                        preferences={preferences}
                        savingPreference={savingPreference}
                        profile={profile}
                        handleEnableAllNotifications={handleEnableAllNotifications}
                        handleDisableAllNotifications={handleDisableAllNotifications}
                        handlePreferenceChange={handlePreferenceChange}
                        getNotificationStats={getNotificationStats}
                    />
                </TabsContent>

                <TabsContent value="activity">
                    <ActivityTab
                        activities={activities}
                        fetchProfile={fetchProfile}
                        addToast={toast.addToast}
                    />
                </TabsContent>

                <TabsContent value="support">
                    <SupportTab setShowDeleteDialog={setShowDeleteDialog} />
                </TabsContent>
            </Tabs>

            <ProfileDialogs
                showDeleteDialog={showDeleteDialog}
                setShowDeleteDialog={setShowDeleteDialog}
                showDeleteConfirmDialog={showDeleteConfirmDialog}
                setShowDeleteConfirmDialog={setShowDeleteConfirmDialog}
                deleteConfirmText={deleteConfirmText}
                setDeleteConfirmText={setDeleteConfirmText}
                handleDeleteAccount={handleDeleteAccount}
                showLogoutDialog={showLogoutDialog}
                setShowLogoutDialog={setShowLogoutDialog}
                handleLogout={handleLogout}
                showSaveConfirmDialog={showSaveConfirmDialog}
                setShowSaveConfirmDialog={setShowSaveConfirmDialog}
                handleSavePersonalInfo={handleSavePersonalInfo}
                isSaving={isSaving}
                showStatusDialog={showStatusDialog}
                setShowStatusDialog={setShowStatusDialog}
                onlineStatus={onlineStatus}
                setOnlineStatus={setOnlineStatus}
                customStatus={customStatus}
                handleCustomStatusChange={handleCustomStatusChange}
                customStatusError={customStatusError}
                handleUpdateOnlineStatus={handleUpdateOnlineStatus}
            />
        </div>
    );
};
