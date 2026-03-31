import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  isAllDay?: boolean;
}

interface CalendarContextValue {
  isConnected: boolean;
  events: CalendarEvent[];
  isLoading: boolean;
  connect: () => void;
  disconnect: () => Promise<void>;
  refreshEvents: (startDate: Date, endDate: Date) => Promise<void>;
  createEvent: (event: {
    title: string;
    start: string;
    end: string;
    description?: string;
  }) => Promise<string | null>;
  deleteEvent: (eventId: string) => Promise<void>;
}

const CalendarContext = createContext<CalendarContextValue | null>(null);

const CONNECTED_KEY = "@calendar_connected";
const EVENTS_KEY = "@calendar_events";
const TOKEN_KEY = "@calendar_token";

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const connected = await AsyncStorage.getItem(CONNECTED_KEY);
      if (connected === "true") {
        setIsConnected(true);
        const stored = await AsyncStorage.getItem(EVENTS_KEY);
        if (stored) setEvents(JSON.parse(stored));
      }
    })();
  }, []);

  const connect = useCallback(() => {
    setIsConnected(true);
    AsyncStorage.setItem(CONNECTED_KEY, "true");
  }, []);

  const disconnect = useCallback(async () => {
    setIsConnected(false);
    setEvents([]);
    await AsyncStorage.multiRemove([CONNECTED_KEY, EVENTS_KEY, TOKEN_KEY]);
  }, []);

  const getToken = async (): Promise<string | null> => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return token;
  };

  const refreshEvents = useCallback(async (startDate: Date, endDate: Date) => {
    const token = await getToken();
    if (!token) {
      setEvents([]);
      return;
    }
    setIsLoading(true);
    try {
      const resp = await fetch(
        `/api/calendar/events?timeMin=${startDate.toISOString()}&timeMax=${endDate.toISOString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (resp.ok) {
        const data = await resp.json();
        const mapped: CalendarEvent[] = (data.items || []).map((item: any) => ({
          id: item.id,
          title: item.summary || "(No title)",
          start: item.start?.dateTime || item.start?.date || "",
          end: item.end?.dateTime || item.end?.date || "",
          isAllDay: !item.start?.dateTime,
        }));
        setEvents(mapped);
        await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(mapped));
      }
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createEvent = useCallback(async (event: {
    title: string;
    start: string;
    end: string;
    description?: string;
  }): Promise<string | null> => {
    const token = await getToken();
    if (!token) return null;
    try {
      const resp = await fetch("/api/calendar/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.id || null;
      }
    } catch (e) {}
    return null;
  }, []);

  const deleteEvent = useCallback(async (eventId: string) => {
    const token = await getToken();
    if (!token) return;
    try {
      await fetch(`/api/calendar/events/${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {}
  }, []);

  return (
    <CalendarContext.Provider
      value={{ isConnected, events, isLoading, connect, disconnect, refreshEvents, createEvent, deleteEvent }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error("useCalendar must be used within CalendarProvider");
  return ctx;
}
