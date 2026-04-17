import React, { useState } from "react";
import { entities } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "../components/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertTriangle, Users, Shield, BookOpen, CheckCircle, XCircle,
  Search, Settings, Home, Edit, Trash2, LayoutDashboard, Mail, UserPlus, RotateCw
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { ICON_URL } from "../components/data/courseData";
import AdminContentTab from "../components/admin/AdminContentTab";
import CreateAccountDialog from "../components/admin/CreateAccountDialog";
import ClassroomsTab from "../components/admin/ClassroomsTab";
import UserActionDialog from "../components/admin/UserActionDialog";
import CoursewaresTab from "../components/admin/CoursewaresTab";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BrandTabsList } from "@/components/ui/BrandTabs";

export default function Admin() {
  const { user, isLoading, isAdmin } = useCurrentUser();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "users";
  const setTab = (t) => setSearchParams(prev => { prev.set("tab", t); return prev; });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [usersPage, setUsersPage] = useState(1);
  const USERS_PAGE_SIZE = 20;
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showUserActionDialog, setShowUserActionDialog] = useState(false);
  const [selectedUserForAction, setSelectedUserForAction] = useState(null);

  const { data: rawUsers = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => entities.User.list(),
    enabled: isAdmin,
  });

  const { data: allUserAccounts = [] } = useQuery({
    queryKey: ["admin-user-accounts"],
    queryFn: () => entities.UserAccount.list(),
    enabled: isAdmin,
  });

  // Merge User + UserAccount — UserAccount is source of truth for names and app roles
  const allUsers = rawUsers.map(u => {
    const account = allUserAccounts.find(a => a.email === u.email || a.user_id === u.id);
    return {
      ...u,
      first_name: account?.first_name || u.first_name || "",
      last_name: account?.last_name || u.last_name || "",
      role: account?.role || u.role || "guest",
      facilitator_status: account?.facilitator_status || u.facilitator_status || "none",
      school_organization: account?.school_organization || u.school_organization || "",
    };
  });

  const { data: classrooms = [] } = useQuery({
    queryKey: ["admin-classrooms-for-enrollment"],
    queryFn: () => entities.Classroom.list(),
    enabled: isAdmin,
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      // Update built-in User entity
      await entities.User.update(id, data);
      // Sync role/facilitator_status to UserAccount entity
      const user = allUsers.find(u => u.id === id);
      if (user?.email) {
        const accounts = await entities.UserAccount.filter({ email: user.email });
        if (accounts.length > 0) {
          const accountUpdate = {};
          if (data.role !== undefined) accountUpdate.role = data.role;
          if (data.facilitator_status !== undefined) accountUpdate.facilitator_status = data.facilitator_status;
          if (Object.keys(accountUpdate).length > 0) {
            await entities.UserAccount.update(accounts[0].id, accountUpdate);
          }
        }
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });



  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Admin Access Only</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            This area is restricted to administrators. Only @serialdisruptors.xyz accounts with admin role can access this page.
          </p>
          <Link to="/Home">
            <Button className="brand-gradient text-white rounded-full px-8">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const pendingFacilitators = allUsers.filter(
    u => u.facilitator_status === "pending"
  );

  const filteredUsers = allUsers.filter(u => {
    const matchSearch = !search ||
      `${u.username} ${u.email || ""}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalUsersPages = Math.ceil(filteredUsers.length / USERS_PAGE_SIZE);
  const paginatedUsers = filteredUsers.slice((usersPage - 1) * USERS_PAGE_SIZE, usersPage * USERS_PAGE_SIZE);

  const handleApprove = (u) => {
    updateUserMutation.mutate({ id: u.id, data: { facilitator_status: "approved" } });
  };

  const handleReject = (u) => {
    updateUserMutation.mutate({ id: u.id, data: { facilitator_status: "rejected", role: "student" } });
  };

  const handleRoleChange = (u, newRole) => {
    updateUserMutation.mutate({ id: u.id, data: { role: newRole } });
  };

  const handleOpenUserAction = (u) => {
    setSelectedUserForAction(u);
    setShowUserActionDialog(true);
  };

  const roleBadge = (role, status) => {
    if (role === "admin") return <Badge className="bg-red-100 text-red-700 border-0">Admin</Badge>;
    if (role === "guest") return <Badge className="bg-gray-100 text-gray-600 border-0">Guest</Badge>;
    if (status === "pending") return <Badge className="bg-amber-100 text-amber-700 border-0">Facilitator (Pending)</Badge>;
    if (status === "rejected") return <Badge className="bg-gray-100 text-gray-500 border-0">Facilitator (Rejected)</Badge>;
    if (role === "facilitator" || status === "approved") return <Badge className="bg-purple-100 text-purple-700 border-0">Facilitator</Badge>;
    return <Badge className="bg-blue-100 text-blue-700 border-0">Student</Badge>;
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={ICON_URL} alt="" className="w-8 h-8" />
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-none">Admin Panel</h1>
              <p className="text-xs text-gray-400">{user?.full_name || user?.email || "Admin"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="rounded-full gap-2 brand-gradient text-white" onClick={() => setShowCreateAccount(true)}>
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Invite Account</span>
            </Button>
            <Link to="/Home">
              <Button variant="outline" size="sm" className="rounded-full gap-2">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <Card>
              <div className="flex items-start justify-between p-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Guests</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{allUsers.filter(u => u.role === "guest" || !u.role).length}</p>
                </div>
                <div className="hidden sm:flex w-9 h-9 rounded-xl items-center justify-center text-gray-600 bg-gray-100">
                  <Users className="w-4 h-4" />
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-start justify-between p-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Students</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{allUsers.filter(u => u.role === "student").length}</p>
                  <p className="text-xs text-amber-600 mt-1">pending: —</p>
                </div>
                <div className="hidden sm:flex w-9 h-9 rounded-xl items-center justify-center text-emerald-600 bg-emerald-100">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-start justify-between p-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Facilitators</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{allUsers.filter(u => u.role === "facilitator").length}</p>
                  <p className="text-xs text-amber-600 mt-1">pending: {pendingFacilitators.length}</p>
                </div>
                <div className="hidden sm:flex w-9 h-9 rounded-xl items-center justify-center text-purple-600 bg-purple-100">
                  <Shield className="w-4 h-4" />
                </div>
              </div>
            </Card>
          </div>

        <Tabs value={tab} onValueChange={setTab}>
          <BrandTabsList tabs={[
            { value: "users", icon: <Users className="w-3.5 h-3.5" />, label: "Users", badge: pendingFacilitators.length },
            { value: "classrooms", icon: <BookOpen className="w-3.5 h-3.5" />, label: "Classrooms" },
            { value: "coursewares", icon: <LayoutDashboard className="w-3.5 h-3.5" />, label: "Coursewares" },
            { value: "content", icon: <Settings className="w-3.5 h-3.5" />, label: "Home Content" },
          ]} />

          {/* ── Users Tab (unified) ── */}
          <TabsContent value="users">
            {/* Pending Facilitator Applications */}
            {pendingFacilitators.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-4">
                <h3 className="font-semibold text-amber-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Pending Facilitator Applications ({pendingFacilitators.length})
                </h3>
                <div className="space-y-3">
                  {pendingFacilitators.map(u => (
                    <div key={u.id} className="bg-white rounded-xl p-4 flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-900">{u.first_name} {u.last_name}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                        {u.school_organization && <p className="text-xs text-gray-400 mt-0.5">{u.school_organization}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">Applied: {new Date(u.created_date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full" onClick={() => handleApprove(u)}>
                          <CheckCircle className="w-3.5 h-3.5" />Approve
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 rounded-full" onClick={() => handleReject(u)}>
                          <XCircle className="w-3.5 h-3.5" />Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search by name or email..."
                      value={search}
                      onChange={e => { setSearch(e.target.value); setUsersPage(1); }}
                      className="pl-9"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setUsersPage(1); }}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="student">Students</SelectItem>
                      <SelectItem value="facilitator">Facilitators</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-users"] })}
                    title="Refresh"
                  >
                    <RotateCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Account Type</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium text-gray-900 text-sm">
                        {[u.first_name, u.last_name].filter(Boolean).join(" ") || <span className="text-gray-400 italic">—</span>}
                      </TableCell>
                      <TableCell>
                        {u.email ? (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            {u.email}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {roleBadge(u.role, u.facilitator_status)}
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {u.created_date ? new Date(u.created_date).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          onClick={() => handleOpenUserAction(u)}
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-400 py-8">No accounts found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Pagination */}
            {totalUsersPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-gray-400">{filteredUsers.length} total · page {usersPage} of {totalUsersPages}</p>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="rounded-full" disabled={usersPage === 1} onClick={() => setUsersPage(p => p - 1)}>‹ Prev</Button>
                  <Button size="sm" variant="outline" className="rounded-full" disabled={usersPage === totalUsersPages} onClick={() => setUsersPage(p => p + 1)}>Next ›</Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Classrooms Tab ── */}
          <TabsContent value="classrooms">
            <ClassroomsTab />
          </TabsContent>

          {/* ── Home Content Tab ── */}
          <TabsContent value="content">
            <AdminContentTab />
          </TabsContent>

          {/* ── Coursewares Tab ── */}
          <TabsContent value="coursewares">
            <CoursewaresTab />
          </TabsContent>
        </Tabs>
        </div>

        {/* Create Account Dialog */}
      <CreateAccountDialog
       open={showCreateAccount}
       onClose={() => setShowCreateAccount(false)}
       onCreated={() => queryClient.invalidateQueries({ queryKey: ["admin-users"] })}
      />

      <UserActionDialog
        open={showUserActionDialog}
        onClose={() => { setShowUserActionDialog(false); setSelectedUserForAction(null); }}
        user={selectedUserForAction}
      />
      </div>
      </>
      );
      }