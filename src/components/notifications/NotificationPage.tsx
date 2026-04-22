'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Bell, CheckCheck, Trash2, Filter, AlertCircle, Search, Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';
import { Notification } from '@/types/notification';
import { NotificationItem } from './NotificationItem';
import { NotificationDriverModal } from './NotificationDriverModal';
import { NotificationEmptyState, NotificationLoadingState } from './NotificationEmptyState';
import { NotificationErrorBoundary } from './NotificationErrorBoundary';
import { getNotificationCategory } from './notification-utils';

type TabFilter = 'all' | 'unread' | 'read';
type TypeFilter = 'all' | Notification['type'];

const CATEGORY_OPTIONS = [
  'All', 'Quotes', 'Shipments', 'Vehicles', 'Appointments',
  'CRM', 'Driver', 'Payments', 'Team', 'Account', 'Referrals', 'System',
];

function toMinutes(time: string): number {
  const [hh = '0', mm = '0'] = time.split(':');
  return (Number(hh) * 60) + Number(mm);
}

function hasMeaningfulMetadata(notification: Notification): boolean {
  if (!notification.metadata) return false;

  return Object.values(notification.metadata).some((value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value === 'boolean') return true;
    return true;
  });
}

export function NotificationPage() {
  const {
    notifications,
    unreadCount,
    totalCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
  } = useNotifications();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<TabFilter>(() => {
    const tabParam = searchParams.get('tab');
    return tabParam === 'unread' || tabParam === 'read' ? tabParam : 'all';
  });
  const [category, setCategory] = useState(() => {
    const categoryParam = searchParams.get('category');
    return categoryParam && CATEGORY_OPTIONS.includes(categoryParam) ? categoryParam : 'All';
  });
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '');
  const [dateFrom, setDateFrom] = useState(() => searchParams.get('dateFrom') ?? '');
  const [dateTo, setDateTo] = useState(() => searchParams.get('dateTo') ?? '');
  const [timeFrom, setTimeFrom] = useState(() => searchParams.get('timeFrom') ?? '');
  const [timeTo, setTimeTo] = useState(() => searchParams.get('timeTo') ?? '');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(
    () => (searchParams.get('type') as TypeFilter | null) ?? 'all'
  );
  const [metadataOnly, setMetadataOnly] = useState(
    () => searchParams.get('metadataOnly') === 'true'
  );
  const [broadcastOnly, setBroadcastOnly] = useState(
    () => searchParams.get('broadcastOnly') === 'true'
  );
  const [modalNotification, setModalNotification] = useState<Notification | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchNotifications({ limit: 0, skip: 0 });

    return () => {
      fetchNotifications({ limit: 50, skip: 0 });
    };
  }, [fetchNotifications]);

  const typeOptions = useMemo(
    () => Array.from(new Set(notifications.map((n) => n.type))).sort(),
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    let result = [...notifications];

    if (tab === 'unread') result = result.filter(n => !n.isRead);
    if (tab === 'read') result = result.filter(n => n.isRead);

    if (category !== 'All') {
      result = result.filter(n => getNotificationCategory(n.type) === category);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(q)
        || n.message.toLowerCase().includes(q)
        || Object.values(n.metadata ?? {}).some((value) =>
          String(value ?? '').toLowerCase().includes(q))
      );
    }

    if (typeFilter !== 'all') {
      result = result.filter((n) => n.type === typeFilter);
    }

    if (metadataOnly) {
      result = result.filter((n) => hasMeaningfulMetadata(n));
    }

    if (broadcastOnly) {
      result = result.filter((n) => Boolean(n.isBroadcast));
    }

    if (dateFrom) {
      const from = new Date(`${dateFrom}T00:00:00`);
      result = result.filter((n) => new Date(n.createdAt) >= from);
    }

    if (dateTo) {
      const to = new Date(`${dateTo}T23:59:59.999`);
      result = result.filter((n) => new Date(n.createdAt) <= to);
    }

    if (timeFrom || timeTo) {
      const minFrom = timeFrom ? toMinutes(timeFrom) : null;
      const minTo = timeTo ? toMinutes(timeTo) : null;

      result = result.filter((n) => {
        const createdDate = new Date(n.createdAt);
        if (Number.isNaN(createdDate.getTime())) return false;

        const currentMinutes = createdDate.getHours() * 60 + createdDate.getMinutes();

        if (minFrom !== null && minTo !== null) {
          if (minFrom <= minTo) return currentMinutes >= minFrom && currentMinutes <= minTo;
          return currentMinutes >= minFrom || currentMinutes <= minTo;
        }

        if (minFrom !== null) return currentMinutes >= minFrom;
        if (minTo !== null) return currentMinutes <= minTo;
        return true;
      });
    }

    return result;
  }, [
    notifications,
    tab,
    category,
    search,
    typeFilter,
    metadataOnly,
    broadcastOnly,
    dateFrom,
    dateTo,
    timeFrom,
    timeTo,
  ]);

  const advancedFilterCount = useMemo(
    () => [dateFrom, dateTo, timeFrom, timeTo].filter(Boolean).length
      + (typeFilter !== 'all' ? 1 : 0)
      + (metadataOnly ? 1 : 0)
      + (broadcastOnly ? 1 : 0),
    [dateFrom, dateTo, timeFrom, timeTo, typeFilter, metadataOnly, broadcastOnly]
  );

  const handleDriverRequestClick = useCallback((notification: Notification) => {
    if (notification.type === 'driver_request') {
      setModalNotification(notification);
      setModalOpen(true);
      if (!notification.isRead) markAsRead(notification._id);
    }
  }, [markAsRead]);

  const categoryCount = useMemo(() => {
    const counts: Record<string, number> = {};
    notifications.forEach(n => {
      const cat = getNotificationCategory(n.type);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [notifications]);

  const displayTotal = useMemo(
    () => Math.max(totalCount, notifications.length),
    [totalCount, notifications.length]
  );

  return (
    <NotificationErrorBoundary>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Bell className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {unreadCount > 0 ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    {unreadCount} unread
                    {displayTotal > 0 && <span className="text-muted-foreground/50">·</span>}
                    {displayTotal > 0 && `${displayTotal} total`}
                  </span>
                ) : (
                  <span>{displayTotal > 0 ? `All caught up · ${displayTotal} total` : 'All caught up'}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={pathname.startsWith('/driver') ? '/driver/profile?tab=notifications' : '/profile?tab=notifications'}
              className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium transition-colors"
            >
              <Settings className="size-3.5" />
              Preferences
            </Link>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="gap-1.5 rounded-lg"
              >
                <CheckCheck className="size-3.5" />
                Mark all read
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={deleteAllRead}
              className="gap-1.5 text-muted-foreground rounded-lg"
            >
              <Trash2 className="size-3.5" />
              Clear read
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabFilter)} className="w-auto">
            <TabsList className="h-9 rounded-lg">
              <TabsTrigger value="all" className="text-xs px-3 rounded-md">
                All
                {displayTotal > 0 && (
                  <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px] rounded-md">
                    {displayTotal}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-xs px-3 rounded-md">
                Unread
                {unreadCount > 0 && (
                  <Badge className="ml-1.5 h-5 px-1.5 text-[10px] bg-emerald-500 rounded-md">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="read" className="text-xs px-3 rounded-md">
                Read
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-8 text-sm rounded-lg"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-lg">
                  <Filter className="size-3.5" />
                  {category}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                {CATEGORY_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt}
                    onClick={() => setCategory(opt)}
                    className={cn(
                      'flex justify-between text-sm rounded-lg',
                      category === opt && 'bg-accent font-medium'
                    )}
                  >
                    {opt}
                    {opt !== 'All' && categoryCount[opt] && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] rounded-md">
                        {categoryCount[opt]}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-lg">
                  <Filter className="size-3.5" />
                  More filters
                  {advancedFilterCount > 0 && (
                    <Badge className="h-5 px-1.5 text-[10px] rounded-md bg-emerald-500">
                      {advancedFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[340px] rounded-xl p-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium text-muted-foreground">Date from</p>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium text-muted-foreground">Date to</p>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium text-muted-foreground">Time from</p>
                    <Input
                      type="time"
                      value={timeFrom}
                      onChange={(e) => setTimeFrom(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium text-muted-foreground">Time to</p>
                    <Input
                      type="time"
                      value={timeTo}
                      onChange={(e) => setTimeTo(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-muted-foreground">Type</p>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="all">All types</option>
                    {typeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={metadataOnly ? 'default' : 'outline'}
                    className="h-8 text-xs"
                    onClick={() => setMetadataOnly((v) => !v)}
                  >
                    Metadata only
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={broadcastOnly ? 'default' : 'outline'}
                    className="h-8 text-xs"
                    onClick={() => setBroadcastOnly((v) => !v)}
                  >
                    Broadcast only
                  </Button>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      setDateFrom('');
                      setDateTo('');
                      setTimeFrom('');
                      setTimeTo('');
                      setTypeFilter('all');
                      setMetadataOnly(false);
                      setBroadcastOnly(false);
                    }}
                  >
                    Reset filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400">
            <AlertCircle className="size-4 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
          {isLoading ? (
            <NotificationLoadingState />
          ) : filteredNotifications.length === 0 ? (
            <NotificationEmptyState />
          ) : (
            <div className="divide-y divide-border/50">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  onClick={handleDriverRequestClick}
                />
              ))}
            </div>
          )}
        </div>

        {filteredNotifications.length > 0 && (
          <div className="text-xs text-muted-foreground px-1">
            <span>
              Showing {filteredNotifications.length} of {displayTotal} notification{displayTotal !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      <NotificationDriverModal
        notification={modalNotification}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </NotificationErrorBoundary>
  );
}
