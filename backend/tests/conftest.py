"""
Pytest設定ファイル
テスト用のフィクスチャとセットアップを定義
"""

import pytest
import tempfile
import os
from fastapi.testclient import TestClient

from app.main import app
from app.database import init_db


@pytest.fixture(scope="session")
def test_db():
    """テスト用のデータベースファイルを作成"""
    # 一時的なデータベースファイルを作成
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    # 環境変数を設定してテスト用データベースを使用
    original_db = os.environ.get("DATABASE_PATH")
    os.environ["DATABASE_PATH"] = db_path

    try:
        # データベースを初期化
        init_db()
        yield db_path
    finally:
        # クリーンアップ
        if original_db:
            os.environ["DATABASE_PATH"] = original_db
        else:
            os.environ.pop("DATABASE_PATH", None)

        if os.path.exists(db_path):
            os.unlink(db_path)


@pytest.fixture
def client(test_db):
    """テストクライアントのフィクスチャ"""
    return TestClient(app)


@pytest.fixture
def authenticated_client(client):
    """認証済みクライアントのフィクスチャ"""
    # 認証ヘッダーを設定
    headers = {"Authorization": "Bearer test_token"}
    client.headers.update(headers)
    return client
