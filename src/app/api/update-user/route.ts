import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { supabase } from '@/utils/supabase';
import bannedNicknames from '../../../bannedNicknames.json'; // Adjust the path if necessary

// Define the allowed fields for non-admin users
const allowedFields = ['name', 'nickname', 'phone_number', 'birthdate', 'address'];

// Helper function to check if user is an admin
async function isAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('auth0_id', userId)
    .single();
  if (error) {
    console.error('Error checking user role:', error);
    return false;
  }
  return data?.role === 'admin';
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const requestData = await req.json();
    const { targetUserId, ...updateData } = requestData;
    const isAdminUser = await isAdmin(session.user.sub);
    let userIdToUpdate = session.user.sub;
    // If admin and targetUserId provided, update the target user
    if (isAdminUser && targetUserId) {
      userIdToUpdate = targetUserId;
    } else if (targetUserId) {
      // Non-admin users can't update other users
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if the nickname is being updated
    if (updateData.nickname) {
      // Check if the nickname is banned
      if (bannedNicknames.includes(updateData.nickname)) {
        return NextResponse.json({ error: 'Nickname is banned' }, { status: 409 });
      }

      const { data: existingUser, error: existingUserError } = await supabase
        .from('users')
        .select('id')
        .eq('nickname', updateData.nickname)
        .neq('auth0_id', userIdToUpdate)
        .single();

      if (existingUserError && existingUserError.code !== 'PGRST116') {
        throw existingUserError;
      }

      if (existingUser) {
        return NextResponse.json({ error: 'Nickname already exists' }, { status: 409 });
      }
    }

    // Filter out non-allowed fields for non-admin users
    const filteredUpdateData = isAdminUser
      ? updateData
      : Object.fromEntries(
          Object.entries(updateData).filter(([key]) => allowedFields.includes(key))
        );
    const { data, error } = await supabase
      .from('users')
      .update(filteredUpdateData)
      .eq('auth0_id', userIdToUpdate)
      .select();
    if (error) throw error;
    return NextResponse.json({ message: 'User updated successfully', data });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
