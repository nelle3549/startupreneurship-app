import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, CheckCircle } from "lucide-react";

export default function CreateAccountDialog({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ email: "", role: "student", classroomCode: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email.trim()) {
      setError("Email address is required.");
      return;
    }

    setLoading(true);
    try {
      // Platform only accepts "user" or "admin" — map custom app roles accordingly
      const platformRole = form.role === "admin" ? "admin" : "user";
      await base44.users.inviteUser(form.email.trim(), platformRole);

      // Pre-create a UserAccount so the intended app role is ready when they first log in
      const existing = await base44.entities.UserAccount.filter({ email: form.email.trim() });
      if (existing.length === 0) {
        await base44.entities.UserAccount.create({
          email: form.email.trim(),
          role: form.role,
          facilitator_status: form.role === "facilitator" ? "approved" : "none",
        });
      }

      // If student + classroom code provided, create a pending enrollment
      if (form.role === "student" && form.classroomCode.trim()) {
        const classrooms = await base44.entities.Classroom.filter({ enrollment_code: form.classroomCode.trim().toUpperCase() });
        if (classrooms.length > 0) {
          const classroom = classrooms[0];
          await base44.entities.Enrollment.create({
            classroom_id: classroom.id,
            student_id: "", // will be filled when student accepts invite and logs in
            student_email: form.email.trim(),
            student_name: "",
            status: "pending",
          });
        } else {
          setError("Classroom code not found. Invitation was still sent.");
        }
      }

      setDone(true);
      onCreated?.();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to send invitation.");
    }
    setLoading(false);
  };

  const handleClose = () => {
    setForm({ email: "", role: "student", classroomCode: "" });
    setDone(false);
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Invite Account
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="font-semibold text-gray-900">Invitation Sent!</p>
            <p className="text-sm text-gray-500 mt-1">An invitation has been sent to <strong>{form.email}</strong>. Once accepted, they'll be assigned the <strong>{form.role}</strong> role.</p>
            <Button onClick={handleClose} className="mt-5 w-full rounded-full">Done</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Email Address *</label>
              <Input
                type="email"
                placeholder="e.g. juan@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Account Type *</label>
              <Select value={form.role} onValueChange={val => setForm({ ...form, role: val, classroomCode: "" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="facilitator">Facilitator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.role === "student" && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Classroom Code</label>
                <Input
                  placeholder="e.g. ABC123"
                  value={form.classroomCode}
                  onChange={e => setForm({ ...form, classroomCode: e.target.value })}
                />
                <p className="text-xs text-gray-400 mt-1">Enrollment will be marked as pending until approved by the facilitator.</p>
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1 rounded-full">Cancel</Button>
              <Button type="submit" disabled={loading} className="flex-1 rounded-full brand-gradient text-white">
                {loading ? "Sending..." : "Send Invite"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}