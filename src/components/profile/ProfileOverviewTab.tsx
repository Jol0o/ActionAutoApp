import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    History,
    Globe,
    MapPin,
    Clock,
    Package,
    Truck,
    TrendingUp,
    Users,
    Mail,
    Calendar,
    UserPlus,
    DollarSign,
    Award,
    Link2,
    ExternalLink,
    Edit3
} from 'lucide-react';
import { UserProfile, RecentActivity } from '@/types/user';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { activityIcons, languageOptions } from './profile-constants';
import { useWalletDashboard } from '@/hooks/api/useWallet';
import { toast } from 'sonner';

interface ProfileOverviewTabProps {
    profile: UserProfile | null;
    clerkUser: any;
    activities: RecentActivity[];
    handleTabChange: (tab: string) => void;
}

export const ProfileOverviewTab: React.FC<ProfileOverviewTabProps> = ({
    profile,
    clerkUser,
    activities,
    handleTabChange,
}) => {
    const { data: walletData } = useWalletDashboard();
    const isCustomer = profile?.role === 'customer';

    const handleCopyLink = () => {
        if (!walletData?.referralCode) return;
        const link = `https://actionautoutah.com/join?ref=${walletData.referralCode}`;
        navigator.clipboard.writeText(link);
        toast.success("Referral link copied!");
    };

    const successfulReferrals = walletData?.recentTransactions?.filter(
        t => t.type === 'deposit' && t.status === 'completed'
    ).length || 0;
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-tab-switch">
            {/* Account Status Card */}
            <Card className="p-0 shadow-xl border border-blue-100 dark:border-blue-900 overflow-hidden hover-lift group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-gradient"></div>
                <CardHeader className="py-4 bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-gray-900 dark:to-gray-800 border-b border-blue-100 dark:border-blue-900">
                    <div className="flex items-center gap-3 animate-slide-in-left">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                            <Package className="size-5 text-white" />
                        </div>
                        <CardTitle className="text-lg">Quick Access</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Orders', icon: Package, count: '0', color: 'text-blue-500' },
                            { label: 'Messages', icon: Mail, count: '0', color: 'text-emerald-500' },
                            { label: 'Referrals', icon: UserPlus, count: '0', color: 'text-purple-500' },
                            { label: 'Awards', icon: Award, count: '0', color: 'text-amber-500' }
                        ].map((item, i) => (
                            <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer group/item animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                                <item.icon className={cn("size-5 mb-2 group-hover/item:scale-110 transition-transform", item.color)} />
                                <p className="text-2xl font-black">{item.count}</p>
                                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Personal Bio Card */}
            <Card className="shadow-xl p-0 border border-emerald-100 dark:border-emerald-900 md:col-span-2 overflow-hidden hover-lift group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 animate-gradient"></div>
                <CardHeader className="bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-gray-900 dark:to-gray-800 border-b border-emerald-100 dark:border-emerald-900 flex flex-row items-center justify-between py-5">
                    <div className="flex items-center gap-3 animate-slide-in-left">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg group-hover:-rotate-12 transition-transform">
                            <Globe className="size-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">About Me</CardTitle>
                        </div>
                    </div>
                    <button onClick={() => handleTabChange('personal')} className="p-2 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-600 dark:text-emerald-400 transition-colors animate-bounce-in">
                        <Edit3 className="size-5" />
                    </button>
                </CardHeader>
                <CardContent className="p-8">
                    {profile?.personalInfo?.bio ? (
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium animate-fade-in-up">
                            {profile.personalInfo.bio}
                        </p>
                    ) : (
                        <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl animate-fade-in-up">
                            <p className="text-gray-400 font-medium">No bio added yet. Tell us your story!</p>
                            <button
                                onClick={() => handleTabChange('personal')}
                                className="mt-4 text-emerald-600 font-bold hover:underline"
                            >
                                Add bio now →
                            </button>
                        </div>
                    )}

                    <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8 border-t border-gray-100 dark:border-gray-800">
                        {[
                            { label: 'Language', value: profile?.personalInfo?.language ? languageOptions.find(l => l.code === profile?.personalInfo?.language)?.name : 'Not set', icon: Globe, color: 'text-indigo-500' },
                            { label: 'Timezone', value: profile?.personalInfo?.timezone || 'Not set', icon: Clock, color: 'text-pink-500' },
                            { label: 'Location', value: profile?.personalInfo?.location || 'Not set', icon: MapPin, color: 'text-emerald-500' },
                            { label: 'Join Date', value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Today', icon: Calendar, color: 'text-amber-500' }
                        ].map((info, i) => (
                            <div key={i} className="flex flex-col gap-1 group/info animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                                <span className="text-[10px] uppercase font-black tracking-widest text-gray-400 group-hover/info:text-gray-500 transition-colors">{info.label}</span>
                                <div className="flex items-center gap-2">
                                    <info.icon className={cn("size-3.5", info.color)} />
                                    <span className="text-sm font-bold truncate">{info.value}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {profile?.socialLinks && profile.socialLinks.length > 0 && (
                        <div className="mt-8 flex flex-wrap gap-4 animate-fade-in-up">
                            {profile.socialLinks.map((link: any, i: number) => (
                                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all hover:scale-105 group/link">
                                    <Link2 className="size-4 text-emerald-500 transition-transform group-hover/link:rotate-45" />
                                    <span className="text-xs font-black uppercase tracking-wider">{link.label}</span>
                                    <ExternalLink className="size-3 text-gray-400 group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
                                </a>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Activity Mini Card */}
            <Card className={!isCustomer ? "shadow-xl col-span-3 p-0 border border-purple-100 dark:border-purple-900 overflow-hidden hover-lift group" : "shadow-xl p-0 border border-purple-100 dark:border-purple-900 overflow-hidden hover-lift group"}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 animate-gradient"></div>
                <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50/50 dark:from-gray-900 dark:to-gray-800 border-b border-purple-100 dark:border-purple-900 py-5">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3 animate-slide-in-left">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <History className="size-5 text-white" />
                            </div>
                            <CardTitle className="text-lg">Recent Feed</CardTitle>
                        </div>
                        <button
                            onClick={() => handleTabChange('activity')}
                            className="text-xs font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 hover:underline animate-bounce-in"
                        >
                            View All
                        </button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {activities.slice(0, 5).map((activity, i) => (
                            <div key={i} className="p-4 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-colors group/act animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 group-hover/act:scale-110 group-hover/act:bg-purple-100 transition-all">
                                        {activityIcons[activity.type] || <History className="size-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold truncate group-hover/act:text-purple-600 dark:group-hover/act:text-purple-400 transition-colors">{activity.title}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {activities.length === 0 && (
                            <div className="p-10 text-center animate-fade-in">
                                <History className="size-10 text-gray-200 dark:text-gray-800 mx-auto mb-4" />
                                <p className="text-gray-400 font-bold text-sm">No recent activity found.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Referral Program Preview - Only for Customers */}
            {isCustomer && (
                <Card className="p-0 shadow-2xl border-none md:col-span-2 overflow-hidden hover-lift group relative bg-zinc-950 text-white min-h-[300px]">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600"></div>

                    {/* Background Accents */}
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                    <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl animate-pulse-slow"></div>

                    <CardContent className="p-8 sm:p-10 relative z-10">
                        <div className="flex flex-col lg:flex-row justify-between gap-10">
                            {/* Left Side: Content & Link */}
                            <div className="flex-1 space-y-8">
                                <div className="flex items-start gap-5">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-2xl shadow-orange-500/20 group-hover:scale-110 transition-transform duration-500">
                                        <UserPlus className="size-8 text-white" />
                                    </div>
                                    <div className="space-y-1">
                                        <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1">
                                            Exclusive Reward
                                        </Badge>
                                        <h3 className="text-3xl font-black tracking-tight text-white">Refer & Earn $100</h3>
                                    </div>
                                </div>

                                <p className="text-zinc-400 font-medium text-lg leading-relaxed max-w-xl">
                                    Share ActionAutoUtah with your network. For every friend who buys a vehicle through us, you'll receive a <span className="text-orange-400 font-black">$100 bonus</span> as our thank you!
                                </p>

                                <div className="space-y-3 pt-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Your Unique Referral Link</label>
                                    <div className="flex gap-2 p-1.5 rounded-2xl bg-zinc-900 border border-zinc-800 group/input focus-within:border-orange-500/50 transition-all max-w-lg">
                                        <input
                                            readOnly
                                            value={`https://actionautoutah.com/join?ref=${walletData?.referralCode || '...'}`}
                                            className="bg-transparent border-0 focus:ring-0 flex-1 px-4 font-mono text-sm font-bold text-zinc-400"
                                        />
                                        <button
                                            onClick={handleCopyLink}
                                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-orange-500/20"
                                        >
                                            Copy Link
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Stats */}
                            <div className="flex flex-col justify-between items-end gap-8">
                                <div className="text-right space-y-1">
                                    <p className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500">Total Rewards Earned</p>
                                    <div className="text-5xl font-black text-orange-500 tracking-tighter">
                                        ${walletData?.totalEarned?.toFixed(2) || '0.00'}
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col items-center justify-center min-w-[140px] group/stat hover:bg-emerald-500/10 transition-colors">
                                        <TrendingUp className="size-6 text-emerald-500 mb-3 group-hover/stat:scale-110 transition-transform" />
                                        <span className="text-3xl font-black text-white">{successfulReferrals}</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70 mt-1">Successful</span>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 flex flex-col items-center justify-center min-w-[140px] group/stat hover:bg-blue-500/10 transition-colors">
                                        <Users className="size-6 text-blue-500 mb-3 group-hover/stat:scale-110 transition-transform" />
                                        <span className="text-3xl font-black text-white">{walletData?.pendingLeads || 0}</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500/70 mt-1">Signups</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
