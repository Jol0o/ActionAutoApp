'use client';

import * as React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
    Truck, Package, Search, Loader2, ArrowRight, AlertTriangle, RefreshCw,
    Filter, ChevronDown, DollarSign, Clock, Map as MapIcon, List, XCircle,
    Timer, ArrowUpDown, TrendingUp, CalendarClock, MapPin, Calendar,
    ArrowLeft, Zap, Car, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { trailerTypeOptions } from '@/components/driver-profile/driver-profile-constants';
import { initializeSocket, getSocket } from '@/lib/socket.client';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface AvailableLoad {
    _id: string;
    __docType?: 'shipment' | 'load';
    origin: string;
    destination: string;
    trackingNumber?: string;
    status: string;
    requestedPickupDate?: string;
    scheduledPickup?: string;
    scheduledDelivery?: string;
    desiredDeliveryDate?: string;
    trailerTypeRequired?: string;
    vehicleCount?: number;
    carrierPayAmount?: number;
    myRequestStatus?: 'pending' | 'approved' | 'rejected' | null;
    myRequestedAt?: string | null;
    vehicles?: { trailerType: string; year: string; make: string; model: string; vin: string; color: string; condition: string }[];
    preservedQuoteData?: {
        vehicleName?: string; vehicleImage?: string; rate?: number; miles?: number;
        firstName?: string; lastName?: string; enclosedTrailer?: boolean; units?: number;
    };
    createdAt: string;
}

const trailerLabel = (val?: string) => trailerTypeOptions.find(t => t.value === val)?.label || val || 'Any';
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Denver' }) : 'TBD';
const timeAgo = (d: string) => { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`; return `${Math.floor(h / 24)}d ago`; };
const extractErr = (e: any, fb: string) => e?.response?.data?.message || e?.message || fb;

type ViewMode = 'list' | 'map';
type SortMode = 'newest' | 'pay-high' | 'pay-low' | 'pickup-soon';

export default function AvailableLoadsPage() {
    const { getToken } = useAuth();
    const [loads, setLoads] = React.useState<AvailableLoad[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState('');
    const [trailerFilter, setTrailerFilter] = React.useState('all');
    const [sortBy, setSortBy] = React.useState<SortMode>('newest');
    const [requestTarget, setRequestTarget] = React.useState<AvailableLoad | null>(null);
    const [requesting, setRequesting] = React.useState(false);
    const [refreshing, setRefreshing] = React.useState(false);
    const [view, setView] = React.useState<ViewMode>('list');
    const mapRef = React.useRef<HTMLDivElement>(null);
    const mapInst = React.useRef<any>(null);
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    const fetchLoads = React.useCallback(async () => {
        try {
            const token = await getToken();
            const res = await apiClient.get('/api/driver-tracking/available-loads', { headers: { Authorization: `Bearer ${token}` } });
            setLoads(res.data?.data || []);
        } catch (err: any) { toast.error(extractErr(err, 'Failed to load available loads')); }
        finally { setLoading(false); setRefreshing(false); }
    }, [getToken]);

    React.useEffect(() => {
        fetchLoads();
        const poll = setInterval(fetchLoads, 30000);
        return () => clearInterval(poll);
    }, [fetchLoads]);

    React.useEffect(() => {
        let mounted = true;
        const setup = async () => {
            const token = await getToken();
            if (!token || !mounted) return;
            const sock = initializeSocket(token);
            const refresh = () => { if (mounted) fetchLoads(); };
            sock.on('driver:loads_updated', refresh);
            sock.on('driver:load_requested', refresh);
        };
        setup();
        return () => { mounted = false; const s = getSocket(); if (s) { s.off('driver:loads_updated'); s.off('driver:load_requested'); } };
    }, [getToken, fetchLoads]);

    React.useEffect(() => {
        if (view !== 'map' || !mapboxToken || !mapRef.current) return;
        let cancelled = false;
        const init = async () => {
            const mapboxgl = (await import('mapbox-gl')).default;
            // @ts-ignore
            await import('mapbox-gl/dist/mapbox-gl.css');
            if (cancelled || mapInst.current) return;
            mapInst.current = new mapboxgl.Map({ container: mapRef.current!, style: 'mapbox://styles/mapbox/light-v11', center: [-98.58, 39.83], zoom: 3.5, accessToken: mapboxToken });
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(pos => {
                    mapInst.current?.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 8, duration: 1500 });
                    new mapboxgl.Marker({ color: '#3b82f6' }).setLngLat([pos.coords.longitude, pos.coords.latitude]).setPopup(new mapboxgl.Popup().setHTML('<strong>Your Location</strong>')).addTo(mapInst.current!);
                }, () => { }, { enableHighAccuracy: false, timeout: 5000 });
            }
        };
        init();
        return () => { cancelled = true; mapInst.current?.remove(); mapInst.current = null; };
    }, [view, mapboxToken]);

    const handleRefresh = () => { setRefreshing(true); fetchLoads(); };

    const handleRequest = async () => {
        if (!requestTarget) return;
        setRequesting(true);
        try {
            const token = await getToken();
            await apiClient.post('/api/driver-tracking/request-load',
                requestTarget.__docType === 'load' ? { loadId: requestTarget._id } : { shipmentId: requestTarget._id },
                { headers: { Authorization: `Bearer ${token}` } });
            toast.success('Load request submitted — pending dispatcher approval');
            setRequestTarget(null);
            fetchLoads();
        } catch (err: any) { toast.error(extractErr(err, 'Failed to request load')); }
        finally { setRequesting(false); }
    };

    const uniqueTrailers = React.useMemo(() => Array.from(new Set(loads.map(l => l.trailerTypeRequired).filter(Boolean))) as string[], [loads]);

    const filtered = React.useMemo(() => {
        const q = search.toLowerCase().trim();
        let result = loads.filter(l => {
            if (trailerFilter !== 'all' && l.trailerTypeRequired !== trailerFilter) return false;
            if (!q) return true;
            return l.origin?.toLowerCase().includes(q) || l.destination?.toLowerCase().includes(q) || l.trackingNumber?.toLowerCase().includes(q) || l.preservedQuoteData?.vehicleName?.toLowerCase().includes(q);
        });
        return [...result].sort((a, b) => {
            switch (sortBy) {
                case 'pay-high': return (b.carrierPayAmount || b.preservedQuoteData?.rate || 0) - (a.carrierPayAmount || a.preservedQuoteData?.rate || 0);
                case 'pay-low': return (a.carrierPayAmount || a.preservedQuoteData?.rate || 0) - (b.carrierPayAmount || b.preservedQuoteData?.rate || 0);
                case 'pickup-soon': return new Date(a.scheduledPickup || a.requestedPickupDate || a.createdAt).getTime() - new Date(b.scheduledPickup || b.requestedPickupDate || b.createdAt).getTime();
                default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        });
    }, [loads, search, trailerFilter, sortBy]);

    const pendingCount = loads.filter(l => l.myRequestStatus === 'pending').length;

    const sortOpts: { key: SortMode; label: string; icon: React.ElementType }[] = [
        { key: 'newest', label: 'Newest First', icon: Clock },
        { key: 'pay-high', label: 'Highest Pay', icon: TrendingUp },
        { key: 'pay-low', label: 'Lowest Pay', icon: DollarSign },
        { key: 'pickup-soon', label: 'Pickup Soonest', icon: CalendarClock },
    ];

    return (
        <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">

                <div className="relative overflow-hidden rounded-3xl shadow-2xl">
                    <div className="absolute inset-0 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950" />
                    <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/8 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
                    <div className="absolute bottom-0 left-0 w-56 h-56 bg-emerald-500/6 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
                    <div className="relative p-5 sm:p-7">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Link href="/driver" className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
                                    <ArrowLeft className="size-4.5 text-white/80" />
                                </Link>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Available Loads</h1>
                                    <p className="text-sm text-white/40 mt-0.5">
                                        {loading ? 'Loading...' : `${loads.length} load${loads.length !== 1 ? 's' : ''} on the board`}
                                        {pendingCount > 0 && <span className="ml-1.5 text-amber-400 font-semibold"> · {pendingCount} pending</span>}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/20">
                                    <Zap className="size-3 text-emerald-400" /><span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
                                </div>
                                <div className="flex rounded-lg border border-white/10 p-0.5 bg-white/5">
                                    <button onClick={() => setView('list')} className={cn('px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors', view === 'list' ? 'bg-white/15 text-white shadow-sm' : 'text-white/40 hover:text-white/70')}>
                                        <List className="size-3.5 inline mr-1" />List
                                    </button>
                                    <button onClick={() => setView('map')} className={cn('px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors', view === 'map' ? 'bg-white/15 text-white shadow-sm' : 'text-white/40 hover:text-white/70')}>
                                        <MapIcon className="size-3.5 inline mr-1" />Map
                                    </button>
                                </div>
                                <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-1.5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10">
                                    <RefreshCw className={cn('size-3.5', refreshing && 'animate-spin')} />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input placeholder="Search by city, tracking #, or vehicle..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl bg-muted/30 border-border/20" />
                    </div>
                    <div className="flex gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-1.5 h-10 shrink-0 rounded-xl border-border/20">
                                    <ArrowUpDown className="size-3.5" />{sortOpts.find(s => s.key === sortBy)?.label}<ChevronDown className="size-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider">Sort By</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {sortOpts.map(o => <DropdownMenuItem key={o.key} onClick={() => setSortBy(o.key)} className={sortBy === o.key ? 'bg-accent' : ''}><span className="flex items-center gap-2"><o.icon className="size-3.5" />{o.label}</span></DropdownMenuItem>)}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {uniqueTrailers.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-1.5 h-10 shrink-0 rounded-xl border-border/20">
                                        <Filter className="size-3.5" />{trailerFilter === 'all' ? 'All Trailers' : trailerLabel(trailerFilter)}<ChevronDown className="size-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setTrailerFilter('all')}>All Trailers</DropdownMenuItem>
                                    {uniqueTrailers.map(t => <DropdownMenuItem key={t} onClick={() => setTrailerFilter(t)}>{trailerLabel(t)}</DropdownMenuItem>)}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>

                {view === 'map' && (
                    <Card className="overflow-hidden border-border/20 rounded-2xl">
                        <CardContent className="p-0">
                            {mapboxToken ? <div ref={mapRef} className="h-[340px] w-full" /> : (
                                <div className="h-[340px] flex items-center justify-center bg-muted/30">
                                    <div className="text-center space-y-2"><MapIcon className="size-10 text-muted-foreground/30 mx-auto" /><p className="text-xs text-muted-foreground">Map requires NEXT_PUBLIC_MAPBOX_TOKEN</p></div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="relative"><div className="size-16 rounded-full border-4 border-blue-500/20 animate-pulse" /><Loader2 className="size-8 animate-spin text-blue-500 absolute inset-0 m-auto" /></div>
                        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Scanning Load Board</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <Card className="border-border/20 rounded-2xl">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <div className="size-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4"><Package className="size-8 text-muted-foreground/30" /></div>
                            <p className="text-sm font-bold">{search || trailerFilter !== 'all' ? 'No loads match your filters' : 'No loads posted to the board right now'}</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">Check back later or adjust your filters</p>
                        </CardContent>
                    </Card>
                ) : (
                    <AnimatePresence mode="popLayout">
                        <div className="grid gap-3">
                            {filtered.map((load, i) => (
                                <motion.div key={load._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.03 }}>
                                    <LoadCard load={load} onRequest={() => setRequestTarget(load)} />
                                </motion.div>
                            ))}
                        </div>
                    </AnimatePresence>
                )}
            </motion.div>

            <Dialog open={!!requestTarget} onOpenChange={() => setRequestTarget(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Truck className="size-5 text-primary" />Request Load Assignment</DialogTitle>
                        <DialogDescription>The dispatcher will review and approve your request.</DialogDescription>
                    </DialogHeader>
                    {requestTarget && (
                        <div className="rounded-xl border p-3 space-y-2 bg-muted/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <Badge variant="outline" className="text-[10px]">{requestTarget.trackingNumber || requestTarget._id.slice(-8)}</Badge>
                                    {requestTarget.trailerTypeRequired && <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{trailerLabel(requestTarget.trailerTypeRequired)}</Badge>}
                                </div>
                                {requestTarget.carrierPayAmount != null && requestTarget.carrierPayAmount > 0 && <span className="text-sm font-black text-emerald-600">${requestTarget.carrierPayAmount.toLocaleString()}</span>}
                            </div>
                            <p className="text-sm font-semibold">{requestTarget.origin} → {requestTarget.destination}</p>
                            {requestTarget.preservedQuoteData?.vehicleName && <p className="text-xs text-muted-foreground font-medium">{requestTarget.preservedQuoteData.vehicleName}</p>}
                            {requestTarget.vehicles && requestTarget.vehicles.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {requestTarget.vehicles.map((v, i) => (
                                        <Badge key={i} variant="outline" className="text-[10px] gap-1"><Car className="size-2.5" />{`${v.year} ${v.make} ${v.model}`.trim()}{v.color ? ` · ${v.color}` : ''}</Badge>
                                    ))}
                                </div>
                            )}
                            {requestTarget.vehicleCount && <p className="text-xs text-muted-foreground">{requestTarget.vehicleCount} vehicle{requestTarget.vehicleCount > 1 ? 's' : ''}</p>}
                        </div>
                    )}
                    <div className="flex items-start gap-2 rounded-xl bg-amber-500/5 border border-amber-500/15 p-3">
                        <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 dark:text-amber-400">Requesting a load does not guarantee assignment. Your compliance and equipment profile will be verified.</p>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setRequestTarget(null)} disabled={requesting}>Cancel</Button>
                        <Button onClick={handleRequest} disabled={requesting} className="gap-1.5">
                            {requesting ? <Loader2 className="size-4 animate-spin" /> : <Truck className="size-4" />}{requesting ? 'Requesting...' : 'Request Assignment'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function LoadCard({ load, onRequest }: { load: AvailableLoad; onRequest: () => void }) {
    const quote = load.preservedQuoteData;
    const isRequested = load.myRequestStatus === 'pending';
    const isRejected = load.myRequestStatus === 'rejected';
    const vehicles = load.vehicles || [];
    const vehicleName = quote?.vehicleName || (vehicles.length > 0 ? `${vehicles[0].year} ${vehicles[0].make} ${vehicles[0].model}`.trim() : undefined);

    return (
        <Card className={cn('border-border/20 hover:shadow-lg transition-all duration-200 overflow-hidden rounded-2xl group',
            isRequested ? 'border-amber-500/30 bg-amber-500/3' : isRejected ? 'border-red-500/20 opacity-75' : 'hover:border-primary/20')}>
            <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                    {quote?.vehicleImage && (
                        <div className="relative w-full sm:w-44 h-36 sm:h-auto shrink-0 overflow-hidden">
                            <img src={quote.vehicleImage} alt={vehicleName || 'Vehicle'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-linear-to-r from-transparent to-black/10 sm:bg-linear-to-t sm:from-black/20 sm:to-transparent" />
                            {isRequested && <div className="absolute top-2 left-2"><Badge className="text-[9px] bg-amber-500 text-white border-0 gap-1"><Timer className="size-2.5" />Pending</Badge></div>}
                            {isRejected && <div className="absolute top-2 left-2"><Badge className="text-[9px] bg-red-500 text-white border-0 gap-1"><XCircle className="size-2.5" />Declined</Badge></div>}
                        </div>
                    )}

                    <div className="flex-1 p-3.5 sm:p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1.5 min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <Link href={`/driver/loads/${load._id}`} className="contents">
                                        <Badge variant="outline" className="text-[10px] font-bold hover:text-primary transition-colors cursor-pointer">{load.trackingNumber || load._id.slice(-8)}</Badge>
                                    </Link>
                                    {load.trailerTypeRequired && <Badge className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20"><Truck className="size-2.5 mr-1" />{trailerLabel(load.trailerTypeRequired)}</Badge>}
                                    {load.vehicleCount && load.vehicleCount > 1 && <Badge className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/20">{load.vehicleCount} vehicles</Badge>}
                                    {isRequested && !quote?.vehicleImage && <Badge className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1"><Timer className="size-2.5" />Pending</Badge>}
                                    {isRejected && !quote?.vehicleImage && <Badge className="text-[9px] bg-red-500/10 text-red-600 border-red-500/20 gap-1"><XCircle className="size-2.5" />Declined</Badge>}
                                </div>
                                {vehicleName && <p className="text-sm font-bold truncate">{vehicleName}</p>}
                                {vehicles.length > 1 && (
                                    <div className="flex flex-wrap gap-1">
                                        {vehicles.slice(1, 4).map((v, i) => (
                                            <span key={i} className="text-[10px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">{v.year} {v.make} {v.model}</span>
                                        ))}
                                        {vehicles.length > 4 && <span className="text-[10px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">+{vehicles.length - 4} more</span>}
                                    </div>
                                )}
                            </div>
                            <div className="text-right shrink-0">
                                {load.carrierPayAmount != null && load.carrierPayAmount > 0 ? (
                                    <div>
                                        <p className="text-lg font-black text-emerald-600 flex items-center gap-0.5 justify-end"><DollarSign className="size-4" />{load.carrierPayAmount.toLocaleString()}</p>
                                        {quote?.miles && <p className="text-[10px] text-muted-foreground">${(load.carrierPayAmount / quote.miles).toFixed(2)}/mi · {quote.miles.toLocaleString()} mi</p>}
                                    </div>
                                ) : quote?.rate ? (
                                    <div><p className="text-lg font-black text-emerald-600">${quote.rate.toLocaleString()}</p>{quote.miles && <p className="text-[10px] text-muted-foreground">{quote.miles.toLocaleString()} mi</p>}</div>
                                ) : null}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                            <div className="flex items-center gap-1 text-emerald-600"><div className="size-1.5 rounded-full bg-emerald-500" /><span className="font-medium truncate max-w-[140px]">{load.origin}</span></div>
                            <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                            <div className="flex items-center gap-1 text-red-600"><MapPin className="size-3" /><span className="font-medium truncate max-w-[140px]">{load.destination}</span></div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-1"><Calendar className="size-3" />Pickup: {fmtDate(load.scheduledPickup || load.requestedPickupDate)}</span>
                                {(load.desiredDeliveryDate || load.scheduledDelivery) && <span className="flex items-center gap-1"><MapPin className="size-3" />Del: {fmtDate(load.desiredDeliveryDate || load.scheduledDelivery)}</span>}
                                <span className="flex items-center gap-1"><Clock className="size-3" />{timeAgo(load.createdAt)}</span>
                            </div>
                            {isRequested ? (
                                <Badge variant="outline" className="text-[10px] font-semibold border-amber-500/30 text-amber-600 gap-1"><Timer className="size-3" />Awaiting Approval</Badge>
                            ) : isRejected ? (
                                <Badge variant="outline" className="text-[10px] font-semibold border-red-500/30 text-red-500 gap-1"><XCircle className="size-3" />Declined</Badge>
                            ) : (
                                <Button size="sm" onClick={onRequest} className="h-7 px-3 text-[10px] font-bold gap-1 shadow-sm rounded-lg"><Truck className="size-3" />Request</Button>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
