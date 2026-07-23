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

export async function POST(request: Request) {
  try {
    const auth = await verifySuperAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    
    const body = await request.json();
    
    if (!body.title || !body.message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("global_notifications")
      .insert([{
        title: body.title,
        message: body.message,
        type: body.type || 'info',
        target_audience: body.target_audience || 'all',
        created_by: auth.user!.id
      }])
      .select()
      .single();

    if (error) throw error;

    await logSuperAdminAction(supabaseAdmin, auth.user!.id, 'CREATE_NOTIFICATION', 'global_notifications', data.id, data);

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error("API Create Notification Error:", error);
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
