//src/app/api/auth/[auth0]/route.js
import { handleAuth, handleCallback, getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { v4 as uuidv4 } from 'uuid';
import bannedNicknames from '../../../../bannedNicknames.json'; // Adjust the path if necessary

async function updateUserInSupabase(user) {
  console.log('Updating user in Supabase:', user);
  try {
    // Check if user exists in the database
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('auth0_id', user.sub)
      .single();
    console.log('Existing user check result:', existingUser, fetchError);
    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (!existingUser) {
      let nickname = user.nickname || null;
      if (nickname) {
        // Check if the nickname is banned or already exists in the database for new users
        if (bannedNicknames.includes(nickname)) {
          console.log('Banned nickname detected, generating random UUID as nickname');
          nickname = uuidv4();
        } else {
          const { data: existingNickname, error: nicknameError } = await supabase
            .from('users')
            .select('nickname')
            .eq('nickname', nickname)
            .single();
          if (!nicknameError && existingNickname) {
            // If the nickname exists, generate a random UUID as the nickname for new users
            nickname = uuidv4();
          }
        }
      }

      const userData = {
        auth0_id: user.sub,
        name: user.name || null,
        given_name: user.given_name || null,
        family_name: user.family_name || null,
        nickname: nickname,
        picture: user.picture || null,
        email: user.email || null,
        email_verified: user.email_verified || null,
        locale: user.locale || null,
        phone_number: user.phone_number || null,
        phone_number_verified: user.phone_number_verified || null,
        birthdate: user.birthdate || null,
        address: user.address ? JSON.stringify(user.address) : null,
        last_login: new Date().toISOString(),
      };

      console.log('Inserting new user');
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert(userData)
        .single();
      if (insertError) throw insertError;
      console.log('Insert result:', newUser);
    } else {
      console.log('Updating existing user');
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('auth0_id', user.sub)
        .single();
      if (updateError) throw updateError;
      console.log('Update result:', updatedUser);
    }

    console.log('User data updated successfully');
  } catch (error) {
    console.error('Error updating user in Supabase:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
  }
}

export const GET = handleAuth({
  async callback(req, res) {
    console.log('Auth0 callback route hit');
    try {
      console.log('Handling callback');
      const callbackResponse = await handleCallback(req, res);
     
      // After handleCallback, we can safely get the session
      const session = await getSession(req, res);
      console.log('Session after callback:', session);
      if (session && session.user) {
        await updateUserInSupabase(session.user);
      } else {
        console.error('No session or user data available after callback');
      }
      return callbackResponse;
    } catch (error) {
      console.error('Error in callback:', error);
      return NextResponse.json({ message: 'Error processing Auth0 callback' }, { status: 500 });
    }
  },
});
