'use client';

import { v5 as uuidv5 } from 'uuid';
import { getPublicRuntimeEnv } from './runtimeConfig';

const AUTH_STORAGE_KEY = 'localAuthSession';
const ACCOUNT_NAMESPACE = '0f2b6dd6-3b34-4dc8-9d4b-2d72a5e8a4bf';
const CREDENTIAL_NAMESPACE = 'a6f7c6d9-1d1f-4e5a-9af6-0c0c7d2f8f12';

const getConfiguredAccount = () => (getPublicRuntimeEnv('NEXT_PUBLIC_LOGIN_ACCOUNT') || '').trim();
const getConfiguredPassword = () => getPublicRuntimeEnv('NEXT_PUBLIC_LOGIN_PASSWORD') || '';

export const isPasswordAuthConfigured = () => Boolean(getConfiguredAccount() && getConfiguredPassword());

const subscribers = new Set();

const looksLikeEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const getCredentialFingerprint = () => {
  const configuredAccount = getConfiguredAccount();
  const configuredPassword = getConfiguredPassword();
  if (!configuredAccount || !configuredPassword) return '';
  return uuidv5(`${configuredAccount}\n${configuredPassword}`, CREDENTIAL_NAMESPACE);
};

const createUser = () => {
  const configuredAccount = getConfiguredAccount();
  return {
    id: uuidv5(configuredAccount.toLowerCase(), ACCOUNT_NAMESPACE),
    account: configuredAccount,
    email: looksLikeEmail(configuredAccount) ? configuredAccount : ''
  };
};

const createSession = () => ({
  user: createUser(),
  fingerprint: getCredentialFingerprint(),
  created_at: new Date().toISOString()
});

const emitAuthStateChange = (event, session) => {
  subscribers.forEach((callback) => {
    try {
      callback(event, session);
    } catch { }
  });
};

const clearStoredSession = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
};

const readStoredSession = () => {
  const configuredAccount = getConfiguredAccount();
  if (typeof window === 'undefined' || !isPasswordAuthConfigured()) return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed?.fingerprint !== getCredentialFingerprint() ||
      parsed?.user?.account !== configuredAccount
    ) {
      clearStoredSession();
      return null;
    }
    return {
      ...parsed,
      user: createUser()
    };
  } catch {
    clearStoredSession();
    return null;
  }
};

const persistSession = (session) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
};

export const localAuth = {
  async getSession() {
    return {
      data: { session: readStoredSession() },
      error: null
    };
  },
  onAuthStateChange(callback) {
    subscribers.add(callback);

    const handleStorage = (event) => {
      if (event.key !== AUTH_STORAGE_KEY) return;
      const session = readStoredSession();
      callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
    }

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            subscribers.delete(callback);
            if (typeof window !== 'undefined') {
              window.removeEventListener('storage', handleStorage);
            }
          }
        }
      }
    };
  },
  async signInWithPassword({ account, password }) {
    const configuredAccount = getConfiguredAccount();
    const configuredPassword = getConfiguredPassword();

    if (!configuredAccount || !configuredPassword) {
      return {
        data: null,
        error: { message: '未配置账号密码' }
      };
    }

    const normalizedAccount = (account || '').trim();
    if (!normalizedAccount || !password) {
      return {
        data: null,
        error: { message: '请输入账号和密码' }
      };
    }

    if (normalizedAccount !== configuredAccount || password !== configuredPassword) {
      return {
        data: null,
        error: { message: '账号或密码错误' }
      };
    }

    const session = createSession();
    persistSession(session);
    emitAuthStateChange('SIGNED_IN', session);

    return {
      data: { session, user: session.user },
      error: null
    };
  },
  async signOut() {
    clearStoredSession();
    emitAuthStateChange('SIGNED_OUT', null);
    return { error: null };
  }
};
