'use client';

import { getPublicRuntimeEnv } from './runtimeConfig';

const getConfiguredAccount = () => (getPublicRuntimeEnv('NEXT_PUBLIC_LOGIN_ACCOUNT') || '').trim();
const getConfiguredPassword = () => getPublicRuntimeEnv('NEXT_PUBLIC_LOGIN_PASSWORD') || '';
const isServerFileStorageEnabled = () => getPublicRuntimeEnv('NEXT_PUBLIC_ENABLE_SERVER_FILE_STORAGE') === 'true';

export const isServerFileStorageConfigured = () => Boolean(
  isServerFileStorageEnabled() &&
  getConfiguredAccount() &&
  getConfiguredPassword()
);

const getAuthHeader = () => {
  if (typeof window === 'undefined') return '';
  const configuredAccount = getConfiguredAccount();
  const configuredPassword = getConfiguredPassword();
  const encoded = new TextEncoder().encode(`${configuredAccount}:${configuredPassword}`);
  let binary = '';
  encoded.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return `Basic ${window.btoa(binary)}`;
};

const parseResponse = async (response) => {
  const text = await response.text();
  let payload = {};

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(payload?.message || `请求失败 (${response.status})`);
  }

  return payload;
};

export const fetchServerConfig = async (userId) => {
  if (!isServerFileStorageConfigured() || !userId) {
    return { exists: false, data: null, updatedAt: null };
  }

  const response = await fetch(`/api/config?userId=${encodeURIComponent(userId)}`, {
    headers: {
      Authorization: getAuthHeader()
    },
    cache: 'no-store'
  });

  if (response.status === 404) {
    return { exists: false, data: null, updatedAt: null };
  }

  const payload = await parseResponse(response);
  return {
    exists: Boolean(payload?.exists),
    data: payload?.data ?? null,
    updatedAt: payload?.updatedAt ?? null
  };
};

export const saveServerConfig = async (userId, data) => {
  if (!isServerFileStorageConfigured() || !userId) {
    throw new Error('未启用服务器文件存储');
  }

  const response = await fetch('/api/config', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader()
    },
    body: JSON.stringify({ userId, data })
  });

  const payload = await parseResponse(response);
  return {
    updatedAt: payload?.updatedAt ?? null
  };
};
