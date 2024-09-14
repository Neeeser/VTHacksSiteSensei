// src/app/api/explore/route.js

import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view');
  const page = parseInt(searchParams.get('page'), 10);
  const pageSize = parseInt(searchParams.get('pageSize'), 10);

  if (!view || isNaN(page) || isNaN(pageSize)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  try {
    let query = supabase
      .from('pages')
      .select(`
        *,
        users:user_id (
          name,
          picture,
          nickname
        )
      `, { count: 'exact' })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (view === 'new') {
      query = query.order('updated_at', { ascending: false });
    } else if (view === 'featured') {
      query = query.eq('is_favorited', true).order('updated_at', { ascending: false });
    } else {
      return NextResponse.json({ error: 'Invalid view parameter' }, { status: 400 });
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      pages: data,
      totalCount: count,
      hasMore: (page + 1) * pageSize < count
    });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}