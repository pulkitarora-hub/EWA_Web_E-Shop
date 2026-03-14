import React, { useEffect, useState } from "react";
import { fetchMyTimeline, TimelineEntry } from "../../lib/api";

type Props = {
  token: string;
};

export function MyTherapyTimeline({ token }: Props) {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchMyTimeline(token)
      .then((data) => setTimeline(data.timeline))
      .catch((err) => console.error("Timeline error:", err))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <div className="text-center py-12 text-charcoal-lighter">Loading your therapy journey...</div>;
  }

  if (timeline.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">🌱</p>
        <h3 className="text-lg font-semibold text-charcoal mb-2">Your Therapy Journey</h3>
        <p className="text-charcoal-lighter text-sm">Your session timeline will appear here after your first session.</p>
      </div>
    );
  }

  const moodEntries = timeline
    .filter((e) => e.note?.moodRating)
    .map((e) => ({ date: e.sessionDate, mood: e.note!.moodRating! }))
    .reverse();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-charcoal">My Therapy Journey</h2>
        <p className="text-sm text-charcoal-lighter mt-1">{timeline.length} sessions</p>
      </div>

      {moodEntries.length >= 2 && (
        <div className="bg-white rounded-xl border border-warm-200 p-4 mb-6">
          <h3 className="text-sm font-semibold text-charcoal mb-3">Your Mood Trend</h3>
          <div className="flex items-end gap-1 h-16">
            {moodEntries.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-brand-400 rounded-t transition-all"
                  style={{ height: `${(d.mood / 10) * 100}%` }}
                  title={`Mood: ${d.mood}/10`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-charcoal-lighter mt-1">
            <span>{new Date(moodEntries[0]?.date).toLocaleDateString(undefined, { month: "short" })}</span>
            <span>{new Date(moodEntries[moodEntries.length - 1]?.date).toLocaleDateString(undefined, { month: "short" })}</span>
          </div>
        </div>
      )}

      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-brand-100" />
        <div className="space-y-4">
          {timeline.map((entry, i) => {
            const isExpanded = expandedId === entry.bookingId;
            const hasNote = !!entry.note;

            return (
              <div key={entry.bookingId} className="relative pl-12">
                <div className={`absolute left-3.5 w-3 h-3 rounded-full border-2 ${
                  hasNote ? "bg-brand-500 border-brand-500" : "bg-white border-warm-300"
                }`} style={{ top: "1.25rem" }} />

                <div
                  className={`bg-white rounded-xl border border-warm-200 p-4 transition-all ${hasNote ? "cursor-pointer hover:shadow-md" : ""}`}
                  onClick={() => hasNote && setExpandedId(isExpanded ? null : entry.bookingId)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-charcoal-lighter">
                        {new Date(entry.sessionDate).toLocaleDateString("en-IN", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                      </p>
                      <p className="font-medium text-charcoal mt-0.5">{entry.sessionTitle}</p>
                      <p className="text-xs text-charcoal-lighter">with {entry.sessionHost}</p>
                    </div>
                    {hasNote && (
                      <div className="flex items-center gap-2">
                        {entry.note?.moodRating && (
                          <span className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">
                            Mood: {entry.note.moodRating}/10
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          entry.note?.visibility === "HOMEWORK" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {entry.note?.visibility === "HOMEWORK" ? "Homework" : "Summary"}
                        </span>
                      </div>
                    )}
                  </div>

                  {entry.note?.keyThemes && entry.note.keyThemes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {entry.note.keyThemes.map((t) => (
                        <span key={t} className="text-[10px] bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  )}

                  {isExpanded && entry.note && (
                    <div className="mt-4 pt-4 border-t border-warm-100 space-y-3">
                      {entry.note.sessionSummary && (
                        <div>
                          <p className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wide">Session Summary</p>
                          <p className="text-sm text-charcoal mt-1">{entry.note.sessionSummary}</p>
                        </div>
                      )}
                      {entry.note.emotionalState && (
                        <div>
                          <p className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wide">Emotional State</p>
                          <p className="text-sm text-charcoal mt-1">{entry.note.emotionalState}</p>
                        </div>
                      )}
                      {entry.note.interventions && (
                        <div>
                          <p className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wide">Techniques Used</p>
                          <p className="text-sm text-charcoal mt-1">{entry.note.interventions}</p>
                        </div>
                      )}
                      {entry.note.actionItems && (
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Your Action Items</p>
                          <p className="text-sm text-green-800 mt-1">{entry.note.actionItems}</p>
                        </div>
                      )}
                      {entry.note.nextSessionFocus && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Next Session Focus</p>
                          <p className="text-sm text-blue-800 mt-1">{entry.note.nextSessionFocus}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
