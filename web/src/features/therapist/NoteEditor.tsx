import React, { useState, useEffect } from "react";
import {
  createTherapyNote,
  updateTherapyNote,
  updateNoteVisibility,
  fetchBookingNotes,
  fetchBookingRecordings,
  syncBookingRecordings,
  TherapyNote,
  ZoomRecording,
} from "../../lib/api";

type Props = {
  token: string;
  bookingId: string;
  clientName?: string;
  onBack: () => void;
};

const MOOD_LABELS = ["", "Very Low", "Low", "Somewhat Low", "Below Avg", "Neutral", "Above Avg", "Good", "High", "Very High", "Excellent"];
const THEME_SUGGESTIONS = ["Anxiety", "Depression", "Relationships", "Self-esteem", "Grief", "Trauma", "Stress", "Family", "Work", "Identity", "Anger", "Sleep", "Boundaries"];
const INTERVENTION_SUGGESTIONS = ["CBT", "DBT", "Mindfulness", "Psychoeducation", "Journaling", "Breathing", "Exposure", "EMDR", "Narrative", "Solution-Focused"];

type Section = "summary" | "clinical" | "planning" | "private" | "recordings";

export function NoteEditor({ token, bookingId, clientName, onBack }: Props) {
  const [existingNote, setExistingNote] = useState<TherapyNote | null>(null);
  const [activeSection, setActiveSection] = useState<Section>("summary");
  
  // Form state
  const [sessionSummary, setSessionSummary] = useState("");
  const [keyThemes, setKeyThemes] = useState<string[]>([]);
  const [themeInput, setThemeInput] = useState("");
  const [emotionalState, setEmotionalState] = useState("");
  const [moodRating, setMoodRating] = useState<number>(5);
  const [observations, setObservations] = useState("");
  const [interventions, setInterventions] = useState<string[]>([]);
  const [actionItems, setActionItems] = useState("");
  const [nextSessionFocus, setNextSessionFocus] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [visibility, setVisibility] = useState<"PRIVATE" | "SHARED" | "HOMEWORK">("PRIVATE");

  // Recordings state
  const [recordings, setRecordings] = useState<ZoomRecording[]>([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [syncingRecordings, setSyncingRecordings] = useState(false);

  // UI state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExisting();
  }, [bookingId]);

  async function loadExisting() {
    try {
      const data = await fetchBookingNotes(token, bookingId);
      if (data.note) {
        const n = data.note;
        setExistingNote(n);
        setSessionSummary(n.sessionSummary || "");
        setKeyThemes(n.keyThemes || []);
        setEmotionalState(n.emotionalState || "");
        setMoodRating(n.moodRating || 5);
        setObservations(n.observations || "");
        setInterventions(n.interventions ? n.interventions.split(", ").filter(Boolean) : []);
        setActionItems(n.actionItems || "");
        setNextSessionFocus(n.nextSessionFocus || "");
        setInternalNotes(n.internalNotes || "");
        setVisibility(n.visibility);
      }
    } catch {}
    setLoading(false);
    loadRecordings();
  }

  async function loadRecordings() {
    setLoadingRecordings(true);
    try {
      const data = await fetchBookingRecordings(token, bookingId);
      setRecordings(data.recordings || []);
    } catch (err) {
      console.error("Load recordings error:", err);
    }
    setLoadingRecordings(false);
  }

  async function handleSyncRecordings() {
    setSyncingRecordings(true);
    try {
      const data = await syncBookingRecordings(token, bookingId);
      setRecordings(data.recordings || []);
    } catch (err) {
      console.error("Sync recordings error:", err);
    }
    setSyncingRecordings(false);
  }

  function formatFileSize(bytes?: number): string {
    if (!bytes) return "Unknown size";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function addTheme(theme: string) {
    const t = theme.trim();
    if (t && !keyThemes.includes(t)) {
      setKeyThemes([...keyThemes, t]);
    }
    setThemeInput("");
  }

  function toggleIntervention(intervention: string) {
    if (interventions.includes(intervention)) {
      setInterventions(interventions.filter(i => i !== intervention));
    } else {
      setInterventions([...interventions, intervention]);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const tags = keyThemes.map((t) => ({ tag: t, category: "theme" }));
      const interventionsStr = interventions.join(", ");
      
      if (existingNote) {
        await updateTherapyNote(token, existingNote.id, {
          sessionSummary, keyThemes, emotionalState, moodRating,
          observations, interventions: interventionsStr, actionItems, nextSessionFocus,
          internalNotes, tags,
        });
      } else {
        const result = await createTherapyNote(token, {
          bookingId, sessionSummary, keyThemes, emotionalState, moodRating,
          observations, interventions: interventionsStr, actionItems, nextSessionFocus,
          internalNotes, visibility, tags,
        });
        setExistingNote(result.note);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save note");
    }
    setSaving(false);
  }

  async function handleVisibilityChange(v: "PRIVATE" | "SHARED" | "HOMEWORK") {
    if (!existingNote) {
      setVisibility(v);
      return;
    }
    if (v !== "PRIVATE" && existingNote.visibility === "PRIVATE") {
      if (!confirm("Share this note with the client? They will see the session summary, action items, and homework.")) {
        return;
      }
    }
    try {
      await updateNoteVisibility(token, existingNote.id, v);
      setVisibility(v);
      setExistingNote({ ...existingNote, visibility: v });
    } catch (err: any) {
      setError(err.message || "Failed to update visibility");
    }
  }

  function getSectionProgress() {
    let completed = 0;
    if (sessionSummary.trim()) completed++;
    if (keyThemes.length > 0 || emotionalState.trim()) completed++;
    if (observations.trim() || interventions.length > 0) completed++;
    if (actionItems.trim() || nextSessionFocus.trim()) completed++;
    return completed;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  const sections: { key: Section; label: string; icon: React.ReactNode }[] = [
    { key: "summary", label: "Summary", icon: <SummaryIcon /> },
    { key: "clinical", label: "Clinical", icon: <ClinicalIcon /> },
    { key: "planning", label: "Planning", icon: <PlanningIcon /> },
    { key: "private", label: "Private Notes", icon: <LockIcon /> },
    { key: "recordings", label: "Recordings", icon: <RecordingsIcon /> },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-lg border border-warm-200 flex items-center justify-center hover:bg-warm-50 transition-colors"
          >
            <BackIcon />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-warm-900">
              {existingNote ? "Edit Notes" : "Session Notes"}
            </h1>
            <p className="text-sm text-warm-500">
              {clientName || "Client"} &middot; {getSectionProgress()}/4 sections complete
            </p>
          </div>
        </div>

        {/* Visibility Toggle */}
        <div className="flex items-center gap-1 bg-warm-100 p-1 rounded-lg">
          {[
            { value: "PRIVATE", label: "Private", icon: <LockIcon className="w-3.5 h-3.5" /> },
            { value: "SHARED", label: "Shared", icon: <EyeIcon className="w-3.5 h-3.5" /> },
            { value: "HOMEWORK", label: "Homework", icon: <TaskIcon className="w-3.5 h-3.5" /> },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleVisibilityChange(opt.value as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                visibility === opt.value
                  ? opt.value === "PRIVATE"
                    ? "bg-warm-700 text-white"
                    : opt.value === "SHARED"
                    ? "bg-blue-500 text-white"
                    : "bg-green-500 text-white"
                  : "text-warm-600 hover:bg-warm-200"
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <span className="text-red-500">!</span> {error}
        </div>
      )}
      {saved && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <CheckIcon className="w-4 h-4" /> Notes saved successfully
        </div>
      )}

      <div className="flex gap-6">
        {/* Section Navigation */}
        <div className="w-48 flex-shrink-0">
          <div className="bg-white rounded-xl border border-warm-200 overflow-hidden sticky top-24">
            {sections.map((section, idx) => (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  activeSection === section.key
                    ? "bg-brand-50 text-brand-700 border-l-2 border-brand-500"
                    : "text-warm-600 hover:bg-warm-50 border-l-2 border-transparent"
                }`}
              >
                <span className={activeSection === section.key ? "text-brand-500" : "text-warm-400"}>
                  {section.icon}
                </span>
                <span className="text-sm font-medium">{section.label}</span>
              </button>
            ))}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-4 py-3 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <SaveIcon className="w-4 h-4" />
                {existingNote ? "Update" : "Save"}
              </>
            )}
          </button>

          <button
            onClick={onBack}
            className="w-full mt-2 py-2.5 text-warm-600 text-sm hover:text-warm-800 transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Section Content */}
        <div className="flex-1 bg-white rounded-xl border border-warm-200 p-6">
          {activeSection === "summary" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-2">
                  Session Summary
                </label>
                <textarea
                  value={sessionSummary}
                  onChange={(e) => setSessionSummary(e.target.value)}
                  rows={5}
                  placeholder="Describe what was discussed in this session..."
                  className="w-full rounded-lg border border-warm-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-2">
                  Key Themes
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {keyThemes.map((t) => (
                    <span
                      key={t}
                      className="bg-brand-100 text-brand-700 text-sm px-3 py-1 rounded-full flex items-center gap-1.5"
                    >
                      {t}
                      <button
                        onClick={() => setKeyThemes(keyThemes.filter((x) => x !== t))}
                        className="text-brand-400 hover:text-brand-600"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 mb-3">
                  <input
                    value={themeInput}
                    onChange={(e) => setThemeInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTheme(themeInput))}
                    placeholder="Add a theme..."
                    className="flex-1 rounded-lg border border-warm-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                  <button
                    onClick={() => addTheme(themeInput)}
                    className="px-4 py-2 bg-brand-500 text-white text-sm rounded-lg hover:bg-brand-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {THEME_SUGGESTIONS.filter((s) => !keyThemes.includes(s)).map((s) => (
                    <button
                      key={s}
                      onClick={() => addTheme(s)}
                      className="text-xs bg-warm-100 text-warm-600 px-2.5 py-1 rounded-full hover:bg-warm-200 transition-colors"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === "clinical" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-2">
                    Emotional State
                  </label>
                  <input
                    value={emotionalState}
                    onChange={(e) => setEmotionalState(e.target.value)}
                    placeholder="e.g., Anxious, Hopeful, Overwhelmed..."
                    className="w-full rounded-lg border border-warm-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-2">
                    Mood Rating
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={moodRating}
                      onChange={(e) => setMoodRating(Number(e.target.value))}
                      className="flex-1 accent-brand-500"
                    />
                    <span className="w-24 text-center py-1.5 bg-brand-50 text-brand-700 rounded-lg text-sm font-medium">
                      {moodRating}/10 {MOOD_LABELS[moodRating]}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-2">
                  Observations
                </label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={4}
                  placeholder="Behavioral patterns, body language, notable responses..."
                  className="w-full rounded-lg border border-warm-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-2">
                  Interventions Used
                </label>
                <div className="flex flex-wrap gap-2">
                  {INTERVENTION_SUGGESTIONS.map((i) => (
                    <button
                      key={i}
                      onClick={() => toggleIntervention(i)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        interventions.includes(i)
                          ? "bg-brand-500 text-white"
                          : "bg-warm-100 text-warm-600 hover:bg-warm-200"
                      }`}
                    >
                      {interventions.includes(i) && <span className="mr-1">✓</span>}
                      {i}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === "planning" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-2">
                  Action Items / Homework
                </label>
                <p className="text-xs text-warm-500 mb-2">
                  These will be visible to the client when you share the note
                </p>
                <textarea
                  value={actionItems}
                  onChange={(e) => setActionItems(e.target.value)}
                  rows={4}
                  placeholder="Exercises, reflections, or tasks for the client..."
                  className="w-full rounded-lg border border-warm-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-2">
                  Next Session Focus
                </label>
                <textarea
                  value={nextSessionFocus}
                  onChange={(e) => setNextSessionFocus(e.target.value)}
                  rows={3}
                  placeholder="Topics or goals for the next session..."
                  className="w-full rounded-lg border border-warm-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
                />
              </div>
            </div>
          )}

          {activeSection === "private" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-warm-100 rounded-lg">
                <LockIcon className="w-4 h-4 text-warm-500" />
                <p className="text-sm text-warm-600">
                  These notes are <strong>never visible</strong> to the client, regardless of sharing settings.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-2">
                  Internal Clinical Notes
                </label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={8}
                  placeholder="Private clinical observations, risk assessments, countertransference notes, supervision discussion points..."
                  className="w-full rounded-lg border border-warm-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none bg-warm-50"
                />
              </div>
            </div>
          )}

          {activeSection === "recordings" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-warm-700">Session Recordings</h3>
                  <p className="text-xs text-warm-500">Zoom cloud recordings and transcripts</p>
                </div>
                <button
                  onClick={handleSyncRecordings}
                  disabled={syncingRecordings}
                  className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {syncingRecordings ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Sync
                    </>
                  )}
                </button>
              </div>

              {loadingRecordings ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-warm-200 border-t-brand-500 rounded-full animate-spin" />
                </div>
              ) : recordings.length === 0 ? (
                <div className="text-center py-8 bg-warm-50 rounded-lg">
                  <RecordingsIcon className="w-12 h-12 mx-auto text-warm-300 mb-3" />
                  <p className="text-warm-600 text-sm">No recordings available</p>
                  <p className="text-warm-500 text-xs mt-1">
                    Recordings will appear here after the Zoom session ends
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recordings.map((rec) => (
                    <div key={rec.id} className="border border-warm-200 rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between p-4 bg-warm-50">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            rec.fileType === "TRANSCRIPT" ? "bg-purple-100 text-purple-600" :
                            rec.fileType === "MP4" ? "bg-blue-100 text-blue-600" :
                            "bg-warm-200 text-warm-600"
                          }`}>
                            {rec.fileType === "TRANSCRIPT" ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-warm-900">
                              {rec.fileType === "TRANSCRIPT" ? "Transcript" : rec.recordingType?.replace(/_/g, " ")}
                            </p>
                            <p className="text-xs text-warm-500">
                              {rec.fileType} &middot; {formatFileSize(rec.fileSize)}
                              {rec.status !== "completed" && (
                                <span className="ml-2 text-amber-600">({rec.status})</span>
                              )}
                            </p>
                          </div>
                        </div>
                        {rec.downloadUrl && rec.status === "completed" && (
                          <a
                            href={rec.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-warm-200 text-warm-700 text-sm rounded-lg hover:bg-warm-300 transition-colors"
                          >
                            Download
                          </a>
                        )}
                      </div>
                      {rec.fileType === "TRANSCRIPT" && rec.transcriptText && (
                        <div className="p-4 border-t border-warm-200 max-h-48 overflow-y-auto">
                          <p className="text-sm text-warm-700 whitespace-pre-wrap leading-relaxed">
                            {rec.transcriptText}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Icons
function BackIcon() {
  return (
    <svg className="w-5 h-5 text-warm-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function SummaryIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
    </svg>
  );
}

function ClinicalIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

function PlanningIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function LockIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function EyeIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function TaskIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function SaveIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CheckIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function RecordingsIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}
