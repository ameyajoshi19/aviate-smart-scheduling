import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { DayAvailability, DayKey, TimeSlot, WeekAvailability } from "../context/AppContext";
import { useColors } from "../hooks/useColors";

const DAY_LABELS: Record<DayKey, string> = {
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
  thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday",
};
const DAY_SHORT: Record<DayKey, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed",
  thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun",
};

const DAYS: DayKey[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatHour(h: number) {
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

function formatSlot(slot: TimeSlot) {
  return `${formatHour(slot.startHour)} → ${formatHour(slot.endHour)}`;
}

interface TimePickerModalProps {
  visible: boolean;
  title: string;
  selected: number;
  minHour?: number;
  onSelect: (h: number) => void;
  onClose: () => void;
}

function TimePickerModal({ visible, title, selected, minHour = 0, onSelect, onClose }: TimePickerModalProps) {
  const colors = useColors();
  const available = HOURS.filter((h) => h >= minHour);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.pickerModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.pickerTitle, { color: colors.foreground }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.pickerGrid} showsVerticalScrollIndicator={false}>
            {available.map((h) => (
              <Pressable
                key={h}
                style={[
                  styles.timeBtn,
                  {
                    backgroundColor: selected === h ? colors.primary : colors.muted,
                    borderColor: selected === h ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  onSelect(h);
                  onClose();
                }}
              >
                <Text style={[styles.timeBtnText, { color: selected === h ? "#fff" : colors.foreground }]}>
                  {formatHour(h)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

interface TimeSlotRowProps {
  slot: TimeSlot;
  onChangeStart: (h: number) => void;
  onChangeEnd: (h: number) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function TimeSlotRow({ slot, onChangeStart, onChangeEnd, onRemove, canRemove }: TimeSlotRowProps) {
  const colors = useColors();
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  return (
    <View style={styles.slotRow}>
      <TouchableOpacity
        style={[styles.timeField, { backgroundColor: colors.accent, borderColor: colors.primary + "50" }]}
        onPress={() => { Haptics.selectionAsync(); setShowStart(true); }}
      >
        <Feather name="sunrise" size={13} color={colors.primary} />
        <Text style={[styles.timeFieldText, { color: colors.primary }]}>
          {formatHour(slot.startHour)}
        </Text>
      </TouchableOpacity>

      <Feather name="arrow-right" size={14} color={colors.mutedForeground} />

      <TouchableOpacity
        style={[styles.timeField, { backgroundColor: colors.accent, borderColor: colors.primary + "50" }]}
        onPress={() => { Haptics.selectionAsync(); setShowEnd(true); }}
      >
        <Feather name="sunset" size={13} color={colors.primary} />
        <Text style={[styles.timeFieldText, { color: colors.primary }]}>
          {formatHour(slot.endHour)}
        </Text>
      </TouchableOpacity>

      {canRemove && (
        <TouchableOpacity onPress={onRemove} hitSlop={8}>
          <Feather name="trash-2" size={15} color={colors.destructive} />
        </TouchableOpacity>
      )}

      <TimePickerModal
        visible={showStart}
        title="Start Time"
        selected={slot.startHour}
        onSelect={onChangeStart}
        onClose={() => setShowStart(false)}
      />
      <TimePickerModal
        visible={showEnd}
        title="End Time"
        selected={slot.endHour}
        minHour={slot.startHour + 1}
        onSelect={onChangeEnd}
        onClose={() => setShowEnd(false)}
      />
    </View>
  );
}

interface AvailabilityEditorProps {
  availability: WeekAvailability;
  onChange: (avail: WeekAvailability) => void;
}

export function AvailabilityEditor({ availability, onChange }: AvailabilityEditorProps) {
  const colors = useColors();

  const updateDay = (day: DayKey, update: Partial<DayAvailability>) => {
    onChange({ ...availability, [day]: { ...availability[day], ...update } });
  };

  const updateSlot = (day: DayKey, idx: number, update: Partial<TimeSlot>) => {
    const slots = [...availability[day].slots];
    slots[idx] = { ...slots[idx], ...update };
    updateDay(day, { slots });
  };

  const addSlot = (day: DayKey) => {
    const slots = [...availability[day].slots];
    const lastEnd = slots[slots.length - 1]?.endHour ?? 9;
    const start = Math.min(lastEnd + 1, 22);
    const end = Math.min(start + 2, 23);
    slots.push({ startHour: start, endHour: end });
    updateDay(day, { slots });
  };

  const removeSlot = (day: DayKey, idx: number) => {
    const slots = availability[day].slots.filter((_, i) => i !== idx);
    updateDay(day, { slots });
  };

  const totalHours = DAYS.reduce((sum, day) => {
    const avail = availability[day];
    if (!avail.enabled) return sum;
    return sum + avail.slots.reduce((s, slot) => s + (slot.endHour - slot.startHour), 0);
  }, 0);

  return (
    <View style={styles.container}>
      <View style={[styles.summaryRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: colors.primary }]}>
            {DAYS.filter((d) => availability[d].enabled).length}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Active days</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: colors.primary }]}>{totalHours}h</Text>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Weekly hours</Text>
        </View>
      </View>

      {DAYS.map((day) => {
        const avail = availability[day];
        return (
          <View key={day} style={[styles.dayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.dayHeader}>
              <View style={styles.dayLabelRow}>
                <View style={[styles.dayDot, { backgroundColor: avail.enabled ? colors.primary : colors.border }]} />
                <Text style={[styles.dayLabel, { color: colors.foreground }]}>{DAY_LABELS[day]}</Text>
                {avail.enabled && (
                  <Text style={[styles.dayHours, { color: colors.mutedForeground }]}>
                    {avail.slots.reduce((s, slot) => s + (slot.endHour - slot.startHour), 0)}h
                  </Text>
                )}
              </View>
              <Switch
                value={avail.enabled}
                onValueChange={(v) => {
                  Haptics.selectionAsync();
                  updateDay(day, { enabled: v });
                }}
                trackColor={{ false: colors.border, true: colors.primary + "88" }}
                thumbColor={avail.enabled ? colors.primary : colors.mutedForeground}
              />
            </View>

            {avail.enabled && (
              <View style={styles.slotsContainer}>
                {avail.slots.map((slot, i) => (
                  <TimeSlotRow
                    key={i}
                    slot={slot}
                    onChangeStart={(h) => updateSlot(day, i, { startHour: h, endHour: Math.max(slot.endHour, h + 1) })}
                    onChangeEnd={(h) => updateSlot(day, i, { endHour: h })}
                    onRemove={() => removeSlot(day, i)}
                    canRemove={avail.slots.length > 1}
                  />
                ))}
                {avail.slots.length < 3 && (
                  <TouchableOpacity
                    style={[styles.addSlotBtn, { borderColor: colors.primary }]}
                    onPress={() => addSlot(day)}
                  >
                    <Feather name="plus" size={13} color={colors.primary} />
                    <Text style={[styles.addSlotText, { color: colors.primary }]}>Add slot</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  summaryRow: {
    flexDirection: "row", borderRadius: 14, borderWidth: 1,
    padding: 16, justifyContent: "space-around", marginBottom: 4,
  },
  summaryItem: { alignItems: "center", gap: 2 },
  summaryNum: { fontSize: 24, fontFamily: "Inter_700Bold" },
  summaryLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  summaryDivider: { width: 1, height: "80%" },
  dayCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  dayHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dayLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dayDot: { width: 8, height: 8, borderRadius: 4 },
  dayLabel: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  dayHours: { fontSize: 13, fontFamily: "Inter_400Regular" },
  slotsContainer: { gap: 10 },
  slotRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  timeField: {
    flex: 1, flexDirection: "row", alignItems: "center",
    gap: 6, paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 12, borderWidth: 1.5,
  },
  timeFieldText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  addSlotBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 10, borderWidth: 1, borderStyle: "dashed", alignSelf: "flex-start",
  },
  addSlotText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center", alignItems: "center",
    padding: 24,
  },
  pickerModal: {
    width: "100%", maxHeight: 420,
    borderRadius: 20, borderWidth: 1,
    overflow: "hidden",
  },
  pickerHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
  },
  pickerTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  pickerGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 16 },
  timeBtn: {
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1,
    minWidth: 72, alignItems: "center",
  },
  timeBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
