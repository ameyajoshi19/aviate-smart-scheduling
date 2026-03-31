import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { Priority, Task } from "../context/AppContext";
import { useColors } from "../hooks/useColors";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatScheduled(start?: string, end?: string) {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  const day = s.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const startTime = s.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const endTime = e.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${day}, ${startTime} – ${endTime}`;
}

const PRIORITY_LABELS: Record<Priority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onComplete: () => void;
  index: number;
}

export function TaskCard({ task, onPress, onComplete, index }: TaskCardProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const priorityColor =
    task.priority === "high"
      ? colors.priorityHigh
      : task.priority === "medium"
      ? colors.priorityMedium
      : colors.priorityLow;

  const handleComplete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
    onComplete();
  };

  const scheduledTime = formatScheduled(task.scheduledStart, task.scheduledEnd);
  const isOverdue = !task.isCompleted && new Date(task.deadline) < new Date();

  return (
    <Animated.View entering={FadeInRight.delay(index * 60).springify()}>
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPress}
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: task.isCompleted ? 0.55 : 1,
            },
          ]}
        >
          <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />

          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <Text
                  style={[
                    styles.title,
                    {
                      color: colors.foreground,
                      textDecorationLine: task.isCompleted ? "line-through" : "none",
                    },
                  ]}
                  numberOfLines={1}
                >
                  {task.title}
                </Text>
                <TouchableOpacity onPress={handleComplete} hitSlop={8}>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: task.isCompleted ? colors.primary : colors.border,
                        backgroundColor: task.isCompleted ? colors.primary : "transparent",
                      },
                    ]}
                  >
                    {task.isCompleted && (
                      <Feather name="check" size={12} color={colors.primaryForeground} />
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              {task.description ? (
                <Text
                  style={[styles.description, { color: colors.mutedForeground }]}
                  numberOfLines={2}
                >
                  {task.description}
                </Text>
              ) : null}
            </View>

            <View style={styles.footer}>
              <View style={styles.metaRow}>
                <View style={[styles.priorityBadge, { backgroundColor: priorityColor + "22" }]}>
                  <Text style={[styles.priorityText, { color: priorityColor }]}>
                    {PRIORITY_LABELS[task.priority]}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Feather name="clock" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                    {task.estimatedHours}h
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Feather
                    name="calendar"
                    size={12}
                    color={isOverdue ? colors.destructive : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.metaText,
                      { color: isOverdue ? colors.destructive : colors.mutedForeground },
                    ]}
                  >
                    {formatDate(task.deadline)}
                  </Text>
                </View>
              </View>

              {scheduledTime && !task.isCompleted && (
                <View style={[styles.scheduledBadge, { backgroundColor: colors.accent }]}>
                  <Feather name="check-circle" size={11} color={colors.accentForeground} />
                  <Text style={[styles.scheduledText, { color: colors.accentForeground }]}>
                    {scheduledTime}
                  </Text>
                </View>
              )}

              {task.googleEventId && (
                <View style={styles.calendarBadge}>
                  <Feather name="calendar" size={11} color={colors.primary} />
                  <Text style={[styles.calendarText, { color: colors.primary }]}>
                    Added to Google Calendar
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  priorityBar: {
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  header: {
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  description: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  footer: {
    gap: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  priorityText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  scheduledBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  scheduledText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  calendarBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  calendarText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
