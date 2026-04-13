'use client';

import * as React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { apiClient } from '@/lib/api-client';
import { Shipment } from '@/types/transportation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Truck, Package, Search, CheckCircle2, Clock, Loader2, ArrowRight,
  Camera, AlertCircle, ImageIcon, DollarSign, Timer, XCircle, Phone, Mail,
  FileText, User2, ChevronDown, ChevronUp, Ban, RefreshCw, CircleDot,
  Navigation2, AlertTriangle, ArrowLeft, Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { initializeSocket, getSocket } from '@/lib/socket.client';
import { cn, resolveImageUrl } from '@/lib/utils';
import Link from 'next/link';

const STATUS_THEME: Record<string, string> = {
  'Available for Pickup': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  Dispatched: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  'In-Route': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  Delivered: 'bg-green-500/10 text-green-700 border-green-500/20',
  Cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const STEPS = [
  { key: 'assigned', label: 'Assigned' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'in-route', label: 'In Route' },
  { key: 'delivered', label: 'Delivered' },
] as const;

const getStepIdx = (l: Shipment) => {
  if (l.status === 'Delivered') return 3;
  if (l.status === 'In-Route') return 2;
  if (l.driverAcceptedAt) return 1;
  return 0;
};

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Denver' }) : '';
const extractErr = (e: any, fb: string) => e?.response?.data?.message || e?.message || fb;

type Tab = 'active' | 'requests' | 'completed' | 'all';

export default function DriverLoadsPage() {
  const { getToken } = useAuth();
  const [loads, setLoads] = React.useState<Shipment[]>([]);
  const [requests, setRequests] = React.useState<Shipment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState<Tab>('active');
  const [search, setSearch] = React.useState('');
  const [acceptingId, setAcceptingId] = React.useState<string | null>(null);
  const [droppingId, setDroppingId] = React.useState<string | null>(null);
  const [startingId, setStartingId] = React.useState<string | null>(null);
  const [proofTarget, setProofTarget] = React.useState<Shipment | null>(null);
  const [dropTarget, setDropTarget] = React.useState<Shipment | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchLoads = React.useCallback(async () => {
    try {
      const token = await getToken();
      const [loadsRes, reqRes] = await Promise.all([
        apiClient.get('/api/driver-tracking/my-loads', { headers: { Authorization: `Bearer ${token}` } }),
        apiClient.get('/api/driver-tracking/my-requests', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setLoads(loadsRes.data?.data || []);
      setRequests(reqRes.data?.data || []);
    } catch (err: any) { toast.error(extractErr(err, 'Failed to fetch loads')); }
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
      sock.on('driver:load_request_updated', refresh);
      sock.on('driver:load_requested', refresh);
    };
    setup();
    return () => {
      mounted = false;
      const s = getSocket();
      if (s) {
        s.off('driver:loads_updated');
        s.off('driver:load_request_updated');
        s.off('driver:load_requested');
      }
    };
  }, [getToken, fetchLoads]);

  const handleRefresh = () => { setRefreshing(true); fetchLoads(); };

  const handleAccept = async (id: string, load: Shipment) => {
    setAcceptingId(id);
    try {
      const token = await getToken();
      const body = (load as any).__docType === 'load' ? { loadId: id } : { shipmentId: id };
      await apiClient.post('/api/driver-tracking/accept-load', body, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Load accepted — you are now dispatched');
      await fetchLoads();
    } catch (err: any) { toast.error(extractErr(err, 'Failed to accept load')); }
    finally { setAcceptingId(null); }
  };

  const handleDrop = async (id: string) => {
    setDroppingId(id);
    try {
      const token = await getToken();
      const target = loads.find(l => l._id === id);
      const body = (target as any)?.__docType === 'load' ? { loadId: id } : { shipmentId: id };
      await apiClient.post('/api/driver-tracking/drop-load', body, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Load dropped successfully');
      setDropTarget(null);
      await fetchLoads();
    } catch (err: any) { toast.error(extractErr(err, 'Failed to drop load')); }
    finally { setDroppingId(null); }
  };

  const handleStartRoute = async (id: string) => {
    setStartingId(id);
    try {
      const token = await getToken();
      const target = loads.find(l => l._id === id);
      const body = (target as any)?.__docType === 'load' ? { loadId: id } : { shipmentId: id };
      await apiClient.post('/api/driver-tracking/start-route', body, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Route started — status updated to In-Route');
      await fetchLoads();
    } catch (err: any) { toast.error(extractErr(err, 'Failed to start route')); }
    finally { setStartingId(null); }
  };

  const pending = requests.filter(r => r.myRequestStatus === 'pending');
  const rejected = requests.filter(r => r.myRequestStatus === 'rejected');
  const activeCount = loads.filter(l => l.status !== 'Delivered' && l.status !== 'Cancelled').length;
  const completedCount = loads.filter(l => l.status === 'Delivered').length;

  const filtered = React.useMemo(() => {
    let result: Shipment[] = [];
    if (tab === 'active') result = loads.filter(l => l.status !== 'Delivered' && l.status !== 'Cancelled');
    else if (tab === 'requests') result = [...pending, ...rejected];
    else if (tab === 'completed') result = loads.filter(l => l.status === 'Delivered');
    else result = loads;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l => l.trackingNumber?.toLowerCase().includes(q) || l.origin?.toLowerCase().includes(q) || l.destination?.toLowerCase().includes(q));
    }
    return result;
  }, [loads, requests, tab, search, pending, rejected]);

  const tabItems: { key: Tab; label: string; count?: number; icon: React.ElementType }[] = [
    { key: 'active', label: 'Active', count: activeCount || undefined, icon: Navigation2 },
    { key: 'requests', label: 'Requests', count: pending.length || undefined, icon: Timer },
    { key: 'completed', label: 'Completed', count: completedCount || undefined, icon: CheckCircle2 },
    { key: 'all', label: 'All', count: loads.length || undefined, icon: Package },
  ];

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">

        <div className="relative overflow-hidden rounded-3xl shadow-2xl">
          <div className="absolute inset-0 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/8 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-blue-500/6 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
          <div className="relative p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Link href="/driver" className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
                  <ArrowLeft className="size-4.5 text-white/80" />
                </Link>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">My Loads</h1>
                  <p className="text-sm text-white/40 mt-0.5">
                    {loads.length} total{activeCount > 0 && <span className="text-emerald-400 font-semibold"> · {activeCount} active</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/20">
                  <Zap className="size-3 text-emerald-400" /><span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-1.5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10">
                  <RefreshCw className={cn('size-3.5', refreshing && 'animate-spin')} /> Refresh
                </Button>
              </div>
            </div>

            <div className="flex gap-1 mt-5 bg-white/5 rounded-xl p-1 border border-white/8">
              {tabItems.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={cn('relative px-3 py-2 text-xs rounded-lg transition-all flex items-center gap-1.5',
                    tab === t.key ? 'bg-white/10 font-bold text-white shadow-sm' : 'text-white/40 hover:text-white/70')}>
                  <t.icon className="size-3" />{t.label}
                  {t.count && t.count > 0 && (
                    <span className={cn('inline-flex items-center justify-center min-w-4.5 h-4.5 text-[9px] font-bold rounded-full px-1',
                      t.key === 'requests' ? 'bg-amber-500 text-white' : 'bg-white/15 text-white/60')}>{t.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search by tracking #, city..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl bg-muted/30 border-border/20" />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative"><div className="size-16 rounded-full border-4 border-emerald-500/20 animate-pulse" /><Loader2 className="size-8 animate-spin text-emerald-500 absolute inset-0 m-auto" /></div>
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Loading Your Loads</p>
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-border/20 rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="size-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4"><Package className="size-8 text-muted-foreground/30" /></div>
              <p className="text-sm font-bold">{tab === 'active' ? 'No active loads' : tab === 'requests' ? 'No load requests' : tab === 'completed' ? 'No completed loads yet' : 'No loads found'}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">{tab === 'active' ? 'Check available loads to request new assignments.' : tab === 'requests' ? 'Request loads from the Available Loads board.' : search ? 'Try adjusting your search.' : 'Loads will appear here as they are assigned.'}</p>
              {tab === 'active' && <Button asChild className="mt-4 gap-2 rounded-xl"><Link href="/driver/available-loads"><Truck className="size-4" /> Browse Available Loads</Link></Button>}
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {filtered.map((load, i) => (
                <motion.div key={load._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.03 }}>
                  <LoadCard load={load} isRequest={tab === 'requests'} acceptingId={acceptingId} droppingId={droppingId} startingId={startingId}
                    onAccept={(id, l) => handleAccept(id, l)} onDrop={l => setDropTarget(l)} onStartRoute={handleStartRoute} onSubmitProof={() => setProofTarget(load)} />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </motion.div>

      <DropConfirmDialog shipment={dropTarget} dropping={droppingId === dropTarget?._id}
        onConfirm={() => dropTarget && handleDrop(dropTarget._id)} onCancel={() => setDropTarget(null)} />
      <SubmitProofModal shipment={proofTarget} getToken={getToken}
        onClose={() => setProofTarget(null)} onSuccess={() => { setProofTarget(null); toast.success('Proof of delivery submitted'); fetchLoads(); }} />
    </div>
  );
}

function StatusTimeline({ load }: { load: Shipment }) {
  const cur = getStepIdx(load);
  return (
    <div className="flex items-center gap-0 w-full mt-1">
      {STEPS.map((step, i) => (
        <React.Fragment key={step.key}>
          <div className="flex flex-col items-center gap-0.5">
            <div className={cn('size-5 rounded-full flex items-center justify-center border-2 transition-colors',
              i <= cur ? (i === cur ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-emerald-500/20 border-emerald-500 text-emerald-600')
                : 'bg-muted/50 border-border text-muted-foreground/40')}>
              {i < cur ? <CheckCircle2 className="size-3" /> : i === cur ? <CircleDot className="size-3" /> : <div className="size-1.5 rounded-full bg-current" />}
            </div>
            <span className={cn('text-[9px] font-semibold whitespace-nowrap', i <= cur ? 'text-emerald-600' : 'text-muted-foreground/40')}>{step.label}</span>
          </div>
          {i < STEPS.length - 1 && <div className={cn('flex-1 h-0.5 -mt-2.5 mx-0.5 rounded-full', i < cur ? 'bg-emerald-500' : 'bg-border')} />}
        </React.Fragment>
      ))}
    </div>
  );
}

function LoadCard({ load, isRequest, acceptingId, droppingId, startingId, onAccept, onDrop, onStartRoute, onSubmitProof }: {
  load: Shipment; isRequest: boolean; acceptingId: string | null; droppingId: string | null; startingId: string | null;
  onAccept: (id: string, load: Shipment) => void; onDrop: (l: Shipment) => void; onStartRoute: (id: string) => void; onSubmitProof: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const isDispatched = load.status === 'Dispatched' || load.status === 'In-Route';
  const isActive = load.status !== 'Delivered' && load.status !== 'Cancelled';
  const isPending = load.myRequestStatus === 'pending';
  const isRejected = load.myRequestStatus === 'rejected';
  const quote = (load as any).preservedQuoteData;
  const vehicleName = quote?.vehicleName;
  const vehicleImg = quote?.vehicleImage;

  return (
    <Card className={cn('overflow-hidden border-border/20 hover:shadow-lg transition-all duration-200 rounded-2xl group',
      isPending ? 'border-amber-500/30 bg-amber-500/3' : isRejected ? 'border-red-500/20 opacity-75' :
        load.status === 'In-Route' ? 'border-emerald-500/30 bg-emerald-500/3' : 'hover:border-primary/20')}>
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {vehicleImg && (
            <div className="relative w-full sm:w-44 h-36 sm:h-auto shrink-0 overflow-hidden">
              <img src={vehicleImg} alt={vehicleName || 'Vehicle'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-linear-to-r from-transparent to-black/10 sm:bg-linear-to-t sm:from-black/20 sm:to-transparent" />
            </div>
          )}
          <div className="flex-1 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/driver/loads/${load._id}`} className="text-sm font-mono font-bold hover:text-primary transition-colors">
                    {load.trackingNumber || 'No tracking #'}
                  </Link>
                  {isRequest ? (
                    isPending ? <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1"><Timer className="size-2.5" />Pending Approval</Badge>
                      : isRejected ? <Badge className="text-[10px] bg-red-500/10 text-red-600 border-red-500/20 gap-1"><XCircle className="size-2.5" />Declined</Badge> : null
                  ) : (
                    <Badge variant="outline" className={STATUS_THEME[load.status] || ''}>{load.status}</Badge>
                  )}
                  {load.carrierPayAmount != null && load.carrierPayAmount > 0 && (
                    <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-0.5"><DollarSign className="size-2.5" />{load.carrierPayAmount.toLocaleString()}</Badge>
                  )}
                </div>
                {vehicleName && <p className="text-sm font-bold text-foreground/80">{vehicleName}</p>}
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1 text-emerald-600"><div className="size-1.5 rounded-full bg-emerald-500" /><span className="truncate font-medium">{load.origin}</span></div>
                  <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                  <div className="flex items-center gap-1 text-rose-600"><div className="size-1.5 rounded-full bg-rose-500" /><span className="truncate font-medium">{load.destination}</span></div>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {load.scheduledPickup && <span className="flex items-center gap-1"><Clock className="size-3" />Pickup: {fmtDate(load.scheduledPickup)}</span>}
                  {load.scheduledDelivery && <span className="flex items-center gap-1"><Truck className="size-3" />Delivery: {fmtDate(load.scheduledDelivery)}</span>}
                  {isRequest && load.myRequestedAt && <span>Requested: {fmtDate(load.myRequestedAt)}</span>}
                </div>
              </div>

              {!isRequest && (
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {!load.driverAcceptedAt && isActive && (
                    <Button size="sm" onClick={() => onAccept(load._id, load)} disabled={acceptingId === load._id} className="rounded-lg gap-1.5">
                      {acceptingId === load._id ? <Loader2 className="size-4 animate-spin" /> : <><CheckCircle2 className="size-4" />Accept</>}
                    </Button>
                  )}
                  {load.driverAcceptedAt && load.status === 'Dispatched' && (
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 rounded-lg gap-1.5" onClick={() => onStartRoute(load._id)} disabled={startingId === load._id}>
                      {startingId === load._id ? <Loader2 className="size-4 animate-spin" /> : <><Navigation2 className="size-4" />Start Route</>}
                    </Button>
                  )}
                  {load.status === 'In-Route' && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1 animate-pulse"><Navigation2 className="size-3" />In Route</Badge>}
                  {load.status === 'In-Route' && !load.proofOfDelivery?.imageUrl && (
                    <Button size="sm" variant="outline" onClick={onSubmitProof} className="rounded-lg gap-1.5"><Camera className="size-4" />Submit Proof</Button>
                  )}
                  {load.proofOfDelivery?.imageUrl && (
                    <Badge className={cn('gap-1 text-[10px]', load.proofOfDelivery.confirmedAt ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-blue-500/10 text-blue-600 border-blue-500/20')}>
                      <ImageIcon className="size-2.5" />{load.proofOfDelivery.confirmedAt ? 'Confirmed' : 'Proof Sent'}
                    </Badge>
                  )}
                  {isActive && load.driverAcceptedAt && (
                    <Button size="sm" variant="ghost" className="text-[10px] text-muted-foreground hover:text-red-500 h-6 px-2" onClick={() => onDrop(load)} disabled={droppingId === load._id}>
                      {droppingId === load._id ? <Loader2 className="size-3 animate-spin" /> : <><Ban className="size-3 mr-1" />Drop</>}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {!isRequest && isActive && <StatusTimeline load={load} />}

            {isRejected && load.rejectionReason && (
              <div className="flex items-start gap-2 rounded-xl bg-red-500/5 border border-red-500/15 p-2.5">
                <AlertCircle className="size-3.5 text-red-500 shrink-0 mt-0.5" /><p className="text-[11px] text-red-600 dark:text-red-400">{load.rejectionReason}</p>
              </div>
            )}

            {isDispatched && (
              <button type="button" onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-[11px] text-primary font-semibold hover:underline">
                <FileText className="size-3" />{expanded ? 'Hide' : 'View'} Dispatch Details
                {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              </button>
            )}

            {expanded && isDispatched && (
              <div className="rounded-xl border border-border/20 bg-muted/20 p-3 space-y-3">
                {load.preDispatchNotes && <DetailBlock label="Dispatch Notes" text={load.preDispatchNotes} />}
                {load.specialInstructions && <DetailBlock label="Special Instructions" text={load.specialInstructions} />}
                {load.loadSpecificTerms && <DetailBlock label="Load Terms" text={load.loadSpecificTerms} />}
                {(load.originContact?.contactName || load.originContact?.phone) && <ContactBlock label="Pick-Up Contact" contact={load.originContact} />}
                {(load.destinationContact?.contactName || load.destinationContact?.phone) && <ContactBlock label="Delivery Contact" contact={load.destinationContact} />}
                {load.carrierPayAmount != null && load.carrierPayAmount > 0 && (
                  <div className="flex items-center gap-4 pt-1 border-t border-border/15">
                    <MoneyBlock label="Carrier Pay" value={load.carrierPayAmount} highlight />
                    {load.copCodAmount != null && load.copCodAmount > 0 && <MoneyBlock label="COD" value={load.copCodAmount} />}
                    {load.balanceAmount != null && <MoneyBlock label="Balance" value={load.balanceAmount} />}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailBlock({ label, text }: { label: string; text: string }) {
  return <div><p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p><p className="text-xs">{text}</p></div>;
}

function ContactBlock({ label, contact }: { label: string; contact: any }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <div className="flex flex-wrap gap-3 text-xs">
        {contact.contactName && <span className="flex items-center gap-1"><User2 className="size-3" />{contact.contactName}</span>}
        {contact.phone && <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-primary hover:underline"><Phone className="size-3" />{contact.phone}</a>}
        {contact.email && <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-primary hover:underline"><Mail className="size-3" />{contact.email}</a>}
      </div>
    </div>
  );
}

function MoneyBlock({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return <div><p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p><p className={cn('text-sm font-bold', highlight && 'text-emerald-600')}>${value.toLocaleString()}</p></div>;
}

function DropConfirmDialog({ shipment, dropping, onConfirm, onCancel }: { shipment: Shipment | null; dropping: boolean; onConfirm: () => void; onCancel: () => void }) {
  if (!shipment) return null;
  return (
    <Dialog open={!!shipment} onOpenChange={open => { if (!open) onCancel(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><AlertTriangle className="size-5 text-destructive" />Drop Load?</DialogTitle>
          <DialogDescription>This will remove you from load <span className="font-mono font-medium">{shipment.trackingNumber || shipment._id.slice(-8)}</span>. The load will go back to the available pool.</DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border p-3 bg-muted/20 space-y-1">
          <p className="text-sm font-semibold">{shipment.origin} → {shipment.destination}</p>
          {shipment.carrierPayAmount != null && shipment.carrierPayAmount > 0 && <p className="text-xs text-muted-foreground">Carrier Pay: <span className="text-emerald-600 font-bold">${shipment.carrierPayAmount.toLocaleString()}</span></p>}
        </div>
        <div className="flex items-start gap-2 rounded-xl bg-amber-500/5 border border-amber-500/15 p-3">
          <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400">Frequently dropping loads may affect your driver rating and future load assignments.</p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={dropping}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={dropping}>
            {dropping ? <><Loader2 className="size-4 mr-1.5 animate-spin" />Dropping...</> : <><Ban className="size-4 mr-1.5" />Drop Load</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SubmitProofModal({ shipment, getToken, onClose, onSuccess }: { shipment: Shipment | null; getToken: () => Promise<string | null>; onClose: () => void; onSuccess: () => void }) {
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [note, setNote] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const camRef = React.useRef<HTMLInputElement>(null);
  const galRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!shipment) { setFile(null); if (preview) URL.revokeObjectURL(preview); setPreview(null); setNote(''); setError(null); return; }
  }, [shipment]);
  React.useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { if (preview) URL.revokeObjectURL(preview); setFile(f); setPreview(URL.createObjectURL(f)); e.target.value = ''; }
  };

  const handleSubmit = async () => {
    if (!shipment || !file) return;
    setSubmitting(true); setError(null);
    try {
      const token = await getToken();
      const fd = new FormData();
      fd.append('proof', file);
      if (note.trim()) fd.append('note', note.trim());
      const proofEndpoint = (shipment as any)._type === 'load'
        ? `/api/loads/${shipment._id}/submit-proof`
        : `/api/shipments/${shipment._id}/submit-proof`;
      await apiClient.post(proofEndpoint, fd, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      onSuccess();
    } catch (err: any) { setError(extractErr(err, 'Failed to submit proof.')); }
    finally { setSubmitting(false); }
  };

  if (!shipment) return null;
  return (
    <Dialog open={!!shipment} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Camera className="size-4 text-primary" />Submit Proof of Delivery</DialogTitle>
          <DialogDescription>Photo proof for <span className="font-mono font-medium">{shipment.trackingNumber || 'this shipment'}</span>.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <input ref={camRef} type="file" accept="image/jpeg,image/jpg,image/png" capture="environment" className="hidden" onChange={onFileChange} />
          <input ref={galRef} type="file" accept="image/jpeg,image/jpg,image/png,.img" className="hidden" onChange={onFileChange} />
          {!preview ? (
            <div className="space-y-3">
              <button type="button" onClick={() => camRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-3 py-10 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 transition-colors cursor-pointer">
                <div className="p-4 rounded-full bg-primary/10"><Camera className="size-8 text-primary" /></div>
                <div className="text-center"><p className="text-sm font-semibold">Take a Photo</p><p className="text-xs text-muted-foreground">Opens your camera</p></div>
              </button>
              <button type="button" onClick={() => galRef.current?.click()} className="w-full flex items-center justify-center gap-2 min-h-[44px] text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted">
                <ImageIcon className="size-4" />Choose from gallery
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="rounded-xl overflow-hidden border border-border"><img src={preview} alt="Proof preview" className="w-full max-h-60 object-contain bg-muted" /></div>
              <div className="flex gap-2">
                <button type="button" onClick={() => camRef.current?.click()} className="flex-1 flex items-center justify-center gap-1.5 min-h-[44px] text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors hover:bg-muted"><Camera className="size-3.5" />Retake</button>
                <button type="button" onClick={() => galRef.current?.click()} className="flex-1 flex items-center justify-center gap-1.5 min-h-[44px] text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors hover:bg-muted"><ImageIcon className="size-3.5" />Change Photo</button>
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="proof-note">Note (optional)</Label>
            <Textarea id="proof-note" rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Delivered to front door, customer signed" className="mt-1" />
          </div>
          {error && <div className="flex items-center gap-2 p-3 rounded-xl border border-red-500/15 bg-red-500/5 text-sm text-red-600"><AlertCircle className="size-4 shrink-0" />{error}</div>}
          <Button className="w-full rounded-xl" onClick={handleSubmit} disabled={submitting || !file}>
            {submitting ? <><Loader2 className="size-4 mr-2 animate-spin" />Submitting...</> : <><Camera className="size-4 mr-2" />Submit Proof</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
