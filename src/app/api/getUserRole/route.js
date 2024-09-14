// app/api/getUserRole/route.js
import { getSession } from '@auth0/nextjs-auth0';
import { supabase } from '@/utils/supabase';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const { data: user, error } = await supabase
      .from('users')
      .select('role, nickname')
      .eq('auth0_id', session.user.sub)
      .single();
    if (error) throw error;
    return NextResponse.json({ role: user.role, nickname: user.nickname });
  } catch (error) {
    console.error('Error fetching user role and nickname:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}