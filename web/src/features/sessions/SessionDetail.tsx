import React, { useEffect, useState } from "react";
import { Session } from "./sessionApi";
import { createBookingAndOrder, verifyPayment, PolicyData } from "../bookings/bookingApi";
import { PolicyModal } from "./PolicyModal";
import { SessionReviewsDisplay } from "./SessionReviews";
import { validatePromoCode, fetchMyPackages, PromoValidation } from "../../lib/api";

type Props = {
  session: Session;
  token: string;
  userName: string;
  userEmail: string;
  hasSignedPolicy?: boolean;
};

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function SessionDetail({ session, token, userName, userEmail, hasSignedPolicy }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error" | "cancelled">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  // Promo code state
  const [promoInput, setPromoInput] = useState("");
  const [promoResult, setPromoResult] = useState<PromoValidation | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [checkingPromo, setCheckingPromo] = useState(false);

  // Credits state
  const [totalCredits, setTotalCredits] = useState(0);
  const [useCredit, setUseCredit] = useState(false);

  // Build TidyCal URL with pre-filled name and email
  const tidycalUrlWithParams = session.tidycalUrl
    ? `${session.tidycalUrl}${session.tidycalUrl.includes("?") ? "&" : "?"}name=${encodeURIComponent(userName)}&email=${encodeURIComponent(userEmail)}`
    : "";

  useEffect(() => {
    fetchMyPackages(token)
      .then((res) => setTotalCredits(res.totalCredits))
      .catch(() => {});
  }, [token]);

  async function handlePromoCheck() {
    if (!promoInput.trim()) return;
    setCheckingPromo(true);
    setPromoError(null);
    setPromoResult(null);
    try {
      const res = await validatePromoCode(token, promoInput.trim(), session.price);
      setPromoResult(res);
    } catch (err: any) {
      setPromoError(err.message || "Invalid promo code.");
    } finally {
      setCheckingPromo(false);
    }
  }

  function clearPromo() {
    setPromoInput("");
    setPromoResult(null);
    setPromoError(null);
  }

  async function proceedBooking(policyData?: PolicyData) {
    setShowPolicy(false);
    setLoading(true);
    setStatus("idle");
    setStatusMessage(null);

    try {
      if (!session.id) {
        setStatus("error");
        setStatusMessage("Session ID missing. Please refresh the page.");
        return;
      }

      const extras: { promoCode?: string; useCredit?: boolean } = {};
      if (useCredit) {
        extras.useCredit = true;
      } else if (promoResult?.valid) {
        extras.promoCode = promoResult.code;
      }

      const order = await createBookingAndOrder(token, session, policyData, extras);

      // Credit booking — no Razorpay needed
      if (order.usedCredit) {
        setStatus("success");
        setStatusMessage("Booking confirmed using your session credit!");
        if (session.tidycalUrl) setShowCalendar(true);
        return;
      }

      const options = {
        key: order.razorpayKeyId,
        amount: order.amount * 100,
        currency: order.currency,
        order_id: order.orderId,
        name: "Evolve with Avadhi",
        description: session.title,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          await verifyPayment({
            token,
            bookingId: order.bookingId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          setStatus("success");
          setStatusMessage("Payment successful! Your booking is confirmed.");
          if (session.tidycalUrl) {
            setShowCalendar(true);
          }
        },
        modal: {
          ondismiss: () => {
            setStatus("cancelled");
            setStatusMessage("Payment was cancelled.");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setStatus("error");
      setStatusMessage("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePolicyConfirm(policyData: {
    signedName: string;
    signatureDataUrl: string;
    agreedAt: string;
  }) {
    const pd: PolicyData = {
      policySignedName: policyData.signedName,
      policySignature: policyData.signatureDataUrl,
      policyAgreedAt: policyData.agreedAt,
    };
    await proceedBooking(pd);
  }

  async function handleBookWithoutPolicy() {
    await proceedBooking(undefined);
  }

  const date = new Date(session.startTime);
  const dateStr = date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <div className="bg-white rounded-2xl border border-warm-200 overflow-hidden shadow-lg shadow-warm-200/30">
        {/* Session header – dark gradient */}
        <div className="bg-deep px-6 py-6">
          <h3 className="font-heading text-2xl font-semibold text-white mb-1">
            {session.title}
          </h3>
          <p className="text-brand-300">with {session.host}</p>
        </div>

        {/* Session details */}
        <div className="px-6 py-5">
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-charcoal-light">
              <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {dateStr}
            </div>
            <div className="flex items-center gap-2 text-sm text-charcoal-light">
              <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {timeStr}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-brand-50 rounded-xl mb-4 border border-brand-200/50">
            <span className="text-sm font-medium text-charcoal-light">Session fee</span>
            <div className="text-right">
              {useCredit ? (
                <div>
                  <span className="text-lg line-through text-charcoal-lighter mr-2">{session.currency} {session.price}</span>
                  <span className="text-2xl font-bold text-green-600">FREE</span>
                  <p className="text-xs text-green-600">Using session credit</p>
                </div>
              ) : promoResult?.valid ? (
                <div>
                  <span className="text-lg line-through text-charcoal-lighter mr-2">{session.currency} {session.price}</span>
                  <span className="text-2xl font-bold text-brand-700">{session.currency} {session.price - promoResult.discount}</span>
                  <p className="text-xs text-green-600">-{session.currency} {promoResult.discount} ({promoResult.description})</p>
                </div>
              ) : (
                <span className="text-2xl font-bold text-brand-700">
                  {session.currency} {session.price}
                </span>
              )}
            </div>
          </div>

          {/* Credit toggle */}
          {totalCredits > 0 && status !== "success" && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCredit}
                  onChange={(e) => {
                    setUseCredit(e.target.checked);
                    if (e.target.checked) clearPromo();
                  }}
                  className="w-4 h-4 text-brand-500 rounded focus:ring-brand-400"
                />
                <div>
                  <span className="text-sm font-medium text-charcoal">
                    Use session credit ({totalCredits} available)
                  </span>
                  <p className="text-xs text-charcoal-lighter">Book this session for free using your package credits</p>
                </div>
              </label>
            </div>
          )}

          {/* Promo code input */}
          {!useCredit && status !== "success" && (
            <div className="mb-4">
              {promoResult?.valid ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-green-700">{promoResult.code} — {promoResult.description}</span>
                  </div>
                  <button onClick={clearPromo} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="Promo code"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-warm-300 bg-warm-50/50 text-charcoal uppercase tracking-wider text-sm placeholder:text-charcoal-lighter/50 focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition"
                  />
                  <button
                    onClick={handlePromoCheck}
                    disabled={!promoInput.trim() || checkingPromo}
                    className="px-4 py-2.5 bg-warm-200 hover:bg-warm-300 disabled:bg-warm-100 text-charcoal font-medium rounded-xl text-sm transition"
                  >
                    {checkingPromo ? "..." : "Apply"}
                  </button>
                </div>
              )}
              {promoError && (
                <p className="text-xs text-red-500 mt-1.5">{promoError}</p>
              )}
            </div>
          )}

          {/* Book button */}
          {status !== "success" && (
            <button
              onClick={hasSignedPolicy ? handleBookWithoutPolicy : () => setShowPolicy(true)}
              disabled={loading}
              className="w-full py-3.5 px-4 bg-brand-500 hover:bg-brand-600 disabled:bg-warm-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition text-base"
            >
              {loading ? <Spinner /> : null}
              {loading ? "Processing..." : useCredit ? "Book with Credit" : "Book this session"}
            </button>
          )}

          {/* Status messages */}
          {statusMessage && (
            <div
              className={`mt-4 px-4 py-3 rounded-xl text-sm flex items-start gap-2 ${
                status === "success"
                  ? "bg-sage-50 border border-sage-200 text-sage-700"
                  : status === "error"
                  ? "bg-red-50 border border-red-200 text-red-700"
                  : "bg-warm-100 border border-warm-300 text-charcoal-light"
              }`}
            >
              {status === "success" && (
                <svg className="w-5 h-5 text-sage-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {status === "error" && (
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* TidyCal embed */}
        {showCalendar && session.tidycalUrl && (
          <div className="border-t border-warm-200/60 px-6 py-5">
            <h4 className="font-semibold text-charcoal mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Pick a time slot
            </h4>
            <div className="rounded-xl border border-warm-200 overflow-hidden">
              <iframe
                src={tidycalUrlWithParams}
                width="100%"
                height="600"
                style={{ border: "none" }}
                title="Book a time slot"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          </div>
        )}
      </div>

      {/* Reviews section */}
      <SessionReviewsDisplay sessionId={session.id} />

      {/* Policy Modal */}
      {showPolicy && (
        <PolicyModal
          userName={userName}
          onConfirm={handlePolicyConfirm}
          onCancel={() => setShowPolicy(false)}
        />
      )}
    </>
  );
}
