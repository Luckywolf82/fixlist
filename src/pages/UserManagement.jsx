import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { usePermissions } from "@/components/usePermissions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserPlus, Shield, Eye, Edit3, Crown } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function UserManagement() {
  const { canManageUsers, user: currentUser } = usePermissions();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list(),
    enabled: canManageUsers,
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }) => {
      await base44.users.inviteUser(email, role === "administrator" ? "admin" : "user");
      // Update custom role after invitation
      const newUsers = await base44.entities.User.filter({ email });
      if (newUsers[0]) {
        await base44.entities.User.update(newUsers[0].id, { custom_role: role });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      setInviteEmail("");
      setInviteRole("editor");
      toast.success("User invited successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to invite user");
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }) => {
      return base44.entities.User.update(userId, { custom_role: newRole });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      toast.success("User role updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update role");
    },
  });

  const handleInvite = () => {
    if (!inviteEmail || !inviteEmail.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "administrator": return <Crown className="w-4 h-4 text-purple-600" />;
      case "editor": return <Edit3 className="w-4 h-4 text-blue-600" />;
      case "viewer": return <Eye className="w-4 h-4 text-slate-600" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      administrator: "bg-purple-100 text-purple-700 border-purple-300",
      editor: "bg-blue-100 text-blue-700 border-blue-300",
      viewer: "bg-slate-100 text-slate-700 border-slate-300",
    };
    return colors[role] || colors.viewer;
  };

  if (!canManageUsers) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">Access Denied</h1>
        <Card className="p-12 text-center">
          <Shield className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">You don't have permission to access user management.</p>
          <p className="text-sm text-slate-500 mt-2">Contact an administrator for access.</p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">User Management</h1>
        <p className="text-slate-500 mt-1">Manage team members and their permissions</p>
      </div>

      {/* Invite User */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-5 h-5 text-slate-600" />
          <h2 className="font-semibold text-slate-900">Invite New User</h2>
        </div>
        <div className="flex gap-3">
          <Input
            placeholder="user@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
          />
          <Select value={inviteRole} onValueChange={setInviteRole}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewer">Viewer</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="administrator">Administrator</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleInvite}
            disabled={inviteMutation.isPending}
            className="bg-slate-900 hover:bg-slate-800"
          >
            {inviteMutation.isPending ? "Inviting..." : "Invite"}
          </Button>
        </div>
      </Card>

      {/* Role Descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-slate-900">Viewer</h3>
          </div>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• View sites and reports</li>
            <li>• View crawl history</li>
            <li>• View issues</li>
            <li className="text-slate-400">• Cannot make changes</li>
          </ul>
        </Card>
        <Card className="p-5 border-blue-200 bg-blue-50/30">
          <div className="flex items-center gap-2 mb-3">
            <Edit3 className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900">Editor</h3>
          </div>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• Everything Viewer can do</li>
            <li>• Add sites and start crawls</li>
            <li>• Manage schedules</li>
            <li>• Update issue statuses</li>
            <li className="text-slate-400">• Cannot delete sites</li>
          </ul>
        </Card>
        <Card className="p-5 border-purple-200 bg-purple-50/30">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-slate-900">Administrator</h3>
          </div>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• Full access to all features</li>
            <li>• Delete sites</li>
            <li>• Access settings</li>
            <li>• Manage users and roles</li>
          </ul>
        </Card>
      </div>

      {/* Users List */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-600" />
            <h2 className="font-semibold text-slate-900">Team Members ({users.length})</h2>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="font-semibold text-slate-700">User</TableHead>
              <TableHead className="font-semibold text-slate-700">Email</TableHead>
              <TableHead className="font-semibold text-slate-700">Role</TableHead>
              <TableHead className="font-semibold text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const userRole = user.custom_role || (user.role === 'admin' ? 'administrator' : 'editor');
              const isCurrentUser = user.id === currentUser?.id;

              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(userRole)}
                      <span className="font-medium text-slate-900">{user.full_name}</span>
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">{user.email}</TableCell>
                  <TableCell>
                    <Badge className={`${getRoleBadge(userRole)} capitalize`}>
                      {userRole}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {!isCurrentUser ? (
                      <Select
                        value={userRole}
                        onValueChange={(newRole) => updateRoleMutation.mutate({ userId: user.id, newRole })}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="administrator">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm text-slate-500">Cannot change own role</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}