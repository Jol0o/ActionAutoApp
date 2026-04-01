'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { apiClient } from '@/lib/api-client';
import { DriverProfile } from '@/types/driver-profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Loader2, Truck, Save, Wrench, Hash, Ruler, Calendar, Star, CheckCircle2,
  ArrowLeft, Plus, X, Gauge, Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { trailerTypeOptions, specialFeatureOptions, TRAILER_CATEGORIES } from './driver-profile-constants';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

export const EquipmentPage: React.FC = () => {
  const { getToken } = useAuth();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [truckMake, setTruckMake] = useState('');
  const [truckModel, setTruckModel] = useState('');
  const [truckYear, setTruckYear] = useState<number | undefined>();
  const [dotNumber, setDotNumber] = useState('');
  const [mcNumber, setMcNumber] = useState('');
  const [vin, setVin] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [truckColor, setTruckColor] = useState('');
  const [gvwr, setGvwr] = useState<number | undefined>();
  const [trailerAxles, setTrailerAxles] = useState(2);
  const [trailerGvwr, setTrailerGvwr] = useState<number | undefined>();
  const [engineType, setEngineType] = useState('');
  const [trailerType, setTrailerType] = useState('open_3car_wedge');
  const [maxVehicleCapacity, setMaxVehicleCapacity] = useState(1);
  const [trailerLength, setTrailerLength] = useState<number | undefined>();
  const [features, setFeatures] = useState<string[]>([]);
  const [customFeature, setCustomFeature] = useState('');
  const [activeCategory, setActiveCategory] = useState('open');

  const fetchProfile = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await apiClient.get('/api/driver-profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.data;
      if (data) {
        setProfile(data);
        setTruckMake(data.truckMake || '');
        setTruckModel(data.truckModel || '');
        setTruckYear(data.truckYear);
        setDotNumber(data.dotNumber || '');
        setMcNumber(data.mcNumber || '');
        setVin(data.vin || '');
        setPlateNumber(data.plateNumber || '');
        setTruckColor(data.truckColor || '');
        setGvwr(data.gvwr);
        setTrailerAxles(data.trailerAxles || 2);
        setTrailerGvwr(data.trailerGvwr);
        setEngineType(data.engineType || '');
        setTrailerType(data.trailerType || 'open_3car_wedge');
        setMaxVehicleCapacity(data.maxVehicleCapacity || 1);
        setTrailerLength(data.trailerLength);
        setFeatures(data.specialFeatures || []);
        const match = trailerTypeOptions.find(t => t.value === data.trailerType);
        if (match) setActiveCategory(match.category);
      }
    } catch {
      toast.error('Failed to load equipment data');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      const res = await apiClient.patch('/api/driver-profile/equipment', {
        trailerType,
        maxVehicleCapacity,
        truckMake: truckMake.trim(),
        truckModel: truckModel.trim(),
        truckYear: truckYear || undefined,
        trailerLength: trailerLength || undefined,
        dotNumber: dotNumber.trim(),
        mcNumber: mcNumber.trim(),
        vin: vin.trim(),
        plateNumber: plateNumber.trim(),
        truckColor: truckColor.trim(),
        gvwr: gvwr || undefined,
        trailerAxles,
        trailerGvwr: trailerGvwr || undefined,
        engineType: engineType.trim(),
        specialFeatures: features,
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.data) setProfile(res.data.data);
      toast.success('Equipment saved successfully');
    } catch {
      toast.error('Failed to save equipment');
    } finally {
      setSaving(false);
    }
  };

  const toggleFeature = (val: string) => {
    setFeatures(prev => prev.includes(val) ? prev.filter(f => f !== val) : [...prev, val]);
  };

  const addCustomFeature = () => {
    const trimmed = customFeature.trim().toLowerCase().replace(/\s+/g, '_');
    if (trimmed && !features.includes(trimmed) && features.length < 20) {
      setFeatures([...features, trimmed]);
      setCustomFeature('');
    }
  };

  const removeFeature = (val: string) => setFeatures(features.filter(f => f !== val));

  const selectedTrailer = trailerTypeOptions.find(t => t.value === trailerType);
  const completionFields = [truckMake, truckModel, dotNumber || mcNumber, trailerType, maxVehicleCapacity > 0, truckYear, vin || plateNumber, engineType, trailerLength, trailerGvwr];
  const completionPercent = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);
  const filteredTrailers = trailerTypeOptions.filter(t => t.category === activeCategory);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="size-10 animate-spin text-emerald-600" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Equipment</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
      <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-6">

        <motion.div variants={fadeUp} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/driver/profile" className="p-2 rounded-xl hover:bg-muted/50 transition-colors">
              <ArrowLeft className="size-5" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Equipment & Rig</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Manage your truck, trailer, and capabilities</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2 shadow-lg">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save All
          </Button>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="border-border/50 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Equipment Completion</span>
                <span className="text-sm font-extrabold text-emerald-600">{completionPercent}%</span>
              </div>
              <Progress value={completionPercent} className="h-2" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="border-border/50 shadow-md overflow-hidden">
            <CardHeader className="pb-4 border-b border-border/10 bg-gradient-to-br from-blue-500/5 to-indigo-500/5">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <Truck className="size-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-extrabold">Truck & Authority</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Primary vehicle and operating authority</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Make</Label>
                  <Input value={truckMake} onChange={(e) => setTruckMake(e.target.value)} placeholder="e.g. Peterbilt" className="h-12 text-base font-medium" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Model</Label>
                  <Input value={truckModel} onChange={(e) => setTruckModel(e.target.value)} placeholder="e.g. 389" className="h-12 text-base font-medium" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="size-3" /> Year
                  </Label>
                  <Input type="number" min={1990} max={2030} value={truckYear || ''} onChange={(e) => setTruckYear(parseInt(e.target.value) || undefined)} placeholder="2024" className="h-12 text-base font-medium" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">VIN</Label>
                  <Input value={vin} onChange={(e) => setVin(e.target.value.toUpperCase())} placeholder="e.g. 1HGCM82633A004352" maxLength={17} className="h-12 text-base font-mono tracking-wide" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">License Plate</Label>
                  <Input value={plateNumber} onChange={(e) => setPlateNumber(e.target.value.toUpperCase())} placeholder="e.g. ABC-1234" maxLength={15} className="h-12 text-base font-mono tracking-wide" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Truck Color</Label>
                  <Input value={truckColor} onChange={(e) => setTruckColor(e.target.value)} placeholder="e.g. White" className="h-12 text-base font-medium" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Engine Type</Label>
                  <Input value={engineType} onChange={(e) => setEngineType(e.target.value)} placeholder="e.g. Cummins X15, Detroit DD15" className="h-12 text-base font-medium" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Truck GVWR (lbs)</Label>
                  <Input type="number" min={0} max={100000} value={gvwr || ''} onChange={(e) => setGvwr(parseInt(e.target.value) || undefined)} placeholder="e.g. 26000" className="h-12 text-base font-medium" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/10">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Shield className="size-3" /> DOT Number
                  </Label>
                  <Input value={dotNumber} onChange={(e) => setDotNumber(e.target.value)} placeholder="e.g. 1234567" className="h-12 text-base font-mono tracking-wide" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Shield className="size-3" /> MC Number
                  </Label>
                  <Input value={mcNumber} onChange={(e) => setMcNumber(e.target.value)} placeholder="e.g. MC-123456" className="h-12 text-base font-mono tracking-wide" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="border-border/50 shadow-md overflow-hidden">
            <CardHeader className="pb-4 border-b border-border/10 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <Wrench className="size-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-extrabold">Trailer Configuration</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Select trailer type — this determines which loads match you</p>
                </div>
                {selectedTrailer && (
                  <div className="hidden sm:flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-2xl">{selectedTrailer.emoji}</span>
                    <div>
                      <p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">{selectedTrailer.label}</p>
                      <p className="text-[10px] text-emerald-600/70 font-semibold">{selectedTrailer.capacity}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex overflow-x-auto scrollbar-hide border-b border-border/10 bg-muted/20">
                {TRAILER_CATEGORIES.map((cat) => {
                  const count = trailerTypeOptions.filter(t => t.category === cat.id).length;
                  const hasSelection = trailerTypeOptions.some(t => t.category === cat.id && t.value === trailerType);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-3.5 text-xs font-bold uppercase tracking-wide whitespace-nowrap border-b-2 transition-all shrink-0",
                        activeCategory === cat.id
                          ? "border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-emerald-500/5"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      )}
                    >
                      <span className="text-base">{cat.icon}</span>
                      {cat.label}
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", activeCategory === cat.id ? "bg-emerald-500/20" : "bg-muted")}>{count}</span>
                      {hasSelection && activeCategory !== cat.id && <CheckCircle2 className="size-3.5 text-emerald-500" />}
                    </button>
                  );
                })}
              </div>
              <div className="p-5 sm:p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCategory}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    {filteredTrailers.map((opt) => (
                      <motion.button
                        key={opt.value}
                        type="button"
                        onClick={() => setTrailerType(opt.value)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "flex items-start gap-4 p-5 rounded-2xl border-2 transition-all text-left",
                          trailerType === opt.value
                            ? "border-emerald-500 bg-emerald-500/5 shadow-lg ring-2 ring-emerald-500/20"
                            : "border-border/40 hover:border-border hover:shadow-sm"
                        )}
                      >
                        <div className={cn(
                          "size-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 transition-all",
                          trailerType === opt.value ? "bg-emerald-500/10 scale-105" : "bg-muted/40"
                        )}>
                          {opt.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-extrabold">{opt.label}</span>
                            {trailerType === opt.value && <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{opt.description}</p>
                          <Badge variant="outline" className="mt-2.5 text-xs gap-1 font-semibold">
                            <Hash className="size-2.5" /> {opt.capacity}
                          </Badge>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-border/50 shadow-md overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="size-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                    <Gauge className="size-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold">Max Capacity</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">{selectedTrailer?.capacity || 'Select trailer'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 justify-center">
                  <motion.button
                    type="button"
                    onClick={() => setMaxVehicleCapacity(Math.max(1, maxVehicleCapacity - 1))}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="size-14 rounded-2xl border-2 border-border/50 hover:border-amber-500 flex items-center justify-center text-2xl font-bold transition-colors hover:bg-amber-500/5"
                  >
                    −
                  </motion.button>
                  <div className="text-center min-w-[100px]">
                    <motion.span
                      key={maxVehicleCapacity}
                      initial={{ scale: 1.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-6xl font-black text-amber-600 tabular-nums block"
                    >
                      {maxVehicleCapacity}
                    </motion.span>
                    <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">Vehicles</p>
                  </div>
                  <motion.button
                    type="button"
                    onClick={() => setMaxVehicleCapacity(Math.min(12, maxVehicleCapacity + 1))}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="size-14 rounded-2xl border-2 border-border/50 hover:border-amber-500 flex items-center justify-center text-2xl font-bold transition-colors hover:bg-amber-500/5"
                  >
                    +
                  </motion.button>
                </div>
                <div className="mt-4 flex justify-center">
                  <div className="flex gap-1.5">
                    {Array.from({ length: 12 }, (_, i) => (
                      <motion.div
                        key={i}
                        initial={false}
                        animate={{ scale: i < maxVehicleCapacity ? 1 : 0.8, opacity: i < maxVehicleCapacity ? 1 : 0.3 }}
                        className={cn("size-2.5 rounded-full transition-colors", i < maxVehicleCapacity ? "bg-amber-500" : "bg-border")}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-md overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="size-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                    <Ruler className="size-6 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold">Trailer Length</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">Overall length in feet</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 justify-center">
                  <motion.button
                    type="button"
                    onClick={() => setTrailerLength(Math.max(0, (trailerLength || 0) - 1))}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="size-14 rounded-2xl border-2 border-border/50 hover:border-violet-500 flex items-center justify-center text-2xl font-bold transition-colors hover:bg-violet-500/5"
                  >
                    −
                  </motion.button>
                  <div className="text-center min-w-[100px]">
                    <motion.span
                      key={trailerLength}
                      initial={{ scale: 1.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-6xl font-black text-violet-600 tabular-nums block"
                    >
                      {trailerLength || 0}
                    </motion.span>
                    <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">Feet</p>
                  </div>
                  <motion.button
                    type="button"
                    onClick={() => setTrailerLength(Math.min(80, (trailerLength || 0) + 1))}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="size-14 rounded-2xl border-2 border-border/50 hover:border-violet-500 flex items-center justify-center text-2xl font-bold transition-colors hover:bg-violet-500/5"
                  >
                    +
                  </motion.button>
                </div>
                <div className="mt-4">
                  <div className="h-3 rounded-full bg-border/30 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
                      initial={false}
                      animate={{ width: `${((trailerLength || 0) / 80) * 100}%` }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                    <span>0 ft</span>
                    <span>80 ft</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="border-border/50 shadow-md overflow-hidden">
            <CardHeader className="pb-4 border-b border-border/10 bg-gradient-to-br from-rose-500/5 to-orange-500/5">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                  <Shield className="size-6 text-rose-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-extrabold">Trailer Specs</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Axle configuration and weight rating</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Axle Count</p>
                  <div className="flex items-center gap-4 justify-center">
                    <motion.button
                      type="button"
                      onClick={() => setTrailerAxles(Math.max(1, trailerAxles - 1))}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="size-12 rounded-2xl border-2 border-border/50 hover:border-rose-500 flex items-center justify-center text-xl font-bold transition-colors hover:bg-rose-500/5"
                    >
                      −
                    </motion.button>
                    <div className="text-center min-w-[80px]">
                      <motion.span
                        key={trailerAxles}
                        initial={{ scale: 1.3, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-5xl font-black text-rose-600 tabular-nums block"
                      >
                        {trailerAxles}
                      </motion.span>
                      <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-widest">Axles</p>
                    </div>
                    <motion.button
                      type="button"
                      onClick={() => setTrailerAxles(Math.min(10, trailerAxles + 1))}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="size-12 rounded-2xl border-2 border-border/50 hover:border-rose-500 flex items-center justify-center text-xl font-bold transition-colors hover:bg-rose-500/5"
                    >
                      +
                    </motion.button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Trailer GVWR (lbs)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100000}
                    value={trailerGvwr || ''}
                    onChange={(e) => setTrailerGvwr(parseInt(e.target.value) || undefined)}
                    placeholder="e.g. 14000"
                    className="h-12 text-base font-medium"
                  />
                  <p className="text-[10px] text-muted-foreground">Gross Vehicle Weight Rating of the trailer</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="border-border/50 shadow-md overflow-hidden">
            <CardHeader className="pb-4 border-b border-border/10 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                  <Star className="size-6 text-violet-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-extrabold">Special Features</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Capabilities and equipment on your rig</p>
                </div>
                <Badge variant="outline" className="text-xs">{features.length} selected</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {specialFeatureOptions.map((opt) => (
                  <motion.button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleFeature(opt.value)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      "flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left",
                      features.includes(opt.value)
                        ? "border-violet-500 bg-violet-500/5 shadow-sm"
                        : "border-border/40 hover:border-border"
                    )}
                  >
                    <span className="text-lg">{opt.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold truncate block">{opt.label}</span>
                    </div>
                    {features.includes(opt.value) && <CheckCircle2 className="size-4 text-violet-500 shrink-0" />}
                  </motion.button>
                ))}
              </div>

              {features.filter(f => !specialFeatureOptions.find(o => o.value === f)).length > 0 && (
                <div className="pt-3 border-t border-border/20">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Custom Features</p>
                  <div className="flex flex-wrap gap-2">
                    {features.filter(f => !specialFeatureOptions.find(o => o.value === f)).map((f) => (
                      <Badge key={f} variant="outline" className="gap-1.5 pr-1.5 text-xs capitalize">
                        {f.replace(/_/g, ' ')}
                        <button type="button" onClick={() => removeFeature(f)} className="hover:text-destructive transition-colors">
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <Input
                  value={customFeature}
                  onChange={(e) => setCustomFeature(e.target.value)}
                  placeholder="Add custom feature..."
                  maxLength={50}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomFeature())}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomFeature}
                  disabled={!customFeature.trim() || features.length >= 20}
                  className="gap-1.5 shrink-0"
                >
                  <Plus className="size-3.5" /> Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} className="flex justify-end pb-8">
          <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2 shadow-lg px-8">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save Equipment
          </Button>
        </motion.div>

      </motion.div>
    </div>
  );
};
