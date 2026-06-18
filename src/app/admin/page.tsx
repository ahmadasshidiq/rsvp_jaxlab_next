import { cookies } from 'next/headers';
import AdminClient from './AdminClient';

const AUTH_COOKIE = 'admin_auth';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const initialAuthenticated = cookieStore.get(AUTH_COOKIE)?.value === '1';

  return <AdminClient initialAuthenticated={initialAuthenticated} />;
}
