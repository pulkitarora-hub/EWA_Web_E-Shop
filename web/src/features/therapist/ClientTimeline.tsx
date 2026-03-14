import React, { useEffect, useState } from "react";
import { fetchClientTimeline, TherapistClient } from "../../lib/api";

type Props = {
  token: string;
  client: TherapistClient;
  onBack: () => void;
  onAddNote: (bookingId: string) => void;
};

export function ClientTimeline({ token, client, onBack, onAddNote }: Props) {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadTimeline();
  }, [client.id]);

  async function loadTimeline() {
    try {
      const data = await fetchClientTimeline(token, client.id);
      setTimeline(data.timeline);
    } catch (err) {
      console.error("Timeline load error:", err);
    }
    setLoading(false);
  }

  const moodData = timeline
    .filter((b: any) => b.therapyNote?.moodRating)
    .map((b: any) => ({ date: b.session.startTime, mood: b.therapyNote.moodRating }))
    .reverse();

  return (
    <div>
      <button onClick={onBack} className="mb-4 text-brand-600 hover:text-brand-700 flex items-center gap-1 text-sm font-medium">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Clients
      </button>

      <div className="flex items-center gap-4 mb-6">
        {client.avatarUrl ? (
          <img src={client.avatarUrl} alt="" className="w-14 h-14 rounded-full" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xl font-bold">
            {(client.name || "?")[0].toUpperCase()}
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold text-charcoal">{client.name || "Unknown Client"}</h2>
          <p className="text-sm text-charcoal-lighter">{client.email} &middot; {client.totalSessions} sessions</p>
        </div>
      </div>

      {moodData.length >= 2 && (
        <div className="bg-white rounded-xl border border-warm-200 p-4 mb-6">
          <h3 className="text-sm font-semibold text-charcoal mb-3">Mood Trend</h3>
          <div className="flex items-end gap-1 h-20">
            {moodData.map((d: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-brand-400 rounded-t"
                  style={{ height: `${(d.mood / 10) * 100}%` }}
                  title={`Mood: ${d.mood}/10 on ${new Date(d.date).toLocaleDateString()}`}
                />
                <span className="text-[9px] text-charcoal-lighter">{new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-charcoal-lighter mt-1">
            <span>Low</span><span>High</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-charcoal-lighter">Loading timeline...</div>
      ) : timeline.length === 0 ? (
        <div className="text-center py-12 text-charcoal-lighter">No sessions found for this client.</div>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-warm-200" />
          <div className="space-y-4">
            {timeline.map((b: any, i: number) => {
              const note = b.therapyNote;
              const isExpanded = expandedId === b.id;
              const isPast = new Date(b.session.startTime) < new Date();

              return (
                <div key={b.id} className="relative pl-12">
                  <div className={`absolute left-3.5 w-3 h-3 rounded-full border-2 ${
                    note ? "bg-brand-500 border-brand-500" : isPast ? "bg-amber-400 border-amber-400" : "bg-white border-warm-300"
                  }`} style={{ top: "1.25rem" }} />

                  <div
                    className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
                      note ? "border-warm-200" : isPast ? "border-amber-200" : "border-warm-200"
                    }`}
                    onClick={() => setExpandedId(isExpanded ? null : b.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-charcoal-lighter">
                          Session #{timeline.length - i} &middot; {new Date(b.session.startTime).toLocaleDateString("en-IN", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                        </p>
                        <p className="font-medium text-charcoal mt-0.5">{b.session.title}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {note?.moodRating && (
                          <span className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">
                            Mood: {note.moodRating}/10
                          </span>
                        )}
                        {note ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            note.visibility === "SHARED" ? "bg-blue-100 text-blue-700" :
                            note.visibility === "HOMEWORK" ? "bg-green-100 text-green-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {note.visibility === "SHARED" ? "Shared" : note.visibility === "HOMEWORK" ? "Homework" : "Private"}
                          </span>
                        ) : isPast ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); onAddNote(b.id); }}
                            className="text-xs bg-amber-500 text-white px-2.5 py-1 rounded-lg hover:bg-amber-600"
                          >
                            Add Notes
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {note?.keyThemes?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {note.keyThemes.map((t: string) => (
                          <span key={t} className="text-[10px] bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    )}

                    {isExpanded && note && (
                      <div className="mt-4 pt-4 border-t border-warm-100 space-y-3">
                        {note.sessionSummary && (
                          <div>
                            <p className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wide">Summary</p>
                            <p className="text-sm text-charcoal mt-1">{note.sessionSummary}</p>
                          </div>
                        )}
                        {note.emotionalState && (
                          <div>
                            <p className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wide">Emotional State</p>
                            <p className="text-sm text-charcoal mt-1">{note.emotionalState}</p>
                          </div>
                        )}
                        {note.observations && (
                          <div>
                            <p className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wide">Observations</p>
                            <p className="text-sm text-charcoal mt-1">{note.observations}</p>
                          </div>
                        )}
                        {note.interventions && (
                          <div>
                            <p className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wide">Interventions</p>
                            <p className="text-sm text-charcoal mt-1">{note.interventions}</p>
                          </div>
                        )}
                        {note.actionItems && (
                          <div>
                            <p className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wide">Action Items</p>
                            <p className="text-sm text-charcoal mt-1">{note.actionItems}</p>
                          </div>
                        )}
                        {note.nextSessionFocus && (
                          <div>
                            <p className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wide">Next Session Focus</p>
                            <p className="text-sm text-charcoal mt-1">{note.nextSessionFocus}</p>
                          </div>
                        )}
                        {note.internalNotes && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">🔒 Internal Notes</p>
                            <p className="text-sm text-gray-600 mt-1">{note.internalNotes}</p>
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); onAddNote(b.id); }}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                        >
                          Edit Notes
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
