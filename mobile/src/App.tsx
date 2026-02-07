import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { User, getMe, loadAuth, persistAuth } from "./lib/api";
import { OtpScreen } from "./features/auth/OtpScreen";
import { OnboardingScreen } from "./features/auth/OnboardingScreen";
import { SessionList } from "./features/sessions/SessionList";
import { SessionDetail } from "./features/sessions/SessionDetail";
import { Session } from "./features/sessions/sessionApi";

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    loadAuth().then((stored) => {
      if (!stored) return;
      setToken(stored.token);
      setUser(stored.user);
      getMe(stored.token)
        .then((res) => {
          setUser(res.user);
          persistAuth(stored.token, res.user);
        })
        .catch(() => {
          setToken(null);
          setUser(null);
        });
    });
  }, []);

  if (!user) {
    return (
      <OtpScreen
        onAuthed={(newToken, newUser) => {
          setToken(newToken);
          setUser(newUser);
          persistAuth(newToken, newUser);
        }}
      />
    );
  }

  if ((!user.onboardingComplete && !justCompleted) || !token) {
    return (
      <OnboardingScreen
        token={token}
        onComplete={(updated) => {
          setUser({ ...updated, onboardingComplete: true });
          persistAuth(token, updated);
          setJustCompleted(true);
        }}
      />
    );
  }

  return (
    <View>
      <SessionList onSelect={setSelectedSession} />
      {selectedSession && token && (
        <SessionDetail session={selectedSession} token={token} />
      )}
    </View>
  );
}
