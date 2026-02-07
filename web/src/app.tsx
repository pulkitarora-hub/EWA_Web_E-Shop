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

type View = "sessions" | "profile" | "admin";

function Navbar({
  user,
  onLogout,
  onShowAdmin,
  onShowProfile,
  activeView,
}: {
  user: User;
  onLogout: () => void;
  onShowAdmin?: () => void;
  onShowProfile: () => void;
  activeView: View;
}) {
  return (
    <nav className="bg-deep sticky top-0 z-40 shadow-lg shadow-deep/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/ea-logo.png"
            alt="Evolve with Avadhi"
            className="h-10 w-auto"
          />
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {user.isAdmin && onShowAdmin && (
            <button
              onClick={onShowAdmin}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeView === "admin"
                  ? "bg-brand-500 text-white"
                  : "text-brand-300 hover:bg-deep-light hover:text-brand-200"
              }`}
            >
              Admin
            </button>
          )}
          {/* Profile button */}
          <button
            onClick={onShowProfile}
            className={`p-1.5 rounded-lg transition-colors ${
              activeView === "profile"
                ? "bg-brand-500"
                : "hover:bg-deep-light"
            }`}
            title="Profile"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="Profile"
                className="w-7 h-7 rounded-full border-2 border-white/20"
              />
            ) : (
              <svg className={`w-5 h-5 ${activeView === "profile" ? "text-white" : "text-white/60 hover:text-white"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            )}
          </button>
          <button
            onClick={onLogout}
            className="text-sm text-white/50 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-deep-light transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
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
        setUser(JSON.parse(storedUser));
      }
      getMe(storedToken)
        .then((res) => {
          setUser(res.user);
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
        onShowAdmin={
          user.isAdmin
            ? () => {
                setActiveView(activeView === "admin" ? "sessions" : "admin");
                setSelectedSession(null);
              }
            : undefined
        }
        onShowProfile={() => {
          setActiveView(activeView === "profile" ? "sessions" : "profile");
          setSelectedSession(null);
        }}
        activeView={activeView}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {activeView === "admin" && user.isAdmin ? (
          <AdminDashboard isAdmin={user.isAdmin} token={token} />
        ) : activeView === "profile" ? (
          <ProfilePage
            user={user}
            token={token}
            onUpdated={(updated) => {
              setUser(updated);
              localStorage.setItem("authUser", JSON.stringify(updated));
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
                <SessionDetail session={selectedSession} token={token} userName={user.name || ""} />
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
            Empower. Thrive. Transcend. &middot; care@avadhisharma.com &middot; evolvewithavadhi.com
          </p>
        </div>
      </footer>
    </div>
  );
}
