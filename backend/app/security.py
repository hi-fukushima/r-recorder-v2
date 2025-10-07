import os
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

# --- 設定 ---
# SECRET_KEYは.envファイルから読み込むのが望ましい
SECRET_KEY = os.getenv("SECRET_KEY", "a_very_secret_key_that_should_be_in_env_file")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # トークンの有効期限 (24時間)

# --- FastAPIのセキュリティ機能 ---
# トークンを"Authorization: Bearer <token>"ヘッダーから受け取る
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- JWT生成 ---
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- JWT検証とユーザー取得（依存関係） ---
def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        return email
    except JWTError:
        raise credentials_exception
