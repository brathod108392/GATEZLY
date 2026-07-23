import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize a Supabase client with the Service Role key to bypass RLS
// This is required for updating other users' profiles and deleting auth users.
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
    
    // Verify the requesting user's identity
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify requesting user is admin or superadmin
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
    
    const updateData: any = {};
    if (body.full_name !== undefined) updateData.full_name = body.full_name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Additional check: Admins can only update users within their own society
    if (callerProfile.role === "admin") {
      const { data: targetProfile } = await supabaseAdmin
        .from("profiles")
        .select("society_id")
        .eq("id", targetUserId)
        .single();
        
      if (!targetProfile || targetProfile.society_id !== callerProfile.society_id) {
        return NextResponse.json({ error: "Forbidden. Target user is not in your society." }, { status: 403 });
      }
    }

    // Perform the update
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", targetUserId);

    if (updateError) throw updateError;

    // If deactivating, remove them from all assigned flats
    if (updateData.is_active === false) {
      await supabaseAdmin.from("flat_residents").delete().eq("resident_id", targetUserId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Update User Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
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
    
    // Verify the requesting user's identity
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify requesting user is admin or superadmin
    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role, society_id")
      .eq("id", user.id)
      .single();

    if (!callerProfile || (callerProfile.role !== "admin" && callerProfile.role !== "superadmin")) {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const targetUserId = params.id;

    // Additional check: Admins can only delete users within their own society
    if (callerProfile.role === "admin") {
      const { data: targetProfile } = await supabaseAdmin
        .from("profiles")
        .select("society_id")
        .eq("id", targetUserId)
        .single();
        
      if (!targetProfile || targetProfile.society_id !== callerProfile.society_id) {
        return NextResponse.json({ error: "Forbidden. Target user is not in your society." }, { status: 403 });
      }
    }

    // 1. Delete from flat_residents (if applicable)
    await supabaseAdmin.from("flat_residents").delete().eq("resident_id", targetUserId);
    
    // 2. Delete from auth.users (This will cascade delete from public.profiles via schema foreign key)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Delete User Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
