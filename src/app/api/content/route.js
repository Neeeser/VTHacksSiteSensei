// src/app/api/content/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const nickname = searchParams.get('nickname');
  const pageName = searchParams.get('pageName');

  if (!nickname || !pageName) {
    return NextResponse.json({ error: 'Missing nickname or page name' }, { status: 400 });
  }

  try {
    let pageQuery;
    if (nickname === 'anon') {
      pageQuery = supabase
        .from('pages')
        .select('html, javascript, original_prompt, enhanced_prompt, model_used')
        .eq('is_anonymous', true)
        .eq('name', pageName)
        .single();
    } else {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('nickname', nickname)
        .single();

      if (userError) {
        console.error('User fetch error:', userError);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      pageQuery = supabase
        .from('pages')
        .select('html, javascript, original_prompt, enhanced_prompt, model_used')
        .eq('user_id', userData.id)
        .eq('name', pageName)
        .single();
    }

    const { data, error } = await pageQuery;

    if (error) {
      console.error('Page fetch error:', error);
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({
      html: data.html,
      javascript: data.javascript,
      original_prompt: data.original_prompt || "Original prompt not available",
      enhanced_prompt: data.enhanced_prompt || "Enhanced prompt not available",
      model_used: data.model_used
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}