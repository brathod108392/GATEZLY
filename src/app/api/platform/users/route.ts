import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifySuperAdmin(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return { error: "Missing authorization header", status: 401 };
  
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  
  if (authError || !user) return { error: "Unauthorized", status: 401 };
  
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
    
  if (!profile || profile.role !== "superadmin") {
    return { error: "Forbidden. Super Admin access required.", status: 403 };
  }
  
  return { user };
}

export async function GET(request: Request) {
  try {
    const auth = await verifySuperAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    
    let query = supabaseAdmin
      .from("profiles")
      .select(`
        *,
        societies(name)
      `);

    if (q) {
      query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: unknown) {
    console.error("API Get All Users Error:", error);
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
