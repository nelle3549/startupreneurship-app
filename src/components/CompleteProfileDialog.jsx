import React, { useState } from "react";
import { entities } from "@/api/entities";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ICON_URL } from "@/components/data/courseData";
import { useQueryClient } from "@tanstack/react-query";

const SKIP_KEY = "startupreneur_profile_skipped";

export default function CompleteProfileDialog({ userAccount, authUser }) {
  const queryClient = useQueryClient();
  const [skipped, setSkipped] = useState(() => localStorage.getItem(SKIP_KEY) === "true");
  const [form, setForm] = useState({
    first_name: userAccount?.first_name || "",
    last_name: userAccount?.last_name || "",
    extension: userAccount?.extension || "",
    gender: userAccount?.gender || "",
    school_organization: userAccount?.school_organization || "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = "First name is required.";
    if (!form.last_name.trim()) e.last_name = "Last name is required.";
    if (!form.gender) e.gender = "Please select a gender.";
    if (!form.school_organization.trim()) e.school_organization = "School/Organization is required.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    await entities.UserAccount.update(userAccount.id, {
      ...form,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      school_organization: form.school_organization.trim(),
      onboarding_completed: true,
    });
    localStorage.removeItem(SKIP_KEY);
    queryClient.invalidateQueries({ queryKey: ["user-account"] });
    setLoading(false);
  };

  const handleSkip = () => {
    localStorage.setItem(SKIP_KEY, "true");
    setSkipped(true);
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const open = !!userAccount && !userAccount.onboarding_completed && !skipped;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleSkip(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <img src={ICON_URL} alt="Startupreneur" className="w-8 h-8" />
            <DialogTitle className="text-lg">Complete Your Profile</DialogTitle>
          </div>
          <DialogDescription>
            Fill in a few details to get the most out of Startupreneurship. You can skip this and complete it later in Account Settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">First Name *</label>
              <Input
                value={form.first_name}
                onChange={e => handleChange("first_name", e.target.value)}
                placeholder="First name"
              />
              {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Last Name *</label>
              <Input
                value={form.last_name}
                onChange={e => handleChange("last_name", e.target.value)}
                placeholder="Last name"
              />
              {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Extension</label>
              <Input
                value={form.extension}
                onChange={e => handleChange("extension", e.target.value)}
                placeholder="Jr., Sr., III"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Gender *</label>
              <select
                value={form.gender}
                onChange={e => handleChange("gender", e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
              {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender}</p>}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">School / Organization *</label>
            <Input
              value={form.school_organization}
              onChange={e => handleChange("school_organization", e.target.value)}
              placeholder="School or organization name"
            />
            {errors.school_organization && <p className="text-xs text-red-500 mt-1">{errors.school_organization}</p>}
          </div>

          <div className="flex gap-3 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              className="flex-1 rounded-full"
            >
              Skip for now
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 brand-gradient text-white rounded-full"
            >
              {loading ? "Saving..." : "Save & Continue"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
