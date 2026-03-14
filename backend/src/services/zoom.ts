import { PrismaClient } from "@prisma/client";
import { encrypt, decrypt } from "./encryption.js";

const prisma = new PrismaClient();

const ZOOM_API_BASE = "https://api.zoom.us/v2";
const ZOOM_OAUTH_URL = "https://zoom.us/oauth/token";

interface ZoomTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface ZoomMeetingResponse {
  id: number;
  join_url: string;
  start_url: string;
  password: string;
  topic: string;
  start_time: string;
  duration: number;
}

interface ZoomRecordingFile {
  id: string;
  recording_type: string;
  file_type: string;
  file_size: number;
  download_url: string;
  status: string;
}

interface ZoomRecordingsResponse {
  recording_files: ZoomRecordingFile[];
}

export class ZoomService {
  private configId?: string;

  constructor(configId?: string) {
    this.configId = configId;
  }

  async getConfig() {
    if (this.configId) {
      return prisma.zoomConfig.findUnique({ where: { id: this.configId } });
    }
    return prisma.zoomConfig.findFirst({ where: { isDefault: true } });
  }

  async getAccessToken(): Promise<string> {
    const config = await this.getConfig();
    if (!config) {
      throw new Error("Zoom not configured");
    }

    if (config.accessToken && config.tokenExpiry && config.tokenExpiry > new Date()) {
      return decrypt(config.accessToken);
    }

    const credentials = Buffer.from(
      `${config.clientId}:${decrypt(config.clientSecret)}`
    ).toString("base64");

    const response = await fetch(ZOOM_OAUTH_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "account_credentials",
        account_id: config.accountId,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Zoom OAuth failed: ${error}`);
    }

    const data: ZoomTokenResponse = await response.json();
    const expiresAt = new Date(Date.now() + (data.expires_in - 60) * 1000);

    await prisma.zoomConfig.update({
      where: { id: config.id },
      data: {
        accessToken: encrypt(data.access_token),
        tokenExpiry: expiresAt,
      },
    });

    return data.access_token;
  }

  async createMeeting(
    topic: string,
    startTime: Date,
    duration: number = 60,
    hostEmail?: string
  ): Promise<ZoomMeetingResponse> {
    const token = await this.getAccessToken();
    const config = await this.getConfig();
    
    const userId = hostEmail || "me";
    
    const response = await fetch(`${ZOOM_API_BASE}/users/${userId}/meetings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic,
        type: 2,
        start_time: startTime.toISOString(),
        duration,
        timezone: "Asia/Kolkata",
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true,
          auto_recording: "cloud",
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create Zoom meeting: ${error}`);
    }

    return response.json();
  }

  async getMeeting(meetingId: string): Promise<any> {
    const token = await this.getAccessToken();

    const response = await fetch(`${ZOOM_API_BASE}/meetings/${meetingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get Zoom meeting: ${error}`);
    }

    return response.json();
  }

  async deleteMeeting(meetingId: string): Promise<void> {
    const token = await this.getAccessToken();

    const response = await fetch(`${ZOOM_API_BASE}/meetings/${meetingId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok && response.status !== 404) {
      const error = await response.text();
      throw new Error(`Failed to delete Zoom meeting: ${error}`);
    }
  }

  async getRecordings(meetingId: string): Promise<ZoomRecordingsResponse> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `${ZOOM_API_BASE}/meetings/${meetingId}/recordings`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { recording_files: [] };
      }
      const error = await response.text();
      throw new Error(`Failed to get recordings: ${error}`);
    }

    return response.json();
  }

  async downloadRecording(downloadUrl: string): Promise<Buffer> {
    const token = await this.getAccessToken();

    const response = await fetch(`${downloadUrl}?access_token=${token}`);

    if (!response.ok) {
      throw new Error(`Failed to download recording: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  parseVttTranscript(vttContent: string): string {
    const lines = vttContent.split("\n");
    const textLines: string[] = [];
    let isText = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === "" || trimmed === "WEBVTT" || trimmed.includes("-->")) {
        isText = trimmed.includes("-->");
        continue;
      }
      if (isText && trimmed && !trimmed.match(/^\d+$/)) {
        textLines.push(trimmed);
      }
    }

    return textLines.join(" ").replace(/\s+/g, " ").trim();
  }
}

export async function saveZoomConfig(
  accountId: string,
  clientId: string,
  clientSecret: string,
  therapistId?: string,
  isDefault: boolean = true
) {
  const encryptedSecret = encrypt(clientSecret);

  const existing = therapistId
    ? await prisma.zoomConfig.findUnique({ where: { therapistId } })
    : await prisma.zoomConfig.findFirst({ where: { isDefault: true } });

  if (existing) {
    return prisma.zoomConfig.update({
      where: { id: existing.id },
      data: {
        accountId,
        clientId,
        clientSecret: encryptedSecret,
        accessToken: null,
        tokenExpiry: null,
      },
    });
  }

  return prisma.zoomConfig.create({
    data: {
      accountId,
      clientId,
      clientSecret: encryptedSecret,
      therapistId,
      isDefault,
    },
  });
}

export async function getZoomConfigStatus() {
  const config = await prisma.zoomConfig.findFirst({
    where: { isDefault: true },
    select: {
      id: true,
      accountId: true,
      clientId: true,
      isDefault: true,
      tokenExpiry: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    configured: !!config,
    config: config
      ? {
          id: config.id,
          accountId: config.accountId,
          clientId: config.clientId,
          hasValidToken: config.tokenExpiry ? config.tokenExpiry > new Date() : false,
          updatedAt: config.updatedAt,
        }
      : null,
  };
}

export async function testZoomConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const service = new ZoomService();
    await service.getAccessToken();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createZoomMeetingForBooking(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      session: true,
      user: true,
      zoomMeeting: true,
    },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.zoomMeeting) {
    return booking.zoomMeeting;
  }

  const service = new ZoomService();
  const meeting = await service.createMeeting(
    `${booking.session.title} - ${booking.user.name || booking.user.email}`,
    booking.session.startTime,
    60
  );

  const zoomMeeting = await prisma.zoomMeeting.create({
    data: {
      zoomMeetingId: String(meeting.id),
      bookingId: booking.id,
      joinUrl: meeting.join_url,
      startUrl: meeting.start_url,
      password: meeting.password,
      status: "scheduled",
    },
  });

  return zoomMeeting;
}

export async function syncZoomRecordings(zoomMeetingId: string) {
  const meeting = await prisma.zoomMeeting.findUnique({
    where: { zoomMeetingId },
  });

  if (!meeting) {
    throw new Error("Zoom meeting not found in database");
  }

  const service = new ZoomService();
  const recordingsData = await service.getRecordings(zoomMeetingId);

  const results = [];

  for (const file of recordingsData.recording_files) {
    const existing = await prisma.zoomRecording.findUnique({
      where: { recordingId: file.id },
    });

    if (existing) {
      results.push(existing);
      continue;
    }

    let transcriptText: string | null = null;

    if (file.file_type === "TRANSCRIPT" && file.download_url) {
      try {
        const content = await service.downloadRecording(file.download_url);
        transcriptText = service.parseVttTranscript(content.toString("utf-8"));
      } catch (err) {
        console.error("Failed to download transcript:", err);
      }
    }

    const recording = await prisma.zoomRecording.create({
      data: {
        zoomMeetingId: meeting.id,
        recordingId: file.id,
        recordingType: file.recording_type,
        fileType: file.file_type,
        fileSize: file.file_size,
        downloadUrl: file.download_url,
        transcriptText,
        status: file.status === "completed" ? "completed" : "processing",
      },
    });

    results.push(recording);
  }

  return results;
}
