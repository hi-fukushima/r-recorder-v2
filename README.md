# R Downloader (v2)

Radiko のタイムフリー番組をダウンロードするための、個人利用向け Web アプリケーションです。バックエンドは FastAPI、フロントエンドは React(Vite) で構築し、NGINX 経由で提供します。録音はプロジェクト直下の recordings/ 配下に保存されます。

## 構成 / 使用技術

- バックエンド: Python, FastAPI, Gunicorn (UvicornWorker), APScheduler, requests
- フロントエンド: React, Vite, Pico.css
- データベース: SQLite
- コンテナ: Docker, Docker Compose
- リバースプロキシ: NGINX

バックエンドは `/api` パスで公開され、NGINX がフロント配信と API のリバースプロキシを行います。

## 動作要件

- Docker Desktop（推奨）
- Radiko プレミアムアカウント（ご自身のアカウント）
- Node.js と npm は「ローカル開発やフロントのテスト」を行う場合にのみ必要（本番起動は Docker のみで可）

## セットアップと起動

1. リポジトリをクローン
   
   ```bash
   git clone [リポジトリのURL]
   cd [リポジトリ名]
   ```

2. 環境変数ファイルを作成（必須）
   プロジェクトルートに `.env` を作成し、JWT 用のシークレットキーを設定します。
   
   ```bash
   # .env の例
   SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. コンテナのビルドと起動
   
   ```bash
   docker-compose up -d --build
   ```

4. データベースの初期化（初回のみ）
   
   ```bash
   docker-compose exec backend python init_db.py
   ```
   ターミナルに `Database initialized.` が表示されれば成功です。

5. アクセス
   ブラウザで `http://localhost:5001` を開きます。

## 使い方

1. ログイン
   - 画面のログインフォームに「Radiko のメールアドレス」と「パスワード」を入力します。
   - 認証に成功すると、アプリ内で使用する JWT と Radiko の AuthToken が発行され、以後の API 呼び出しに利用されます。

2. 操作フロー
   - エリア選択 → 放送局選択 → 日付選択 → 番組表表示 → ダウンロード予約
   - 検索ページから番組検索も可能です。

3. ダウンロードについて
   - 予約後、バックエンドのスケジューラーが ffmpeg を用いてダウンロードを実行します。
   - 録音ファイルの保存先: `recordings/<放送局名>/<YYYYMMDD-HHMM_番組名>.aac`
   - Radiko のトークン有効期限切れなどで失敗した場合、ステータスページに失敗理由が表示されます。

## コンテナ構成とポート

- NGINX: ホストの `5001` 番ポートで待ち受け、フロント静的ファイル配信と `/api` をバックエンドへプロキシ
- Backend(FastAPI): コンテナ内ポート `8000`（外部へは直接公開せず、NGINX 経由）
- ボリューム:
  - `./recordings` → `/recordings`（録音ファイル）
  - `./backend/app/r_downloader.db` → `/app/app/r_downloader.db`（SQLite DB）

## 開発・テスト

- バックエンドのテスト（ローカル環境で）
  
  ```bash
  cd backend
  python -m venv .venv && source .venv/bin/activate  # Windows は .venv\Scripts\activate
  pip install -r requirements.txt
  pytest
  ```

- フロントエンドの開発/テスト（任意）
  
  ```bash
  cd frontend
  npm ci
  npm run test
  # 開発サーバーを起動する場合（必要に応じて CORS/プロキシ設定を調整）
  npm run dev
  ```

注意: フロントの開発サーバーはデフォルトポート（Vite）で起動します。バックエンドの CORS 設定は `http://localhost:3000` と `http://localhost:5001` が許可されています。それ以外のポートで dev する場合は `backend/app/main.py` の CORS origins を調整してください。

## トラブルシューティング

- ログインに失敗する / 401 が返る
  - Radiko の資格情報に誤りがないかご確認ください。
  - トークン期限切れの場合、再ログインしてください。
- ダウンロードに失敗する
  - ステータスページのエラー内容をご確認ください（トークン期限切れ、ネットワーク、番組の提供終了など）。
- DB をリセットしたい
  - アプリ停止後、`backend/app/r_downloader.db` を削除し、再度「データベース初期化」を実行してください。

## ライセンス

MIT License（https://opensource.org/licenses/MIT）
