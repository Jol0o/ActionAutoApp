'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { apiClient } from '@/lib/api-client';
import { DriverProfile, ComplianceDocument, ComplianceDocumentType, VerificationStatus } from '@/types/driver-profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2, Shield, ArrowLeft, Upload, Trash2, FileText, AlertTriangle,
  CheckCircle2, Clock, Eye, Lock, ShieldCheck, ShieldAlert, Info, X,
  CircleAlert, Save, Fingerprint, UserCheck, FileWarning,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { REQUIRED_DOCUMENTS, documentTypeOptions, US_STATES } from './driver-profile-constants';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.05 } } };

const getExpirationStatus = (dateStr?: string) => {
  if (!dateStr) return { status: 'missing', label: 'Not Set', color: 'text-muted-foreground', bg: 'bg-muted/40' };
  const date = new Date(dateStr);
  const now = new Date();
  const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0) return { status: 'expired', label: `Expired ${Math.abs(daysUntil)}d ago`, color: 'text-red-600', bg: 'bg-red-500/10' };
  if (daysUntil <= 30) return { status: 'warning', label: `Expires in ${daysUntil}d`, color: 'text-amber-600', bg: 'bg-amber-500/10' };
  if (daysUntil <= 90) return { status: 'soon', label: `${daysUntil}d remaining`, color: 'text-yellow-600', bg: 'bg-yellow-500/10' };
  return { status: 'valid', label: `Valid — ${daysUntil}d`, color: 'text-emerald-600', bg: 'bg-emerald-500/10' };
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    timeZone: 'America/Denver',
  });
};

export const DocumentsPage: React.FC = () => {
  const { getToken } = useAuth();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [uploadTargetType, setUploadTargetType] = useState<string>('drivers_license');

  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseState, setLicenseState] = useState('');
  const [licenseExp, setLicenseExp] = useState('');
  const [medicalExp, setMedicalExp] = useState('');
  const [insuranceExp, setInsuranceExp] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('');

  const [uploadType, setUploadType] = useState('drivers_license');
  const [uploadLabel, setUploadLabel] = useState('');
  const [uploadExpiry, setUploadExpiry] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [ssnLast4, setSsnLast4] = useState('');
  const [bgCheckConsent, setBgCheckConsent] = useState(false);
  const [verificationAgreement, setVerificationAgreement] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('not_started');
  const [savingIdentity, setSavingIdentity] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await apiClient.get('/api/driver-profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.data;
      if (data) {
        setProfile(data);
        setLicenseNumber(data.driversLicenseNumber || '');
        setLicenseState(data.licenseState || '');
        setLicenseExp(data.licenseExpirationDate?.substring(0, 10) || '');
        setMedicalExp(data.medicalCardExpirationDate?.substring(0, 10) || '');
        setInsuranceExp(data.insuranceExpirationDate?.substring(0, 10) || '');
        setInsuranceProvider(data.insuranceProvider || '');
        setInsurancePolicyNumber(data.insurancePolicyNumber || '');
        setSsnLast4(data.ssnLast4 || '');
        setBgCheckConsent(!!data.backgroundCheckConsent);
        setVerificationAgreement(!!data.verificationAgreement);
        setVerificationStatus(data.verificationStatus || 'not_started');
      }
    } catch {
      toast.error('Failed to load document data');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSaveCompliance = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      const res = await apiClient.patch('/api/driver-profile/compliance', {
        driversLicenseNumber: licenseNumber.trim(),
        licenseState,
        licenseExpirationDate: licenseExp || undefined,
        medicalCardExpirationDate: medicalExp || undefined,
        insuranceExpirationDate: insuranceExp || undefined,
        insuranceProvider: insuranceProvider.trim(),
        insurancePolicyNumber: insurancePolicyNumber.trim(),
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.data) setProfile(res.data.data);
      toast.success('Compliance information saved');
    } catch {
      toast.error('Failed to save compliance info');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIdentity = async () => {
    if (ssnLast4.replace(/\D/g, '').length !== 4) {
      toast.error('Please enter exactly 4 digits for SSN');
      return;
    }
    setSavingIdentity(true);
    try {
      const token = await getToken();
      const res = await apiClient.patch('/api/driver-profile/identity-verification', {
        ssnLast4: ssnLast4.replace(/\D/g, ''),
        backgroundCheckConsent: bgCheckConsent || undefined,
        verificationAgreement: verificationAgreement || undefined,
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.data) {
        setProfile(res.data.data);
        setVerificationStatus(res.data.data.verificationStatus || 'not_started');
      }
      toast.success('Identity verification updated');
    } catch {
      toast.error('Failed to save identity verification');
    } finally {
      setSavingIdentity(false);
    }
  };

  const openUploadFor = (type: string) => {
    setUploadTargetType(type);
    setUploadType(type);
    const reqDoc = REQUIRED_DOCUMENTS.find(d => d.type === type);
    setUploadLabel(reqDoc?.label || '');
    setUploadExpiry('');
    setUploadFile(null);
    setShowUploadDialog(true);
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadLabel.trim()) {
      toast.error('Please select a file and provide a label');
      return;
    }
    if (uploadFile.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      return;
    }
    setUploading(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('document', uploadFile);
      formData.append('type', uploadType);
      formData.append('label', uploadLabel.trim());
      if (uploadExpiry) formData.append('expiresAt', uploadExpiry);
      const res = await apiClient.post('/api/driver-profile/documents', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.data) setProfile(res.data.data);
      toast.success('Document uploaded — pending verification');
      setShowUploadDialog(false);
      setUploadFile(null);
      setUploadLabel('');
      setUploadExpiry('');
    } catch {
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    setDeletingId(docId);
    try {
      const token = await getToken();
      const res = await apiClient.delete(`/api/driver-profile/documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.data) setProfile(res.data.data);
      toast.success('Document removed');
      setShowDeleteConfirm(null);
    } catch {
      toast.error('Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  const documents = profile?.documents || [];

  const getDocStatus = (type: string) => {
    const docs = documents.filter((d: ComplianceDocument) => d.type === type);
    if (docs.length === 0) return 'missing';
    const hasVerified = docs.some((d: ComplianceDocument) => d.verified);
    if (hasVerified) return 'verified';
    const hasRejected = docs.some((d: ComplianceDocument) => d.reviewStatus === 'rejected');
    if (hasRejected) return 'rejected';
    return 'pending';
  };

  const requiredDocs = REQUIRED_DOCUMENTS.filter(d => d.required);
  const optionalDocs = REQUIRED_DOCUMENTS.filter(d => !d.required);
  const verifiedCount = requiredDocs.filter(d => getDocStatus(d.type) === 'verified').length;
  const uploadedCount = requiredDocs.filter(d => getDocStatus(d.type) !== 'missing').length;
  const verificationPercent = Math.round((verifiedCount / requiredDocs.length) * 100);
  const uploadPercent = Math.round((uploadedCount / requiredDocs.length) * 100);

  const licenseStatus = getExpirationStatus(licenseExp);
  const medicalStatus = getExpirationStatus(medicalExp);
  const insuranceStatus = getExpirationStatus(insuranceExp);

  const overallStatus = verificationStatus === 'verified'
    ? 'fully_verified'
    : verificationStatus === 'under_review'
      ? 'under_review'
      : verificationStatus === 'rejected'
        ? 'rejected'
        : uploadedCount === requiredDocs.length && profile?.ssnLast4 && profile?.backgroundCheckConsent
          ? 'under_review'
          : 'incomplete';

  const identityDone = !!profile?.ssnLast4 && !!profile?.backgroundCheckConsent;
  const agreementDone = !!profile?.verificationAgreement;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="size-10 animate-spin text-emerald-600" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Documents</p>
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
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
                <Lock className="size-6 text-emerald-600" /> Driver Verification
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">Complete all required documents to get verified for dispatch</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className={cn(
            "border-2 overflow-hidden",
            overallStatus === 'fully_verified' ? "border-emerald-500/50 bg-emerald-500/5" :
              overallStatus === 'under_review' ? "border-amber-500/50 bg-amber-500/5" :
                "border-border/50"
          )}>
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={cn(
                  "size-14 rounded-2xl flex items-center justify-center",
                  overallStatus === 'fully_verified' ? "bg-emerald-500/10" :
                    overallStatus === 'under_review' ? "bg-amber-500/10" : "bg-muted/40"
                )}>
                  {overallStatus === 'fully_verified' ? <ShieldCheck className="size-7 text-emerald-600" /> :
                    overallStatus === 'under_review' ? <Clock className="size-7 text-amber-600" /> :
                      <ShieldAlert className="size-7 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-extrabold">
                    {overallStatus === 'fully_verified' ? 'Fully Verified' :
                      overallStatus === 'under_review' ? 'Under Review' : 'Verification Incomplete'}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {verifiedCount}/{requiredDocs.length} documents verified · {uploadedCount}/{requiredDocs.length} uploaded
                  </p>
                </div>
                <div className="text-right hidden sm:block">
                  <span className="text-3xl font-black tabular-nums text-emerald-600">{verificationPercent}%</span>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Verified</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">Upload Progress</span>
                  <span className="font-bold">{uploadPercent}%</span>
                </div>
                <Progress value={uploadPercent} className="h-2" />
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">Verification Progress</span>
                  <span className="font-bold text-emerald-600">{verificationPercent}%</span>
                </div>
                <Progress value={verificationPercent} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {[
              { step: 1, label: 'Identity', desc: identityDone ? 'Completed' : 'SSN & Background', done: identityDone, active: !identityDone },
              { step: 2, label: 'Documents', desc: `${uploadedCount}/${requiredDocs.length} uploaded`, done: uploadedCount === requiredDocs.length, active: identityDone && uploadedCount < requiredDocs.length },
              { step: 3, label: 'Agreement', desc: agreementDone ? 'Accepted' : 'Terms & consent', done: agreementDone, active: uploadedCount === requiredDocs.length && !agreementDone },
              { step: 4, label: 'Verified', desc: verifiedCount === requiredDocs.length ? 'Cleared' : 'Admin review', done: verifiedCount === requiredDocs.length, active: false },
            ].map((s) => (
              <motion.div
                key={s.step}
                whileHover={{ scale: 1.02 }}
                className={cn(
                  "relative p-4 rounded-2xl border-2 text-center transition-all",
                  s.done ? "border-emerald-500/50 bg-emerald-500/5" :
                    s.active ? "border-amber-500/50 bg-amber-500/5" :
                      "border-border/30 bg-muted/10"
                )}
              >
                <div className={cn(
                  "size-10 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-black",
                  s.done ? "bg-emerald-500 text-white" :
                    s.active ? "bg-amber-500 text-white" :
                      "bg-muted text-muted-foreground"
                )}>
                  {s.done ? <CheckCircle2 className="size-5" /> : s.step}
                </div>
                <p className="text-xs font-bold">{s.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="border-red-500/20 bg-red-500/5 overflow-hidden">
            <CardContent className="p-4 flex items-start gap-3">
              <CircleAlert className="size-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-700 dark:text-red-400">Security Notice</p>
                <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1 leading-relaxed">
                  All documents are encrypted and stored in compliance with FMCSA regulations.
                  Each document requires admin verification before you can be dispatched.
                  Falsified documents will result in immediate account termination and may be reported to authorities.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="border-border/50 shadow-md overflow-hidden">
            <CardHeader className="pb-4 border-b border-border/10 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                  <Fingerprint className="size-6 text-violet-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-extrabold">Identity Verification</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Required for background check — your SSN is encrypted and never stored in full</p>
                </div>
                {identityDone && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 gap-1">
                    <CheckCircle2 className="size-3" /> Completed
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Last 4 of SSN</Label>
                  <Input
                    value={ssnLast4}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setSsnLast4(v);
                    }}
                    placeholder="••••"
                    maxLength={4}
                    className="h-12 text-center text-2xl font-mono tracking-[0.5em] max-w-[200px]"
                    inputMode="numeric"
                    disabled={!!profile?.ssnLast4}
                  />
                  <p className="text-[10px] text-muted-foreground">Used solely for identity verification — encrypted at rest</p>
                </div>
                <div className="flex flex-col justify-center gap-4">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={bgCheckConsent}
                      onChange={(e) => setBgCheckConsent(e.target.checked)}
                      disabled={!!profile?.backgroundCheckConsent}
                      className="mt-1 size-5 rounded border-2 border-border accent-emerald-600"
                    />
                    <div>
                      <span className="text-sm font-semibold group-hover:text-emerald-600 transition-colors">Background Check Authorization</span>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                        I authorize Action Auto to conduct a background check in accordance with the Fair Credit Reporting Act (FCRA).
                      </p>
                    </div>
                  </label>
                </div>
              </div>
              {!identityDone && (
                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveIdentity}
                    disabled={savingIdentity || ssnLast4.replace(/\D/g, '').length !== 4 || !bgCheckConsent}
                    className="gap-2"
                  >
                    {savingIdentity ? <Loader2 className="size-4 animate-spin" /> : <Fingerprint className="size-4" />}
                    Verify Identity
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="border-border/50 shadow-md overflow-hidden">
            <CardHeader className="pb-4 border-b border-border/10 bg-gradient-to-br from-blue-500/5 to-indigo-500/5">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <Shield className="size-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-extrabold">License & Insurance</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Keep credentials current — expired info blocks dispatch</p>
                </div>
                {profile?.isComplianceExpired && (
                  <Badge variant="destructive" className="ml-auto gap-1 text-xs">
                    <AlertTriangle className="size-3" /> Expired
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CDL Number</Label>
                  <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="DL-XXXXXXXX" className="h-11 font-mono" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">License State</Label>
                  <Select value={licenseState} onValueChange={setLicenseState}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent>
                      {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">License Expiration</Label>
                  <Input type="date" value={licenseExp} onChange={(e) => setLicenseExp(e.target.value)} className="h-11" />
                  <p className={cn("text-[10px] font-bold", licenseStatus.color)}>{licenseStatus.label}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Medical Card Expiration</Label>
                  <Input type="date" value={medicalExp} onChange={(e) => setMedicalExp(e.target.value)} className="h-11" />
                  <p className={cn("text-[10px] font-bold", medicalStatus.color)}>{medicalStatus.label}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Insurance Expiration</Label>
                  <Input type="date" value={insuranceExp} onChange={(e) => setInsuranceExp(e.target.value)} className="h-11" />
                  <p className={cn("text-[10px] font-bold", insuranceStatus.color)}>{insuranceStatus.label}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Insurance Provider</Label>
                  <Input value={insuranceProvider} onChange={(e) => setInsuranceProvider(e.target.value)} placeholder="e.g. Progressive" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Policy Number</Label>
                  <Input value={insurancePolicyNumber} onChange={(e) => setInsurancePolicyNumber(e.target.value)} placeholder="e.g. POL-123456" className="h-11 font-mono" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveCompliance} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Save Compliance Info
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="border-border/50 shadow-md overflow-hidden">
            <CardHeader className="pb-4 border-b border-border/10 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <FileText className="size-6 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-extrabold">Required Documents</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Upload each document for admin verification</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-3">
              {requiredDocs.map((reqDoc, idx) => {
                const status = getDocStatus(reqDoc.type);
                const uploadedDocs = documents.filter((d: ComplianceDocument) => d.type === reqDoc.type);
                return (
                  <motion.div
                    key={reqDoc.type}
                    variants={fadeUp}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all",
                      status === 'verified' ? "border-emerald-500/30 bg-emerald-500/5" :
                        status === 'rejected' ? "border-red-500/30 bg-red-500/5" :
                          status === 'pending' ? "border-amber-500/30 bg-amber-500/5" :
                            "border-border/40 hover:border-border"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center size-12 rounded-2xl bg-white dark:bg-gray-900 border border-border/50 text-2xl shrink-0">
                        {status === 'verified' ? <CheckCircle2 className="size-6 text-emerald-500" /> :
                          status === 'rejected' ? <FileWarning className="size-6 text-red-500" /> :
                            status === 'pending' ? <Clock className="size-6 text-amber-500" /> :
                              <span>{reqDoc.icon}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold">{reqDoc.label}</h3>
                          <Badge className={cn(
                            "text-[10px]",
                            status === 'verified' ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" :
                              status === 'pending' ? "bg-amber-500/10 text-amber-600 border-amber-200" :
                                status === 'rejected' ? "bg-red-500/10 text-red-600 border-red-200" :
                                  "bg-red-500/10 text-red-600 border-red-200"
                          )}>
                            {status === 'verified' ? 'Verified' : status === 'pending' ? 'Under Review' : status === 'rejected' ? 'Rejected' : 'Required'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{reqDoc.description}</p>
                        {uploadedDocs.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {uploadedDocs.map((doc: ComplianceDocument) => {
                              const docExpStatus = doc.expiresAt ? getExpirationStatus(doc.expiresAt) : null;
                              return (
                                <div key={doc._id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/50 dark:bg-gray-900/50 border border-border/30 group">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <FileText className="size-4 text-muted-foreground shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold truncate">{doc.label}</p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] text-muted-foreground">{doc.fileName} · {formatFileSize(doc.fileSize)}</span>
                                        {doc.verified && doc.verifiedAt && (
                                          <span className="text-[10px] text-emerald-600 font-semibold">Verified {formatDate(doc.verifiedAt)}</span>
                                        )}
                                        {doc.reviewStatus === 'rejected' && (
                                          <span className="text-[10px] text-red-600 font-semibold">Rejected{doc.rejectedAt ? ` ${formatDate(doc.rejectedAt)}` : ''}</span>
                                        )}
                                        {docExpStatus && <span className={cn("text-[10px] font-semibold", docExpStatus.color)}>{docExpStatus.label}</span>}
                                      </div>
                                      {doc.reviewStatus === 'rejected' && doc.rejectionReason && (
                                        <div className="flex items-start gap-1.5 mt-1.5 p-2 rounded-lg bg-red-500/5 border border-red-200/30">
                                          <FileWarning className="size-3 text-red-500 shrink-0 mt-0.5" />
                                          <p className="text-[11px] text-red-600 dark:text-red-400 leading-relaxed">{doc.rejectionReason}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {doc.fileUrl && (
                                      <Button size="icon" variant="ghost" className="size-7" asChild>
                                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"><Eye className="size-3.5" /></a>
                                      </Button>
                                    )}
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="size-7 text-destructive hover:text-destructive"
                                      onClick={() => setShowDeleteConfirm(doc._id)}
                                      disabled={deletingId === doc._id}
                                    >
                                      {deletingId === doc._id ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3.5" />}
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <Button
                        variant={status === 'missing' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => openUploadFor(reqDoc.type)}
                        className="gap-1.5 shrink-0"
                        disabled={documents.length >= 20}
                      >
                        <Upload className="size-3.5" />
                        {status === 'missing' ? 'Upload' : 'Re-upload'}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {optionalDocs.length > 0 && (
          <motion.div variants={fadeUp}>
            <Card className="border-border/50 shadow-md overflow-hidden">
              <CardHeader className="pb-4 border-b border-border/10">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-2xl bg-gray-500/10 flex items-center justify-center">
                    <Info className="size-6 text-gray-500" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-extrabold">Optional Documents</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Additional documents that strengthen your profile</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-3">
                {optionalDocs.map((reqDoc) => {
                  const status = getDocStatus(reqDoc.type);
                  const uploadedDocs = documents.filter((d: ComplianceDocument) => d.type === reqDoc.type);
                  return (
                    <div
                      key={reqDoc.type}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all",
                        status === 'verified' ? "border-emerald-500/30 bg-emerald-500/5" :
                          status === 'pending' ? "border-amber-500/30 bg-amber-500/5" :
                            "border-border/30"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{reqDoc.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold">{reqDoc.label}</h3>
                            <Badge variant="outline" className="text-[10px]">Optional</Badge>
                            {status !== 'missing' && (
                              <Badge className={cn(
                                "text-[10px]",
                                status === 'verified' ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" :
                                  "bg-amber-500/10 text-amber-600 border-amber-200"
                              )}>
                                {status === 'verified' ? 'Verified' : 'Under Review'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{reqDoc.description}</p>
                          {uploadedDocs.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {uploadedDocs.map((doc: ComplianceDocument) => (
                                <Badge key={doc._id} variant="outline" className="gap-1 text-[10px]">
                                  <FileText className="size-2.5" />
                                  {doc.fileName}
                                  <button type="button" onClick={() => setShowDeleteConfirm(doc._id)} className="hover:text-destructive">
                                    <X className="size-2.5" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => openUploadFor(reqDoc.type)} className="gap-1.5 shrink-0" disabled={documents.length >= 20}>
                          <Upload className="size-3.5" /> Upload
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div variants={fadeUp}>
          <Card className={cn(
            "border-2 shadow-md overflow-hidden",
            agreementDone ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/50"
          )}>
            <CardHeader className="pb-4 border-b border-border/10 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <UserCheck className="size-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-extrabold">Verification Agreement</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Accept terms to submit your profile for admin review</p>
                </div>
                {agreementDone && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 gap-1">
                    <CheckCircle2 className="size-3" /> Accepted
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/30 space-y-3">
                <p className="text-sm font-bold">By accepting this agreement, you acknowledge that:</p>
                <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2"><span className="size-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" /> All information and documents provided are accurate, authentic, and unaltered.</li>
                  <li className="flex items-start gap-2"><span className="size-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" /> You authorize Action Auto to verify documents with issuing agencies (DMV, FMCSA, insurance carriers).</li>
                  <li className="flex items-start gap-2"><span className="size-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" /> Falsified or fraudulent documents will result in immediate termination and may be reported to law enforcement.</li>
                  <li className="flex items-start gap-2"><span className="size-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" /> You are responsible for keeping documents current and notifying Action Auto of any changes.</li>
                  <li className="flex items-start gap-2"><span className="size-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" /> You consent to periodic re-verification of credentials as required by federal and state regulations.</li>
                </ul>
              </div>
              {!agreementDone ? (
                <div className="flex items-center justify-between gap-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={verificationAgreement}
                      onChange={(e) => setVerificationAgreement(e.target.checked)}
                      className="size-5 rounded border-2 border-border accent-emerald-600"
                    />
                    <span className="text-sm font-semibold group-hover:text-emerald-600 transition-colors">I accept the verification agreement</span>
                  </label>
                  <Button
                    onClick={handleSaveIdentity}
                    disabled={savingIdentity || !verificationAgreement || !identityDone || uploadedCount < requiredDocs.length}
                    className="gap-2"
                  >
                    {savingIdentity ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                    Submit for Review
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="size-5" />
                  <span className="text-sm font-bold">Agreement accepted — your profile is under review</span>
                </div>
              )}
              {(!identityDone || uploadedCount < requiredDocs.length) && !agreementDone && (
                <p className="text-[10px] text-muted-foreground">
                  {!identityDone ? 'Complete identity verification first.' : `Upload all ${requiredDocs.length} required documents to proceed.`}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="border-border/50 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Lock className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-muted-foreground">How Verification Works</p>
                  <ol className="text-[11px] text-muted-foreground mt-2 space-y-1.5 list-decimal list-inside">
                    <li>Upload each required document — photos or PDF scans accepted</li>
                    <li>Our admin team reviews each document (typically within 24 hours)</li>
                    <li>You will be notified when documents are approved or if re-submission is needed</li>
                    <li>Once all required documents are verified, you are cleared for dispatch</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </motion.div>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="size-5 text-emerald-600" /> Upload Document
            </DialogTitle>
            <DialogDescription>Upload compliance documents securely. Images and PDFs up to 5MB.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={uploadType} onValueChange={setUploadType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{documentTypeOptions.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Label</Label>
              <Input value={uploadLabel} onChange={(e) => setUploadLabel(e.target.value)} placeholder="e.g. CDL Front" maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>Expiration Date (if applicable)</Label>
              <Input type="date" value={uploadExpiry} onChange={(e) => setUploadExpiry(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>File</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                className="hidden"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all hover:border-emerald-500/50",
                  uploadFile ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/50"
                )}
              >
                {uploadFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="size-5 text-emerald-500" />
                    <span className="text-sm font-semibold truncate">{uploadFile.name}</span>
                    <Badge variant="outline" className="text-[10px]">{formatFileSize(uploadFile.size)}</Badge>
                  </div>
                ) : (
                  <>
                    <Upload className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground font-semibold">Click to browse or drag & drop</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">JPG, PNG, WebP, or PDF — Max 5MB</p>
                  </>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={uploading || !uploadFile || !uploadLabel.trim()} className="gap-2">
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              Upload Securely
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" /> Delete Document
            </DialogTitle>
            <DialogDescription>This will permanently remove this document. You may need to re-upload for verification.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
              disabled={!!deletingId}
              className="gap-2"
            >
              {deletingId ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
