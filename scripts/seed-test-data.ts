import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../.env") });

const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !key) {
  console.error("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const COACH_EMAIL = "coach@gmail.com";
const CLIENT_EMAIL = "user@gmail.com";
const PASSWORD = "Test1234!";

function monday(offset = 0): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diff + offset);
  return mon.toISOString().split("T")[0];
}

async function main() {
  console.log("Signing in as coach…");
  const coachClient = createClient(url, key);
  const { data: coachAuth, error: coachErr } = await coachClient.auth.signInWithPassword({
    email: COACH_EMAIL,
    password: PASSWORD,
  });
  if (coachErr || !coachAuth.user) {
    console.error("Coach sign-in failed:", coachErr?.message);
    process.exit(1);
  }
  const coachId = coachAuth.user.id;
  console.log(`  Coach ID: ${coachId}`);

  console.log("Signing in as client…");
  const clientSupa = createClient(url, key);
  const { data: clientAuth, error: clientErr } = await clientSupa.auth.signInWithPassword({
    email: CLIENT_EMAIL,
    password: PASSWORD,
  });
  if (clientErr || !clientAuth.user) {
    console.error("Client sign-in failed:", clientErr?.message);
    process.exit(1);
  }
  const clientId = clientAuth.user.id;
  console.log(`  Client ID: ${clientId}`);

  // Ensure profiles have correct roles and names
  console.log("\nUpdating profiles…");
  await coachClient.from("profiles").upsert({
    id: coachId,
    email: COACH_EMAIL,
    full_name: "Alex Coach",
    role: "coach",
  });
  await clientSupa.from("profiles").upsert({
    id: clientId,
    email: CLIENT_EMAIL,
    full_name: "Jordan Athlete",
    role: "client",
    nutrition_goals: { calories: 2400, protein: 180, carbs: 280, fat: 65 },
  });

  // Coach-client relationship (active)
  console.log("Creating coach-client relationship…");
  const { error: ccErr } = await coachClient.from("coach_clients").upsert(
    { coach_id: coachId, client_id: clientId, status: "active" },
    { onConflict: "coach_id,client_id" }
  );
  if (ccErr) console.warn("  coach_clients:", ccErr.message);

  // Exercises
  console.log("Creating exercises…");
  const exerciseDefs = [
    { name: "Barbell Back Squat", muscle_group: "Legs", equipment: "Barbell", created_by: coachId, is_custom: false },
    { name: "Bench Press", muscle_group: "Chest", equipment: "Barbell", created_by: coachId, is_custom: false },
    { name: "Deadlift", muscle_group: "Back", equipment: "Barbell", created_by: coachId, is_custom: false },
    { name: "Overhead Press", muscle_group: "Shoulders", equipment: "Barbell", created_by: coachId, is_custom: false },
    { name: "Barbell Row", muscle_group: "Back", equipment: "Barbell", created_by: coachId, is_custom: false },
    { name: "Lat Pulldown", muscle_group: "Back", equipment: "Cable", created_by: coachId, is_custom: false },
    { name: "Leg Press", muscle_group: "Legs", equipment: "Machine", created_by: coachId, is_custom: false },
    { name: "Dumbbell Curl", muscle_group: "Arms", equipment: "Dumbbell", created_by: coachId, is_custom: false },
    { name: "Tricep Pushdown", muscle_group: "Arms", equipment: "Cable", created_by: coachId, is_custom: false },
    { name: "Lateral Raise", muscle_group: "Shoulders", equipment: "Dumbbell", created_by: coachId, is_custom: false },
    { name: "Romanian Deadlift", muscle_group: "Legs", equipment: "Barbell", created_by: coachId, is_custom: false },
    { name: "Incline Dumbbell Press", muscle_group: "Chest", equipment: "Dumbbell", created_by: coachId, is_custom: false },
    { name: "Cable Fly", muscle_group: "Chest", equipment: "Cable", created_by: coachId, is_custom: false },
    { name: "Plank", muscle_group: "Core", equipment: null, created_by: coachId, is_custom: false },
    { name: "Hanging Leg Raise", muscle_group: "Core", equipment: "Bodyweight", created_by: coachId, is_custom: false },
  ];
  await coachClient.from("exercises").delete().eq("created_by", coachId);
  const { data: allExercises, error: exErr } = await coachClient.from("exercises").insert(exerciseDefs).select();
  if (exErr || !allExercises?.length) {
    console.error("  Failed to create exercises:", exErr?.message);
    process.exit(1);
  }
  const ex = (name: string) => allExercises!.find((e: any) => e.name === name)!;

  function makeExercise(name: string, order: number, sets: any[]): any {
    const e = ex(name);
    return {
      exercise_id: e.id,
      exercise_name: e.name,
      order,
      sets,
      notes: null,
      superset_group: null,
    };
  }

  function stdSets(count: number, reps: number, weight: number): any[] {
    return Array.from({ length: count }, (_, i) => ({
      set_number: i + 1,
      set_type: "standard",
      reps,
      weight,
      duration_seconds: null,
      rest_seconds: 90,
      rpe: null,
    }));
  }

  // Workout Templates
  console.log("Creating workout templates…");
  const templates = [
    {
      coach_id: coachId,
      name: "Upper Body Strength",
      description: "Compound upper body focus",
      exercises: [
        makeExercise("Bench Press", 1, stdSets(4, 8, 80)),
        makeExercise("Barbell Row", 2, stdSets(4, 8, 70)),
        makeExercise("Overhead Press", 3, stdSets(3, 10, 50)),
        makeExercise("Lat Pulldown", 4, stdSets(3, 12, 55)),
        makeExercise("Dumbbell Curl", 5, stdSets(3, 12, 14)),
        makeExercise("Tricep Pushdown", 6, stdSets(3, 12, 25)),
      ],
    },
    {
      coach_id: coachId,
      name: "Lower Body Power",
      description: "Squat and deadlift focused",
      exercises: [
        makeExercise("Barbell Back Squat", 1, stdSets(5, 5, 100)),
        makeExercise("Romanian Deadlift", 2, stdSets(4, 8, 80)),
        makeExercise("Leg Press", 3, stdSets(3, 12, 150)),
        makeExercise("Hanging Leg Raise", 4, stdSets(3, 15, 0)),
        makeExercise("Plank", 5, [{ set_number: 1, set_type: "timed", reps: null, weight: null, duration_seconds: 60, rest_seconds: 60, rpe: null }]),
      ],
    },
    {
      coach_id: coachId,
      name: "Push Day",
      description: "Chest, shoulders, triceps",
      exercises: [
        makeExercise("Bench Press", 1, stdSets(4, 6, 85)),
        makeExercise("Incline Dumbbell Press", 2, stdSets(3, 10, 30)),
        makeExercise("Overhead Press", 3, stdSets(3, 10, 45)),
        makeExercise("Cable Fly", 4, stdSets(3, 15, 15)),
        makeExercise("Lateral Raise", 5, stdSets(3, 15, 10)),
        makeExercise("Tricep Pushdown", 6, stdSets(3, 12, 22)),
      ],
    },
    {
      coach_id: coachId,
      name: "Pull Day",
      description: "Back and biceps",
      exercises: [
        makeExercise("Deadlift", 1, stdSets(5, 3, 120)),
        makeExercise("Barbell Row", 2, stdSets(4, 8, 70)),
        makeExercise("Lat Pulldown", 3, stdSets(3, 10, 60)),
        makeExercise("Dumbbell Curl", 4, stdSets(3, 12, 16)),
        makeExercise("Hanging Leg Raise", 5, stdSets(3, 12, 0)),
      ],
    },
  ];
  await coachClient.from("workout_templates").delete().eq("coach_id", coachId);
  const { data: wt } = await coachClient.from("workout_templates").insert(templates).select();
  console.log(`  Created ${wt?.length ?? 0} templates`);

  // Program
  console.log("Creating program…");
  await coachClient.from("programs").delete().eq("coach_id", coachId);
  const { data: prog } = await coachClient
    .from("programs")
    .insert({ coach_id: coachId, name: "Strength Foundations 4-Week", description: "Progressive overload program for intermediate lifters", duration_weeks: 4 })
    .select()
    .single();
  if (prog) {
    const pwData = [
      { program_id: prog.id, week_number: 1, day_number: 1, name: "Upper Strength", exercises: templates[0].exercises },
      { program_id: prog.id, week_number: 1, day_number: 2, name: "Lower Power", exercises: templates[1].exercises },
      { program_id: prog.id, week_number: 1, day_number: 3, name: "Push Focus", exercises: templates[2].exercises },
      { program_id: prog.id, week_number: 1, day_number: 5, name: "Pull Focus", exercises: templates[3].exercises },
    ];
    await coachClient.from("program_workouts").insert(pwData);
    console.log(`  Program "${prog.name}" with 4 workouts`);
  }

  // Assigned Workouts for this week
  console.log("Assigning workouts for the week…");
  await coachClient.from("assigned_workouts").delete().eq("client_id", clientId);
  const weekWorkouts = [
    {
      coach_id: coachId, client_id: clientId,
      name: "Upper Body Strength",
      scheduled_date: monday(0), // Monday
      exercises: templates[0].exercises,
      status: "completed",
    },
    {
      coach_id: coachId, client_id: clientId,
      name: "Lower Body Power",
      scheduled_date: monday(1), // Tuesday (today)
      exercises: templates[1].exercises,
      status: "pending",
    },
    {
      coach_id: coachId, client_id: clientId,
      name: "Push Day",
      scheduled_date: monday(2), // Wednesday
      exercises: templates[2].exercises,
      status: "pending",
    },
    {
      coach_id: coachId, client_id: clientId,
      name: "Pull Day",
      scheduled_date: monday(4), // Friday
      exercises: templates[3].exercises,
      status: "pending",
    },
    {
      coach_id: coachId, client_id: clientId,
      name: "Active Recovery",
      scheduled_date: monday(5), // Saturday
      exercises: [
        makeExercise("Plank", 1, [
          { set_number: 1, set_type: "timed", reps: null, weight: null, duration_seconds: 60, rest_seconds: 60, rpe: null },
          { set_number: 2, set_type: "timed", reps: null, weight: null, duration_seconds: 60, rest_seconds: 60, rpe: null },
          { set_number: 3, set_type: "timed", reps: null, weight: null, duration_seconds: 60, rest_seconds: 60, rpe: null },
        ]),
        makeExercise("Hanging Leg Raise", 2, stdSets(3, 15, 0)),
      ],
      status: "pending",
    },
  ];
  const { data: assignedWks } = await coachClient.from("assigned_workouts").insert(weekWorkouts).select();
  console.log(`  Assigned ${assignedWks?.length ?? 0} workouts`);

  // Workout result for Monday's completed workout
  console.log("Logging Monday's workout result…");
  await clientSupa.from("workout_results").delete().eq("client_id", clientId);
  const mondayWorkout = assignedWks?.find((w: any) => w.scheduled_date === monday(0));
  if (mondayWorkout) {
    const loggedSets = [
      {
        exercise_id: ex("Bench Press").id, exercise_name: "Bench Press",
        sets: [
          { set_number: 1, reps: 8, weight: 80, duration_seconds: null, rpe: 7, completed: true },
          { set_number: 2, reps: 8, weight: 80, duration_seconds: null, rpe: 8, completed: true },
          { set_number: 3, reps: 7, weight: 80, duration_seconds: null, rpe: 9, completed: true },
          { set_number: 4, reps: 6, weight: 80, duration_seconds: null, rpe: 9.5, completed: true },
        ],
      },
      {
        exercise_id: ex("Barbell Row").id, exercise_name: "Barbell Row",
        sets: [
          { set_number: 1, reps: 8, weight: 70, duration_seconds: null, rpe: 7, completed: true },
          { set_number: 2, reps: 8, weight: 70, duration_seconds: null, rpe: 8, completed: true },
          { set_number: 3, reps: 8, weight: 70, duration_seconds: null, rpe: 8, completed: true },
          { set_number: 4, reps: 7, weight: 70, duration_seconds: null, rpe: 9, completed: true },
        ],
      },
      {
        exercise_id: ex("Overhead Press").id, exercise_name: "Overhead Press",
        sets: [
          { set_number: 1, reps: 10, weight: 50, duration_seconds: null, rpe: 7, completed: true },
          { set_number: 2, reps: 10, weight: 50, duration_seconds: null, rpe: 8, completed: true },
          { set_number: 3, reps: 9, weight: 50, duration_seconds: null, rpe: 9, completed: true },
        ],
      },
      {
        exercise_id: ex("Lat Pulldown").id, exercise_name: "Lat Pulldown",
        sets: [
          { set_number: 1, reps: 12, weight: 55, duration_seconds: null, rpe: 7, completed: true },
          { set_number: 2, reps: 12, weight: 55, duration_seconds: null, rpe: 8, completed: true },
          { set_number: 3, reps: 11, weight: 55, duration_seconds: null, rpe: 8.5, completed: true },
        ],
      },
      {
        exercise_id: ex("Dumbbell Curl").id, exercise_name: "Dumbbell Curl",
        sets: [
          { set_number: 1, reps: 12, weight: 14, duration_seconds: null, rpe: 7, completed: true },
          { set_number: 2, reps: 12, weight: 14, duration_seconds: null, rpe: 8, completed: true },
          { set_number: 3, reps: 10, weight: 14, duration_seconds: null, rpe: 9, completed: true },
        ],
      },
      {
        exercise_id: ex("Tricep Pushdown").id, exercise_name: "Tricep Pushdown",
        sets: [
          { set_number: 1, reps: 12, weight: 25, duration_seconds: null, rpe: 7, completed: true },
          { set_number: 2, reps: 12, weight: 25, duration_seconds: null, rpe: 8, completed: true },
          { set_number: 3, reps: 11, weight: 25, duration_seconds: null, rpe: 8.5, completed: true },
        ],
      },
    ];
    await clientSupa.from("workout_results").insert({
      assigned_workout_id: mondayWorkout.id,
      client_id: clientId,
      logged_sets: loggedSets,
      notes: "Felt strong today. Bench press grip felt solid. Slight fatigue on last set of rows.",
      completed_at: `${monday(0)}T18:30:00Z`,
    });
    console.log("  Monday workout logged");
  }

  // Habits
  console.log("Creating habits…");
  await coachClient.from("habits").delete().eq("client_id", clientId);
  const habitDefs = [
    { coach_id: coachId, client_id: clientId, name: "Drink 3L water", description: "Stay hydrated throughout the day", frequency: "daily" },
    { coach_id: coachId, client_id: clientId, name: "8 hours sleep", description: "Track sleep duration", frequency: "daily" },
    { coach_id: coachId, client_id: clientId, name: "10min stretching", description: "Morning mobility routine", frequency: "daily" },
    { coach_id: coachId, client_id: clientId, name: "Meal prep", description: "Prepare meals for the next day", frequency: "weekly" },
  ];
  const { data: habits } = await coachClient.from("habits").insert(habitDefs).select();
  console.log(`  Created ${habits?.length ?? 0} habits`);

  // Habit logs for last 7 days
  if (habits?.length) {
    console.log("Logging habit completions…");
    await clientSupa.from("habit_logs").delete().in("habit_id", habits.map((h: any) => h.id));
    const logs: any[] = [];
    for (let dayOff = -6; dayOff <= 0; dayOff++) {
      const d = new Date();
      d.setDate(d.getDate() + dayOff);
      const dateStr = d.toISOString().split("T")[0];
      for (const h of habits) {
        if (h.frequency === "weekly" && d.getDay() !== 0) continue;
        const completed = Math.random() > 0.25;
        logs.push({ habit_id: h.id, logged_date: dateStr, completed });
      }
    }
    await clientSupa.from("habit_logs").insert(logs);
    console.log(`  Logged ${logs.length} habit entries`);
  }

  // Nutrition logs for this week
  console.log("Creating nutrition logs…");
  await clientSupa.from("nutrition_logs").delete().eq("client_id", clientId);
  const meals: any[] = [];
  const mealTemplates = [
    { name: "Oatmeal with berries", meal: "breakfast", calories: 380, protein: 12, carbs: 65, fat: 8 },
    { name: "Protein shake", meal: "snack", calories: 220, protein: 40, carbs: 10, fat: 3 },
    { name: "Grilled chicken & rice", meal: "lunch", calories: 620, protein: 45, carbs: 70, fat: 14 },
    { name: "Greek yogurt & nuts", meal: "snack", calories: 280, protein: 18, carbs: 20, fat: 16 },
    { name: "Salmon with sweet potato", meal: "dinner", calories: 580, protein: 42, carbs: 50, fat: 18 },
    { name: "Eggs & avocado toast", meal: "breakfast", calories: 450, protein: 22, carbs: 35, fat: 28 },
    { name: "Turkey wrap", meal: "lunch", calories: 520, protein: 38, carbs: 48, fat: 16 },
    { name: "Steak & vegetables", meal: "dinner", calories: 650, protein: 48, carbs: 25, fat: 32 },
    { name: "Banana & peanut butter", meal: "snack", calories: 310, protein: 10, carbs: 40, fat: 14 },
    { name: "Pasta with meat sauce", meal: "dinner", calories: 680, protein: 35, carbs: 80, fat: 20 },
  ];
  for (let dayOff = -1; dayOff <= 0; dayOff++) {
    const d = new Date();
    d.setDate(d.getDate() + dayOff);
    const dateStr = d.toISOString().split("T")[0];
    const dayMeals = dayOff === -1
      ? [mealTemplates[0], mealTemplates[1], mealTemplates[2], mealTemplates[3], mealTemplates[4]]
      : [mealTemplates[5], mealTemplates[1], mealTemplates[6]]; // today = partial
    for (const m of dayMeals) {
      meals.push({ client_id: clientId, logged_date: dateStr, ...m });
    }
  }
  await clientSupa.from("nutrition_logs").insert(meals);
  console.log(`  Logged ${meals.length} nutrition entries`);

  // Conversation + messages
  console.log("Creating conversation…");
  await coachClient.from("conversations").delete().eq("created_by", coachId);
  const { data: convo } = await coachClient
    .from("conversations")
    .insert({ type: "direct", name: null, created_by: coachId })
    .select()
    .single();
  if (convo) {
    await coachClient.from("conversation_participants").insert([
      { conversation_id: convo.id, user_id: coachId },
      { conversation_id: convo.id, user_id: clientId },
    ]);

    const msgs = [
      { conversation_id: convo.id, sender_id: coachId, body: "Hey Jordan! Welcome aboard. I've set up your first week of training. Let me know if you have any questions about the exercises." },
      { conversation_id: convo.id, sender_id: clientId, body: "Thanks Coach! Just checked the plan — looks great. Quick question: should I use a belt for the squats?" },
      { conversation_id: convo.id, sender_id: coachId, body: "Great question. For now, train without a belt until you're comfortable with 1.5x bodyweight. Focus on bracing your core naturally." },
      { conversation_id: convo.id, sender_id: clientId, body: "Got it, will do. Crushed the upper body session yesterday 💪" },
      { conversation_id: convo.id, sender_id: coachId, body: "I saw the log — nice work! Your bench numbers are solid. Today is lower body, take your time warming up for squats." },
    ];

    for (let i = 0; i < msgs.length; i++) {
      const supa = msgs[i].sender_id === coachId ? coachClient : clientSupa;
      await supa.from("messages").insert(msgs[i]);
      await new Promise((r) => setTimeout(r, 100));
    }
    console.log(`  Created conversation with ${msgs.length} messages`);
  }

  console.log("\n✅ Seed complete! Summary:");
  console.log(`   Coach: ${COACH_EMAIL} (${coachId})`);
  console.log(`   Client: ${CLIENT_EMAIL} (${clientId})`);
  console.log(`   Relationship: active`);
  console.log(`   Exercises: ${allExercises?.length ?? 0}`);
  console.log(`   Workout templates: ${wt?.length ?? 0}`);
  console.log(`   Program: Strength Foundations 4-Week`);
  console.log(`   Assigned workouts: ${assignedWks?.length ?? 0} (Mon–Sat)`);
  console.log(`   Monday workout: completed with full log`);
  console.log(`   Habits: ${habits?.length ?? 0} with 7-day history`);
  console.log(`   Nutrition: ${meals.length} meal entries (yesterday + today)`);
  console.log(`   Conversation: 5 messages`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
