"use client";

import React, { useEffect, useState } from "react";
import { getMe, User } from "./lib/api";
import { OtpLogin } from "./features/auth/otp";
import { OnboardingForm } from "./features/auth/onboarding";
import { SessionList } from "./features/sessions/SessionList";
import { SessionDetail } from "./features/sessions/SessionDetail";
import { Session } from "./features/sessions/sessionApi";
import { AdminDashboard } from "./features/admin/AdminDashboard";

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);

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
        });
    }
  }, []);

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

  if ((!user.onboardingComplete && !justCompleted) || !token) {
    return (
      <OnboardingForm
        token={token}
        onComplete={(updated) => {
          setUser({ ...updated, onboardingComplete: true });
          localStorage.setItem("authUser", JSON.stringify(updated));
          setJustCompleted(true);
        }}
      />
    );
  }

  return (
    <div>
      <SessionList onSelect={setSelectedSession} />
      {selectedSession && token && (
        <SessionDetail session={selectedSession} token={token} />
      )}
      <AdminDashboard isAdmin={user.isAdmin} token={token} />
    </div>
  );
}
