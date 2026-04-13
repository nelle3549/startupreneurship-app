import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, X, Chrome, Mail, Apple } from "lucide-react";
import { ICON_URL } from "../data/courseData";
import { saveUser } from "../userStorage";
import { base44 } from "@/api/base44Client";

export default function LoginSignup({ onComplete, onCancel }) {
  const [authMethod, setAuthMethod] = useState(null); // null, email, google, microsoft, facebook, apple
  const [authStage, setAuthStage] = useState("method"); // method, email-auth, profile-complete
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [emailForm, setEmailForm] = useState({ email: "", password: "", isSignup: true });
  const [profile, setProfile] = useState({ first_name: "", last_name: "", gender: "" });

  const handleOAuthLogin = async (provider) => {
    setLoading(true);
    setError("");
    
    try {
      // Redirect to Base44 OAuth login
      base44.auth.redirectToLogin(window.location.pathname);
    } catch (err) {
      setError(`Failed to sign in with ${provider}. Please try again.`);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    
    if (!emailForm.email || !emailForm.password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      // For Base44, use the redirectToLogin approach
      // In a real scenario, you'd handle email/password auth through a custom function
      base44.auth.redirectToLogin(window.location.pathname);
    } catch (err) {
      setError(emailForm.isSignup ? "Failed to create account." : "Failed to sign in.");
    }
    
    setLoading(false);
  };

  const handleEmailChange = (e) => {
    setEmailForm({ ...emailForm, [e.target.name]: e.target.value });
    setError("");
  };

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
    setError("");
  };

  const handleProfileComplete = async (e) => {
    e.preventDefault();
    
    if (!profile.first_name || !profile.last_name || !profile.gender) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    
    try {
      // Save profile to user account
      await base44.auth.updateMe({
        first_name: profile.first_name,
        last_name: profile.last_name,
        gender: profile.gender,
      });

      // Save locally
      saveUser({
        email: authUser?.email,
        full_name: `${profile.first_name} ${profile.last_name}`,
        first_name: profile.first_name,
        last_name: profile.last_name,
        gender: profile.gender,
      });

      onComplete();
    } catch (err) {
      setError("Failed to save profile. Please try again.");
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 relative">
        {onCancel && (
          <button onClick={onCancel} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
        
        {/* Logo */}
        <div className="text-center mb-6">
          <img src={ICON_URL} alt="Startupreneur" className="w-12 h-12 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900">Welcome to Startupreneur</h2>
          <p className="text-gray-500 text-sm mt-1">Sign in with your Google account</p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-xs text-red-700">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Method Selection */}
        {authStage === "method" && (
          <div className="space-y-3">
            <Button 
              onClick={() => { setAuthMethod("google"); handleOAuthLogin("Google"); }}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 rounded-full py-2.5"
            >
              <Chrome className="w-4 h-4" />
              Continue with Google
            </Button>

            <Button 
              onClick={() => { setAuthMethod("microsoft"); handleOAuthLogin("Microsoft"); }}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 rounded-full py-2.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6v-11.4H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"/>
              </svg>
              Continue with Microsoft
            </Button>

            <Button 
              onClick={() => { setAuthMethod("facebook"); handleOAuthLogin("Facebook"); }}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 rounded-full py-2.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continue with Facebook
            </Button>

            <Button 
              onClick={() => { setAuthMethod("apple"); handleOAuthLogin("Apple"); }}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 rounded-full py-2.5"
            >
              <Apple className="w-4 h-4" />
              Continue with Apple
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <Button 
              onClick={() => setAuthStage("email-auth")}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 rounded-full py-2.5"
            >
              <Mail className="w-4 h-4" />
              Continue with Email
            </Button>
          </div>
        )}

        {/* Email Authentication */}
        {authStage === "email-auth" && (
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Email</label>
              <Input
                name="email"
                type="email"
                value={emailForm.email}
                onChange={handleEmailChange}
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Password</label>
              <Input
                name="password"
                type="password"
                value={emailForm.password}
                onChange={handleEmailChange}
                placeholder="Min. 6 characters"
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full brand-gradient text-white rounded-full">
              {loading ? "Processing..." : emailForm.isSignup ? "Create Account" : "Sign In"}
            </Button>
            <Button 
              type="button"
              onClick={() => setAuthStage("method")}
              variant="ghost"
              className="w-full text-sm text-gray-600"
            >
              ← Back to other options
            </Button>
          </form>
        )}

        {/* Profile Completion Stage */}
        {authStage === "profile-complete" && (
          <form onSubmit={handleProfileComplete} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">First Name</label>
              <Input
                name="first_name"
                value={profile.first_name}
                onChange={handleProfileChange}
                placeholder="First name"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Last Name</label>
              <Input
                name="last_name"
                value={profile.last_name}
                onChange={handleProfileChange}
                placeholder="Last name"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Gender</label>
              <select
                name="gender"
                value={profile.gender}
                onChange={handleProfileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Button type="submit" disabled={loading} className="w-full brand-gradient text-white rounded-full mt-1">
              {loading ? "Completing profile..." : "Complete Profile"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}