import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: { session }, error: authError } = await supabase.auth.signInWithOtp({
    email: 'test_resident@gmail.com'
  });

  if (authError) {
    console.error("Auth error:", authError.message);
    return;
  }
  
  // Wait, OTP requires clicking email. Let me use Service Role Key to bypass.

  console.log("Logged in as:", session.user.email);
  
  const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
  if (error) {
    console.error("Profile fetch error:", error);
  } else {
    console.log("Profile data:", data);
  }
}

test();
