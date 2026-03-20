import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Camera,
    MapPin,
    CircleDot,
    Crown,
    Truck,
    Zap,
    Calendar,
    ShieldCheck,
    Globe,
    User
} from 'lucide-react';
import { UserProfile, OnlineStatus } from '@/types/user';
import { cn, resolveImageUrl } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import ProfileImageCropper from '@/components/ProfileImageCropper';
import { onlineStatusOptions, languageOptions } from './profile-constants';

interface ProfileHeaderProps {
    profile: UserProfile | null;
    authUser: any;
    onlineStatus: OnlineStatus;
    customStatus: string;
    triggerRefresh: () => void;
    setAvatarUrl: (url: string) => void;
    getToken: () => Promise<string | null>;
    setShowStatusDialog: (show: boolean) => void;
    addToast: (toast: any) => void;
}

const roleBadgeConfig: Record<string, { label: string; icon: typeof Crown; gradient: string }> = {
    super_admin: { label: 'Super Admin', icon: Crown, gradient: 'from-amber-400 to-orange-500' },
    admin: { label: 'Admin', icon: ShieldCheck, gradient: 'from-blue-400 to-indigo-500' },
    driver: { label: 'Driver', icon: Truck, gradient: 'from-emerald-400 to-teal-500' },
    customer: { label: 'Customer', icon: User, gradient: 'from-slate-400 to-gray-500' },
};

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    profile,
    authUser,
    onlineStatus,
    customStatus,
    triggerRefresh,
    setAvatarUrl,
    getToken,
    setShowStatusDialog,
    addToast,
}) => {
    const [isCropperOpen, setIsCropperOpen] = React.useState(false);
    const currentStatus = onlineStatusOptions.find(s => s.value === onlineStatus) || onlineStatusOptions[0];
    const role = roleBadgeConfig[profile?.role || 'customer'] || roleBadgeConfig.customer;
    const RoleIcon = role.icon;

    const handleSaveAvatar = async (croppedImage: Blob) => {
        try {
            const token = await getToken();
            const formData = new FormData();
            formData.append('avatar', croppedImage, 'avatar.jpg');

            const response = await apiClient.patch('/api/profile/avatar', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': undefined
                }
            });
            const newUrl = response.data.data.avatarUrl;
            setAvatarUrl(newUrl);
            triggerRefresh();
            addToast({
                type: 'success',
                title: 'Avatar Updated',
                message: 'Your profile picture has been updated successfully.'
            });
        } catch (error: any) {
            addToast({
                type: 'error',
                title: 'Error',
                message: error.response?.data?.message || 'Failed to update avatar.'
            });
            throw error;
        }
    };

    const displayName = profile?.name
        || (profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : null)
        || authUser?.fullName
        || authUser?.firstName
        || 'User';

    const avatarSrc = profile?.avatarUrl || profile?.avatar || authUser?.imageUrl;

    return (
        <div className="relative mb-8 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl border border-gray-200/60 dark:border-white/10 group h-fit flex flex-col">
            <div className="absolute inset-0 bg-linear-to-br from-emerald-600 via-teal-600 to-cyan-700 dark:from-emerald-800 dark:via-teal-900 dark:to-cyan-950" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-linear-to-t from-black/20 to-transparent" />

            <div className="relative w-full px-5 py-6 sm:px-8 sm:py-8 md:px-10 md:py-10 flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-8">
                <div className="relative group/avatar shrink-0">
                    <div
                        className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl sm:rounded-3xl overflow-hidden ring-[3px] ring-white/50 dark:ring-white/30 shadow-2xl transition-all duration-300 group-hover/avatar:ring-white/80 cursor-pointer"
                        onClick={() => setIsCropperOpen(true)}
                    >
                        {avatarSrc ? (
                            <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-white/20 flex items-center justify-center">
                                <User className="size-12 sm:size-16 text-white/70" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="size-6 sm:size-8 text-white" />
                        </div>
                    </div>

                    <ProfileImageCropper
                        isOpen={isCropperOpen}
                        onClose={() => setIsCropperOpen(false)}
                        onSave={handleSaveAvatar}
                        currentImage={resolveImageUrl(profile?.avatarUrl || profile?.avatar || authUser?.imageUrl)}
                    />

                    <button
                        onClick={() => setShowStatusDialog(true)}
                        className="absolute -bottom-1.5 -right-1.5 sm:-bottom-2 sm:-right-2 h-7 w-7 sm:h-9 sm:w-9 rounded-xl bg-white dark:bg-gray-900 shadow-lg border-2 border-white/80 dark:border-gray-700 hover:scale-110 transition-all active:scale-95 flex items-center justify-center"
                    >
                        <div className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full", currentStatus.color)} />
                    </button>
                </div>

                <div className="flex-1 min-w-0 text-center sm:text-left space-y-2.5 sm:space-y-3">
                    <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-2 sm:gap-3">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-md leading-tight truncate max-w-full">
                            {displayName}
                        </h1>
                        <Badge className={cn("bg-linear-to-r text-white border-0 shadow-md px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider shrink-0", role.gradient)}>
                            <RoleIcon className="size-3 mr-1" />{role.label}
                        </Badge>
                    </div>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4">
                        <button
                            onClick={() => setShowStatusDialog(true)}
                            className="group/msg inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all backdrop-blur-sm"
                        >
                            <CircleDot className={cn("size-3.5", currentStatus.color.replace('bg-', 'text-'))} />
                            <span className="text-white/85 font-medium text-xs sm:text-sm italic truncate max-w-45 sm:max-w-70">
                                {customStatus || 'Set your status...'}
                            </span>
                        </button>
                        <div className="hidden sm:flex items-center gap-4 text-white/70 text-xs sm:text-sm font-medium">
                            <span className="inline-flex items-center gap-1.5">
                                <MapPin className="size-3.5 text-emerald-200" />
                                {profile?.personalInfo?.location || 'Earth'}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <Globe className="size-3.5 text-cyan-200" />
                                {profile?.personalInfo?.language ? languageOptions.find(l => l.code === profile?.personalInfo?.language)?.name : 'English'}
                            </span>
                        </div>
                    </div>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-white/25 text-white hover:bg-white/15 backdrop-blur-sm font-semibold hidden sm:inline-flex"
                    onClick={() => setShowStatusDialog(true)}
                >
                    <CircleDot className="size-4 mr-2" />Status
                </Button>
            </div>

            <div className="relative w-full border-t border-white/15 bg-black/15 backdrop-blur-md px-5 py-4 sm:px-8 sm:py-5 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                {[
                    { label: 'Role', value: profile?.role?.replace('_', ' ') || 'Customer', icon: Crown, color: 'text-amber-300' },
                    { label: 'Account ID', value: profile?._id?.slice(-8).toUpperCase() || 'NEW', icon: Zap, color: 'text-cyan-300' },
                    { label: 'Member Since', value: profile?.createdAt ? new Date(profile.createdAt).getFullYear().toString() : new Date().getFullYear().toString(), icon: Calendar, color: 'text-emerald-300' },
                    { label: 'Identity', value: profile?.securityStatus?.emailVerified ? 'Verified' : 'Unverified', icon: ShieldCheck, color: 'text-pink-300' }
                ].map((stat, i) => (
                    <div key={i} className="flex flex-col gap-0.5 group/stat">
                        <span className="text-white/40 text-[9px] sm:text-[10px] uppercase font-bold tracking-widest">{stat.label}</span>
                        <div className="flex items-center gap-1.5">
                            <stat.icon className={cn("size-3.5 sm:size-4", stat.color)} />
                            <span className="text-white font-bold text-sm sm:text-base capitalize truncate">{stat.value}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
