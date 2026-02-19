'use client';

// Simple Singleton Store for Admin State
// avoids adding 'zustand' dependency while keeping state global and persistent.

const STORAGE_KEY = 'admin_impersonate_org_id';
const EVENT_KEY = 'admin:impersonation-changed';

class AdminStore {
    private _impersonatedOrgId: string | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            this._impersonatedOrgId = localStorage.getItem(STORAGE_KEY);
        }
    }

    get impersonatedOrgId(): string | null {
        return this._impersonatedOrgId;
    }

    startImpersonation(orgId: string) {
        this._impersonatedOrgId = orgId;
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, orgId);
            window.dispatchEvent(new Event(EVENT_KEY));
        }
    }

    stopImpersonation() {
        this._impersonatedOrgId = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
            window.dispatchEvent(new Event(EVENT_KEY));
        }
    }

    // React Hook to use in components
    useStore() {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [orgId, setOrgId] = require('react').useState(this._impersonatedOrgId);

        // eslint-disable-next-line react-hooks/rules-of-hooks
        require('react').useEffect(() => {
            const handleChange = () => {
                setOrgId(this._impersonatedOrgId);
            };
            window.addEventListener(EVENT_KEY, handleChange);
            return () => window.removeEventListener(EVENT_KEY, handleChange);
        }, []);

        return {
            impersonatedOrgId: orgId,
            isImpersonating: !!orgId,
            stopImpersonation: this.stopImpersonation.bind(this),
            startImpersonation: this.startImpersonation.bind(this),
        };
    }
}

export const adminStore = new AdminStore();
