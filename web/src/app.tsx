"use client";

import React, { useEffect, useState } from "react";
import { getMe, User } from "./lib/api";
import { OtpLogin } from "./features/auth/otp";
import { OnboardingForm } from "./features/auth/onboarding";
import { SessionList } from "./features/sessions/SessionList";
import { SessionDetail } from "./features/sessions/SessionDetail";
import { Session } from "./features/sessions/sessionApi";
import { AdminDashboard } from "./features/admin/AdminDashboard";
import { ProfilePage } from "./features/profile/ProfilePage";
import { MyBookings } from "./features/bookings/MyBookings";
import { TherapistDashboard } from "./features/therapist/TherapistDashboard";
import { MyTherapyTimeline } from "./features/therapist/MyTherapyTimeline";
import { ClientDashboard } from "./features/client/ClientDashboard";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
type View = "dashboard" | "sessions" | "bookings" | "profile" | "admin" | "therapist" | "timeline";

function getDefaultViewForRole(user: User): View {
  switch (user.role) {
    case "ADMIN":
      return "admin";
    case "THERAPIST":
      return "therapist";
    case "CLIENT":
    default:
      return "dashboard";
  }
}

function Navbar({
  user,
  onLogout,
  onNavigate,
  activeView,
}: {
  user: User;
  onLogout: () => void;
  onNavigate: (view: View) => void;
  activeView: View;
}) {
  const [mobileMenu, setMobileMenu] = useState(false);

  // Build nav items dynamically based on role - role-specific dashboard comes first
  const baseNavItems: { key: View; label: string; adminOnly?: boolean; therapistOnly?: boolean; clientOnly?: boolean }[] = [
    { key: "admin", label: "Admin Dashboard", adminOnly: true },
    { key: "therapist", label: "Workspace", therapistOnly: true },
    { key: "dashboard", label: "Dashboard", clientOnly: true },
    { key: "sessions", label: "Sessions" },
    { key: "bookings", label: "My Bookings" },
    { key: "timeline", label: "My Journey" },
  ];
  
  // Filter and order nav items based on user role
  const navItems = baseNavItems.filter((item) => {
    if (item.adminOnly && !user.isAdmin && user.role !== "ADMIN") return false;
    if (item.therapistOnly && user.role !== "THERAPIST") return false;
    if (item.clientOnly && user.role !== "CLIENT") return false;
    return true;
  });

  function NavButton({ item }: { item: typeof baseNavItems[0] }) {
    return (
      <button
        onClick={() => { onNavigate(item.key); setMobileMenu(false); }}
        className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
          activeView === item.key
            ? "bg-brand-500 text-white"
            : "text-brand-300 hover:bg-deep-light hover:text-brand-200"
        }`}
      >
        {item.label}
      </button>
    );
  }

  return (
    <nav className="bg-deep sticky top-0 z-40 shadow-lg shadow-deep/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <button onClick={() => onNavigate("sessions")} className="flex items-center gap-3">
          <img src="/ea-logo.png" alt="Evolve with Avadhi" className="h-10 w-auto" />
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1.5">
          {navItems.map((item) => <NavButton key={item.key} item={item} />)}
          <button
            onClick={() => onNavigate("profile")}
            className={`p-1.5 rounded-lg transition-colors ml-1 ${activeView === "profile" ? "bg-brand-500" : "hover:bg-deep-light"}`}
            title="Profile"
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Profile" className="w-7 h-7 rounded-full border-2 border-white/20" />
            ) : (
              <svg className={`w-5 h-5 ${activeView === "profile" ? "text-white" : "text-white/60 hover:text-white"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            )}
          </button>
          <button onClick={onLogout} className="text-sm text-white/50 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-deep-light transition-colors">
            Logout
          </button>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => onNavigate("profile")}
            className={`p-1.5 rounded-lg transition-colors ${activeView === "profile" ? "bg-brand-500" : "hover:bg-deep-light"}`}
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-6 h-6 rounded-full border border-white/20" />
            ) : (
              <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            )}
          </button>
          <button onClick={() => setMobileMenu(!mobileMenu)} className="p-1.5 text-white/60 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenu ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenu && (
        <div className="md:hidden bg-deep border-t border-white/10 px-4 pb-3">
          <div className="flex flex-col gap-1 pt-2">
            {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => { onNavigate(item.key); setMobileMenu(false); }}
                  className={`text-left text-sm px-3 py-2 rounded-lg font-medium transition-colors ${
                    activeView === item.key
                      ? "bg-brand-500 text-white"
                      : "text-brand-300 hover:bg-deep-light"
                  }`}
                >
                  {item.label}
                </button>
            ))}
            <button
              onClick={() => { onLogout(); setMobileMenu(false); }}
              className="text-left text-sm text-red-400 px-3 py-2 rounded-lg hover:bg-deep-light transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);
  const [activeView, setActiveView] = useState<View>("sessions");
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("authUser");
    if (storedToken) {
      setToken(storedToken);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setActiveView(getDefaultViewForRole(parsedUser));
      }
      getMe(storedToken)
        .then((res) => {
          setUser(res.user);
          setActiveView(getDefaultViewForRole(res.user));
          localStorage.setItem("authUser", JSON.stringify(res.user));
        })
        .catch(() => {
          setToken(null);
          setUser(null);
          localStorage.removeItem("authToken");
          localStorage.removeItem("authUser");
        })
        .finally(() => setInitialLoading(false));
    } else {
      setInitialLoading(false);
    }
  }, []);

  function handleLogout() {
    setToken(null);
    setUser(null);
    setSelectedSession(null);
    setActiveView("sessions");
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-brand-700 border-t-brand-400 rounded-full animate-spin" />
          <p className="text-white/50 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <OtpLogin
        onAuthed={(newToken, newUser) => {
          setToken(newToken);
          setUser(newUser);
          setActiveView(getDefaultViewForRole(newUser));
          localStorage.setItem("authToken", newToken);
          localStorage.setItem("authUser", JSON.stringify(newUser));
        }}
      />
    );
  }

  if (!token) {
    return (
      <OtpLogin
        onAuthed={(newToken, newUser) => {
          setToken(newToken);
          setUser(newUser);
          setActiveView(getDefaultViewForRole(newUser));
          localStorage.setItem("authToken", newToken);
          localStorage.setItem("authUser", JSON.stringify(newUser));
        }}
      />
    );
  }

  if (!user.onboardingComplete && !justCompleted) {
    return (
      <OnboardingForm
        token={token}
        user={user}
        onComplete={(updated) => {
          setUser({ ...updated, onboardingComplete: true });
          localStorage.setItem("authUser", JSON.stringify(updated));
          setJustCompleted(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <Navbar
        user={user}
        onLogout={handleLogout}
        onNavigate={(view) => {
          setActiveView(view);
          setSelectedSession(null);
        }}
        activeView={activeView}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {activeView === "therapist" && user.role === "THERAPIST" ? (
          <TherapistDashboard token={token} userName={user.name || ""} />
        ) : activeView === "admin" && (user.isAdmin || user.role === "ADMIN") ? (
          <AdminDashboard isAdmin={user.isAdmin} token={token} />
        ) : activeView === "timeline" ? (
          <MyTherapyTimeline token={token} />
        ) : activeView === "bookings" ? (
          <MyBookings token={token} />
        ) : activeView === "profile" ? (
          <ProfilePage
            user={user}
            token={token}
            onUpdated={(updated) => {
              setUser(updated);
              localStorage.setItem("authUser", JSON.stringify(updated));
            }}
          />
        ) : activeView === "dashboard" ? (
          <ClientDashboard
            token={token}
            userName={user.name || ""}
            onNavigate={(view) => {
              setActiveView(view as View);
              setSelectedSession(null);
            }}
          />
        ) : (
          <>
            {selectedSession ? (
              <div>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="mb-6 text-brand-600 hover:text-brand-700 flex items-center gap-1 text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to sessions
                </button>
                <SessionDetail
                  session={selectedSession}
                  token={token}
                  userName={user.name || ""}
                  userEmail={user.email || ""}
                  hasSignedPolicy={!!user.policySignedAt}
                />
              </div>
            ) : (
              <SessionList onSelect={setSelectedSession} />
            )}
          </>
        )}
      </main>

      <footer className="bg-deep mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-center">
          <img
            src="/ea-logo.png"
            alt="Evolve with Avadhi"
            className="h-8 mx-auto mb-2 opacity-60"
          />
          <p className="text-xs text-white/40">
            Empower. Thrive. Transcend. &middot; care@evolvewithavadhi.com &middot; evolvewithavadhi.com
          </p>
        </div>
      </footer>
    </div>
  );
}
