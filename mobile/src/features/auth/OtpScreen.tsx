import React, { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import { requestOtp, verifyOtp, User } from "../../lib/api";

type Props = {
  onAuthed: (token: string, user: User) => void;
};

export function OtpScreen({ onAuthed }: Props) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [otpPreview, setOtpPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    setLoading(true);
    try {
      const res = await requestOtp(phone);
      setOtpToken(res.otpToken);
      setOtpPreview(res.otp);
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    if (!otpToken) return;
    setLoading(true);
    try {
      const res = await verifyOtp(otpToken, code);
      onAuthed(res.token, res.user);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      <Text>Login with phone</Text>
      <TextInput placeholder="+91xxxxxxxxxx" value={phone} onChangeText={setPhone} />
      <Button title="Send OTP" onPress={sendCode} disabled={loading || !phone} />
      {otpPreview && <Text>Dev OTP: {otpPreview}</Text>}
      {otpToken && (
        <View>
          <TextInput placeholder="OTP" value={code} onChangeText={setCode} />
          <Button
            title="Verify"
            onPress={verifyCode}
            disabled={loading || code.length < 4}
          />
        </View>
      )}
    </View>
  );
}
