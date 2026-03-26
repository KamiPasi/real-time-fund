'use client';

import { LoginIcon } from './Icons';

export default function LoginModal({
  onClose,
  loginAccount,
  setLoginAccount,
  loginPassword,
  setLoginPassword,
  loginLoading,
  loginError,
  handleLogin
}) {
  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="登录"
      onClick={onClose}
    >
      <div className="glass card modal login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="title" style={{ marginBottom: 16 }}>
          <LoginIcon width="20" height="20" />
          <span>账号登录</span>
          <span className="muted">使用环境变量中配置的账号密码登录</span>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <div className="muted" style={{ marginBottom: 8, fontSize: '0.8rem' }}>
              请输入账号
            </div>
            <input
              style={{ width: '100%' }}
              className="input"
              type="text"
              autoComplete="username"
              placeholder="请输入账号"
              value={loginAccount}
              onChange={(e) => setLoginAccount(e.target.value)}
              disabled={loginLoading}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <div className="muted" style={{ marginBottom: 8, fontSize: '0.8rem' }}>
              请输入密码
            </div>
            <input
              style={{ width: '100%' }}
              className="input"
              type="password"
              autoComplete="current-password"
              placeholder="请输入密码"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              disabled={loginLoading}
            />
          </div>

          {loginError && (
            <div className="login-message error" style={{ marginBottom: 12 }}>
              <span>{loginError}</span>
            </div>
          )}
          <div className="row" style={{ justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="button"
              className="button secondary"
              onClick={onClose}
            >
              取消
            </button>
            <button
              className="button"
              type="submit"
              disabled={loginLoading || !loginAccount.trim() || !loginPassword}
            >
              {loginLoading ? '登录中...' : '登录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
