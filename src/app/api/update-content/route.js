import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';  // Adjust the import path as necessary

export async function POST(request) {
  try {
    const {
      page,
      html,
      javascript,
      auth0Id,
      model,
      originalPrompt,
      enhancedPrompt,
      createdAt
    } = await request.json();

    console.log('Received data:', { page, auth0Id, model, createdAt });

    let userId = null;
    let isAnonymous = true;
    if (auth0Id) {
      console.log('Fetching user for auth0Id:', auth0Id);
      let { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth0_id', auth0Id)
        .single();

      if (userError) {
        console.error('User fetch error:', userError);
        if (userError.code === 'PGRST116') {
          return NextResponse.json({ message: 'User does not exist' }, { status: 404 });
        } else {
          throw userError;
        }
      }
      userId = user.id;
      isAnonymous = false;
      console.log('User found:', { userId, isAnonymous });
    }

    console.log('Fetching existing page');
    let query = supabase
      .from('pages')
      .select('*')
      .eq('name', page);

    if (isAnonymous) {
      query = query.is('user_id', null);
    } else {
      query = query.eq('user_id', userId);
    }

    let { data: existingPage, error: pageError } = await query.single();

    if (pageError) {
      console.error('Page fetch error:', pageError);
      if (pageError.code !== 'PGRST116') {
        throw pageError;
      }
    }

    //console.log('Existing page:', existingPage);

    const pageData = {
      name: page,
      html,
      javascript,
      is_anonymous: isAnonymous,
      user_id: userId,
      model_used: model,
      original_prompt: originalPrompt,
      enhanced_prompt: enhancedPrompt,
      updated_at: new Date().toISOString()
    };

    console.log('Prepared page data:', pageData);

    if (existingPage) {
      console.log('Updating existing page');
      const revisionData = {
        page_id: existingPage.id,
        html: existingPage.html,
        javascript: existingPage.javascript,
        model_used: existingPage.model_used,
        original_prompt: existingPage.original_prompt,
        enhanced_prompt: existingPage.enhanced_prompt,
        user_id: existingPage.user_id,
        is_anonymous: existingPage.is_anonymous,
        is_favorited: existingPage.is_favorited
      };
      console.log('Revision data:', revisionData);

      const { error: revisionError } = await supabase
        .from('page_revisions')
        .insert(revisionData);

      if (revisionError) {
        console.error('Revision insert error:', revisionError);
        throw revisionError;
      }

      const { error: updateError } = await supabase
        .from('pages')
        .update(pageData)
        .eq('id', existingPage.id);

      if (updateError) {
        console.error('Page update error:', updateError);
        throw updateError;
      }
    } else {
      console.log('Inserting new page');
      pageData.created_at = createdAt;
      pageData.is_favorited = false;

      const { error: insertError } = await supabase
        .from('pages')
        .insert(pageData);

      if (insertError) {
        console.error('Page insert error:', insertError);
        throw insertError;
      }
    }

    console.log('Operation completed successfully');
    return NextResponse.json({ message: 'Content updated successfully' });
  } catch (error) {
    console.error('Unhandled error:', error);
    return NextResponse.json({ 
      error: 'Error updating content', 
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}