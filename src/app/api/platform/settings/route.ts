import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logSuperAdminAction } from "@/lib/superadminLogger";

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
    
    const { data, error } = await supabaseAdmin
      .from("platform_settings")
      .select("*")
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is multiple rows/no rows
      throw error;
    }

    return NextResponse.json({ data: data || {} });
  } catch (error: unknown) {
    console.error("API Get Settings Error:", error);
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await verifySuperAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    
    const body = await request.json();
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Assuming a single row in platform_settings, usually id=1 or we just update the first row
    // If table doesn't use standard ID, adjust accordingly. We'll assume a generic update.
    
    // First, try to get the existing settings row
    const { data: existing } = await supabaseAdmin.from("platform_settings").select("id").limit(1).single();
    
    let error;
    let targetId = null;
    
    if (existing) {
      targetId = existing.id;
      const { error: updateError } = await supabaseAdmin
        .from("platform_settings")
        .update(body)
        .eq("id", targetId);
      error = updateError;
    } else {
      // If no row exists, insert one
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("platform_settings")
        .insert([body])
        .select("id")
        .single();
      error = insertError;
      if (inserted) targetId = inserted.id;
    }

    if (error) throw error;

    await logSuperAdminAction(supabaseAdmin, auth.user!.id, 'UPDATE_SETTINGS', 'platform_settings', targetId, body);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("API Patch Settings Error:", error);
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
