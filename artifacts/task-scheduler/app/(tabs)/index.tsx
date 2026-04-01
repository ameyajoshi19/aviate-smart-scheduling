import { CircleAlert, Plus, X, SlidersHorizontal, SquareCheckBig } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
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
import { ScheduledBlock, Task, useApp } from "@/context/AppContext";
import { useCalendar } from "@/context/CalendarContext";
import { useColors } from "@/hooks/useColors";
import { findNewSlotForTask, scheduleTasks } from "@/utils/scheduler";

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
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
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

  const handleAddTask = async (taskData: Omit<Task, "id" | "createdAt">) => {
    const tempId = "__new_task__";
    const tempTask: Task = { ...taskData, id: tempId, createdAt: new Date().toISOString() };
    const proposal = scheduleTasks([...tasks, tempTask], availability, events);
    const parts = proposal.filter((s) => s.task.id === tempId);

    let scheduledStart: string | undefined;
    let scheduledEnd: string | undefined;
    let scheduledBlocks: ScheduledBlock[] | undefined;

    if (parts.length === 1 && !parts[0].splitTotalParts) {
      scheduledStart = parts[0].start.toISOString();
      scheduledEnd = parts[0].end.toISOString();
    } else if (parts.length > 1) {
      scheduledStart = parts[0].start.toISOString();
      scheduledEnd = parts[parts.length - 1].end.toISOString();
      scheduledBlocks = parts.map((p, i) => ({
        start: p.start.toISOString(),
        end: p.end.toISOString(),
        splitPartIndex: p.splitPartIndex ?? i + 1,
        splitTotalParts: p.splitTotalParts ?? parts.length,
      }));
    }

    await addTask({
      ...taskData,
      scheduledStart,
      scheduledEnd,
      ...(scheduledBlocks ? { scheduledBlocks } : {}),
    });
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
              <CircleAlert size={12} color={colors.destructive} />
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
          <Plus size={22} color={colors.primaryForeground} />
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

      {/* Filter bar */}
      {(() => {
        const hasFilters = priorityFilter !== "all" || labelFilter !== null;
        const badgeCount = [priorityFilter !== "all", labelFilter !== null].filter(Boolean).length;
        return (
          <View style={styles.filterBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterBarContent}
            >
              {priorityFilter !== "all" && (
                <Pressable
                  style={[styles.activeChip, { backgroundColor: colors.primary + "18", borderColor: colors.primary }]}
                  onPress={() => { Haptics.selectionAsync(); setPriorityFilter("all"); }}
                >
                  <Text style={[styles.activeChipText, { color: colors.primary }]}>
                    {PRIORITY_FILTERS.find((f) => f.key === priorityFilter)?.label}
                  </Text>
                  <X size={11} color={colors.primary} />
                </Pressable>
              )}
              {labelFilter && (
                <Pressable
                  style={[styles.activeChip, { backgroundColor: getLabelColor(labelFilter) + "18", borderColor: getLabelColor(labelFilter) }]}
                  onPress={() => { Haptics.selectionAsync(); setLabelFilter(null); }}
                >
                  <View style={[styles.labelDot, { backgroundColor: getLabelColor(labelFilter) }]} />
                  <Text style={[styles.activeChipText, { color: getLabelColor(labelFilter) }]}>{labelFilter}</Text>
                  <X size={11} color={getLabelColor(labelFilter)} />
                </Pressable>
              )}
            </ScrollView>
            <Pressable
              style={[styles.filterBtn, {
                backgroundColor: hasFilters ? colors.primary + "15" : colors.card,
                borderColor: hasFilters ? colors.primary : colors.border,
              }]}
              onPress={() => { Haptics.selectionAsync(); setFilterSheetVisible(true); }}
            >
              <SlidersHorizontal size={15} color={hasFilters ? colors.primary : colors.mutedForeground} />
              {hasFilters && (
                <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.filterBadgeText}>{badgeCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        );
      })()}

      {/* Filter sheet */}
      <Modal
        visible={filterSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterSheetVisible(false)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setFilterSheetVisible(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Filter Tasks</Text>

          <Text style={[styles.sheetSection, { color: colors.mutedForeground }]}>PRIORITY</Text>
          <View style={styles.sheetChips}>
            {PRIORITY_FILTERS.map((item) => (
              <Pressable
                key={item.key}
                style={[styles.sheetChip, {
                  backgroundColor: priorityFilter === item.key ? colors.primary : colors.background,
                  borderColor: priorityFilter === item.key ? colors.primary : colors.border,
                }]}
                onPress={() => { Haptics.selectionAsync(); setPriorityFilter(item.key); }}
              >
                <Text style={[styles.sheetChipText, { color: priorityFilter === item.key ? colors.primaryForeground : colors.mutedForeground }]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {userLabels.length > 0 && (
            <>
              <Text style={[styles.sheetSection, { color: colors.mutedForeground }]}>LABEL</Text>
              <View style={styles.sheetChips}>
                <Pressable
                  style={[styles.sheetChip, {
                    backgroundColor: labelFilter === null ? colors.primary : colors.background,
                    borderColor: labelFilter === null ? colors.primary : colors.border,
                  }]}
                  onPress={() => { Haptics.selectionAsync(); setLabelFilter(null); }}
                >
                  <Text style={[styles.sheetChipText, { color: labelFilter === null ? colors.primaryForeground : colors.mutedForeground }]}>All</Text>
                </Pressable>
                {userLabels.map((label) => {
                  const lc = getLabelColor(label);
                  const active = labelFilter === label;
                  return (
                    <Pressable
                      key={label}
                      style={[styles.sheetChip, {
                        backgroundColor: active ? lc + "22" : colors.background,
                        borderColor: active ? lc : colors.border,
                      }]}
                      onPress={() => { Haptics.selectionAsync(); setLabelFilter(active ? null : label); }}
                    >
                      <View style={[styles.labelDot, { backgroundColor: lc }]} />
                      <Text style={[styles.sheetChipText, { color: active ? lc : colors.mutedForeground }]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          <View style={styles.sheetActions}>
            <Pressable
              style={[styles.sheetClearBtn, { borderColor: colors.border }]}
              onPress={() => { Haptics.selectionAsync(); setPriorityFilter("all"); setLabelFilter(null); }}
            >
              <Text style={[styles.sheetClearText, { color: colors.mutedForeground }]}>Clear All</Text>
            </Pressable>
            <Pressable
              style={[styles.sheetDoneBtn, { backgroundColor: colors.primary }]}
              onPress={() => setFilterSheetVisible(false)}
            >
              <Text style={[styles.sheetDoneText, { color: colors.primaryForeground }]}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
        ListEmptyComponent={(() => {
          const allDone =
            tasks.length > 0 &&
            tasks.every((t) => t.isCompleted) &&
            priorityFilter === "all" &&
            labelFilter === null;
          if (allDone) {
            return (
              <View style={styles.emptyState}>
                <Text style={styles.celebrationEmoji}>🎉</Text>
                <Text style={[styles.emptyTitle, { color: colors.success }]}>All tasks complete!</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Outstanding work — you've cleared every task. Add new ones whenever you're ready.
                </Text>
              </View>
            );
          }
          return (
            <View style={styles.emptyState}>
              <SquareCheckBig size={40} color={colors.mutedForeground} />
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
          );
        })()}
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

      <AddTaskModal visible={showAdd} onClose={() => setShowAdd(false)} onAdd={handleAddTask} />

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
  filterBar: {
    flexDirection: "row", alignItems: "center",
    paddingRight: 20, marginBottom: 8, gap: 8,
  },
  filterBarContent: { paddingLeft: 20, gap: 7, alignItems: "center" },
  activeChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  activeChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  filterBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
  filterBadge: {
    width: 16, height: 16, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  filterBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff" },
  labelDot: { width: 7, height: 7, borderRadius: 4 },
  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingHorizontal: 24,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: "center", marginBottom: 20,
  },
  sheetTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 20 },
  sheetSection: {
    fontSize: 11, fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8, marginBottom: 10,
  },
  sheetChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  sheetChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
  sheetChipText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  sheetActions: { flexDirection: "row", gap: 12, marginTop: 4 },
  sheetClearBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1, alignItems: "center",
  },
  sheetClearText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  sheetDoneBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: "center",
  },
  sheetDoneText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  listContent: { paddingHorizontal: 20, paddingTop: 6 },
  emptyState: { alignItems: "center", paddingTop: 80, gap: 12 },
  celebrationEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: {
    fontSize: 14, fontFamily: "Inter_400Regular",
    textAlign: "center", maxWidth: 240,
  },
});
