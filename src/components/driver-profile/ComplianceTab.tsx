'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2, Shield, Save, Upload, Trash2, FileText,
  AlertTriangle, CheckCircle2, Clock, Eye, Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { DriverProfile, ComplianceDocument } from '@/types/driver-profile';
import { documentTypeOptions, US_STATES } from './driver-profile-constants';
import { cn } from '@/lib/utils';

interface ComplianceTabProps {
  profile: DriverProfile | null;
  onSave: (data: any) => Promise<void>;
  onUploadDocument: (formData: FormData) => Promise<void>;
  onDeleteDocument: (documentId: string) => Promise<void>;
}

const getExpirationStatus = (dateStr?: string) => {
  if (!dateStr) return { status: 'missing', label: 'Not Set', color: 'text-muted-foreground' };
  const date = new Date(dateStr);
  const now = new Date();
  const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0) return { status: 'expired', label: `Expired ${Math.abs(daysUntil)}d ago`, color: 'text-red-600' };
  if (daysUntil <= 30) return { status: 'warning', label: `Expires in ${daysUntil}d`, color: 'text-amber-600' };
  if (daysUntil <= 90) return { status: 'soon', label: `Expires in ${daysUntil}d`, color: 'text-yellow-600' };
  return { status: 'valid', label: `Valid — ${daysUntil}d remaining`, color: 'text-emerald-600' };
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

export const ComplianceTab: React.FC<ComplianceTabProps> = ({
  profile, onSave, onUploadDocument, onDeleteDocument,
}) => {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const [licenseNumber, setLicenseNumber] = useState(profile?.driversLicenseNumber || '');
  const [licenseState, setLicenseState] = useState(profile?.licenseState || '');
  const [licenseExp, setLicenseExp] = useState(profile?.licenseExpirationDate?.substring(0, 10) || '');
  const [medicalExp, setMedicalExp] = useState(profile?.medicalCardExpirationDate?.substring(0, 10) || '');
  const [insuranceExp, setInsuranceExp] = useState(profile?.insuranceExpirationDate?.substring(0, 10) || '');
  const [insuranceProvider, setInsuranceProvider] = useState(profile?.insuranceProvider || '');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState(profile?.insurancePolicyNumber || '');

  const [uploadType, setUploadType] = useState('drivers_license');
  const [uploadLabel, setUploadLabel] = useState('');
  const [uploadExpiry, setUploadExpiry] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const licenseStatus = getExpirationStatus(licenseExp);
  const medicalStatus = getExpirationStatus(medicalExp);
  const insuranceStatus = getExpirationStatus(insuranceExp);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        driversLicenseNumber: licenseNumber.trim(),
        licenseState,
        licenseExpirationDate: licenseExp || undefined,
        medicalCardExpirationDate: medicalExp || undefined,
        insuranceExpirationDate: insuranceExp || undefined,
        insuranceProvider: insuranceProvider.trim(),
        insurancePolicyNumber: insurancePolicyNumber.trim(),
      });
      toast.success('Compliance information saved');
    } catch {
      toast.error('Failed to save compliance info');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadLabel.trim()) {
      toast.error('Please select a file and provide a label');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', uploadFile);
      formData.append('type', uploadType);
      formData.append('label', uploadLabel.trim());
      if (uploadExpiry) formData.append('expiresAt', uploadExpiry);
      await onUploadDocument(formData);
      toast.success('Document uploaded');
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
      await onDeleteDocument(docId);
      toast.success('Document deleted');
      setShowDeleteConfirm(null);
    } catch {
      toast.error('Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  const documents = profile?.documents || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/10">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Shield className="size-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">License & Insurance</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Keep your credentials current to stay eligible for dispatch</p>
            </div>
            {profile?.isComplianceExpired && (
              <Badge variant="destructive" className="ml-auto gap-1 text-xs">
                <AlertTriangle className="size-3" /> Expired
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">License Number</Label>
              <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="DL-XXXXXXXX" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">License State</Label>
              <Select value={licenseState} onValueChange={setLicenseState}>
                <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                <SelectContent>
                  {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">License Expiration</Label>
              <Input type="date" value={licenseExp} onChange={(e) => setLicenseExp(e.target.value)} />
              <p className={cn("text-[10px] font-semibold", licenseStatus.color)}>{licenseStatus.label}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Medical Card Expiration</Label>
              <Input type="date" value={medicalExp} onChange={(e) => setMedicalExp(e.target.value)} />
              <p className={cn("text-[10px] font-semibold", medicalStatus.color)}>{medicalStatus.label}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Insurance Expiration</Label>
              <Input type="date" value={insuranceExp} onChange={(e) => setInsuranceExp(e.target.value)} />
              <p className={cn("text-[10px] font-semibold", insuranceStatus.color)}>{insuranceStatus.label}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Insurance Provider</Label>
              <Input value={insuranceProvider} onChange={(e) => setInsuranceProvider(e.target.value)} placeholder="e.g. Progressive" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Policy Number</Label>
              <Input value={insurancePolicyNumber} onChange={(e) => setInsurancePolicyNumber(e.target.value)} placeholder="e.g. POL-123456" />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save Compliance Info
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <FileText className="size-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Documents</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{documents.length}/20 uploaded</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setShowUploadDialog(true)}
              disabled={documents.length >= 20}
              className="gap-1.5"
            >
              <Upload className="size-3.5" /> Upload
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="size-14 rounded-2xl bg-muted/40 flex items-center justify-center">
                <FileText className="size-7 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">No documents uploaded yet</p>
              <p className="text-xs text-muted-foreground/60">Upload your license, insurance, and other compliance docs</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc: ComplianceDocument) => {
                const docExpStatus = doc.expiresAt ? getExpirationStatus(doc.expiresAt) : null;
                const typeLabel = documentTypeOptions.find(t => t.value === doc.type)?.label || doc.type;
                return (
                  <div key={doc._id} className="flex items-center justify-between p-3 rounded-xl border border-border/40 hover:border-border transition-all group">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={cn(
                        "size-9 rounded-lg flex items-center justify-center shrink-0",
                        doc.verified ? "bg-emerald-500/10" : "bg-muted/40"
                      )}>
                        {doc.verified ? <CheckCircle2 className="size-4 text-emerald-500" /> : <FileText className="size-4 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate">{doc.label}</p>
                          <Badge variant="outline" className="text-[10px] shrink-0">{typeLabel}</Badge>
                          {doc.verified && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[10px] shrink-0">Verified</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">{doc.fileName} · {formatFileSize(doc.fileSize)}</span>
                          {docExpStatus && <span className={cn("text-[10px] font-semibold", docExpStatus.color)}>{docExpStatus.label}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {doc.fileUrl && (
                        <Button size="icon" variant="ghost" className="size-8" asChild>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"><Eye className="size-3.5" /></a>
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => setShowDeleteConfirm(doc._id)}
                        disabled={deletingId === doc._id}
                      >
                        {deletingId === doc._id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
              <Label>Expiration Date (optional)</Label>
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
                  "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all hover:border-emerald-500/50",
                  uploadFile ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/50"
                )}
              >
                {uploadFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="size-5 text-emerald-500" />
                    <span className="text-sm font-medium truncate">{uploadFile.name}</span>
                    <Badge variant="outline" className="text-[10px]">{formatFileSize(uploadFile.size)}</Badge>
                  </div>
                ) : (
                  <>
                    <Upload className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground font-medium">Click to browse or drag & drop</p>
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
              Upload
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
            <DialogDescription>This will permanently remove this document. This action cannot be undone.</DialogDescription>
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
