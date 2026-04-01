import DateTimePicker from "@react-native-community/datetimepicker";
import { Clock, Calendar, ChevronRight, ArrowRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Task } from "../context/AppContext";
import { useColors } from "../hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface RescheduleModalProps {
  task: Task | null;
  visible: boolean;
  onClose: () => void;
  onReschedule: (taskId: string, start: Date, end: Date) => void;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MINUTE_OPTIONS = [0, 15, 30, 45];

function formatHour(h: number, m: number) {
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const min = m.toString().padStart(2, "0");
  return `${hour12}:${min} ${period}`;
}

export function RescheduleModal({ task, visible, onClose, onReschedule }: RescheduleModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [date, setDate] = useState(new Date());
  const [startHour, setStartHour] = useState(9);
  const [startMinute, setStartMinute] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);

  if (!task) return null;

  const estimatedMs = task.estimatedHours * 60 * 60 * 1000;

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const start = new Date(date);
    start.setHours(startHour, startMinute, 0, 0);
    const end = new Date(start.getTime() + estimatedMs);
    onReschedule(task.id, start, end);
    onClose();
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours % 1 === 0) return `${hours} hr`;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} transparent={false}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: Math.max(insets.top, Platform.OS === "android" ? 40 : 20) }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Reschedule</Text>
          <TouchableOpacity onPress={handleConfirm}>
            <Text style={[styles.confirmText, { color: colors.primary }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={[styles.taskInfo, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.taskTitle, { color: colors.foreground }]} numberOfLines={1}>
              {task.title}
            </Text>
            <View style={styles.taskMeta}>
              <Clock size={13} color={colors.mutedForeground} />
              <Text style={[styles.taskDuration, { color: colors.mutedForeground }]}>
                {formatDuration(task.estimatedHours)}
              </Text>
            </View>
          </View>

          {/* Date */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>NEW DATE</Text>
            {Platform.OS === "web" ? (
              <View style={styles.dateBtn}>
                <Calendar size={18} color={colors.primary} />
                {/* @ts-ignore – native HTML input works fine on web via React Native Web */}
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={date.toISOString().split("T")[0]}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    if (e.target.value) setDate(new Date(e.target.value + "T12:00:00"));
                  }}
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: 15,
                    fontFamily: "Inter_400Regular",
                    color: colors.foreground,
                    cursor: "pointer",
                  }}
                />
              </View>
            ) : Platform.OS === "ios" ? (
              <View style={styles.dateBtn}>
                <Calendar size={18} color={colors.primary} />
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="compact"
                  minimumDate={new Date()}
                  onChange={(_, d) => { if (d) setDate(d); }}
                  style={{ flex: 1 }}
                />
              </View>
            ) : (
              <>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                  <Calendar size={18} color={colors.primary} />
                  <Text style={[styles.dateBtnText, { color: colors.foreground }]}>
                    {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                  </Text>
                  <ChevronRight size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    minimumDate={new Date()}
                    onChange={(_, d) => {
                      setShowDatePicker(false);
                      if (d) setDate(d);
                    }}
                  />
                )}
              </>
            )}
          </View>

          {/* Time */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>START TIME</Text>
            <Text style={[styles.selectedTime, { color: colors.primary }]}>
              {formatHour(startHour, startMinute)}
            </Text>

            <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Hour</Text>
            <View style={styles.hourGrid}>
              {HOUR_OPTIONS.map((h) => (
                <Pressable
                  key={h}
                  style={[
                    styles.hourBtn,
                    {
                      backgroundColor: startHour === h ? colors.primary : colors.muted,
                      borderColor: startHour === h ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => { Haptics.selectionAsync(); setStartHour(h); }}
                >
                  <Text style={[styles.hourBtnText, { color: startHour === h ? "#fff" : colors.foreground }]}>
                    {h === 0 ? "12a" : h === 12 ? "12p" : h < 12 ? `${h}a` : `${h - 12}p`}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Minute</Text>
            <View style={styles.minuteRow}>
              {MINUTE_OPTIONS.map((m) => (
                <Pressable
                  key={m}
                  style={[
                    styles.minuteBtn,
                    {
                      backgroundColor: startMinute === m ? colors.primary : colors.muted,
                      borderColor: startMinute === m ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => { Haptics.selectionAsync(); setStartMinute(m); }}
                >
                  <Text style={[styles.minuteBtnText, { color: startMinute === m ? "#fff" : colors.foreground }]}>
                    :{m.toString().padStart(2, "0")}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={[styles.endPreview, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <ArrowRight size={14} color={colors.mutedForeground} />
            <Text style={[styles.endPreviewText, { color: colors.mutedForeground }]}>
              Ends at{" "}
              {(() => {
                const start = new Date(date);
                start.setHours(startHour, startMinute, 0, 0);
                const end = new Date(start.getTime() + estimatedMs);
                return formatHour(end.getHours(), end.getMinutes());
              })()}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  cancelText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  confirmText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  content: { flex: 1, padding: 20, gap: 14 },
  taskInfo: {
    borderRadius: 14, borderWidth: 1,
    padding: 14, gap: 4,
  },
  taskTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  taskMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  taskDuration: { fontSize: 13, fontFamily: "Inter_400Regular" },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
  dateBtn: { flexDirection: "row", alignItems: "center", gap: 10 },
  dateBtnText: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  selectedTime: { fontSize: 28, fontFamily: "Inter_700Bold" },
  subLabel: { fontSize: 11, fontFamily: "Inter_500Medium", letterSpacing: 0.5 },
  hourGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  hourBtn: {
    width: 42, height: 36, borderRadius: 8, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  hourBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  minuteRow: { flexDirection: "row", gap: 8 },
  minuteBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  minuteBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  endPreview: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 12, borderWidth: 1,
  },
  endPreviewText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
