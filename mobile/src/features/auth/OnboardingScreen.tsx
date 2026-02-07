import React, { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import { updateMe, User } from "../../lib/api";

type Props = {
  token: string;
  onComplete: (user: User) => void;
};

export function OnboardingScreen({ token, onComplete }: Props) {
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
    <View>
      <Text>Tell us about you</Text>
      <TextInput placeholder="Full name" value={name} onChangeText={setName} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <TextInput placeholder="Your goal" value={goal} onChangeText={setGoal} />
      <Button title="Continue" onPress={submit} disabled={loading || !name || !email} />
      {status && <Text>{status}</Text>}
    </View>
  );
}
