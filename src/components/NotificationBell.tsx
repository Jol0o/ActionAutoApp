'use client';

import * as React from 'react';
import { Bell, Check, Trash2, Package, Truck, ShieldCheck, Mail, User, CheckCheck, AlertCircle, UserPlus, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@clerk/nextjs';
import { apiClient } from '@/lib/api-client';
import { formatDistanceToNow } from 'date-fns';
import { Notification } from '@/types/notification';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { NotificationErrorBoundary } from './NotificationErrorBoundary';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'quote_created':
    case 'quote_updated':
    case 'quote_deleted':
      return <Package className="size-5" />;
    case 'shipment_created':
    case 'shipment_updated':
    case 'shipment_deleted':
      return <Truck className="size-5" />;
    case 'password_changed':
      return <ShieldCheck className="size-5" />;
    case 'email_changed':
      return <Mail className="size-5" />;
    case 'profile_updated':
      return <User className="size-5" />;
    case 'driver_request':
      return <UserPlus className="size-5" />;
    case 'driver_request_approved':
      return <CheckCircle2 className="size-5" />;
    case 'driver_request_rejected':
      return <XCircle className="size-5" />;
    default:
      return <Bell className="size-5" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'quote_created':
      return 'from-blue-500 to-cyan-500';
    case 'quote_updated':
      return 'from-indigo-500 to-purple-500';
    case 'quote_deleted':
      return 'from-red-500 to-rose-500';
    case 'shipment_created':
      return 'from-green-500 to-emerald-500';
    case 'shipment_updated':
      return 'from-teal-500 to-cyan-500';
    case 'shipment_deleted':
      return 'from-orange-500 to-red-500';
    case 'password_changed':
    case 'email_changed':
      return 'from-amber-500 to-orange-500';
    case 'profile_updated':
      return 'from-violet-500 to-purple-500';
    case 'driver_request':
      return 'from-emerald-500 to-teal-500';
    case 'driver_request_approved':
      return 'from-green-500 to-emerald-500';
    case 'driver_request_rejected':
      return 'from-red-500 to-rose-500';
    default:
      return 'from-gray-500 to-slate-500';
  }
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

function NotificationItem({ notification, onMarkAsRead, onDelete, onClick }: NotificationItemProps) {
  const isClickable = notification.type === 'driver_request';

  return (
    <div
      className={cn(
        'group relative p-4 border-b transition-all hover:bg-accent/50',
        !notification.isRead && 'bg-blue-50/50 dark:bg-blue-950/20',
        isClickable && 'cursor-pointer'
      )}
      onClick={() => {
        if (isClickable && onClick) {
          onClick(notification);
        }
      }}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      )}

      <div className="flex items-start gap-3 pl-2">
        {/* Icon */}
        <div className={cn(
          'flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shadow-md',
          getNotificationColor(notification.type)
        )}>
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground leading-snug">
                {notification.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {notification.message}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </p>
              {isClickable && (
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-200">
                  Click to review
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notification.isRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs hover:bg-green-100 dark:hover:bg-green-950"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(notification._id);
                  }}
                >
                  <Check className="size-3 mr-1" />
                  Mark read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-red-100 dark:hover:bg-red-950 hover:text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification._id);
                }}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DriverRequestModal({
  notification,
  open,
  onOpenChange,
}: {
  notification: Notification | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { getToken } = useAuth();
  const { fetchNotifications, deleteNotification } = useNotifications();
  const [isActioning, setIsActioning] = React.useState(false);
  const [result, setResult] = React.useState<'approved' | 'rejected' | null>(null);

  const driverName = notification?.metadata?.driverName || 'Unknown Driver';
  const driverEmail = notification?.metadata?.driverEmail || '—';
  const requestId = notification?.metadata?.driverRequestId;

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!requestId) return;
    setIsActioning(true);
    try {
      const token = await getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (action === 'approve') {
        await apiClient.approveDriverRequest(requestId, config);
        setResult('approved');
      } else {
        await apiClient.rejectDriverRequest(requestId, config);
        setResult('rejected');
      }
      // Remove the notification from the list since it's been processed
      if (notification) {
        await deleteNotification(notification._id);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Action failed. The request may have already been processed.';
      setResult(null);
      alert(msg);
    } finally {
      setIsActioning(false);
    }
  };

  // Reset result when modal closes
  React.useEffect(() => {
    if (!open) {
      setResult(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-emerald-500" />
            Driver Request
          </DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col items-center py-6 gap-3">
            {result === 'approved' ? (
              <>
                <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                  <CheckCircle2 className="size-7 text-green-600" />
                </div>
                <p className="text-sm font-semibold text-green-600">Request Approved</p>
                <p className="text-xs text-muted-foreground text-center">
                  {driverName} can now access the driver dashboard. An approval email has been sent.
                </p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                  <XCircle className="size-7 text-red-600" />
                </div>
                <p className="text-sm font-semibold text-red-600">Request Rejected</p>
                <p className="text-xs text-muted-foreground text-center">
                  {driverName}&apos;s request has been rejected.
                </p>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="mt-2">
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Driver Info */}
            <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="text-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  {driverName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base font-semibold">{driverName}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  {driverEmail}
                </p>
                {notification && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Requested {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                )}
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              This driver wants to join your organization. Approving will give them access to the driver dashboard and allow them to receive load assignments.
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200"
                onClick={() => handleAction('reject')}
                disabled={isActioning}
              >
                {isActioning ? (
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                ) : (
                  <XCircle className="size-4 mr-1.5" />
                )}
                Reject
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleAction('approve')}
                disabled={isActioning}
              >
                {isActioning ? (
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                ) : (
                  <CheckCircle2 className="size-4 mr-1.5" />
                )}
                Approve
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function NotificationContent({ onDriverRequestClick }: { onDriverRequestClick: (n: Notification) => void }) {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
  } = useNotifications();

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Notifications</h3>
            <p className="text-xs text-white/90">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
            </p>
          </div>
          {notifications.length > 0 && (
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-white hover:bg-white/20"
                  onClick={markAllAsRead}
                >
                  <CheckCheck className="size-3 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-white hover:bg-white/20"
                onClick={deleteAllRead}
              >
                <Trash2 className="size-3 mr-1" />
                Clear read
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-900">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="size-4" />
            <p className="text-xs">{error}</p>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <ScrollArea className="h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading notifications...</p>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950 rounded-full flex items-center justify-center mb-4">
              <Bell className="size-8 text-blue-500 dark:text-blue-400" />
            </div>
            <h4 className="text-sm font-semibold text-foreground mb-1">No notifications</h4>
            <p className="text-xs text-muted-foreground text-center">
              You're all caught up! We'll notify you when there's something new.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
                onClick={onDriverRequestClick}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="sticky bottom-0 bg-background border-t px-4 py-2 text-center">
          <p className="text-xs text-muted-foreground">
            Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </>
  );
}

export function NotificationBell() {
  const { unreadCount, markAsRead } = useNotifications();
  const [modalNotification, setModalNotification] = React.useState<Notification | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  const handleDriverRequestClick = React.useCallback((notification: Notification) => {
    if (notification.type === 'driver_request') {
      setModalNotification(notification);
      setModalOpen(true);
      if (!notification.isRead) {
        markAsRead(notification._id);
      }
    }
  }, [markAsRead]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full relative hover:bg-accent"
          >
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <>
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-[10px] font-bold text-white bg-gradient-to-br from-red-500 to-rose-600 rounded-full shadow-lg border-2 border-background animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full animate-ping opacity-75" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-[380px] sm:w-[420px] p-0 shadow-2xl border-2"
        >
          <NotificationErrorBoundary>
            <NotificationContent onDriverRequestClick={handleDriverRequestClick} />
          </NotificationErrorBoundary>
        </DropdownMenuContent>
      </DropdownMenu>

      <DriverRequestModal
        notification={modalNotification}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
