"""
APIエンドポイントのテスト
"""

from unittest.mock import patch, MagicMock


class TestHealthEndpoint:
    """ヘルスチェックエンドポイントのテスト"""

    def test_health_check(self, client):
        """ヘルスチェックが正常に動作することを確認"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


class TestLoginEndpoint:
    """ログインエンドポイントのテスト"""

    def test_login_missing_credentials(self, client):
        """認証情報が不足している場合のテスト"""
        response = client.post("/api/login")
        assert response.status_code == 422  # Validation Error

    @patch("app.main.radiko_authenticate")
    def test_login_success(self, mock_authenticate, client):
        """ログイン成功のテスト"""
        # モックの設定
        mock_authenticate.return_value = MagicMock(
            auth_token="test_token", area_id="JP13"
        )

        response = client.post(
            "/api/login", data={"email": "test@example.com", "password": "testpass"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert "radiko_token" in data
        assert data["token_type"] == "bearer"

    @patch("app.main.radiko_authenticate")
    def test_login_failure(self, mock_authenticate, client):
        """ログイン失敗のテスト"""
        # モックの設定（認証失敗）
        mock_authenticate.return_value = None

        response = client.post(
            "/api/login", data={"email": "test@example.com", "password": "wrongpass"}
        )

        assert response.status_code == 401
        assert response.json()["detail"] == "Login failed"


class TestStationsEndpoint:
    """放送局エンドポイントのテスト"""

    def test_stations_unauthorized(self, client):
        """認証なしでのアクセステスト"""
        response = client.get("/api/stations/JP13")
        assert response.status_code == 401

    @patch("app.main.get_station_list")
    def test_stations_authorized(self, mock_get_stations, client):
        """認証ありでのアクセステスト"""
        # モックの設定
        mock_get_stations.return_value = [{"id": "TBS", "name": "TBSラジオ"}]

        # 認証ヘッダーを追加
        headers = {"X-Radiko-AuthToken": "test_token"}
        response = client.get("/api/stations/JP13", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == "TBS"


class TestSearchEndpoint:
    """検索エンドポイントのテスト"""

    def test_search_unauthorized(self, client):
        """認証なしでの検索テスト"""
        response = client.get("/api/search/test")
        assert response.status_code == 401

    @patch("app.main.search_radiko_programs")
    def test_search_authorized(self, mock_search, client):
        """認証ありでの検索テスト"""
        # モックの設定
        mock_search.return_value = {
            "programs": [
                {
                    "title": "テスト番組",
                    "station_id": "TBS",
                    "station_name": "TBSラジオ",
                    "start_time": "2024-01-01T10:00:00",
                    "end_time": "2024-01-01T11:00:00",
                    "pfm": "テストパーソナリティ",
                    "image_url": None,
                }
            ],
            "total_results": 1,
            "current_page": 1,
            "total_pages": 1,
        }

        headers = {"X-Radiko-AuthToken": "test_token"}
        response = client.get("/api/search/test", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert "programs" in data
        assert "total_results" in data
        assert data["total_results"] == 1


class TestStatusEndpoint:
    """ステータスエンドポイントのテスト"""

    def test_status_unauthorized(self, client):
        """認証なしでのステータステスト"""
        response = client.get("/api/status")
        assert response.status_code == 401

    @patch("app.main.get_db_connection")
    def test_status_authorized(self, mock_get_db, client):
        """認証ありでのステータステスト"""
        # モックのデータベース接続
        mock_conn = MagicMock()
        mock_get_db.return_value = mock_conn

        # モックのクエリ結果
        mock_conn.execute.return_value.fetchall.return_value = []

        headers = {"X-Radiko-AuthToken": "test_token"}
        response = client.get("/api/status", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert "jobs" in data
        assert "logins" in data
