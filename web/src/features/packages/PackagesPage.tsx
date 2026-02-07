"use client";

import React, { useEffect, useState } from "react";
import {
  fetchPackages,
  purchasePackage,
  verifyPackagePayment,
  fetchMyPackages,
  PackageType,
  UserPackageType,
} from "../../lib/api";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

type Props = { token: string };

function CreditBadge({ total, used }: { total: number; used: number }) {
  const remaining = total - used;
  const pct = total > 0 ? (remaining / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 rounded-full bg-warm-200 overflow-hidden">
        <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-charcoal">{remaining}/{total}</span>
    </div>
  );
}

export function PackagesPage({ token }: Props) {
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [myPkgs, setMyPkgs] = useState<UserPackageType[]>([]);
  const [totalCredits, setTotalCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [pkgRes, myRes] = await Promise.all([fetchPackages(), fetchMyPackages(token)]);
      setPackages(pkgRes.packages);
      setMyPkgs(myRes.packages);
      setTotalCredits(myRes.totalCredits);
    } catch {
      setStatus({ type: "error", msg: "Failed to load packages." });
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase(pkg: PackageType) {
    setPurchasing(pkg.id);
    setStatus(null);
    try {
      const order = await purchasePackage(token, pkg.id);
      const options = {
        key: order.razorpayKeyId,
        amount: order.amount * 100,
        currency: order.currency,
        order_id: order.orderId,
        name: "Evolve with Avadhi",
        description: `${pkg.name} (${pkg.sessionCount} sessions)`,
        handler: async (response: any) => {
          await verifyPackagePayment(token, {
            userPackageId: order.userPackageId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          setStatus({ type: "success", msg: `${pkg.name} purchased! ${pkg.sessionCount} credits added.` });
          loadData();
        },
        modal: { ondismiss: () => setStatus(null) },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      setStatus({ type: "error", msg: "Purchase failed. Please try again." });
    } finally {
      setPurchasing(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-brand-700 border-t-brand-400 rounded-full animate-spin" />
        <p className="text-charcoal-lighter text-sm mt-3">Loading packages...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-semibold text-charcoal">Session Packages</h2>
        <p className="text-sm text-charcoal-lighter mt-1">Save more by purchasing session bundles</p>
      </div>

      {/* Credit summary */}
      {totalCredits > 0 && (
        <div className="mb-6 bg-brand-50 border border-brand-200/50 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-lg">
            {totalCredits}
          </div>
          <div>
            <p className="font-semibold text-charcoal">Session Credits Available</p>
            <p className="text-xs text-charcoal-lighter">Use credits to book sessions without additional payment</p>
          </div>
        </div>
      )}

      {status && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm border ${status.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {status.msg}
        </div>
      )}

      {/* Available Packages */}
      {packages.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-charcoal mb-4">Available Packages</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {packages.map((pkg) => {
              const perSession = Math.round(pkg.price / pkg.sessionCount);
              return (
                <div key={pkg.id} className="bg-white rounded-xl border border-warm-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-charcoal">{pkg.name}</h4>
                      {pkg.description && <p className="text-xs text-charcoal-lighter mt-0.5">{pkg.description}</p>}
                    </div>
                    <span className="text-xs font-bold text-white bg-brand-600 px-2.5 py-1 rounded-lg whitespace-nowrap">
                      {pkg.sessionCount} sessions
                    </span>
                  </div>
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-brand-700">{pkg.currency} {pkg.price}</span>
                    <span className="text-xs text-charcoal-lighter ml-2">({pkg.currency} {perSession}/session)</span>
                  </div>
                  <button
                    onClick={() => handlePurchase(pkg)}
                    disabled={purchasing === pkg.id}
                    className="w-full py-2.5 px-4 bg-brand-500 hover:bg-brand-600 disabled:bg-warm-300 text-white font-semibold rounded-xl transition text-sm"
                  >
                    {purchasing === pkg.id ? "Processing..." : "Purchase Package"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My Packages */}
      {myPkgs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-charcoal mb-4">My Packages</h3>
          <div className="space-y-3">
            {myPkgs.map((up) => (
              <div key={up.id} className={`bg-white rounded-xl border p-4 ${up.status === "exhausted" ? "border-warm-200 opacity-60" : "border-brand-200"}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-charcoal">{up.package.name}</h4>
                    <p className="text-xs text-charcoal-lighter">
                      Purchased {new Date(up.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    up.status === "active" ? "bg-green-100 text-green-700 border-green-200" :
                    up.status === "exhausted" ? "bg-gray-100 text-gray-600 border-gray-200" :
                    "bg-yellow-100 text-yellow-700 border-yellow-200"
                  }`}>
                    {up.status.charAt(0).toUpperCase() + up.status.slice(1)}
                  </span>
                </div>
                <CreditBadge total={up.creditsTotal} used={up.creditsUsed} />
              </div>
            ))}
          </div>
        </div>
      )}

      {packages.length === 0 && myPkgs.length === 0 && (
        <div className="text-center py-20">
          <h3 className="text-lg font-semibold text-charcoal mb-1">No packages available</h3>
          <p className="text-sm text-charcoal-lighter">Check back soon for session bundles.</p>
        </div>
      )}
    </div>
  );
}
