// src/app/profile/[nickname]/page.js
import ProfilePage from '@/components/ProfilePage';

export default function Page({ params }) {
  return <ProfilePage nickname={params.nickname} />;
}