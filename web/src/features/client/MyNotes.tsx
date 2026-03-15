"use client";

import React, { useEffect, useState } from "react";
import { fetchClientMyNotes, ClientNote } from "../../lib/api";

type Props = { token: string };

export function MyNotes({ token }: Props) {
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setError(null);
    try {
      const res = await fetchClientMyNotes(token);
      setNotes(res.notes || []);
    } catch (err) {
      setError("Failed to load notes");
    }
    setLoading(false);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  if (error) return <div className="text-center py-12"><p className="text-red-600 mb-4">{error}</p><button onClick={load} className="px-4 py-2 bg-brand-600 text-white rounded-lg">Try again</button></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold text-warm-900">My Notes</h1><p className="text-warm-600 text-sm mt-1">Session notes and homework shared by your therapist</p></div>
      {notes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center"><p className="text-warm-600">No notes shared yet</p></div>
      ) : (
        <div className="space-y-4">{notes.map((note) => {
          const sessionTitle = note.booking?.session?.title || "Session";
          const sessionDate = note.booking?.session?.startTime ? formatDate(note.booking.session.startTime) : formatDate(note.createdAt);
          return (<div key={note.id} className="bg-white rounded-xl shadow-sm border border-warm-100 overflow-hidden"><div className="px-4 py-3 bg-warm-50 border-b"><h2 className="font-semibold text-warm-900">{sessionTitle}</h2><p className="text-xs text-warm-500">{sessionDate}</p></div><div className="p-4 space-y-3 text-sm">{note.sessionSummary && <div><h3 className="text-xs font-semibold text-warm-600 uppercase mb-1">Summary</h3><p className="text-warm-800 whitespace-pre-wrap">{note.sessionSummary}</p></div>}{note.actionItems && <div><h3 className="text-xs font-semibold text-warm-600 uppercase mb-1">Action items / Homework</h3><p className="text-warm-800 whitespace-pre-wrap">{note.actionItems}</p></div>}{note.keyThemes && note.keyThemes.length > 0 && <div className="flex flex-wrap gap-1.5">{note.keyThemes.map((t, i) => <span key={i} className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded text-xs">{t}</span>)}</div>}</div></div>);
        })}</div>
      )}
    </div>
  );
}
