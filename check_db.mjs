import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://frdfjiurwodihtpmnceh.supabase.co";
const supabaseAnonKey = "sb_publishable_vySmN0c_LaUj28Bzn2abWQ_dOKXOlg9";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  console.log("Checking profiles structure...");
  
  // Try to fetch one profile to see its keys
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .limit(1)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
  } else {
    console.log("Profile structure:", Object.keys(profile));
  }
}

checkSchema();
