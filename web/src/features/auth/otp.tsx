import React, { useState } from "react";
import { requestOtp, verifyOtp, googleAuth, User } from "../../lib/api";
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
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [otpPreview, setOtpPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPhoneLogin, setShowPhoneLogin] = useState(false);

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

  async function sendCode() {
    if (!phone) return;
    setLoading(true);
    setError(null);
    try {
      const res = await requestOtp(phone);
      setOtpToken(res.otpToken);
      setOtpPreview(res.otp || null);
    } catch {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    if (!otpToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await verifyOtp(otpToken, code, phone);
      onAuthed(res.token, res.user);
    } catch {
      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#4f1f4f] px-4">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <img
            src="/ea-logo.png"
            alt="Evolve with Avadhi"
            className="h-16 sm:h-20 mx-auto mb-3"
          />
          <p className="text-white/50 text-sm">
            Empower. Thrive. Transcend.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 border border-warm-200/40 p-8">
          <h2 className="text-xl font-semibold text-charcoal mb-1">Welcome</h2>
          <p className="text-sm text-charcoal-lighter mb-6">
            Sign in to get started
          </p>

          {/* Google Sign-In */}
          <div className="flex justify-center mb-4">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google sign-in failed.")}
              theme="outline"
              size="large"
              width="360"
              text="continue_with"
              shape="pill"
            />
          </div>

          {/* Divider */}
          {!showPhoneLogin && (
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-warm-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <button
                  onClick={() => setShowPhoneLogin(true)}
                  className="bg-white px-4 text-charcoal-lighter hover:text-brand-600 transition"
                >
                  or continue with phone
                </button>
              </div>
            </div>
          )}

          {/* Phone OTP Section */}
          {showPhoneLogin && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-warm-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-charcoal-lighter">
                    or continue with phone
                  </span>
                </div>
              </div>

              {/* Phone input */}
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
                  className="phone-input-field w-full px-4 py-3 rounded-xl border border-warm-300 bg-warm-50/50 text-charcoal focus-within:ring-2 focus-within:ring-brand-400/40 focus-within:border-brand-400 transition"
                />
              </div>

              {!otpToken && (
                <button
                  onClick={sendCode}
                  disabled={loading || !phone}
                  className="w-full py-3 px-4 bg-brand-500 hover:bg-brand-600 disabled:bg-warm-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition"
                >
                  {loading ? <Spinner /> : null}
                  Send OTP
                </button>
              )}

              {/* Dev OTP Preview */}
              {otpPreview && (
                <div className="mt-4 px-4 py-2.5 bg-sage-50 border border-sage-200 rounded-xl text-sm text-sage-700">
                  <span className="font-medium">Dev OTP:</span> {otpPreview}
                </div>
              )}

              {/* OTP input */}
              {otpToken && (
                <div className="mt-5 pt-5 border-t border-warm-200">
                  <label className="block text-sm font-medium text-charcoal-light mb-1.5">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-4 py-3 rounded-xl border border-warm-300 bg-warm-50/50 text-charcoal text-center text-lg tracking-[0.3em] font-mono placeholder:text-charcoal-lighter/50 placeholder:tracking-normal placeholder:text-sm placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition"
                  />
                  <button
                    onClick={verifyCode}
                    disabled={loading || code.length < 4}
                    className="w-full mt-4 py-3 px-4 bg-brand-500 hover:bg-brand-600 disabled:bg-warm-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition"
                  >
                    {loading ? <Spinner /> : null}
                    Verify &amp; Continue
                  </button>
                </div>
              )}
            </>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          A conscious space for emotional healing, inner clarity, and psychospiritual transformation.
        </p>
      </div>
    </div>
  );
}
