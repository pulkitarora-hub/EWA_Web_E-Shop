"use client";

import { useSearchParams, useRouter } from "next/navigation";
import React, { useState } from "react";
import { resetPassword } from "../../lib/api";

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const email = params.get("email") || "";
 
   const [password, setPassword] = useState("");
   const [confirm, setConfirm] = useState("");
   const [loading, setLoading] = useState(false);
   const [message, setMessage] = useState<string | null>(null);
   const [error, setError] = useState<string | null>(null);
 
   async function handleReset() {
     if (!token || !email) {
       setError("Invalid reset link.");
       return;
     }
     if (password.length < 8) {
       setError("Password must be at least 8 characters.");
       return;
     }
     if (password !== confirm) {
       setError("Passwords do not match.");
       return;
     }
     setLoading(true);
     setError(null);
     setMessage(null);
     try {
       await resetPassword({ email, token, password });
       setMessage("Password reset successful. You can now sign in.");
       setTimeout(() => router.push("/"), 1500);
     } catch (err: any) {
       setError(err.message || "Reset failed.");
     } finally {
       setLoading(false);
     }
   }
 
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/ea-logo.png"
            alt="Evolve with Avadhi"
            className="h-16 sm:h-20 mx-auto mb-3"
          />
          <p className="text-charcoal-lighter text-sm">
            Set a new password to continue.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-warm-200/60 p-8">
          <h2 className="text-2xl font-semibold text-charcoal mb-2">Reset password</h2>
          <p className="text-sm text-charcoal-lighter mb-6">
            Use a strong password with at least 8 characters.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal-light mb-1.5">
                New password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-4 py-3 rounded-xl border border-warm-300 bg-warm-50/40 text-charcoal placeholder:text-charcoal-lighter/50 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-light mb-1.5">
                Confirm password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                className="w-full px-4 py-3 rounded-xl border border-warm-300 bg-warm-50/40 text-charcoal placeholder:text-charcoal-lighter/50 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition"
              />
            </div>
          </div>

          <button
            onClick={handleReset}
            disabled={loading}
            className="w-full mt-6 py-3 px-4 bg-brand-500 hover:bg-brand-600 disabled:bg-warm-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition"
          >
            {loading ? <Spinner /> : null}
            Reset password
          </button>

          {message && (
            <div className="mt-4 px-4 py-2.5 bg-sage-50 border border-sage-200 rounded-xl text-sm text-sage-700">
              {message}
            </div>
          )}
          {error && (
            <div className="mt-4 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
