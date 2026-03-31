"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  ShieldBan,
  ShieldCheck,
  UserCog,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { UserProfile } from "@/types/user";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

// Extend User type if needed for extra fields returned by admin API
interface AdminUser extends UserProfile {
  isActive: boolean;
  organizationId?: any; // Populated with { _id, name }
}

// ─── Actions cell extracted as a proper component so we can use useState ───
function ActionsCell({ user }: { user: AdminUser }) {
  const { getToken } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSuspend = async () => {
    try {
      const token = await getToken();
      await apiClient.post(
        `/api/admin/users/${user._id}/suspend`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success("User suspended");
      setTimeout(() => window.location.reload(), 500);
    } catch {
      toast.error("Failed to suspend user");
    }
  };

  const handleActivate = async () => {
    try {
      const token = await getToken();
      await apiClient.post(
        `/api/admin/users/${user._id}/activate`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success("User activated");
      setTimeout(() => window.location.reload(), 500);
    } catch {
      toast.error("Failed to activate user");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = await getToken();
      await apiClient.delete(`/api/admin/users/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`${user.name} has been deleted`);
      setTimeout(() => window.location.reload(), 500);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete user");
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(user._id)}
          >
            Copy User ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <UserCog className="mr-2 h-4 w-4" />
            Manage Roles
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {user.isActive ? (
            <DropdownMenuItem onClick={handleSuspend} className="text-red-600">
              <ShieldBan className="mr-2 h-4 w-4" />
              Suspend User
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleActivate}>
              <ShieldCheck className="mr-2 h-4 w-4 text-green-600" />
              Activate User
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete{" "}
              <strong>{user.name}</strong>? This will remove their account from
              the database and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export const columns: ColumnDef<AdminUser>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{user.name}</span>
          <span className="text-xs text-muted-foreground">{user.email}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      return (
        <Badge variant={role === "super_admin" ? "default" : "secondary"}>
          {role}
        </Badge>
      );
    },
  },
  {
    accessorKey: "organization",
    header: "Organization",
    cell: ({ row }) => {
      const org = row.original.organizationId;
      return org ? (
        <span className="text-sm">{org.name}</span>
      ) : (
        <span className="text-xs text-muted-foreground">None</span>
      );
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.original.isActive;
      return (
        <Badge variant={isActive ? "outline" : "destructive"}>
          {isActive ? "Active" : "Suspended"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell user={row.original} />,
  },
];
