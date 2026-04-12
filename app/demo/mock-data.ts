import type {
  Profile,
  Exercise,
  WorkoutTemplate,
  WorkoutExercise,
  ExerciseSet,
  AssignedWorkout,
  WorkoutResult,
  Program,
  ProgramWorkout,
  Conversation,
  Message,
  Habit,
  HabitLog,
  NutritionLog,
  MacroGoals,
} from "@/types/database";
import type { ClientWithProfile } from "@/lib/queries/clients";

function daysFromNow(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

function isoAgo(hours: number): string {
  return new Date(Date.now() - hours * 3600_000).toISOString();
}

const today = daysFromNow(0);

// ── IDs ──────────────────────────────────────────────────────────────────────
const COACH_ID = "c0a00000-0000-4000-a000-000000000001";
const CLIENT_1_ID = "c1a00000-0000-4000-a000-000000000001";
const CLIENT_2_ID = "c1a00000-0000-4000-a000-000000000002";
const CLIENT_3_ID = "c1a00000-0000-4000-a000-000000000003";
const CLIENT_4_ID = "c1a00000-0000-4000-a000-000000000004";

// ── Profiles ─────────────────────────────────────────────────────────────────
export const coachProfile: Profile = {
  id: COACH_ID,
  email: "alex@newcoach.co",
  full_name: "Alex Coach",
  avatar_url: null,
  role: "coach",
  push_token: null,
  nutrition_goals: null,
  public_slug: "alex-coach",
  bio: "Certified personal trainer specializing in strength & conditioning",
  specialties: ["Strength Training", "Weight Loss", "Mobility"],
  organization_id: null,
  created_at: "2025-06-01T10:00:00Z",
  updated_at: "2026-04-01T10:00:00Z",
};

export const clientProfile: Profile = {
  id: CLIENT_1_ID,
  email: "jordan@email.com",
  full_name: "Jordan Athlete",
  avatar_url: null,
  role: "client",
  push_token: null,
  nutrition_goals: { calories: 2400, protein: 180, carbs: 280, fat: 65 },
  public_slug: null,
  bio: null,
  specialties: null,
  organization_id: null,
  created_at: "2025-08-15T10:00:00Z",
  updated_at: "2026-04-10T10:00:00Z",
};

const client2Profile: Profile = {
  id: CLIENT_2_ID,
  email: "sam@email.com",
  full_name: "Sam Rivera",
  avatar_url: null,
  role: "client",
  push_token: null,
  nutrition_goals: null,
  public_slug: null,
  bio: null,
  specialties: null,
  organization_id: null,
  created_at: "2026-01-10T10:00:00Z",
  updated_at: "2026-04-08T10:00:00Z",
};

const client3Profile: Profile = {
  id: CLIENT_3_ID,
  email: "taylor@email.com",
  full_name: "Taylor Kim",
  avatar_url: null,
  role: "client",
  push_token: null,
  nutrition_goals: null,
  public_slug: null,
  bio: null,
  specialties: null,
  organization_id: null,
  created_at: "2026-03-20T10:00:00Z",
  updated_at: "2026-04-05T10:00:00Z",
};

const client4Profile: Profile = {
  id: CLIENT_4_ID,
  email: "casey@email.com",
  full_name: "Casey Morgan",
  avatar_url: null,
  role: "client",
  push_token: null,
  nutrition_goals: null,
  public_slug: null,
  bio: null,
  specialties: null,
  organization_id: null,
  created_at: "2026-04-01T10:00:00Z",
  updated_at: "2026-04-11T10:00:00Z",
};

// ── Coach Clients ────────────────────────────────────────────────────────────
export const demoClients: ClientWithProfile[] = [
  { id: "rel-001", coach_id: COACH_ID, client_id: CLIENT_1_ID, status: "active", created_at: "2025-08-15T10:00:00Z", profile: clientProfile },
  { id: "rel-002", coach_id: COACH_ID, client_id: CLIENT_2_ID, status: "active", created_at: "2026-01-10T10:00:00Z", profile: client2Profile },
  { id: "rel-003", coach_id: COACH_ID, client_id: CLIENT_3_ID, status: "pending", created_at: "2026-03-20T10:00:00Z", profile: client3Profile },
  { id: "rel-004", coach_id: COACH_ID, client_id: CLIENT_4_ID, status: "inactive", created_at: "2026-04-01T10:00:00Z", profile: client4Profile },
];

// ── Exercises ────────────────────────────────────────────────────────────────
const exerciseDefs: { id: string; i18nKey: string; muscle_group: string; equipment: string }[] = [
  { id: "ex-001", i18nKey: "barbellBenchPress", muscle_group: "chest", equipment: "barbell" },
  { id: "ex-002", i18nKey: "barbellBackSquat", muscle_group: "legs", equipment: "barbell" },
  { id: "ex-003", i18nKey: "barbellDeadlift", muscle_group: "back", equipment: "barbell" },
  { id: "ex-004", i18nKey: "overheadPress", muscle_group: "shoulders", equipment: "barbell" },
  { id: "ex-005", i18nKey: "barbellRow", muscle_group: "back", equipment: "barbell" },
  { id: "ex-006", i18nKey: "latPulldown", muscle_group: "back", equipment: "cable" },
  { id: "ex-007", i18nKey: "romanianDeadlift", muscle_group: "legs", equipment: "barbell" },
  { id: "ex-008", i18nKey: "dumbbellCurl", muscle_group: "arms", equipment: "dumbbell" },
  { id: "ex-009", i18nKey: "tricepPushdown", muscle_group: "arms", equipment: "cable" },
  { id: "ex-010", i18nKey: "plank", muscle_group: "core", equipment: "bodyweight" },
  { id: "ex-011", i18nKey: "lateralRaise", muscle_group: "shoulders", equipment: "dumbbell" },
  { id: "ex-012", i18nKey: "legPress", muscle_group: "legs", equipment: "machine" },
];

export function getDemoExercises(t: (key: string) => string): Exercise[] {
  return exerciseDefs.map((def) => ({
    id: def.id,
    name: t(`exerciseCatalog.${def.i18nKey}.name`),
    description: t(`exerciseCatalog.${def.i18nKey}.description`),
    muscle_group: def.muscle_group,
    equipment: def.equipment,
    video_url: null,
    thumbnail_url: null,
    created_by: null,
    is_custom: false,
    created_at: "2025-01-01T00:00:00Z",
  }));
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function stdSets(count: number, reps: number, weight: number): ExerciseSet[] {
  return Array.from({ length: count }, (_, i) => ({
    set_number: i + 1,
    set_type: "standard" as const,
    reps,
    weight,
    duration_seconds: null,
    rest_seconds: 90,
    rpe: null,
  }));
}

function makeWE(exerciseId: string, name: string, order: number, sets: ExerciseSet[], notes: string | null = null): WorkoutExercise {
  return { exercise_id: exerciseId, exercise_name: name, order, sets, notes, superset_group: null };
}

// ── Workout Templates ────────────────────────────────────────────────────────
const upperExercises: WorkoutExercise[] = [
  makeWE("ex-001", "Barbell Bench Press", 1, stdSets(4, 8, 80)),
  makeWE("ex-005", "Barbell Row", 2, stdSets(4, 8, 70)),
  makeWE("ex-004", "Overhead Press", 3, stdSets(3, 10, 50)),
  makeWE("ex-006", "Lat Pulldown", 4, stdSets(3, 12, 55)),
  makeWE("ex-008", "Dumbbell Curl", 5, stdSets(3, 12, 14)),
  makeWE("ex-009", "Tricep Pushdown", 6, stdSets(3, 12, 25)),
];

const lowerExercises: WorkoutExercise[] = [
  makeWE("ex-002", "Barbell Back Squat", 1, stdSets(5, 5, 100)),
  makeWE("ex-007", "Romanian Deadlift", 2, stdSets(4, 8, 80)),
  makeWE("ex-012", "Leg Press", 3, stdSets(3, 12, 150)),
  makeWE("ex-010", "Plank", 4, [{ set_number: 1, set_type: "timed", reps: null, weight: null, duration_seconds: 60, rest_seconds: 60, rpe: null }]),
];

export const demoTemplates: WorkoutTemplate[] = [
  { id: "tpl-001", coach_id: COACH_ID, name: "Upper Body Strength", description: "Compound upper body focus", exercises: upperExercises, created_at: "2026-02-01T10:00:00Z", updated_at: "2026-03-15T10:00:00Z" },
  { id: "tpl-002", coach_id: COACH_ID, name: "Lower Body Power", description: "Squat and deadlift focused", exercises: lowerExercises, created_at: "2026-02-01T10:00:00Z", updated_at: "2026-03-15T10:00:00Z" },
];

// ── Assigned Workouts (week) ─────────────────────────────────────────────────
export const demoAssignedWorkouts: AssignedWorkout[] = [
  { id: "aw-001", coach_id: COACH_ID, client_id: CLIENT_1_ID, program_id: null, name: "Upper Body Strength", scheduled_date: daysFromNow(-2), exercises: upperExercises, status: "completed", created_at: isoAgo(72) },
  { id: "aw-002", coach_id: COACH_ID, client_id: CLIENT_1_ID, program_id: null, name: "Lower Body Power", scheduled_date: daysFromNow(-1), exercises: lowerExercises, status: "completed", created_at: isoAgo(48) },
  { id: "aw-003", coach_id: COACH_ID, client_id: CLIENT_1_ID, program_id: null, name: "Push Day", scheduled_date: today, exercises: [makeWE("ex-001", "Barbell Bench Press", 1, stdSets(4, 6, 85)), makeWE("ex-004", "Overhead Press", 2, stdSets(3, 10, 45)), makeWE("ex-011", "Lateral Raise", 3, stdSets(3, 15, 10)), makeWE("ex-009", "Tricep Pushdown", 4, stdSets(3, 12, 22))], status: "pending", created_at: isoAgo(24) },
  { id: "aw-004", coach_id: COACH_ID, client_id: CLIENT_1_ID, program_id: null, name: "Pull Day", scheduled_date: daysFromNow(2), exercises: [makeWE("ex-003", "Barbell Deadlift", 1, stdSets(5, 3, 120)), makeWE("ex-005", "Barbell Row", 2, stdSets(4, 8, 70)), makeWE("ex-006", "Lat Pulldown", 3, stdSets(3, 10, 60)), makeWE("ex-008", "Dumbbell Curl", 4, stdSets(3, 12, 16))], status: "pending", created_at: isoAgo(12) },
  { id: "aw-005", coach_id: COACH_ID, client_id: CLIENT_1_ID, program_id: null, name: "Active Recovery", scheduled_date: daysFromNow(3), exercises: [makeWE("ex-010", "Plank", 1, [{ set_number: 1, set_type: "timed", reps: null, weight: null, duration_seconds: 60, rest_seconds: 60, rpe: null }, { set_number: 2, set_type: "timed", reps: null, weight: null, duration_seconds: 60, rest_seconds: 60, rpe: null }])], status: "pending", created_at: isoAgo(6) },
  // extra workouts to fill the client's history
  ...Array.from({ length: 18 }, (_, i) => ({
    id: `aw-hist-${i}`,
    coach_id: COACH_ID,
    client_id: CLIENT_1_ID,
    program_id: null,
    name: i % 2 === 0 ? "Upper Body Strength" : "Lower Body Power",
    scheduled_date: daysFromNow(-(i + 3)),
    exercises: i % 2 === 0 ? upperExercises : lowerExercises,
    status: (i < 14 ? "completed" : i < 16 ? "missed" : "partial") as AssignedWorkout["status"],
    created_at: isoAgo((i + 3) * 24),
  })),
];

// ── Workout Results ──────────────────────────────────────────────────────────
export const demoResults: WorkoutResult[] = [
  {
    id: "wr-001", assigned_workout_id: "aw-001", client_id: CLIENT_1_ID,
    logged_sets: [
      { exercise_id: "ex-001", exercise_name: "Barbell Bench Press", sets: [{ set_number: 1, reps: 8, weight: 80, duration_seconds: null, rpe: 7, completed: true }, { set_number: 2, reps: 8, weight: 80, duration_seconds: null, rpe: 8, completed: true }, { set_number: 3, reps: 7, weight: 80, duration_seconds: null, rpe: 9, completed: true }, { set_number: 4, reps: 6, weight: 80, duration_seconds: null, rpe: 9.5, completed: true }] },
      { exercise_id: "ex-005", exercise_name: "Barbell Row", sets: [{ set_number: 1, reps: 8, weight: 70, duration_seconds: null, rpe: 7, completed: true }, { set_number: 2, reps: 8, weight: 70, duration_seconds: null, rpe: 8, completed: true }, { set_number: 3, reps: 8, weight: 70, duration_seconds: null, rpe: 8, completed: true }, { set_number: 4, reps: 7, weight: 70, duration_seconds: null, rpe: 9, completed: true }] },
      { exercise_id: "ex-004", exercise_name: "Overhead Press", sets: [{ set_number: 1, reps: 10, weight: 50, duration_seconds: null, rpe: 7, completed: true }, { set_number: 2, reps: 10, weight: 50, duration_seconds: null, rpe: 8, completed: true }, { set_number: 3, reps: 9, weight: 50, duration_seconds: null, rpe: 9, completed: true }] },
    ],
    notes: "Felt strong today. Bench press grip felt solid.",
    completed_at: `${daysFromNow(-2)}T18:30:00Z`,
  },
  {
    id: "wr-002", assigned_workout_id: "aw-002", client_id: CLIENT_1_ID,
    logged_sets: [
      { exercise_id: "ex-002", exercise_name: "Barbell Back Squat", sets: [{ set_number: 1, reps: 5, weight: 100, duration_seconds: null, rpe: 7, completed: true }, { set_number: 2, reps: 5, weight: 100, duration_seconds: null, rpe: 8, completed: true }, { set_number: 3, reps: 5, weight: 100, duration_seconds: null, rpe: 8.5, completed: true }, { set_number: 4, reps: 4, weight: 100, duration_seconds: null, rpe: 9, completed: true }, { set_number: 5, reps: 4, weight: 100, duration_seconds: null, rpe: 9.5, completed: true }] },
      { exercise_id: "ex-007", exercise_name: "Romanian Deadlift", sets: [{ set_number: 1, reps: 8, weight: 80, duration_seconds: null, rpe: 7, completed: true }, { set_number: 2, reps: 8, weight: 80, duration_seconds: null, rpe: 8, completed: true }, { set_number: 3, reps: 8, weight: 80, duration_seconds: null, rpe: 8, completed: true }, { set_number: 4, reps: 7, weight: 80, duration_seconds: null, rpe: 9, completed: true }] },
    ],
    notes: "Squats felt deep and controlled. Good session overall.",
    completed_at: `${daysFromNow(-1)}T17:45:00Z`,
  },
];

// ── Programs ─────────────────────────────────────────────────────────────────
export const demoProgram: Program = {
  id: "prg-001",
  coach_id: COACH_ID,
  name: "Strength Foundations 4-Week",
  description: "Progressive overload program for intermediate lifters",
  duration_weeks: 4,
  created_at: "2026-02-01T10:00:00Z",
  updated_at: "2026-03-15T10:00:00Z",
};

export const demoProgramWorkouts: ProgramWorkout[] = [
  { id: "pw-001", program_id: "prg-001", week_number: 1, day_number: 1, name: "Upper Strength", exercises: upperExercises },
  { id: "pw-002", program_id: "prg-001", week_number: 1, day_number: 2, name: "Lower Power", exercises: lowerExercises },
  { id: "pw-003", program_id: "prg-001", week_number: 1, day_number: 4, name: "Push Focus", exercises: [makeWE("ex-001", "Barbell Bench Press", 1, stdSets(4, 6, 85)), makeWE("ex-004", "Overhead Press", 2, stdSets(3, 10, 45)), makeWE("ex-011", "Lateral Raise", 3, stdSets(3, 15, 10))] },
  { id: "pw-004", program_id: "prg-001", week_number: 1, day_number: 5, name: "Pull Focus", exercises: [makeWE("ex-003", "Barbell Deadlift", 1, stdSets(5, 3, 120)), makeWE("ex-005", "Barbell Row", 2, stdSets(4, 8, 70)), makeWE("ex-006", "Lat Pulldown", 3, stdSets(3, 10, 60))] },
];

// ── Conversations & Messages ─────────────────────────────────────────────────
export const demoConversations: (Conversation & { last_message?: Message })[] = [
  { id: "conv-001", type: "direct", name: null, created_by: COACH_ID, created_at: isoAgo(72), updated_at: isoAgo(1), last_message: { id: "msg-006", conversation_id: "conv-001", sender_id: COACH_ID, body: "I saw the log — nice work! Today is lower body, take your time warming up.", voice_url: null, image_url: null, created_at: isoAgo(1) } },
  { id: "conv-002", type: "direct", name: null, created_by: COACH_ID, created_at: isoAgo(48), updated_at: isoAgo(3), last_message: { id: "msg-010", conversation_id: "conv-002", sender_id: CLIENT_2_ID, body: "Thanks for the new program! Starting Monday.", voice_url: null, image_url: null, created_at: isoAgo(3) } },
  { id: "conv-003", type: "broadcast", name: "Weekly Motivation", created_by: COACH_ID, created_at: isoAgo(24), updated_at: isoAgo(24), last_message: { id: "msg-011", conversation_id: "conv-003", sender_id: COACH_ID, body: "Crushing it this week team! Keep pushing through your workouts.", voice_url: null, image_url: null, created_at: isoAgo(24) } },
];

export const demoChatMessages: Message[] = [
  { id: "msg-001", conversation_id: "conv-001", sender_id: COACH_ID, body: "Hey Jordan! Welcome aboard. I've set up your first week of training.", voice_url: null, image_url: null, created_at: isoAgo(72) },
  { id: "msg-002", conversation_id: "conv-001", sender_id: CLIENT_1_ID, body: "Thanks Coach! Just checked the plan — looks great. Should I use a belt for squats?", voice_url: null, image_url: null, created_at: isoAgo(48) },
  { id: "msg-003", conversation_id: "conv-001", sender_id: COACH_ID, body: "Great question. Train without a belt until you're comfortable with 1.5x bodyweight. Focus on bracing your core.", voice_url: null, image_url: null, created_at: isoAgo(36) },
  { id: "msg-004", conversation_id: "conv-001", sender_id: CLIENT_1_ID, body: "Got it, will do. Crushed the upper body session yesterday!", voice_url: null, image_url: null, created_at: isoAgo(4) },
  { id: "msg-005", conversation_id: "conv-001", sender_id: COACH_ID, body: null, voice_url: "https://example.com/voice-demo.m4a", image_url: null, created_at: isoAgo(2) },
  { id: "msg-006", conversation_id: "conv-001", sender_id: COACH_ID, body: "I saw the log — nice work! Today is lower body, take your time warming up.", voice_url: null, image_url: null, created_at: isoAgo(1) },
];

// ── Habits ────────────────────────────────────────────────────────────────────
export const demoHabits: Habit[] = [
  { id: "hab-001", coach_id: COACH_ID, client_id: CLIENT_1_ID, name: "Drink 3L water", description: "Stay hydrated throughout the day", frequency: "daily", created_at: "2026-01-01T00:00:00Z" },
  { id: "hab-002", coach_id: COACH_ID, client_id: CLIENT_1_ID, name: "8 hours sleep", description: "Track sleep duration", frequency: "daily", created_at: "2026-01-01T00:00:00Z" },
  { id: "hab-003", coach_id: COACH_ID, client_id: CLIENT_1_ID, name: "10min stretching", description: "Morning mobility routine", frequency: "daily", created_at: "2026-01-01T00:00:00Z" },
  { id: "hab-004", coach_id: COACH_ID, client_id: CLIENT_1_ID, name: "Meal prep", description: "Prepare meals for the next day", frequency: "weekly", created_at: "2026-01-01T00:00:00Z" },
];

export const demoHabitLogs: HabitLog[] = [
  { id: "hl-001", habit_id: "hab-001", logged_date: today, completed: true },
  { id: "hl-002", habit_id: "hab-002", logged_date: today, completed: true },
  { id: "hl-003", habit_id: "hab-003", logged_date: today, completed: false },
  { id: "hl-004", habit_id: "hab-004", logged_date: today, completed: false },
];

// ── Nutrition ────────────────────────────────────────────────────────────────
export const demoMacroGoals: MacroGoals = { calories: 2400, protein: 180, carbs: 280, fat: 65 };

export const demoNutritionLogs: NutritionLog[] = [
  { id: "nl-001", client_id: CLIENT_1_ID, name: "Oatmeal with berries", calories: 380, protein: 12, carbs: 65, fat: 8, meal: "breakfast", logged_date: today, created_at: isoAgo(8) },
  { id: "nl-002", client_id: CLIENT_1_ID, name: "Protein shake", calories: 220, protein: 40, carbs: 10, fat: 3, meal: "snack", logged_date: today, created_at: isoAgo(6) },
  { id: "nl-003", client_id: CLIENT_1_ID, name: "Grilled chicken & rice", calories: 620, protein: 45, carbs: 70, fat: 14, meal: "lunch", logged_date: today, created_at: isoAgo(4) },
  { id: "nl-004", client_id: CLIENT_1_ID, name: "Greek yogurt & nuts", calories: 280, protein: 18, carbs: 20, fat: 16, meal: "snack", logged_date: today, created_at: isoAgo(2) },
  { id: "nl-005", client_id: CLIENT_1_ID, name: "Salmon with sweet potato", calories: 580, protein: 42, carbs: 50, fat: 18, meal: "dinner", logged_date: today, created_at: isoAgo(1) },
];

// ── Milestones ───────────────────────────────────────────────────────────────
export interface DemoMilestone {
  id: string;
  title: string;
  description: string;
  flavor: string;
  howTo: string;
  icon: string;
  earned: boolean;
}

export const demoMilestones: DemoMilestone[] = [
  { id: "first-workout", title: "First Steps", description: "Complete your first workout", flavor: "Every legend starts somewhere. You just took that first step!", howTo: "Complete any scheduled workout and mark it as done.", icon: "shoe-print", earned: true },
  { id: "five-workouts", title: "Getting Started", description: "Complete 5 workouts", flavor: "Five down, a lifetime to go. You're building a habit!", howTo: "Complete 5 workouts total — any type counts.", icon: "star-outline", earned: true },
  { id: "ten-workouts", title: "Dedicated", description: "Complete 10 workouts", flavor: "Double digits! Your consistency is showing.", howTo: "Complete 10 workouts total to prove your dedication.", icon: "star-half-full", earned: true },
  { id: "twentyfive-workouts", title: "Committed", description: "Complete 25 workouts", flavor: "Quarter-century of sessions. This isn't a phase — it's a lifestyle.", howTo: "Complete 25 workouts total. Keep showing up!", icon: "star", earned: false },
  { id: "fifty-workouts", title: "Unstoppable", description: "Complete 50 workouts", flavor: "Half a hundred! Nothing can slow you down now.", howTo: "Complete 50 workouts total. You're a force of nature.", icon: "trophy", earned: false },
  { id: "hundred-workouts", title: "Century Club", description: "Complete 100 workouts", flavor: "Welcome to the triple-digit club. Elite status, earned.", howTo: "Complete 100 workouts total — a true milestone.", icon: "medal", earned: false },
  { id: "seven-day-streak", title: "Week Warrior", description: "7-day workout streak", flavor: "Seven days, zero excuses. That's warrior mentality.", howTo: "Work out every day for 7 consecutive days.", icon: "fire", earned: true },
  { id: "thirty-day-streak", title: "Month of Iron", description: "30-day workout streak", flavor: "A full month of iron discipline. Forged in the gym.", howTo: "Maintain a workout streak for 30 consecutive days.", icon: "lightning-bolt", earned: false },
  { id: "pr-100", title: "Heavy Hitter", description: "Lift 100+ lbs in a single set", flavor: "Triple digits on the bar! You're moving serious weight.", howTo: "Log a set with 100 lbs or more on any exercise.", icon: "weight-lifter", earned: true },
  { id: "pr-200", title: "Beast Mode", description: "Lift 200+ lbs in a single set", flavor: "200+ lbs?! The plates are trembling. Absolute beast.", howTo: "Log a set with 200 lbs or more on any exercise.", icon: "arm-flex", earned: true },
  { id: "pr-300", title: "Elite Lifter", description: "Lift 300+ lbs in a single set", flavor: "300+ club. You don't just lift — you dominate.", howTo: "Log a set with 300 lbs or more on any exercise.", icon: "shield-star", earned: false },
];

// ── Activity Feed (Coach Dashboard) ──────────────────────────────────────────
export interface DemoActivity {
  id: string;
  type: "workout_completed" | "workout_assigned" | "client_added";
  title: string;
  subtitle: string;
  icon: string;
  clientName: string;
}

export const demoActivityFeed: DemoActivity[] = [
  { id: "a-1", type: "workout_completed", title: "Upper Body Strength completed", subtitle: "2 days ago", icon: "check-circle", clientName: "Jordan Athlete" },
  { id: "a-2", type: "workout_completed", title: "Lower Body Power completed", subtitle: "Yesterday", icon: "check-circle", clientName: "Jordan Athlete" },
  { id: "a-3", type: "workout_assigned", title: "Push Day assigned", subtitle: "Today", icon: "dumbbell", clientName: "Jordan Athlete" },
  { id: "a-4", type: "workout_assigned", title: "Full Body Blast assigned", subtitle: "Today", icon: "dumbbell", clientName: "Sam Rivera" },
  { id: "a-5", type: "client_added", title: "Taylor Kim joined", subtitle: "3 days ago", icon: "account-plus", clientName: "Taylor Kim" },
];

// ── Progress Stats ───────────────────────────────────────────────────────────
export const demoProgressStats = {
  streak: 8,
  completedCount: 16,
  totalAssigned: 23,
  compliance7: 86,
  compliance30: 78,
  compliance90: 72,
  topExercises: [
    { name: "Barbell Bench Press", sessions: 14, prWeight: 85 },
    { name: "Barbell Back Squat", sessions: 12, prWeight: 105 },
    { name: "Barbell Deadlift", sessions: 10, prWeight: 130 },
    { name: "Overhead Press", sessions: 9, prWeight: 55 },
    { name: "Barbell Row", sessions: 8, prWeight: 75 },
  ],
};

// ── Body Metrics ─────────────────────────────────────────────────────────────
export interface DemoBodyMetric {
  date: string;
  weight: number;
}

export const demoBodyMetrics: DemoBodyMetric[] = [
  { date: daysFromNow(-28), weight: 82.5 },
  { date: daysFromNow(-21), weight: 81.8 },
  { date: daysFromNow(-14), weight: 81.2 },
  { date: daysFromNow(-7), weight: 80.5 },
  { date: today, weight: 79.8 },
];

export const demoMeasurements = {
  chest: 102,
  waist: 82,
  hips: 96,
  biceps: 36,
  thighs: 60,
  goalWeight: 78,
  bodyFat: 14.2,
};

// ── Progress Photos ──────────────────────────────────────────────────────────
export interface DemoProgressPhoto {
  id: string;
  date: string;
  pose: "front" | "side" | "back";
  label: string;
}

export const demoProgressPhotos: DemoProgressPhoto[] = [
  { id: "pp-01", date: daysFromNow(-14), pose: "front", label: "2 weeks ago" },
  { id: "pp-02", date: daysFromNow(-14), pose: "side", label: "2 weeks ago" },
  { id: "pp-03", date: daysFromNow(-14), pose: "back", label: "2 weeks ago" },
  { id: "pp-04", date: daysFromNow(-7), pose: "front", label: "1 week ago" },
  { id: "pp-05", date: daysFromNow(-7), pose: "side", label: "1 week ago" },
  { id: "pp-06", date: daysFromNow(-7), pose: "back", label: "1 week ago" },
];

// ── Billing (Coach) ──────────────────────────────────────────────────────────
export const demoBilling = {
  plan: "Professional",
  monthlyRevenue: 2_480,
  activeSubscriptions: 12,
  nextBillingDate: daysFromNow(18),
  cardLast4: "4242",
  cardBrand: "Visa",
};

// ── Exercise Video URLs (enriched exercises) ─────────────────────────────────
export const demoExerciseVideos: Record<string, boolean> = {
  "ex-001": true,
  "ex-002": true,
  "ex-003": true,
  "ex-004": true,
  "ex-005": true,
  "ex-006": true,
  "ex-007": true,
  "ex-008": false,
  "ex-009": false,
  "ex-010": true,
  "ex-011": false,
  "ex-012": true,
};

// ── Documents ────────────────────────────────────────────────────────────────
export interface DemoDocument {
  id: string;
  coach_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  created_at: string;
}

export const demoDocuments: DemoDocument[] = [
  { id: "doc-001", coach_id: COACH_ID, title: "Training Agreement", description: "Liability waiver and training terms", file_url: "documents/training-agreement.pdf", file_type: "pdf", created_at: isoAgo(720) },
  { id: "doc-002", coach_id: COACH_ID, title: "Nutrition Guide", description: "Macronutrient basics and meal planning tips", file_url: "documents/nutrition-guide.pdf", file_type: "pdf", created_at: isoAgo(480) },
  { id: "doc-003", coach_id: COACH_ID, title: "Progress Tracking Sheet", description: "Weekly check-in spreadsheet template", file_url: "documents/tracking-sheet.xlsx", file_type: "xlsx", created_at: isoAgo(240) },
  { id: "doc-004", coach_id: COACH_ID, title: "Mobility Routine", description: null, file_url: "documents/mobility-routine.pdf", file_type: "pdf", created_at: isoAgo(120) },
];

export const demoClientDocuments: DemoDocument[] = [
  demoDocuments[0],
  demoDocuments[1],
];

// ── Webhooks ─────────────────────────────────────────────────────────────────
export interface DemoWebhook {
  id: string;
  coach_id: string;
  url: string;
  event_type: string;
  active: boolean;
  created_at: string;
}

export const demoWebhooks: DemoWebhook[] = [
  { id: "wh-001", coach_id: COACH_ID, url: "https://hooks.zapier.com/hooks/catch/12345/abcde", event_type: "workout.completed", active: true, created_at: isoAgo(720) },
  { id: "wh-002", coach_id: COACH_ID, url: "https://api.myapp.com/webhooks/newcoach", event_type: "client.added", active: true, created_at: isoAgo(360) },
  { id: "wh-003", coach_id: COACH_ID, url: "https://n8n.example.com/webhook/fitness", event_type: "message.sent", active: false, created_at: isoAgo(72) },
];

// ── Invites (pending coach invitations for client view) ──────────────────────
export interface DemoInvite {
  id: string;
  coach: { full_name: string; avatar_url: string | null };
  created_at: string;
}

export const demoPendingInvites: DemoInvite[] = [
  { id: "inv-001", coach: { full_name: "Sarah Trainer", avatar_url: null }, created_at: isoAgo(24) },
];

export { COACH_ID, CLIENT_1_ID, today };
