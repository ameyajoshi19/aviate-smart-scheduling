import { ChevronLeft, ChevronRight, Calendar, Clock, CircleCheckBig } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Task } from "../context/AppContext";
import { ScheduledTask } from "../utils/scheduler";
import { useColors } from "../hooks/useColors";

interface CalendarViewProps {
  scheduledEntries: ScheduledTask[];
  completedEntries?: ScheduledTask[];
  onReschedule: (task: Task) => void;
}

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

function getSplitLabel(entry: ScheduledTask): string | null {
  if (entry.splitTotalParts && entry.splitTotalParts > 1 && entry.splitPartIndex) {
    return `Part ${entry.splitPartIndex}/${entry.splitTotalParts}`;
  }
  return null;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView({ scheduledEntries, completedEntries = [], onReschedule }: CalendarViewProps) {
  const colors = useColors();
  const [weekOffset, setWeekOffset] = useState(0);
  const today = useMemo(() => new Date(), []);

  const baseDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekDays = useMemo(() => getWeekDays(baseDate), [baseDate]);

  const allEntries = useMemo(() => [...scheduledEntries, ...completedEntries], [scheduledEntries, completedEntries]);

  const entriesThisWeek = useMemo(() => {
    return scheduledEntries.filter((e) =>
      weekDays.some((d) => isSameDay(e.start, d))
    );
  }, [scheduledEntries, weekDays]);

  const completedThisWeek = useMemo(() => {
    return completedEntries.filter((e) =>
      weekDays.some((d) => isSameDay(e.start, d))
    );
  }, [completedEntries, weekDays]);

  const allThisWeek = useMemo(() => [...entriesThisWeek, ...completedThisWeek], [entriesThisWeek, completedThisWeek]);

  const defaultSelectedDay = useMemo(() => {
    const todayInWeek = weekDays.find((d) => isSameDay(d, today));
    if (todayInWeek) return todayInWeek;
    const firstWithTask = weekDays.find((d) =>
      allThisWeek.some((e) => isSameDay(e.start, d))
    );
    return firstWithTask ?? weekDays[0];
  }, [weekDays, today, allThisWeek]);

  const [selectedDay, setSelectedDay] = useState<Date>(defaultSelectedDay);

  useEffect(() => {
    setSelectedDay(defaultSelectedDay);
  }, [weekOffset]);

  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];
  const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  const selectedDayLabel = selectedDay.toLocaleDateString("en-US", {
    weekday: "long", month: "short", day: "numeric",
  }).toUpperCase();

  const selectedDayEntries = useMemo(() => {
    return entriesThisWeek
      .filter((e) => isSameDay(e.start, selectedDay))
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [entriesThisWeek, selectedDay]);

  const selectedDayCompleted = useMemo(() => {
    return completedThisWeek
      .filter((e) => isSameDay(e.start, selectedDay))
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [completedThisWeek, selectedDay]);

  const handleDayPress = (day: Date) => {
    Haptics.selectionAsync();
    setSelectedDay(day);
  };

  return (
    <View style={styles.container}>
      {/* Week navigation */}
      <View style={[styles.weekNav, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable
          style={[styles.navBtn, { backgroundColor: colors.muted }]}
          onPress={() => setWeekOffset((o) => o - 1)}
        >
          <ChevronLeft size={18} color={colors.foreground} />
        </Pressable>
        <View style={styles.weekLabelContainer}>
          <Text style={[styles.weekLabel, { color: colors.foreground }]}>{weekLabel}</Text>
          {weekOffset !== 0 && (
            <Pressable onPress={() => { Haptics.selectionAsync(); setWeekOffset(0); }}>
              <Text style={[styles.todayLink, { color: colors.primary }]}>Today</Text>
            </Pressable>
          )}
        </View>
        <Pressable
          style={[styles.navBtn, { backgroundColor: colors.muted }]}
          onPress={() => setWeekOffset((o) => o + 1)}
        >
          <ChevronRight size={18} color={colors.foreground} />
        </Pressable>
      </View>

      {/* Day columns header */}
      <View style={[styles.dayHeader, { borderColor: colors.border }]}>
        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDay);
          const hasActiveTask = entriesThisWeek.some((e) => isSameDay(e.start, day));
          const hasCompletedTask = completedThisWeek.some((e) => isSameDay(e.start, day));
          const hasTask = hasActiveTask || hasCompletedTask;
          return (
            <Pressable
              key={i}
              style={styles.dayCol}
              onPress={() => handleDayPress(day)}
            >
              <Text style={[
                styles.dayName,
                { color: isToday ? colors.primary : isSelected ? colors.foreground : colors.mutedForeground },
              ]}>
                {DAY_LABELS[i]}
              </Text>
              <View style={[
                styles.dayNum,
                isToday && { backgroundColor: colors.primary },
                !isToday && isSelected && { backgroundColor: colors.primary + "28", borderWidth: 1.5, borderColor: colors.primary },
              ]}>
                <Text style={[
                  styles.dayNumText,
                  { color: isToday ? colors.primaryForeground : isSelected ? colors.primary : colors.foreground },
                ]}>
                  {day.getDate()}
                </Text>
              </View>
              {hasTask && !isToday && (
                <View style={[styles.taskDot, { backgroundColor: isSelected ? colors.primary : colors.mutedForeground + "80" }]} />
              )}
              {isToday && hasTask && (
                <View style={[styles.taskDot, { backgroundColor: colors.primaryForeground + "90" }]} />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Mini task grid */}
      {allThisWeek.length === 0 ? (
        <View style={styles.emptyWeek}>
          <Calendar size={28} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No tasks scheduled this week
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.taskGrid}>
          <View style={styles.dayRow}>
            {weekDays.map((day, di) => {
              const dayActiveEntries = entriesThisWeek.filter((e) => isSameDay(e.start, day));
              const dayCompletedEntries = completedThisWeek.filter((e) => isSameDay(e.start, day));
              const isSelected = isSameDay(day, selectedDay);
              return (
                <View
                  key={di}
                  style={[
                    styles.dayTaskCol,
                    isSelected && { backgroundColor: colors.primary + "0D", borderRadius: 8 },
                  ]}
                >
                  {dayActiveEntries.length === 0 && dayCompletedEntries.length === 0 ? (
                    <View style={styles.emptyCol} />
                  ) : (
                    <>
                      {dayActiveEntries.map((entry) => {
                        const color = getPriorityColor(entry.task.priority);
                        return (
                          <Pressable
                            key={entry.task.id + entry.start.getTime()}
                            style={[styles.taskBlock, {
                              backgroundColor: color + "18",
                              borderColor: color + "60",
                              borderLeftColor: color,
                            }]}
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
                      {dayCompletedEntries.map((entry) => (
                        <View
                          key={entry.task.id + entry.start.getTime() + "done"}
                          style={[styles.taskBlock, styles.taskBlockDone, {
                            backgroundColor: colors.muted,
                            borderColor: colors.border,
                            borderLeftColor: colors.success + "80",
                          }]}
                        >
                          <View style={styles.taskBlockDoneRow}>
                            <CircleCheckBig size={8} color={colors.success} />
                            <Text style={[styles.taskBlockTitle, { color: colors.mutedForeground, textDecorationLine: "line-through", flex: 1 }]} numberOfLines={1}>
                              {entry.task.title}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Task list for selected day */}
      {allThisWeek.length > 0 && (
        <View style={styles.listSection}>
          <Text style={[styles.listTitle, { color: colors.mutedForeground }]}>
            {selectedDayLabel}
          </Text>
          {selectedDayEntries.length === 0 && selectedDayCompleted.length === 0 ? (
            <View style={styles.emptyDay}>
              <Text style={[styles.emptyDayText, { color: colors.mutedForeground }]}>
                No tasks scheduled
              </Text>
            </View>
          ) : (
            <>
              {selectedDayEntries.map((entry) => {
                const color = getPriorityColor(entry.task.priority);
                const splitLabel = getSplitLabel(entry);
                return (
                  <Pressable
                    key={entry.task.id + entry.start.getTime()}
                    style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => onReschedule(entry.task)}
                  >
                    <View style={[styles.listBar, { backgroundColor: color }]} />
                    <View style={styles.listContent}>
                      <View style={styles.listTitleRow}>
                        <Text style={[styles.listItemTitle, { color: colors.foreground }]} numberOfLines={1}>
                          {entry.task.title}
                        </Text>
                        {splitLabel && (
                          <View style={[styles.splitBadge, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" }]}>
                            <Text style={[styles.splitBadgeText, { color: colors.primary }]}>{splitLabel}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.listItemTime, { color: colors.mutedForeground }]}>
                        {formatTime(entry.start)} – {formatTime(entry.end)}
                      </Text>
                    </View>
                    <View style={styles.rescheduleHint}>
                      <Clock size={13} color={colors.primary} />
                    </View>
                  </Pressable>
                );
              })}
              {selectedDayCompleted.map((entry) => (
                <View
                  key={entry.task.id + entry.start.getTime() + "done"}
                  style={[styles.listItem, styles.listItemDone, { backgroundColor: colors.muted, borderColor: colors.border }]}
                >
                  <View style={[styles.listBar, { backgroundColor: colors.success + "60" }]} />
                  <View style={styles.listContent}>
                    <View style={styles.listTitleRow}>
                      <Text style={[styles.listItemTitle, { color: colors.mutedForeground, textDecorationLine: "line-through" }]} numberOfLines={1}>
                        {entry.task.title}
                      </Text>
                    </View>
                    <Text style={[styles.listItemTime, { color: colors.mutedForeground }]}>
                      {formatTime(entry.start)} – {formatTime(entry.end)}
                    </Text>
                  </View>
                  <View style={styles.rescheduleHint}>
                    <CircleCheckBig size={13} color={colors.success} />
                  </View>
                </View>
              ))}
            </>
          )}
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
    flexDirection: "row", borderBottomWidth: 1, paddingBottom: 10,
  },
  dayCol: { flex: 1, alignItems: "center", gap: 3 },
  dayName: { fontSize: 11, fontFamily: "Inter_500Medium" },
  dayNum: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  dayNumText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  taskDot: { width: 4, height: 4, borderRadius: 2 },
  emptyWeek: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  taskGrid: { maxHeight: 200 },
  dayRow: { flexDirection: "row", gap: 2 },
  dayTaskCol: { flex: 1, gap: 4, padding: 2 },
  emptyCol: { height: 8 },
  taskBlock: {
    borderRadius: 8, borderWidth: 1, borderLeftWidth: 3,
    padding: 6, gap: 2,
  },
  taskBlockDone: { opacity: 0.6 },
  taskBlockDoneRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  taskBlockTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", lineHeight: 14 },
  taskBlockTime: { fontSize: 10, fontFamily: "Inter_400Regular" },
  listSection: { gap: 8 },
  listTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.6 },
  emptyDay: { paddingVertical: 16, alignItems: "center" },
  emptyDayText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  listItem: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 12, borderWidth: 1, overflow: "hidden",
  },
  listItemDone: { opacity: 0.8 },
  listBar: { width: 4, alignSelf: "stretch" },
  listContent: { flex: 1, padding: 12, gap: 2 },
  listTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  listItemTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", flexShrink: 1 },
  listItemTime: { fontSize: 12, fontFamily: "Inter_400Regular" },
  rescheduleHint: { paddingRight: 14 },
  splitBadge: {
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6, borderWidth: 1,
  },
  splitBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
});
