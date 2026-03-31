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

import { Priority } from "../context/AppContext";
import { useColors } from "../hooks/useColors";

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (task: {
    title: string;
    description: string;
    priority: Priority;
    deadline: string;
    estimatedHours: number;
    isCompleted: boolean;
    scheduledStart?: string;
    scheduledEnd?: string;
    googleEventId?: string;
  }) => void;
}

const PRIORITIES: { key: Priority; label: string; color: string }[] = [
  { key: "high", label: "High", color: "#ef4444" },
  { key: "medium", label: "Medium", color: "#f59e0b" },
  { key: "low", label: "Low", color: "#22c55e" },
];

export function AddTaskModal({ visible, onClose, onAdd }: AddTaskModalProps) {
  const colors = useColors();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [deadline, setDeadline] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [estimatedHours, setEstimatedHours] = useState("2");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const reset = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDeadline(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setEstimatedHours("2");
    setShowDatePicker(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleAdd = () => {
    if (!title.trim()) {
      Alert.alert("Required", "Please enter a task title");
      return;
    }
    const hours = parseFloat(estimatedHours);
    if (isNaN(hours) || hours <= 0) {
      Alert.alert("Invalid", "Please enter valid estimated hours");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAdd({
      title: title.trim(),
      description: description.trim(),
      priority,
      deadline: deadline.toISOString(),
      estimatedHours: hours,
      isCompleted: false,
    });
    reset();
    onClose();
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
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>New Task</Text>
          <TouchableOpacity onPress={handleAdd}>
            <Text style={[styles.addText, { color: colors.primary }]}>Add</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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
                  <Text
                    style={[
                      styles.priorityBtnText,
                      { color: priority === p.key ? "#fff" : colors.mutedForeground },
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>DEADLINE</Text>
            <View style={styles.dateRow}>
              <Feather name="calendar" size={16} color={colors.primary} />
              <Text style={[styles.dateText, { color: colors.foreground }]}>
                {deadline.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
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

          <View style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>ESTIMATED TIME</Text>
            <View style={styles.hoursRow}>
              <TextInput
                style={[styles.hoursInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
                value={estimatedHours}
                onChangeText={setEstimatedHours}
                keyboardType="decimal-pad"
              />
              <Text style={[styles.hoursLabel, { color: colors.mutedForeground }]}>hours</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    paddingTop: Platform.OS === "android" ? 40 : 16,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  cancelText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  addText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 12,
  },
  field: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
  },
  input: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    paddingVertical: 4,
  },
  textArea: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    paddingVertical: 4,
    minHeight: 70,
    textAlignVertical: "top",
  },
  priorityRow: {
    flexDirection: "row",
    gap: 8,
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
  },
  priorityBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  hoursRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  hoursInput: {
    width: 70,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 18,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  hoursLabel: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
});
