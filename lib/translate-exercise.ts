type TFn = (key: string) => string;

export function translateMuscle(mg: string | null, t: TFn): string {
  if (!mg) return "";
  const key = `muscleGroups.${mg.toLowerCase()}`;
  const v = t(key);
  return v !== key ? v : mg;
}

export function translateEquipment(eq: string | null | undefined, t: TFn): string {
  if (!eq) return "";
  const key = `equipment.${eq.toLowerCase()}`;
  const v = t(key);
  return v !== key ? v : eq;
}
