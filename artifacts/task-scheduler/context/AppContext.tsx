import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Priority = "high" | "medium" | "low";

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  deadline: string;
  estimatedHours: number;
  isCompleted: boolean;
  scheduledStart?: string;
  scheduledEnd?: string;
  googleEventId?: string;
  createdAt: string;
}

export interface TimeSlot {
  startHour: number;
  endHour: number;
}

export type DayAvailability = {
  enabled: boolean;
  slots: TimeSlot[];
};

export type WeekAvailability = {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
};

export type DayKey = keyof WeekAvailability;

const DEFAULT_AVAILABILITY: WeekAvailability = {
  monday: { enabled: true, slots: [{ startHour: 9, endHour: 12 }, { startHour: 14, endHour: 18 }] },
  tuesday: { enabled: true, slots: [{ startHour: 9, endHour: 12 }, { startHour: 14, endHour: 18 }] },
  wednesday: { enabled: true, slots: [{ startHour: 9, endHour: 12 }, { startHour: 14, endHour: 18 }] },
  thursday: { enabled: true, slots: [{ startHour: 9, endHour: 12 }, { startHour: 14, endHour: 18 }] },
  friday: { enabled: true, slots: [{ startHour: 9, endHour: 12 }, { startHour: 14, endHour: 17 }] },
  saturday: { enabled: false, slots: [{ startHour: 10, endHour: 13 }] },
  sunday: { enabled: false, slots: [{ startHour: 10, endHour: 13 }] },
};

const TASKS_KEY = "@tasks";
const AVAILABILITY_KEY = "@availability";

interface AppContextValue {
  tasks: Task[];
  availability: WeekAvailability;
  addTask: (task: Omit<Task, "id" | "createdAt">) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  saveAvailability: (avail: WeekAvailability) => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [availability, setAvailability] = useState<WeekAvailability>(DEFAULT_AVAILABILITY);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksRaw, availRaw] = await Promise.all([
        AsyncStorage.getItem(TASKS_KEY),
        AsyncStorage.getItem(AVAILABILITY_KEY),
      ]);
      if (tasksRaw) setTasks(JSON.parse(tasksRaw));
      if (availRaw) setAvailability(JSON.parse(availRaw));
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  };

  const saveTasks = async (updated: Task[]) => {
    setTasks(updated);
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updated));
  };

  const addTask = useCallback(async (task: Omit<Task, "id" | "createdAt">) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    await saveTasks([...tasks, newTask]);
  }, [tasks]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
    await saveTasks(updated);
  }, [tasks]);

  const deleteTask = useCallback(async (id: string) => {
    await saveTasks(tasks.filter((t) => t.id !== id));
  }, [tasks]);

  const saveAvailability = useCallback(async (avail: WeekAvailability) => {
    setAvailability(avail);
    await AsyncStorage.setItem(AVAILABILITY_KEY, JSON.stringify(avail));
  }, []);

  return (
    <AppContext.Provider value={{ tasks, availability, addTask, updateTask, deleteTask, saveAvailability, isLoading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
