import { supabase } from '@/utils/supabase';
import bannedNicknames from '@/bannedNicknames.json'; // Adjust the path if necessary

export async function POST(req) {
  try {
    const { nickname } = await req.json();

    if (!nickname) {
      return new Response(JSON.stringify({ error: 'Nickname is required' }), { status: 400 });
    }

    // Check if the nickname is banned
    if (bannedNicknames.includes(nickname)) {
      return new Response(JSON.stringify({ error: 'This nickname is not allowed' }), { status: 409 });
    }

    // Check if the nickname already exists in the database
    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', nickname)
      .single();

    if (existingUserError && existingUserError.code !== 'PGRST116') {
      return new Response(JSON.stringify({ error: 'Error checking nickname' }), { status: 500 });
    }

    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Nickname already exists' }), { status: 409 });
    }

    return new Response(JSON.stringify({ message: 'Nickname is available' }), { status: 200 });
  } catch (error) {
    console.error('Error validating nickname:', error);
    return new Response(JSON.stringify({ error: 'Error validating nickname' }), { status: 500 });
  }
}
