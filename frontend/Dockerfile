# Node.jsの公式イメージをベースにする
FROM node:20-alpine

# コンテナ内の作業ディレクトリを設定
WORKDIR /app

# 依存関係のファイルを先にコピー
COPY package.json package-lock.json* ./

# 依存ライブラリをインストール
RUN npm install

# プロジェクトの残りのファイルをコピー
COPY . .

# 開発サーバーが使うポートを公開
EXPOSE 3000

# コンテナ起動時のデフォルトコマンド
CMD [ "npm", "run", "dev" ]