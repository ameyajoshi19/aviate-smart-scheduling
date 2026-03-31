import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Task } from "../context/AppContext";
import { useColors } from "../hooks/useColors";

interface ScheduledEntry {
  task: Task;
  start: Date;
  end: Date;
}

interface CalendarViewProps {
  scheduledEntries: ScheduledEntry[];
  onReschedule: (task: Task) => void;
}

const LABEL_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f97316",
  "#14b8a6", "#10b981", "#3b82f6", "#f59e0b",
];

function getPriorityColor(p: string) {
  if (p === "high") return "#ef4444";
  if (p === "medium") return "#f59e0b";
  return "#22c55e";
}

function getWeekDays(baseDate: Date): Date[] {
  const days: Date[] = [];
  const start = new Date(baseDate);
  const dayOfWeek = start.getDay();
  start.setDate(start.getDate() - dayOfWeek);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView({ scheduledEntries, onReschedule }: CalendarViewProps) {
  const colors = useColors();
  const [weekOffset, setWeekOffset] = useState(0);

  const baseDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekDays = useMemo(() => getWeekDays(baseDate), [baseDate]);

  const today = new Date();

  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];
  const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  const entriesThisWeek = useMemo(() => {
    return scheduledEntries.filter((e) =>
      weekDays.some((d) => isSameDay(e.start, d))
    );
  }, [scheduledEntries, weekDays]);

  return (
    <View style={styles.container}>
      {/* Week navigation */}
      <View style={[styles.weekNav, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable
          style={[styles.navBtn, { backgroundColor: colors.muted }]}
          onPress={() => setWeekOffset((o) => o - 1)}
        >
          <Feather name="chevron-left" size={18} color={colors.foreground} />
        </Pressable>
        <View style={styles.weekLabelContainer}>
          <Text style={[styles.weekLabel, { color: colors.foreground }]}>{weekLabel}</Text>
          {weekOffset !== 0 && (
            <Pressable onPress={() => setWeekOffset(0)}>
              <Text style={[styles.todayLink, { color: colors.primary }]}>Today</Text>
            </Pressable>
          )}
        </View>
        <Pressable
          style={[styles.navBtn, { backgroundColor: colors.muted }]}
          onPress={() => setWeekOffset((o) => o + 1)}
        >
          <Feather name="chevron-right" size={18} color={colors.foreground} />
        </Pressable>
      </View>

      {/* Day columns header */}
      <View style={[styles.dayHeader, { borderColor: colors.border }]}>
        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, today);
          return (
            <View key={i} style={styles.dayCol}>
              <Text style={[styles.dayName, { color: isToday ? colors.primary : colors.mutedForeground }]}>
                {DAY_LABELS[i]}
              </Text>
              <View style={[
                styles.dayNum,
                isToday && { backgroundColor: colors.primary },
              ]}>
                <Text style={[
                  styles.dayNumText,
                  { color: isToday ? colors.primaryForeground : colors.foreground },
                ]}>
                  {day.getDate()}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Task grid */}
      {entriesThisWeek.length === 0 ? (
        <View style={styles.emptyWeek}>
          <Feather name="calendar" size={28} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No tasks scheduled this week
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.taskGrid}>
          <View style={styles.dayRow}>
            {weekDays.map((day, di) => {
              const dayEntries = entriesThisWeek.filter((e) => isSameDay(e.start, day));
              return (
                <View key={di} style={styles.dayTaskCol}>
                  {dayEntries.map((entry, ei) => {
                    const color = getPriorityColor(entry.task.priority);
                    return (
                      <Pressable
                        key={entry.task.id}
                        style={[styles.taskBlock, { backgroundColor: color + "18", borderColor: color + "60", borderLeftColor: color }]}
                        onPress={() => onReschedule(entry.task)}
                      >
                        <Text style={[styles.taskBlockTitle, { color: colors.foreground }]} numberOfLines={2}>
                          {entry.task.title}
                        </Text>
                        <Text style={[styles.taskBlockTime, { color: colors.mutedForeground }]}>
                          {formatTime(entry.start)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Upcoming tasks list below calendar */}
      {entriesThisWeek.length > 0 && (
        <View style={styles.listSection}>
          <Text style={[styles.listTitle, { color: colors.mutedForeground }]}>THIS WEEK</Text>
          {entriesThisWeek
            .sort((a, b) => a.start.getTime() - b.start.getTime())
            .map((entry) => {
              const color = getPriorityColor(entry.task.priority);
              return (
                <Pressable
                  key={entry.task.id}
                  style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => onReschedule(entry.task)}
                >
                  <View style={[styles.listBar, { backgroundColor: color }]} />
                  <View style={styles.listContent}>
                    <Text style={[styles.listItemTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {entry.task.title}
                    </Text>
                    <Text style={[styles.listItemTime, { color: colors.mutedForeground }]}>
                      {entry.start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      {" · "}{formatTime(entry.start)} – {formatTime(entry.end)}
                    </Text>
                  </View>
                  <View style={styles.rescheduleHint}>
                    <Feather name="clock" size={13} color={colors.primary} />
                  </View>
                </Pressable>
              );
            })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  weekNav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderRadius: 14, borderWidth: 1, padding: 10,
  },
  navBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  weekLabelContainer: { alignItems: "center", gap: 2 },
  weekLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  todayLink: { fontSize: 12, fontFamily: "Inter_500Medium" },
  dayHeader: {
    flexDirection: "row", borderBottomWidth: 1, paddingBottom: 8,
  },
  dayCol: { flex: 1, alignItems: "center", gap: 4 },
  dayName: { fontSize: 11, fontFamily: "Inter_500Medium" },
  dayNum: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  dayNumText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  emptyWeek: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  taskGrid: { maxHeight: 200 },
  dayRow: { flexDirection: "row", gap: 4 },
  dayTaskCol: { flex: 1, gap: 4 },
  taskBlock: {
    borderRadius: 8, borderWidth: 1, borderLeftWidth: 3,
    padding: 6, gap: 2,
  },
  taskBlockTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", lineHeight: 14 },
  taskBlockTime: { fontSize: 10, fontFamily: "Inter_400Regular" },
  listSection: { gap: 8 },
  listTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.6 },
  listItem: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 12, borderWidth: 1, overflow: "hidden",
  },
  listBar: { width: 4, alignSelf: "stretch" },
  listContent: { flex: 1, padding: 12, gap: 2 },
  listItemTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  listItemTime: { fontSize: 12, fontFamily: "Inter_400Regular" },
  rescheduleHint: { paddingRight: 14 },
});
