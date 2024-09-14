// api/download/route.js
import { supabase } from '@/utils/supabase';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const nickname = searchParams.get('nickname');
  const pageName = searchParams.get('pageName');
  const revisionId = searchParams.get('revisionId'); // Optional parameter for revision ID

  if (!nickname || !pageName) {
    return NextResponse.json({ error: 'Missing nickname or page name' }, { status: 400 });
  }

  try {
    let contentQuery;

    if (revisionId) {
      // Fetch specific revision content if revisionId is provided
      contentQuery = supabase
        .from('page_revisions')
        .select('html, javascript')
        .eq('id', revisionId)
        .single();
    } else {
      // Fetch the current page content if no revisionId is specified
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('nickname', nickname)
        .single();

      if (userError) {
        throw new Error('User not found');
      }

      contentQuery = supabase
        .from('pages')
        .select('html, javascript')
        .eq('user_id', userData.id)
        .eq('name', pageName)
        .single();
    }

    const { data, error } = await contentQuery;

    if (error) {
      throw new Error('Page not found');
    }

    const { html, javascript } = data;

    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageName}</title>
</head>
<body>
${html}
<script>
${javascript}
</script>
</body>
</html>`;

    return new NextResponse(fullHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${pageName}.html"`,
      },
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
