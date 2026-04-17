import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Clock } from "lucide-react";
import { saveUser, getSavedUser } from "../userStorage";
import { useCurrentUser } from "../useCurrentUser";
import { entities } from "@/api/entities";

export default function FacilitatorForm({ onBack, onComplete }) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user: dbUser, userAccount } = useCurrentUser();
  const currentUser = dbUser || getSavedUser() || {};

  // Check if personal info is complete — use userAccount (database) as source of truth
  const hasPersonalInfo = (userAccount?.first_name && userAccount?.last_name && userAccount?.gender && userAccount?.school_organization)
    || (currentUser.first_name && currentUser.last_name && currentUser.gender && currentUser.school_organization);
  
  const [formData, setFormData] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Find and update UserAccount record
      const accounts = await entities.UserAccount.filter({ email: currentUser.email });
      if (accounts.length > 0) {
        await entities.UserAccount.update(accounts[0].id, {
          role: "facilitator",
          facilitator_status: "pending",
        });
      }
      saveUser({ ...currentUser, role: "facilitator", facilitator_status: "pending" });
    } catch (err) {
      console.error("Failed to submit facilitator application:", err);
    }
    setLoading(false);
    setSubmitted(true);
  };

  // Show error if personal info not complete
  if (!hasPersonalInfo) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Complete Your Profile First</h2>
          <p className="text-sm text-gray-600 mb-5">
            You need to complete your personal information before registering as a facilitator. This helps admins verify your credentials and identify you.
          </p>
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-2 text-sm">
            <p className={currentUser.first_name ? "text-emerald-600 font-medium" : "text-gray-500"}>
              {currentUser.first_name ? "✓ First Name" : "• First Name"}
            </p>
            <p className={currentUser.last_name ? "text-emerald-600 font-medium" : "text-gray-500"}>
              {currentUser.last_name ? "✓ Last Name" : "• Last Name"}
            </p>
            <p className={currentUser.gender ? "text-emerald-600 font-medium" : "text-gray-500"}>
              {currentUser.gender ? "✓ Gender" : "• Gender"}
            </p>
            <p className={currentUser.school_organization ? "text-emerald-600 font-medium" : "text-gray-500"}>
              {currentUser.school_organization ? "✓ School/Organization" : "• School/Organization"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack} className="flex-1 rounded-full">
              Back
            </Button>
            <Button onClick={onBack} className="flex-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white">
              Go to Settings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Registration Submitted!</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Your facilitator account is pending approval by an administrator. You'll be notified once your credentials have been verified. In the meantime, you can explore the app as a guest.
          </p>
          <Button
            onClick={onComplete}
            className="w-full brand-gradient text-white rounded-full"
          >
            Continue as Guest
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Facilitator Registration</h2>
            <p className="text-xs text-gray-500">Requires admin approval</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
            <strong>Your Info:</strong> {currentUser.first_name} {currentUser.last_name} • {currentUser.school_organization}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            <strong>Note:</strong> Your account will be reviewed by an administrator before you can access facilitator features. This process usually takes 1–2 business days.
          </div>

          <Button type="submit" disabled={loading} className="w-full brand-gradient text-white rounded-full">
            {loading ? "Submitting..." : "Submit for Approval"}
          </Button>
        </form>
      </div>
    </div>
  );
}