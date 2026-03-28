import { create } from "zustand";
import type { WorkoutExercise, ExerciseSet, Exercise } from "@/types/database";

interface WorkoutBuilderState {
  name: string;
  description: string;
  exercises: WorkoutExercise[];

  setName: (name: string) => void;
  setDescription: (description: string) => void;
  addExercise: (exercise: Exercise) => void;
  removeExercise: (index: number) => void;
  moveExercise: (fromIndex: number, toIndex: number) => void;
  updateExerciseNotes: (index: number, notes: string) => void;
  addSet: (exerciseIndex: number) => void;
  removeSet: (exerciseIndex: number, setIndex: number) => void;
  updateSet: (
    exerciseIndex: number,
    setIndex: number,
    updates: Partial<ExerciseSet>
  ) => void;
  reset: () => void;
  loadTemplate: (name: string, description: string, exercises: WorkoutExercise[]) => void;
}

function createDefaultSet(setNumber: number): ExerciseSet {
  return {
    set_number: setNumber,
    set_type: "standard",
    reps: 10,
    weight: null,
    duration_seconds: null,
    rest_seconds: 60,
    rpe: null,
  };
}

export const useWorkoutBuilderStore = create<WorkoutBuilderState>((set) => ({
  name: "",
  description: "",
  exercises: [],

  setName: (name) => set({ name }),
  setDescription: (description) => set({ description }),

  addExercise: (exercise) =>
    set((state) => ({
      exercises: [
        ...state.exercises,
        {
          exercise_id: exercise.id,
          exercise_name: exercise.name,
          order: state.exercises.length,
          sets: [createDefaultSet(1), createDefaultSet(2), createDefaultSet(3)],
          notes: null,
          superset_group: null,
        },
      ],
    })),

  removeExercise: (index) =>
    set((state) => ({
      exercises: state.exercises
        .filter((_, i) => i !== index)
        .map((ex, i) => ({ ...ex, order: i })),
    })),

  moveExercise: (fromIndex, toIndex) =>
    set((state) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= state.exercises.length ||
        toIndex >= state.exercises.length
      )
        return state;
      const exercises = [...state.exercises];
      const [moved] = exercises.splice(fromIndex, 1);
      exercises.splice(toIndex, 0, moved);
      return {
        exercises: exercises.map((ex, i) => ({ ...ex, order: i })),
      };
    }),

  updateExerciseNotes: (index, notes) =>
    set((state) => ({
      exercises: state.exercises.map((ex, i) =>
        i === index ? { ...ex, notes: notes || null } : ex
      ),
    })),

  addSet: (exerciseIndex) =>
    set((state) => ({
      exercises: state.exercises.map((ex, i) =>
        i === exerciseIndex
          ? {
              ...ex,
              sets: [...ex.sets, createDefaultSet(ex.sets.length + 1)],
            }
          : ex
      ),
    })),

  removeSet: (exerciseIndex, setIndex) =>
    set((state) => ({
      exercises: state.exercises.map((ex, i) =>
        i === exerciseIndex
          ? {
              ...ex,
              sets: ex.sets
                .filter((_, si) => si !== setIndex)
                .map((s, si) => ({ ...s, set_number: si + 1 })),
            }
          : ex
      ),
    })),

  updateSet: (exerciseIndex, setIndex, updates) =>
    set((state) => ({
      exercises: state.exercises.map((ex, i) =>
        i === exerciseIndex
          ? {
              ...ex,
              sets: ex.sets.map((s, si) =>
                si === setIndex ? { ...s, ...updates } : s
              ),
            }
          : ex
      ),
    })),

  reset: () => set({ name: "", description: "", exercises: [] }),

  loadTemplate: (name, description, exercises) =>
    set({ name, description, exercises }),
}));
