"use client";

import React, { useEffect, useState } from "react";
import {
  fetchMySubscriptions,
  createSubscription,
  cancelSubscription,
  pauseSubscription,
  fetchSessions,
  SubscriptionType,
  Session,
} from "../../lib/api";

type Props = { token: string };

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 Weeks",
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-700 border-green-200",
    paused: "bg-yellow-100 text-yellow-700 border-yellow-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${map[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function SubscriptionsPage({ token }: Props) {
  const [subs, setSubs] = useState<SubscriptionType[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSession, setSelectedSession] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [creating, setCreating] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [subRes, sessRes] = await Promise.all([
        fetchMySubscriptions(token),
        fetchSessions(),
      ]);
      setSubs(subRes.subscriptions);
      setSessions(sessRes.sessions);
    } catch {
      setError("Failed to load subscriptions.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    const session = sessions.find((s) => s.id === selectedSession);
    if (!session) return;
    setCreating(true);
    setError(null);
    try {
      const res = await createSubscription(token, {
        sessionTitle: session.title,
        frequency,
        price: session.price,
      });
      setSubs((prev) => [res.subscription, ...prev]);
      setShowCreate(false);
      setSuccess(`Subscription created! Next billing: ${new Date(res.subscription.nextBillingAt).toLocaleDateString("en-IN")}`);
    } catch (err: any) {
      setError(err.message || "Failed to create subscription.");
    } finally {
      setCreating(false);
    }
  }

  async function handleCancel(id: string) {
    setActionId(id);
    try {
      const res = await cancelSubscription(token, id);
      setSubs((prev) => prev.map((s) => (s.id === id ? res.subscription : s)));
    } catch (err: any) {
      setError(err.message || "Failed to cancel.");
    } finally {
      setActionId(null);
    }
  }

  async function handlePause(id: string) {
    setActionId(id);
    try {
      const res = await pauseSubscription(token, id);
      setSubs((prev) => prev.map((s) => (s.id === id ? res.subscription : s)));
    } catch (err: any) {
      setError(err.message || "Action failed.");
    } finally {
      setActionId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-brand-700 border-t-brand-400 rounded-full animate-spin" />
        <p className="text-charcoal-lighter text-sm mt-3">Loading subscriptions...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-charcoal">Recurring Sessions</h2>
          <p className="text-sm text-charcoal-lighter mt-1">
            Subscribe for automatic weekly or biweekly bookings
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl text-sm transition"
        >
          {showCreate ? "Cancel" : "+ Subscribe"}
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          {success}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-warm-200 p-5 mb-6">
          <h3 className="font-semibold text-charcoal mb-4">New Recurring Session</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal-light mb-1.5">Session Type</label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-warm-300 bg-warm-50/50 text-charcoal focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition"
              >
                <option value="">Select a session type...</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} — {s.currency} {s.price}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-light mb-1.5">Frequency</label>
              <div className="flex gap-3">
                {(["weekly", "biweekly"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFrequency(f)}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium border transition ${
                      frequency === f
                        ? "bg-brand-500 text-white border-brand-500"
                        : "bg-warm-50 text-charcoal border-warm-300 hover:border-brand-300"
                    }`}
                  >
                    {FREQUENCY_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={!selectedSession || creating}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-warm-300 text-white font-semibold rounded-xl transition text-sm"
            >
              {creating ? "Creating..." : "Start Subscription"}
            </button>
          </div>
        </div>
      )}

      {/* Subscriptions list */}
      {subs.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-brand-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-charcoal mb-1">No subscriptions yet</h3>
          <p className="text-sm text-charcoal-lighter">Set up a recurring session to stay consistent.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subs.map((sub) => (
            <div key={sub.id} className={`bg-white rounded-xl border p-5 ${sub.status === "cancelled" ? "border-red-100 opacity-60" : "border-warm-200"}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-semibold text-charcoal">{sub.sessionTitle}</h4>
                    <StatusBadge status={sub.status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-charcoal-lighter">
                    <span>{FREQUENCY_LABELS[sub.frequency] || sub.frequency}</span>
                    <span className="text-warm-300">|</span>
                    <span className="font-medium">{sub.currency} {sub.price}/session</span>
                    {sub.status !== "cancelled" && (
                      <>
                        <span className="text-warm-300">|</span>
                        <span>Next: {new Date(sub.nextBillingAt).toLocaleDateString("en-IN")}</span>
                      </>
                    )}
                  </div>
                </div>
                {sub.status !== "cancelled" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePause(sub.id)}
                      disabled={actionId === sub.id}
                      className="px-3 py-1.5 text-xs font-medium text-charcoal border border-warm-300 rounded-lg hover:bg-warm-100 transition-colors"
                    >
                      {sub.status === "paused" ? "Resume" : "Pause"}
                    </button>
                    <button
                      onClick={() => handleCancel(sub.id)}
                      disabled={actionId === sub.id}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
