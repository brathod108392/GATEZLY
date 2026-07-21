import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log("Fetching users from auth.users...");
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error("Error fetching users:", usersError);
  } else {
    console.log(`Found ${usersData.users.length} users in auth.users.`);
    usersData.users.forEach(u => {
      console.log(`- ID: ${u.id}, Email: ${u.email}, Meta:`, u.user_metadata);
    });
  }

  console.log("\nFetching profiles from public.profiles...");
  const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('*');
  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
  } else {
    console.log(`Found ${profilesData.length} profiles in public.profiles.`);
    console.dir(profilesData, { depth: null });
  }
}

run();
