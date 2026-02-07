import React, { useState } from "react";
import { updateMe, User } from "../../lib/api";

type Props = {
  token: string;
  onComplete: (user: User) => void;
};

export function OnboardingForm({ token, onComplete }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setStatus("Saving...");
    try {
      const res = await updateMe(token, {
        name,
        email,
        goal,
        onboardingComplete: true,
      });
      onComplete(res.user);
      setStatus("Saved.");
    } catch (err) {
      console.error(err);
      setStatus("Save failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Tell us about you</h2>
      <input
        placeholder="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        placeholder="Your goal"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
      />
      <button onClick={submit} disabled={loading || !name || !email}>
        Continue
      </button>
      {status && <div>{status}</div>}
    </div>
  );
}
