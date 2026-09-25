export type LocalAccount = {
  name: string;
  organization: string;
  email: string;
  passwordHash: string;
};
export type NewLocalAccount = Omit<LocalAccount, 'passwordHash'> & { password: string };

async function hashPassword(password: string) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

const ACCOUNTS_KEY = 'trainhub.accounts';

export function getLocalAccounts(): LocalAccount[] {
  let raw: string | null;
  try {
    raw = localStorage.getItem(ACCOUNTS_KEY);
  } catch {
    throw new Error('Browser storage is unavailable.');
  }
  try {
    const value: unknown = JSON.parse(raw ?? '[]');
    return Array.isArray(value) ? value as LocalAccount[] : [];
  } catch {
    return [];
  }
}

export async function createLocalAccount(account: NewLocalAccount) {
  try {
    const accounts = getLocalAccounts();
    if (accounts.some((item) => item.email.toLowerCase() === account.email.toLowerCase())) {
      return { ok: false as const, message: 'An account with this email already exists. Sign in instead.' };
    }
    const passwordHash = await hashPassword(account.password);
    const profile: LocalAccount = {
      name: account.name,
      organization: account.organization,
      email: account.email,
      passwordHash,
    };
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, profile]));
    return { ok: true as const };
  } catch {
    return { ok: false as const, message: 'Your account could not be saved in this browser. Check your browser storage settings and try again.' };
  }
}

export async function signInLocalAccount(email: string, password: string) {
  const account = getLocalAccounts().find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!account || account.passwordHash !== await hashPassword(password)) return null;
  return account;
}
