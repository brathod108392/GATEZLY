import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://frdfjiurwodihtpmnceh.supabase.co", "sb_publishable_vySmN0c_LaUj28Bzn2abWQ_dOKXOlg9");
async function check() {
  const { data } = await supabase.from("profiles").select("*").limit(1);
  console.log(data && data.length > 0 ? Object.keys(data[0]) : "No data");
}
check();
