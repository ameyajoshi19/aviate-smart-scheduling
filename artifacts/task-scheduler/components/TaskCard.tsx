import { Clock, Trash2, Check, Calendar, CircleCheckBig } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated as RNAnimated,
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
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

function formatDuration(hours: number) {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours % 1 === 0) return `${hours}h`;
  return `${hours}h`;
}

const PRIORITY_LABELS: Record<Priority, string> = {
  high: "High", medium: "Medium", low: "Low",
};

const LABEL_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f97316",
  "#14b8a6", "#10b981", "#3b82f6", "#f59e0b",
];

function getLabelColor(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = label.charCodeAt(i) + ((hash << 5) - hash);
  return LABEL_COLORS[Math.abs(hash) % LABEL_COLORS.length];
}

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onComplete: () => void;
  onDelete: () => void;
  onReschedule: () => void;
  index: number;
}

function CardContent({
  task,
  onPress,
  onComplete,
  onDelete,
  onReschedule,
  isWeb,
}: Omit<TaskCardProps, "index"> & { isWeb: boolean }) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const priorityColor =
    task.priority === "high" ? colors.priorityHigh
    : task.priority === "medium" ? colors.priorityMedium
    : colors.priorityLow;

  const handleComplete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(0.96, {}, () => { scale.value = withSpring(1); });
    onComplete();
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Delete Task",
      `Are you sure you want to delete "${task.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onDelete },
      ]
    );
  };

  const scheduledTime = formatScheduled(task.scheduledStart, task.scheduledEnd);
  const isOverdue = !task.isCompleted && new Date(task.deadline) < new Date();
  const labels = task.labels ?? [];

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[styles.card, {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: task.isCompleted ? 0.55 : 1,
        }]}
      >
        <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text
                style={[styles.title, {
                  color: colors.foreground,
                  textDecorationLine: task.isCompleted ? "line-through" : "none",
                }]}
                numberOfLines={1}
              >
                {task.title}
              </Text>
              <View style={styles.headerActions}>
                {isWeb && !task.isCompleted && (
                  <>
                    <TouchableOpacity onPress={onReschedule} hitSlop={8} style={styles.webActionBtn}>
                      <Clock size={14} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDelete} hitSlop={8} style={styles.webActionBtn}>
                      <Trash2 size={14} color={colors.destructive} />
                    </TouchableOpacity>
                  </>
                )}
                <TouchableOpacity onPress={handleComplete} hitSlop={8}>
                  <View style={[styles.checkbox, {
                    borderColor: task.isCompleted ? colors.primary : colors.border,
                    backgroundColor: task.isCompleted ? colors.primary : "transparent",
                  }]}>
                    {task.isCompleted && <Check size={12} color={colors.primaryForeground} />}
                  </View>
                </TouchableOpacity>
              </View>
            </View>
            {task.description ? (
              <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>
                {task.description}
              </Text>
            ) : null}
          </View>

          {labels.length > 0 && (
            <View style={styles.labelsRow}>
              {labels.map((l) => {
                const lc = getLabelColor(l);
                return (
                  <View key={l} style={[styles.labelBadge, { backgroundColor: lc + "20", borderColor: lc + "50" }]}>
                    <Text style={[styles.labelBadgeText, { color: lc }]}>{l}</Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.footer}>
            <View style={styles.metaRow}>
              <View style={[styles.priorityBadge, { backgroundColor: priorityColor + "22" }]}>
                <Text style={[styles.priorityText, { color: priorityColor }]}>
                  {PRIORITY_LABELS[task.priority]}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Clock size={12} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                  {formatDuration(task.estimatedHours)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Calendar size={12} color={isOverdue ? colors.destructive : colors.mutedForeground} />
                <Text style={[styles.metaText, { color: isOverdue ? colors.destructive : colors.mutedForeground }]}>
                  {formatDate(task.deadline)}
                </Text>
              </View>
            </View>

            {scheduledTime && !task.isCompleted && (
              <View style={[styles.scheduledBadge, { backgroundColor: colors.accent }]}>
                <CircleCheckBig size={11} color={colors.accentForeground} />
                <Text style={[styles.scheduledText, { color: colors.accentForeground }]}>{scheduledTime}</Text>
              </View>
            )}

            {task.googleEventId && (
              <View style={styles.calendarBadge}>
                <Calendar size={11} color={colors.primary} />
                <Text style={[styles.calendarText, { color: colors.primary }]}>Added to Google Calendar</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function TaskCard({ task, onPress, onComplete, onDelete, onReschedule, index }: TaskCardProps) {
  const isWeb = Platform.OS === "web";

  const handleDeleteWithConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Delete Task",
      `Are you sure you want to delete "${task.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onDelete },
      ]
    );
  };

  if (isWeb) {
    return (
      <Animated.View entering={FadeInRight.delay(index * 60).springify()} style={styles.wrapper}>
        <CardContent
          task={task}
          onPress={onPress}
          onComplete={onComplete}
          onDelete={handleDeleteWithConfirm}
          onReschedule={onReschedule}
          isWeb
        />
      </Animated.View>
    );
  }

  // Native only: lazy-load Swipeable to avoid web crash
  const SwipeableCard = require("./SwipeableCard").SwipeableCard;
  return (
    <SwipeableCard
      task={task}
      onPress={onPress}
      onComplete={onComplete}
      onDelete={handleDeleteWithConfirm}
      onReschedule={onReschedule}
      index={index}
    />
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  card: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  priorityBar: { width: 4 },
  content: { flex: 1, padding: 16, gap: 10 },
  header: { gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  title: { fontSize: 16, fontFamily: "Inter_600SemiBold", flex: 1 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  webActionBtn: { padding: 2 },
  checkbox: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, alignItems: "center", justifyContent: "center",
  },
  description: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  labelsRow: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  labelBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20, borderWidth: 1 },
  labelBadgeText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  footer: { gap: 6 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  priorityText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  scheduledBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-start",
  },
  scheduledText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  calendarBadge: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start" },
  calendarText: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
