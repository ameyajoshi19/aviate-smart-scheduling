import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AddTaskModal } from "@/components/AddTaskModal";
import { RescheduleModal } from "@/components/RescheduleModal";
import { TaskCard } from "@/components/TaskCard";
import { Task, useApp } from "@/context/AppContext";
import { useCalendar } from "@/context/CalendarContext";
import { useColors } from "@/hooks/useColors";
import { findNewSlotForTask } from "@/utils/scheduler";

type PriorityFilter = "all" | "high" | "medium" | "low" | "completed";

const PRIORITY_FILTERS: { key: PriorityFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
  { key: "completed", label: "Done" },
];

const LABEL_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f97316",
  "#14b8a6", "#10b981", "#3b82f6", "#f59e0b",
];

function getLabelColor(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = label.charCodeAt(i) + ((hash << 5) - hash);
  return LABEL_COLORS[Math.abs(hash) % LABEL_COLORS.length];
}

export default function TasksScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tasks, userLabels, availability, addTask, updateTask, deleteTask, isLoading } = useApp();
  const { events } = useCalendar();
  const [showAdd, setShowAdd] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [labelFilter, setLabelFilter] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [rescheduleTask, setRescheduleTask] = useState<Task | null>(null);

  const filtered = tasks.filter((t) => {
    if (priorityFilter === "completed") return t.isCompleted;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (t.isCompleted && priorityFilter !== "completed") return false;
    if (labelFilter && !(t.labels ?? []).includes(labelFilter)) return false;
    return true;
  });

  const overduePending = tasks.filter(
    (t) => !t.isCompleted && new Date(t.deadline) < new Date()
  ).length;

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleComplete = async (task: Task) => {
    await updateTask(task.id, { isCompleted: !task.isCompleted });
  };

  const handleDelete = async (task: Task) => {
    await deleteTask(task.id);
  };

  const handleAutoReschedule = async (task: Task) => {
    const newSlot = findNewSlotForTask(task, tasks, availability, events);
    if (newSlot) {
      await updateTask(task.id, {
        scheduledStart: newSlot.start.toISOString(),
        scheduledEnd: newSlot.end.toISOString(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Rescheduled",
        `"${task.title}" has been moved to ${newSlot.start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at ${newSlot.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}.`
      );
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "No Slot Found",
        "No other available time slot was found before the deadline. Try updating your availability or extending the deadline."
      );
    }
  };

  const handleManualReschedule = async (taskId: string, start: Date, end: Date) => {
    await updateTask(taskId, {
      scheduledStart: start.toISOString(),
      scheduledEnd: end.toISOString(),
    });
    setRescheduleTask(null);
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeInDown.duration(400)} style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>My Tasks</Text>
          {overduePending > 0 && (
            <View style={[styles.overdueBadge, { backgroundColor: colors.destructive + "22" }]}>
              <Feather name="alert-circle" size={12} color={colors.destructive} />
              <Text style={[styles.overdueText, { color: colors.destructive }]}>{overduePending} overdue</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowAdd(true);
          }}
        >
          <Feather name="plus" size={22} color={colors.primaryForeground} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.foreground }]}>
            {tasks.filter((t) => !t.isCompleted).length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Pending</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.success }]}>
            {tasks.filter((t) => t.isCompleted).length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Done</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.taskScheduled }]}>
            {tasks.filter((t) => !t.isCompleted && t.scheduledStart).length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Scheduled</Text>
        </View>
      </Animated.View>

      {/* Priority filter */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          {PRIORITY_FILTERS.map((item) => (
            <Pressable
              key={item.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: priorityFilter === item.key ? colors.primary : colors.card,
                  borderColor: priorityFilter === item.key ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setPriorityFilter(item.key);
              }}
            >
              <Text style={[styles.filterText, { color: priorityFilter === item.key ? colors.primaryForeground : colors.mutedForeground }]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Label filter */}
      {userLabels.length > 0 && (
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
            <Pressable
              style={[styles.labelChip, {
                backgroundColor: labelFilter === null ? colors.primary + "20" : "transparent",
                borderColor: labelFilter === null ? colors.primary : colors.border,
              }]}
              onPress={() => { Haptics.selectionAsync(); setLabelFilter(null); }}
            >
              <Feather name="tag" size={11} color={labelFilter === null ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.filterText, { color: labelFilter === null ? colors.primary : colors.mutedForeground }]}>
                All Labels
              </Text>
            </Pressable>
            {userLabels.map((label) => {
              const active = labelFilter === label;
              const lc = getLabelColor(label);
              return (
                <Pressable
                  key={label}
                  style={[styles.labelChip, {
                    backgroundColor: active ? lc + "22" : "transparent",
                    borderColor: active ? lc : colors.border,
                  }]}
                  onPress={() => { Haptics.selectionAsync(); setLabelFilter(active ? null : label); }}
                >
                  <View style={[styles.labelDot, { backgroundColor: lc }]} />
                  <Text style={[styles.filterText, { color: active ? lc : colors.mutedForeground }]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 84 : 100) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="check-square" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {priorityFilter === "completed" ? "No completed tasks" : labelFilter ? `No tasks with "${labelFilter}"` : "No tasks yet"}
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {priorityFilter === "completed"
                ? "Complete tasks to see them here"
                : labelFilter
                ? "Try a different label filter"
                : "Tap the + button to add your first task"}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <TaskCard
            task={item}
            index={index}
            onPress={() => {
              Haptics.selectionAsync();
              setEditTask(item);
            }}
            onComplete={() => handleComplete(item)}
            onDelete={() => handleDelete(item)}
            onReschedule={() => handleAutoReschedule(item)}
          />
        )}
      />

      <AddTaskModal visible={showAdd} onClose={() => setShowAdd(false)} onAdd={addTask} />

      <AddTaskModal
        visible={editTask !== null}
        onClose={() => setEditTask(null)}
        onAdd={addTask}
        editTask={editTask}
        onEdit={async (id, updates) => {
          await updateTask(id, updates);
          setEditTask(null);
        }}
      />

      <RescheduleModal
        task={rescheduleTask}
        visible={rescheduleTask !== null}
        onClose={() => setRescheduleTask(null)}
        onReschedule={handleManualReschedule}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 16,
  },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  title: { fontSize: 32, fontFamily: "Inter_700Bold", lineHeight: 36 },
  overdueBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
    marginTop: 6, alignSelf: "flex-start",
  },
  overdueText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  addBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
    marginTop: 8, shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3,
    shadowRadius: 8, elevation: 6,
  },
  statsRow: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 10 },
  statCard: {
    flex: 1, padding: 14, borderRadius: 14,
    borderWidth: 1, alignItems: "center", gap: 2,
  },
  statNum: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  filterSection: { marginBottom: 6 },
  filterContent: { paddingHorizontal: 20, gap: 7 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  labelChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  labelDot: { width: 7, height: 7, borderRadius: 4 },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  listContent: { paddingHorizontal: 20, paddingTop: 6 },
  emptyState: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: {
    fontSize: 14, fontFamily: "Inter_400Regular",
    textAlign: "center", maxWidth: 240,
  },
});
