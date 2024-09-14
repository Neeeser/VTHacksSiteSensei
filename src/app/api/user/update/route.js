// src/app/api/user/update/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { getSession } from '@auth0/nextjs-auth0';

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userData = await request.json();

    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('auth0_id', session.user.sub);

    if (error) {
      console.error('Error updating user data:', error);
      return NextResponse.json({ error: 'Failed to update user data' }, { status: 500 });
    }

    return NextResponse.json({ message: 'User data updated successfully' });
  } catch (error) {
    console.error('Error in update-user-data API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}