import React, { useState } from "react";
import { updateMe, User } from "../../lib/api";
import PhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";

type Props = {
  user: User;
  token: string;
  onUpdated: (user: User) => void;
};

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function Avatar({ user }: { user: User }) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name || "Profile"}
        className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
      />
    );
  }

  const initials = (user.name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-brand-500 flex items-center justify-center">
      <span className="text-2xl font-bold text-white">{initials}</span>
    </div>
  );
}

export function ProfilePage({ user, token, onUpdated }: Props) {
  const isGoogleUser = Boolean(user.googleId);
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [phone, setPhone] = useState<string | undefined>(user.phone || "");
  const [goal, setGoal] = useState(user.goal || "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await updateMe(token, {
        name: name || undefined,
        email: email || undefined,
        phone: phone || undefined,
        goal: goal || undefined,
      });
      onUpdated(res.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      if (err.message === "phone_taken" || err.message === "unique_conflict") {
        setError("This phone number is already linked to another account.");
      } else {
        setError("Failed to save. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const memberSince = user.id
    ? new Date().toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-semibold text-charcoal">
          My Profile
        </h2>
        <p className="text-sm text-charcoal-lighter mt-1">
          Manage your account details
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-warm-200 overflow-hidden shadow-lg shadow-warm-200/30">
        {/* Header with avatar */}
        <div className="bg-deep px-6 py-8 flex flex-col items-center">
          <Avatar user={user} />
          <h3 className="text-white font-semibold text-lg mt-3">
            {user.name || "Your Name"}
          </h3>
          {user.email && (
            <p className="text-white/50 text-sm mt-0.5">{user.email}</p>
          )}
          {isGoogleUser && (
            <span className="mt-2 text-xs text-brand-300 bg-deep-light px-3 py-1 rounded-full font-medium">
              Signed in with Google
            </span>
          )}
        </div>

        {/* Editable fields */}
        <div className="px-6 py-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-charcoal-light mb-1.5">
              Full name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 rounded-xl border border-warm-300 bg-warm-50/50 text-charcoal placeholder:text-charcoal-lighter/50 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-charcoal-light mb-1.5">
              Email
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-warm-300 bg-warm-50/50 text-charcoal placeholder:text-charcoal-lighter/50 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition"
              />
            )}
          </div>

          {/* Phone */}
          <div>
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

          {/* Goal */}
          <div>
            <label className="block text-sm font-medium text-charcoal-light mb-1.5">
              What brings you here?
            </label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Share your intention or goal..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-warm-300 bg-warm-50/50 text-charcoal placeholder:text-charcoal-lighter/50 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition resize-none"
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-3 px-4 bg-brand-500 hover:bg-brand-600 disabled:bg-warm-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition"
          >
            {loading ? <Spinner /> : null}
            {loading ? "Saving..." : "Save changes"}
          </button>

          {/* Success */}
          {saved && (
            <div className="px-4 py-2.5 bg-sage-50 border border-sage-200 rounded-xl text-sm text-sage-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-sage-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Profile updated successfully.
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Account info footer */}
        <div className="px-6 py-4 border-t border-warm-200 bg-warm-50/50">
          <div className="flex items-center justify-between text-xs text-charcoal-lighter">
            <span>Member since {memberSince}</span>
            {user.phone && <span>{user.phone}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
