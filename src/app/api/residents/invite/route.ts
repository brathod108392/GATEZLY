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
    const { name, phone, email } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Name and email are required.' },
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
    if (!profile || profile.role === 'resident') {
      return NextResponse.json({ error: 'Forbidden: Only Admins or Committee members can invite residents.' }, { status: 403 });
    }

    if (!profile.society_id) {
      return NextResponse.json({ error: 'Forbidden: Inviter does not belong to a society.' }, { status: 403 });
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
          role: 'resident',
          society_id: profile.society_id,
        },
      }
    );

    if (error) {
      console.error('Error inviting resident:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: 'Resident invited successfully', user: data.user },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
