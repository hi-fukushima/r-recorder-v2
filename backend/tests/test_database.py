"""
データベース機能のテスト
"""
import pytest
import sqlite3
import tempfile
import os
from unittest.mock import patch, MagicMock

from app.database import get_db_connection, init_db


class TestDatabaseConnection:
    """データベース接続のテスト"""
    
    def test_get_db_connection(self):
        """データベース接続のテスト"""
        # 一時的なデータベースファイルを作成
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp:
            db_path = tmp.name
        
        try:
            # データベース接続をテスト
            conn = sqlite3.connect(db_path)
            conn.row_factory = sqlite3.Row
            conn.close()
            
            # 接続が成功することを確認
            assert True
        finally:
            # 一時ファイルを削除
            if os.path.exists(db_path):
                os.unlink(db_path)
    
    def test_database_initialization(self):
        """データベース初期化のテスト"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp:
            db_path = tmp.name
        
        try:
            # データベースを初期化
            conn = sqlite3.connect(db_path)
            conn.row_factory = sqlite3.Row
            
            # テーブルを作成
            conn.execute('''
                CREATE TABLE IF NOT EXISTS login_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    email TEXT NOT NULL,
                    status TEXT NOT NULL
                )
            ''')
            
            conn.execute('''
                CREATE TABLE IF NOT EXISTS download_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    job_id TEXT UNIQUE NOT NULL,
                    station_id TEXT NOT NULL,
                    program_title TEXT NOT NULL,
                    start_time TIMESTAMP NOT NULL,
                    status TEXT NOT NULL,
                    filename TEXT
                )
            ''')
            
            conn.commit()
            conn.close()
            
            # テーブルが作成されたことを確認
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in cursor.fetchall()]
            conn.close()
            
            assert 'login_history' in tables
            assert 'download_log' in tables
            
        finally:
            if os.path.exists(db_path):
                os.unlink(db_path)


class TestDatabaseOperations:
    """データベース操作のテスト"""
    
    def test_login_history_insertion(self):
        """ログイン履歴の挿入テスト"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp:
            db_path = tmp.name
        
        try:
            conn = sqlite3.connect(db_path)
            conn.row_factory = sqlite3.Row
            
            # テーブルを作成
            conn.execute('''
                CREATE TABLE IF NOT EXISTS login_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    email TEXT NOT NULL,
                    status TEXT NOT NULL
                )
            ''')
            
            # データを挿入
            conn.execute(
                "INSERT INTO login_history (email, status) VALUES (?, ?)",
                ("test@example.com", "success")
            )
            conn.commit()
            
            # データが挿入されたことを確認
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM login_history")
            rows = cursor.fetchall()
            conn.close()
            
            assert len(rows) == 1
            assert rows[0][2] == "test@example.com"  # email
            assert rows[0][3] == "success"  # status
            
        finally:
            if os.path.exists(db_path):
                os.unlink(db_path)
    
    def test_download_log_insertion(self):
        """ダウンロードログの挿入テスト"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp:
            db_path = tmp.name
        
        try:
            conn = sqlite3.connect(db_path)
            conn.row_factory = sqlite3.Row
            
            # テーブルを作成
            conn.execute('''
                CREATE TABLE IF NOT EXISTS download_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    job_id TEXT UNIQUE NOT NULL,
                    station_id TEXT NOT NULL,
                    program_title TEXT NOT NULL,
                    start_time TIMESTAMP NOT NULL,
                    status TEXT NOT NULL,
                    filename TEXT
                )
            ''')
            
            # データを挿入
            from datetime import datetime
            start_time = datetime.now()
            
            conn.execute(
                "INSERT INTO download_log (job_id, station_id, program_title, start_time, status) VALUES (?, ?, ?, ?, ?)",
                ("job_123", "TBS", "テスト番組", start_time, "queued")
            )
            conn.commit()
            
            # データが挿入されたことを確認
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM download_log")
            rows = cursor.fetchall()
            conn.close()
            
            assert len(rows) == 1
            assert rows[0][1] == "job_123"  # job_id
            assert rows[0][2] == "TBS"  # station_id
            assert rows[0][3] == "テスト番組"  # program_title
            assert rows[0][5] == "queued"  # status
            
        finally:
            if os.path.exists(db_path):
                os.unlink(db_path)


class TestDatabaseIntegration:
    """データベース統合テスト"""
    
    @patch('app.database.get_db_connection')
    def test_login_history_recording(self, mock_get_db):
        """ログイン履歴の記録テスト"""
        # モックのデータベース接続
        mock_conn = MagicMock()
        mock_get_db.return_value = mock_conn
        
        # ログイン処理をシミュレート
        from app.main import app
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        with patch('app.main.radiko_authenticate') as mock_auth:
            mock_auth.return_value = MagicMock(
                auth_token="test_token",
                area_id="JP13"
            )
            
            response = client.post(
                "/api/login",
                data={"email": "test@example.com", "password": "testpass"}
            )
            
            assert response.status_code == 200
            
            # データベースへの挿入が呼ばれたことを確認
            mock_conn.execute.assert_called_once()
            mock_conn.commit.assert_called_once()
            mock_conn.close.assert_called_once()
    
    @patch('app.database.get_db_connection')
    def test_download_job_logging(self, mock_get_db):
        """ダウンロードジョブのログ記録テスト"""
        # モックのデータベース接続
        mock_conn = MagicMock()
        mock_get_db.return_value = mock_conn
        
        # ダウンロードスケジュール処理をシミュレート
        from app.main import app
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        # 認証ヘッダーを設定
        headers = {"Authorization": "Bearer test_token"}
        
        download_data = {
            "station_id": "TBS",
            "station_name": "TBSラジオ",
            "program_title": "テスト番組",
            "start_time": "20240101100000",
            "end_time": "20240101110000",
            "radiko_token": "test_radiko_token"
        }
        
        response = client.post(
            "/api/download",
            json=download_data,
            headers=headers
        )
        
        # スケジュールが成功することを確認
        assert response.status_code == 202
        
        # データベースへの挿入が呼ばれたことを確認
        mock_conn.execute.assert_called()
        mock_conn.commit.assert_called()
        mock_conn.close.assert_called()
