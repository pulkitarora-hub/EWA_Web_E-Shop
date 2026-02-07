"use client";

import React, { useEffect, useState } from "react";
import {
  fetchMyBookings,
  cancelBooking,
  submitReview,
  BookingWithSession,
} from "../../lib/api";

type Props = {
  token: string;
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: "bg-green-100 text-green-700 border-green-200",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
        styles[status] || "bg-gray-100 text-gray-600 border-gray-200"
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function StarRating({
  rating,
  onRate,
  interactive,
}: {
  rating: number;
  onRate?: (r: number) => void;
  interactive?: boolean;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={`text-lg ${interactive ? "cursor-pointer" : "cursor-default"}`}
        >
          <svg
            className={`w-5 h-5 ${
              star <= (hover || rating)
                ? "text-amber-400 fill-amber-400"
                : "text-gray-300 fill-gray-300"
            } transition-colors`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export function MyBookings({ token }: Props) {
  const [bookings, setBookings] = useState<BookingWithSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setLoading(true);
    try {
      const res = await fetchMyBookings(token);
      setBookings(res.bookings);
    } catch {
      setError("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(bookingId: string) {
    setCancellingId(bookingId);
    setError(null);
    try {
      const res = await cancelBooking(token, bookingId, cancelReason);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? res.booking : b))
      );
      setShowCancelModal(null);
      setCancelReason("");
    } catch (err: any) {
      setError(err.message || "Failed to cancel booking.");
    } finally {
      setCancellingId(null);
    }
  }

  async function handleReview(bookingId: string) {
    setSubmittingReview(true);
    setError(null);
    try {
      const res = await submitReview(token, bookingId, reviewRating, reviewComment);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, review: res.review } : b
        )
      );
      setShowReviewModal(null);
      setReviewRating(0);
      setReviewComment("");
    } catch (err: any) {
      setError(err.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  }

  function canCancel(booking: BookingWithSession): boolean {
    if (booking.status !== "paid") return false;
    const sessionTime = new Date(booking.session.startTime).getTime();
    const hoursUntil = (sessionTime - Date.now()) / (1000 * 60 * 60);
    return hoursUntil >= 24;
  }

  function canReview(booking: BookingWithSession): boolean {
    if (booking.status !== "paid") return false;
    if (booking.review) return false;
    const sessionTime = new Date(booking.session.startTime).getTime();
    return sessionTime < Date.now();
  }

  function isUpcoming(booking: BookingWithSession): boolean {
    return (
      booking.status === "paid" &&
      new Date(booking.session.startTime).getTime() > Date.now()
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-brand-700 border-t-brand-400 rounded-full animate-spin" />
        <p className="text-charcoal-lighter text-sm mt-3">Loading bookings...</p>
      </div>
    );
  }

  const upcoming = bookings.filter(isUpcoming);
  const past = bookings.filter((b) => !isUpcoming(b));

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-semibold text-charcoal">
          My Bookings
        </h2>
        <p className="text-sm text-charcoal-lighter mt-1">
          Your upcoming and past session bookings
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 bg-brand-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-charcoal mb-1">No bookings yet</h3>
          <p className="text-sm text-charcoal-lighter">
            Book a session to get started on your journey.
          </p>
        </div>
      ) : (
        <>
          {/* Upcoming Bookings */}
          {upcoming.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Upcoming Sessions ({upcoming.length})
              </h3>
              <div className="space-y-3">
                {upcoming.map((booking) => {
                  const date = new Date(booking.session.startTime);
                  const dateStr = date.toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const timeStr = date.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <div
                      key={booking.id}
                      className="bg-white rounded-xl border border-warm-200 p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-charcoal">
                              {booking.session.title}
                            </h4>
                            <StatusBadge status={booking.status} />
                          </div>
                          <p className="text-sm text-charcoal-lighter mb-1">
                            with {booking.session.host}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-charcoal-lighter">
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {dateStr}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {timeStr}
                            </span>
                            <span className="font-medium text-brand-700">
                              {booking.currency} {booking.amount}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {canCancel(booking) && (
                            <button
                              onClick={() => setShowCancelModal(booking.id)}
                              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Past Bookings */}
          {past.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                Past & Other Bookings ({past.length})
              </h3>
              <div className="space-y-3">
                {past.map((booking) => {
                  const date = new Date(booking.session.startTime);
                  const dateStr = date.toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const timeStr = date.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <div
                      key={booking.id}
                      className={`bg-white rounded-xl border p-5 transition-shadow ${
                        booking.status === "cancelled"
                          ? "border-red-100 bg-red-50/30"
                          : "border-warm-200"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4
                              className={`font-semibold ${
                                booking.status === "cancelled"
                                  ? "text-charcoal-lighter line-through"
                                  : "text-charcoal"
                              }`}
                            >
                              {booking.session.title}
                            </h4>
                            <StatusBadge status={booking.status} />
                          </div>
                          <p className="text-sm text-charcoal-lighter mb-1">
                            with {booking.session.host}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-charcoal-lighter">
                            <span>{dateStr}</span>
                            <span>{timeStr}</span>
                            <span className="font-medium">
                              {booking.currency} {booking.amount}
                            </span>
                          </div>
                          {booking.status === "cancelled" && booking.cancelReason && (
                            <p className="text-xs text-red-500 mt-2 italic">
                              Reason: {booking.cancelReason}
                            </p>
                          )}
                          {booking.review && (
                            <div className="mt-3 flex items-center gap-2">
                              <StarRating rating={booking.review.rating} />
                              {booking.review.comment && (
                                <span className="text-xs text-charcoal-lighter italic">
                                  "{booking.review.comment}"
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {canReview(booking) && (
                            <button
                              onClick={() => {
                                setShowReviewModal(booking.id);
                                setReviewRating(0);
                                setReviewComment("");
                              }}
                              className="px-4 py-2 text-sm font-medium text-brand-700 bg-brand-50 border border-brand-200 rounded-lg hover:bg-brand-100 transition-colors"
                            >
                              Leave Review
                            </button>
                          )}
                          {canCancel(booking) && (
                            <button
                              onClick={() => setShowCancelModal(booking.id)}
                              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-charcoal mb-2">Cancel Booking</h3>
            <p className="text-sm text-charcoal-lighter mb-4">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)"
              className="w-full px-4 py-3 rounded-xl border border-warm-300 bg-warm-50/50 text-charcoal mb-4 resize-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition"
              rows={3}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(null);
                  setCancelReason("");
                }}
                className="px-4 py-2 text-sm font-medium text-charcoal border border-warm-300 rounded-lg hover:bg-warm-100 transition-colors"
              >
                Keep Booking
              </button>
              <button
                onClick={() => handleCancel(showCancelModal)}
                disabled={cancellingId === showCancelModal}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {cancellingId === showCancelModal ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-charcoal mb-2">Leave a Review</h3>
            <p className="text-sm text-charcoal-lighter mb-4">
              How was your experience? Your feedback helps us improve.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-charcoal mb-2">
                Rating
              </label>
              <StarRating
                rating={reviewRating}
                onRate={setReviewRating}
                interactive
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-charcoal mb-2">
                Comment (optional)
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Tell us about your experience..."
                className="w-full px-4 py-3 rounded-xl border border-warm-300 bg-warm-50/50 text-charcoal resize-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowReviewModal(null);
                  setReviewRating(0);
                  setReviewComment("");
                }}
                className="px-4 py-2 text-sm font-medium text-charcoal border border-warm-300 rounded-lg hover:bg-warm-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReview(showReviewModal)}
                disabled={reviewRating === 0 || submittingReview}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
