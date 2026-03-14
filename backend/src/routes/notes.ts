import { Router } from "express";
import { PrismaClient, NoteVisibility } from "@prisma/client";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { encryptField, decryptField } from "../services/encryption.js";

const router = Router();
const prisma = new PrismaClient();

async function logAuditAction(
  userId: string,
  action: string,
  targetUserId?: string | null,
  metadata?: Record<string, any>
) {
  try {
    await prisma.adminAuditLog.create({
      data: { adminUserId: userId, targetUserId: targetUserId || null, action, metadata: metadata || undefined },
    });
  } catch (err) {
    console.error("Audit log error:", err);
  }
}

function decryptNote(note: any) {
  if (!note) return note;
  return {
    ...note,
    sessionSummary: decryptField(note.sessionSummary),
    observations: decryptField(note.observations),
    internalNotes: decryptField(note.internalNotes),
    interventions: decryptField(note.interventions),
    actionItems: decryptField(note.actionItems),
    nextSessionFocus: decryptField(note.nextSessionFocus),
  };
}

function stripPrivateFields(note: any) {
  if (!note) return note;
  const { internalNotes, observations, ...shared } = note;
  return shared;
}

router.post(
  "/notes",
  authMiddleware(),
  requireRole("THERAPIST"),
  async (req, res) => {
    const user = (req as any).user;
    const {
      bookingId, sessionSummary, keyThemes, emotionalState,
      moodRating, observations, interventions, actionItems,
      nextSessionFocus, internalNotes, visibility, tags,
    } = req.body || {};

    if (!bookingId) {
      return res.status(400).json({ error: "booking_id_required" });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { session: true, therapyNote: true },
    });

    if (!booking) {
      return res.status(404).json({ error: "booking_not_found" });
    }
    if (booking.therapyNote) {
      return res.status(409).json({ error: "note_already_exists" });
    }

    const note = await prisma.therapyNote.create({
      data: {
        bookingId,
        therapistId: user.id,
        clientId: booking.userId,
        sessionSummary: encryptField(sessionSummary),
        keyThemes: keyThemes || [],
        emotionalState: emotionalState || null,
        moodRating: moodRating ? Number(moodRating) : null,
        observations: encryptField(observations),
        interventions: encryptField(interventions),
        actionItems: encryptField(actionItems),
        nextSessionFocus: encryptField(nextSessionFocus),
        internalNotes: encryptField(internalNotes),
        visibility: visibility || "PRIVATE",
        sharedAt: visibility === "SHARED" || visibility === "HOMEWORK" ? new Date() : null,
      },
    });

    if (tags && Array.isArray(tags) && tags.length > 0) {
      await prisma.noteTag.createMany({
        data: tags.map((t: { tag: string; category: string }) => ({
          noteId: note.id,
          tag: t.tag,
          category: t.category || "theme",
        })),
      });
    }

    await logAuditAction(user.id, "NOTE_CREATED", booking.userId, { noteId: note.id, bookingId });

    const full = await prisma.therapyNote.findUnique({
      where: { id: note.id },
      include: { tags: true, attachments: true },
    });

    return res.json({ note: decryptNote(full) });
  }
);

router.get(
  "/notes/:id",
  authMiddleware(),
  async (req, res) => {
    const user = (req as any).user;
    const { id } = req.params;

    const note = await prisma.therapyNote.findUnique({
      where: { id },
      include: { tags: true, attachments: true, booking: { include: { session: true } } },
    });

    if (!note) {
      return res.status(404).json({ error: "note_not_found" });
    }

    const isTherapist = note.therapistId === user.id;
    const isClient = note.clientId === user.id;

    if (!isTherapist && !isClient) {
      return res.status(403).json({ error: "forbidden" });
    }

    if (isClient && note.visibility === "PRIVATE") {
      return res.status(403).json({ error: "note_not_shared" });
    }

    if (isClient) {
      await logAuditAction(user.id, "NOTE_VIEWED_BY_CLIENT", note.therapistId, { noteId: note.id });
      return res.json({ note: stripPrivateFields(decryptNote(note)) });
    }

    return res.json({ note: decryptNote(note) });
  }
);

router.put(
  "/notes/:id",
  authMiddleware(),
  requireRole("THERAPIST"),
  async (req, res) => {
    const user = (req as any).user;
    const { id } = req.params;
    const {
      sessionSummary, keyThemes, emotionalState, moodRating,
      observations, interventions, actionItems, nextSessionFocus,
      internalNotes, tags,
    } = req.body || {};

    const existing = await prisma.therapyNote.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "note_not_found" });
    }
    if (existing.therapistId !== user.id) {
      return res.status(403).json({ error: "forbidden" });
    }

    const data: any = {};
    if (sessionSummary !== undefined) data.sessionSummary = encryptField(sessionSummary);
    if (keyThemes !== undefined) data.keyThemes = keyThemes;
    if (emotionalState !== undefined) data.emotionalState = emotionalState;
    if (moodRating !== undefined) data.moodRating = moodRating ? Number(moodRating) : null;
    if (observations !== undefined) data.observations = encryptField(observations);
    if (interventions !== undefined) data.interventions = encryptField(interventions);
    if (actionItems !== undefined) data.actionItems = encryptField(actionItems);
    if (nextSessionFocus !== undefined) data.nextSessionFocus = encryptField(nextSessionFocus);
    if (internalNotes !== undefined) data.internalNotes = encryptField(internalNotes);

    const updated = await prisma.therapyNote.update({
      where: { id },
      data,
      include: { tags: true, attachments: true },
    });

    if (tags !== undefined && Array.isArray(tags)) {
      await prisma.noteTag.deleteMany({ where: { noteId: id } });
      if (tags.length > 0) {
        await prisma.noteTag.createMany({
          data: tags.map((t: { tag: string; category: string }) => ({
            noteId: id,
            tag: t.tag,
            category: t.category || "theme",
          })),
        });
      }
    }

    await logAuditAction(user.id, "NOTE_UPDATED", existing.clientId, { noteId: id });

    const full = await prisma.therapyNote.findUnique({
      where: { id },
      include: { tags: true, attachments: true },
    });
    return res.json({ note: decryptNote(full) });
  }
);

router.patch(
  "/notes/:id/visibility",
  authMiddleware(),
  requireRole("THERAPIST"),
  async (req, res) => {
    const user = (req as any).user;
    const { id } = req.params;
    const { visibility } = req.body || {};

    if (!["PRIVATE", "SHARED", "HOMEWORK"].includes(visibility)) {
      return res.status(400).json({ error: "invalid_visibility" });
    }

    const existing = await prisma.therapyNote.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "note_not_found" });
    }
    if (existing.therapistId !== user.id) {
      return res.status(403).json({ error: "forbidden" });
    }

    const isNowShared = visibility !== "PRIVATE";
    const wasPrivate = existing.visibility === "PRIVATE";

    const updated = await prisma.therapyNote.update({
      where: { id },
      data: {
        visibility: visibility as NoteVisibility,
        sharedAt: isNowShared && wasPrivate ? new Date() : existing.sharedAt,
      },
      include: { tags: true },
    });

    const action = isNowShared ? "NOTE_SHARED" : "NOTE_UPDATED";
    await logAuditAction(user.id, action, existing.clientId, { noteId: id, visibility });

    return res.json({ note: decryptNote(updated) });
  }
);

router.get(
  "/bookings/:bookingId/notes",
  authMiddleware(),
  async (req, res) => {
    const user = (req as any).user;
    const { bookingId } = req.params;

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return res.status(404).json({ error: "booking_not_found" });
    }

    const note = await prisma.therapyNote.findUnique({
      where: { bookingId },
      include: { tags: true, attachments: true },
    });

    if (!note) {
      return res.json({ note: null });
    }

    const isTherapist = note.therapistId === user.id;
    const isClient = note.clientId === user.id;

    if (!isTherapist && !isClient) {
      return res.status(403).json({ error: "forbidden" });
    }

    if (isClient && note.visibility === "PRIVATE") {
      return res.json({ note: null });
    }

    if (isClient) {
      return res.json({ note: stripPrivateFields(decryptNote(note)) });
    }

    return res.json({ note: decryptNote(note) });
  }
);

export default router;
