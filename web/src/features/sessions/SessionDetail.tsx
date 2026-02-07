import React, { useState } from "react";
import { Session } from "./sessionApi";
import { createBookingAndOrder, verifyPayment } from "../bookings/bookingApi";

type Props = {
  session: Session;
  token: string;
};

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export function SessionDetail({ session, token }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  async function startCheckout() {
    setLoading(true);
    setStatus(null);
    try {
      if (!session.id) {
        setStatus("Session ID missing. Please refresh the page.");
        return;
      }
      const order = await createBookingAndOrder(token, session);
      const options = {
        key: order.razorpayKeyId,
        amount: order.amount * 100,
        currency: order.currency,
        order_id: order.orderId,
        name: "Session Booking",
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
          setStatus("Payment successful. Booking confirmed.");
          if (session.tidycalUrl) {
            setShowCalendar(true);
          }
        },
        modal: {
          ondismiss: () => setStatus("Payment cancelled."),
        },
      };
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setStatus("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h3>{session.title}</h3>
      <div>{session.host}</div>
      <div>
        {session.currency} {session.price}
      </div>
      <button onClick={startCheckout} disabled={loading}>
        Pay and book
      </button>
      {status && <div>{status}</div>}
      {showCalendar && session.tidycalUrl && (
        <div style={{ marginTop: 16 }}>
          <h4>Pick a time slot</h4>
          <iframe
            src={session.tidycalUrl}
            width="100%"
            height="600"
            style={{ border: "none" }}
            title="Book a time slot"
          />
        </div>
      )}
    </div>
  );
}
