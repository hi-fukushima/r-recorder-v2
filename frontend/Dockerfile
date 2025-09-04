# --- ビルドステージ ---
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# ★★★ `npm run build`で本番用の静的ファイルを生成 ★★★
RUN npm run build

# --- 配信用ステージ ---
FROM nginx:alpine

# ★★★ ビルドステージで生成した静的ファイルをNGINXの公開ディレクトリにコピー ★★★
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]