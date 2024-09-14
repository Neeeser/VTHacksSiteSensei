// src/app/api/user/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { getSession } from '@auth0/nextjs-auth0';

export async function GET(req) {
  try {
    const session = await getSession(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, nickname, phone_number, birthdate, address')
      .eq('auth0_id', session.user.sub)
      .single();
    if (error) throw error;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}