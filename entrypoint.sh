#!/bin/sh
# 启动 Node 服务前，将静态资源中的占位符替换为运行时环境变量
set -e

HTML_ROOT="/app/out"

# 转义 sed 替换串中的特殊字符：\ & |
escape_sed() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/&/\\&/g; s/|/\\|/g'
}

# 占位符与环境变量对应（占位符名 = 变量名）
replace_var() {
  placeholder="$1"
  value=$(escape_sed "${2:-}")
  find "$HTML_ROOT" -type f \( -name '*.js' -o -name '*.html' \) -exec sed -i "s|${placeholder}|${value}|g" {} \;
}

# 构建阶段写入占位符，此处替换为运行时环境变量
replace_var "__NEXT_PUBLIC_LOGIN_ACCOUNT__" "${NEXT_PUBLIC_LOGIN_ACCOUNT}"
replace_var "__NEXT_PUBLIC_LOGIN_PASSWORD__" "${NEXT_PUBLIC_LOGIN_PASSWORD}"
replace_var "__NEXT_PUBLIC_ENABLE_SERVER_FILE_STORAGE__" "${NEXT_PUBLIC_ENABLE_SERVER_FILE_STORAGE}"
replace_var "__NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY__" "${NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY}"
replace_var "__NEXT_PUBLIC_GA_ID__" "${NEXT_PUBLIC_GA_ID}"
replace_var "__NEXT_PUBLIC_GITHUB_LATEST_RELEASE_URL__" "${NEXT_PUBLIC_GITHUB_LATEST_RELEASE_URL}"

exec node /app/server.js
