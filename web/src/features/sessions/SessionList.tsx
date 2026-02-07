import React, { useEffect, useState } from "react";
import { fetchSessions, Session } from "./sessionApi";
import { ReviewBadge } from "./SessionReviews";

type Props = {
  onSelect: (session: Session) => void;
};

export function SessionList({ onSelect }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions()
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-brand-700 border-t-brand-400 rounded-full animate-spin" />
        <p className="text-charcoal-lighter text-sm mt-3">Loading sessions...</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 mx-auto mb-4 bg-brand-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-charcoal mb-1">No sessions available</h3>
        <p className="text-sm text-charcoal-lighter">Check back soon for upcoming sessions.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-semibold text-charcoal">
          Available Sessions
        </h2>
        <p className="text-sm text-charcoal-lighter mt-1">
          Choose a session to begin your journey
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sessions.map((session) => {
          const date = new Date(session.startTime);
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
            <button
              key={session.id}
              onClick={() => onSelect(session)}
              className="text-left bg-white rounded-xl border border-warm-200 p-5 hover:border-brand-400 hover:shadow-xl hover:shadow-brand-200/20 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-charcoal group-hover:text-brand-700 transition-colors">
                  {session.title}
                </h3>
                <span className="text-sm font-bold text-brand-700 bg-brand-100 px-2.5 py-1 rounded-lg whitespace-nowrap ml-3">
                  {session.currency} {session.price}
                </span>
              </div>
              <p className="text-sm text-charcoal-lighter mb-3">
                with {session.host}
              </p>
              <div className="flex items-center gap-2 text-xs text-charcoal-lighter">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{dateStr}</span>
                <span className="text-warm-300">|</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{timeStr}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <ReviewBadge sessionId={session.id} />
                <span className="text-sm font-semibold text-brand-600 group-hover:text-brand-700 flex items-center gap-1">
                  Book session
                  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
