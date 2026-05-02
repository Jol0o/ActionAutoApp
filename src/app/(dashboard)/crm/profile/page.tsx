"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Phone,
  Calendar,
  Search,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";

interface UserProfile {
  _id: string;
  fullName: string;
  username: string;
  email: string;
  role: string;
  avatar?: string;
  phone?: string;
  about?: string;
  createdAt: string;
  isOnline?: boolean;
}

function ini(n: string) {
  return n
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString([], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function CrmProfilePage() {
  const router = useRouter();

  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [token, setToken] = React.useState("");

  // Load current user
  React.useEffect(() => {
    const t = localStorage.getItem("crm_token");
    if (!t) {
      router.replace("/crm");
      return;
    }
    setToken(t);

    apiClient
      .get("/api/crm/me", { headers: { Authorization: `Bearer ${t}` } })
      .then((res) => {
        const userData = res.data?.data || res.data;
        setUser(userData);
      })
      .catch(() => {
        router.replace("/crm");
      })
      .finally(() => setIsLoading(false));
  }, [router]);

  // Search users
  const handleSearch = React.useCallback(
    async (query: string) => {
      setSearchTerm(query);
      if (!query.trim() || !token) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const res = await apiClient.get(
          `/api/crm/users?search=${encodeURIComponent(query)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setSearchResults((res.data?.data?.users || []).slice(0, 5));
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [token],
  );

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, handleSearch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          <p className="text-xs text-muted-foreground/50 tracking-wide">
            Loading profile…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-bold tracking-tight">Team Directory</h1>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              placeholder="Search users…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm rounded-lg border-border/40 bg-muted/20 focus-visible:ring-emerald-500/30"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Search Results */}
        {searchTerm && searchResults.length > 0 && (
          <div className="mb-8 space-y-2">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/70">
              Search Results
            </p>
            {searchResults.map((u) => (
              <button
                key={u._id}
                onClick={() => {
                  setUser(u);
                  setSearchTerm("");
                  setSearchResults([]);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors border border-transparent hover:border-border/40"
              >
                <Avatar className="h-9 w-9 ring-2 ring-border/40">
                  <AvatarImage src={u.avatar} />
                  <AvatarFallback className="bg-emerald-600 text-white text-xs font-bold">
                    {ini(u.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold truncate">{u.fullName}</p>
                  <p className="text-[11px] text-muted-foreground/60 truncate">
                    @{u.username}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Profile Card */}
        {user && (
          <div className="space-y-6">
            {/* Avatar & Header */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <Avatar className="h-20 w-20 ring-2 ring-border/40 shadow-lg">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-emerald-600 text-white text-lg font-bold">
                    {ini(user.fullName)}
                  </AvatarFallback>
                </Avatar>
                {user.isOnline && (
                  <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 ring-2 ring-background" />
                )}
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">
                  {user.fullName}
                </h2>
                <p className="text-sm text-muted-foreground/70">
                  @{user.username}
                </p>
                <Badge className="mx-auto mt-2 capitalize bg-emerald-500/10 text-emerald-600 border-0">
                  {user.role}
                </Badge>
              </div>
            </div>

            <Separator className="my-6" />

            {/* About Section */}
            {user.about && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/70">
                  About
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground/80">
                  {user.about}
                </p>
              </div>
            )}

            {/* Contact & Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Email */}
              <div className="flex items-start gap-3 rounded-lg border border-border/30 bg-muted/20 p-4">
                <Mail className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-1">
                    Email
                  </p>
                  <p className="text-sm text-foreground/80 break-all">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Phone */}
              {user.phone && (
                <div className="flex items-start gap-3 rounded-lg border border-border/30 bg-muted/20 p-4">
                  <Phone className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-1">
                      Phone
                    </p>
                    <p className="text-sm text-foreground/80">{user.phone}</p>
                  </div>
                </div>
              )}

              {/* Joined */}
              <div className="flex items-start gap-3 rounded-lg border border-border/30 bg-muted/20 p-4">
                <Calendar className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-1">
                    Joined
                  </p>
                  <p className="text-sm text-foreground/80">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!user && !isLoading && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">Profile not found</p>
          </div>
        )}
      </main>
    </div>
  );
}
