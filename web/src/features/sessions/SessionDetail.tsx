import React, { useState } from "react";
import { Session } from "./sessionApi";
import { createBookingAndOrder, verifyPayment, PolicyData } from "../bookings/bookingApi";
import { PolicyModal } from "./PolicyModal";

type Props = {
  session: Session;
  token: string;
  userName: string;
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

export function SessionDetail({ session, token, userName }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error" | "cancelled">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  async function handlePolicyConfirm(policyData: {
    signedName: string;
    signatureDataUrl: string;
    agreedAt: string;
  }) {
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

      const pd: PolicyData = {
        policySignedName: policyData.signedName,
        policySignature: policyData.signatureDataUrl,
        policyAgreedAt: policyData.agreedAt,
      };

      const order = await createBookingAndOrder(token, session, pd);

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

          <div className="flex items-center justify-between p-4 bg-brand-50 rounded-xl mb-6 border border-brand-200/50">
            <span className="text-sm font-medium text-charcoal-light">Session fee</span>
            <span className="text-2xl font-bold text-brand-700">
              {session.currency} {session.price}
            </span>
          </div>

          {/* Book button */}
          {status !== "success" && (
            <button
              onClick={() => setShowPolicy(true)}
              disabled={loading}
              className="w-full py-3.5 px-4 bg-brand-500 hover:bg-brand-600 disabled:bg-warm-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition text-base"
            >
              {loading ? <Spinner /> : null}
              {loading ? "Processing..." : "Book this session"}
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
                src={session.tidycalUrl}
                width="100%"
                height="600"
                style={{ border: "none" }}
                title="Book a time slot"
              />
            </div>
          </div>
        )}
      </div>

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
