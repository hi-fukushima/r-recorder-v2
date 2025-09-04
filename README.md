# R Downloader (v2)

Radikoのタイムフリー番組をダウンロードするための、個人利用向けWebアプリケーションです。

## 使用技術

  * **バックエンド**: Python, FastAPI, Gunicorn
  * **フロントエンド**: JavaScript, React, Vite, Pico.css
  * **データベース**: SQLite
  * **コンテナ技術**: Docker, Docker Compose
  * **Webサーバー/リバースプロキシ**: NGINX

## 動作要件

  * [Docker Desktop](https://www.docker.com/products/docker-desktop/)
  * [Node.js](https://nodejs.org/) および `npm`
  * Radikoプレミアムアカウント（ご自身ので）

## 導入・実行方法

#### 1\. セットアップ

1.  **リポジトリをクローン**

    ```bash
    git clone [リポジトリのURL]
    cd [リポジトリ名]
    ```

2.  **環境変数ファイルを作成**
    プロジェクトルートに`.env`ファイルを作成し、セッション用の秘密鍵を設定します。

    ```
    # .env 例
    SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    ```

3.  **コンテナのビルドと起動**

    ```bash
    docker-compose up -d --build
    ```

4.  **データベースの初期化**
    コンテナ起動後、以下のコマンドを**一度だけ**実行し、データベースを作成します。

    ```bash
    docker-compose exec backend python init_db.py
    ```

    ターミナルに `Initialized the database.` と表示されれば成功です。

#### 2\. アプリケーションの利用

1.  **アクセス**
    Webブラウザで `http://localhost:5001` にアクセスしてください。

2.  **操作フロー**
    ログイン → エリア選択 → 放送局選択 → 日付選択 → ダウンロード

3.  **アプリケーションの停止**

    ```bash
    docker-compose down
    ```

## 注意事項

  * 本アプリケーションは、**個人が私的に利用する目的**で作成されたものです。
  * ダウンロードした音声・画像等のコンテンツの**再配布、販売、アップロードなどの行為は著作権法で固く禁じられています**。
  * 本アプリケーションを利用したことによるいかなる損害についても、作成者は一切の責任を負いません。すべて自己責任でご利用ください。

## ライセンス

[MIT License](https://www.google.com/search?q=LICENSE)
