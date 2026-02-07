"use client";

import React, { useEffect, useState } from "react";
import { fetchSessionReviews, SessionReviews as SessionReviewsType } from "../../lib/api";

type Props = {
  sessionId: string;
};

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? "text-amber-400 fill-amber-400"
              : "text-gray-200 fill-gray-200"
          }`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function SessionReviewsDisplay({ sessionId }: Props) {
  const [data, setData] = useState<SessionReviewsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessionReviews(sessionId)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return null;

  if (!data || data.count === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold text-charcoal">Reviews</h3>
        <div className="flex items-center gap-1.5">
          <StarDisplay rating={Math.round(data.averageRating)} />
          <span className="text-sm font-medium text-charcoal">
            {data.averageRating}
          </span>
          <span className="text-xs text-charcoal-lighter">
            ({data.count} {data.count === 1 ? "review" : "reviews"})
          </span>
        </div>
      </div>
      <div className="space-y-3">
        {data.reviews.map((review) => (
          <div
            key={review.id}
            className="bg-white rounded-xl border border-warm-200 p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              {review.user.avatarUrl ? (
                <img
                  src={review.user.avatarUrl}
                  alt=""
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
                  {(review.user.name || "U").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-charcoal">
                    {review.user.name || "Anonymous"}
                  </span>
                  <StarDisplay rating={review.rating} />
                </div>
                <span className="text-xs text-charcoal-lighter">
                  {new Date(review.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
            {review.comment && (
              <p className="text-sm text-charcoal-lighter pl-11">
                {review.comment}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Compact badge for use in session list cards
export function ReviewBadge({ sessionId }: Props) {
  const [data, setData] = useState<{ avg: number; count: number } | null>(null);

  useEffect(() => {
    fetchSessionReviews(sessionId)
      .then((res) => {
        if (res.count > 0) {
          setData({ avg: res.averageRating, count: res.count });
        }
      })
      .catch(() => {});
  }, [sessionId]);

  if (!data) return null;

  return (
    <div className="flex items-center gap-1 text-xs text-charcoal-lighter">
      <svg
        className="w-3.5 h-3.5 text-amber-400 fill-amber-400"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <span className="font-medium">{data.avg}</span>
      <span>({data.count})</span>
    </div>
  );
}
