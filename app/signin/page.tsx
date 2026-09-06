'use client';
import { FormEvent, useState } from 'react';
export default function Signin() {
  const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    const response = await fetch('/api/local-auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
    if (response.ok) { window.location.assign('/'); return; }
    const data = await response.json().catch(() => ({})) as { error?: unknown }; setError(typeof data.error === 'string' ? data.error : 'Không thể đăng nhập.'); setSaving(false);
  }
  return <main className="min-h-screen bg-[#f5f7f8] px-5 py-16 text-slate-900"><form onSubmit={submit} className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><p className="text-sm font-semibold tracking-[.18em] text-teal-700">LABVERIFY</p><h1 className="mt-3 text-2xl font-semibold">Đăng nhập máy chủ nội bộ</h1><p className="mt-2 text-sm leading-6 text-slate-600">Dùng tài khoản do quản trị viên của phòng xét nghiệm tạo trong tệp cấu hình máy chủ.</p><label className="mt-7 block text-sm font-medium">Tên đăng nhập<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" required /></label><label className="mt-4 block text-sm font-medium">Mật khẩu<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" required /></label>{error && <p className="mt-4 text-sm text-red-700">{error}</p>}<button disabled={saving} className="mt-7 w-full rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-white disabled:opacity-50">{saving ? 'Đang đăng nhập…' : 'Đăng nhập'}</button></form></main>;
}
