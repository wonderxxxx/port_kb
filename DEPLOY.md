# Port KB 知识库系统 — 部署文档

> **版本**：v1.0  
> **适用系统**：Rocky Linux 9（打包机）+ 任意 glibc ≥ 2.34 的 Linux 发行版（部署机）  
> **打包方式**：Nuitka 编译为原生 Linux 可执行文件  
> **前端**：Vue 3.4 + Vite 5 + Element Plus + ECharts  
> **后端**：Python 3.11 + FastAPI + SQLAlchemy + sentence-transformers  
> **数据库**：PostgreSQL 14+ + pgvector 扩展  
> **配置策略**：方式 A —— `.env` 外置，**不打包进二进制**

---

## 目录

1. [整体架构](#1-整体架构)
2. [环境要求](#2-环境要求)
3. [项目结构](#3-项目结构)
4. [打包机准备（Rocky Linux 9）](#4-打包机准备rocky-linux-9)
5. [源码准备与前端构建](#5-源码准备与前端构建)
6. [Nuitka 编译后端](#6-nuitka-编译后端)
7. [产物整理与打包分发](#7-产物整理与打包分发)
8. [部署机安装](#8-部署机安装)
9. [配置 .env（关键）](#9-配置-env关键)
10. [启动与验证](#10-启动与验证)
11. [注册为 systemd 服务](#11-注册为-systemd-服务生产推荐)
12. [数据库初始化](#12-数据库初始化)
13. [升级与回滚](#13-升级与回滚)
14. [目录权限与安全加固](#14-目录权限与安全加固)
15. [一键打包脚本说明](#15-一键打包脚本说明)
16. [常见问题排查](#16-常见问题排查)
17. [运维命令速查](#17-运维命令速查)

---

## 1. 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                       浏览器（用户）                          │
│                   http(s)://your-domain                      │
└────────────────────────────┬────────────────────────────────┘
                             │  :80 / :443
                             ▼
            ┌─────────────────────────────────┐
            │         Nginx 反向代理（可选）       │
            │   /api/*  →  kb_server:8000     │
            │   /*      →  kb_server:8000     │
            └────────────────┬────────────────┘
                             │  :8000 (内部)
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                    kb_server（Nuitka 编译产物）                  │
│  ┌─────────────────────┐  ┌─────────────────────────────┐   │
│  │  FastAPI 后端路由     │  │   Vue 3 前端静态文件 (spa)   │   │
│  │  /api/documents     │  │   / (根路径)                 │   │
│  │  /api/search        │  │   /assets/*                │   │
│  │  /api/qa            │  │                             │   │
│  │  /api/models        │  │                             │   │
│  │  /api/auth          │  │                             │   │
│  └────────┬────────────┘  └─────────────────────────────┘   │
│           │                                                   │
│     ┌─────┴──────┐                                            │
│     │  .env 配置   │  ← 方式 A：外置，不打包进二进制           │
│     └────────────┘                                            │
└────────────────────────────┬─────────────────────────────────┘
                             │  :5432
                             ▼
            ┌─────────────────────────────────┐
            │     PostgreSQL 14+ + pgvector    │
            └─────────────────────────────────┘
```

**说明**：单进程架构，`kb_server` 同时托管前端静态文件和后端 API。部署极简，不需要额外部署 Nginx（但生产环境建议前置 Nginx 做 HTTPS + gzip）。

---

## 2. 环境要求

### 2.1 打包机（Rocky Linux 9）

| 组件 | 版本 | 说明 |
|------|------|------|
| 操作系统 | Rocky Linux 9 / RHEL 9 / AlmaLinux 9 | 使用 `dnf` 包管理器 |
| 内核 | ≥ 5.14 | Rocky 9 默认 |
| CPU | x86_64（amd64） | Nuitka 产物只能在同架构运行 |
| 内存 | ≥ 4 GB | sentence-transformers + PyTorch 编译较吃内存 |
| 磁盘 | ≥ 20 GB | PyTorch 依赖 + Nuitka 缓存 |
| Python | **3.11.x**（推荐）| Rocky 9 默认 3.9，需额外安装 3.11 |
| GCC | ≥ 8 | `dnf groupinstall "Development Tools"` 自带 |
| Node.js | ≥ 20.x | 前端构建用 |
| npm | ≥ 10.x | 随 Node 20 自带 |

### 2.2 部署机（运行 kb_server）

| 组件 | 版本 | 说明 |
|------|------|------|
| 操作系统 | Rocky Linux 9 / CentOS 9 / Ubuntu 22.04 / Debian 12 | glibc ≥ 2.34 即可 |
| CPU | x86_64（amd64） | 与打包机相同架构 |
| 内存 | ≥ 2 GB | sentence-transformers 运行需要 |
| PostgreSQL | **14+ / 15+ / 16+** | 推荐 15 |
| pgvector | 对应 PG 版本的最新版 | 向量检索必需扩展 |

> ⚠️ **打包机与部署机 glibc 兼容性**：Rocky Linux 9 编译产物依赖 glibc 2.34 + gcc 11 运行时，可在所有 glibc ≥ 2.34 的 Linux 上运行。如需兼容更老系统（如 Ubuntu 20.04 / CentOS 8），应在更老的打包机上编译，或使用 Docker 多阶段构建。

---

## 3. 项目结构

```
port_kb/
├── DEPLOY.md                  ← 本文件
├── build.sh                   ← Rocky Linux 一键打包脚本
├── README.md
│
├── frontend/                  # Vue 3 前端
│   ├── package.json           # build: "vue-tsc && vite build"
│   ├── vite.config.ts         # dev 代理 /api → localhost:8000
│   ├── tsconfig.json
│   ├── index.html
│   ├── src/
│   │   ├── main.ts
│   │   ├── App.vue
│   │   ├── router/index.ts
│   │   ├── views/
│   │   ├── components/
│   │   └── ...
│   └── dist/                  # ← npm run build 产物（Vite 默认输出）
│
└── backend/                   # Python FastAPI 后端
    ├── main.py                # 入口（已加 .env 显式加载 + 前端静态托管）
    ├── requirements.txt       # Python 依赖清单
    ├── .env                   # ⚠️ 真实密钥，已加入 .gitignore
    ├── .env.example           # ✅ 部署模板（无真实密钥）
    ├── app/
    │   ├── database.py
    │   ├── models.py
    │   ├── schemas.py
    │   ├── routes/            # documents / search / qa / models / auth
    │   └── utils/             # embedding / llm_client / keyword_search ...
    ├── reset_db.sql           # 数据库初始化 SQL
    ├── setup_db.py
    ├── init_admin.py
    └── start.sh               # 开发态启动脚本（conda + uvicorn --reload）
```

---

## 4. 打包机准备（Rocky Linux 9）

以下命令**只在打包机上执行一次**。

```bash
# 4.1 系统编译工具链
sudo dnf groupinstall -y "Development Tools"

# 4.2 Python 3.11（Rocky 9 默认 3.9，3.11 对 sentence-transformers 更友好）
sudo dnf install -y python3.11 python3.11-devel python3.11-pip
python3.11 --version      # 应输出 Python 3.11.x

# 4.3 PostgreSQL 头文件（psycopg2-binary 编译需要）
sudo dnf install -y postgresql-devel libpq-devel

# 4.4 其他系统库
sudo dnf install -y zlib-devel bzip2-devel openssl-devel sqlite-devel

# 4.5 Node.js 20 + npm
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
node -v    # 应输出 v20.x.x
npm  -v    # 应输出 10.x.x

# 4.6 （可选）UPX 压缩工具，减小产物体积
sudo dnf install -y upx || sudo snap install upx

# 4.7 （可选）Git
sudo dnf install -y git
```

---

## 5. 源码准备与前端构建

```bash
# 5.1 拉取代码（或从本地 git push）
cd /opt
git clone <你的仓库地址> port_kb
cd port_kb

# 5.2 构建前端
cd frontend

# 首次安装依赖；后续增量构建可跳过
npm ci      # 推荐（更稳定、更快），失败时改用 npm install

npm run build
# 成功后：frontend/dist/ 下有 index.html、assets/ 等

# 确认产物
ls -la dist/
# index.html
# assets/
```

> **前端产物路径**：Vite 默认输出到 `frontend/dist/`，无需额外配置。  
> **API 代理说明**：`vite.config.ts` 中的 `/api → localhost:8000` 代理只在开发态（`npm run dev`）生效。生产构建的 `dist/` 是纯静态文件，API 调用通过后端同进程的 FastAPI 路由 `/api/*` 完成（见 main.py 里的 SPA 兜底逻辑）。

---

## 6. Nuitka 编译后端

```bash
cd /opt/port_kb/backend

# 6.1 创建虚拟环境 + 安装依赖
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 6.2 把前端产物软链为 backend/frontend_dist
# main.py 里用 os.path.dirname(sys.executable)/frontend_dist 定位
ln -sfn "$(realpath ../frontend/dist)" frontend_dist
ls -la frontend_dist/    # 确认 index.html 存在

# 6.3 安装 Nuitka 打包工具
pip install nuitka ordered-set zstandard

# 6.4 执行编译（核心命令）
# ------------------------------------------------------------------
# 说明：
#   --standalone            生成独立目录，自动包含所有运行时依赖
#   --assume-yes-for-downloads  非交互，首次编译自动下载工具链
#   --enable-plugin=fastapi  处理 FastAPI 动态路由注册
#   --enable-plugin=uvicorn  处理 uvicorn 启动入口
#   --include-package=XXX    强制收集可能被静态分析漏掉的 C 扩展包
#   --include-package-data=sentence_transformers  包含模型元数据
#   --include-data-dir=frontend_dist=frontend_dist  嵌入前端产物
#   --output-dir=dist        编译产物输出到 backend/dist/
#   --output-filename=kb_server  可执行文件名（Linux 不带 .exe）
#   --lto=yes                链接时优化，减小体积
# ------------------------------------------------------------------
python -m nuitka --standalone \
    --assume-yes-for-downloads \
    --enable-plugin=fastapi \
    --enable-plugin=uvicorn \
    --include-package=sentence_transformers \
    --include-package=jieba \
    --include-package=pgvector \
    --include-package=psycopg2 \
    --include-package=rank_bm25 \
    --include-package-data=sentence_transformers \
    --include-package-data=app \
    --include-data-dir=frontend_dist=frontend_dist \
    --output-dir=dist \
    --output-filename=kb_server \
    --lto=yes \
    main.py
```

**首次编译耗时**：5 ~ 15 分钟（取决于机器性能）。后续增量编译 Nuitka 会利用缓存，快很多。

**成功标志**：命令执行完，`backend/dist/main.dist/kb_server` 文件存在且有执行权限。

---

## 7. 产物整理与打包分发

```bash
cd /opt/port_kb/backend

# 7.1 产物目录应该长这样：
ls -la dist/main.dist/
# kb_server                  ← Linux 可执行文件
# frontend_dist/             ← 已嵌入的 Vue 静态文件
# libpython3.11.so.1.0      ← Nuitka 运行时
# libpq.so.5                ← PostgreSQL 客户端库
# ... 其他 .so / .pyd

# 7.2 方式 A：只放 .env.example 模板，不放真实 .env
#     （build.sh 已经自动完成这步；手动打包时手动执行）
cp .env.example dist/main.dist/.env.example

# 7.3 附带部署辅助文件
cp reset_db.sql   dist/main.dist/   2>/dev/null || true
cp setup_db.py    dist/main.dist/   2>/dev/null || true
cp init_admin.py  dist/main.dist/   2>/dev/null || true
cp DEPLOY.md      dist/main.dist/   2>/dev/null || true

# 7.4 打包为 tar.gz（便于 scp 上传）
cd dist
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
tar czf port_kb_linux_${TIMESTAMP}.tar.gz main.dist/

# 7.5 查看大小
ls -lh port_kb_linux_*.tar.gz
# 通常 300 ~ 800 MB，取决于 PyTorch 依赖量
```

---

## 8. 部署机安装

> 部署机就是最终运行 `kb_server` 的服务器。

### 8.1 上传产物

```bash
# 从打包机 scp 过去
scp /opt/port_kb/backend/dist/port_kb_linux_*.tar.gz target@your-server:/opt/

# 在部署机上解压
ssh target@your-server
cd /opt
tar xzf port_kb_linux_*.tar.gz
mv main.dist port_kb        # 重命名为更直观的目录名
cd port_kb
```

### 8.2 验证可执行

```bash
# 直接跑一次，看看能否启动
chmod +x kb_server
./kb_server --host 0.0.0.0 --port 8000 &
# 如果 .env 还没配，会提示 "[FATAL] 缺少必要环境变量: DATABASE_URL"
# 这是正常的，先 Ctrl+C 停掉，去配 .env
```

### 8.3 （可选）压缩可执行文件

```bash
# 如果部署机装了 upx
upx --best --lzma kb_server
# 体积可减小 30% ~ 50%，启动速度略受影响（可忽略）
```

---

## 9. 配置 .env（关键）

这一步**在部署机上完成**。真实密钥永远不要放回 git 仓库。

```bash
cd /opt/port_kb

# 9.1 从模板复制一份
cp .env.example .env

# 9.2 编辑
vim .env
```

以下是 `.env` 中每个字段的说明：

| 字段 | 是否必填 | 默认值 | 说明 |
|------|---------|--------|------|
| `DATABASE_URL` | ✅ | — | PostgreSQL 连接串，格式 `postgresql://user:password@host:port/dbname` |
| `EMBEDDING_MODEL` | 推荐改 | `BAAI/bge-small-zh-v1.5` | Embedding 模型名，首次运行自动从 HuggingFace 下载 |
| `VECTOR_DIMENSION` | ⚠️ 必改 | `512` | 向量维度，必须与 Embedding 模型输出一致 |
| `LLM_API_BASE` | 推荐改 | — | LLM 接口地址 |
| `LLM_API_KEY` | ✅ | — | LLM API Key |
| `LLM_MODEL` | 推荐改 | — | LLM 模型名 |
| `DOCS_DIR` | 可选 | `./docs` | 文档存储目录，相对于 `kb_server` 所在目录 |
| `SECRET_KEY` | ✅ | — | JWT 签名密钥，务必生成随机值 |
| `ALGORITHM` | 可选 | `HS256` | JWT 算法 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 可选 | `30` | Token 过期时间（分钟） |
| `CHIZUKO_STYLE` | 可选 | `true` | 前端样式开关 |

### 9.3 生成安全的 SECRET_KEY

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
# 把输出的长字符串粘贴到 SECRET_KEY 字段
```

### 9.4 .env 文件权限

```bash
# 只有服务账号可读
sudo chown portkb:portkb .env
sudo chmod 600 .env
```

---

## 10. 启动与验证

### 10.1 直接启动（调试用）

```bash
cd /opt/port_kb
./kb_server --host 0.0.0.0 --port 8000

# 另开一个终端测一下
curl http://localhost:8000/
# 应返回 HTML（前端 index.html）

curl http://localhost:8000/api/auth/login -X POST -H "Content-Type: application/json" -d '{"username":"xxx","password":"xxx"}'
# 应返回 401/422（后端 API 连通即可）
```

### 10.2 验证清单

| 检查项 | 命令 | 预期结果 |
|--------|------|----------|
| 进程存活 | `ps aux \| grep kb_server` | 存在 kb_server 进程 |
| 端口监听 | `ss -tlnp \| grep 8000` | LISTEN 0 4096 0.0.0.0:8000 |
| 前端首页 | `curl -sI http://localhost:8000/ \| head -1` | `HTTP/1.1 200 OK` |
| API 路由 | `curl http://localhost:8000/api/` | 404 或 JSON 响应（路由存在） |
| 数据库连通 | `./kb_server` 启动时无 `FATAL` / DB 连接报错 | 正常启动 |
| 前端静态资源 | `curl -sI http://localhost:8000/assets/*.js \| head -1` | `HTTP/1.1 200 OK` |

---

## 11. 注册为 systemd 服务（生产推荐）

生产环境用 systemd 托管服务，自动重启 + 开机自启 + 日志收集。

### 11.1 创建专用服务账号

```bash
sudo useradd --system --home-dir /opt/port_kb --shell /sbin/nologin portkb
sudo chown -R portkb:portkb /opt/port_kb
```

### 11.2 创建 service 文件

```bash
sudo tee /etc/systemd/system/port-kb.service > /dev/null << 'EOF'
[Unit]
Description=Port KB Knowledge Base Server
After=network.target postgresql.service
Wants=network.target

[Service]
Type=simple
User=portkb
Group=portkb
WorkingDirectory=/opt/port_kb
Environment=PYTHONUNBUFFERED=1
Environment=LANG=C.UTF-8
ExecStart=/opt/port_kb/kb_server --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5
# 资源限制（可选，根据机器规格调整）
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF
```

### 11.3 启用服务

```bash
sudo systemctl daemon-reload
sudo systemctl enable port-kb          # 开机自启
sudo systemctl start port-kb
sudo systemctl status port-kb          # 确认 active (running)
```

### 11.4 常用运维命令

```bash
sudo systemctl status port-kb        # 状态
sudo systemctl restart port-kb       # 重启
sudo systemctl stop port-kb          # 停止
sudo journalctl -u port-kb -f        # 实时日志（Ctrl+C 退出）
sudo journalctl -u port-kb --since "1 hour ago"   # 最近 1 小时日志
sudo journalctl -u port-kb -n 100    # 最近 100 行
```

---

## 12. 数据库初始化

**pgvector 必须先装**：

```bash
# 在 PostgreSQL 服务器上执行（不是部署机）
sudo -u postgres psql -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### 12.1 初始化库表

```bash
# 方式一：附带的 SQL 脚本（随产物已打包）
cd /opt/port_kb
# 先在 PostgreSQL 里手动建一个空库，然后跑 SQL
psql "$(grep DATABASE_URL .env | cut -d= -f2)" -f reset_db.sql

# 方式二：Python 脚本（需要 venv / Nuitka 产物）
# 此方式需要 PostgreSQL Python 客户端可用
./kb_server   # 会自动执行 Base.metadata.create_all()（见 main.py）
```

### 12.2 初始化管理员账号（可选）

```bash
# 如果产物里有 init_admin.py
cd /opt/port_kb
./kb_server   # 启动一次
# 然后在数据库里手动插入，或者用配套脚本
```

### 12.3 备份与恢复

```bash
# 备份
pg_dump "$(grep DATABASE_URL .env | cut -d= -f2)" -F c -f /backup/kb_$(date +%F).dump

# 恢复
pg_restore "$(grep DATABASE_URL .env | cut -d= -f2)" -d /backup/kb_2026-11-03.dump
```

---

## 13. 升级与回滚

### 13.1 升级流程

```bash
# 1. 打包机上重新执行 build.sh 得到新产物
# 2. scp 到部署机
scp port_kb_linux_YYYYMMDD_HHMMSS.tar.gz target@server:/opt/

# 3. 部署机上备份 + 切换
ssh target@server
sudo systemctl stop port-kb
cp -a /opt/port_kb /opt/port_kb.bak_$(date +%Y%m%d_%H%M%S)   # 备份当前版本
tar xzf /opt/port_kb_linux_YYYYMMDD_HHMMSS.tar.gz -C /opt/
cp -a /opt/port_kb/.env /opt/main.dist/.env                  # 保留原配置
rm -rf /opt/port_kb
mv /opt/main.dist /opt/port_kb
sudo chown -R portkb:portkb /opt/port_kb
sudo systemctl start port-kb
sudo systemctl status port-kb
```

### 13.2 回滚流程

```bash
# 从最近备份恢复
sudo systemctl stop port-kb
rm -rf /opt/port_kb
mv /opt/port_kb.bak_YYYYMMDD_HHMMSS /opt/port_kb
sudo systemctl start port-kb
```

> 💡 **数据库迁移**：如果新版本涉及表结构变更，应在停止服务后、切换二进制前先执行 `ALTER TABLE`。建议用 Alembic 管理迁移脚本。

---

## 14. 目录权限与安全加固

```bash
# 服务账号隔离
sudo useradd --system portkb
sudo chown -R portkb:portkb /opt/port_kb
sudo chmod -R 750 /opt/port_kb
sudo chmod 600 /opt/port_kb/.env         # 密钥文件严格保护
sudo chmod 644 /opt/port_kb/README_DEPLOY.txt
```

### 14.1 防火墙（Rocky Linux / firewalld）

```bash
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload

# 生产建议只开 80/443（由 Nginx 代理），8000 仅对内
# sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="127.0.0.1" port protocol="tcp" port="8000" accept'
```

---

## 15. 一键打包脚本说明

项目根目录的 `build.sh` 自动化了第 5~7 步的全部流程。

```bash
# 在 Rocky Linux 打包机上
cd /opt/port_kb
chmod +x build.sh
./build.sh
```

### 15.1 脚本功能清单

| 阶段 | 动作 |
|------|------|
| 0. 环境检查 | node / npm / python3.11 / gcc 是否存在 |
| 1. 前端构建 | `cd frontend && npm ci && npm run build` |
| 2. 后端 venv | `python3.11 -m venv venv` + pip install |
| 3. 软链前端产物 | `ln -sfn ../frontend/dist backend/frontend_dist` |
| 4. Nuitka 编译 | `python -m nuitka --standalone ... main.py` |
| 5. 产物整理 | 复制 `.env.example` 模板（**不复制真实 .env**） |
| 6. 打 tar.gz | 时间戳命名，输出到 `backend/dist/` |
| 7. 打印交付提示 | 产物路径、大小、部署步骤 |

### 15.2 脚本关键设计（方式 A 安全）

```bash
# ❌ 不会做：
# cp "$BACKEND_DIR/.env" "$DIST_DIR/.env"

# ✅ 只会做：
if [[ -f "$BACKEND_DIR/.env.example" ]]; then
    cp "$BACKEND_DIR/.env.example" "$DIST_DIR/.env.example"
fi
```

### 15.3 重新打包命令（增量）

Nuitka 有缓存，前端如果没动过，只改后端代码会快很多：

```bash
# 清理旧产物但保留 venv 和 frontend_dist 软链
rm -rf backend/dist
# 然后重新执行 Nuitka 命令
source backend/venv/bin/activate
cd backend
python -m nuitka --standalone ... main.py   # 同 6.4 的完整命令
```

---

## 16. 常见问题排查

### Q1: 编译时报 "No C Compiler found"

```bash
# 确认编译器
gcc --version               # 应有输出
which gcc                   # 应有路径

# Rocky Linux 上装
sudo dnf groupinstall -y "Development Tools"
```

### Q2: 编译时报 "Python.h: No such file or directory"

缺 Python 头文件：

```bash
sudo dnf install -y python3.11-devel
```

### Q3: 编译时报 "libpq-fe.h: No such file or directory"

缺 PostgreSQL 头文件（psycopg2-binary 需要）：

```bash
sudo dnf install -y postgresql-devel libpq-devel
```

### Q4: 运行时报 "ImportError: libpq.so.5"

部署机缺少 PostgreSQL 客户端库：

```bash
# Rocky Linux / RHEL
sudo dnf install -y postgresql-libs

# Ubuntu / Debian
sudo apt install -y libpq5
```

### Q5: 运行时报 "ModuleNotFoundError: XXX"

Nuitka 静态分析漏收集，追加：

```bash
python -m nuitka ... --include-package=XXX main.py
# 或
python -m nuitka ... --include-module=XXX.YYY main.py
```

### Q6: 产物几百 MB，能小一点吗？

正常。PyTorch + sentence-transformers 本身很大。可选优化：

```bash
# UPX 压缩（部署机或打包机都可）
upx --best --lzma kb_server

# 用 ldd 查哪些 .so 可精简
ldd kb_server | grep "not found"
```

### Q7: sentence-transformers 找不到模型

首次运行会从 HuggingFace 下载（需要联网）。如果部署机不能联网：

```bash
# 方案 1：打包机上预下载一次
source backend/venv/bin/activate
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('BAAI/bge-small-zh-v1.5')"
# 缓存落在 ~/.cache/huggingface/，部署时手动拷过去

# 方案 2：改 .env 里的 EMBEDDING_MODEL 指向本地路径
# 先在能联网的机器上下载模型，再同步到部署机
```

### Q8: 启动后前端页面空白、接口 404

检查 `frontend_dist/` 是否在产物目录内：

```bash
ls -la /opt/port_kb/frontend_dist/
# 应该看到 index.html
# 如果不存在：main.py 会 fallback 返回 API JSON（见 root() 路由）
```

### Q9: 启动时报 "[FATAL] 缺少必要环境变量: DATABASE_URL"

`.env` 没有放在 `kb_server` 同级，或字段名拼错：

```bash
cd /opt/port_kb
ls -la .env                        # 确认文件存在
grep DATABASE_URL .env             # 确认字段存在
./kb_server --host 0.0.0.0 --port 8000   # 再试一次
```

### Q10: 数据库连接报 "FATAL: extension vector does not exist"

```bash
# 在 PostgreSQL 服务器上执行（不是部署机）
sudo -u postgres psql -d kb -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Q11: glibc 版本不兼容（部署机比打包机老）

Rocky Linux 9（glibc 2.34）产物在 CentOS 7（glibc 2.17）上**跑不起来**。解决：

- 在 **更老的打包机** 上编译（如 Rocky 8 / CentOS Stream 8，glibc 2.28）
- 或用 Docker 多阶段构建，以老镜像作为编译基础镜像
- 建议所有部署机统一到 Rocky 9 / Ubuntu 22.04 / Debian 12 以上

### Q12: systemd 启动后 journal 里没有日志

FastAPI / uvicorn 的日志默认输出到 stdout，systemd 会自动收集。如果没有：

```bash
# 确认 PYTHONUNBUFFERED=1 已在 service 文件里设置（强制 Python 无缓冲输出）
sudo cat /etc/systemd/system/port-kb.service | grep ENV

# 手动跑一下看输出
sudo -u portkb /opt/port_kb/kb_server --host 0.0.0.0 --port 8000

# 查 journal
sudo journalctl -u port-kb -f -o cat
```

---

## 17. 运维命令速查

```bash
# === systemd ===
sudo systemctl start  port-kb
sudo systemctl stop   port-kb
sudo systemctl restart port-kb
sudo systemctl status port-kb
sudo journalctl -u port-kb -f

# === 进程 & 端口 ===
ps aux | grep kb_server
ss -tlnp | grep 8000
lsof -i :8000

# === 快速健康检查 ===
curl -s http://localhost:8000/ | head -c 200
curl -s http://localhost:8000/api/auth/login -X POST -H "Content-Type: application/json" -d '{}'

# === 备份 ===
pg_dump "$(grep DATABASE_URL .env | cut -d= -f2)" -F c -f /backup/kb_$(date +%F).dump

# === 安全检查 ===
ls -la /opt/port_kb/.env          # 权限应为 600
git ls-files --others --exclude-standard backend/.env   # 确认 .env 不在追踪中（在打包机上跑）
```

---

## 附录 A：技术栈版本对照

| 组件 | 项目中使用版本 |
|------|---------------|
| Python | 3.11.x |
| FastAPI | 0.115.0 |
| Uvicorn | 0.31.0 |
| SQLAlchemy | 2.0.35 |
| sentence-transformers | 3.0.1 |
| pgvector (Python) | 0.3.0 |
| psycopg2-binary | 2.9.10 |
| Node.js | ≥ 20.x |
| Vue | 3.4.21 |
| Element Plus | 2.6.0 |
| Vite | 5.4.0 |
| TypeScript | 5.4.5 |
| Nuitka | 最新稳定版（pip install） |

## 附录 B：文档与脚本索引

| 文件 | 位置 | 用途 |
|------|------|------|
| **本部署文档** | 项目根目录 `DEPLOY.md` | 打包 + 部署全流程 |
| `.env.example` | `backend/.env.example` | 部署配置模板（无真实密钥） |
| `build.sh` | 项目根目录 `build.sh` | Rocky Linux 一键打包脚本 |
| `main.py` | `backend/main.py` | 已修改：显式加载 `.env` + 前端静态托管 |
| `.gitignore` | 项目根目录 `.gitignore` | 已修改：忽略 `.env` 但保留 `.env.example` |

---

> **安全提醒再次确认**：
> 1. `.env` 真实密钥**永远不要进 Git 仓库**。如果曾经提交过，务必：
>    ```bash
>    git rm --cached backend/.env
>    git commit -m "Remove .env from tracking"
>    # 然后更换已泄漏的密钥（LLM_API_KEY / SECRET_KEY / 数据库密码）
>    ```
> 2. `.env` 在部署机上权限严格 600
> 3. 打包产物、tar.gz、以及打包机本身都不应暴露到公网
