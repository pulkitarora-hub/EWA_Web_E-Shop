import React, { useEffect, useState } from "react";
import {
  fetchAdminBookings,
  fetchAdminPayments,
  fetchAdminUsers,
  fetchAdminPromoCodes,
  createAdminPromoCode,
  toggleAdminPromoCode,
  deleteAdminPromoCode,
  PromoCodeType,
} from "../../lib/api";

type Props = {
  isAdmin: boolean;
  token: string;
};

type Tab = "users" | "bookings" | "payments" | "promos";

export function AdminDashboard({ isAdmin, token }: Props) {
  const [users, setUsers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCodeType[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [loading, setLoading] = useState(true);

  // Promo form state
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoForm, setPromoForm] = useState({
    code: "", type: "percentage" as "percentage" | "flat", value: "", maxUses: "", minAmount: "", expiresAt: "",
  });
  const [promoError, setPromoError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    Promise.all([
      fetchAdminUsers(token).then((res) => setUsers(res.users)),
      fetchAdminBookings(token).then((res) => setBookings(res.bookings)),
      fetchAdminPayments(token).then((res) => setPayments(res.payments)),
      fetchAdminPromoCodes(token).then((res) => setPromoCodes(res.promoCodes)),
    ]).finally(() => setLoading(false));
  }, [isAdmin, token]);

  async function handleCreatePromo() {
    setPromoError(null);
    if (!promoForm.code || !promoForm.value) {
      setPromoError("Code and value are required.");
      return;
    }
    try {
      const res = await createAdminPromoCode(token, {
        code: promoForm.code,
        type: promoForm.type,
        value: Number(promoForm.value),
        maxUses: promoForm.maxUses ? Number(promoForm.maxUses) : undefined,
        minAmount: promoForm.minAmount ? Number(promoForm.minAmount) : undefined,
        expiresAt: promoForm.expiresAt || undefined,
      });
      setPromoCodes((prev) => [res.promoCode, ...prev]);
      setShowPromoForm(false);
      setPromoForm({ code: "", type: "percentage", value: "", maxUses: "", minAmount: "", expiresAt: "" });
    } catch (err: any) {
      setPromoError(err.message || "Failed to create.");
    }
  }

  async function handleTogglePromo(id: string, active: boolean) {
    const res = await toggleAdminPromoCode(token, id, active);
    setPromoCodes((prev) => prev.map((p) => (p.id === id ? res.promoCode : p)));
  }

  async function handleDeletePromo(id: string) {
    await deleteAdminPromoCode(token, id);
    setPromoCodes((prev) => prev.filter((p) => p.id !== id));
  }

  if (!isAdmin) return null;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "users", label: "Users", count: users.length },
    { key: "bookings", label: "Bookings", count: bookings.length },
    { key: "payments", label: "Payments", count: payments.length },
    { key: "promos", label: "Promo Codes", count: promoCodes.length },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-semibold text-charcoal">
          Admin Dashboard
        </h2>
        <p className="text-sm text-charcoal-lighter mt-1">
          Manage users, bookings, and payments
        </p>
      </div>

      {/* Tabs – dark style */}
      <div className="flex gap-1 mb-6 bg-deep rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.key
                ? "bg-brand-500 text-white shadow-sm"
                : "text-white/50 hover:text-white/80 hover:bg-deep-light"
            }`}
          >
            {tab.label}
            <span
              className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key
                  ? "bg-white/20 text-white"
                  : "bg-deep-light text-white/40"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-3 border-brand-700 border-t-brand-400 rounded-full animate-spin" />
          <p className="text-charcoal-lighter text-sm mt-3">Loading data...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-warm-200 overflow-hidden shadow-sm">
          {/* Users Table */}
          {activeTab === "users" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-deep text-left">
                    <th className="px-4 py-3 font-medium text-white/70">Name</th>
                    <th className="px-4 py-3 font-medium text-white/70">Phone</th>
                    <th className="px-4 py-3 font-medium text-white/70">Email</th>
                    <th className="px-4 py-3 font-medium text-white/70">Onboarded</th>
                    <th className="px-4 py-3 font-medium text-white/70">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-warm-50/50">
                      <td className="px-4 py-3 text-charcoal font-medium">{u.name || "—"}</td>
                      <td className="px-4 py-3 text-charcoal-light">{u.phone}</td>
                      <td className="px-4 py-3 text-charcoal-light">{u.email || "—"}</td>
                      <td className="px-4 py-3">
                        {u.onboardingComplete ? (
                          <span className="inline-flex items-center gap-1 text-sage-600 text-xs font-medium bg-sage-50 px-2 py-0.5 rounded-full">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Yes
                          </span>
                        ) : (
                          <span className="text-xs text-charcoal-lighter">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-charcoal-lighter text-xs">
                        {new Date(u.createdAt).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="text-center py-8 text-charcoal-lighter text-sm">No users yet.</div>
              )}
            </div>
          )}

          {/* Bookings Table */}
          {activeTab === "bookings" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-deep text-left">
                    <th className="px-4 py-3 font-medium text-white/70">Client</th>
                    <th className="px-4 py-3 font-medium text-white/70">Session</th>
                    <th className="px-4 py-3 font-medium text-white/70">Amount</th>
                    <th className="px-4 py-3 font-medium text-white/70">Status</th>
                    <th className="px-4 py-3 font-medium text-white/70">Policy</th>
                    <th className="px-4 py-3 font-medium text-white/70">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-warm-50/50">
                      <td className="px-4 py-3 text-charcoal font-medium">
                        {b.user?.name || b.user?.phone || "—"}
                      </td>
                      <td className="px-4 py-3 text-charcoal-light">
                        {b.session?.title || b.sessionId}
                      </td>
                      <td className="px-4 py-3 text-charcoal-light">
                        {b.currency} {b.amount}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${
                            b.status === "paid"
                              ? "bg-sage-50 text-sage-700"
                              : b.status === "pending"
                              ? "bg-brand-100 text-brand-700"
                              : "bg-warm-100 text-charcoal-lighter"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {b.policyAgreedAt ? (
                          <span className="inline-flex items-center gap-1 text-sage-600 text-xs font-medium bg-sage-50 px-2 py-0.5 rounded-full" title={`Signed by: ${b.policySignedName || "—"}`}>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Signed
                          </span>
                        ) : (
                          <span className="text-xs text-charcoal-lighter">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-charcoal-lighter text-xs">
                        {new Date(b.createdAt).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {bookings.length === 0 && (
                <div className="text-center py-8 text-charcoal-lighter text-sm">No bookings yet.</div>
              )}
            </div>
          )}

          {/* Payments Table */}
          {activeTab === "payments" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-deep text-left">
                    <th className="px-4 py-3 font-medium text-white/70">Client</th>
                    <th className="px-4 py-3 font-medium text-white/70">Payment ID</th>
                    <th className="px-4 py-3 font-medium text-white/70">Status</th>
                    <th className="px-4 py-3 font-medium text-white/70">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-warm-50/50">
                      <td className="px-4 py-3 text-charcoal font-medium">
                        {p.user?.name || p.user?.phone || "—"}
                      </td>
                      <td className="px-4 py-3 text-charcoal-light font-mono text-xs">
                        {p.razorpayPaymentId}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${
                            p.status === "captured"
                              ? "bg-sage-50 text-sage-700"
                              : "bg-warm-100 text-charcoal-lighter"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-charcoal-lighter text-xs">
                        {new Date(p.createdAt).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {payments.length === 0 && (
                <div className="text-center py-8 text-charcoal-lighter text-sm">No payments yet.</div>
              )}
            </div>
          )}

          {/* Promo Codes Management */}
          {activeTab === "promos" && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-charcoal">Promo Codes</h3>
                <button
                  onClick={() => setShowPromoForm(!showPromoForm)}
                  className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-lg transition"
                >
                  {showPromoForm ? "Cancel" : "+ New Code"}
                </button>
              </div>

              {showPromoForm && (
                <div className="bg-warm-50 rounded-xl p-4 mb-4 border border-warm-200">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                      value={promoForm.code}
                      onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                      placeholder="Code (e.g. SAVE20)"
                      className="px-3 py-2 rounded-lg border border-warm-300 text-sm uppercase"
                    />
                    <select
                      value={promoForm.type}
                      onChange={(e) => setPromoForm({ ...promoForm, type: e.target.value as any })}
                      className="px-3 py-2 rounded-lg border border-warm-300 text-sm"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat (INR)</option>
                    </select>
                    <input
                      value={promoForm.value}
                      onChange={(e) => setPromoForm({ ...promoForm, value: e.target.value })}
                      placeholder={promoForm.type === "percentage" ? "Discount %" : "Discount INR"}
                      type="number"
                      className="px-3 py-2 rounded-lg border border-warm-300 text-sm"
                    />
                    <input
                      value={promoForm.maxUses}
                      onChange={(e) => setPromoForm({ ...promoForm, maxUses: e.target.value })}
                      placeholder="Max uses (optional)"
                      type="number"
                      className="px-3 py-2 rounded-lg border border-warm-300 text-sm"
                    />
                    <input
                      value={promoForm.minAmount}
                      onChange={(e) => setPromoForm({ ...promoForm, minAmount: e.target.value })}
                      placeholder="Min amount (optional)"
                      type="number"
                      className="px-3 py-2 rounded-lg border border-warm-300 text-sm"
                    />
                    <input
                      value={promoForm.expiresAt}
                      onChange={(e) => setPromoForm({ ...promoForm, expiresAt: e.target.value })}
                      placeholder="Expiry date"
                      type="date"
                      className="px-3 py-2 rounded-lg border border-warm-300 text-sm"
                    />
                  </div>
                  {promoError && <p className="text-xs text-red-500 mb-2">{promoError}</p>}
                  <button
                    onClick={handleCreatePromo}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg transition"
                  >
                    Create Promo Code
                  </button>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-deep text-left">
                      <th className="px-4 py-3 font-medium text-white/70">Code</th>
                      <th className="px-4 py-3 font-medium text-white/70">Discount</th>
                      <th className="px-4 py-3 font-medium text-white/70">Usage</th>
                      <th className="px-4 py-3 font-medium text-white/70">Status</th>
                      <th className="px-4 py-3 font-medium text-white/70">Expires</th>
                      <th className="px-4 py-3 font-medium text-white/70">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100">
                    {promoCodes.map((p) => (
                      <tr key={p.id} className="hover:bg-warm-50/50">
                        <td className="px-4 py-3 font-mono font-bold text-brand-700">{p.code}</td>
                        <td className="px-4 py-3 text-charcoal-light">
                          {p.type === "percentage" ? `${p.value}%` : `INR ${p.value}`}
                        </td>
                        <td className="px-4 py-3 text-charcoal-light">
                          {p.usedCount}{p.maxUses ? ` / ${p.maxUses}` : ""}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${
                            p.active ? "bg-sage-50 text-sage-700" : "bg-red-50 text-red-600"
                          }`}>
                            {p.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-charcoal-lighter text-xs">
                          {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString("en-IN") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleTogglePromo(p.id, !p.active)}
                              className="text-xs px-2 py-1 rounded border border-warm-300 hover:bg-warm-100 transition-colors"
                            >
                              {p.active ? "Disable" : "Enable"}
                            </button>
                            <button
                              onClick={() => handleDeletePromo(p.id)}
                              className="text-xs px-2 py-1 rounded border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {promoCodes.length === 0 && (
                  <div className="text-center py-8 text-charcoal-lighter text-sm">No promo codes yet.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
