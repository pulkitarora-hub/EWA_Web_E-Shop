import React, { useEffect, useState } from "react";
import { fetchClientDashboard, ClientDashboardData } from "../../lib/api";

type Props = {
  token: string;
  userName: string;
  onNavigate: (view: string) => void;
};

export function ClientDashboard({ token, userName, onNavigate }: Props) {
  const [data, setData] = useState<ClientDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchClientDashboard(token);
      setData(result);
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError("Failed to load dashboard");
    }
    setLoading(false);
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-warm-600 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 mb-4">{error || "Something went wrong"}</p>
        <button
          onClick={loadDashboard}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
        <h1 className="text-xl sm:text-2xl font-semibold mb-1">
          {getGreeting()}, {userName || "there"}!
        </h1>
        <p className="text-brand-100 text-sm">
          {data.journey.completedSessions > 0
            ? `You've completed ${data.journey.completedSessions} session${data.journey.completedSessions !== 1 ? "s" : ""} on your wellness journey.`
            : "Welcome to your wellness journey. Book your first session to get started!"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Upcoming Sessions */}
        <div className="bg-white rounded-xl shadow-sm p-5 md:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-warm-900">Upcoming Sessions</h2>
            <button
              onClick={() => onNavigate("sessions")}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              Book New
            </button>
          </div>

          {data.upcomingBookings.length === 0 ? (
            <div className="text-center py-8 bg-warm-50 rounded-lg">
              <svg className="w-12 h-12 mx-auto text-warm-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-warm-600 text-sm mb-3">No upcoming sessions</p>
              <button
                onClick={() => onNavigate("sessions")}
                className="px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 transition-colors"
              >
                Book a Session
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {data.upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-warm-50 rounded-lg hover:bg-warm-100 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-warm-900">{booking.sessionTitle}</p>
                      <p className="text-sm text-warm-500">
                        {formatDate(booking.actualStartTime || booking.startTime)} at {formatTime(booking.actualStartTime || booking.startTime)}
                        {booking.actualStartTime && (
                          <span className="ml-1 text-xs text-green-600">(confirmed)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-end sm:justify-start">
                    {booking.zoomJoinUrl ? (
                      <a
                        href={booking.zoomJoinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M4 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H4zm0 2h16v14H4V5zm2 2v10h12V7H6zm2 2h8v6H8V9z"/>
                        </svg>
                        Join via Zoom
                      </a>
                    ) : (
                      <span className="text-sm text-warm-500 italic">
                        Check email for meeting link
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Credits & Subscriptions */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-lg font-semibold text-warm-900 mb-4">Your Credits</h2>

          <div className="text-center p-4 bg-gradient-to-br from-brand-50 to-brand-100 rounded-lg mb-4">
            <p className="text-4xl font-bold text-brand-700">{data.credits.available}</p>
            <p className="text-sm text-brand-600">Session Credits Available</p>
          </div>

          {data.credits.packages.length > 0 && (
            <div className="space-y-2 mb-4">
              {data.credits.packages.map((pkg) => (
                <div key={pkg.id} className="flex items-center justify-between text-sm">
                  <span className="text-warm-600">{pkg.name}</span>
                  <span className="font-medium text-warm-900">
                    {pkg.remaining}/{pkg.total}
                  </span>
                </div>
              ))}
            </div>
          )}

          {data.subscriptions.length > 0 && (
            <div className="border-t border-warm-100 pt-4 mt-4">
              <p className="text-sm font-medium text-warm-700 mb-2">Active Subscriptions</p>
              {data.subscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between text-sm py-1">
                  <span className="text-warm-600">{sub.sessionTitle}</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {sub.frequency}
                  </span>
                </div>
              ))}
            </div>
          )}

          {data.credits.available === 0 && data.subscriptions.length === 0 && (
            <button
              onClick={() => onNavigate("sessions")}
              className="w-full mt-2 px-4 py-2 bg-warm-100 text-warm-700 text-sm rounded-lg hover:bg-warm-200 transition-colors"
            >
              Purchase Credits
            </button>
          )}
        </div>

        {/* Therapy Journey */}
        <div className="bg-white rounded-xl shadow-sm p-5 md:col-span-2 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-warm-900">Your Wellness Journey</h2>
            <button
              onClick={() => onNavigate("timeline")}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              View Full Journey
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-warm-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-warm-900">{data.journey.completedSessions}</p>
              <p className="text-sm text-warm-500">Sessions Completed</p>
            </div>
            <div className="p-4 bg-warm-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-warm-900">{data.journey.sharedNotesCount}</p>
              <p className="text-sm text-warm-500">Session Notes</p>
            </div>
            <div className="p-4 bg-warm-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-warm-900">
                {data.journey.moodTrend.length > 0
                  ? Math.round(
                      data.journey.moodTrend
                        .filter((m) => m.rating !== null)
                        .reduce((sum, m) => sum + (m.rating || 0), 0) /
                        data.journey.moodTrend.filter((m) => m.rating !== null).length
                    ) || "-"
                  : "-"}
              </p>
              <p className="text-sm text-warm-500">Avg Mood Rating</p>
            </div>
            <div className="p-4 bg-warm-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-warm-900">{data.upcomingBookings.length}</p>
              <p className="text-sm text-warm-500">Upcoming Sessions</p>
            </div>
          </div>

          {/* Mood Trend Mini Chart */}
          {data.journey.moodTrend.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-warm-700 mb-3">Mood Trend</p>
              <div className="flex items-end gap-2 h-20">
                {data.journey.moodTrend.map((point, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-brand-400 rounded-t transition-all"
                      style={{
                        height: point.rating ? `${(point.rating / 10) * 100}%` : "10%",
                        opacity: point.rating ? 1 : 0.3,
                      }}
                    />
                    <span className="text-xs text-warm-400">
                      {new Date(point.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Notes */}
          {data.journey.recentNotes.length > 0 ? (
            <div>
              <p className="text-sm font-medium text-warm-700 mb-3">Recent Session Notes</p>
              <div className="space-y-2">
                {data.journey.recentNotes.slice(0, 3).map((note) => (
                  <div
                    key={note.id}
                    className="flex items-center justify-between p-3 bg-warm-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                        {note.moodRating ? (
                          <span className="text-sm font-medium text-brand-700">{note.moodRating}</span>
                        ) : (
                          <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-warm-900">{note.sessionTitle}</p>
                        <p className="text-xs text-warm-500">{formatDate(note.sessionDate)}</p>
                      </div>
                    </div>
                    {note.keyThemes && note.keyThemes.length > 0 && (
                      <div className="flex gap-1">
                        {note.keyThemes.slice(0, 2).map((theme, i) => (
                          <span
                            key={i}
                            className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full"
                          >
                            {theme}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-warm-50 rounded-lg">
              <p className="text-warm-500 text-sm">
                Session notes will appear here after your therapist shares them with you.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <button
          onClick={() => onNavigate("sessions")}
          className="flex items-center justify-center gap-3 p-5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="font-medium">Book a Session</span>
        </button>
        <button
          onClick={() => onNavigate("timeline")}
          className="flex items-center justify-center gap-3 p-5 bg-white text-warm-700 rounded-xl border border-warm-200 hover:bg-warm-50 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="font-medium">View My Journey</span>
        </button>
      </div>
    </div>
  );
}
