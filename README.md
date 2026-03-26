# 实时基金估值 (Real-time Fund Valuation)

一个基于 Next.js 开发的基金估值与重仓股实时追踪工具。采用玻璃拟态设计（Glassmorphism），支持移动端适配。
预览地址：  
1. [https://hzm0321.github.io/real-time-fund/](https://hzm0321.github.io/real-time-fund/)
2. [https://fund.cc.cd/](https://fund.cc.cd/) （加速国内访问）

## Star History

<a href="https://www.star-history.com/?repos=hzm0321%2Freal-time-fund&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/image?repos=hzm0321/real-time-fund&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/image?repos=hzm0321/real-time-fund&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/image?repos=hzm0321/real-time-fund&type=date&legend=top-left" />
 </picture>
</a>

## ✨ 特性

- **实时估值**：通过输入基金编号，实时获取并展示基金的单位净值、估值净值及实时涨跌幅。
- **重仓追踪**：自动获取基金前 10 大重仓股票，并实时追踪重仓股的盘中涨跌情况。支持收起/展开展示。
- **纯前端运行**：采用 JSONP 方案直连东方财富、腾讯财经等公开接口，彻底解决跨域问题，支持在 GitHub Pages 等静态环境直接部署。
- **本地持久化**：使用 `localStorage` 存储已添加的基金列表、持仓、交易记录、定投计划及配置信息，刷新不丢失。
- **响应式设计**：完美适配 PC 与移动端。针对移动端优化了文字展示、间距及交互体验。
- **自选功能**：支持将基金添加至"自选"列表，通过 Tab 切换展示全部基金或仅自选基金。自选状态支持持久化及同步清理。
- **分组管理**：支持创建多个基金分组，方便按用途或类别管理基金。
- **持仓管理**：记录每只基金的持有份额和成本价，自动计算持仓收益和累计收益。
- **交易记录**：支持买入/卖出操作，记录交易历史，支持查看单个基金的交易明细。
- **定投计划**：支持设置自动定投计划，可按日/周/月等周期自动生成买入交易。
- **远端存储**：支持在自托管服务器上将同一账号的配置写入本地 JSON 文件，换浏览器登录后可恢复同一份配置。
- **自定义排序**：支持多种排序规则（估值涨跌幅、持仓收益、持有金额等），可自由组合和启用/禁用规则。
- **拖拽排序**：在默认排序模式下可通过拖拽调整基金顺序。
- **明暗主题**：支持亮色/暗色主题切换，一键换肤。
- **导入/导出**：支持将配置导出为 JSON 文件备份，或从文件导入恢复。
- **可自定义频率**：支持设置自动刷新间隔（5秒 - 300秒），并提供手动刷新按钮。

## 🛠 技术栈

- **框架**：[Next.js](https://nextjs.org/) (App Router)
- **样式**：原生 CSS (Global CSS) + 玻璃拟态设计
- **数据源**：
  - 基金估值：天天基金 (JSONP)
  - 重仓数据：东方财富 (HTML Parsing)
  - 股票行情：腾讯财经 (Script Tag Injection)
- **部署**：GitHub Actions + GitHub Pages / Docker Compose

## 🚀 快速开始

### 本地开发

1. 克隆仓库：
   ```bash
   git clone https://github.com/hzm0321/real-time-fund.git
   cd real-time-fund
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 配置环境变量：
   ```bash
   cp env.example .env.local
   ```
   按照 `env.example` 填入以下值：
  - `NEXT_PUBLIC_LOGIN_ACCOUNT`：登录账号
  - `NEXT_PUBLIC_LOGIN_PASSWORD`：登录密码
  - `NEXT_PUBLIC_ENABLE_SERVER_FILE_STORAGE`：是否启用服务器文件存储；本地 `npm run dev` 建议保持 `false`
  - `CONFIG_STORAGE_FILE`：服务器配置文件路径，仅 Docker / 自定义 Node 服务使用
  - `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY`：Web3Forms Access Key
  - `NEXT_PUBLIC_GA_ID`：Google Analytics Measurement ID（如 `G-xxxx`）
  - `NEXT_PUBLIC_GITHUB_LATEST_RELEASE_URL`：GitHub 最新 Release 接口地址，用于在页面中展示“发现新版本”提示（如：`https://api.github.com/repos/hzm0321/real-time-fund/releases/latest`）

注：如不使用服务器文件存储、反馈或 GA 统计功能，可不设置对应变量

4. 运行开发服务器：
   ```bash
   npm run dev
   ```
   访问 [http://localhost:3000](http://localhost:3000) 查看效果。

### 登录与服务器存储说明
1. 配置固定账号密码

   在 `.env.local` 或 `.env` 中设置：
   ```
   NEXT_PUBLIC_LOGIN_ACCOUNT=admin
   NEXT_PUBLIC_LOGIN_PASSWORD=change_me
   ```
   页面登录框会直接校验这两个值，并基于账号生成固定 `user_id`。

2. 配置服务器文件存储

   服务器文件存储只在 Docker / 自托管 Node 服务下可用，静态托管（如 GitHub Pages）不支持。

   Docker Compose 推荐设置：
   ```
   NEXT_PUBLIC_ENABLE_SERVER_FILE_STORAGE=true
   CONFIG_STORAGE_FILE=/app/data/config-store.json
   ```

   登录后的行为：
   - 同账号首次在新浏览器登录时，会自动读取服务器文件中的配置并覆盖本地空数据。
   - 如果服务器还没有该账号的配置，而本地已有数据，会自动把本地配置写入服务器文件。
   - 只有本地和服务器都存在且内容不一致时，才会弹出冲突选择框。

3. 安全说明

   本项目仍是前端环境变量校验，`NEXT_PUBLIC_*` 变量会出现在浏览器端资源中。  
   因此当前“账号密码登录 + 服务器文件存储”只适合自用、内网或低安全要求场景，不适合作为真正的高安全认证方案。  
   如果公开部署，能够访问页面资源的人理论上都可以拿到这套登录信息。

### 构建与部署

本项目已配置 GitHub Actions。每次推送到 `main` 分支时，会自动执行构建并部署到 GitHub Pages。
如需使用 GitHub Actions 部署，请在 GitHub 项目 Settings → Secrets and variables → Actions 中创建对应的 Repository secrets（字段名称与 `.env.local` 保持一致）。
包括：`NEXT_PUBLIC_LOGIN_ACCOUNT`、`NEXT_PUBLIC_LOGIN_PASSWORD`、`NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY`、`NEXT_PUBLIC_GA_ID`、`NEXT_PUBLIC_GITHUB_LATEST_RELEASE_URL`。

说明：GitHub Pages 只能运行静态导出版本，因此不支持服务器文件存储；该模式仅适用于本地存储。

若要手动构建：
```bash
npm run build
```
静态文件将生成在 `out` 目录下。

### Docker 运行

镜像会启动一个 Node 进程，同时提供静态页面和 `/api/config` 文件存储接口。若要实现跨浏览器同步，请务必挂载数据卷保存 `/app/data`。

- **构建时写入**：构建时通过 `--build-arg` 或 `.env` 传入 `NEXT_PUBLIC_*`，值会打进镜像，运行时无需再传。
- **运行时替换**：构建时不传（或使用默认占位符），启动容器时通过 `-e` 或 `--env-file` 传入，入口脚本会在启动 Node 服务前替换静态资源中的占位符。

可复制 `env.example` 为 `.env` 并填入实际值；若要启用服务器文件存储，请将 `NEXT_PUBLIC_ENABLE_SERVER_FILE_STORAGE=true`。

1. 构建镜像
```bash
# 方式 A：运行时再注入配置（镜像内为占位符）
docker build -t real-time-fund .

# 方式 B：构建时写入配置
docker build -t real-time-fund --build-arg NEXT_PUBLIC_LOGIN_ACCOUNT=admin --build-arg NEXT_PUBLIC_LOGIN_PASSWORD=change_me --build-arg NEXT_PUBLIC_ENABLE_SERVER_FILE_STORAGE=true .
# 或依赖同目录 .env：docker compose build
```

2. 启动容器
```bash
# 若构建时未写入配置，可在此注入（与 --env-file .env 二选一）
docker run -d -p 3000:3000 --name fund --env-file .env -v real-time-fund-data:/app/data real-time-fund
```

#### docker-compose（会读取同目录 `.env` 作为 build-arg 与运行环境）
```bash
# 建议先：cp env.example .env 并将 NEXT_PUBLIC_ENABLE_SERVER_FILE_STORAGE 改为 true
docker compose up -d
```

[`docker-compose.yml`](./docker-compose.yml) 已内置命名卷 `config_data`，默认会把配置文件持久化到容器内 `/app/data/config-store.json`。

### Docker Hub

镜像已发布至 Docker Hub，可直接拉取运行，无需本地构建。

1. **拉取镜像**
   ```bash
   docker pull hzm0321/real-time-fund:latest
   ```

2. **启动容器**  
   访问 [http://localhost:3000](http://localhost:3000) 即可使用。
   ```bash
   docker run -d -p 3000:3000 --name real-time-fund --restart always -v real-time-fund-data:/app/data hzm0321/real-time-fund:latest
   ```

3. **使用自定义环境变量（运行时替换）**  
   镜像内已预置占位符，启动时通过环境变量即可覆盖，无需重新构建。例如使用本地 `.env`：
   ```bash
   docker run -d -p 3000:3000 --name real-time-fund --restart always --env-file .env -v real-time-fund-data:/app/data hzm0321/real-time-fund:latest
   ```
   或单独指定变量：`-e NEXT_PUBLIC_LOGIN_ACCOUNT=admin -e NEXT_PUBLIC_LOGIN_PASSWORD=change_me -e NEXT_PUBLIC_ENABLE_SERVER_FILE_STORAGE=true`。  
   变量名与本地开发一致：`NEXT_PUBLIC_LOGIN_ACCOUNT`、`NEXT_PUBLIC_LOGIN_PASSWORD`、`NEXT_PUBLIC_ENABLE_SERVER_FILE_STORAGE`、`NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY`、`NEXT_PUBLIC_GA_ID`、`NEXT_PUBLIC_GITHUB_LATEST_RELEASE_URL`，以及仅服务端使用的 `CONFIG_STORAGE_FILE`。

## 📖 使用说明

1. **添加基金**：在顶部输入框输入 6 位基金代码（如 `110022`），点击“添加”。
2. **查看详情**：卡片将展示实时估值及前 10 重仓股的占比与今日涨跌。
3. **调整频率**：点击右上角“设置”图标，可调整自动刷新的间隔时间。
4. **删除基金**：点击卡片右上角的红色删除图标即可移除。

## 💬 开发者交流群

欢迎基金实时开发者加入微信群聊讨论开发与协作：

<img src="./doc/weChatGroupDevelop.jpg" width="300">

## 📝 免责声明

本项目所有数据均来自公开接口，仅供个人学习及参考使用。数据可能存在延迟，不作为任何投资建议。

## 📄 开源协议 (License)

本项目采用 **[GNU Affero General Public License v3.0](https://www.gnu.org/licenses/agpl-3.0.html)**（AGPL-3.0）开源协议。

- **允许**：自由使用、修改、分发本软件；若你通过网络服务向用户提供基于本项目的修改版本，须向该服务的用户提供对应源代码。
- **要求**：基于本项目衍生或修改的作品需以相同协议开源，并保留版权声明与协议全文。
- **无担保**：软件按「原样」提供，不提供任何明示或暗示的担保。

完整协议文本见仓库根目录 [LICENSE](./LICENSE) 文件，或 [GNU AGPL v3 官方说明](https://www.gnu.org/licenses/agpl-3.0.html)。  

---
二开或转载需注明出处。  
Made by [hzm](https://github.com/hzm0321)
