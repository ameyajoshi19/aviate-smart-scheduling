import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Priority, Task, useApp } from "../context/AppContext";
import { useColors } from "../hooks/useColors";

type TaskFields = {
  title: string;
  description: string;
  priority: Priority;
  deadline: string;
  estimatedHours: number;
  labels: string[];
  isCompleted: boolean;
};

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (task: TaskFields) => void;
  editTask?: Task | null;
  onEdit?: (id: string, updates: Partial<Task>) => void;
}

const PRIORITIES: { key: Priority; label: string; color: string }[] = [
  { key: "high", label: "High", color: "#ef4444" },
  { key: "medium", label: "Medium", color: "#f59e0b" },
  { key: "low", label: "Low", color: "#22c55e" },
];

const DURATION_PRESETS: { label: string; hours: number }[] = [
  { label: "15m", hours: 0.25 },
  { label: "30m", hours: 0.5 },
  { label: "45m", hours: 0.75 },
  { label: "1h", hours: 1 },
  { label: "1.5h", hours: 1.5 },
  { label: "2h", hours: 2 },
  { label: "3h", hours: 3 },
  { label: "4h", hours: 4 },
  { label: "6h", hours: 6 },
  { label: "8h", hours: 8 },
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

export function AddTaskModal({ visible, onClose, onAdd, editTask, onEdit }: AddTaskModalProps) {
  const colors = useColors();
  const { userLabels, addUserLabel } = useApp();
  const isEditing = !!editTask;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [deadline, setDeadline] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [estimatedHours, setEstimatedHours] = useState(1);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [newLabelText, setNewLabelText] = useState("");
  const [showNewLabel, setShowNewLabel] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Pre-fill when switching into edit mode
  React.useEffect(() => {
    if (editTask && visible) {
      setTitle(editTask.title);
      setDescription(editTask.description ?? "");
      setPriority(editTask.priority);
      setDeadline(new Date(editTask.deadline));
      setEstimatedHours(editTask.estimatedHours);
      setSelectedLabels(editTask.labels ?? []);
      setNewLabelText("");
      setShowNewLabel(false);
      setShowDatePicker(false);
    }
  }, [editTask, visible]);

  const reset = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDeadline(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setEstimatedHours(1);
    setSelectedLabels([]);
    setNewLabelText("");
    setShowNewLabel(false);
    setShowDatePicker(false);
  };

  const handleClose = () => {
    if (!isEditing) reset();
    onClose();
  };

  const handleAdd = () => {
    if (!title.trim()) {
      Alert.alert("Required", "Please enter a task title");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (isEditing && onEdit && editTask) {
      onEdit(editTask.id, {
        title: title.trim(),
        description: description.trim(),
        priority,
        deadline: deadline.toISOString(),
        estimatedHours,
        labels: selectedLabels,
      });
    } else {
      onAdd({
        title: title.trim(),
        description: description.trim(),
        priority,
        deadline: deadline.toISOString(),
        estimatedHours,
        labels: selectedLabels,
        isCompleted: false,
      });
      reset();
    }
    onClose();
  };

  const toggleLabel = (label: string) => {
    Haptics.selectionAsync();
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const handleAddNewLabel = async () => {
    const trimmed = newLabelText.trim();
    if (!trimmed) return;
    await addUserLabel(trimmed);
    setSelectedLabels((prev) => [...prev, trimmed]);
    setNewLabelText("");
    setShowNewLabel(false);
    Haptics.selectionAsync();
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours % 1 === 0) return `${hours}h`;
    return `${hours}h`;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{isEditing ? "Edit Task" : "New Task"}</Text>
          <TouchableOpacity onPress={handleAdd}>
            <Text style={[styles.addText, { color: colors.primary }]}>{isEditing ? "Save" : "Add"}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          {/* Title */}
          <View style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>TASK TITLE</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="What needs to be done?"
              placeholderTextColor={colors.mutedForeground}
              value={title}
              onChangeText={setTitle}
              autoFocus
              returnKeyType="next"
            />
          </View>

          {/* Description */}
          <View style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>DESCRIPTION</Text>
            <TextInput
              style={[styles.textArea, { color: colors.foreground }]}
              placeholder="Additional details (optional)"
              placeholderTextColor={colors.mutedForeground}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              returnKeyType="done"
            />
          </View>

          {/* Priority */}
          <View style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>PRIORITY</Text>
            <View style={styles.priorityRow}>
              {PRIORITIES.map((p) => (
                <Pressable
                  key={p.key}
                  style={[
                    styles.priorityBtn,
                    {
                      backgroundColor: priority === p.key ? p.color : colors.muted,
                      borderColor: priority === p.key ? p.color : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setPriority(p.key);
                  }}
                >
                  <Text style={[styles.priorityBtnText, { color: priority === p.key ? "#fff" : colors.mutedForeground }]}>
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Labels */}
          <View style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>LABELS</Text>
            <View style={styles.labelsGrid}>
              {userLabels.map((label) => {
                const active = selectedLabels.includes(label);
                const lc = getLabelColor(label);
                return (
                  <Pressable
                    key={label}
                    style={[
                      styles.labelChip,
                      {
                        backgroundColor: active ? lc : lc + "18",
                        borderColor: active ? lc : lc + "40",
                      },
                    ]}
                    onPress={() => toggleLabel(label)}
                  >
                    {active && <Feather name="check" size={10} color="#fff" />}
                    <Text style={[styles.labelChipText, { color: active ? "#fff" : lc }]}>{label}</Text>
                  </Pressable>
                );
              })}
              {showNewLabel ? (
                <View style={[styles.newLabelRow, { borderColor: colors.primary, backgroundColor: colors.muted }]}>
                  <TextInput
                    style={[styles.newLabelInput, { color: colors.foreground }]}
                    placeholder="Label name"
                    placeholderTextColor={colors.mutedForeground}
                    value={newLabelText}
                    onChangeText={setNewLabelText}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleAddNewLabel}
                    maxLength={20}
                  />
                  <TouchableOpacity onPress={handleAddNewLabel}>
                    <Feather name="check" size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setShowNewLabel(false); setNewLabelText(""); }}>
                    <Feather name="x" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              ) : (
                <Pressable
                  style={[styles.addLabelChip, { borderColor: colors.border }]}
                  onPress={() => { Haptics.selectionAsync(); setShowNewLabel(true); }}
                >
                  <Feather name="plus" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.addLabelText, { color: colors.mutedForeground }]}>New</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Deadline */}
          <TouchableOpacity
            style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>DEADLINE</Text>
            <View style={styles.dateRow}>
              <Feather name="calendar" size={16} color={colors.primary} />
              <Text style={[styles.dateText, { color: colors.foreground }]}>
                {deadline.toLocaleDateString("en-US", {
                  weekday: "long", month: "long", day: "numeric", year: "numeric",
                })}
              </Text>
            </View>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={deadline}
              mode="date"
              minimumDate={new Date()}
              onChange={(_, date) => {
                setShowDatePicker(Platform.OS === "ios");
                if (date) setDeadline(date);
              }}
            />
          )}

          {/* Duration */}
          <View style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.durationHeader}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>ESTIMATED DURATION</Text>
              <Text style={[styles.durationValue, { color: colors.primary }]}>
                {formatDuration(estimatedHours)}
              </Text>
            </View>
            <View style={styles.durationGrid}>
              {DURATION_PRESETS.map((preset) => (
                <Pressable
                  key={preset.hours}
                  style={[
                    styles.durationChip,
                    {
                      backgroundColor: estimatedHours === preset.hours ? colors.primary : colors.muted,
                      borderColor: estimatedHours === preset.hours ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setEstimatedHours(preset.hours);
                  }}
                >
                  <Text
                    style={[
                      styles.durationChipText,
                      { color: estimatedHours === preset.hours ? colors.primaryForeground : colors.mutedForeground },
                    ]}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    paddingTop: Platform.OS === "android" ? 40 : 16,
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  cancelText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  addText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 12 },
  field: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  fieldLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
  input: { fontSize: 16, fontFamily: "Inter_400Regular", paddingVertical: 4 },
  textArea: {
    fontSize: 15, fontFamily: "Inter_400Regular",
    paddingVertical: 4, minHeight: 70, textAlignVertical: "top",
  },
  priorityRow: { flexDirection: "row", gap: 8 },
  priorityBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, alignItems: "center" },
  priorityBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  labelsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  labelChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5,
  },
  labelChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  addLabelChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderStyle: "dashed",
  },
  addLabelText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  newLabelRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5,
  },
  newLabelInput: { fontSize: 13, fontFamily: "Inter_400Regular", minWidth: 80, maxWidth: 120 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dateText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  durationHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  durationValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  durationGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  durationChip: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 10, borderWidth: 1.5,
    minWidth: 56, alignItems: "center",
  },
  durationChipText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
