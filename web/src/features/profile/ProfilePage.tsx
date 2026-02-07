import React, { useState } from "react";
import { updateMe, User } from "../../lib/api";
import PhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import { PackagesPage } from "../packages/PackagesPage";
import { SubscriptionsPage } from "../subscriptions/SubscriptionsPage";
import { ReferralSection } from "../referral/ReferralSection";

type ProfileTab = "details" | "packages" | "subscriptions" | "referral";

type Props = {
  user: User;
  token: string;
  onUpdated: (user: User) => void;
};

/* ── Tiny reusable bits ───────────────────────────────────────────────────── */

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function Avatar({ user, size = "lg" }: { user: User; size?: "lg" | "sm" }) {
  const dim = size === "lg" ? "w-24 h-24" : "w-12 h-12";
  const textSize = size === "lg" ? "text-3xl" : "text-lg";
  const borderW = size === "lg" ? "border-[3px]" : "border-2";

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name || "Profile"}
        className={`${dim} rounded-full ${borderW} border-white/20 shadow-xl shadow-black/10 object-cover`}
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
    <div
      className={`${dim} rounded-full ${borderW} border-white/20 shadow-xl shadow-black/10 bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center`}
    >
      <span className={`${textSize} font-bold text-white drop-shadow`}>{initials}</span>
    </div>
  );
}

/* ── Tab definitions ──────────────────────────────────────────────────────── */

const tabs: { key: ProfileTab; label: string; desc: string; icon: JSX.Element }[] = [
  {
    key: "details",
    label: "Profile",
    desc: "Personal information",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    key: "packages",
    label: "Packages",
    desc: "Session bundles & credits",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    key: "subscriptions",
    label: "Recurring",
    desc: "Auto-renewing sessions",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M21.015 4.356v4.992" />
      </svg>
    ),
  },
  {
    key: "referral",
    label: "Referral",
    desc: "Invite & earn discounts",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
  },
];

/* ── Profile Details Tab ──────────────────────────────────────────────────── */

function ProfileDetails({ user, token, onUpdated }: Props) {
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

  const inputBase =
    "w-full px-4 py-3 rounded-xl border bg-white text-charcoal placeholder:text-charcoal-lighter/40 focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400 transition-all duration-200";
  const inputEditable = `${inputBase} border-warm-200 hover:border-warm-300`;
  const inputReadonly = `${inputBase} border-warm-100 bg-warm-50 cursor-default text-charcoal/70`;

  return (
    <div className="space-y-6">
      {/* Section: Personal Info */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
            </svg>
          </div>
          <h3 className="font-semibold text-charcoal">Personal Information</h3>
        </div>
        <div className="bg-white rounded-2xl border border-warm-100 p-5 sm:p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-charcoal-lighter uppercase tracking-wide mb-1.5">
                Full Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className={inputEditable}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal-lighter uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              {isGoogleUser && email ? (
                <div className="relative">
                  <input value={email} readOnly className={inputReadonly} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-200/50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Google
                  </span>
                </div>
              ) : (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputEditable}
                />
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-charcoal-lighter uppercase tracking-wide mb-1.5">
              Phone Number
            </label>
            <PhoneInput
              international
              defaultCountry="IN"
              flags={flags}
              value={phone}
              onChange={(value) => setPhone(value)}
              className="phone-input-field w-full px-4 py-3 rounded-xl border border-warm-200 bg-white text-charcoal hover:border-warm-300 focus-within:ring-2 focus-within:ring-brand-400/30 focus-within:border-brand-400 transition-all duration-200"
            />
          </div>
        </div>
      </section>

      {/* Section: About you */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-lavender-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-lavender-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          </div>
          <h3 className="font-semibold text-charcoal">About You</h3>
        </div>
        <div className="bg-white rounded-2xl border border-warm-100 p-5 sm:p-6">
          <label className="block text-xs font-medium text-charcoal-lighter uppercase tracking-wide mb-1.5">
            What brings you here?
          </label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Share your intention, goal, or what you'd like to achieve..."
            rows={4}
            className={`${inputEditable} resize-none`}
          />
        </div>
      </section>

      {/* Save button & feedback */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 sm:flex-none sm:min-w-[180px] py-3 px-6 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 disabled:from-warm-300 disabled:to-warm-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 flex items-center justify-center gap-2 transition-all duration-200"
        >
          {loading ? (
            <>
              <Spinner /> Saving...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Save Changes
            </>
          )}
        </button>

        {saved && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200/60 rounded-xl text-sm text-emerald-700 animate-fadeIn">
            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Profile updated successfully
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200/60 rounded-xl text-sm text-red-700 animate-fadeIn">
            <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Profile Page ────────────────────────────────────────────────────── */

export function ProfilePage({ user, token, onUpdated }: Props) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("details");
  const isGoogleUser = Boolean(user.googleId);

  const memberSince = user.id
    ? new Date().toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ─── Left Sidebar ─────────────────────────────────────────────── */}
      <aside className="lg:w-72 shrink-0">
        <div className="lg:sticky lg:top-24 space-y-5">
          {/* User card */}
          <div className="bg-white rounded-2xl border border-warm-100 overflow-hidden shadow-sm">
            {/* Gradient banner */}
            <div className="h-20 bg-gradient-to-br from-deep via-brand-800 to-deep-light" />

            {/* Avatar + info */}
            <div className="px-5 pb-5 -mt-12">
              <Avatar user={user} size="lg" />
              <h3 className="font-heading text-lg font-bold text-charcoal mt-3 leading-tight">
                {user.name || "Your Name"}
              </h3>
              {user.email && (
                <p className="text-sm text-charcoal-lighter mt-0.5 truncate">{user.email}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {isGoogleUser && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-700 bg-brand-50 border border-brand-200/40 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                  </span>
                )}
                <span className="text-[10px] text-charcoal-lighter/70 font-medium uppercase tracking-wider">
                  Member since {memberSince}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation tabs — vertical on desktop */}
          <nav className="bg-white rounded-2xl border border-warm-100 p-2 shadow-sm">
            {/* Desktop: vertical list */}
            <div className="hidden lg:flex flex-col gap-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-3 w-full px-3.5 py-3 rounded-xl text-left transition-all duration-200 group ${
                      isActive
                        ? "bg-gradient-to-r from-brand-50 to-brand-100/60 text-brand-700 shadow-sm shadow-brand-200/30"
                        : "text-charcoal-lighter hover:bg-warm-50 hover:text-charcoal"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                        isActive
                          ? "bg-brand-500 text-white shadow-md shadow-brand-500/25"
                          : "bg-warm-100 text-charcoal-lighter group-hover:bg-warm-200 group-hover:text-charcoal"
                      }`}
                    >
                      {tab.icon}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold leading-tight ${isActive ? "text-brand-700" : ""}`}>
                        {tab.label}
                      </p>
                      <p className="text-[11px] text-charcoal-lighter/70 truncate mt-0.5">
                        {tab.desc}
                      </p>
                    </div>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-6 rounded-full bg-brand-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile: horizontal pill tabs */}
            <div className="flex lg:hidden gap-1 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? "bg-brand-500 text-white shadow-md shadow-brand-500/25"
                        : "text-charcoal-lighter hover:bg-warm-50 hover:text-charcoal"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </aside>

      {/* ─── Right Content Area ───────────────────────────────────────── */}
      <main className="flex-1 min-w-0">
        {/* Tab heading (desktop only, gives context) */}
        <div className="hidden lg:flex items-center gap-3 mb-6">
          {(() => {
            const t = tabs.find((t) => t.key === activeTab)!;
            return (
              <>
                <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
                  {t.icon}
                </div>
                <div>
                  <h2 className="font-heading text-xl font-bold text-charcoal">{t.label}</h2>
                  <p className="text-sm text-charcoal-lighter">{t.desc}</p>
                </div>
              </>
            );
          })()}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === "details" && (
            <ProfileDetails user={user} token={token} onUpdated={onUpdated} />
          )}
          {activeTab === "packages" && <PackagesPage token={token} />}
          {activeTab === "subscriptions" && <SubscriptionsPage token={token} />}
          {activeTab === "referral" && <ReferralSection token={token} />}
        </div>
      </main>
    </div>
  );
}
