import React, { useState } from "react";
import LoginSignup from "./registration/LoginSignup";
import RoleSelector from "./registration/RoleSelector";
import FacilitatorForm from "./registration/FacilitatorForm";
import StudentForm from "./registration/StudentForm";
import { saveUser, getSavedUser } from "./userStorage";

export default function RegistrationForm({ onComplete, user }) {
  // Steps: "login" → "role" → "facilitator" | "student" | done
  const [step, setStep] = useState("login");
  const [baseUser, setBaseUser] = useState(null);

  const handleLoginComplete = (accountData) => {
    // Merge with any existing saved user data
    const existing = getSavedUser() || {};
    const merged = { ...existing, ...accountData };
    saveUser(merged);
    setBaseUser(merged);
    setStep("role");
  };

  const handleRoleSelect = (role) => {
    if (role === "facilitator") setStep("facilitator");
    else if (role === "student") setStep("student");
    else {
      // skip role setup
      onComplete();
    }
  };

  const handleSkipRole = () => {
    onComplete();
  };

  if (step === "login") {
    return <LoginSignup onComplete={handleLoginComplete} />;
  }

  if (step === "role") {
    return <RoleSelector onSelect={handleRoleSelect} onSkip={handleSkipRole} />;
  }

  if (step === "facilitator") {
    return <FacilitatorForm onBack={() => setStep("role")} onComplete={onComplete} />;
  }

  if (step === "student") {
    return <StudentForm onBack={() => setStep("role")} onComplete={onComplete} />;
  }

  return null;
}