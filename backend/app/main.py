import base64
import os
import shlex
import subprocess
import uuid
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from typing import List, Optional  # ★★★ 型ヒントのために追加 ★★★

import pytz
import requests
from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI, Form, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

from .database import get_db_connection
from .security import create_access_token, get_current_user

# --------------------------------------------------------------------------
# FastAPIの初期化とグローバル変数
# --------------------------------------------------------------------------
app = FastAPI()

# CORSミドルウェアの設定
origins = [
    "http://localhost:3000",  # フロントエンド（React）のURL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # 全てのHTTPメソッドを許可
    allow_headers=["*"],  # 全てのヘッダーを許可
)

scheduler = BackgroundScheduler(timezone="Asia/Tokyo")
scheduler.start()

JST = pytz.timezone('Asia/Tokyo')

radiko_session = None
user_email = None
user_password = None


# --------------------------------------------------------------------------
# Pydanticモデル (データの型定義)
# --------------------------------------------------------------------------
class TokenData(BaseModel):
    """認証トークンとエリアIDを格納するモデル"""
    auth_token: str
    area_id: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    radiko_token: str


class Station(BaseModel):
    id: str
    name: str


class Program(BaseModel):
    title: str
    start_time: datetime
    end_time: datetime
    duration: int
    pfm: Optional[str] = None
    image_url: Optional[str] = None  # 画像がない場合もあるのでOptional


class GuideResponse(BaseModel):
    station_name: str
    programs: List[Program]


class DownloadRequest(BaseModel):
    station_id: str
    station_name: str
    program_title: str
    start_time: str
    end_time: str


class DownloadJob(BaseModel):
    id: int
    program_title: str
    station_id: str
    start_time: datetime
    status: str
    filename: Optional[str] = None


class LoginHistory(BaseModel):
    id: int
    login_time: datetime
    email: str
    status: str


class StatusResponse(BaseModel):
    jobs: List[DownloadJob]
    logins: List[LoginHistory]


# --------------------------------------------------------------------------
# Radikoの認証ロジック
# --------------------------------------------------------------------------
def radiko_authenticate(mail: str, password: str):
    global radiko_session
    # (以前のコードとほぼ同じ。エラーハンドリングをFastAPI流に)
    try:
        radiko_session = requests.Session()
        res_login = radiko_session.post('https://radiko.jp/v4/api/member/login', data={'mail': mail, 'pass': password})
        res_login.raise_for_status()
        premium_cookie = radiko_session.cookies
        session_id = res_login.json()["radiko_session"]
        print(session_id)

        headers = {
            'User-Agent': 'curl/7.52.1', 'Accept': '*/*',
            'X-Radiko-App': 'pc_html5', 'X-Radiko-App-Version': '0.0.1',
            'X-Radiko-Device': 'pc', 'X-Radiko-User': 'dummy_user'
        }
        res1 = radiko_session.get('https://radiko.jp/v2/api/auth1', headers=headers, cookies=premium_cookie)
        res1.raise_for_status()

        auth_token = res1.headers['X-Radiko-AuthToken']
        key_length = int(res1.headers['X-Radiko-KeyLength']);
        key_offset = int(res1.headers['X-Radiko-KeyOffset'])

        radiko_key = "bcd151073c03b352e1ef2fd66c32209da9ca0afa"
        partial_key_bytes = radiko_key[key_offset:key_offset + key_length].encode('utf-8')
        partial_key = base64.b64encode(partial_key_bytes).decode('utf-8')

        headers.update({
            'X-Radiko-AuthToken': auth_token,
            'X-Radiko-PartialKey': partial_key,
        })
        res2 = radiko_session.get(f'https://radiko.jp/v2/api/auth2?radiko_session={session_id}', headers=headers,
                                  cookies=premium_cookie)
        res2.raise_for_status()

        area_id = res2.text.split(',')[0]
        return TokenData(auth_token=auth_token, area_id=area_id)
    except requests.exceptions.RequestException as e:
        # FastAPIではHTTPExceptionをraiseするのが一般的
        raise HTTPException(status_code=401, detail=f"Radiko authentication failed: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred during authentication: {e}")


def get_station_list(area_id: str, auth_token: str) -> List[Station]:
    url = f"http://radiko.jp/v3/station/list/{area_id}.xml"
    headers = {"X-Radiko-AuthToken": auth_token}
    try:
        res = requests.get(url, headers=headers);
        res.raise_for_status()
        stations = [];
        root = ET.fromstring(res.content)
        for station in root.findall('station'):
            stations.append(Station(id=station.find('id').text, name=station.find('name').text))
        return stations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"放送局リストの取得に失敗: {e}")


def get_program_guide(station_id: str, date_str: str, auth_token: str) -> GuideResponse:
    url = f"http://radiko.jp/v3/program/station/date/{date_str}/{station_id}.xml"
    headers = {"X-Radiko-AuthToken": auth_token}
    try:
        res = requests.get(url, headers=headers)
        res.raise_for_status()
        programs = []
        root = ET.fromstring(res.content)
        station_name = root.find('.//station/name').text
        for prog in root.findall('.//prog'):
            image_elem = prog.find('img')
            programs.append(Program(
                title=prog.find('title').text,
                start_time=JST.localize(datetime.strptime(prog.get('ft'), '%Y%m%d%H%M%S')),
                end_time=JST.localize(datetime.strptime(prog.get('to'), '%Y%m%d%H%M%S')),
                duration=int(prog.get('dur')),
                pfm=prog.find('pfm').text if prog.find('pfm') is not None else '',
                image_url=image_elem.text if image_elem is not None else None
            ))
        return GuideResponse(station_name=station_name, programs=programs)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"番組表の取得に失敗: {e}")


def update_job_status(job_id, status, filename=None):
    """ダウンロードジョブの状態をデータベースに保存する"""
    conn = get_db_connection()
    conn.execute('UPDATE download_log SET status = ?, filename = ? WHERE job_id = ?', (status, filename, job_id))
    conn.commit()
    conn.close()


def start_download_job(job_id, station_id, station_name, program_title, start_time_str, end_time_str):
    """スケジューラから呼び出されるダウンロード実行関数"""
    update_job_status(job_id, 'downloading')

    if not user_email or not user_password:
        update_job_status(job_id, 'failed: ログイン情報なし')
        return

    fresh_auth_token_data, _ = radiko_authenticate(user_email, user_password)

    if not fresh_auth_token_data:
        update_job_status(job_id, 'failed: トークン取得失敗')
        return

    print("ダウンロード用に新しい認証トークンを取得します...")
    fresh_auth_token, _ = radiko_authenticate(user_email, user_password)

    if not fresh_auth_token:
        update_job_status(job_id, 'failed: トークン取得失敗');
        return
    print("新しい認証トークンを取得しました。")

    stream_url = f"https://radiko.jp/v2/api/ts/playlist.m3u8?station_id={station_id}&l=15&ft={start_time_str}&to={end_time_str}"
    print(f'{stream_url}')

    safe_station_name = station_name.replace('/', '／').replace(':', '：')
    save_dir = os.path.join("/recordings", safe_station_name)
    os.makedirs(save_dir, exist_ok=True)

    safe_title = program_title.replace('/', '／').replace(':', '：').replace(' ', '_')
    output_filename = f"{start_time_str[:8]}-{start_time_str[8:12]}_{safe_title}.aac"
    output_path = os.path.join(save_dir, output_filename)

    print(f'fresh_auth_token: {fresh_auth_token}')
    headers = f'X-RADIKO-AUTHTOKEN: {fresh_auth_token[1]}'
    print(f'headers: {headers}')
    command = ['ffmpeg', '-loglevel', 'error', '-headers', headers, '-i', stream_url, '-acodec', 'copy', output_path]

    print("--- FFmpeg Command For Debug ---")
    # shlex.join() を使うと、ターミナルに直接貼り付けられる安全な文字列になる
    print(shlex.join(command))
    print("---------------------------------")

    try:
        subprocess.run(command, check=True, capture_output=True, text=True)
        update_job_status(job_id, 'success', output_filename)
    except subprocess.CalledProcessError as e:
        error_message = e.stderr.strip().split('\n')[-1]
        update_job_status(job_id, f'failed: {error_message}')


# --------------------------------------------------------------------------
# APIエンドポイント
# --------------------------------------------------------------------------
@app.post("/api/login", response_model=LoginResponse, tags=["Auth"])
def login(email: EmailStr = Form(...), password: str = Form(...)):
    global user_email, user_password
    user_email = email
    user_password = password
    token_data = radiko_authenticate(email, password)

    conn = get_db_connection()
    status = 'success' if token_data else 'failed'
    conn.execute('INSERT INTO login_history (email, status) VALUES (?, ?)', (email, status))
    conn.commit()
    conn.close()

    if not token_data:
        raise HTTPException(status_code=401, detail="Login failed")

    # ★★★ JWTアクセス・トークンを生成 ★★★
    access_token = create_access_token(
        data={"sub": email}  # "sub"はsubject(主題)の略で、ユーザー識別子を入れるのが一般的
    )

    return {"access_token": access_token, "token_type": "bearer", "radiko_token": token_data.auth_token}


@app.get("/api/stations/{area_id}", response_model=List[Station], tags=["Stations"])
def get_stations_in_area(area_id: str, x_radiko_authtoken: str = Header(...),
                         current_user: str = Depends(get_current_user)):
    """指定されたエリアの放送局リストを取得する"""
    return get_station_list(area_id, x_radiko_authtoken)


@app.get("/api/guide/{station_id}/{date_str}", response_model=GuideResponse, tags=["Programs"])
def get_guide_for_station(station_id: str, date_str: str, x_radiko_authtoken: str = Header(...),
                          current_user: str = Depends(get_current_user)):
    """指定された放送局・日付の番組表を取得する"""
    return get_program_guide(station_id, date_str, x_radiko_authtoken)


@app.post("/api/download", status_code=202, tags=["Jobs"])
def schedule_download(request: DownloadRequest, current_user: str = Depends(get_current_user)):
    """ダウンロードジョブをスケジュールする"""
    job_id = str(uuid.uuid4())
    start_time_dt = datetime.strptime(request.start_time, '%Y%m%d%H%M%S')

    conn = get_db_connection()
    conn.execute(
        'INSERT INTO download_log (job_id, station_id, program_title, start_time, status) VALUES (?, ?, ?, ?, ?)',
        (job_id, request.station_id, request.program_title, start_time_dt, 'queued')
    )
    conn.commit();
    conn.close()

    scheduler.add_job(
        start_download_job, 'date', run_date=datetime.now(JST) + timedelta(seconds=1),
        args=[job_id, request.station_id, request.station_name, request.program_title, request.start_time,
              request.end_time]
    )
    return {"message": "Download scheduled", "job_id": job_id}


@app.get("/api/status", response_model=StatusResponse, tags=["Jobs"])
def get_status(current_user: str = Depends(get_current_user)):
    """ダウンロードジョブとログイン履歴を取得する"""
    conn = get_db_connection()
    jobs_raw = conn.execute('SELECT * FROM download_log ORDER BY start_time DESC').fetchall()
    logins_raw = conn.execute('SELECT * FROM login_history ORDER BY login_time DESC LIMIT 10').fetchall()
    conn.close()

    # データベースの行をPydanticモデルに変換
    jobs = [DownloadJob.model_validate(dict(job)) for job in jobs_raw]
    logins = [LoginHistory.model_validate(dict(login)) for login in logins_raw]

    return StatusResponse(jobs=jobs, logins=logins)
