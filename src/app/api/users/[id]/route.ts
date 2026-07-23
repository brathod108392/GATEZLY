import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logSuperAdminAction } from "@/lib/superadminLogger";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role, society_id")
      .eq("id", user.id)
      .single();

    if (!callerProfile || (callerProfile.role !== "admin" && callerProfile.role !== "superadmin")) {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const targetUserId = params.id;
    const body = await request.json();
    
    const updateData: Record<string, unknown> = {};
    if (body.full_name !== undefined) updateData.full_name = body.full_name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data: targetProfile } = await supabaseAdmin
      .from("profiles")
      .select("society_id, role, is_active")
      .eq("id", targetUserId)
      .single();

    if (!targetProfile) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    if (callerProfile.role === "admin") {
      if (targetProfile.society_id !== callerProfile.society_id) {
        return NextResponse.json({ error: "Forbidden. Target user is not in your society." }, { status: 403 });
      }
    }

    // Super Admin Last Active Check
    if (targetProfile.role === "superadmin") {
      const roleChanging = updateData.role !== undefined && updateData.role !== "superadmin";
      const becomingInactive = updateData.is_active === false;
      
      if (roleChanging || becomingInactive) {
        const { count } = await supabaseAdmin
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'superadmin')
          .eq('is_active', true);
          
        if (count !== null && count <= 1) {
          return NextResponse.json({ error: "Cannot remove the last active super admin." }, { status: 400 });
        }
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", targetUserId);

    if (updateError) throw updateError;

    if (updateData.is_active === false) {
      await supabaseAdmin.from("flat_residents").delete().eq("resident_id", targetUserId);
    }

    if (callerProfile.role === "superadmin") {
      await logSuperAdminAction(supabaseAdmin, user.id, 'UPDATE_USER', 'profile', targetUserId, updateData);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("API Update User Error:", error);
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role, society_id")
      .eq("id", user.id)
      .single();

    if (!callerProfile || (callerProfile.role !== "admin" && callerProfile.role !== "superadmin")) {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const targetUserId = params.id;

    const { data: targetProfile } = await supabaseAdmin
      .from("profiles")
      .select("society_id, role, is_active")
      .eq("id", targetUserId)
      .single();

    if (!targetProfile) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    if (callerProfile.role === "admin") {
      if (targetProfile.society_id !== callerProfile.society_id) {
        return NextResponse.json({ error: "Forbidden. Target user is not in your society." }, { status: 403 });
      }
    }

    // Super Admin Last Active Check
    if (targetProfile.role === "superadmin" && targetProfile.is_active) {
      const { count } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'superadmin')
        .eq('is_active', true);
        
      if (count !== null && count <= 1) {
        return NextResponse.json({ error: "Cannot remove the last active super admin." }, { status: 400 });
      }
    }

    await supabaseAdmin.from("flat_residents").delete().eq("resident_id", targetUserId);
    
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

    if (deleteError) throw deleteError;

    if (callerProfile.role === "superadmin") {
      await logSuperAdminAction(supabaseAdmin, user.id, 'DELETE_USER', 'profile', targetUserId, { targetUserId });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("API Delete User Error:", error);
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
