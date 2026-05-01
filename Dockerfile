# 第一阶段：构建 Vite React 项目
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build


# 第二阶段：使用 Caddy 部署
FROM caddy:2-alpine

# 拷贝构建后的静态文件
COPY --from=builder /app/dist /usr/share/caddy

# 拷贝 Caddy 配置
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80
EXPOSE 443