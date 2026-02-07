import React, { useState } from "react";
import { requestOtp, verifyOtp, User } from "../../lib/api";

type Props = {
  onAuthed: (token: string, user: User) => void;
};

export function OtpLogin({ onAuthed }: Props) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [otpPreview, setOtpPreview] = useState<string | null>(null);

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
    <div>
      <h2>Login with phone</h2>
      <input
        placeholder="+91xxxxxxxxxx"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <button onClick={sendCode} disabled={loading || !phone}>
        Send OTP
      </button>
      {otpPreview && (
        <div>Dev OTP: {otpPreview}</div>
      )}
      {otpToken && (
        <div>
          <input
            placeholder="OTP"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button onClick={verifyCode} disabled={loading || code.length < 4}>
            Verify
          </button>
        </div>
      )}
    </div>
  );
}
