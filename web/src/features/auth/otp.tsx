import React, { useState } from "react";
import {
  googleAuth,
  loginWithPassword,
  signUpWithPassword,
  requestPasswordReset,
  User,
} from "../../lib/api";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import PhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";

type Props = {
  onAuthed: (token: string, user: User) => void;
};

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function OtpLogin({ onAuthed }: Props) {
  const [phone, setPhone] = useState<string | undefined>("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  async function handleGoogleSuccess(response: CredentialResponse) {
    if (!response.credential) return;
    setLoading(true);
    setError(null);
    try {
      const res = await googleAuth(response.credential);
      onAuthed(res.token, res.user);
    } catch {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordAuth() {
    setLoading(true);
    setError(null);
    try {
      if (authMode === "signup") {
        const res = await signUpWithPassword({
          email: authMethod === "email" ? email : undefined,
          phone: authMethod === "phone" ? phone : undefined,
          password,
          name: fullName || undefined,
        });
        onAuthed(res.token, res.user);
      } else {
        const res = await loginWithPassword({
          email: authMethod === "email" ? email : undefined,
          phone: authMethod === "phone" ? phone : undefined,
          password,
        });
        onAuthed(res.token, res.user);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!forgotEmail) return;
    setLoading(true);
    setError(null);
    setForgotMessage(null);
    try {
      await requestPasswordReset(forgotEmail);
      setForgotMessage("If an account exists for this email, a reset link has been sent.");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Brand & Imagery (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-deep overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-deep via-deep-light to-brand-900/40" />
        
        {/* Decorative circles */}
        <div className="absolute top-20 -left-20 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-60 h-60 bg-lavender-400/10 rounded-full blur-3xl" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-10 lg:p-12 xl:p-16 w-full h-full">
          {/* Top - Logo */}
          <div>
            <img
              src="/ea-logo.png"
              alt="Evolve with Avadhi"
              className="h-14 xl:h-16 w-auto"
            />
          </div>

          {/* Bottom - Quote */}
          <div>
            <h1 className="font-heading text-3xl xl:text-4xl 2xl:text-5xl text-white font-semibold leading-tight mb-4">
              "Your journey to inner peace starts here"
            </h1>
            <p className="text-brand-400 text-lg xl:text-xl font-medium">
              Evolve with Avadhi
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form (NO logo on desktop) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-4 sm:px-8 py-8 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile only - Logo (hidden on desktop) */}
          <div className="text-center mb-8 lg:hidden">
            <img
              src="/ea-logo.png"
              alt="Evolve with Avadhi"
              className="h-16 mx-auto mb-3"
            />
            <p className="text-brand-500 text-xs tracking-[0.15em] uppercase">
              Empower. Thrive. Transcend.
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-warm-200/60 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-charcoal">
                  {authMode === "signup" ? "Create your account" : "Welcome back"}
                </h2>
                <p className="text-sm text-charcoal-lighter mt-1">
                  {authMode === "signup"
                    ? "Join your healing journey in minutes."
                    : "Sign in to continue your journey."}
                </p>
              </div>
              <button
                onClick={() => setAuthMode(authMode === "signup" ? "signin" : "signup")}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 whitespace-nowrap"
              >
                {authMode === "signup" ? "Have an account?" : "New here?"}
              </button>
            </div>

            {/* Google Sign-In */}
            <div className="flex justify-center mb-4">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google sign-in failed.")}
                theme="outline"
                size="large"
                width="320"
                text="continue_with"
                shape="pill"
              />
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-warm-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-charcoal-lighter">
                  or continue with
                </span>
              </div>
            </div>

            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setAuthMethod("email")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${
                  authMethod === "email"
                    ? "bg-brand-500 border-brand-500 text-white"
                    : "border-warm-200 text-charcoal-lighter hover:border-brand-300 hover:text-brand-600"
                }`}
              >
                Email
              </button>
              <button
                onClick={() => setAuthMethod("phone")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${
                  authMethod === "phone"
                    ? "bg-brand-500 border-brand-500 text-white"
                    : "border-warm-200 text-charcoal-lighter hover:border-brand-300 hover:text-brand-600"
                }`}
              >
                Mobile
              </button>
            </div>

            {authMode === "signup" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-charcoal-light mb-1.5">
                  Full name
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-4 py-3 rounded-xl border border-warm-300 bg-warm-50/40 text-charcoal placeholder:text-charcoal-lighter/50 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition"
                />
              </div>
            )}

            {authMethod === "email" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-charcoal-light mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-warm-300 bg-warm-50/40 text-charcoal placeholder:text-charcoal-lighter/50 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition"
                />
              </div>
            )}

            {authMethod === "phone" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-charcoal-light mb-1.5">
                  Phone number
                </label>
                <PhoneInput
                  international
                  defaultCountry="IN"
                  flags={flags}
                  value={phone}
                  onChange={(value) => setPhone(value)}
                  className="phone-input-field w-full px-4 py-3 rounded-xl border border-warm-300 bg-warm-50/40 text-charcoal focus-within:ring-2 focus-within:ring-brand-400/40 focus-within:border-brand-400 transition"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-charcoal-light mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-4 py-3 rounded-xl border border-warm-300 bg-warm-50/40 text-charcoal placeholder:text-charcoal-lighter/50 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition"
              />
            </div>

            <button
              onClick={handlePasswordAuth}
              disabled={
                loading ||
                !password ||
                (authMethod === "email" ? !email : !phone) ||
                (authMode === "signup" && !fullName)
              }
              className="w-full py-3.5 px-4 bg-brand-500 hover:bg-brand-600 disabled:bg-warm-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition"
            >
              {loading ? <Spinner /> : null}
              {authMode === "signup" ? "Create account" : "Sign in"}
            </button>

            <div className="flex items-center justify-end mt-4">
              <button
                onClick={() => setShowForgot(!showForgot)}
                className="text-xs text-brand-600 hover:text-brand-700 font-semibold"
              >
                Forgot password?
              </button>
            </div>

            {showForgot && (
              <div className="mt-4 rounded-xl border border-warm-200 bg-warm-50/40 p-4">
                <label className="block text-sm font-medium text-charcoal-light mb-1.5">
                  Email for reset link
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-warm-300 bg-white text-charcoal placeholder:text-charcoal-lighter/50 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition"
                />
                <button
                  onClick={handleForgotPassword}
                  disabled={loading || !forgotEmail}
                  className="w-full mt-3 py-2.5 px-4 bg-deep hover:bg-deep-light disabled:bg-warm-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition"
                >
                  {loading ? "Sending..." : "Send reset link"}
                </button>
                {forgotMessage && (
                  <p className="text-xs text-sage-600 mt-2">{forgotMessage}</p>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          <p className="text-center text-xs text-charcoal-lighter mt-6">
            A conscious space for emotional healing, inner clarity, and psychospiritual transformation.
          </p>
        </div>
      </div>
    </div>
  );
}
