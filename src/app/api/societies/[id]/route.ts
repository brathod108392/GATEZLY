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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifySuperAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    
    const targetSocietyId = params.id;
    const body = await request.json();
    
    const updateData: Record<string, unknown> = {};
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.is_deleted !== undefined) updateData.is_deleted = body.is_deleted;
    if (body.subscription_plan !== undefined) updateData.subscription_plan = body.subscription_plan;
    if (body.payment_status !== undefined) updateData.payment_status = body.payment_status;
    if (body.renewal_date !== undefined) updateData.renewal_date = body.renewal_date;
    if (body.modules !== undefined) updateData.modules = body.modules;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { error: updateError } = await supabaseAdmin
      .from("societies")
      .update(updateData)
      .eq("id", targetSocietyId);

    if (updateError) throw updateError;

    await logSuperAdminAction(supabaseAdmin, auth.user!.id, 'UPDATE_SOCIETY', 'societies', targetSocietyId, updateData);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("API Update Society Error:", error);
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifySuperAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    
    const targetSocietyId = params.id;

    const updateData = {
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      is_active: false
    };

    const { error: deleteError } = await supabaseAdmin
      .from("societies")
      .update(updateData)
      .eq("id", targetSocietyId);

    if (deleteError) throw deleteError;

    await logSuperAdminAction(supabaseAdmin, auth.user!.id, 'DELETE_SOCIETY', 'societies', targetSocietyId, updateData);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("API Delete Society Error:", error);
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
