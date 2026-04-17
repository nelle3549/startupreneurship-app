import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, QrCode, Hash, Clock, Trash2 } from "lucide-react";
import { saveUser, getSavedUser } from "../userStorage";
import { entities } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";

export default function StudentForm({ onBack, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [codeMethod, setCodeMethod] = useState("type"); // "type" | "qr"
  const currentUser = getSavedUser() || {};
  
  // Check if personal info is complete
  const hasPersonalInfo = currentUser.first_name && currentUser.last_name && currentUser.gender && currentUser.school_organization;
  
  const [formData, setFormData] = useState({
    classroom_code: "",
  });
  const [showPendingDialog, setShowPendingDialog] = useState(null); // null = checking, false = not pending, true = show pending
  const [pendingEnrollment, setPendingEnrollment] = useState(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusData, setStatusData] = useState(null);

  // Fetch pending enrollments for this user
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["student-enrollments", currentUser?.email],
    queryFn: () => entities.Enrollment.list(),
    enabled: !!currentUser?.email,
    select: (data) => data.filter(e => e.student_email === currentUser?.email && e.status === "pending"),
  });

  useEffect(() => {
    if (!enrollmentsLoading) {
      if (enrollments.length > 0) {
        setPendingEnrollment(enrollments[0]);
        setShowPendingDialog(true);
      } else {
        setShowPendingDialog(false);
      }
    }
  }, [enrollments.length, enrollmentsLoading]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Find classroom by code
      const classrooms = await entities.Classroom.list();
      const classroom = classrooms.find(c => c.enrollment_code === formData.classroom_code.toUpperCase());
      
      if (!classroom) {
        alert("Classroom code not found. Please check and try again.");
        setLoading(false);
        return;
      }

      // Create enrollment request
      const enrollment = await entities.Enrollment.create({
        classroom_id: classroom.id,
        student_id: currentUser.id || "",
        student_email: currentUser.email || "",
        student_name: `${currentUser.first_name} ${currentUser.last_name}`,
        status: "pending",
      });

      // Update UserAccount record
      const accounts = await entities.UserAccount.filter({ email: currentUser.email });
      if (accounts.length > 0) {
        await entities.UserAccount.update(accounts[0].id, { role: "student" });
      }

      saveUser({ ...currentUser, role: "student" });
      
      // Show status dialog with classroom details
      setStatusData({
        classroom,
        enrollment,
      });
      setShowStatusDialog(true);
    } catch (err) {
      console.error("Failed to submit enrollment:", err);
      alert("An error occurred. Please try again.");
    }
    setLoading(false);
  };

  const handleCancelEnrollment = async () => {
    if (!pendingEnrollment?.id) return;
    try {
      await entities.Enrollment.delete(pendingEnrollment.id);
      setPendingEnrollment(null);
      setShowPendingDialog(false);
    } catch (err) {
      console.error("Failed to cancel enrollment:", err);
    }
  };

  // Show status dialog after enrollment submission
  if (showStatusDialog && statusData?.classroom) {
    const { classroom } = statusData;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 mx-auto mb-4">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 text-center mb-2">Request Sent</h2>
          <p className="text-sm text-gray-600 text-center mb-6">
            Your enrollment request has been submitted and is pending approval.
          </p>
          
          <div className="bg-gray-50 rounded-2xl p-5 mb-6 space-y-4">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Classroom</p>
              <p className="text-sm font-semibold text-gray-900">{classroom.name}</p>
            </div>
            {classroom.school && (
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">School</p>
                <p className="text-sm text-gray-700">{classroom.school}</p>
              </div>
            )}
            {classroom.facilitator_email && (
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Facilitator</p>
                <p className="text-sm text-gray-700">{classroom.facilitator_email}</p>
              </div>
            )}
            {classroom.description && (
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Description</p>
                <p className="text-sm text-gray-700">{classroom.description}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => {
                setShowStatusDialog(false);
                onComplete();
              }}
              className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Done
            </Button>
            <Button
              onClick={() => setShowStatusDialog(false)}
              variant="outline"
              className="w-full rounded-full"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show error if personal info not complete
  if (!hasPersonalInfo) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Complete Your Profile First</h2>
          <p className="text-sm text-gray-600 mb-5">
            You need to complete your personal information before enrolling as a student. This helps your facilitator identify you and track your progress.
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

  // Show loading state while checking enrollments
  if (showPendingDialog === null) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show pending dialog if enrollment exists
  if (showPendingDialog && pendingEnrollment) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 mx-auto mb-4">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 text-center mb-2">Enrollment Pending</h2>
          <p className="text-sm text-gray-600 text-center mb-6">
            Your enrollment request to join a classroom is still pending approval from the facilitator.
          </p>
          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <p className="text-xs text-gray-500 font-medium mb-1">Classroom Code</p>
            <p className="text-lg font-mono font-bold text-gray-900">{pendingEnrollment.classroom_id?.substring(0, 8).toUpperCase()}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => {
                setShowPendingDialog(false);
                onBack();
              }}
              className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Back
            </Button>
            <Button
              onClick={handleCancelEnrollment}
              variant="outline"
              className="w-full rounded-full text-red-600 border-red-200 hover:bg-red-50 gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Cancel Enrollment
            </Button>
          </div>
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
            <h2 className="text-lg font-bold text-gray-900">Student Registration</h2>
            <p className="text-xs text-gray-500">You'll need a classroom code from your facilitator</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
            <strong>Your Info:</strong> {currentUser.first_name} {currentUser.last_name} • {currentUser.school_organization}
          </div>

          {/* Classroom Code Section */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Join Classroom *</label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setCodeMethod("type")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  codeMethod === "type" ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <Hash className="w-4 h-4" />
                Enter Code
              </button>
              <button
                type="button"
                onClick={() => setCodeMethod("qr")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  codeMethod === "qr" ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <QrCode className="w-4 h-4" />
                Scan QR
              </button>
            </div>

            {codeMethod === "type" && (
              <Input
                name="classroom_code"
                value={formData.classroom_code}
                onChange={handleChange}
                placeholder="e.g. ABC-1234"
                className="font-mono text-center text-lg tracking-widest uppercase"
                required
              />
            )}

            {codeMethod === "qr" && (
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center bg-gray-50">
                <QrCode className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-medium">QR Scanner</p>
                <p className="text-xs text-gray-400 mt-1">Point your camera at the QR code provided by your facilitator</p>
                <p className="text-xs text-amber-600 mt-3 font-medium">📱 QR scanning requires camera access (coming soon)</p>
                <button
                  type="button"
                  onClick={() => setCodeMethod("type")}
                  className="mt-3 text-xs text-blue-600 underline"
                >
                  Enter code manually instead
                </button>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
            <strong>Don't have a code?</strong> Ask your teacher or facilitator for the classroom code or QR to join.
          </div>

          <Button
            type="submit"
            disabled={loading || (codeMethod === "type" && !formData.classroom_code)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full"
          >
            {loading ? "Joining..." : "Join Classroom"}
          </Button>
        </form>
      </div>
    </div>
  );
}