import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Task } from "../context/AppContext";
import { useColors } from "../hooks/useColors";

interface ScheduleEntry {
  task: Task;
  start: Date;
  end: Date;
}

interface ScheduleTimelineProps {
  scheduled: ScheduleEntry[];
  unscheduled: Task[];
}

function formatDateTime(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }) + " · " + d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDuration(start: Date, end: Date) {
  const mins = Math.round((end.getTime() - start.getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function ScheduleTimeline({ scheduled, unscheduled }: ScheduleTimelineProps) {
  const colors = useColors();

  const priorityColor = (p: string) =>
    p === "high" ? colors.priorityHigh : p === "medium" ? colors.priorityMedium : colors.priorityLow;

  if (scheduled.length === 0 && unscheduled.length === 0) {
    return (
      <View style={styles.empty}>
        <Feather name="calendar" size={32} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No tasks to schedule</Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Add tasks and set your availability to see your schedule
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {scheduled.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Scheduled</Text>
          {scheduled.map((entry, i) => (
            <Animated.View
              key={entry.task.id}
              entering={FadeInDown.delay(i * 50).springify()}
            >
              <View
                style={[
                  styles.scheduleCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                <View
                  style={[styles.timelineBar, { backgroundColor: colors.primary + "30" }]}
                />
                <View style={styles.scheduleContent}>
                  <Text style={[styles.scheduleTitle, { color: colors.foreground }]}>
                    {entry.task.title}
                  </Text>
                  <View style={styles.scheduleMeta}>
                    <View style={[styles.dot, { backgroundColor: priorityColor(entry.task.priority) }]} />
                    <Text style={[styles.scheduleTime, { color: colors.mutedForeground }]}>
                      {formatDateTime(entry.start)}
                    </Text>
                    <Text style={[styles.scheduleDuration, { color: colors.primary }]}>
                      {formatDuration(entry.start, entry.end)}
                    </Text>
                  </View>
                </View>
                {entry.task.googleEventId && (
                  <Feather name="calendar" size={14} color={colors.primary} style={styles.calIcon} />
                )}
              </View>
            </Animated.View>
          ))}
        </>
      )}

      {unscheduled.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 16 }]}>
            Could Not Schedule
          </Text>
          {unscheduled.map((task, i) => (
            <Animated.View key={task.id} entering={FadeInDown.delay(i * 50).springify()}>
              <View
                style={[
                  styles.scheduleCard,
                  { backgroundColor: colors.card, borderColor: colors.border, opacity: 0.7 },
                ]}
              >
                <View style={[styles.timelineDot, { backgroundColor: colors.mutedForeground }]} />
                <View style={styles.scheduleContent}>
                  <Text style={[styles.scheduleTitle, { color: colors.mutedForeground }]}>
                    {task.title}
                  </Text>
                  <Text style={[styles.scheduleTime, { color: colors.mutedForeground }]}>
                    No available slot before deadline
                  </Text>
                </View>
              </View>
            </Animated.View>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  scheduleCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  timelineBar: {
    position: "absolute",
    left: 18,
    top: 24,
    width: 2,
    bottom: 0,
    borderRadius: 1,
  },
  scheduleContent: {
    flex: 1,
    gap: 4,
  },
  scheduleTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  scheduleMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  scheduleTime: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  scheduleDuration: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  calIcon: {
    alignSelf: "center",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
