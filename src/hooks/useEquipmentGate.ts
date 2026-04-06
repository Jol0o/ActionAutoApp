'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { apiClient } from '@/lib/api-client';

const EQUIP_KEYS = ['truckMake', 'truckModel', 'truckYear', 'trailerType', 'maxVehicleCapacity', 'dotNumber', 'mcNumber'] as const;
const DOC_TYPES = ['drivers_license', 'medical_card', 'insurance_certificate', 'vehicle_registration', 'operating_authority', 'w9_form'] as const;

const isFilled = (v: any) => v !== undefined && v !== null && v !== '' && v !== 0;

export function useDriverGate() {
    const { getToken } = useAuth();
    const [checking, setChecking] = useState(true);
    const [equipmentComplete, setEquipmentComplete] = useState(false);
    const [documentsComplete, setDocumentsComplete] = useState(false);
    const [missingEquipment, setMissingEquipment] = useState<string[]>([]);
    const [missingDocs, setMissingDocs] = useState<string[]>([]);

    const check = useCallback(async () => {
        try {
            const token = await getToken();
            const res = await apiClient.get('/api/driver-profile', { headers: { Authorization: `Bearer ${token}` } });
            const d = res.data?.data;
            if (!d) {
                setEquipmentComplete(false);
                setDocumentsComplete(false);
                setMissingEquipment([...EQUIP_KEYS]);
                setMissingDocs([...DOC_TYPES]);
                return;
            }
            const eqMissing = EQUIP_KEYS.filter(k => !isFilled(d[k]));
            setEquipmentComplete(eqMissing.length === 0);
            setMissingEquipment(eqMissing);

            const docs: any[] = d.documents || [];
            const uploadedTypes = new Set(docs.map((doc: any) => doc.type));
            const docMissing = DOC_TYPES.filter(t => !uploadedTypes.has(t));
            const hasIdentity = !!d.ssnLast4 && !!d.backgroundCheckConsent;
            const hasAgreement = !!d.verificationAgreement;
            setDocumentsComplete(docMissing.length === 0 && hasIdentity && hasAgreement);
            setMissingDocs(docMissing.length > 0 ? [...docMissing] : !hasIdentity ? ['identity_verification'] : !hasAgreement ? ['verification_agreement'] : []);
        } catch {
            setEquipmentComplete(false);
            setDocumentsComplete(false);
        } finally { setChecking(false); }
    }, [getToken]);

    useEffect(() => { check(); }, [check]);

    return { checking, equipmentComplete, documentsComplete, missingEquipment, missingDocs };
}
