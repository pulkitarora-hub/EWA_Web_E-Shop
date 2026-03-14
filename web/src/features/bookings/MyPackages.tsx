"use client";

import React, { useEffect, useState } from "react";
import { fetchMyPackages, UserPackageType } from "../../lib/api";

type Props = {
  token: string;
};

function ProgressRing({
  used,
  total,
  size = 80,
}: {
  used: number;
  total: number;
  size?: number;
}) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = total > 0 ? used / total : 0;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          className="text-warm-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          strokeLinecap="round"
          className={progress >= 1 ? "text-red-500" : "text-brand-500"}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
            transition: "stroke-dashoffset 0.5s ease-in-out",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-charcoal">{used}</span>
        <span className="text-xs text-charcoal-lighter">of {total}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-100 text-green-700 border-green-200",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    exhausted: "bg-gray-100 text-gray-600 border-gray-200",
  };
  const labels: Record<string, string> = {
    active: "Active",
    pending: "Pending",
    exhausted: "Completed",
  };
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
        styles[status] || styles.pending
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

function PackageCard({ pkg }: { pkg: UserPackageType }) {
  const remaining = pkg.creditsTotal - pkg.creditsUsed;
  const isExhausted = remaining <= 0;
  
  const purchaseDate = pkg.paidAt
    ? new Date(pkg.paidAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div
      className={`bg-white rounded-2xl border-2 p-6 transition-shadow hover:shadow-md ${
        isExhausted ? "border-warm-200 opacity-75" : "border-brand-300"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-lg font-bold text-charcoal">
              {pkg.package.name}
            </h3>
            <StatusBadge status={pkg.status} />
          </div>
          {pkg.package.description && (
            <p className="text-sm text-charcoal-lighter">
              {pkg.package.description}
            </p>
          )}
          {purchaseDate && (
            <p className="text-xs text-charcoal-lighter mt-1">
              Purchased on {purchaseDate}
            </p>
          )}
        </div>
        <ProgressRing used={pkg.creditsUsed} total={pkg.creditsTotal} />
      </div>

      {/* Session breakdown */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-warm-100">
        <div className="text-center">
          <p className="text-2xl font-bold text-brand-600">{pkg.creditsTotal}</p>
          <p className="text-xs text-charcoal-lighter">Total Sessions</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-charcoal">{pkg.creditsUsed}</p>
          <p className="text-xs text-charcoal-lighter">Completed</p>
        </div>
        <div className="text-center">
          <p className={`text-2xl font-bold ${remaining > 0 ? "text-green-600" : "text-gray-400"}`}>
            {remaining}
          </p>
          <p className="text-xs text-charcoal-lighter">Remaining</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="h-2 bg-warm-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isExhausted ? "bg-gray-400" : "bg-brand-500"
            }`}
            style={{ width: `${(pkg.creditsUsed / pkg.creditsTotal) * 100}%` }}
          />
        </div>
        <p className="text-xs text-charcoal-lighter mt-2 text-center">
          {isExhausted
            ? "All sessions completed! Consider purchasing a new package."
            : `${remaining} session${remaining !== 1 ? "s" : ""} remaining in this package`}
        </p>
      </div>
    </div>
  );
}

export function MyPackages({ token }: Props) {
  const [packages, setPackages] = useState<UserPackageType[]>([]);
  const [totalCredits, setTotalCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyPackages(token)
      .then((res) => {
        setPackages(res.packages);
        setTotalCredits(res.totalCredits);
      })
      .catch(() => setError("Failed to load packages."))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-brand-700 border-t-brand-400 rounded-full animate-spin" />
        <p className="text-charcoal-lighter text-sm mt-2">Loading packages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
        {error}
      </div>
    );
  }

  if (packages.length === 0) {
    return null; // Don't show section if no packages
  }

  const activePackages = packages.filter((p) => p.status === "active");
  const completedPackages = packages.filter((p) => p.status === "exhausted");

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-charcoal">
            My Packages
          </h2>
          <p className="text-sm text-charcoal-lighter mt-1">
            Track your session credits and usage
          </p>
        </div>
        {totalCredits > 0 && (
          <div className="bg-green-50 border border-green-200 px-4 py-2 rounded-xl">
            <p className="text-sm font-semibold text-green-700">
              {totalCredits} credit{totalCredits !== 1 ? "s" : ""} available
            </p>
          </div>
        )}
      </div>

      {/* Active Packages */}
      {activePackages.length > 0 && (
        <div className="space-y-4 mb-6">
          {activePackages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      )}

      {/* Completed Packages */}
      {completedPackages.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-charcoal-lighter hover:text-charcoal flex items-center gap-2">
            <svg
              className="w-4 h-4 transition-transform group-open:rotate-90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            View completed packages ({completedPackages.length})
          </summary>
          <div className="space-y-4 mt-4">
            {completedPackages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
