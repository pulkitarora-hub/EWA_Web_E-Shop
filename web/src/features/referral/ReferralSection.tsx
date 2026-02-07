"use client";

import React, { useEffect, useState } from "react";
import { fetchMyReferralCode, applyReferralCode } from "../../lib/api";

type Props = { token: string };

export function ReferralSection({ token }: Props) {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchMyReferralCode(token)
      .then((res) => {
        setReferralCode(res.referralCode);
        setReferrals(res.referrals);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  async function handleApply() {
    if (!inputCode.trim()) return;
    setApplying(true);
    setMessage(null);
    try {
      const res = await applyReferralCode(token, inputCode.trim().toUpperCase());
      setMessage({ type: "success", text: res.message });
      setInputCode("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to apply code." });
    } finally {
      setApplying(false);
    }
  }

  function copyCode() {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareCode() {
    if (!referralCode) return;
    const text = `Join Evolve with Avadhi and get 10% off your first session! Use my referral code: ${referralCode}\n\nhttps://book.evolvewithavadhi.com`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      copyCode();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-brand-700 border-t-brand-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-semibold text-charcoal">Referral Program</h2>
        <p className="text-sm text-charcoal-lighter mt-1">
          Share your code and you both get 10% off your next booking
        </p>
      </div>

      {/* Your referral code */}
      {referralCode && (
        <div className="bg-white rounded-xl border border-warm-200 p-5 mb-6">
          <h3 className="text-sm font-semibold text-charcoal mb-3">Your Referral Code</h3>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 text-center">
              <span className="text-xl font-bold tracking-wider text-brand-700">{referralCode}</span>
            </div>
            <button
              onClick={copyCode}
              className="px-4 py-3 bg-warm-100 hover:bg-warm-200 rounded-xl transition-colors text-sm font-medium text-charcoal"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button
            onClick={shareCode}
            className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share with Friends
          </button>

          {/* Referrals list */}
          {referrals.length > 0 && (
            <div className="mt-5 pt-4 border-t border-warm-200">
              <h4 className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-3">
                Your Referrals ({referrals.length})
              </h4>
              <div className="space-y-2">
                {referrals.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <span className="text-charcoal">{r.referee?.name || "User"}</span>
                    <span className="text-xs text-charcoal-lighter">
                      {new Date(r.referee?.createdAt || r.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Apply a referral code */}
      <div className="bg-white rounded-xl border border-warm-200 p-5">
        <h3 className="text-sm font-semibold text-charcoal mb-3">Have a Referral Code?</h3>
        <div className="flex gap-2">
          <input
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            placeholder="Enter code"
            className="flex-1 px-4 py-2.5 rounded-xl border border-warm-300 bg-warm-50/50 text-charcoal uppercase tracking-wider placeholder:text-charcoal-lighter/50 focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition"
          />
          <button
            onClick={handleApply}
            disabled={!inputCode.trim() || applying}
            className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-warm-300 text-white font-semibold rounded-xl transition text-sm"
          >
            {applying ? "..." : "Apply"}
          </button>
        </div>
        {message && (
          <p className={`mt-3 text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
