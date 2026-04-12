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
  public_slug: string | null;
  bio: string | null;
  specialties: string[] | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  created_at: string;
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

export interface BodyMetric {
  id: string;
  client_id: string;
  weight: number | null;
  body_fat: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  biceps: number | null;
  thighs: number | null;
  logged_date: string;
  created_at: string;
}

export interface ProgressPhoto {
  id: string;
  client_id: string;
  photo_url: string;
  pose: "front" | "side" | "back";
  logged_date: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  coach_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: "starter" | "professional" | "enterprise";
  status: "active" | "past_due" | "canceled" | "trialing";
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export type WebhookEventType = 'workout.completed' | 'client.added' | 'client.removed' | 'message.sent';

export interface Webhook {
  id: string;
  coach_id: string;
  event_type: WebhookEventType;
  url: string;
  secret: string | null;
  active: boolean;
  created_at: string;
}

export interface ConversationParticipant {
  conversation_id: string;
  user_id: string;
  joined_at: string;
}

export interface Document {
  id: string;
  coach_id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
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
          push_token?: string | null;
          nutrition_goals?: MacroGoals | null;
          public_slug?: string | null;
          bio?: string | null;
          specialties?: string[] | null;
          organization_id?: string | null;
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
          public_slug?: string | null;
          bio?: string | null;
          specialties?: string[] | null;
          organization_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      coach_clients: {
        Row: CoachClient;
        Insert: {
          coach_id: string;
          client_id: string;
          status?: CoachClient["status"];
        };
        Update: {
          coach_id?: string;
          client_id?: string;
          status?: CoachClient["status"];
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
          status?: AssignedWorkout["status"];
        };
        Update: {
          name?: string;
          scheduled_date?: string;
          exercises?: WorkoutExercise[];
          status?: AssignedWorkout["status"];
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
          type: Conversation["type"];
          name?: string | null;
          created_by: string;
        };
        Update: {
          name?: string | null;
        };
        Relationships: [];
      };
      conversation_participants: {
        Row: ConversationParticipant;
        Insert: {
          conversation_id: string;
          user_id: string;
        };
        Update: {
          conversation_id?: string;
          user_id?: string;
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
          voice_url?: string | null;
          image_url?: string | null;
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
          frequency: Habit["frequency"];
        };
        Update: {
          name?: string;
          description?: string | null;
          frequency?: Habit["frequency"];
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
      body_metrics: {
        Row: BodyMetric;
        Insert: {
          client_id: string;
          logged_date: string;
          weight?: number | null;
          body_fat?: number | null;
          chest?: number | null;
          waist?: number | null;
          hips?: number | null;
          biceps?: number | null;
          thighs?: number | null;
        };
        Update: {
          weight?: number | null;
          body_fat?: number | null;
          chest?: number | null;
          waist?: number | null;
          hips?: number | null;
          biceps?: number | null;
          thighs?: number | null;
        };
        Relationships: [];
      };
      progress_photos: {
        Row: ProgressPhoto;
        Insert: {
          client_id: string;
          photo_url: string;
          pose: ProgressPhoto["pose"];
          logged_date: string;
        };
        Update: {
          photo_url?: string;
          pose?: ProgressPhoto["pose"];
        };
        Relationships: [];
      };
      documents: {
        Row: Document;
        Insert: {
          coach_id: string;
          client_id?: string | null;
          title: string;
          description?: string | null;
          file_url: string;
          file_type?: string;
        };
        Update: {
          client_id?: string | null;
          title?: string;
          description?: string | null;
          file_url?: string;
          file_type?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: Subscription;
        Insert: {
          coach_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: Subscription["plan"];
          status?: Subscription["status"];
          current_period_end?: string | null;
        };
        Update: {
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: Subscription["plan"];
          status?: Subscription["status"];
          current_period_end?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      webhooks: {
        Row: Webhook;
        Insert: {
          coach_id: string;
          event_type: WebhookEventType;
          url: string;
          secret?: string | null;
          active?: boolean;
        };
        Update: {
          event_type?: WebhookEventType;
          url?: string;
          secret?: string | null;
          active?: boolean;
        };
        Relationships: [];
      };
      organizations: {
        Row: Organization;
        Insert: {
          name: string;
          slug: string;
          logo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          logo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
