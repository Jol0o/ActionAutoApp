'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { apiClient } from '@/lib/api-client';
import { DriverProfile, ComplianceDocument, PopulatedUser } from '@/types/driver-profile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Loader2, ArrowLeft, Truck, Shield, FileText, FileCheck, CreditCard,
    CheckCircle2, XCircle, Clock, Eye, Ban, Hash, Gauge, Ruler,
    Settings2, Star, MapPin, Calendar, Fingerprint, Lock, Scale,
    BadgeCheck, ShieldAlert, AlertTriangle, UserCheck, ChevronRight,
    Download, Phone, Mail, Globe, Wrench, Building2, X, ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { REQUIRED_DOCUMENTS, trailerTypeOptions, specialFeatureOptions, hitchTypeOptions } from '@/components/driver-profile/driver-profile-constants';
import { cn, resolveImageUrl } from '@/lib/utils';
import Link from 'next/link';

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Denver' }) : '—';
const fmtSize = (b?: number) => !b ? '' : b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;
const getExpStatus = (d?: string) => {
    if (!d) return { l: 'Not Set', c: 'text-muted-foreground' };
    const days = Math.ceil((new Date(d).getTime() - Date.now()) / 864e5);
    if (days < 0) return { l: `Expired ${Math.abs(days)}d ago`, c: 'text-red-500' };
    if (days <= 30) return { l: `${days}d left`, c: 'text-amber-500' };
    if (days <= 90) return { l: `${days}d`, c: 'text-yellow-500' };
    return { l: `${days}d`, c: 'text-emerald-500' };
};

const getUser = (userId: string | PopulatedUser): PopulatedUser | null =>
    typeof userId === 'object' && userId !== null ? userId : null;

const getInitials = (name?: string) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
};

type Tab = 'overview' | 'equipment' | 'documents' | 'compliance';
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: UserCheck },
    { id: 'equipment', label: 'Equipment', icon: Truck },
    { id: 'documents', label: 'Documents', icon: FileCheck },
    { id: 'compliance', label: 'Compliance', icon: Shield },
];

const Stat = ({ label, value, color }: { label: string; value: string | number; color?: string }) => (
    <div className="text-center p-3 rounded-xl bg-muted/20 border border-border/10">
        <p className={cn('text-2xl font-black tabular-nums', color || 'text-foreground')}>{value}</p>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">{label}</p>
    </div>
);

const Field = ({ label, value, mono }: { label: string; value?: string | number | null; mono?: boolean }) => (
    <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={cn('text-sm font-semibold', !value && 'text-muted-foreground italic', mono && 'font-mono tracking-wide')}>
            {value || 'Not provided'}
        </p>
    </div>
);

const isImageUrl = (url?: string) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.includes('.jpg') || lower.includes('.jpeg') || lower.includes('.png') || lower.includes('.webp');
};

export function DriverDetailView({ driverId }: { driverId: string }) {
    const { getToken } = useAuth();
    const [profile, setProfile] = useState<DriverProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>('overview');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectDocId, setRejectDocId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [previewDoc, setPreviewDoc] = useState<ComplianceDocument | null>(null);

    const fetchProfile = useCallback(async () => {
        try {
            const token = await getToken();
            const res = await apiClient.get(`/api/driver-profile/org/${driverId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setProfile(res.data?.data || null);
        } catch {
            toast.error('Failed to load driver profile');
        } finally {
            setLoading(false);
        }
    }, [getToken, driverId]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    const handleVerify = async (docId: string) => {
        setActionLoading(docId);
        try {
            const token = await getToken();
            const res = await apiClient.patch(
                `/api/driver-profile/org/${driverId}/documents/${docId}/verify`,
                { verified: true },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            if (res.data?.data) setProfile(res.data.data);
            toast.success('Document verified');
        } catch {
            toast.error('Failed to verify document');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (docId: string) => {
        if (!rejectReason.trim() || rejectReason.trim().length < 3) {
            toast.error('Please provide a rejection reason (min 3 characters)');
            return;
        }
        setActionLoading(docId);
        try {
            const token = await getToken();
            const res = await apiClient.patch(
                `/api/driver-profile/org/${driverId}/documents/${docId}/reject`,
                { reason: rejectReason.trim() },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            if (res.data?.data) setProfile(res.data.data);
            toast.success('Document rejected');
            setRejectDocId(null);
            setRejectReason('');
        } catch {
            toast.error('Failed to reject document');
        } finally {
            setActionLoading(null);
        }
    };

    const user = profile ? getUser(profile.userId) : null;
    const documents = profile?.documents || [];
    const requiredDocs = REQUIRED_DOCUMENTS.filter(d => d.required);
    const optionalDocs = REQUIRED_DOCUMENTS.filter(d => !d.required);

    const stats = useMemo(() => {
        if (!profile) return null;
        const docs = profile.documents || [];
        const verified = docs.filter((d: ComplianceDocument) => d.verified).length;
        const pending = docs.filter((d: ComplianceDocument) => !d.verified && d.reviewStatus !== 'rejected').length;
        const rejected = docs.filter((d: ComplianceDocument) => d.reviewStatus === 'rejected').length;
        return { verified, pending, rejected, total: docs.length };
    }, [profile]);

    const trailerInfo = trailerTypeOptions.find(t => t.value === profile?.trailerType);
    const hitchInfo = hitchTypeOptions.find(h => h.value === profile?.hitchType);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="relative"><div className="size-16 rounded-full border-4 border-primary/20 animate-pulse" /><Loader2 className="size-8 animate-spin text-primary absolute inset-0 m-auto" /></div>
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Loading Driver Profile</p>
        </div>
    );

    if (!profile) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <ShieldAlert className="size-12 text-muted-foreground/30" />
            <p className="text-sm font-bold text-muted-foreground">Driver profile not found</p>
            <Link href="/settings"><Button variant="outline" className="gap-2"><ArrowLeft className="size-4" /> Back to Settings</Button></Link>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">

                <div className="relative overflow-hidden rounded-3xl shadow-2xl">
                    <div className="absolute inset-0 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950" />
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary/8 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
                    <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/6 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23fff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
                    <div className="relative p-5 sm:p-7">
                        <div className="flex items-start justify-between gap-4 mb-5">
                            <div className="flex items-center gap-4">
                                <Link href="/settings?tab=drivers" className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 backdrop-blur-sm shrink-0">
                                    <ArrowLeft className="size-4.5 text-white/80" />
                                </Link>
                                <Avatar className="size-14 border-2 border-white/15 shadow-xl shrink-0">
                                    <AvatarImage src={user?.avatar} />
                                    <AvatarFallback className="bg-white/10 text-white font-black text-lg">{getInitials(user?.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{user?.name || 'Unknown Driver'}</h1>
                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                        {user?.email && <span className="flex items-center gap-1.5 text-xs text-white/40"><Mail className="size-3" />{user.email}</span>}
                                        <Badge className={cn('text-[10px] font-bold px-2 h-5 border-0',
                                            profile.verificationStatus === 'verified' ? 'bg-emerald-500/20 text-emerald-400' :
                                                profile.verificationStatus === 'under_review' ? 'bg-amber-500/20 text-amber-400' :
                                                    profile.verificationStatus === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                                        'bg-white/10 text-white/50')}>
                                            {(profile.verificationStatus || 'not_started').replace(/_/g, ' ')}
                                        </Badge>
                                        <Badge className={cn('text-[10px] font-bold px-2 h-5 border-0 capitalize',
                                            profile.operationalStatus === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                                                profile.operationalStatus === 'maintenance' ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-white/10 text-white/50')}>
                                            {(profile.operationalStatus || 'unknown').replace(/_/g, ' ')}
                                        </Badge>
                                        {profile.isComplianceExpired && <Badge className="text-[10px] bg-red-500/20 text-red-400 border-0 gap-0.5"><AlertTriangle className="size-2.5" /> Expired</Badge>}
                                    </div>
                                </div>
                            </div>
                            <div className="hidden sm:block text-right shrink-0">
                                <span className="text-5xl font-black tabular-nums text-white">{profile.profileCompletionScore || 0}%</span>
                                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Profile Score</p>
                            </div>
                        </div>

                        <div className="h-1.5 rounded-full bg-white/8 overflow-hidden mb-5">
                            <motion.div className={cn('h-full rounded-full bg-linear-to-r',
                                (profile.profileCompletionScore || 0) >= 80 ? 'from-emerald-400 to-teal-400' :
                                    (profile.profileCompletionScore || 0) >= 50 ? 'from-amber-400 to-orange-400' : 'from-red-400 to-rose-400')}
                                initial={false} animate={{ width: `${profile.profileCompletionScore || 0}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} />
                        </div>

                        <div className="flex gap-1.5">
                            {TABS.map(t => {
                                const active = tab === t.id;
                                return (
                                    <button key={t.id} type="button" onClick={() => setTab(t.id)}
                                        className={cn('flex-1 flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 p-3 sm:p-3.5 rounded-xl transition-all border relative overflow-hidden',
                                            active ? 'bg-white/10 border-white/20 shadow-lg' : 'bg-white/3 border-white/5 hover:bg-white/6')}>
                                        {active && <motion.div layoutId="drv-tab" className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-primary to-blue-400" transition={{ type: 'spring', stiffness: 400, damping: 35 }} />}
                                        <div className={cn('size-8 rounded-lg flex items-center justify-center shrink-0', active ? 'bg-white/10' : 'bg-white/5')}>
                                            <t.icon className={cn('size-4', active ? 'text-white' : 'text-white/30')} />
                                        </div>
                                        <span className={cn('text-[11px] sm:text-xs font-bold', active ? 'text-white' : 'text-white/30')}>{t.label}</span>
                                        {t.id === 'documents' && stats && stats.pending > 0 && (
                                            <span className="absolute top-2 right-2 size-4 rounded-full bg-amber-500 text-[9px] font-black text-white flex items-center justify-center">{stats.pending}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div key={tab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

                        {tab === 'overview' && (
                            <div className="space-y-5">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <Stat label="Documents" value={stats?.total || 0} />
                                    <Stat label="Verified" value={stats?.verified || 0} color="text-emerald-500" />
                                    <Stat label="Pending" value={stats?.pending || 0} color="text-amber-500" />
                                    <Stat label="Capacity" value={`${profile.maxVehicleCapacity || 0} veh`} color="text-blue-500" />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                    <Card className="border-border/20 shadow-xl overflow-hidden rounded-2xl">
                                        <div className="h-1 w-full bg-linear-to-r from-blue-600 to-indigo-500" />
                                        <div className="px-5 pt-5 pb-3 flex items-center gap-3 border-b border-border/10">
                                            <div className="size-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg"><Truck className="size-5" /></div>
                                            <div><h3 className="text-sm font-black">Equipment Summary</h3><p className="text-[10px] text-muted-foreground">Truck & Trailer</p></div>
                                        </div>
                                        <CardContent className="p-5 space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <Field label="Truck" value={profile.truckMake && profile.truckModel ? `${profile.truckMake} ${profile.truckModel}` : undefined} />
                                                <Field label="Year" value={profile.truckYear} />
                                                <Field label="Trailer Type" value={trailerInfo?.label} />
                                                <Field label="Capacity" value={profile.maxVehicleCapacity ? `${profile.maxVehicleCapacity} vehicles` : undefined} />
                                                <Field label="DOT #" value={profile.dotNumber} mono />
                                                <Field label="MC #" value={profile.mcNumber} mono />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-border/20 shadow-xl overflow-hidden rounded-2xl">
                                        <div className="h-1 w-full bg-linear-to-r from-violet-600 to-purple-500" />
                                        <div className="px-5 pt-5 pb-3 flex items-center gap-3 border-b border-border/10">
                                            <div className="size-10 rounded-xl bg-linear-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white shadow-lg"><Fingerprint className="size-5" /></div>
                                            <div><h3 className="text-sm font-black">Identity & Verification</h3><p className="text-[10px] text-muted-foreground">Security Status</p></div>
                                        </div>
                                        <CardContent className="p-5 space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <Field label="SSN" value={profile.ssnLast4 ? `••••${profile.ssnLast4}` : undefined} mono />
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Background Check</p>
                                                    <div className="flex items-center gap-1.5">
                                                        {profile.backgroundCheckConsent ?
                                                            <><CheckCircle2 className="size-4 text-emerald-500" /><span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Authorized</span></> :
                                                            <><XCircle className="size-4 text-muted-foreground" /><span className="text-sm font-semibold text-muted-foreground">Not authorized</span></>}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Agreement</p>
                                                    <div className="flex items-center gap-1.5">
                                                        {profile.verificationAgreement ?
                                                            <><CheckCircle2 className="size-4 text-emerald-500" /><span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Accepted</span></> :
                                                            <><XCircle className="size-4 text-muted-foreground" /><span className="text-sm font-semibold text-muted-foreground">Not accepted</span></>}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Verification</p>
                                                    <Badge className={cn('text-[10px] capitalize',
                                                        profile.verificationStatus === 'verified' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                            profile.verificationStatus === 'under_review' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                                                'bg-muted/20 text-muted-foreground border-border/20')}>
                                                        {(profile.verificationStatus || 'not_started').replace(/_/g, ' ')}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-border/20 shadow-xl overflow-hidden rounded-2xl">
                                        <div className="h-1 w-full bg-linear-to-r from-emerald-600 to-teal-500" />
                                        <div className="px-5 pt-5 pb-3 flex items-center gap-3 border-b border-border/10">
                                            <div className="size-10 rounded-xl bg-linear-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg"><CreditCard className="size-5" /></div>
                                            <div><h3 className="text-sm font-black">Credentials</h3><p className="text-[10px] text-muted-foreground">License & Insurance</p></div>
                                        </div>
                                        <CardContent className="p-5 space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <Field label="CDL Number" value={profile.driversLicenseNumber} mono />
                                                <Field label="License State" value={profile.licenseState} />
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">CDL Expiration</p>
                                                    <p className={cn('text-sm font-semibold', getExpStatus(profile.licenseExpirationDate).c)}>
                                                        {profile.licenseExpirationDate ? `${fmtDate(profile.licenseExpirationDate)} (${getExpStatus(profile.licenseExpirationDate).l})` : 'Not set'}
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Medical Expiration</p>
                                                    <p className={cn('text-sm font-semibold', getExpStatus(profile.medicalCardExpirationDate).c)}>
                                                        {profile.medicalCardExpirationDate ? `${fmtDate(profile.medicalCardExpirationDate)} (${getExpStatus(profile.medicalCardExpirationDate).l})` : 'Not set'}
                                                    </p>
                                                </div>
                                                <Field label="Insurance Provider" value={profile.insuranceProvider} />
                                                <Field label="Policy Number" value={profile.insurancePolicyNumber} mono />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-border/20 shadow-xl overflow-hidden rounded-2xl">
                                        <div className="h-1 w-full bg-linear-to-r from-amber-500 to-orange-500" />
                                        <div className="px-5 pt-5 pb-3 flex items-center gap-3 border-b border-border/10">
                                            <div className="size-10 rounded-xl bg-linear-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg"><MapPin className="size-5" /></div>
                                            <div><h3 className="text-sm font-black">Logistics</h3><p className="text-[10px] text-muted-foreground">Location & Availability</p></div>
                                        </div>
                                        <CardContent className="p-5 space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <Field label="Home Base" value={profile.homeBase?.address || (profile.homeBase?.city && profile.homeBase?.state ? `${profile.homeBase.city}, ${profile.homeBase.state}` : undefined)} />
                                                <Field label="Service Radius" value={profile.serviceRadius ? `${profile.serviceRadius} mi` : undefined} />
                                                <div className="col-span-2 space-y-1">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Preferred Routes</p>
                                                    {profile.preferredRoutes?.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1.5">{profile.preferredRoutes.map(r => <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>)}</div>
                                                    ) : <p className="text-sm font-semibold text-muted-foreground italic">Not provided</p>}
                                                </div>
                                                <div className="col-span-2 space-y-1">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Available Days</p>
                                                    {profile.availableDays?.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1.5">{profile.availableDays.map(d => <Badge key={d} variant="outline" className="text-[10px] capitalize">{d}</Badge>)}</div>
                                                    ) : <p className="text-sm font-semibold text-muted-foreground italic">Not provided</p>}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50">
                                    <span>Profile created {fmtDate(profile.createdAt)}</span>
                                    <span>·</span>
                                    <span>Last updated {fmtDate(profile.updatedAt)}</span>
                                </div>
                            </div>
                        )}

                        {tab === 'equipment' && (
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                    <Card className="border-border/20 shadow-xl overflow-hidden rounded-2xl">
                                        <div className="h-1 w-full bg-linear-to-r from-blue-600 to-indigo-500" />
                                        <div className="px-5 pt-5 pb-3 flex items-center gap-3 border-b border-border/10">
                                            <div className="size-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg"><Truck className="size-5" /></div>
                                            <div><h3 className="text-sm font-black">Truck Details</h3></div>
                                        </div>
                                        <CardContent className="p-5">
                                            <div className="grid grid-cols-2 gap-4">
                                                <Field label="Make" value={profile.truckMake} />
                                                <Field label="Model" value={profile.truckModel} />
                                                <Field label="Year" value={profile.truckYear} />
                                                <Field label="Color" value={profile.truckColor} />
                                                <Field label="Engine Type" value={profile.engineType} />
                                                <Field label="GVWR" value={profile.gvwr ? `${profile.gvwr.toLocaleString()} lbs` : undefined} />
                                                <Field label="VIN" value={profile.vin} mono />
                                                <Field label="License Plate" value={profile.plateNumber} mono />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-border/20 shadow-xl overflow-hidden rounded-2xl">
                                        <div className="h-1 w-full bg-linear-to-r from-slate-600 to-zinc-500" />
                                        <div className="px-5 pt-5 pb-3 flex items-center gap-3 border-b border-border/10">
                                            <div className="size-10 rounded-xl bg-linear-to-br from-slate-600 to-zinc-500 flex items-center justify-center text-white shadow-lg"><Shield className="size-5" /></div>
                                            <div><h3 className="text-sm font-black">Operating Authority</h3></div>
                                        </div>
                                        <CardContent className="p-5">
                                            <div className="grid grid-cols-2 gap-4">
                                                <Field label="DOT Number" value={profile.dotNumber} mono />
                                                <Field label="MC Number" value={profile.mcNumber} mono />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-border/20 shadow-xl overflow-hidden rounded-2xl">
                                        <div className="h-1 w-full bg-linear-to-r from-emerald-600 to-teal-500" />
                                        <div className="px-5 pt-5 pb-3 flex items-center gap-3 border-b border-border/10">
                                            <div className="size-10 rounded-xl bg-linear-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg"><Wrench className="size-5" /></div>
                                            <div><h3 className="text-sm font-black">Trailer Details</h3></div>
                                        </div>
                                        <CardContent className="p-5">
                                            <div className="grid grid-cols-2 gap-4">
                                                <Field label="Type" value={trailerInfo?.label} />
                                                <Field label="Category" value={trailerInfo?.category} />
                                                <Field label="Make" value={profile.trailerMake} />
                                                <Field label="Model" value={profile.trailerModel} />
                                                <Field label="Year" value={profile.trailerYear} />
                                                <Field label="Hitch Type" value={hitchInfo?.label} />
                                                <Field label="Capacity" value={trailerInfo?.capacity} />
                                                <Field label="Length" value={profile.trailerLength ? `${profile.trailerLength} ft` : undefined} />
                                                <Field label="Axles" value={profile.trailerAxles} />
                                                <Field label="GVWR" value={profile.trailerGvwr ? `${profile.trailerGvwr.toLocaleString()} lbs` : undefined} />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-border/20 shadow-xl overflow-hidden rounded-2xl">
                                        <div className="h-1 w-full bg-linear-to-r from-violet-600 to-purple-500" />
                                        <div className="px-5 pt-5 pb-3 flex items-center gap-3 border-b border-border/10">
                                            <div className="size-10 rounded-xl bg-linear-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white shadow-lg"><Star className="size-5" /></div>
                                            <div><h3 className="text-sm font-black">Special Features</h3></div>
                                            <Badge className="ml-auto text-xs font-bold bg-linear-to-r from-violet-600 to-purple-500 text-white border-0">{profile.specialFeatures?.length || 0}</Badge>
                                        </div>
                                        <CardContent className="p-5">
                                            {profile.specialFeatures?.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {profile.specialFeatures.map(f => {
                                                        const opt = specialFeatureOptions.find(o => o.value === f);
                                                        return <Badge key={f} variant="outline" className="text-xs capitalize">{opt?.label || f.replace(/_/g, ' ')}</Badge>;
                                                    })}
                                                </div>
                                            ) : <p className="text-sm text-muted-foreground italic">No features configured</p>}
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}

                        {tab === 'documents' && (
                            <div className="space-y-5">
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                    <Stat label="Total" value={stats?.total || 0} />
                                    <Stat label="Verified" value={stats?.verified || 0} color="text-emerald-500" />
                                    <Stat label="Pending" value={stats?.pending || 0} color="text-amber-500" />
                                    <Stat label="Rejected" value={stats?.rejected || 0} color="text-red-500" />
                                </div>

                                <Card className="border-border/20 shadow-xl overflow-hidden rounded-2xl">
                                    <div className="h-1 w-full bg-linear-to-r from-emerald-600 to-teal-500" />
                                    <div className="px-5 pt-5 pb-3 flex items-center gap-3 border-b border-border/10">
                                        <div className="size-10 rounded-xl bg-linear-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg"><FileCheck className="size-5" /></div>
                                        <div className="flex-1"><h3 className="text-sm font-black">Required Documents</h3></div>
                                    </div>
                                    <CardContent className="p-5 space-y-3">
                                        {requiredDocs.map(req => {
                                            const ups = documents.filter((d: ComplianceDocument) => d.type === req.type);
                                            const status = ups.length === 0 ? 'missing' : ups.some((d: ComplianceDocument) => d.verified) ? 'verified' : ups.some((d: ComplianceDocument) => d.reviewStatus === 'rejected') ? 'rejected' : 'pending';
                                            return (
                                                <div key={req.type} className={cn('rounded-xl border-2 overflow-hidden transition-all',
                                                    status === 'verified' ? 'border-emerald-500/20 bg-emerald-500/3' :
                                                        status === 'rejected' ? 'border-red-500/20 bg-red-500/3' :
                                                            status === 'pending' ? 'border-amber-500/20 bg-amber-500/3' : 'border-border/20')}>
                                                    <div className="flex items-center gap-3 p-4">
                                                        <div className={cn('size-10 rounded-xl flex items-center justify-center shrink-0',
                                                            status === 'verified' ? 'bg-emerald-500/10' : status === 'rejected' ? 'bg-red-500/10' :
                                                                status === 'pending' ? 'bg-amber-500/10' : 'bg-muted/30')}>
                                                            {status === 'verified' ? <CheckCircle2 className="size-5 text-emerald-500" /> :
                                                                status === 'rejected' ? <Ban className="size-5 text-red-500" /> :
                                                                    status === 'pending' ? <Clock className="size-5 text-amber-500" /> :
                                                                        <FileText className="size-5 text-muted-foreground" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="text-sm font-bold">{req.label}</h3>
                                                                <Badge className={cn('text-[9px] h-4 px-1.5 border',
                                                                    status === 'verified' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                                        status === 'pending' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                                                            status === 'rejected' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                                                                                'bg-destructive/10 text-destructive border-destructive/20')}>
                                                                    {status === 'verified' ? 'VERIFIED' : status === 'pending' ? 'REVIEWING' : status === 'rejected' ? 'REJECTED' : 'MISSING'}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-[11px] text-muted-foreground mt-0.5">{req.description}</p>
                                                        </div>
                                                    </div>
                                                    {ups.length > 0 && (
                                                        <div className="border-t border-border/10 divide-y divide-border/5">
                                                            {ups.map((doc: ComplianceDocument) => {
                                                                const isImg = isImageUrl(doc.fileUrl);
                                                                const ex = doc.expiresAt ? getExpStatus(doc.expiresAt) : null;
                                                                return (
                                                                    <div key={doc._id} className="p-4 space-y-3">
                                                                        <div className="flex items-start gap-3">
                                                                            <FileText className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-xs font-bold truncate">{doc.label || doc.fileName}</p>
                                                                                <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[10px] text-muted-foreground">
                                                                                    <span>{fmtSize(doc.fileSize)}</span>
                                                                                    {doc.uploadedAt && <span>Uploaded {fmtDate(doc.uploadedAt)}</span>}
                                                                                    {doc.verifiedAt && <span className="text-emerald-500 font-semibold">Verified {fmtDate(doc.verifiedAt)}</span>}
                                                                                    {ex && <span className={cn('font-semibold', ex.c)}>{ex.l}</span>}
                                                                                </div>
                                                                                {doc.reviewStatus === 'rejected' && doc.rejectionReason && (
                                                                                    <p className="text-[10px] text-red-500 mt-1 italic">Reason: {doc.rejectionReason}</p>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-1 shrink-0">
                                                                                {doc.fileUrl && (
                                                                                    <Button size="icon" variant="ghost" className="size-7" onClick={() => setPreviewDoc(doc)}>
                                                                                        <Eye className="size-3.5" />
                                                                                    </Button>
                                                                                )}
                                                                                {!doc.verified && doc.reviewStatus !== 'rejected' && (
                                                                                    <>
                                                                                        <Button size="icon" variant="ghost"
                                                                                            className="size-7 text-emerald-500 hover:bg-emerald-500/10"
                                                                                            onClick={() => handleVerify(doc._id)} disabled={actionLoading === doc._id}>
                                                                                            {actionLoading === doc._id ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                                                                                        </Button>
                                                                                        <Button size="icon" variant="ghost"
                                                                                            className="size-7 text-red-500 hover:bg-red-500/10"
                                                                                            onClick={() => { setRejectDocId(doc._id); setRejectReason(''); }} disabled={actionLoading === doc._id}>
                                                                                            <XCircle className="size-3.5" />
                                                                                        </Button>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        {isImg && doc.fileUrl && (
                                                                            <div className="rounded-xl overflow-hidden border border-border/20 bg-muted/10 cursor-pointer" onClick={() => setPreviewDoc(doc)}>
                                                                                <img src={resolveImageUrl(doc.fileUrl)} alt={doc.label || doc.fileName} className="w-full max-h-48 object-contain" loading="lazy" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {optionalDocs.length > 0 && (
                                            <>
                                                <div className="flex items-center gap-3 pt-4"><div className="h-px flex-1 bg-border/15" /><span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Optional</span><div className="h-px flex-1 bg-border/15" /></div>
                                                {optionalDocs.map(req => {
                                                    const ups = documents.filter((d: ComplianceDocument) => d.type === req.type);
                                                    const status = ups.length === 0 ? 'missing' : ups.some((d: ComplianceDocument) => d.verified) ? 'verified' : 'pending';
                                                    return (
                                                        <div key={req.type} className={cn('rounded-xl border-2 p-4 flex items-center gap-3 transition-all',
                                                            status === 'verified' ? 'border-emerald-500/20 bg-emerald-500/3' : status === 'pending' ? 'border-amber-500/20 bg-amber-500/3' : 'border-border/15')}>
                                                            <div className="size-9 rounded-lg bg-muted/20 flex items-center justify-center shrink-0"><FileText className="size-4 text-muted-foreground" /></div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2"><h3 className="text-sm font-bold">{req.label}</h3><Badge variant="outline" className="text-[9px] h-4">Optional</Badge></div>
                                                                {ups.length > 0 && <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                                    {ups.map((doc: ComplianceDocument) => (
                                                                        <Badge key={doc._id} variant="outline" className="gap-1 text-[10px] cursor-pointer hover:bg-muted/30" onClick={() => setPreviewDoc(doc)}>
                                                                            {doc.fileName} {doc.verified && <CheckCircle2 className="size-2.5 text-emerald-500" />}
                                                                        </Badge>
                                                                    ))}
                                                                </div>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {tab === 'compliance' && (
                            <div className="space-y-5">
                                <Card className="border-border/20 shadow-xl overflow-hidden rounded-2xl">
                                    <div className="h-1 w-full bg-linear-to-r from-emerald-600 to-teal-500" />
                                    <div className="px-5 pt-5 pb-3 flex items-center gap-3 border-b border-border/10">
                                        <div className="size-10 rounded-xl bg-linear-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg"><CreditCard className="size-5" /></div>
                                        <div className="flex-1"><h3 className="text-sm font-black">License & Insurance Details</h3></div>
                                        {profile.isComplianceExpired && <Badge variant="destructive" className="gap-1 text-xs"><AlertTriangle className="size-3" /> Expired Items</Badge>}
                                    </div>
                                    <CardContent className="p-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                            <div className="space-y-3 p-4 rounded-xl border border-border/15 bg-muted/5">
                                                <div className="flex items-center gap-2 mb-2"><CreditCard className="size-4 text-blue-500" /><p className="text-xs font-black">Commercial Driver License</p></div>
                                                <Field label="License Number" value={profile.driversLicenseNumber} mono />
                                                <Field label="Issuing State" value={profile.licenseState} />
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Expiration</p>
                                                    <p className={cn('text-sm font-semibold', getExpStatus(profile.licenseExpirationDate).c)}>
                                                        {profile.licenseExpirationDate ? fmtDate(profile.licenseExpirationDate) : 'Not set'}
                                                    </p>
                                                    {profile.licenseExpirationDate && <p className={cn('text-[10px] font-bold', getExpStatus(profile.licenseExpirationDate).c)}>{getExpStatus(profile.licenseExpirationDate).l}</p>}
                                                </div>
                                            </div>

                                            <div className="space-y-3 p-4 rounded-xl border border-border/15 bg-muted/5">
                                                <div className="flex items-center gap-2 mb-2"><FileText className="size-4 text-violet-500" /><p className="text-xs font-black">DOT Medical Card</p></div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Expiration</p>
                                                    <p className={cn('text-sm font-semibold', getExpStatus(profile.medicalCardExpirationDate).c)}>
                                                        {profile.medicalCardExpirationDate ? fmtDate(profile.medicalCardExpirationDate) : 'Not set'}
                                                    </p>
                                                    {profile.medicalCardExpirationDate && <p className={cn('text-[10px] font-bold', getExpStatus(profile.medicalCardExpirationDate).c)}>{getExpStatus(profile.medicalCardExpirationDate).l}</p>}
                                                </div>
                                            </div>

                                            <div className="space-y-3 p-4 rounded-xl border border-border/15 bg-muted/5">
                                                <div className="flex items-center gap-2 mb-2"><Shield className="size-4 text-emerald-500" /><p className="text-xs font-black">Insurance</p></div>
                                                <Field label="Provider" value={profile.insuranceProvider} />
                                                <Field label="Policy Number" value={profile.insurancePolicyNumber} mono />
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Expiration</p>
                                                    <p className={cn('text-sm font-semibold', getExpStatus(profile.insuranceExpirationDate).c)}>
                                                        {profile.insuranceExpirationDate ? fmtDate(profile.insuranceExpirationDate) : 'Not set'}
                                                    </p>
                                                    {profile.insuranceExpirationDate && <p className={cn('text-[10px] font-bold', getExpStatus(profile.insuranceExpirationDate).c)}>{getExpStatus(profile.insuranceExpirationDate).l}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-border/20 shadow-xl overflow-hidden rounded-2xl">
                                    <div className="h-1 w-full bg-linear-to-r from-violet-600 to-purple-500" />
                                    <div className="px-5 pt-5 pb-3 flex items-center gap-3 border-b border-border/10">
                                        <div className="size-10 rounded-xl bg-linear-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white shadow-lg"><Fingerprint className="size-5" /></div>
                                        <div className="flex-1"><h3 className="text-sm font-black">Identity Verification</h3></div>
                                    </div>
                                    <CardContent className="p-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className={cn('flex items-center gap-3 p-4 rounded-xl border-2',
                                                profile.ssnLast4 ? 'border-emerald-500/20 bg-emerald-500/3' : 'border-border/15')}>
                                                <div className={cn('size-10 rounded-xl flex items-center justify-center', profile.ssnLast4 ? 'bg-emerald-500/10' : 'bg-muted/20')}>
                                                    {profile.ssnLast4 ? <CheckCircle2 className="size-5 text-emerald-500" /> : <Lock className="size-5 text-muted-foreground" />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold">SSN (Last 4)</p>
                                                    <p className="text-sm font-mono font-bold">{profile.ssnLast4 ? `••••${profile.ssnLast4}` : '—'}</p>
                                                </div>
                                            </div>

                                            <div className={cn('flex items-center gap-3 p-4 rounded-xl border-2',
                                                profile.backgroundCheckConsent ? 'border-emerald-500/20 bg-emerald-500/3' : 'border-border/15')}>
                                                <div className={cn('size-10 rounded-xl flex items-center justify-center', profile.backgroundCheckConsent ? 'bg-emerald-500/10' : 'bg-muted/20')}>
                                                    {profile.backgroundCheckConsent ? <CheckCircle2 className="size-5 text-emerald-500" /> : <XCircle className="size-5 text-muted-foreground" />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold">Background Check</p>
                                                    <p className="text-sm font-semibold">{profile.backgroundCheckConsent ? 'Authorized' : 'Not authorized'}</p>
                                                    {profile.backgroundCheckConsentDate && <p className="text-[10px] text-muted-foreground">{fmtDate(profile.backgroundCheckConsentDate)}</p>}
                                                </div>
                                            </div>

                                            <div className={cn('flex items-center gap-3 p-4 rounded-xl border-2',
                                                profile.verificationAgreement ? 'border-emerald-500/20 bg-emerald-500/3' : 'border-border/15')}>
                                                <div className={cn('size-10 rounded-xl flex items-center justify-center', profile.verificationAgreement ? 'bg-emerald-500/10' : 'bg-muted/20')}>
                                                    {profile.verificationAgreement ? <CheckCircle2 className="size-5 text-emerald-500" /> : <Scale className="size-5 text-muted-foreground" />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold">Agreement</p>
                                                    <p className="text-sm font-semibold">{profile.verificationAgreement ? 'Accepted' : 'Not accepted'}</p>
                                                    {profile.verificationAgreementDate && <p className="text-[10px] text-muted-foreground">{fmtDate(profile.verificationAgreementDate)}</p>}
                                                </div>
                                            </div>

                                            <div className={cn('flex items-center gap-3 p-4 rounded-xl border-2',
                                                profile.verificationStatus === 'verified' ? 'border-emerald-500/20 bg-emerald-500/3' :
                                                    profile.verificationStatus === 'under_review' ? 'border-amber-500/20 bg-amber-500/3' : 'border-border/15')}>
                                                <div className={cn('size-10 rounded-xl flex items-center justify-center',
                                                    profile.verificationStatus === 'verified' ? 'bg-emerald-500/10' :
                                                        profile.verificationStatus === 'under_review' ? 'bg-amber-500/10' : 'bg-muted/20')}>
                                                    {profile.verificationStatus === 'verified' ? <BadgeCheck className="size-5 text-emerald-500" /> :
                                                        profile.verificationStatus === 'under_review' ? <Clock className="size-5 text-amber-500" /> :
                                                            <ShieldAlert className="size-5 text-muted-foreground" />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold">Status</p>
                                                    <p className={cn('text-sm font-semibold capitalize',
                                                        profile.verificationStatus === 'verified' ? 'text-emerald-600 dark:text-emerald-400' :
                                                            profile.verificationStatus === 'under_review' ? 'text-amber-600 dark:text-amber-400' : '')}>
                                                        {(profile.verificationStatus || 'not_started').replace(/_/g, ' ')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        {profile.verificationNotes && (
                                            <div className="mt-4 p-3 rounded-xl border border-border/15 bg-muted/5">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Admin Notes</p>
                                                <p className="text-xs text-muted-foreground leading-relaxed">{profile.verificationNotes}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>

            </motion.div>

            <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="p-5 pb-3 shrink-0">
                        <DialogTitle className="flex items-center gap-2 text-sm font-black">
                            <FileText className="size-4" /> {previewDoc?.label || previewDoc?.fileName}
                        </DialogTitle>
                        <DialogDescription className="flex items-center gap-3 text-[11px]">
                            <span>{fmtSize(previewDoc?.fileSize)}</span>
                            {previewDoc?.uploadedAt && <span>Uploaded {fmtDate(previewDoc.uploadedAt)}</span>}
                            <Badge className={cn('text-[9px] h-4 px-1.5',
                                previewDoc?.verified ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                    previewDoc?.reviewStatus === 'rejected' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                                        'bg-amber-500/10 text-amber-600 border-amber-500/20')}>
                                {previewDoc?.verified ? 'Verified' : previewDoc?.reviewStatus === 'rejected' ? 'Rejected' : 'Pending'}
                            </Badge>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto px-5 pb-5">
                        {previewDoc?.fileUrl && isImageUrl(previewDoc.fileUrl) ? (
                            <img src={resolveImageUrl(previewDoc.fileUrl)} alt={previewDoc.label || previewDoc.fileName} className="w-full rounded-xl border border-border/20" />
                        ) : previewDoc?.fileUrl && previewDoc.mimeType === 'application/pdf' ? (
                            <iframe src={resolveImageUrl(previewDoc.fileUrl)} className="w-full h-[60vh] rounded-xl border border-border/20" title={previewDoc.label} />
                        ) : previewDoc?.fileUrl ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-4">
                                <FileText className="size-16 text-muted-foreground/20" />
                                <p className="text-sm text-muted-foreground">Preview not available for this file type</p>
                                <Button asChild variant="outline" className="gap-2"><a href={resolveImageUrl(previewDoc.fileUrl)} target="_blank" rel="noopener noreferrer"><Download className="size-4" /> Download File</a></Button>
                            </div>
                        ) : null}
                    </div>
                    {previewDoc && !previewDoc.verified && previewDoc.reviewStatus !== 'rejected' && (
                        <div className="border-t border-border/20 p-4 flex items-center justify-end gap-2 shrink-0">
                            <Button variant="outline" className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                onClick={() => { setRejectDocId(previewDoc._id); setPreviewDoc(null); }}>
                                <XCircle className="size-4" /> Reject
                            </Button>
                            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                                onClick={() => { handleVerify(previewDoc._id); setPreviewDoc(null); }}
                                disabled={actionLoading === previewDoc._id}>
                                {actionLoading === previewDoc._id ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Verify
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!rejectDocId} onOpenChange={() => setRejectDocId(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive"><XCircle className="size-5" /> Reject Document</DialogTitle>
                        <DialogDescription>The driver will be notified and asked to re-upload.</DialogDescription>
                    </DialogHeader>
                    <div className="py-2 space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rejection Reason</label>
                        <Input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                            placeholder="e.g. Document is blurry, expired, wrong type..." maxLength={500} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDocId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => rejectDocId && handleReject(rejectDocId)}
                            disabled={!rejectReason.trim() || rejectReason.trim().length < 3 || !!actionLoading} className="gap-2">
                            {actionLoading ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />} Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
