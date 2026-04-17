import React, { useState, useEffect } from "react";
import { entities } from "@/api/entities";
import { supabase } from "@/api/supabaseClient";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Settings } from "lucide-react";

export default function UserActionDialog({ open, onClose, user }) {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState("guest");
  const [schoolName, setSchoolName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role || "guest");
      setSchoolName(user.school_organization || "");
    }
  }, [user]);

  const handleRoleChange = async () => {
    if (!user) return;
    setLoading(true);

    // Handle side effects BEFORE changing role
    if (user.role === "facilitator" && selectedRole !== "facilitator") {
      // Archive classrooms owned by this facilitator
      const ownedClassrooms = await entities.Classroom.filter({ facilitator_id: user.id });
      for (const c of ownedClassrooms) {
        await entities.Classroom.update(c.id, { is_archived: true });
      }
    }

    if (user.role === "student" && selectedRole !== "student") {
      // Remove all enrollment records for this user
      const enrollments = await entities.Enrollment.filter({ student_id: user.id });
      for (const e of enrollments) {
        await entities.Enrollment.delete(e.id);
      }
    }

    const updateData = { role: selectedRole };
    if (selectedRole === "facilitator") {
      updateData.facilitator_status = "approved";
      if (schoolName) updateData.school_organization = schoolName;
    } else if (user.role === "facilitator") {
      updateData.facilitator_status = "none";
    }

    // Update both User entity and UserAccount entity
    await entities.User.update(user.id, updateData);
    if (user.email) {
      const accounts = await entities.UserAccount.filter({ email: user.email });
      if (accounts.length > 0) {
        const accountUpdate = { role: selectedRole };
        if (updateData.facilitator_status !== undefined) accountUpdate.facilitator_status = updateData.facilitator_status;
        if (schoolName && selectedRole === "facilitator") accountUpdate.school_organization = schoolName;
        await entities.UserAccount.update(accounts[0].id, accountUpdate);
      }
    }

    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    queryClient.invalidateQueries({ queryKey: ["admin-user-accounts"] });
    queryClient.invalidateQueries({ queryKey: ["admin-classrooms"] });
    setLoading(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!user) return;
    const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email || "this user";
    if (!confirm(`Permanently delete account for ${name}? This cannot be undone.`)) return;
    setLoading(true);
    await supabase.functions.invoke('delete-user-and-data', {
      body: { targetUserId: user.id },
    });
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    queryClient.invalidateQueries({ queryKey: ["admin-user-accounts"] });
    setLoading(false);
    onClose();
  };

  if (!user) return null;

  const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email || "Unknown";
  const roleChanged = selectedRole !== (user.role || "guest");
  const isFacilitatorDemotion = user.role === "facilitator" && selectedRole !== "facilitator";
  const isStudentPromotion = user.role === "student" && selectedRole !== "student";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-500" />
            Manage Account
          </DialogTitle>
          <DialogDescription>
            Managing <strong>{displayName}</strong>
            {user.email && <span className="block text-xs mt-0.5 text-gray-400">{user.email}</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current Role */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Current type:</span>
            <Badge className="bg-gray-100 text-gray-700 border-0 text-xs capitalize">
              {user.role || "guest"}
              {user.facilitator_status === "pending" ? " (Pending)" : ""}
            </Badge>
          </div>

          {/* Role Selector */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Change Account Type</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="facilitator">Facilitator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="guest">Guest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Facilitator: school field */}
          {selectedRole === "facilitator" && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">School / Organization</label>
              <Input
                placeholder="Enter school or organization"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
              />
            </div>
          )}

          {/* Warning: facilitator demotion */}
          {isFacilitatorDemotion && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-700">
                ⚠️ This facilitator's classrooms will be <strong>archived</strong>. An admin can reassign them later from the Classrooms tab.
              </p>
            </div>
          )}

          {/* Warning: student promotion */}
          {isStudentPromotion && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                ℹ️ All active <strong>enrollment records</strong> for this user will be removed.
              </p>
            </div>
          )}

          {/* Save Role */}
          {roleChanged && (
            <Button
              onClick={handleRoleChange}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          )}

          <hr className="border-gray-200" />

          {/* Delete Account */}
          <Button
            variant="outline"
            className="w-full text-red-600 border-red-200 hover:bg-red-50 rounded-full gap-2"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}