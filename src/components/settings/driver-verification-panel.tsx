'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { apiClient } from '@/lib/api-client';
import { DriverProfile, ComplianceDocument } from '@/types/driver-profile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Loader2, CheckCircle2, XCircle, Clock, Eye, FileText, ShieldCheck,
    ShieldAlert, ChevronRight, ChevronDown, Search, Ban, Fingerprint,
    UserCheck, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OrgDriver {
    _id: string;
    userId: string;
    truckMake?: string;
    truckModel?: string;
    operationalStatus?: string;
    profileCompletionScore?: number;
    isComplianceExpired?: boolean;
}

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Denver' }) : '—';
const fmtSize = (b?: number) => !b ? '' : b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

export function DriverVerificationPanel() {
    const { getToken } = useAuth();
    const [drivers, setDrivers] = useState<OrgDriver[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedDriver, setExpandedDriver] = useState<string | null>(null);
    const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectDocId, setRejectDocId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [search, setSearch] = useState('');

    const fetchDrivers = useCallback(async () => {
        try {
            const token = await getToken();
            const res = await apiClient.get('/api/driver-profile/org', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setDrivers(res.data?.data || []);
        } catch {
            toast.error('Failed to load drivers');
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

    const loadDriverProfile = async (userId: string) => {
        if (expandedDriver === userId) {
            setExpandedDriver(null);
            setDriverProfile(null);
            return;
        }
        setExpandedDriver(userId);
        setLoadingProfile(true);
        try {
            const token = await getToken();
            const res = await apiClient.get(`/api/driver-profile/org/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setDriverProfile(res.data?.data || null);
        } catch {
            toast.error('Failed to load driver profile');
            setExpandedDriver(null);
        } finally {
            setLoadingProfile(false);
        }
    };

    const handleVerify = async (driverId: string, docId: string) => {
        setActionLoading(docId);
        try {
            const token = await getToken();
            const res = await apiClient.patch(
                `/api/driver-profile/org/${driverId}/documents/${docId}/verify`,
                { verified: true },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data?.data) setDriverProfile(res.data.data);
            toast.success('Document verified');
        } catch {
            toast.error('Failed to verify document');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (driverId: string, docId: string) => {
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
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data?.data) setDriverProfile(res.data.data);
            toast.success('Document rejected');
            setRejectDocId(null);
            setRejectReason('');
        } catch {
            toast.error('Failed to reject document');
        } finally {
            setActionLoading(null);
        }
    };

    const pendingDocCount = (profile: DriverProfile): number =>
        (profile.documents || []).filter((d: ComplianceDocument) => !d.verified && d.reviewStatus !== 'rejected').length;

    const filtered = drivers.filter(d => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (d.truckMake?.toLowerCase().includes(q)) ||
            (d.truckModel?.toLowerCase().includes(q)) ||
            d.userId.toLowerCase().includes(q);
    });

    if (loading) return (
        <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">Document Verification</h3>
                    <Badge variant="outline" className="text-[10px] h-5">{drivers.length} drivers</Badge>
                </div>
                <div className="relative max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search drivers..."
                        className="h-8 pl-8 text-xs"
                    />
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <ShieldCheck className="size-8 mb-2 opacity-50" />
                    <p className="text-sm font-medium">No drivers found</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(driver => {
                        const isExpanded = expandedDriver === driver.userId;
                        const docs = driverProfile?.documents || [];
                        const pendingDocs = isExpanded ? docs.filter((d: ComplianceDocument) => !d.verified && d.reviewStatus !== 'rejected') : [];
                        const verifiedDocs = isExpanded ? docs.filter((d: ComplianceDocument) => d.verified) : [];

                        return (
                            <div key={driver._id} className={cn(
                                'rounded-xl border-2 overflow-hidden transition-all',
                                isExpanded ? 'border-primary/20 shadow-md' : 'border-border/30 hover:border-border/50'
                            )}>
                                <button
                                    type="button"
                                    onClick={() => loadDriverProfile(driver.userId)}
                                    className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-muted/20 transition-colors"
                                >
                                    <div className={cn(
                                        'size-10 rounded-xl flex items-center justify-center shrink-0',
                                        driver.isComplianceExpired ? 'bg-red-500/10' : 'bg-primary/10'
                                    )}>
                                        {driver.isComplianceExpired ? <ShieldAlert className="size-5 text-red-500" /> :
                                            <UserCheck className="size-5 text-primary" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold truncate">
                                                {driver.truckMake && driver.truckModel ? `${driver.truckMake} ${driver.truckModel}` : `Driver ${driver.userId.slice(-6)}`}
                                            </span>
                                            {driver.isComplianceExpired && (
                                                <Badge variant="destructive" className="text-[9px] h-4 gap-0.5">
                                                    <AlertTriangle className="size-2.5" /> Expired
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-[10px] text-muted-foreground">
                                                Profile: {driver.profileCompletionScore || 0}%
                                            </span>
                                            <span className={cn(
                                                'text-[10px] font-semibold capitalize',
                                                driver.operationalStatus === 'active' ? 'text-emerald-500' :
                                                    driver.operationalStatus === 'maintenance' ? 'text-amber-500' : 'text-muted-foreground'
                                            )}>
                                                {driver.operationalStatus || 'Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                    {isExpanded ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                                </button>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="border-t border-border/20 p-4 space-y-3">
                                                {loadingProfile ? (
                                                    <div className="flex items-center justify-center py-8">
                                                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                                                    </div>
                                                ) : driverProfile ? (
                                                    <>
                                                        <div className="grid grid-cols-3 gap-2 text-center">
                                                            <div className="p-2.5 rounded-lg bg-muted/20">
                                                                <p className="text-lg font-black text-primary">{verifiedDocs.length}</p>
                                                                <p className="text-[10px] text-muted-foreground font-bold uppercase">Verified</p>
                                                            </div>
                                                            <div className="p-2.5 rounded-lg bg-muted/20">
                                                                <p className="text-lg font-black text-amber-500">{pendingDocs.length}</p>
                                                                <p className="text-[10px] text-muted-foreground font-bold uppercase">Pending</p>
                                                            </div>
                                                            <div className="p-2.5 rounded-lg bg-muted/20">
                                                                <p className="text-lg font-black">{docs.length}</p>
                                                                <p className="text-[10px] text-muted-foreground font-bold uppercase">Total</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 border border-border/20">
                                                            <Fingerprint className="size-4 text-muted-foreground" />
                                                            <div className="flex-1 text-xs">
                                                                <span className="font-bold">Identity: </span>
                                                                <span className={driverProfile.ssnLast4 ? 'text-emerald-500 font-semibold' : 'text-muted-foreground'}>
                                                                    {driverProfile.ssnLast4 ? `SSN ••••${driverProfile.ssnLast4}` : 'Not submitted'}
                                                                </span>
                                                                <span className="mx-2">·</span>
                                                                <span className="font-bold">BG Check: </span>
                                                                <span className={driverProfile.backgroundCheckConsent ? 'text-emerald-500 font-semibold' : 'text-muted-foreground'}>
                                                                    {driverProfile.backgroundCheckConsent ? 'Authorized' : 'Not authorized'}
                                                                </span>
                                                                <span className="mx-2">·</span>
                                                                <span className="font-bold">Status: </span>
                                                                <span className={cn(
                                                                    'font-semibold capitalize',
                                                                    driverProfile.verificationStatus === 'verified' ? 'text-emerald-500' :
                                                                        driverProfile.verificationStatus === 'under_review' ? 'text-amber-500' : 'text-muted-foreground'
                                                                )}>
                                                                    {(driverProfile.verificationStatus || 'not_started').replace(/_/g, ' ')}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {docs.length === 0 ? (
                                                            <p className="text-xs text-muted-foreground text-center py-4">No documents uploaded yet</p>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {docs.map((doc: ComplianceDocument) => (
                                                                    <div key={doc._id} className={cn(
                                                                        'flex items-start gap-3 p-3 rounded-xl border transition-all',
                                                                        doc.verified ? 'border-emerald-500/20 bg-emerald-500/3' :
                                                                            doc.reviewStatus === 'rejected' ? 'border-red-500/20 bg-red-500/3' :
                                                                                'border-border/30'
                                                                    )}>
                                                                        <div className={cn(
                                                                            'size-9 rounded-lg flex items-center justify-center shrink-0',
                                                                            doc.verified ? 'bg-emerald-500/10' :
                                                                                doc.reviewStatus === 'rejected' ? 'bg-red-500/10' : 'bg-amber-500/10'
                                                                        )}>
                                                                            {doc.verified ? <CheckCircle2 className="size-4 text-emerald-500" /> :
                                                                                doc.reviewStatus === 'rejected' ? <Ban className="size-4 text-red-500" /> :
                                                                                    <Clock className="size-4 text-amber-500" />}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                                <span className="text-xs font-bold">{doc.label || doc.type}</span>
                                                                                <Badge className={cn(
                                                                                    'text-[9px] h-4 px-1.5 border',
                                                                                    doc.verified ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                                                        doc.reviewStatus === 'rejected' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                                                                                            'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                                                )}>
                                                                                    {doc.verified ? 'Verified' : doc.reviewStatus === 'rejected' ? 'Rejected' : 'Pending'}
                                                                                </Badge>
                                                                                <Badge variant="outline" className="text-[9px] h-4 capitalize">{doc.type.replace(/_/g, ' ')}</Badge>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground flex-wrap">
                                                                                <span>{doc.fileName}</span>
                                                                                <span>{fmtSize(doc.fileSize)}</span>
                                                                                {doc.uploadedAt && <span>Uploaded {fmtDate(doc.uploadedAt)}</span>}
                                                                                {doc.verifiedAt && <span className="text-emerald-500 font-semibold">Verified {fmtDate(doc.verifiedAt)}</span>}
                                                                                {doc.expiresAt && <span className={new Date(doc.expiresAt) < new Date() ? 'text-red-500 font-semibold' : ''}>Exp {fmtDate(doc.expiresAt)}</span>}
                                                                            </div>
                                                                            {doc.reviewStatus === 'rejected' && doc.rejectionReason && (
                                                                                <p className="text-[10px] text-red-500 mt-1 italic">Reason: {doc.rejectionReason}</p>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-1 shrink-0">
                                                                            {doc.fileUrl && (
                                                                                <Button size="icon" variant="ghost" className="size-7" asChild>
                                                                                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"><Eye className="size-3.5" /></a>
                                                                                </Button>
                                                                            )}
                                                                            {!doc.verified && doc.reviewStatus !== 'rejected' && (
                                                                                <>
                                                                                    <Button
                                                                                        size="icon"
                                                                                        variant="ghost"
                                                                                        className="size-7 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-600"
                                                                                        onClick={() => handleVerify(driver.userId, doc._id)}
                                                                                        disabled={actionLoading === doc._id}
                                                                                    >
                                                                                        {actionLoading === doc._id ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                                                                                    </Button>
                                                                                    <Button
                                                                                        size="icon"
                                                                                        variant="ghost"
                                                                                        className="size-7 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                                                                                        onClick={() => { setRejectDocId(doc._id); setRejectReason(''); }}
                                                                                        disabled={actionLoading === doc._id}
                                                                                    >
                                                                                        <XCircle className="size-3.5" />
                                                                                    </Button>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : null}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            )}

            <Dialog open={!!rejectDocId} onOpenChange={() => setRejectDocId(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <XCircle className="size-5" /> Reject Document
                        </DialogTitle>
                        <DialogDescription>The driver will be notified and asked to re-upload.</DialogDescription>
                    </DialogHeader>
                    <div className="py-2 space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rejection Reason</label>
                        <Input
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="e.g. Document is blurry, expired, wrong type..."
                            maxLength={500}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDocId(null)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={() => rejectDocId && expandedDriver && handleReject(expandedDriver, rejectDocId)}
                            disabled={!rejectReason.trim() || rejectReason.trim().length < 3 || !!actionLoading}
                            className="gap-2"
                        >
                            {actionLoading ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
