// src/app/api/get-page-revisions/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';  // Adjust the import path as necessary

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const pageName = searchParams.get('pageName');
  const nickname = searchParams.get('nickname');

  if (!pageName || !nickname) {
    return NextResponse.json({ error: 'Page name and nickname are required' }, { status: 400 });
  }

  try {
    // If the nickname is 'anon', return an empty array of revisions
    if (nickname === 'anon') {
      return NextResponse.json([]);
    }

    // Get the user_id for the given nickname
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', nickname)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      throw userError;
    }

    // Get the page_id and check if it's anonymous
    let { data: pageData, error: pageError } = await supabase
      .from('pages')
      .select('id, is_anonymous')
      .eq('name', pageName)
      .eq('user_id', userData.id)
      .single();

    if (pageError) {
      if (pageError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 });
      }
      throw pageError;
    }

    // If the page is anonymous, return an empty array of revisions
    if (pageData.is_anonymous) {
      return NextResponse.json([]);
    }

    // Get the page revisions
    let { data: revisions, error: revisionsError } = await supabase
      .from('page_revisions')
      .select('id, html, javascript, created_at, model_used, original_prompt, enhanced_prompt')
      .eq('page_id', pageData.id)
      .order('created_at', { ascending: false });

    if (revisionsError) throw revisionsError;

    // If no revisions are found, return an empty array instead of throwing an error
    return NextResponse.json(revisions || []);

  } catch (error) {
    console.error('Error fetching page revisions:', error);
    return NextResponse.json({ error: 'Error fetching page revisions', details: error.message }, { status: 500 });
  }
}