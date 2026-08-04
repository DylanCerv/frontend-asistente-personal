export const CATEGORY_OPTIONS = [
  'General',
  'Trabajo',
  'Personal',
  'Salud',
  'Finanzas',
  'Educación',
  'Proyectos',
  'Familia',
] as const;

export type TaskCategory = (typeof CATEGORY_OPTIONS)[number];

export const CATEGORY_ICONS: Record<string, string> = {
  General: 'layers-outline',
  Trabajo: 'briefcase-outline',
  Personal: 'person-outline',
  Salud: 'fitness-outline',
  Finanzas: 'cash-outline',
  Educación: 'school-outline',
  Proyectos: 'rocket-outline',
  Familia: 'home-outline',
};

const CATEGORY_ALIASES: Record<string, TaskCategory> = {
  general: 'General',
  trabajo: 'Trabajo',
  personal: 'Personal',
  salud: 'Salud',
  finanzas: 'Finanzas',
  educación: 'Educación',
  educacion: 'Educación',
  proyectos: 'Proyectos',
  familia: 'Familia',
  clientes: 'Trabajo',
  vehículos: 'Personal',
  vehiculos: 'Personal',
};

export function normalizeTaskCategory(value: string | undefined | null): TaskCategory {
  if (!value?.trim()) return 'General';

  const trimmed = value.trim();
  const alias = CATEGORY_ALIASES[trimmed.toLowerCase()];
  if (alias) return alias;

  const match = CATEGORY_OPTIONS.find((category) => category.toLowerCase() === trimmed.toLowerCase());
  if (match) return match;

  return 'General';
}

export function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category] ?? 'checkmark-circle-outline';
}
