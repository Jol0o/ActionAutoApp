'use client';

import * as React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Truck, ArrowLeft, ArrowRight, CheckCircle2, Clock, Loader2, MapPin,
  DollarSign, Navigation2, Phone, Mail, User2, Camera, Ban, FileText,
  AlertTriangle, CircleDot, Calendar, Package, Car, Shield, Zap,
  ExternalLink, Copy, ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn, resolveImageUrl } from '@/lib/utils';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { trailerTypeOptions } from '@/components/driver-profile/driver-profile-constants';

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Denver' }) : '';
const fmtDateTime = (d?: string) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Denver' }) : '';
const trailerLabel = (val?: string) => trailerTypeOptions.find(t => t.value === val)?.label || val || 'Any';
const extractErr = (e: any, fb: string) => e?.response?.data?.message || e?.message || fb;

const STATUS_THEME: Record<string, { bg: string; text: string; border: string }> = {
  'Available for Pickup': { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20' },
  Dispatched: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20' },
  'In-Route': { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20' },
  Delivered: { bg: 'bg-green-500/10', text: 'text-green-700', border: 'border-green-500/20' },
  Cancelled: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/20' },
  Posted: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20' },
  Assigned: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20' },
};

const STEPS = [
  { key: 'assigned', label: 'Assigned' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'in-route', label: 'In Route' },
  { key: 'delivered', label: 'Delivered' },
] as const;

export default function LoadDetailPage() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const loadId = params.id as string;
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const fetchDetail = React.useCallback(async () => {
    try {
      const token = await getToken();
      const [loadsRes, reqRes, availRes] = await Promise.all([
        apiClient.get('/api/driver-tracking/my-loads', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),
        apiClient.get('/api/driver-tracking/my-requests', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),
        apiClient.get('/api/driver-tracking/available-loads', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),
      ]);
      const all = [...(loadsRes.data?.data || []), ...(reqRes.data?.data || []), ...(availRes.data?.data || [])];
      const found = all.find((l: any) => l._id === loadId);
      if (found) setData(found);
    } catch (err: any) { toast.error(extractErr(err, 'Failed to load details')); }
    finally { setLoading(false); }
  }, [getToken, loadId]);

  React.useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const handleAction = async (action: string) => {
    setActionLoading(action);
    try {
      const token = await getToken();
      const body = data?.__docType === 'load' ? { loadId } : { shipmentId: loadId };
      await apiClient.post(`/api/driver-tracking/${action}`, body, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(action === 'accept-load' ? 'Load accepted' : action === 'start-route' ? 'Route started' : action === 'drop-load' ? 'Load dropped' : action === 'request-load' ? 'Request submitted' : 'Done');
      await fetchDetail();
    } catch (err: any) { toast.error(extractErr(err, `Failed to ${action}`)); }
    finally { setActionLoading(null); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative"><div className="size-16 rounded-full border-4 border-emerald-500/20 animate-pulse" /><Loader2 className="size-8 animate-spin text-emerald-500 absolute inset-0 m-auto" /></div>
      <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Loading Details</p>
    </div>
  );

  if (!data) return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <div className="size-20 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4"><Package className="size-10 text-muted-foreground/30" /></div>
      <h2 className="text-xl font-black">Load Not Found</h2>
      <p className="text-sm text-muted-foreground mt-2">This load may have been removed or reassigned.</p>
      <Button asChild className="mt-4 gap-2 rounded-xl"><Link href="/driver/loads"><ArrowLeft className="size-4" /> Back to Loads</Link></Button>
    </div>
  );

  const quote = data.preservedQuoteData;
  const vehicleName = quote?.vehicleName;
  const vehicleImg = quote?.vehicleImage;
  const vehicles = data.vehicles || [];
  const status = data.status || 'Unknown';
  const theme = STATUS_THEME[status] || STATUS_THEME['Posted'];
  const isAssigned = !!data.assignedDriverId || !!data.assignedAt;
  const isAccepted = !!data.driverAcceptedAt;
  const isMyRequest = !!data.myRequestStatus;
  const canAccept = isAssigned && !isAccepted && status !== 'Delivered' && status !== 'Cancelled';
  const canStartRoute = isAccepted && status === 'Dispatched';
  const canDrop = isAssigned && isAccepted && status !== 'Delivered' && status !== 'Cancelled';
  const canRequest = !isAssigned && !isMyRequest && (status === 'Available for Pickup' || status === 'Posted');
  const stepIdx = status === 'Delivered' ? 3 : status === 'In-Route' ? 2 : isAccepted ? 1 : 0;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">

        <div className="relative overflow-hidden rounded-3xl shadow-2xl">
          <div className="absolute inset-0 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/8 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-blue-500/6 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
          <div className="relative p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <button onClick={() => router.back()} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"><ArrowLeft className="size-4.5 text-white/80" /></button>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">{data.trackingNumber || data.loadNumber || loadId.slice(-8)}</h1>
                    <Badge className={cn('text-[10px]', theme.bg, theme.text, theme.border)}>{status}</Badge>
                  </div>
                  <p className="text-sm text-white/40 mt-0.5">{vehicleName || `${data.origin} → ${data.destination}`}</p>
                </div>
              </div>
              {data.carrierPayAmount != null && data.carrierPayAmount > 0 && (
                <div className="text-right hidden sm:block">
                  <span className="text-3xl font-black tabular-nums text-white">${data.carrierPayAmount.toLocaleString()}</span>
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Carrier Pay</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-emerald-400"><div className="size-2 rounded-full bg-emerald-400" /><span className="font-semibold">{data.origin}</span></div>
              <ArrowRight className="size-4 text-white/20" />
              <div className="flex items-center gap-1.5 text-rose-400"><MapPin className="size-3.5" /><span className="font-semibold">{data.destination}</span></div>
            </div>

            {isAssigned && status !== 'Delivered' && status !== 'Cancelled' && (
              <div className="flex items-center gap-0 w-full mt-5">
                {STEPS.map((step, i) => (
                  <React.Fragment key={step.key}>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className={cn('size-6 rounded-full flex items-center justify-center border-2 transition-colors',
                        i <= stepIdx ? (i === stepIdx ? 'bg-emerald-400 border-emerald-400 text-slate-950' : 'bg-emerald-400/20 border-emerald-400 text-emerald-300')
                          : 'bg-white/5 border-white/15 text-white/20')}>
                        {i < stepIdx ? <CheckCircle2 className="size-3.5" /> : i === stepIdx ? <CircleDot className="size-3.5" /> : <div className="size-1.5 rounded-full bg-current" />}
                      </div>
                      <span className={cn('text-[10px] font-semibold whitespace-nowrap', i <= stepIdx ? 'text-emerald-400' : 'text-white/20')}>{step.label}</span>
                    </div>
                    {i < STEPS.length - 1 && <div className={cn('flex-1 h-0.5 -mt-2.5 mx-1 rounded-full', i < stepIdx ? 'bg-emerald-400' : 'bg-white/10')} />}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {canAccept && (
            <Button onClick={() => handleAction('accept-load')} disabled={!!actionLoading} className="gap-2 rounded-xl">
              {actionLoading === 'accept-load' ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Accept Load
            </Button>
          )}
          {canStartRoute && (
            <Button onClick={() => handleAction('start-route')} disabled={!!actionLoading} className="gap-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl">
              {actionLoading === 'start-route' ? <Loader2 className="size-4 animate-spin" /> : <Navigation2 className="size-4" />} Start Route
            </Button>
          )}
          {canRequest && (
            <Button onClick={() => handleAction('request-load')} disabled={!!actionLoading} className="gap-2 rounded-xl">
              {actionLoading === 'request-load' ? <Loader2 className="size-4 animate-spin" /> : <Truck className="size-4" />} Request This Load
            </Button>
          )}
          {data.myRequestStatus === 'pending' && <Badge className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20 h-9 px-3 gap-1.5"><Clock className="size-3.5" />Request Pending</Badge>}
          {canDrop && (
            <Button variant="outline" onClick={() => handleAction('drop-load')} disabled={!!actionLoading} className="gap-2 text-destructive hover:text-destructive rounded-xl ml-auto">
              {actionLoading === 'drop-load' ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />} Drop Load
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicleImg && (
            <Card className="border-border/20 rounded-2xl overflow-hidden md:col-span-2">
              <div className="relative h-56 sm:h-72">
                <img src={vehicleImg} alt={vehicleName || 'Vehicle'} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-xl font-black text-white">{vehicleName}</p>
                  {quote?.miles && <p className="text-sm text-white/60">{quote.miles.toLocaleString()} miles</p>}
                </div>
              </div>
            </Card>
          )}

          {vehicles.length > 0 && (
            <Card className="border-border/20 rounded-2xl overflow-hidden md:col-span-2">
              <div className="p-4 border-b border-border/10">
                <div className="flex items-center gap-2"><Car className="size-4 text-primary" /><h3 className="text-sm font-black uppercase tracking-wider">Vehicles ({vehicles.length})</h3></div>
              </div>
              <CardContent className="p-4">
                <div className="grid gap-2">
                  {vehicles.map((v: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border/15 bg-muted/10">
                      <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Car className="size-5 text-primary" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold">{`${v.year || ''} ${v.make || ''} ${v.model || ''}`.trim() || 'Unknown Vehicle'}</p>
                        <div className="flex flex-wrap gap-2 mt-0.5">
                          {v.color && <span className="text-[10px] text-muted-foreground">{v.color}</span>}
                          {v.condition && <span className="text-[10px] text-muted-foreground">· {v.condition}</span>}
                          {v.vin && <span className="text-[10px] text-muted-foreground font-mono">VIN: {v.vin}</span>}
                          {v.trailerType && <Badge variant="outline" className="text-[9px] h-4">{trailerLabel(v.trailerType)}</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-border/20 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border/10">
              <div className="flex items-center gap-2"><Calendar className="size-4 text-primary" /><h3 className="text-sm font-black uppercase tracking-wider">Schedule</h3></div>
            </div>
            <CardContent className="p-4 space-y-3">
              <DateRow label="Scheduled Pickup" value={data.scheduledPickup} />
              <DateRow label="Scheduled Delivery" value={data.scheduledDelivery || data.desiredDeliveryDate} />
              {data.requestedPickupDate && <DateRow label="Requested Pickup" value={data.requestedPickupDate} />}
              {data.assignedAt && <DateRow label="Assigned" value={data.assignedAt} />}
              {data.driverAcceptedAt && <DateRow label="Accepted" value={data.driverAcceptedAt} />}
              {data.pickedUp && <DateRow label="Picked Up" value={data.pickedUp} />}
              {data.delivered && <DateRow label="Delivered" value={data.delivered} />}
            </CardContent>
          </Card>

          <Card className="border-border/20 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border/10">
              <div className="flex items-center gap-2"><DollarSign className="size-4 text-emerald-500" /><h3 className="text-sm font-black uppercase tracking-wider">Financials</h3></div>
            </div>
            <CardContent className="p-4 space-y-3">
              {data.carrierPayAmount != null && <FinRow label="Carrier Pay" value={data.carrierPayAmount} highlight />}
              {data.copCodAmount != null && data.copCodAmount > 0 && <FinRow label="COD" value={data.copCodAmount} />}
              {data.balanceAmount != null && <FinRow label="Balance" value={data.balanceAmount} />}
              {quote?.rate && <FinRow label="Quoted Rate" value={quote.rate} />}
              {quote?.miles && <div className="flex justify-between text-xs"><span className="text-muted-foreground">Distance</span><span className="font-semibold">{quote.miles.toLocaleString()} miles</span></div>}
              {data.trailerTypeRequired && (
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Trailer Required</span><Badge variant="outline" className="text-[10px] h-5">{trailerLabel(data.trailerTypeRequired)}</Badge></div>
              )}
            </CardContent>
          </Card>

          {(data.originContact?.contactName || data.originContact?.phone) && (
            <Card className="border-border/20 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border/10">
                <h3 className="text-sm font-black uppercase tracking-wider">Pick-Up Contact</h3>
              </div>
              <CardContent className="p-4 space-y-2">
                <ContactInfo contact={data.originContact} />
              </CardContent>
            </Card>
          )}

          {(data.destinationContact?.contactName || data.destinationContact?.phone) && (
            <Card className="border-border/20 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border/10">
                <h3 className="text-sm font-black uppercase tracking-wider">Delivery Contact</h3>
              </div>
              <CardContent className="p-4 space-y-2">
                <ContactInfo contact={data.destinationContact} />
              </CardContent>
            </Card>
          )}

          {(data.specialInstructions || data.preDispatchNotes || data.loadSpecificTerms) && (
            <Card className="border-border/20 rounded-2xl overflow-hidden md:col-span-2">
              <div className="p-4 border-b border-border/10">
                <div className="flex items-center gap-2"><FileText className="size-4 text-primary" /><h3 className="text-sm font-black uppercase tracking-wider">Notes & Instructions</h3></div>
              </div>
              <CardContent className="p-4 space-y-4">
                {data.preDispatchNotes && <NoteBlock label="Dispatch Notes" text={data.preDispatchNotes} />}
                {data.specialInstructions && <NoteBlock label="Special Instructions" text={data.specialInstructions} />}
                {data.loadSpecificTerms && <NoteBlock label="Load Terms" text={data.loadSpecificTerms} />}
              </CardContent>
            </Card>
          )}

          {data.proofOfDelivery?.imageUrl && (
            <Card className="border-border/20 rounded-2xl overflow-hidden md:col-span-2">
              <div className="p-4 border-b border-border/10">
                <div className="flex items-center gap-2"><Camera className="size-4 text-primary" /><h3 className="text-sm font-black uppercase tracking-wider">Proof of Delivery</h3></div>
              </div>
              <CardContent className="p-4">
                <div className="rounded-xl overflow-hidden border border-border/15">
                  <img src={resolveImageUrl(data.proofOfDelivery.imageUrl)} alt="Proof of delivery" className="w-full max-h-72 object-contain bg-muted/20" />
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  {data.proofOfDelivery.submittedAt && <span>Submitted: {fmtDateTime(data.proofOfDelivery.submittedAt)}</span>}
                  {data.proofOfDelivery.confirmedAt && <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1 text-[10px]"><CheckCircle2 className="size-2.5" />Confirmed {fmtDate(data.proofOfDelivery.confirmedAt)}</Badge>}
                  {data.proofOfDelivery.note && <span className="italic">"{data.proofOfDelivery.note}"</span>}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function DateRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return <div className="flex justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{fmtDate(value)}</span></div>;
}

function FinRow({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return <div className="flex justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className={cn('font-bold', highlight && 'text-emerald-600')}>${value.toLocaleString()}</span></div>;
}

function ContactInfo({ contact }: { contact: any }) {
  return (
    <>
      {contact.contactName && <div className="flex items-center gap-2 text-sm"><User2 className="size-4 text-muted-foreground" /><span className="font-semibold">{contact.contactName}</span></div>}
      {contact.phone && <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline"><Phone className="size-4" />{contact.phone}</a>}
      {contact.email && <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm text-primary hover:underline"><Mail className="size-4" />{contact.email}</a>}
    </>
  );
}

function NoteBlock({ label, text }: { label: string; text: string }) {
  return <div><p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</p><p className="text-sm leading-relaxed">{text}</p></div>;
}
