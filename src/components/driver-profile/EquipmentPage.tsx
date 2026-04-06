'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { apiClient } from '@/lib/api-client';
import { DriverProfile } from '@/types/driver-profile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Loader2, Truck, Save, Hash, CheckCircle2, ArrowLeft, Plus, X,
  Gauge, Ruler, Shield, Star, Settings2, ChevronRight, Wrench, Circle,
  Box, ChevronsUpDown, Sparkles, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  trailerTypeOptions, specialFeatureOptions, TRAILER_CATEGORIES, hitchTypeOptions,
} from './driver-profile-constants';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface EquipmentForm {
  truckMake: string; truckModel: string; truckYear: number | undefined;
  truckColor: string; engineType: string; gvwr: number | undefined;
  vin: string; plateNumber: string; dotNumber: string; mcNumber: string;
  trailerType: string; trailerMake: string; trailerModel: string;
  trailerYear: number | undefined; hitchType: string; maxVehicleCapacity: number;
  trailerLength: number | undefined; trailerAxles: number;
  trailerGvwr: number | undefined; specialFeatures: string[];
}

const INIT: EquipmentForm = {
  truckMake: '', truckModel: '', truckYear: undefined, truckColor: '',
  engineType: '', gvwr: undefined, vin: '', plateNumber: '', dotNumber: '',
  mcNumber: '', trailerType: 'open_3car_wedge', trailerMake: '', trailerModel: '',
  trailerYear: undefined, hitchType: '', maxVehicleCapacity: 1,
  trailerLength: undefined, trailerAxles: 2, trailerGvwr: undefined,
  specialFeatures: [],
};

const REQ: { key: keyof EquipmentForm; label: string }[] = [
  { key: 'truckMake', label: 'Truck Make' }, { key: 'truckModel', label: 'Truck Model' },
  { key: 'truckYear', label: 'Truck Year' }, { key: 'trailerType', label: 'Trailer Type' },
  { key: 'maxVehicleCapacity', label: 'Vehicle Capacity' }, { key: 'dotNumber', label: 'DOT Number' },
  { key: 'mcNumber', label: 'MC Number' },
];

const isFilled = (v: any) => v !== undefined && v !== null && v !== '' && v !== 0;

const TH: Record<string, { bg: string; text: string; fill: string; grad: string; ring: string; glow: string }> = {
  open: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', fill: 'fill-emerald-500', grad: 'from-emerald-600 to-teal-500', ring: 'ring-emerald-500/30', glow: 'shadow-emerald-500/20' },
  enclosed: { bg: 'bg-blue-500/10', text: 'text-blue-500', fill: 'fill-blue-500', grad: 'from-blue-600 to-indigo-500', ring: 'ring-blue-500/30', glow: 'shadow-blue-500/20' },
  flatbed: { bg: 'bg-amber-500/10', text: 'text-amber-500', fill: 'fill-amber-500', grad: 'from-amber-600 to-orange-500', ring: 'ring-amber-500/30', glow: 'shadow-amber-500/20' },
  heavy: { bg: 'bg-red-500/10', text: 'text-red-500', fill: 'fill-red-500', grad: 'from-red-600 to-rose-500', ring: 'ring-red-500/30', glow: 'shadow-red-500/20' },
  multi: { bg: 'bg-purple-500/10', text: 'text-purple-500', fill: 'fill-purple-500', grad: 'from-purple-600 to-violet-500', ring: 'ring-purple-500/30', glow: 'shadow-purple-500/20' },
  specialty: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', fill: 'fill-cyan-500', grad: 'from-cyan-600 to-sky-500', ring: 'ring-cyan-500/30', glow: 'shadow-cyan-500/20' },
};

const TSvg = ({ cat, className }: { cat: string; className?: string }) => {
  const c = cn('stroke-current', TH[cat]?.text || TH.open.text, className);
  if (cat === 'enclosed') return (<svg viewBox="0 0 160 80" fill="none" strokeWidth="2.5" className={c}><path d="M8 56V32c0-3 2-5 5-5h14l6 12h2v17" strokeLinecap="round" strokeLinejoin="round" /><rect x="14" y="30" width="10" height="7" rx="1.5" strokeWidth="1.5" opacity=".5" /><rect x="39" y="20" width="97" height="36" rx="3" /><path d="M128 20v36" opacity=".3" strokeWidth="1.5" /><circle cx="20" cy="62" r="6" strokeWidth="2.5" /><circle cx="107" cy="62" r="6" strokeWidth="2.5" /><circle cx="127" cy="62" r="6" strokeWidth="2.5" /></svg>);
  if (cat === 'flatbed') return (<svg viewBox="0 0 160 80" fill="none" strokeWidth="2.5" className={c}><path d="M8 56V32c0-3 2-5 5-5h14l6 12h2v17" strokeLinecap="round" strokeLinejoin="round" /><rect x="14" y="30" width="10" height="7" rx="1.5" strokeWidth="1.5" opacity=".5" /><rect x="39" y="47" width="100" height="5" rx="1.5" /><path d="M47 47V37M77 47V37M107 47V37M135 47V37" opacity=".35" strokeWidth="2" strokeLinecap="round" /><circle cx="20" cy="62" r="6" strokeWidth="2.5" /><circle cx="107" cy="62" r="6" strokeWidth="2.5" /><circle cx="127" cy="62" r="6" strokeWidth="2.5" /></svg>);
  if (cat === 'heavy') return (<svg viewBox="0 0 160 80" fill="none" strokeWidth="2.5" className={c}><path d="M8 56V32c0-3 2-5 5-5h14l6 12h2v17" strokeLinecap="round" strokeLinejoin="round" /><rect x="14" y="30" width="10" height="7" rx="1.5" strokeWidth="1.5" opacity=".5" /><path d="M37 52l10-16h4" strokeLinecap="round" strokeLinejoin="round" /><rect x="51" y="52" width="85" height="4" rx="1.5" /><rect x="65" y="36" width="38" height="16" rx="3" className={cn(TH.heavy.fill)} opacity=".15" /><circle cx="20" cy="62" r="6" strokeWidth="2.5" /><circle cx="107" cy="62" r="6" strokeWidth="2.5" /><circle cx="127" cy="62" r="6" strokeWidth="2.5" /></svg>);
  if (cat === 'multi') return (<svg viewBox="0 0 160 80" fill="none" strokeWidth="2.5" className={c}><path d="M4 56V27c0-3 2-5 5-5h14l6 10h2v24" strokeLinecap="round" strokeLinejoin="round" /><rect x="10" y="25" width="10" height="6" rx="1.5" strokeWidth="1.5" opacity=".5" /><path d="M33 24h118M33 52h118" strokeLinecap="round" /><path d="M40 24v28M90 24v28M145 24v28" strokeWidth="2" strokeLinecap="round" />{[48,65,98,115].map(x=><rect key={`u${x}`} x={x} y="17" width="13" height="7" rx="2" className={cn(TH.multi.fill)} opacity=".18"/>)}{[48,65,98,115].map(x=><rect key={`l${x}`} x={x} y="45" width="13" height="7" rx="2" className={cn(TH.multi.fill)} opacity=".18"/>)}<circle cx="16" cy="62" r="5.5" strokeWidth="2.5" /><circle cx="58" cy="62" r="5.5" strokeWidth="2.5" /><circle cx="73" cy="62" r="5.5" strokeWidth="2.5" /><circle cx="128" cy="62" r="5.5" strokeWidth="2.5" /><circle cx="143" cy="62" r="5.5" strokeWidth="2.5" /></svg>);
  if (cat === 'specialty') return (<svg viewBox="0 0 160 80" fill="none" strokeWidth="2.5" className={c}><path d="M8 56V30c0-3 2-5 5-5h18l6 8h18v23" strokeLinecap="round" strokeLinejoin="round" /><rect x="14" y="27" width="16" height="7" rx="1.5" strokeWidth="1.5" opacity=".5" /><rect x="47" y="37" width="12" height="15" rx="1.5" /><path d="M60 50h8" strokeLinecap="round" /><rect x="68" y="42" width="68" height="10" rx="1.5" /><rect x="78" y="32" width="22" height="10" rx="3" className={cn(TH.specialty.fill)} opacity=".15" /><circle cx="18" cy="62" r="5.5" strokeWidth="2.5" /><circle cx="48" cy="62" r="5.5" strokeWidth="2.5" /><circle cx="98" cy="62" r="5.5" strokeWidth="2.5" /><circle cx="128" cy="62" r="5.5" strokeWidth="2.5" /></svg>);
  return (<svg viewBox="0 0 160 80" fill="none" strokeWidth="2.5" className={c}><path d="M8 56V32c0-3 2-5 5-5h14l6 12h2v17" strokeLinecap="round" strokeLinejoin="round" /><rect x="14" y="30" width="10" height="7" rx="1.5" strokeWidth="1.5" opacity=".5" /><path d="M37 52h100M37 56h100" strokeLinecap="round" /><path d="M42 32h90" strokeLinecap="round" /><path d="M47 32v20M127 32v20" strokeWidth="2" strokeLinecap="round" /><path d="M132 32l14 10" strokeLinecap="round" opacity=".6" /><rect x="57" y="24" width="22" height="8" rx="3" className={cn(TH.open.fill)} opacity=".2" /><rect x="87" y="24" width="22" height="8" rx="3" className={cn(TH.open.fill)} opacity=".2" /><circle cx="20" cy="62" r="6" strokeWidth="2.5" /><circle cx="107" cy="62" r="6" strokeWidth="2.5" /><circle cx="127" cy="62" r="6" strokeWidth="2.5" /></svg>);
};

type Nav = 'rig' | 'trailer' | 'specs' | 'features';
const NAVS: { id: Nav; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'rig', label: 'Rig', icon: Truck, color: 'from-blue-600 to-indigo-500' },
  { id: 'trailer', label: 'Trailer', icon: Box, color: 'from-emerald-600 to-teal-500' },
  { id: 'specs', label: 'Specs', icon: Gauge, color: 'from-amber-500 to-orange-500' },
  { id: 'features', label: 'Features', icon: Star, color: 'from-violet-600 to-purple-500' },
];

const Fld = ({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
      {label}{req && <span className="text-red-500 text-xs">*</span>}
    </Label>
    {children}
  </div>
);

export const EquipmentPage: React.FC = () => {
  const { getToken } = useAuth();
  const [form, setForm] = useState<EquipmentForm>(INIT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [dialogCategory, setDialogCategory] = useState('open');
  const [customInputs, setCustomInputs] = useState<string[]>(['']);
  const [nav, setNav] = useState<Nav>('rig');

  const patch = useCallback((u: Partial<EquipmentForm>) => setForm(f => ({ ...f, ...u })), []);

  const fetchProfile = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await apiClient.get('/api/driver-profile', { headers: { Authorization: `Bearer ${token}` } });
      const d = res.data?.data as DriverProfile | undefined;
      if (d) {
        setForm({
          truckMake: d.truckMake || '', truckModel: d.truckModel || '', truckYear: d.truckYear, truckColor: d.truckColor || '',
          engineType: d.engineType || '', gvwr: d.gvwr, vin: d.vin || '', plateNumber: d.plateNumber || '',
          dotNumber: d.dotNumber || '', mcNumber: d.mcNumber || '', trailerType: d.trailerType || 'open_3car_wedge',
          trailerMake: d.trailerMake || '', trailerModel: d.trailerModel || '', trailerYear: d.trailerYear,
          hitchType: d.hitchType || '', maxVehicleCapacity: d.maxVehicleCapacity || 1, trailerLength: d.trailerLength,
          trailerAxles: d.trailerAxles || 2, trailerGvwr: d.trailerGvwr, specialFeatures: d.specialFeatures || [],
        });
        const match = trailerTypeOptions.find(t => t.value === d.trailerType);
        if (match) setDialogCategory(match.category);
      }
    } catch { toast.error('Failed to load equipment data'); }
    finally { setLoading(false); }
  }, [getToken]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    const missing = REQ.filter(f => !isFilled(form[f.key]));
    if (missing.length > 0) {
      toast.error(`Required: ${missing.map(m => m.label).join(', ')}`);
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      await apiClient.patch('/api/driver-profile/equipment', {
        trailerType: form.trailerType, maxVehicleCapacity: form.maxVehicleCapacity,
        truckMake: form.truckMake.trim(), truckModel: form.truckModel.trim(),
        truckYear: form.truckYear || undefined, trailerLength: form.trailerLength || undefined,
        dotNumber: form.dotNumber.trim(), mcNumber: form.mcNumber.trim(),
        vin: form.vin.trim(), plateNumber: form.plateNumber.trim(),
        truckColor: form.truckColor.trim(), gvwr: form.gvwr || undefined,
        trailerAxles: form.trailerAxles, trailerGvwr: form.trailerGvwr || undefined,
        engineType: form.engineType.trim(), trailerMake: form.trailerMake.trim(),
        trailerModel: form.trailerModel.trim(), trailerYear: form.trailerYear || undefined,
        hitchType: form.hitchType, specialFeatures: form.specialFeatures,
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Equipment saved');
    } catch { toast.error('Failed to save equipment'); }
    finally { setSaving(false); }
  };

  const toggleFeature = (v: string) =>
    patch({ specialFeatures: form.specialFeatures.includes(v) ? form.specialFeatures.filter(f => f !== v) : [...form.specialFeatures, v] });

  const addCustomFeature = (v: string) => {
    const t = v.trim().toLowerCase().replace(/\s+/g, '_');
    if (!t || form.specialFeatures.includes(t) || form.specialFeatures.length >= 20) return false;
    patch({ specialFeatures: [...form.specialFeatures, t] });
    return true;
  };

  const sel = trailerTypeOptions.find(t => t.value === form.trailerType);
  const cat = sel?.category || 'open';
  const th = TH[cat] || TH.open;

  const { reqFilled, reqTotal, pct } = useMemo(() => {
    const rf = REQ.filter(f => isFilled(form[f.key])).length;
    const rt = REQ.length;
    const opts: (keyof EquipmentForm)[] = ['truckColor', 'engineType', 'gvwr', 'vin', 'plateNumber', 'trailerMake', 'trailerModel', 'trailerYear', 'hitchType', 'trailerLength', 'trailerGvwr'];
    const of_ = opts.filter(k => isFilled(form[k])).length;
    const feat = form.specialFeatures.length > 0 ? 1 : 0;
    return { reqFilled: rf, reqTotal: rt, pct: Math.round(((rf + of_ + feat) / (rt + opts.length + 1)) * 100) };
  }, [form]);

  const isComplete = reqFilled === reqTotal;

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative"><div className="size-16 rounded-full border-4 border-primary/20 animate-pulse" /><Loader2 className="size-8 animate-spin text-primary absolute inset-0 m-auto" /></div>
      <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs animate-pulse">Loading Equipment</p>
    </div>
  );

  const inp = "h-11 text-sm font-medium bg-muted/20 border-border/30 focus:border-primary/50 focus:ring-primary/20 rounded-xl";
  const mono = cn(inp, 'font-mono tracking-wide');

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">

        <div className="relative overflow-hidden rounded-3xl shadow-2xl">
          <div className="absolute inset-0 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/8 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/6 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23fff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

          <div className="relative p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Link href="/driver/profile" className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 backdrop-blur-sm">
                  <ArrowLeft className="size-4.5 text-white/80" />
                </Link>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Equipment & Rig</h1>
                    {sel && <Badge className={cn('text-[10px] font-black px-2.5 h-5 bg-linear-to-r text-white border-0 shadow-lg', th.grad, th.glow)}>{sel.capacity}</Badge>}
                  </div>
                  <p className="text-sm text-white/40 mt-0.5">Configure your truck, trailer, and capabilities</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <span className="text-4xl font-black tabular-nums text-white">{pct}%</span>
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Complete</p>
                </div>
                <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2 bg-white text-slate-900 hover:bg-white/90 font-extrabold shadow-xl rounded-xl">
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
                </Button>
              </div>
            </div>

            <div className="mt-5">
              <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                <motion.div className={cn('h-full rounded-full bg-linear-to-r', isComplete ? 'from-emerald-400 to-teal-400' : 'from-amber-400 to-orange-400')} initial={false} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} />
              </div>
              <div className="flex items-center justify-between mt-2">
                {isComplete ? (
                  <Badge className="text-[10px] bg-emerald-500/15 text-emerald-400 border-emerald-500/20 gap-1"><CheckCircle2 className="size-3" />All Required Filled</Badge>
                ) : (
                  <Badge className="text-[10px] bg-amber-500/15 text-amber-400 border-amber-500/20 gap-1"><AlertTriangle className="size-3" />{reqTotal - reqFilled} required left</Badge>
                )}
                <span className="text-[10px] text-white/25 font-semibold">{reqFilled}/{reqTotal} required</span>
              </div>
            </div>

            <div className="flex gap-1.5 mt-5">
              {NAVS.map(n => {
                const active = nav === n.id;
                return (
                  <button key={n.id} type="button" onClick={() => setNav(n.id)}
                    className={cn('flex-1 flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 p-3 sm:p-3.5 rounded-xl transition-all border relative overflow-hidden',
                      active ? 'bg-white/10 border-white/20 shadow-lg' : 'bg-white/3 border-white/5 hover:bg-white/6')}>
                    {active && <motion.div layoutId="equip-nav" className={cn('absolute inset-x-0 top-0 h-0.5 bg-linear-to-r', n.color)} transition={{ type: 'spring', stiffness: 400, damping: 35 }} />}
                    <div className={cn('size-8 rounded-lg flex items-center justify-center shrink-0', active ? 'bg-white/10' : 'bg-white/5')}>
                      <n.icon className={cn('size-4', active ? 'text-white' : 'text-white/30')} />
                    </div>
                    <span className={cn('text-[11px] sm:text-xs font-bold', active ? 'text-white' : 'text-white/30')}>{n.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {!isComplete && (
          <Card className="border-amber-500/20 rounded-2xl overflow-hidden bg-amber-500/3">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0"><AlertTriangle className="size-5 text-amber-500" /></div>
              <div>
                <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Complete required fields to access Load Board</p>
                <p className="text-xs text-muted-foreground mt-0.5">Fill all required fields marked with * to browse and accept loads.</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {REQ.filter(f => !isFilled(form[f.key])).map(f => (
                    <Badge key={f.key} variant="outline" className="text-[10px] border-amber-500/30 text-amber-600 dark:text-amber-400">{f.label}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={nav} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

            {nav === 'rig' && (
              <div className="space-y-5">
                <Card className="border-border/20 shadow-xl overflow-hidden rounded-2xl">
                  <div className="h-1 w-full bg-linear-to-r from-blue-600 to-indigo-500" />
                  <div className="px-5 sm:px-6 pt-5 pb-4 flex items-center gap-3.5 border-b border-border/10">
                    <div className="size-11 rounded-xl bg-linear-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg"><Truck className="size-5" /></div>
                    <div className="flex-1"><h3 className="text-lg font-black">Truck Details</h3><p className="text-xs text-muted-foreground">Primary vehicle information</p></div>
                    <Badge className="text-[10px] text-red-500 bg-red-500/8 border-red-500/20">Required</Badge>
                  </div>
                  <CardContent className="p-5 sm:p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Fld label="Make" req><Input value={form.truckMake} onChange={e => patch({ truckMake: e.target.value })} placeholder="e.g. Peterbilt" className={inp} /></Fld>
                      <Fld label="Model" req><Input value={form.truckModel} onChange={e => patch({ truckModel: e.target.value })} placeholder="e.g. 389" className={inp} /></Fld>
                      <Fld label="Year" req><Input type="number" min={1990} max={2030} value={form.truckYear || ''} onChange={e => patch({ truckYear: parseInt(e.target.value) || undefined })} placeholder="2024" className={inp} /></Fld>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Fld label="Color"><Input value={form.truckColor} onChange={e => patch({ truckColor: e.target.value })} placeholder="e.g. White" className={inp} /></Fld>
                      <Fld label="Engine Type"><Input value={form.engineType} onChange={e => patch({ engineType: e.target.value })} placeholder="e.g. Cummins X15" className={inp} /></Fld>
                      <Fld label="Truck GVWR (lbs)"><Input type="number" min={0} max={100000} value={form.gvwr || ''} onChange={e => patch({ gvwr: parseInt(e.target.value) || undefined })} placeholder="e.g. 26000" className={inp} /></Fld>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/20 shadow-xl overflow-hidden rounded-2xl">
                  <div className="h-1 w-full bg-linear-to-r from-slate-600 to-zinc-500" />
                  <div className="px-5 sm:px-6 pt-5 pb-4 flex items-center gap-3.5 border-b border-border/10">
                    <div className="size-11 rounded-xl bg-linear-to-br from-slate-600 to-zinc-500 flex items-center justify-center text-white shadow-lg"><Shield className="size-5" /></div>
                    <div className="flex-1"><h3 className="text-lg font-black">Operating Authority</h3><p className="text-xs text-muted-foreground">Identification and registration</p></div>
                    <Badge className="text-[10px] text-red-500 bg-red-500/8 border-red-500/20">Required</Badge>
                  </div>
                  <CardContent className="p-5 sm:p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Fld label="DOT Number" req><Input value={form.dotNumber} onChange={e => patch({ dotNumber: e.target.value })} placeholder="e.g. 1234567" className={mono} /></Fld>
                      <Fld label="MC Number" req><Input value={form.mcNumber} onChange={e => patch({ mcNumber: e.target.value })} placeholder="e.g. MC-123456" className={mono} /></Fld>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Fld label="VIN"><Input value={form.vin} onChange={e => patch({ vin: e.target.value.toUpperCase() })} placeholder="e.g. 1HGCM82633A004352" maxLength={17} className={mono} /></Fld>
                      <Fld label="License Plate"><Input value={form.plateNumber} onChange={e => patch({ plateNumber: e.target.value.toUpperCase() })} placeholder="e.g. ABC-1234" maxLength={15} className={mono} /></Fld>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button onClick={() => setNav('trailer')} className="gap-2 rounded-xl">Next: Trailer <ChevronRight className="size-4" /></Button>
                </div>
              </div>
            )}

            {nav === 'trailer' && (
              <div className="space-y-5">
                <Card className="border-border/20 shadow-xl overflow-hidden rounded-2xl">
                  <div className={cn('h-1 w-full bg-linear-to-r', th.grad)} />
                  <div className="px-5 sm:px-6 pt-5 pb-4 flex items-center gap-3.5 border-b border-border/10">
                    <div className={cn('size-11 rounded-xl bg-linear-to-br flex items-center justify-center text-white shadow-lg', th.grad)}>
                      <ChevronsUpDown className="size-5" />
                    </div>
                    <div className="flex-1"><h3 className="text-lg font-black">Trailer Type</h3><p className="text-xs text-muted-foreground">Determines which loads match you</p></div>
                    {sel && <Badge className={cn('text-xs font-bold px-3 py-1 bg-linear-to-r text-white border-0', th.grad)}>{sel.capacity}</Badge>}
                  </div>
                  <CardContent className="p-5 sm:p-6">
                    <button type="button" onClick={() => setTypeDialogOpen(true)}
                      className={cn('w-full flex items-center gap-4 sm:gap-5 p-4 sm:p-5 rounded-2xl border-2 transition-all text-left group relative overflow-hidden', 'border-border/20 hover:border-primary/30 hover:shadow-xl')}>
                      <div className={cn('absolute inset-0 opacity-[0.03] bg-linear-to-r', th.grad)} />
                      <div className={cn('w-24 sm:w-32 h-16 sm:h-20 rounded-xl flex items-center justify-center shrink-0 relative', th.bg)}>
                        <TSvg cat={cat} className="w-full h-full p-2" />
                      </div>
                      <div className="flex-1 min-w-0 relative">
                        <p className="text-base sm:text-lg font-black">{sel?.label || 'Select Type'}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{sel?.description}</p>
                        <div className="flex items-center gap-2 mt-2.5">
                          <Badge variant="outline" className="text-[10px] gap-1 h-5"><Hash className="size-2.5" />{sel?.capacity}</Badge>
                          <Badge className={cn('text-[10px] capitalize h-5 border-0 text-white bg-linear-to-r', th.grad)}>{cat}</Badge>
                        </div>
                      </div>
                      <div className="relative flex items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors">
                        <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">Change</span>
                        <ChevronRight className="size-5" />
                      </div>
                    </button>
                  </CardContent>
                </Card>

                <Card className="border-border/20 shadow-xl overflow-hidden rounded-2xl">
                  <div className="h-1 w-full bg-linear-to-r from-cyan-600 to-sky-500" />
                  <div className="px-5 sm:px-6 pt-5 pb-4 flex items-center gap-3.5 border-b border-border/10">
                    <div className="size-11 rounded-xl bg-linear-to-br from-cyan-600 to-sky-500 flex items-center justify-center text-white shadow-lg"><Wrench className="size-5" /></div>
                    <div><h3 className="text-lg font-black">Trailer Details</h3><p className="text-xs text-muted-foreground">Make, model, and hitch configuration</p></div>
                  </div>
                  <CardContent className="p-5 sm:p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Fld label="Trailer Make"><Input value={form.trailerMake} onChange={e => patch({ trailerMake: e.target.value })} placeholder="e.g. Kaufman" className={inp} /></Fld>
                      <Fld label="Trailer Model"><Input value={form.trailerModel} onChange={e => patch({ trailerModel: e.target.value })} placeholder="e.g. Deluxe" className={inp} /></Fld>
                      <Fld label="Trailer Year"><Input type="number" min={1990} max={2030} value={form.trailerYear || ''} onChange={e => patch({ trailerYear: parseInt(e.target.value) || undefined })} placeholder="2024" className={inp} /></Fld>
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">Hitch Type</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {hitchTypeOptions.map(opt => {
                          const a = form.hitchType === opt.value;
                          return (
                            <button key={opt.value} type="button" onClick={() => patch({ hitchType: a ? '' : opt.value })}
                              className={cn('flex flex-col items-center gap-1 p-3.5 rounded-xl border-2 transition-all', a ? 'border-cyan-500 bg-cyan-500/5 shadow-md ring-1 ring-cyan-500/20' : 'border-border/20 hover:border-border/50')}>
                              <span className={cn('text-sm font-bold', a && 'text-cyan-600 dark:text-cyan-400')}>{opt.label}</span>
                              <span className="text-[10px] text-muted-foreground text-center leading-tight">{opt.description}</span>
                              {a && <CheckCircle2 className="size-4 text-cyan-500 mt-0.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center justify-between">
                  <Button variant="ghost" onClick={() => setNav('rig')} className="gap-1.5 text-muted-foreground rounded-xl"><ArrowLeft className="size-4" /> Back</Button>
                  <Button onClick={() => setNav('specs')} className="gap-2 rounded-xl">Next: Specs <ChevronRight className="size-4" /></Button>
                </div>
              </div>
            )}

            {nav === 'specs' && (
              <div className="space-y-5">
                <Card className="border-border/20 shadow-xl overflow-hidden rounded-2xl">
                  <div className="h-1 w-full bg-linear-to-r from-amber-500 to-orange-500" />
                  <div className="px-5 sm:px-6 pt-5 pb-4 flex items-center gap-3.5 border-b border-border/10">
                    <div className="size-11 rounded-xl bg-linear-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg"><Gauge className="size-5" /></div>
                    <div className="flex-1"><h3 className="text-lg font-black">Vehicle Capacity</h3><p className="text-xs text-muted-foreground">{sel?.capacity || 'Select trailer first'}</p></div>
                    <Badge className="text-[10px] text-red-500 bg-red-500/8 border-red-500/20">Required</Badge>
                  </div>
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-center gap-5 justify-center mb-4">
                      <button type="button" onClick={() => patch({ maxVehicleCapacity: Math.max(1, form.maxVehicleCapacity - 1) })}
                        className="size-14 rounded-2xl border-2 border-border/30 flex items-center justify-center font-bold text-2xl transition-all active:scale-90 hover:border-primary/40">−</button>
                      <div className="text-center min-w-20">
                        <motion.span key={form.maxVehicleCapacity} initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                          className="text-7xl font-black tabular-nums text-amber-500 block">{form.maxVehicleCapacity}</motion.span>
                        <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-widest">Vehicles</p>
                      </div>
                      <button type="button" onClick={() => patch({ maxVehicleCapacity: Math.min(12, form.maxVehicleCapacity + 1) })}
                        className="size-14 rounded-2xl border-2 border-border/30 flex items-center justify-center font-bold text-2xl transition-all active:scale-90 hover:border-primary/40">+</button>
                    </div>
                    <div className="flex justify-center gap-1.5">
                      {Array.from({ length: 12 }, (_, i) => (
                        <motion.div key={i} initial={false}
                          animate={{ scale: i < form.maxVehicleCapacity ? 1 : 0.6, opacity: i < form.maxVehicleCapacity ? 1 : 0.2 }}
                          className={cn('size-3 rounded-full', i < form.maxVehicleCapacity ? 'bg-amber-500 shadow-sm shadow-amber-500/30' : 'bg-border')} />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Card className="border-border/20 shadow-xl overflow-hidden rounded-2xl">
                    <div className="h-1 w-full bg-linear-to-r from-violet-500 to-purple-500" />
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="size-10 rounded-xl bg-linear-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white shadow-lg"><Ruler className="size-4.5" /></div>
                        <div><p className="text-sm font-black">Trailer Length</p><p className="text-[10px] text-muted-foreground">Overall length in feet</p></div>
                      </div>
                      <div className="text-center mb-5">
                        <motion.span key={form.trailerLength || 0} initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                          className="text-5xl font-black tabular-nums text-violet-500">{form.trailerLength || 0}</motion.span>
                        <span className="text-lg text-muted-foreground font-bold ml-1">ft</span>
                      </div>
                      <Slider value={[form.trailerLength || 0]} onValueChange={([v]) => patch({ trailerLength: v || undefined })} min={0} max={80} step={1} className="w-full" />
                      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-semibold"><span>0 ft</span><span>80 ft</span></div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/20 shadow-xl overflow-hidden rounded-2xl">
                    <div className="h-1 w-full bg-linear-to-r from-rose-500 to-pink-500" />
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="size-10 rounded-xl bg-linear-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-lg"><Settings2 className="size-4.5" /></div>
                        <div><p className="text-sm font-black">Axle Count</p><p className="text-[10px] text-muted-foreground">Number of trailer axles</p></div>
                      </div>
                      <div className="text-center mb-5">
                        <motion.span key={form.trailerAxles} initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                          className="text-5xl font-black tabular-nums text-rose-500">{form.trailerAxles}</motion.span>
                        <span className="text-lg text-muted-foreground font-bold ml-1">axles</span>
                      </div>
                      <Slider value={[form.trailerAxles]} onValueChange={([v]) => patch({ trailerAxles: v })} min={1} max={10} step={1} className="w-full" />
                      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-semibold"><span>1</span><span>10</span></div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-border/20 shadow-xl overflow-hidden rounded-2xl">
                  <div className="h-1 w-full bg-linear-to-r from-orange-500 to-red-500" />
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="size-10 rounded-xl bg-linear-to-br from-orange-500 to-red-500 flex items-center justify-center text-white shadow-lg"><Gauge className="size-4.5" /></div>
                      <div><p className="text-sm font-black">Trailer GVWR</p><p className="text-[10px] text-muted-foreground">Gross Vehicle Weight Rating in pounds</p></div>
                    </div>
                    <Input type="number" min={0} max={100000} value={form.trailerGvwr || ''} onChange={e => patch({ trailerGvwr: parseInt(e.target.value) || undefined })}
                      placeholder="e.g. 14000" className="h-14 text-2xl font-bold text-center bg-muted/20 border-border/20 rounded-xl max-w-xs mx-auto block" />
                  </CardContent>
                </Card>

                <div className="flex items-center justify-between">
                  <Button variant="ghost" onClick={() => setNav('trailer')} className="gap-1.5 text-muted-foreground rounded-xl"><ArrowLeft className="size-4" /> Back</Button>
                  <Button onClick={() => setNav('features')} className="gap-2 rounded-xl">Next: Features <ChevronRight className="size-4" /></Button>
                </div>
              </div>
            )}

            {nav === 'features' && (
              <div className="space-y-5">
                <Card className="border-border/20 shadow-xl overflow-hidden rounded-2xl">
                  <div className="h-1 w-full bg-linear-to-r from-violet-600 to-purple-500" />
                  <div className="px-5 sm:px-6 pt-5 pb-4 flex items-center gap-3.5 border-b border-border/10">
                    <div className="size-11 rounded-xl bg-linear-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white shadow-lg"><Star className="size-5" /></div>
                    <div className="flex-1"><h3 className="text-lg font-black">Special Features</h3><p className="text-xs text-muted-foreground">Capabilities on your rig</p></div>
                    <Badge className="text-xs font-bold bg-linear-to-r from-violet-600 to-purple-500 text-white border-0">{form.specialFeatures.length}</Badge>
                  </div>
                  <CardContent className="p-5 sm:p-6 space-y-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                      {specialFeatureOptions.map(opt => {
                        const a = form.specialFeatures.includes(opt.value);
                        return (
                          <button key={opt.value} type="button" onClick={() => toggleFeature(opt.value)}
                            className={cn('flex items-center justify-between gap-2 p-3 rounded-xl border-2 transition-all text-left', a ? 'border-violet-500 bg-violet-500/10 shadow-md ring-1 ring-violet-500/20' : 'border-border/20 hover:border-border/50')}>
                            <span className={cn('text-xs font-bold truncate', a && 'text-violet-600 dark:text-violet-400')}>{opt.label}</span>
                            {a ? <CheckCircle2 className="size-4 text-violet-500 shrink-0" /> : <Circle className="size-3.5 text-border shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {form.specialFeatures.filter(f => !specialFeatureOptions.find(o => o.value === f)).length > 0 && (
                      <div className="pt-3 border-t border-border/10">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Custom</p>
                        <div className="flex flex-wrap gap-2">
                          {form.specialFeatures.filter(f => !specialFeatureOptions.find(o => o.value === f)).map(f => (
                            <Badge key={f} variant="outline" className="gap-1.5 pr-1.5 text-xs capitalize border-violet-500/30 bg-violet-500/5">
                              {f.replace(/_/g, ' ')}
                              <button type="button" onClick={() => patch({ specialFeatures: form.specialFeatures.filter(x => x !== f) })} className="hover:text-destructive transition-colors"><X className="size-3" /></button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2.5 pt-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Add Custom</p>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setCustomInputs(p => [...p, ''])} disabled={form.specialFeatures.length >= 20}
                          className="gap-1.5 text-xs h-7 text-primary hover:text-primary"><Plus className="size-3.5" /> Add</Button>
                      </div>
                      {customInputs.map((v, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input value={v} onChange={e => setCustomInputs(p => p.map((x, i) => i === idx ? e.target.value : x))}
                            placeholder="e.g. Satellite GPS" className={cn(inp, 'flex-1')}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (addCustomFeature(customInputs[idx])) setCustomInputs(p => p.length === 1 ? [''] : p.filter((_, i) => i !== idx)); } }} />
                          <Button type="button" variant="outline" size="icon" className="size-11 shrink-0 rounded-xl"
                            onClick={() => { if (addCustomFeature(customInputs[idx])) setCustomInputs(p => p.length === 1 ? [''] : p.filter((_, i) => i !== idx)); }}
                            disabled={!v.trim()}><Plus className="size-4" /></Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center justify-between">
                  <Button variant="ghost" onClick={() => setNav('specs')} className="gap-1.5 text-muted-foreground rounded-xl"><ArrowLeft className="size-4" /> Back</Button>
                  <Button onClick={handleSave} disabled={saving} className="gap-2 bg-linear-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-xl rounded-xl font-extrabold">
                    {saving ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Save Equipment
                  </Button>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
          <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 gap-0">
            <DialogHeader className="p-5 pb-3 shrink-0">
              <DialogTitle className="text-xl font-black">Select Trailer Type</DialogTitle>
              <p className="text-xs text-muted-foreground">Choose the trailer that matches your rig</p>
            </DialogHeader>
            <div className="overflow-x-auto border-b border-border/20 shrink-0" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="flex px-5 min-w-max">
                {TRAILER_CATEGORIES.map(c => {
                  const ct = TH[c.id] || TH.open;
                  const a = dialogCategory === c.id;
                  return (
                    <button key={c.id} type="button" onClick={() => setDialogCategory(c.id)}
                      className={cn('flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wide whitespace-nowrap border-b-2 transition-all',
                        a ? cn('border-current bg-primary/5', ct.text) : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40')}>
                      {c.label}
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full', a ? 'bg-primary/15' : 'bg-muted')}>
                        {trailerTypeOptions.filter(t => t.category === c.id).length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <AnimatePresence mode="wait">
                <motion.div key={dialogCategory} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
                  {trailerTypeOptions.filter(t => t.category === dialogCategory).map(opt => {
                    const s = form.trailerType === opt.value;
                    const ct = TH[opt.category] || TH.open;
                    return (
                      <button key={opt.value} type="button" onClick={() => { patch({ trailerType: opt.value }); setTypeDialogOpen(false); }}
                        className={cn('flex flex-col rounded-2xl border-2 transition-all text-left overflow-hidden group',
                          s ? cn('shadow-lg ring-2', ct.ring, ct.text, 'border-current') : 'border-border/20 hover:border-border/50 hover:shadow-md')}>
                        <div className={cn('w-full h-24 flex items-center justify-center relative', ct.bg)}>
                          {s && <div className={cn('absolute inset-0 opacity-10 bg-linear-to-r', ct.grad)} />}
                          <TSvg cat={opt.category} className="w-full h-full p-3 relative" />
                        </div>
                        <div className="p-3.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-black">{opt.label}</span>
                            {s && <CheckCircle2 className={cn('size-5 shrink-0', ct.text)} />}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{opt.description}</p>
                          <Badge variant="outline" className="mt-2 text-[10px] gap-1 font-semibold h-5"><Hash className="size-2.5" />{opt.capacity}</Badge>
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </DialogContent>
        </Dialog>

      </motion.div>
    </div>
  );
};
