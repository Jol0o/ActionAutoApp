'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export function DashboardSearch() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    
    // Initialize with current search param if on inventory page
    const [query, setQuery] = React.useState(
        pathname === '/inventory' ? searchParams.get('search') || '' : ''
    );

    // Sync state with URL when navigating to/from inventory
    React.useEffect(() => {
        if (pathname === '/inventory') {
            setQuery(searchParams.get('search') || '');
        } else {
            setQuery('');
        }
    }, [pathname, searchParams]);

    // Handle Debounced Redirection
    React.useEffect(() => {
        const timer = setTimeout(() => {
            // Only redirect if query has changed and is not what's already in the URL
            const currentSearch = searchParams.get('search') || '';
            
            if (query && query !== currentSearch) {
                router.push(`/inventory?search=${encodeURIComponent(query)}`);
            } else if (!query && pathname === '/inventory' && currentSearch) {
                // Clear search if query is empty on the inventory page
                router.push('/inventory');
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query, router, pathname, searchParams]);

    return (
        <div className="relative max-w-md w-full hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search Inventory..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-background pl-8 h-9 ring-offset-background focus-visible:ring-1 focus-visible:ring-primary/20"
            />
        </div>
    );
}
