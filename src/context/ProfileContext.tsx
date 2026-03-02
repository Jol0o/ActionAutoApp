'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ProfileContextType {
  avatarUrl: string | null;
  setAvatarUrl: (url: string | null) => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

const ProfileContext = createContext<ProfileContextType>({
  avatarUrl: null,
  setAvatarUrl: () => {},
  refreshKey: 0,
  triggerRefresh: () => {},
});

export function useProfileContext() {
  return useContext(ProfileContext);
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <ProfileContext.Provider value={{ avatarUrl, setAvatarUrl, refreshKey, triggerRefresh }}>
      {children}
    </ProfileContext.Provider>
  );
}
