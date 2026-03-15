"use client";

import React, { useEffect, useState } from "react";
import { fetchClientInvoices, ClientInvoice } from "../../lib/api";

type Props = { token: string };

export function Invoices({ token }: Props) {
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setError(null);
    try {
      const res = await fetchClientInvoices(token);
      setInvoices(res.invoices || []);
    } catch (err) {
      console.error("Invoices load error:", err);
      setError("Failed to load invoices");
    }
    setLoading(false);
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  function formatAmount(amount: number, currency: string) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: currency === "INR" ? "INR" : currency, minimumFractionDigits: 0 }).format(amount / 100);
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  if (error) return <div className="text-center py-12"><p className="text-red-600 mb-4">{error}</p><button onClick={load} className="px-4 py-2 bg-brand-600 text-white rounded-lg">Try again</button></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold text-warm-900">Invoices</h1><p className="text-warm-600 text-sm mt-1">Payments made via Razorpay for your sessions</p></div>
      {invoices.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center"><p className="text-warm-600">No invoices yet</p><p className="text-warm-500 text-sm mt-1">Your paid session invoices will appear here</p></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead className="bg-warm-50 border-b border-warm-200"><tr><th className="px-4 py-3 text-left text-xs font-semibold text-warm-600 uppercase">Date</th><th className="px-4 py-3 text-left text-xs font-semibold text-warm-600 uppercase">Session</th><th className="px-4 py-3 text-left text-xs font-semibold text-warm-600 uppercase">Amount</th><th className="px-4 py-3 text-left text-xs font-semibold text-warm-600 uppercase">Status</th></tr></thead><tbody className="divide-y divide-warm-100">{invoices.map((inv) => (<tr key={inv.id}><td className="px-4 py-3 text-sm">{formatDate(inv.paidAt || inv.createdAt)}</td><td className="px-4 py-3 font-medium text-sm">{inv.sessionTitle || "Session"}</td><td className="px-4 py-3 font-medium text-sm">{formatAmount(inv.amount, inv.currency)}</td><td className="px-4 py-3"><span className={"inline-flex px-2 py-1 rounded-full text-xs " + (inv.status === "captured" ? "bg-green-100 text-green-700" : "bg-warm-100 text-warm-600")}>{inv.status}</span></td></tr>))}</tbody></table></div></div>
      )}
    </div>
  );
}
