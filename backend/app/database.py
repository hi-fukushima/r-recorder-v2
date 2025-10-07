import os
import sqlite3

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "r_downloader.db")


def get_db_connection():
    """データベースへの接続を取得する"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """データベースのテーブルを初期化（作成）する"""
    conn = get_db_connection()
    # ログイン履歴テーブル
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS login_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            email TEXT NOT NULL,
            status TEXT NOT NULL
        )
        """
    )
    # ダウンロードログテーブル
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS download_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id TEXT UNIQUE NOT NULL,
            station_id TEXT NOT NULL,
            program_title TEXT NOT NULL,
            start_time TIMESTAMP NOT NULL,
            status TEXT NOT NULL,
            filename TEXT
        )
        """
    )
    conn.commit()
    conn.close()
