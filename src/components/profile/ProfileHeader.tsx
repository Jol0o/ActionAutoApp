import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Camera,
    MapPin,
    Phone,
    ExternalLink,
    CircleDot,
    Crown,
    Truck,
    Zap,
    Calendar,
    ShieldCheck,
    Globe
} from 'lucide-react';
import { UserProfile, OnlineStatus } from '@/types/user';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import ProfileImageCropper from '@/components/ProfileImageCropper';
import { onlineStatusOptions } from './profile-constants';

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

    const handleSaveAvatar = async (croppedImage: Blob) => {
        try {
            const token = await getToken();
            const formData = new FormData();
            formData.append('avatar', croppedImage, 'avatar.jpg');

            const response = await apiClient.patch('/api/profile/avatar', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
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

    return (
        <div className="relative mb-8 rounded-3xl overflow-hidden shadow-2xl border border-white/20 dark:border-white/10 group h-fit flex flex-col">
            {/* Dynamic Background with improved gradients */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900 animate-gradient-xy"></div>
            <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] group-hover:scale-110 transition-transform duration-1000"></div>

            {/* Content wrapper with better glassmorphism */}
            <div className="relative w-full p-8 flex flex-col md:flex-row items-center md:items-end gap-10 backdrop-blur-md bg-white/10 dark:bg-black/20">
                {/* Profile Image with enhanced hover state */}
                <div className="relative group/avatar">
                    <div className="relative w-40 h-40 rounded-3xl overflow-hidden ring-4 ring-white/50 shadow-2xl transition-all duration-500 group-hover/avatar:ring-white group-hover/avatar:scale-105 group-hover/avatar:rotate-2 cursor-pointer" onClick={() => setIsCropperOpen(true)}>
                        <img
                            src={profile?.avatarUrl || profile?.avatar || authUser?.imageUrl || ''}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="size-8 text-white animate-bounce-in" />
                        </div>
                    </div>

                    <ProfileImageCropper
                        isOpen={isCropperOpen}
                        onClose={() => setIsCropperOpen(false)}
                        onSave={handleSaveAvatar}
                        currentImage={profile?.avatarUrl || profile?.avatar || authUser?.imageUrl || ''}
                    />

                    {/* Enhanced Online Status Badge */}
                    <button
                        onClick={() => setShowStatusDialog(true)}
                        className="absolute -bottom-3 -right-3 h-10 w-10 rounded-2xl bg-white dark:bg-gray-900 shadow-xl border-4 border-transparent hover:scale-110 transition-all active:scale-95 flex items-center justify-center group/status"
                    >
                        <div className={cn("w-4 h-4 rounded-full shadow-lg relative", currentStatus.color)}>
                            <div className={cn("absolute inset-0 rounded-full animate-ping opacity-75", currentStatus.color)}></div>
                        </div>
                    </button>
                </div>

                {/* User Info with sophisticated typography */}
                <div className="flex-1 text-center md:text-left space-y-4">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg animate-fade-in-left">
                            {profile?.name || (profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}` : authUser?.firstName || 'User')}
                        </h1>
                        <div className="flex gap-2 animate-fade-in-right">
                            {profile?.role === 'super_admin' && (
                                <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-lg px-3 py-1 text-xs font-bold uppercase tracking-wider scale-110">
                                    <Crown className="size-3 mr-1.5" />Super Admin
                                </Badge>
                            )}
                            {profile?.role === 'admin' && (
                                <Badge className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white border-0 shadow-lg px-3 py-1 text-xs font-bold uppercase tracking-wider scale-110">
                                    <ShieldCheck className="size-3 mr-1.5" />Admin
                                </Badge>
                            )}
                            {profile?.role === 'driver' && (
                                <Badge className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white border-0 shadow-lg px-3 py-1 text-xs font-bold uppercase tracking-wider scale-110">
                                    <Truck className="size-3 mr-1.5" />Driver
                                </Badge>
                            )}
                            {profile?.role === 'customer' && (
                                <Badge className="bg-gradient-to-r from-gray-400 to-slate-500 text-white border-0 shadow-lg px-3 py-1 text-xs font-bold uppercase tracking-wider scale-110">
                                    Customer
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Dynamic Status Message with improved look */}
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
                        <button
                            onClick={() => setShowStatusDialog(true)}
                            className="group/msg flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all hover:scale-105 active:scale-95 backdrop-blur-md animate-fade-in-up"
                        >
                            <CircleDot className={cn("size-4", currentStatus.color.replace('bg-', 'text-'))} />
                            <span className="text-white/90 font-medium text-sm italic">
                                {customStatus || "I'm checking out the dashboard!"}
                            </span>
                            <Badge variant="outline" className="text-[10px] text-white/50 border-white/20 group-hover/msg:text-white/80 transition-colors">Edit</Badge>
                        </button>
                        <div className="flex items-center gap-6 text-white/80 text-sm font-semibold animate-fade-in-up stagger-1">
                            <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                                <MapPin className="size-4 text-pink-300" />
                                {profile?.personalInfo?.location || "Planet Earth"}
                            </span>
                            <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                                <Globe className="size-4 text-cyan-300" />
                                {profile?.personalInfo?.language ? languageOptions.find(l => l.code === profile?.personalInfo?.language)?.name : 'English'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons with high-end hover effects */}
                <div className="flex flex-col gap-3 min-w-[200px] animate-fade-in-right">
                    <Button
                        className="w-full h-12 bg-white text-indigo-600 hover:bg-gray-100 border-0 shadow-xl font-bold transition-all hover:scale-110 hover:-rotate-2 active:scale-95 group/btn"
                        onClick={() => window.open('https://actionautoutah.com', '_blank')}
                    >
                        <ExternalLink className="size-4 mr-2 group-hover/btn:rotate-12 transition-transform" />ActionAutoUtah
                    </Button>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 h-12 border-2 border-white/30 text-white hover:bg-white/10 font-bold transition-all hover:scale-105 active:scale-95 backdrop-blur-md"
                            onClick={() => setShowStatusDialog(true)}
                        >
                            Status
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-12 w-12 border-2 border-white/30 text-white hover:bg-white/10 font-bold transition-all hover:scale-105 active:scale-95 backdrop-blur-md"
                        >
                            <Phone className="size-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Bar with dynamic glass effect */}
            <div className="relative w-full border-t border-white/20 bg-black/20 backdrop-blur-xl px-10 py-6 grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                    { label: 'Role Level', value: profile?.role?.replace('_', ' ') || 'Customer', icon: Crown, color: 'text-amber-400' },
                    { label: 'Account ID', value: profile?._id?.slice(-8).toUpperCase() || 'NEW-USER', icon: Zap, color: 'text-cyan-400' },
                    { label: 'Member Since', value: profile?.createdAt ? new Date(profile.createdAt).getFullYear().toString() : '2026', icon: Calendar, color: 'text-emerald-400' },
                    { label: 'Identity', value: profile?.securityStatus?.emailVerified ? 'Verified' : 'Unverified', icon: ShieldCheck, color: 'text-pink-400' }
                ].map((stat, i) => (
                    <div key={i} className="flex flex-col gap-1 group/stat animate-slide-up" style={{ animationDelay: `${i * 0.15}s` }}>
                        <span className="text-white/50 text-[10px] uppercase font-black tracking-widest group-hover/stat:text-white/70 transition-colors uppercase">{stat.label}</span>
                        <div className="flex items-center gap-2">
                            <stat.icon className={cn("size-4", stat.color)} />
                            <span className="text-white font-black text-lg capitalize group-hover/stat:scale-105 transition-transform origin-left">{stat.value}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const languageOptions = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'fil', name: 'Filipino' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'th', name: 'Thai' },
    { code: 'ru', name: 'Russian' },
];
