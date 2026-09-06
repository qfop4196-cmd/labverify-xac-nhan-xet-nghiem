import { clearLocalSessionCookie, createLocalSession, localAuthEnabled, localSessionCookie } from '@/app/chatgpt-auth';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  if (!localAuthEnabled()) return Response.json({ error: 'Đăng nhập cục bộ chưa được bật.' }, { status: 404 });
  let input: { username?: unknown; password?: unknown };
  try { input = await request.json(); } catch { return Response.json({ error: 'Nội dung đăng nhập không hợp lệ.' }, { status: 400 }); }
  if (typeof input.username !== 'string' || typeof input.password !== 'string' || input.username.length > 64 || input.password.length > 256) return Response.json({ error: 'Tên đăng nhập hoặc mật khẩu không hợp lệ.' }, { status: 400 });
  const session = await createLocalSession(input.username.trim(), input.password);
  if (!session) return Response.json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng.' }, { status: 401 });
  return Response.json({ ok: true }, { headers: { 'Set-Cookie': localSessionCookie(session.value, session.secure), 'Cache-Control': 'no-store' } });
}
export function DELETE() { return Response.json({ ok: true }, { headers: { 'Set-Cookie': clearLocalSessionCookie(), 'Cache-Control': 'no-store' } }); }
