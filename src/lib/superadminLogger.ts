import { SupabaseClient } from '@supabase/supabase-js';

export async function logSuperAdminAction(
  supabaseAdmin: SupabaseClient,
  superadminId: string,
  action: string,
  entityType: string,
  entityId: string | null = null,
  details: Record<string, unknown> = {}
) {
  try {
    const { error } = await supabaseAdmin.from('superadmin_logs').insert({
      superadmin_id: superadminId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details
    });
    
    if (error) {
      console.error('Failed to log superadmin action:', error);
    }
  } catch (err) {
    console.error('Exception logging superadmin action:', err);
  }
}
