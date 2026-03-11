'use client';

import React from 'react';
import { Notification } from '@/types/notification';
import { NotificationItem } from './NotificationItem';
import { NotificationEmptyState, NotificationLoadingState } from './NotificationEmptyState';

interface NotificationListProps {
  notifications: Notification[];
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onItemClick?: (notification: Notification) => void;
  compact?: boolean;
}

export function NotificationList({
  notifications,
  isLoading,
  onMarkAsRead,
  onDelete,
  onItemClick,
  compact,
}: NotificationListProps) {
  if (isLoading) return <NotificationLoadingState />;
  if (notifications.length === 0) return <NotificationEmptyState />;

  return (
    <div className="divide-y divide-border">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification._id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
          onClick={onItemClick}
          compact={compact}
        />
      ))}
    </div>
  );
}
