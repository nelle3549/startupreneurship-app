import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Mail, Eye, EyeOff, X } from "lucide-react";
import { ICON_URL } from "../data/courseData";
import { supabase } from "@/api/supabaseClient";

export default function LoginSignup({ onComplete, onCancel }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (isSignup) {
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (!/[a-zA-Z]/.test(password)) {
        setError("Password must contain at least one letter.");
        return;
      }
      if (!/[0-9]/.test(password)) {
        setError("Password must contain at least one number.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignup) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: "", first_name: "", last_name: "" },
          },
        });
        if (signUpError) {
          if (signUpError.message.includes("already registered")) {
            setError("This email is already registered. Try signing in instead.");
          } else {
            setError(signUpError.message);
          }
          setLoading(false);
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          if (signInError.message.includes("Invalid login")) {
            setError("Invalid email or password.");
          } else {
            setError(signInError.message);
          }
          setLoading(false);
          return;
        }
      }

      // Auth state change listener in AuthContext will handle the rest
      if (onComplete) onComplete();
    } catch (err) {
      setError("Something went wrong. Please try again.");
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
          <h2 className="text-xl font-bold text-gray-900">
            {isSignup ? "Create an Account" : "Welcome Back"}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {isSignup
              ? "Sign up to get started with Startupreneurship"
              : "Sign in to continue to Startupreneurship"}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-xs text-red-700">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="you@email.com"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Min. 8 characters, letters & numbers"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isSignup && (
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Confirm Password</label>
              <Input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                placeholder="Re-enter your password"
                required
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full brand-gradient text-white rounded-full py-2.5"
          >
            {loading ? "Processing..." : isSignup ? "Create Account" : "Sign In"}
          </Button>
        </form>

        {/* Toggle Sign In / Sign Up */}
        <p className="text-center text-sm text-gray-500 mt-5">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => { setIsSignup(!isSignup); setError(""); setPassword(""); setConfirmPassword(""); }}
            className="text-blue-600 font-medium hover:underline"
          >
            {isSignup ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}
