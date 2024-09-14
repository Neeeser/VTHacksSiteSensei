// src/app/api/profile/[nickname]/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(request, { params }) {
  const { nickname } = params;
  try {
    // First, fetch the user data based on the nickname
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, nickname, picture')
      .eq('nickname', nickname)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      throw userError;
    }

    // Now, fetch the pages for this user
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('id, name, created_at, html, javascript, model_used, is_favorited')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (pagesError) {
      throw pagesError;
    }

    // Attach user data to each page
    const pagesWithUserData = pages.map(page => ({
        ...page,
        users: {
          id: user.id,
          name: user.name,
          nickname: user.nickname,
          picture: user.picture,
        }
      }));
  
      const profileData = {
        ...user,
        pages: pagesWithUserData
      };
  
      return NextResponse.json(profileData);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}