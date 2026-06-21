export function syncSupervisoresFromSupabase(
  supabase: any,
  password?: string,
): Promise<{ created: number; updated: number; errors: any[] }>;
