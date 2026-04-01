import { CalendarEvent } from "../context/CalendarContext";
import { Task, WeekAvailability, DayKey } from "../context/AppContext";

const DAY_KEYS: DayKey[] = [
  "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"
];

const MIN_SLOT_MS = 15 * 60 * 1000;

export interface ScheduledTask {
  task: Task;
  start: Date;
  end: Date;
  splitPartIndex?: number;
  splitTotalParts?: number;
}

function isTimeOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

function getBusyIntervals(
  calendarEvents: CalendarEvent[],
  day: Date
): Array<{ start: Date; end: Date }> {
  const intervals: Array<{ start: Date; end: Date }> = [];
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);

  for (const event of calendarEvents) {
    if (!event.start || !event.end || event.isAllDay) continue;
    const s = new Date(event.start);
    const e = new Date(event.end);
    if (isTimeOverlap(s, e, dayStart, dayEnd)) {
      intervals.push({ start: s, end: e });
    }
  }
  return intervals;
}

function getAvailableSlots(
  day: Date,
  availability: WeekAvailability,
  calendarBusy: Array<{ start: Date; end: Date }>,
  alreadyScheduled: Array<{ start: Date; end: Date }>
): Array<{ start: Date; end: Date }> {
  const dayKey = DAY_KEYS[day.getDay()];
  const dayAvailability = availability[dayKey];
  if (!dayAvailability.enabled) return [];

  const result: Array<{ start: Date; end: Date }> = [];

  for (const slot of dayAvailability.slots) {
    const slotStart = new Date(day);
    slotStart.setHours(slot.startHour, 0, 0, 0);
    const slotEnd = new Date(day);
    slotEnd.setHours(slot.endHour, 0, 0, 0);

    let freeIntervals: Array<{ start: Date; end: Date }> = [
      { start: slotStart, end: slotEnd },
    ];

    const blocked = [...calendarBusy, ...alreadyScheduled];

    for (const busy of blocked) {
      const newFree: Array<{ start: Date; end: Date }> = [];
      for (const free of freeIntervals) {
        if (!isTimeOverlap(busy.start, busy.end, free.start, free.end)) {
          newFree.push(free);
        } else {
          if (busy.start > free.start) {
            newFree.push({ start: free.start, end: busy.start });
          }
          if (busy.end < free.end) {
            newFree.push({ start: busy.end, end: free.end });
          }
        }
      }
      freeIntervals = newFree;
    }

    for (const interval of freeIntervals) {
      const durationMs = interval.end.getTime() - interval.start.getTime();
      if (durationMs >= MIN_SLOT_MS) {
        result.push(interval);
      }
    }
  }

  return result;
}

function priorityScore(priority: string): number {
  switch (priority) {
    case "high": return 3;
    case "medium": return 2;
    case "low": return 1;
    default: return 1;
  }
}

function urgencyScore(deadline: string): number {
  const now = Date.now();
  const dl = new Date(deadline).getTime();
  const hoursLeft = (dl - now) / (1000 * 60 * 60);

  if (hoursLeft < 0) return 10;
  if (hoursLeft < 24) return 9;
  if (hoursLeft < 48) return 7;
  if (hoursLeft < 72) return 5;
  if (hoursLeft < 168) return 3;
  return 1;
}

function dayMatchesPreference(day: Date, preferredDays?: string): boolean {
  if (!preferredDays || preferredDays === "any") return true;
  const dow = day.getDay();
  if (preferredDays === "weekdays") return dow >= 1 && dow <= 5;
  if (preferredDays === "weekends") return dow === 0 || dow === 6;
  return true;
}

export function findNewSlotForTask(
  task: Task,
  allTasks: Task[],
  availability: WeekAvailability,
  calendarEvents: CalendarEvent[]
): { start: Date; end: Date } | null {
  const now = new Date();
  const estimatedMs = task.estimatedHours * 60 * 60 * 1000;
  const deadline = new Date(task.deadline);

  const otherIntervals: Array<{ start: Date; end: Date }> = allTasks
    .filter((t) => t.id !== task.id && !t.isCompleted && t.scheduledStart && t.scheduledEnd)
    .map((t) => ({ start: new Date(t.scheduledStart!), end: new Date(t.scheduledEnd!) }));

  const currentStart = task.scheduledStart ? new Date(task.scheduledStart) : null;
  const currentEnd = task.scheduledEnd ? new Date(task.scheduledEnd) : null;

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const day = new Date(today);
    day.setDate(today.getDate() + dayOffset);
    if (day > deadline) break;
    if (!dayMatchesPreference(day, task.preferredDays)) continue;

    const calBusy = getBusyIntervals(calendarEvents, day);
    const blocked = [...otherIntervals, ...calBusy];
    if (currentStart && currentEnd) {
      blocked.push({ start: currentStart, end: currentEnd });
    }

    const freeSlots = getAvailableSlots(day, availability, calBusy, [
      ...otherIntervals,
      ...(currentStart && currentEnd ? [{ start: currentStart, end: currentEnd }] : []),
    ]);

    for (const slot of freeSlots) {
      const slotMs = slot.end.getTime() - slot.start.getTime();
      if (slotMs >= estimatedMs) {
        const start = new Date(Math.max(slot.start.getTime(), now.getTime()));
        const end = new Date(start.getTime() + estimatedMs);
        if (end <= slot.end) {
          if (currentStart && Math.abs(start.getTime() - currentStart.getTime()) < 60 * 1000) {
            continue;
          }
          return { start, end };
        }
      }
    }
  }

  return null;
}

export function scheduleTasks(
  tasks: Task[],
  availability: WeekAvailability,
  calendarEvents: CalendarEvent[]
): ScheduledTask[] {
  const now = new Date();
  const pending = tasks
    .filter((t) => !t.isCompleted)
    .map((t) => ({
      task: t,
      score: priorityScore(t.priority) * 2 + urgencyScore(t.deadline),
    }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.task);

  const scheduled: ScheduledTask[] = [];
  const scheduledIntervals: Array<{ start: Date; end: Date }> = [];

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  for (const task of pending) {
    const estimatedMs = task.estimatedHours * 60 * 60 * 1000;
    const deadline = new Date(task.deadline);
    let placed = false;

    for (let dayOffset = 0; dayOffset < 30 && !placed; dayOffset++) {
      const day = new Date(today);
      day.setDate(today.getDate() + dayOffset);
      if (day > deadline) break;
      if (!dayMatchesPreference(day, task.preferredDays)) continue;

      const calBusy = getBusyIntervals(calendarEvents, day);
      const freeSlots = getAvailableSlots(day, availability, calBusy, scheduledIntervals);

      for (const slot of freeSlots) {
        const slotMs = slot.end.getTime() - slot.start.getTime();
        if (slotMs >= estimatedMs) {
          const start = new Date(Math.max(slot.start.getTime(), now.getTime()));
          const end = new Date(start.getTime() + estimatedMs);
          if (end <= slot.end) {
            scheduled.push({ task, start, end });
            scheduledIntervals.push({ start, end });
            placed = true;
            break;
          }
        }
      }
    }

    if (!placed && task.canBeSplit) {
      const splitParts: ScheduledTask[] = [];
      let remainingMs = estimatedMs;

      for (let dayOffset = 0; dayOffset < 30 && remainingMs > 0; dayOffset++) {
        const day = new Date(today);
        day.setDate(today.getDate() + dayOffset);
        if (day > deadline) break;
        if (!dayMatchesPreference(day, task.preferredDays)) continue;

        const calBusy = getBusyIntervals(calendarEvents, day);
        const freeSlots = getAvailableSlots(day, availability, calBusy, scheduledIntervals);

        for (const slot of freeSlots) {
          if (remainingMs <= 0) break;
          const slotStart = new Date(Math.max(slot.start.getTime(), now.getTime()));
          const slotAvailableMs = slot.end.getTime() - slotStart.getTime();
          if (slotAvailableMs < MIN_SLOT_MS) continue;

          const takeMs = Math.min(remainingMs, slotAvailableMs);
          const partStart = slotStart;
          const partEnd = new Date(partStart.getTime() + takeMs);

          splitParts.push({ task, start: partStart, end: partEnd });
          scheduledIntervals.push({ start: partStart, end: partEnd });
          remainingMs -= takeMs;
        }
      }

      if (remainingMs === 0 && splitParts.length > 1) {
        const total = splitParts.length;
        splitParts.forEach((part, idx) => {
          part.splitPartIndex = idx + 1;
          part.splitTotalParts = total;
          scheduled.push(part);
        });
      } else if (remainingMs === 0 && splitParts.length === 1) {
        scheduled.push(splitParts[0]);
      }
    }
  }

  return scheduled;
}
