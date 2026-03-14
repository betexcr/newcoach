-- Seed exercise library with common movements
INSERT INTO exercises (name, description, muscle_group, equipment, is_custom) VALUES
-- Chest
('Barbell Bench Press', 'Lie on bench, grip bar slightly wider than shoulders, lower to chest, press up.', 'chest', 'barbell', false),
('Dumbbell Bench Press', 'Lie on bench with dumbbells at chest height, press up until arms extended.', 'chest', 'dumbbell', false),
('Incline Barbell Bench Press', 'Set bench to 30-45 degrees, perform bench press with barbell.', 'chest', 'barbell', false),
('Incline Dumbbell Press', 'Set bench to 30-45 degrees, press dumbbells from chest level.', 'chest', 'dumbbell', false),
('Dumbbell Flyes', 'Lie on bench, extend arms with slight bend, lower to sides, squeeze back up.', 'chest', 'dumbbell', false),
('Cable Crossover', 'Stand between cables, bring handles together in front of chest.', 'chest', 'cable', false),
('Push-ups', 'Hands shoulder-width, lower chest to floor, push back up.', 'chest', 'bodyweight', false),
('Dips (Chest)', 'Lean forward on parallel bars, lower and press back up.', 'chest', 'bodyweight', false),

-- Back
('Barbell Deadlift', 'Stand over bar, hip-hinge to grip, drive through floor to stand.', 'back', 'barbell', false),
('Barbell Row', 'Hinge forward, pull bar to lower chest/upper abdomen.', 'back', 'barbell', false),
('Dumbbell Row', 'One arm on bench, pull dumbbell to hip.', 'back', 'dumbbell', false),
('Pull-ups', 'Hang from bar with overhand grip, pull chin above bar.', 'back', 'bodyweight', false),
('Chin-ups', 'Hang from bar with underhand grip, pull chin above bar.', 'back', 'bodyweight', false),
('Lat Pulldown', 'Sit at machine, pull bar to upper chest.', 'back', 'cable', false),
('Seated Cable Row', 'Sit at cable row, pull handle to torso.', 'back', 'cable', false),
('T-Bar Row', 'Straddle T-bar, pull weight to chest.', 'back', 'barbell', false),

-- Shoulders
('Overhead Press', 'Stand with bar at shoulders, press overhead to lockout.', 'shoulders', 'barbell', false),
('Dumbbell Shoulder Press', 'Seated or standing, press dumbbells from shoulders overhead.', 'shoulders', 'dumbbell', false),
('Lateral Raise', 'Stand with dumbbells at sides, raise to shoulder height.', 'shoulders', 'dumbbell', false),
('Front Raise', 'Stand with dumbbells in front, raise to shoulder height.', 'shoulders', 'dumbbell', false),
('Face Pull', 'Pull rope attachment to face level with high elbow position.', 'shoulders', 'cable', false),
('Arnold Press', 'Start with palms facing you, rotate and press overhead.', 'shoulders', 'dumbbell', false),
('Reverse Flyes', 'Bend forward, raise dumbbells to sides targeting rear delts.', 'shoulders', 'dumbbell', false),
('Upright Row', 'Pull bar or dumbbells up along body to chin height.', 'shoulders', 'barbell', false),

-- Legs
('Barbell Back Squat', 'Bar on upper back, squat to parallel or below, stand back up.', 'legs', 'barbell', false),
('Front Squat', 'Bar on front delts, squat to depth, stand back up.', 'legs', 'barbell', false),
('Romanian Deadlift', 'Slight knee bend, hinge at hips, lower bar along legs.', 'legs', 'barbell', false),
('Leg Press', 'Sit in machine, push platform away with legs.', 'legs', 'machine', false),
('Walking Lunges', 'Step forward into lunge, alternate legs while moving.', 'legs', 'dumbbell', false),
('Bulgarian Split Squat', 'Rear foot elevated, squat on front leg.', 'legs', 'dumbbell', false),
('Leg Extension', 'Sit in machine, extend legs to straight position.', 'legs', 'machine', false),
('Leg Curl', 'Lie face down, curl weight toward glutes.', 'legs', 'machine', false),
('Calf Raise', 'Stand on edge, raise up onto toes, lower slowly.', 'legs', 'machine', false),
('Hip Thrust', 'Upper back on bench, drive hips up with barbell across lap.', 'legs', 'barbell', false),
('Goblet Squat', 'Hold dumbbell at chest, squat to depth.', 'legs', 'dumbbell', false),

-- Arms
('Barbell Curl', 'Stand with bar, curl to shoulders keeping elbows fixed.', 'arms', 'barbell', false),
('Dumbbell Curl', 'Alternate or simultaneous curls with dumbbells.', 'arms', 'dumbbell', false),
('Hammer Curl', 'Curl dumbbells with neutral (palms facing) grip.', 'arms', 'dumbbell', false),
('Tricep Pushdown', 'Push cable attachment down until arms extended.', 'arms', 'cable', false),
('Overhead Tricep Extension', 'Hold weight overhead, lower behind head, extend.', 'arms', 'dumbbell', false),
('Close-Grip Bench Press', 'Bench press with hands shoulder-width or narrower.', 'arms', 'barbell', false),
('Skull Crushers', 'Lie on bench, lower bar to forehead, extend arms.', 'arms', 'barbell', false),
('Preacher Curl', 'Curl on preacher bench for strict bicep isolation.', 'arms', 'barbell', false),
('Concentration Curl', 'Seated, brace elbow on thigh, curl dumbbell.', 'arms', 'dumbbell', false),

-- Core
('Plank', 'Hold push-up position on forearms, keep body straight.', 'core', 'bodyweight', false),
('Hanging Leg Raise', 'Hang from bar, raise legs to parallel or higher.', 'core', 'bodyweight', false),
('Ab Wheel Rollout', 'Kneel with wheel, roll out and return maintaining tight core.', 'core', 'other', false),
('Cable Woodchop', 'Rotate torso pulling cable diagonally across body.', 'core', 'cable', false),
('Russian Twist', 'Seated with torso angled back, rotate side to side.', 'core', 'bodyweight', false),
('Dead Bug', 'Lie on back, alternate extending opposite arm and leg.', 'core', 'bodyweight', false),
('Pallof Press', 'Stand sideways to cable, press handle forward resisting rotation.', 'core', 'cable', false),
('Crunches', 'Lie on back, curl shoulders toward hips.', 'core', 'bodyweight', false),

-- Cardio
('Treadmill Run', 'Run on treadmill at desired pace and incline.', 'cardio', 'machine', false),
('Rowing Machine', 'Full body cardio on rowing ergometer.', 'cardio', 'machine', false),
('Assault Bike', 'High intensity cycling with arm and leg movement.', 'cardio', 'machine', false),
('Jump Rope', 'Continuous jumping with rope for cardiovascular conditioning.', 'cardio', 'other', false),
('Box Jumps', 'Jump onto elevated box, step or jump back down.', 'cardio', 'other', false),
('Burpees', 'Squat, kick back to plank, push-up, jump up.', 'cardio', 'bodyweight', false),
('Battle Ropes', 'Alternate or simultaneous waves with heavy ropes.', 'cardio', 'other', false),
('Kettlebell Swing', 'Hinge and swing kettlebell to shoulder height.', 'cardio', 'kettlebell', false);
