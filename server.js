const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';
const OUT_DIR = path.join(__dirname, 'out');
const STORAGE_FILE = process.env.CONFIG_STORAGE_FILE || path.join(__dirname, 'data', 'config-store.json');
const LOGIN_ACCOUNT = (process.env.NEXT_PUBLIC_LOGIN_ACCOUNT || '').trim();
const LOGIN_PASSWORD = process.env.NEXT_PUBLIC_LOGIN_PASSWORD || '';
const SERVER_FILE_STORAGE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_SERVER_FILE_STORAGE === 'true';
const MAX_BODY_BYTES = 10 * 1024 * 1024;

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

const getPublicRuntimeConfig = () => ({
  NEXT_PUBLIC_LOGIN_ACCOUNT: LOGIN_ACCOUNT,
  NEXT_PUBLIC_LOGIN_PASSWORD: LOGIN_PASSWORD,
  NEXT_PUBLIC_ENABLE_SERVER_FILE_STORAGE: process.env.NEXT_PUBLIC_ENABLE_SERVER_FILE_STORAGE || '',
  NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY: process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY || '',
  NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID || '',
  NEXT_PUBLIC_GITHUB_LATEST_RELEASE_URL: process.env.NEXT_PUBLIC_GITHUB_LATEST_RELEASE_URL || ''
});

const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const isPlainObject = (value) => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
};

const sendJson = (res, statusCode, payload, headers = {}) => {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    ...headers
  });
  res.end(body);
};

const sendText = (res, statusCode, body, headers = {}) => {
  res.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    ...headers
  });
  res.end(body);
};

const injectRuntimeConfig = (html) => {
  const serializedConfig = JSON.stringify(getPublicRuntimeConfig()).replace(/</g, '\\u003c');
  const script = `<script>self.__APP_RUNTIME_CONFIG__=${serializedConfig};self.process=self.process||{};self.process.env=Object.assign({}, self.process.env||{}, self.__APP_RUNTIME_CONFIG__);</script>`;

  if (html.includes('</head>')) {
    return html.replace('</head>', `${script}</head>`);
  }

  return `${script}${html}`;
};

const ensureStorageDirectory = () => {
  fs.mkdirSync(path.dirname(STORAGE_FILE), { recursive: true });
};

const readStore = () => {
  ensureStorageDirectory();

  if (!fs.existsSync(STORAGE_FILE)) {
    return { version: 1, users: {} };
  }

  try {
    const content = fs.readFileSync(STORAGE_FILE, 'utf8');
    if (!content.trim()) {
      return { version: 1, users: {} };
    }
    const parsed = JSON.parse(content);
    return {
      version: 1,
      users: isPlainObject(parsed?.users) ? parsed.users : {}
    };
  } catch {
    return { version: 1, users: {} };
  }
};

const writeStore = (store) => {
  ensureStorageDirectory();
  const tempFile = `${STORAGE_FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tempFile, STORAGE_FILE);
};

const readRequestBody = async (req) => {
  const chunks = [];
  let total = 0;

  for await (const chunk of req) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) {
      throw createHttpError(413, '请求体过大');
    }
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString('utf8');
};

const getExpectedAuthBuffer = () => {
  return Buffer.from(`${LOGIN_ACCOUNT}:${LOGIN_PASSWORD}`, 'utf8');
};

const isAuthorized = (req) => {
  if (!SERVER_FILE_STORAGE_ENABLED) {
    throw createHttpError(404, '服务器文件存储未启用');
  }

  if (!LOGIN_ACCOUNT || !LOGIN_PASSWORD) {
    throw createHttpError(503, '登录账号或密码未配置');
  }

  const header = req.headers.authorization || '';
  if (!header.startsWith('Basic ')) {
    throw createHttpError(401, '未授权');
  }

  let actualBuffer;
  try {
    actualBuffer = Buffer.from(header.slice(6), 'base64');
  } catch {
    throw createHttpError(401, '授权信息无效');
  }

  const expectedBuffer = getExpectedAuthBuffer();
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    throw createHttpError(401, '账号或密码错误');
  }
};

const normalizeUserId = (value) => {
  const userId = typeof value === 'string' ? value.trim() : '';
  if (!userId) {
    throw createHttpError(400, '缺少 userId');
  }
  if (userId.length > 200) {
    throw createHttpError(400, 'userId 过长');
  }
  return userId;
};

const insideDirectory = (baseDir, filePath) => {
  const relative = path.relative(baseDir, filePath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
};

const resolveStaticFile = (pathname) => {
  const decodedPath = decodeURIComponent(pathname);
  const relativePath = decodedPath.replace(/^\/+/, '');
  const candidates = [];

  if (!relativePath || relativePath.endsWith('/')) {
    candidates.push(path.join(relativePath, 'index.html'));
  } else {
    candidates.push(relativePath);
    if (!path.extname(relativePath)) {
      candidates.push(`${relativePath}.html`);
      candidates.push(path.join(relativePath, 'index.html'));
    }
  }

  for (const candidate of candidates) {
    const absolutePath = path.resolve(OUT_DIR, candidate);
    if (!insideDirectory(OUT_DIR, absolutePath)) {
      continue;
    }
    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
      return absolutePath;
    }
  }

  return null;
};

const serveStatic = (req, res, url) => {
  if (url.pathname === '/healthz') {
    sendJson(res, 200, { ok: true });
    return;
  }

  let filePath;
  try {
    filePath = resolveStaticFile(url.pathname);
  } catch {
    sendText(res, 400, 'Bad Request');
    return;
  }

  if (!filePath) {
    if (path.extname(url.pathname)) {
      sendText(res, 404, 'Not Found');
      return;
    }
    filePath = path.join(OUT_DIR, 'index.html');
  }

  const extension = path.extname(filePath).toLowerCase();
  const headers = {
    'Content-Type': MIME_TYPES[extension] || 'application/octet-stream',
    'Cache-Control': url.pathname.startsWith('/_next/')
      ? 'public, max-age=31536000, immutable'
      : 'no-cache'
  };

  if (req.method === 'HEAD') {
    res.writeHead(200, headers);
    res.end();
    return;
  }

  if (extension === '.html') {
    try {
      const html = fs.readFileSync(filePath, 'utf8');
      const body = injectRuntimeConfig(html);
      res.writeHead(200, {
        ...headers,
        'Content-Length': Buffer.byteLength(body)
      });
      res.end(body);
      return;
    } catch {
      sendText(res, 500, 'Internal Server Error');
      return;
    }
  }

  const stream = fs.createReadStream(filePath);
  stream.on('open', () => {
    res.writeHead(200, headers);
  });
  stream.on('error', () => {
    if (!res.headersSent) {
      sendText(res, 500, 'Internal Server Error');
    } else {
      res.destroy();
    }
  });
  stream.pipe(res);
};

const handleConfigApi = async (req, res, url) => {
  try {
    isAuthorized(req);
  } catch (error) {
    const headers = error.status === 401
      ? { 'WWW-Authenticate': 'Basic realm="real-time-fund"' }
      : {};
    sendJson(res, error.status || 500, { message: error.message }, headers);
    return;
  }

  if (req.method === 'GET') {
    try {
      const userId = normalizeUserId(url.searchParams.get('userId'));
      const store = readStore();
      const entry = store.users[userId];

      if (!entry || !isPlainObject(entry.data)) {
        sendJson(res, 404, { exists: false });
        return;
      }

      sendJson(res, 200, {
        exists: true,
        data: entry.data,
        updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : null
      });
    } catch (error) {
      sendJson(res, error.status || 500, { message: error.message || '读取配置失败' });
    }
    return;
  }

  if (req.method === 'PUT') {
    try {
      const bodyText = await readRequestBody(req);
      const payload = bodyText ? JSON.parse(bodyText) : {};
      const userId = normalizeUserId(payload?.userId);
      if (!isPlainObject(payload?.data)) {
        throw createHttpError(400, '配置数据格式无效');
      }

      const store = readStore();
      const updatedAt = new Date().toISOString();
      store.users[userId] = {
        data: payload.data,
        updatedAt
      };
      writeStore(store);

      sendJson(res, 200, {
        ok: true,
        updatedAt
      });
    } catch (error) {
      const message = error instanceof SyntaxError
        ? '请求体不是有效的 JSON'
        : (error.message || '保存配置失败');
      sendJson(res, error.status || 500, { message });
    }
    return;
  }

  sendJson(res, 405, { message: '方法不支持' }, { Allow: 'GET, PUT' });
};

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    sendText(res, 400, 'Bad Request');
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/api/config') {
    await handleConfigApi(req, res, url);
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendJson(res, 405, { message: '方法不支持' }, { Allow: 'GET, HEAD' });
    return;
  }

  serveStatic(req, res, url);
});

server.listen(PORT, HOST, () => {
  console.log(`real-time-fund server listening on http://${HOST}:${PORT}`);
  console.log(`config storage file: ${STORAGE_FILE}`);
});
