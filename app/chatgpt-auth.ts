import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { env } from 'cloudflare:workers';

export type ChatGPTUser = { userId: string; displayName: string; email: string; fullName: string | null };
type LocalUser = { username: string; password: string; displayName: string };
type LocalConfig = { secret: string; users: LocalUser[]; secureCookie: boolean };

const USER_ID_HEADER = 'oai-authenticated-user-id';
const USER_EMAIL_HEADER = 'oai-authenticated-user-email';
const USER_FULL_NAME_HEADER = 'oai-authenticated-user-full-name';
const USER_FULL_NAME_ENCODING_HEADER = 'oai-authenticated-user-full-name-encoding';
const PERCENT_ENCODED_UTF8 = 'percent-encoded-utf-8';
const SIGN_IN_PATH = '/signin-with-chatgpt';
const SIGN_OUT_PATH = '/signout-with-chatgpt';
const CALLBACK_PATH = '/callback';
export const LOCAL_SESSION_COOKIE = 'labverify_local_session';
const LOCAL_SESSION_TTL_SECONDS = 12 * 60 * 60;

function localConfig(): LocalConfig | null {
  const workerVars = env as unknown as Record<string, unknown>;
  const nodeVars: Record<string, string | undefined> = typeof process !== 'undefined' ? process.env : {};
  const value = (key: string): string | undefined => {
    const candidate = workerVars[key] ?? nodeVars[key];
    return typeof candidate === 'string' ? candidate : undefined;
  };
  if (value('LABVERIFY_LOCAL_MODE') !== 'true') return null;
  const secret = value('LABVERIFY_SESSION_SECRET') ?? '';
  const rawUsers = value('LABVERIFY_LOCAL_USERS') ?? '';
  if (secret.length < 32 || !rawUsers) return null;
  try {
    const users = JSON.parse(rawUsers);
    if (!Array.isArray(users) || users.length < 1 || users.length > 100) return null;
    const clean = users.map((user): LocalUser | null => {
      if (!user || typeof user !== 'object') return null;
      const value = user as Record<string, unknown>;
      const username = typeof value.username === 'string' ? value.username.trim() : '';
      const password = typeof value.password === 'string' ? value.password : '';
      const displayName = typeof value.displayName === 'string' ? value.displayName.trim() : username;
      if (!/^[a-zA-Z0-9._-]{3,64}$/.test(username) || password.length < 12 || displayName.length < 1 || displayName.length > 100) return null;
      return { username, password, displayName };
    });
    if (clean.some((user) => user === null)) return null;
    return { secret, users: clean as LocalUser[], secureCookie: value('LABVERIFY_COOKIE_SECURE') === 'true' };
  } catch { return null; }
}

function b64url(value: string | Uint8Array): string {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}
function decodeB64url(value: string): Uint8Array | null {
  try {
    const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - (value.length % 4)) % 4);
    return Uint8Array.from(atob(padded), (letter) => letter.charCodeAt(0));
  } catch { return null; }
}
async function signature(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))));
}
function equal(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

export function localAuthEnabled(): boolean { return localConfig() !== null; }
export async function createLocalSession(username: string, password: string): Promise<{ value: string; secure: boolean } | null> {
  const config = localConfig();
  const user = config?.users.find((candidate) => candidate.username === username);
  if (!config || !user || !equal(user.password, password)) return null;
  const payload = b64url(JSON.stringify({ u: user.username, d: user.displayName, e: Math.floor(Date.now() / 1000) + LOCAL_SESSION_TTL_SECONDS }));
  return { value: `${payload}.${await signature(payload, config.secret)}`, secure: config.secureCookie };
}
async function localUser(): Promise<ChatGPTUser | null> {
  const config = localConfig();
  const session = (await cookies()).get(LOCAL_SESSION_COOKIE)?.value;
  if (!config || !session) return null;
  const [payload, signed] = session.split('.');
  if (!payload || !signed || !equal(await signature(payload, config.secret), signed)) return null;
  const decoded = decodeB64url(payload);
  if (!decoded) return null;
  try {
    const value = JSON.parse(new TextDecoder().decode(decoded));
    const user = config.users.find((candidate) => candidate.username === value.u);
    if (!user || value.d !== user.displayName || !Number.isInteger(value.e) || value.e < Math.floor(Date.now() / 1000)) return null;
    return { userId: `local:${user.username}`, displayName: user.displayName, email: `${user.username}@local.labverify`, fullName: user.displayName };
  } catch { return null; }
}

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const local = await localUser();
  if (local) return local;
  if (localConfig()) return null;
  const requestHeaders = await headers();
  const userId = requestHeaders.get(USER_ID_HEADER);
  const email = requestHeaders.get(USER_EMAIL_HEADER);
  if (!userId || !email) return null;
  const encodedFullName = requestHeaders.get(USER_FULL_NAME_HEADER);
  const fullName = encodedFullName && requestHeaders.get(USER_FULL_NAME_ENCODING_HEADER) === PERCENT_ENCODED_UTF8 ? safeDecodeURIComponent(encodedFullName) : null;
  return { userId, displayName: fullName ?? email, email, fullName };
}
export async function requireChatGPTUser(returnTo: string): Promise<ChatGPTUser> {
  const user = await getChatGPTUser();
  if (user) return user;
  redirect(localConfig() ? `/signin?return_to=${encodeURIComponent(safeRelativeReturnPath(returnTo))}` : chatGPTSignInPath(returnTo));
}
export function chatGPTSignInPath(returnTo: string): string { return `${SIGN_IN_PATH}?return_to=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`; }
export function chatGPTSignOutPath(returnTo = '/'): string { return `${SIGN_OUT_PATH}?return_to=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`; }
export function localSessionCookie(value: string, secure: boolean): string { return `${LOCAL_SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${LOCAL_SESSION_TTL_SECONDS}${secure ? '; Secure' : ''}`; }
export function clearLocalSessionCookie(): string { return `${LOCAL_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`; }
function safeRelativeReturnPath(value: string): string {
  if (!value.startsWith('/') || value.startsWith('//')) return '/';
  try { const url = new URL(value, 'https://app.local'); if (url.origin !== 'https://app.local' || isReservedAuthPath(url.pathname)) return '/'; return `${url.pathname}${url.search}${url.hash}`; } catch { return '/'; }
}
function isReservedAuthPath(pathname: string): boolean { return pathname === SIGN_IN_PATH || pathname === SIGN_OUT_PATH || pathname === CALLBACK_PATH; }
function safeDecodeURIComponent(value: string): string | null { try { return decodeURIComponent(value); } catch { return null; } }
