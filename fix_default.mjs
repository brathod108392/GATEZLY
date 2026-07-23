import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  const { data, error } = await supabase.rpc('execute_sql', { query: "ALTER TABLE public.societies ALTER COLUMN payment_status SET DEFAULT 'unpaid';" });
  console.log('Error:', error);
}

fix();
