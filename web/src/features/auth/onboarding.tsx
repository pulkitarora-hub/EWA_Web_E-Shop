import React, { useState } from "react";
import { updateMe, User } from "../../lib/api";
import PhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";

type Props = {
  token: string;
  user: User;
  onComplete: (user: User) => void;
};

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function OnboardingForm({ token, user, onComplete }: Props) {
  // Pre-fill from Google if available
  const isGoogleUser = Boolean(user.googleId);
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [phone, setPhone] = useState<string | undefined>(user.phone || "");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await updateMe(token, {
        name,
        email,
        phone: phone || undefined,
        goal,
        onboardingComplete: true,
      });
      onComplete(res.user);
    } catch (err: any) {
      console.error(err);
      if (err.message === "phone_taken" || err.message === "unique_conflict") {
        setError("This phone number is already linked to another account. Please use a different number or log in with that phone instead.");
      } else {
        setError("Save failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Google users: name + email pre-filled, just need phone + goal
  // OTP users: need name + email + goal (phone already set)
  const canSubmit = isGoogleUser
    ? Boolean(name && email)
    : Boolean(name && email);

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
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className="h-1.5 flex-1 rounded-full bg-brand-500" />
            <div className="h-1.5 flex-1 rounded-full bg-warm-200" />
          </div>

          <h2 className="text-xl font-semibold text-charcoal mb-1">
            {isGoogleUser ? "Almost there" : "Tell us about you"}
          </h2>
          <p className="text-sm text-charcoal-lighter mb-6">
            {isGoogleUser
              ? "Just a couple more details to personalize your journey"
              : "Help us personalize your healing journey"}
          </p>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-charcoal-light mb-1.5">
                Full name <span className="text-red-400">*</span>
              </label>
              {isGoogleUser && name ? (
                <div className="flex items-center gap-2">
                  <input
                    value={name}
                    readOnly
                    className="w-full px-4 py-3 rounded-xl border border-warm-200 bg-warm-50 text-charcoal cursor-default"
                  />
                  <span className="text-xs text-brand-600 bg-brand-50 px-2 py-1 rounded-lg whitespace-nowrap font-medium">
                    Google
                  </span>
                </div>
              ) : (
                <input
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-warm-300 bg-warm-50/50 text-charcoal placeholder:text-charcoal-lighter/50 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition"
                />
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-charcoal-light mb-1.5">
                Email <span className="text-red-400">*</span>
              </label>
              {isGoogleUser && email ? (
                <div className="flex items-center gap-2">
                  <input
                    value={email}
                    readOnly
                    className="w-full px-4 py-3 rounded-xl border border-warm-200 bg-warm-50 text-charcoal cursor-default"
                  />
                  <span className="text-xs text-brand-600 bg-brand-50 px-2 py-1 rounded-lg whitespace-nowrap font-medium">
                    Google
                  </span>
                </div>
              ) : (
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-warm-300 bg-warm-50/50 text-charcoal placeholder:text-charcoal-lighter/50 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition"
                />
              )}
            </div>

            {/* Phone — shown for Google users who don't have one yet */}
            {isGoogleUser && (
              <div>
                <label className="block text-sm font-medium text-charcoal-light mb-1.5">
                  Phone number <span className="text-xs text-charcoal-lighter">(optional)</span>
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
            )}

            {/* Goal */}
            <div>
              <label className="block text-sm font-medium text-charcoal-light mb-1.5">
                What brings you here?
              </label>
              <textarea
                placeholder="Share your intention or goal for this journey..."
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-warm-300 bg-warm-50/50 text-charcoal placeholder:text-charcoal-lighter/50 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition resize-none"
              />
            </div>
          </div>

          <button
            onClick={submit}
            disabled={loading || !canSubmit}
            className="w-full mt-6 py-3 px-4 bg-brand-500 hover:bg-brand-600 disabled:bg-warm-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition"
          >
            {loading ? <Spinner /> : null}
            Continue
          </button>

          {/* Error */}
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
