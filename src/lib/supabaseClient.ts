import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://frdfjiurwodihtpmnceh.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_vySmN0c_LaUj28Bzn2abWQ_dOKXOlg9";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
