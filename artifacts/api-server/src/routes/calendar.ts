import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const GOOGLE_CALENDAR_BASE = "https://www.googleapis.com/calendar/v3";

function getToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

router.get("/calendar/events", async (req: Request, res: Response) => {
  const token = getToken(req);
  if (!token) {
    res.status(401).json({ error: "Missing auth token" });
    return;
  }
  const { timeMin, timeMax } = req.query;
  const params = new URLSearchParams({
    calendarId: "primary",
    singleEvents: "true",
    orderBy: "startTime",
    ...(timeMin ? { timeMin: timeMin as string } : {}),
    ...(timeMax ? { timeMax: timeMax as string } : {}),
  });
  try {
    const resp = await fetch(
      `${GOOGLE_CALENDAR_BASE}/calendars/primary/events?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (e) {
    req.log.error(e, "Calendar events error");
    res.status(500).json({ error: "Failed to fetch calendar events" });
  }
});

router.post("/calendar/events", async (req: Request, res: Response) => {
  const token = getToken(req);
  if (!token) {
    res.status(401).json({ error: "Missing auth token" });
    return;
  }
  const { title, start, end, description } = req.body;
  const event = {
    summary: title,
    description: description || "",
    start: { dateTime: start, timeZone: "UTC" },
    end: { dateTime: end, timeZone: "UTC" },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 30 },
        { method: "email", minutes: 60 },
      ],
    },
  };
  try {
    const resp = await fetch(
      `${GOOGLE_CALENDAR_BASE}/calendars/primary/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (e) {
    req.log.error(e, "Calendar create event error");
    res.status(500).json({ error: "Failed to create calendar event" });
  }
});

router.delete("/calendar/events/:eventId", async (req: Request, res: Response) => {
  const token = getToken(req);
  if (!token) {
    res.status(401).json({ error: "Missing auth token" });
    return;
  }
  const { eventId } = req.params;
  try {
    const resp = await fetch(
      `${GOOGLE_CALENDAR_BASE}/calendars/primary/events/${eventId}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
    );
    res.status(resp.status).json({ success: resp.ok });
  } catch (e) {
    req.log.error(e, "Calendar delete event error");
    res.status(500).json({ error: "Failed to delete calendar event" });
  }
});

export default router;
