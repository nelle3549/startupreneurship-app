import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { entities } from "@/api/entities";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, User, ChevronRight, Trash2, CheckCircle, LogOut, GraduationCap, Briefcase
} from "lucide-react";
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
import { ICON_URL } from "../components/data/courseData";
import { getSavedUser, saveUser, clearSavedUser } from "../components/userStorage";
import { deleteAllProgress } from "../components/progressStorage";
import { useCurrentUser } from "../components/useCurrentUser";
import StudentForm from "../components/registration/StudentForm";
import FacilitatorForm from "../components/registration/FacilitatorForm";

function getInitialForm(user) {
  return {
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    extension: user.extension || "",
    gender: user.gender || "",
    school_organization: user.school_organization || "",
    province: user.province || "",
    city_municipality: user.city_municipality || "",
  };
}

function toTitleCase(str) {
  if (!str) return "";
  return str.toLowerCase().split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export default function AccountSettings() {
  const navigate = useNavigate();
  const { user: authUser, isAdmin } = useCurrentUser();
  const [currentUser, setCurrentUser] = React.useState(() => {
    // Prioritize authUser (database) over localStorage
    if (authUser?.id) {
      return {
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.full_name,
        first_name: authUser.first_name || "",
        last_name: authUser.last_name || "",
        extension: authUser.extension || "",
        gender: authUser.gender || "",
        school_organization: authUser.school_organization || "",
        province: authUser.province || "",
        city_municipality: authUser.city_municipality || "",
        role: authUser.role,
        facilitator_status: authUser.facilitator_status,
      };
    }
    return getSavedUser() || {};
  });

  const refreshUser = () => setCurrentUser(getSavedUser() || {});

  const accountType = isAdmin
    ? { label: "Admin", color: "bg-red-100 text-red-700" }
    : authUser?.facilitator_status === "pending"
    ? { label: "Facilitator (Pending)", color: "bg-amber-100 text-amber-700" }
    : authUser?.role === "facilitator" && authUser?.facilitator_status === "approved"
    ? { label: "Facilitator", color: "bg-blue-100 text-blue-700" }
    : authUser?.role === "student"
    ? { label: "Student", color: "bg-emerald-100 text-emerald-700" }
    : authUser?.role === "guest" || !authUser?.role
    ? { label: "Guest", color: "bg-gray-100 text-gray-500" }
    : { label: "Guest", color: "bg-gray-100 text-gray-500" };

  const [form, setForm] = useState(() => getInitialForm(currentUser));
  const [saved, setSaved] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pendingNav, setPendingNav] = useState(null);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showFacilitatorForm, setShowFacilitatorForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: "", new: "", confirm: "" });
  const [passwordMessage, setPasswordMessage] = useState("");

  const initial = getInitialForm(currentUser);
  const hasChanges = Object.keys(form).some((k) => form[k] !== initial[k]);

  // Intercept browser back/refresh when unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async (thenNavigate) => {
    const updatedUser = { 
      ...currentUser, 
      ...form,
      first_name: toTitleCase(form.first_name),
      last_name: toTitleCase(form.last_name),
    };
    saveUser(updatedUser);
    setCurrentUser(updatedUser);
    
    // Save to UserAccount entity (single source of truth)
    if (authUser?.account_id) {
      await entities.UserAccount.update(authUser.account_id, {
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        extension: updatedUser.extension,
        gender: updatedUser.gender,
        school_organization: updatedUser.school_organization,
        province: updatedUser.province,
        city_municipality: updatedUser.city_municipality,
      });
    }
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    if (thenNavigate && typeof thenNavigate === "string") {
      setPendingNav(null);
      navigate(thenNavigate);
    }
  };

  const safeNavigate = (to) => {
    if (hasChanges) {
      setPendingNav(to);
    } else {
      navigate(to);
    }
  };

  const handleDeleteAccount = async () => {
    if (!authUser?.id) return;
    // Call Edge Function FIRST while session is still valid
    await supabase.functions.invoke('delete-user-and-data');
    // Then clean up local data and sign out
    deleteAllProgress();
    clearSavedUser();
    localStorage.clear();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => safeNavigate("/Home")}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-700" />
          </button>
          <div className="flex items-center gap-3">
            <img src={ICON_URL} alt="Startupreneur" className="w-7 h-7" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Account Settings</h1>

            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${accountType.color}`}>
              {accountType.label}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">





        {/* Personal Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <User className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Personal Information</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">First Name</label>
              <Input
                value={form.first_name}
                onChange={(e) => handleChange("first_name", e.target.value)}
                placeholder="First name"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Last Name</label>
              <Input
                value={form.last_name}
                onChange={(e) => handleChange("last_name", e.target.value)}
                placeholder="Last name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Extension</label>
                <Input
                  value={form.extension}
                  onChange={(e) => handleChange("extension", e.target.value)}
                  placeholder="e.g. Jr., Sr., III"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => handleChange("gender", e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">School/Organization</label>
              <Input
                value={form.school_organization}
                onChange={(e) => handleChange("school_organization", e.target.value)}
                placeholder="School or organization name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Region</label>
                <Input
                  value={form.province}
                  onChange={(e) => handleChange("province", e.target.value)}
                  placeholder="Region"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">City/Municipality</label>
                <Input
                  value={form.city_municipality}
                  onChange={(e) => handleChange("city_municipality", e.target.value)}
                  placeholder="City or municipality"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        {(hasChanges || saved) && (
          <Button
            onClick={handleSave}
            className={`w-full rounded-full py-3 text-sm gap-2 transition-all ${
              saved ? "bg-emerald-500 hover:bg-emerald-500 text-white" : "brand-gradient text-white"
            }`}
          >
            {saved ? <><CheckCircle className="w-4 h-4" /> Changes Saved</> : "Save Changes"}
          </Button>
        )}

        {/* Enrollment */}
        {authUser?.role === 'guest' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-6 pt-5 pb-3">Join a Classroom</h2>
          <button
            onClick={() => setShowStudentForm(true)}
            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors border-t border-gray-100"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-gray-900">Enroll as Student</p>
              <p className="text-xs text-gray-500">Join a classroom using an enrollment code</p>
            </div>
            {currentUser.role === "student" && currentUser.classroom_code && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 mr-1">Pending</span>
            )}
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
          <button
            onClick={() => setShowFacilitatorForm(true)}
            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors border-t border-gray-100"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-gray-900">Register as Facilitator</p>
              <p className="text-xs text-gray-500">Create and manage your own classrooms</p>
            </div>
            {authUser?.role === "facilitator" && authUser?.facilitator_status === "pending" && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 mr-1">Pending Approval</span>
            )}
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
        </div>
        )}

        {/* Other Options */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-6 pt-5 pb-3">Other Options</h2>

          <button
            onClick={() => {
              setShowPasswordForm(!showPasswordForm);
              setPasswordData({ current: "", new: "", confirm: "" });
              setPasswordMessage("");
            }}
            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors border-t border-gray-100"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <div className="w-4 h-4 text-blue-500">🔐</div>
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-gray-900">Change Password</p>
              <p className="text-xs text-gray-500">Update your account password</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>

          {showPasswordForm && (
            <div className="px-6 py-4 border-t border-gray-100 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Current Password</label>
                <Input
                  type="password"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                  placeholder="Enter your current password"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">New Password</label>
                <Input
                  type="password"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                  placeholder="Enter new password (min. 6 characters)"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Confirm Password</label>
                <Input
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                  placeholder="Confirm new password"
                />
              </div>
              {passwordMessage && (
                <p className={`text-xs font-medium ${passwordMessage.includes("success") || passwordMessage.includes("coming") ? "text-blue-600" : "text-red-600"}`}>
                  {passwordMessage}
                </p>
              )}
              <button
                onClick={() => {
                  if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
                    setPasswordMessage("All fields are required");
                  } else if (passwordData.new !== passwordData.confirm) {
                    setPasswordMessage("New passwords do not match");
                  } else if (passwordData.new.length < 6) {
                    setPasswordMessage("Password must be at least 6 characters");
                  } else {
                    setPasswordMessage("✓ Password change feature coming soon");
                  }
                }}
                className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition"
              >
                Update Password
              </button>
            </div>
          )}

          <button
            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors border-t border-gray-100"
            onClick={() => { 
              clearSavedUser(); 
              supabase.auth.signOut().then(() => window.location.href = "/");
            }}
          >
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
              <LogOut className="w-4 h-4 text-gray-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">Log Out</p>
              <p className="text-xs text-gray-500">{authUser?.email || "Sign out of your current account"}</p>
            </div>
          </button>

          <button
            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-red-50 transition-colors border-t border-gray-100"
            onClick={() => setShowDeleteDialog(true)}
          >
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-red-600">Delete Account</p>
              <p className="text-xs text-gray-500">Remove your account and all saved data</p>
            </div>
          </button>
        </div>

      </div>

      {/* Unsaved Changes Floating Prompt */}
      {pendingNav && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
          <div className="absolute inset-0 bg-black/30" onClick={() => setPendingNav(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
            <h3 className="text-base font-bold text-gray-900 mb-1">Unsaved Changes</h3>
            <p className="text-sm text-gray-500 mb-5">You have unsaved changes. Do you want to save before leaving?</p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => handleSave(pendingNav)}
                className="brand-gradient text-white rounded-full w-full"
              >
                Save &amp; Leave
              </Button>
              <Button
                variant="outline"
                onClick={() => { setPendingNav(null); navigate(pendingNav); }}
                className="rounded-full w-full"
              >
                Discard &amp; Leave
              </Button>
              <button
                onClick={() => setPendingNav(null)}
                className="text-sm text-gray-400 hover:text-gray-600 mt-1"
              >
                Keep Editing
              </button>
            </div>
          </div>
        </div>
      )}

      {showStudentForm && (
        <StudentForm
          onBack={() => setShowStudentForm(false)}
          onComplete={() => { setShowStudentForm(false); refreshUser(); }}
        />
      )}

      {showFacilitatorForm && (
        <FacilitatorForm
          onBack={() => setShowFacilitatorForm(false)}
          onComplete={() => { setShowFacilitatorForm(false); refreshUser(); }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all saved progress. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}