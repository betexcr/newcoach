export type UserRole = "coach" | "client";

export interface MacroGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole | null;
  push_token: string | null;
  nutrition_goals: MacroGoals | null;
  created_at: string;
  updated_at: string;
}

export interface CoachClient {
  id: string;
  coach_id: string;
  client_id: string;
  status: "active" | "inactive" | "pending";
  created_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  muscle_group: string;
  equipment: string | null;
  created_by: string | null;
  is_custom: boolean;
  created_at: string;
}

export interface WorkoutTemplate {
  id: string;
  coach_id: string;
  name: string;
  description: string | null;
  exercises: WorkoutExercise[];
  created_at: string;
  updated_at: string;
}

export interface WorkoutExercise {
  exercise_id: string;
  exercise_name: string;
  order: number;
  sets: ExerciseSet[];
  notes: string | null;
  superset_group: number | null;
}

export interface ExerciseSet {
  set_number: number;
  set_type: "standard" | "warmup" | "dropset" | "amrap" | "timed";
  reps: number | null;
  weight: number | null;
  duration_seconds: number | null;
  rest_seconds: number | null;
  rpe: number | null;
}

export interface Program {
  id: string;
  coach_id: string;
  name: string;
  description: string | null;
  duration_weeks: number;
  created_at: string;
  updated_at: string;
}

export interface ProgramWorkout {
  id: string;
  program_id: string;
  week_number: number;
  day_number: number;
  name: string;
  exercises: WorkoutExercise[];
}

export interface AssignedWorkout {
  id: string;
  coach_id: string;
  client_id: string;
  program_id: string | null;
  name: string;
  scheduled_date: string;
  exercises: WorkoutExercise[];
  status: "pending" | "completed" | "missed" | "partial";
  created_at: string;
}

export interface WorkoutResult {
  id: string;
  assigned_workout_id: string;
  client_id: string;
  logged_sets: LoggedExercise[];
  notes: string | null;
  completed_at: string;
}

export interface LoggedExercise {
  exercise_id: string;
  exercise_name: string;
  sets: LoggedSet[];
}

export interface LoggedSet {
  set_number: number;
  reps: number | null;
  weight: number | null;
  duration_seconds: number | null;
  rpe: number | null;
  completed: boolean;
}

export interface Conversation {
  id: string;
  type: "direct" | "group" | "broadcast";
  name: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  voice_url: string | null;
  image_url: string | null;
  created_at: string;
}

export interface Habit {
  id: string;
  coach_id: string;
  client_id: string;
  name: string;
  description: string | null;
  frequency: "daily" | "weekly" | "monthly";
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  logged_date: string;
  completed: boolean;
}

export interface NutritionLog {
  id: string;
  client_id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal: string;
  logged_date: string;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole | null;
          push_token?: string | null;
          nutrition_goals?: MacroGoals | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      coach_clients: {
        Row: CoachClient;
        Insert: {
          coach_id: string;
          client_id: string;
          status?: string;
        };
        Update: {
          coach_id?: string;
          client_id?: string;
          status?: string;
        };
        Relationships: [];
      };
      exercises: {
        Row: Exercise;
        Insert: {
          name: string;
          muscle_group: string;
          description?: string | null;
          video_url?: string | null;
          thumbnail_url?: string | null;
          equipment?: string | null;
          created_by?: string | null;
          is_custom?: boolean;
        };
        Update: {
          name?: string;
          muscle_group?: string;
          description?: string | null;
          video_url?: string | null;
          thumbnail_url?: string | null;
          equipment?: string | null;
          is_custom?: boolean;
        };
        Relationships: [];
      };
      workout_templates: {
        Row: WorkoutTemplate;
        Insert: {
          coach_id: string;
          name: string;
          description?: string | null;
          exercises?: WorkoutExercise[];
        };
        Update: {
          name?: string;
          description?: string | null;
          exercises?: WorkoutExercise[];
        };
        Relationships: [];
      };
      programs: {
        Row: Program;
        Insert: {
          coach_id: string;
          name: string;
          description?: string | null;
          duration_weeks?: number;
        };
        Update: {
          name?: string;
          description?: string | null;
          duration_weeks?: number;
        };
        Relationships: [];
      };
      program_workouts: {
        Row: ProgramWorkout;
        Insert: {
          program_id: string;
          week_number: number;
          day_number: number;
          name: string;
          exercises?: WorkoutExercise[];
        };
        Update: {
          week_number?: number;
          day_number?: number;
          name?: string;
          exercises?: WorkoutExercise[];
        };
        Relationships: [];
      };
      assigned_workouts: {
        Row: AssignedWorkout;
        Insert: {
          coach_id: string;
          client_id: string;
          name: string;
          scheduled_date: string;
          exercises?: WorkoutExercise[];
          program_id?: string | null;
          status?: string;
        };
        Update: {
          name?: string;
          scheduled_date?: string;
          exercises?: WorkoutExercise[];
          status?: string;
        };
        Relationships: [];
      };
      workout_results: {
        Row: WorkoutResult;
        Insert: {
          assigned_workout_id: string;
          client_id: string;
          logged_sets?: LoggedExercise[];
          notes?: string | null;
          completed_at?: string;
        };
        Update: {
          logged_sets?: LoggedExercise[];
          notes?: string | null;
        };
        Relationships: [];
      };
      conversations: {
        Row: Conversation;
        Insert: {
          type: string;
          name?: string | null;
          created_by: string;
        };
        Update: {
          name?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: Message;
        Insert: {
          conversation_id: string;
          sender_id: string;
          body?: string | null;
          voice_url?: string | null;
          image_url?: string | null;
        };
        Update: {
          body?: string | null;
        };
        Relationships: [];
      };
      habits: {
        Row: Habit;
        Insert: {
          coach_id: string;
          client_id: string;
          name: string;
          description?: string | null;
          frequency: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          frequency?: string;
        };
        Relationships: [];
      };
      habit_logs: {
        Row: HabitLog;
        Insert: {
          habit_id: string;
          logged_date: string;
          completed?: boolean;
        };
        Update: {
          completed?: boolean;
        };
        Relationships: [];
      };
      nutrition_logs: {
        Row: NutritionLog;
        Insert: {
          client_id: string;
          name: string;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          meal: string;
          logged_date: string;
        };
        Update: {
          name?: string;
          calories?: number;
          protein?: number;
          carbs?: number;
          fat?: number;
          meal?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
