// app/api/pages/[identifier]/[id]/favorite/route.js
import { getSession } from '@auth0/nextjs-auth0';
import { supabase } from '@/utils/supabase';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('auth0_id', session.user.sub)
      .single();

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { is_favorited } = await request.json();
    const { identifier, id } = params;

    if (identifier === 'anonymous') {
      const { error } = await supabase
        .from('pages')
        .update({ is_favorited })
        .eq('id', id)
        .eq('is_anonymous', true);

      if (error) throw error;
    } else {
      const { data: page, error: pageError } = await supabase
        .from('pages')
        .select('id, user_id')
        .eq('id', id)
        .single();

      if (pageError) throw pageError;

      const { data: userDetail, error: userDetailError } = await supabase
        .from('users')
        .select('id')
        .eq('nickname', identifier)
        .single();

      if (userDetailError) throw userDetailError;

      if (page.user_id !== userDetail.id) {
        return NextResponse.json({ error: 'Page does not belong to the specified user' }, { status: 403 });
      }

      const { error } = await supabase
        .from('pages')
        .update({ is_favorited })
        .eq('id', id);

      if (error) throw error;
    }

    return NextResponse.json({ message: 'Page favorite status updated successfully' });
  } catch (error) {
    console.error('Error updating page favorite status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
