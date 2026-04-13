import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, UserCheck, AlertCircle } from "lucide-react";

const ROLES = [
  { id: "admin", label: "Admin", color: "bg-red-100 text-red-700", description: "Full system access and user management" },
  { id: "facilitator", label: "Facilitator", color: "bg-purple-100 text-purple-700", description: "Can create classrooms and manage students" },
  { id: "student", label: "Student", color: "bg-blue-100 text-blue-700", description: "Standard user access to courses" },
  { id: "guest", label: "Guest", color: "bg-gray-100 text-gray-600", description: "Limited read-only access" },
];

export default function RoleManagementTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState(null); // "student" or "facilitator"
  const [dialogUser, setDialogUser] = useState(null);
  const [selectedClassroom, setSelectedClassroom] = useState("");
  const [schoolName, setSchoolName] = useState("");

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users-role-mgmt"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: classrooms = [] } = useQuery({
    queryKey: ["admin-classrooms-for-enrollment"],
    queryFn: () => base44.entities.Classroom.list(),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, role, facilitator_status, school, classroom_id }) => 
      base44.entities.User.update(id, { 
        role, 
        ...(facilitator_status && { facilitator_status }),
        ...(school && { school }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users-role-mgmt"] }),
  });

  const filteredUsers = users.filter(u => {
    const matchSearch = !search || `${u.full_name || ""} ${u.email || ""}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const roleStats = ROLES.map(role => ({
    ...role,
    count: users.filter(u => u.role === role.id).length,
  }));

  const handleRoleChange = (userId, newRole) => {
    if (newRole === "student") {
      setDialogMode("student");
      setDialogUser(users.find(u => u.id === userId));
      setSelectedClassroom("");
      setDialogOpen(true);
    } else if (newRole === "facilitator") {
      setDialogMode("facilitator");
      setDialogUser(users.find(u => u.id === userId));
      setSchoolName("");
      setDialogOpen(true);
    } else {
      updateUserMutation.mutate({ 
        id: userId, 
        role: newRole,
      });
    }
  };

  const handleConfirmRole = () => {
    if (!dialogUser) return;
    
    if (dialogMode === "student") {
      updateUserMutation.mutate({ 
        id: dialogUser.id, 
        role: "student",
      });
    } else if (dialogMode === "facilitator") {
      updateUserMutation.mutate({ 
        id: dialogUser.id, 
        role: "facilitator",
        facilitator_status: "approved",
        school: schoolName || undefined,
      });
    }
    
    setDialogOpen(false);
    setDialogMode(null);
    setDialogUser(null);
  };

  const pendingFacilitators = users.filter(u => u.role === "facilitator" && u.facilitator_status === "pending").length;
  
  const guestCount = users.filter(u => u.role === "guest").length;
  const studentCount = users.filter(u => u.role === "student").length;
  const facilitatorApprovedCount = users.filter(u => u.role === "facilitator" && u.facilitator_status === "approved").length;

  return (
    <div className="space-y-6">
      {/* Account Type Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Account Type Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Guest", count: guestCount, color: "bg-gray-100 text-gray-600", icon: "👤" },
              { label: "Student", count: studentCount, color: "bg-blue-100 text-blue-700", icon: "📚" },
              { label: "Facilitator", count: facilitatorApprovedCount, color: "bg-purple-100 text-purple-700", icon: "👨‍🏫" },
              { label: "Admin", count: users.filter(u => u.role === "admin").length, color: "bg-red-100 text-red-700", icon: "🛡️" },
            ].map(stat => (
              <div key={stat.label} className={`p-3 rounded-lg ${stat.color} text-center`}>
                <div className="text-xl mb-1">{stat.icon}</div>
                <p className="text-2xl font-bold">{stat.count}</p>
                <p className="text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Definitions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Role Definitions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ROLES.map(role => (
            <div key={role.id} className="flex items-start gap-3 pb-3 border-b last:border-b-0 last:pb-0">
              <Badge className={role.color}>{role.label}</Badge>
              <p className="text-xs text-gray-600">{role.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* User Role Assignment */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            <CardTitle className="text-sm">Assign User Roles</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {ROLES.map(role => (
                    <SelectItem key={role.id} value={role.id}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No users found.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{u.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                  <Select
                    value={u.role || "guest"}
                    onValueChange={(newRole) => handleRoleChange(u.id, newRole)}
                  >
                    <SelectTrigger className="w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map(role => (
                        <SelectItem key={role.id} value={role.id}>{role.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for Student Enrollment or Facilitator School */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "student" ? "Enroll Student" : "Add Facilitator"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "student" 
                ? `Select a classroom to enroll ${dialogUser?.full_name}` 
                : `Enter school name for ${dialogUser?.full_name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {dialogMode === "student" ? (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Select Classroom
                </label>
                <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a classroom..." />
                  </SelectTrigger>
                  <SelectContent>
                    {classrooms.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  School / Organization
                </label>
                <Input
                  placeholder="Enter school or organization name"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmRole}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={dialogMode === "student" && !selectedClassroom}
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}