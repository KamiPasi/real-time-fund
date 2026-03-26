const PUBLIC_RUNTIME_KEYS = [
  'NEXT_PUBLIC_LOGIN_ACCOUNT',
  'NEXT_PUBLIC_LOGIN_PASSWORD',
  'NEXT_PUBLIC_ENABLE_SERVER_FILE_STORAGE',
  'NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY',
  'NEXT_PUBLIC_GA_ID',
  'NEXT_PUBLIC_GITHUB_LATEST_RELEASE_URL'
];

const getProcessEnv = () => {
  if (typeof process === 'undefined' || !process.env) {
    return {};
  }

  return process.env;
};

const getWindowRuntimeConfig = () => {
  if (typeof window === 'undefined') {
    return {};
  }

  const runtimeConfig = window.__APP_RUNTIME_CONFIG__;
  return runtimeConfig && typeof runtimeConfig === 'object' ? runtimeConfig : {};
};

export const getRuntimeConfig = () => {
  const processEnv = getProcessEnv();
  const windowRuntimeConfig = getWindowRuntimeConfig();

  return PUBLIC_RUNTIME_KEYS.reduce((acc, key) => {
    const runtimeValue = windowRuntimeConfig[key];
    const processValue = processEnv[key];
    acc[key] = typeof runtimeValue === 'string'
      ? runtimeValue
      : (typeof processValue === 'string' ? processValue : '');
    return acc;
  }, {});
};

export const getPublicRuntimeEnv = (key) => {
  return getRuntimeConfig()[key] || '';
};
