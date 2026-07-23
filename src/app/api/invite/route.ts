import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client using Service Role Key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function POST(request: Request) {
  try {
    const { name, phone, email, role, target_society_id } = await request.json();

    if (!email || !name || !role) {
      return NextResponse.json(
        { error: 'Name, email, and role are required.' },
        { status: 400 }
      );
    }

    // Verify caller role
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin.from('profiles').select('role, society_id').eq('id', user.id).single();
    if (!profile) {
      return NextResponse.json({ error: 'Forbidden: Profile not found.' }, { status: 403 });
    }

    let societyIdToAssign = profile.society_id;

    // Authorization Checks
    // Authorization Checks
    if (profile.role === 'superadmin') {
      if (role !== 'superadmin' && !target_society_id) {
        return NextResponse.json({ error: 'target_society_id is required when inviting users to a society.' }, { status: 400 });
      }
      societyIdToAssign = role === 'superadmin' ? null : target_society_id;
    } else if (profile.role === 'admin') {
      if (role === 'superadmin' || role === 'admin') {
        return NextResponse.json({ error: 'Admins cannot invite Superadmins or Admins.' }, { status: 403 });
      }
    } else if (profile.role === 'committee') {
      if (role !== 'resident' && role !== 'guard') {
        return NextResponse.json({ error: 'Committee can only invite residents or guards.' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to invite users.' }, { status: 403 });
    }

    const requestUrl = new URL(request.url);
    const redirectTo = `${requestUrl.origin}/update-password`;

    // Use admin.inviteUserByEmail to send invite link and create user
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo,
        data: {
          full_name: name,
          phone: phone || null,
          role: role,
          society_id: societyIdToAssign,
        },
      }
    );

    if (error) {
      console.error('Error inviting user:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: 'User invited successfully', user: data.user },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
