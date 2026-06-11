# 教务管理 AI 助手

这是一个 Vue 3 + Vite + TypeScript 的教务管理应用。前端提供学生管理、班级管理和班级成员维护；右下角 AI 助手通过 CopilotKit 读取当前页面数据，并调用前端工具完成学生 CRUD、班级 CRUD、学生分班和页面跳转。后端使用 TypeScript 启动 CopilotKit runtime，并通过 OpenAI 兼容接口连接模型服务。

## 环境配置

复制 `.env.example` 为 `.env`，按需填写：

```bash
OPENAI_API_KEY=sk-your-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
OPENAI_API_MODE=chat
SERVER_PORT=4000
VITE_COPILOT_RUNTIME_URL=/api/copilotkit
```

如果使用第三方 OpenAI 兼容代理，优先保持 `OPENAI_API_MODE=chat`，模型名需要填代理实际支持的名称。

## 本地运行

```bash
npm install
npm run dev
```

默认启动：

- 前端：`http://localhost:5173/`
- 后端 runtime：`http://localhost:4000/api/copilotkit`
- 健康检查：`http://localhost:4000/health`

## 局域网访问

```bash
npm run dev:host
```

启动后查看终端里的 `Network` 地址，例如 `http://192.168.x.x:5173/`。同一局域网下的手机或其他电脑访问这个地址即可。

## 常用命令

```bash
npm run dev:host
npm run type-check
npm run build
npm run preview
```
