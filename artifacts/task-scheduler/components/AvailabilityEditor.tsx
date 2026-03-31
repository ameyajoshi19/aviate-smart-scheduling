import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
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
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const DAYS: DayKey[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatHour(h: number) {
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
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
  return (
    <View style={styles.slotRow}>
      <View style={[styles.timeSelect, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {HOURS.map((h) => (
            <TouchableOpacity
              key={h}
              style={[styles.hourBtn, slot.startHour === h && { backgroundColor: colors.primary }]}
              onPress={() => {
                Haptics.selectionAsync();
                onChangeStart(h);
              }}
            >
              <Text
                style={[
                  styles.hourBtnText,
                  { color: slot.startHour === h ? colors.primaryForeground : colors.mutedForeground },
                ]}
              >
                {formatHour(h)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <Text style={[styles.toText, { color: colors.mutedForeground }]}>to</Text>
      <View style={[styles.timeSelect, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {HOURS.filter((h) => h > slot.startHour).map((h) => (
            <TouchableOpacity
              key={h}
              style={[styles.hourBtn, slot.endHour === h && { backgroundColor: colors.primary }]}
              onPress={() => {
                Haptics.selectionAsync();
                onChangeEnd(h);
              }}
            >
              <Text
                style={[
                  styles.hourBtnText,
                  { color: slot.endHour === h ? colors.primaryForeground : colors.mutedForeground },
                ]}
              >
                {formatHour(h)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      {canRemove && (
        <TouchableOpacity onPress={onRemove}>
          <Feather name="trash-2" size={16} color={colors.destructive} />
        </TouchableOpacity>
      )}
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

  return (
    <View style={styles.container}>
      {DAYS.map((day) => {
        const avail = availability[day];
        return (
          <View
            key={day}
            style={[styles.dayCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.dayHeader}>
              <Text style={[styles.dayLabel, { color: colors.foreground }]}>{DAY_LABELS[day]}</Text>
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
                    onChangeStart={(h) => updateSlot(day, i, { startHour: h })}
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
                    <Feather name="plus" size={14} color={colors.primary} />
                    <Text style={[styles.addSlotText, { color: colors.primary }]}>Add time slot</Text>
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
  container: {
    gap: 10,
  },
  dayCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayLabel: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  slotsContainer: {
    gap: 10,
  },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeSelect: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    height: 40,
    overflow: "hidden",
  },
  hourBtn: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  hourBtnText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  toText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  addSlotBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    alignSelf: "flex-start",
  },
  addSlotText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
