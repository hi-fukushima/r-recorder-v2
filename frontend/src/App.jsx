import React from 'react';
import {useState, useEffect} from 'react';
import {BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, Link} from 'react-router-dom';
import AreaSelector from './components/AreaSelector';
import StationList from './components/StationList';
import DateSelector from './components/DateSelector';
import ProgramGuide from './components/ProgramGuide';
import StatusPage from "./components/StatusPage";
import {getToken, setTokens, removeTokens} from './api';

// --- ページコンポーネントの定義 ---
// ログインページ
const LoginPage = ({onLogin}) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        try {
            const response = await fetch('/api/login', {
                method: 'POST', body: formData,
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Login failed');
            onLogin(data.access_token, data.radiko_token);
        } catch (error) {
            alert(`ログインに失敗しました: ${error.message}`);
        }
    };

    return (
        <article>
            <h1 style={{textAlign: 'center'}}>Radiko ログイン</h1>
            <form onSubmit={handleSubmit}>
                <label htmlFor="email">メールアドレス</label>
                <input type="email" id="email" name="email" placeholder="メールアドレス" required value={email}
                       onChange={(e) => setEmail(e.target.value)}/>
                <label htmlFor="password">パスワード</label>
                <input type="password" id="password" name="password" placeholder="パスワード" required value={password}
                       onChange={(e) => setPassword(e.target.value)}/>
                <button type="submit">ログイン</button>
            </form>
        </article>
    );
};

// エリア選択ページ
const AreaPage = () => {
    const navigate = useNavigate();
    return <AreaSelector onAreaSelect={(areaId) => navigate(`/stations/${areaId}`)}/>;
};

// 放送局選択ページ
const StationPage = () => {
    const {areaId} = useParams();
    const navigate = useNavigate();
    return <StationList
        areaId={areaId}
        onStationSelect={(stationId) => navigate(`/dates/${stationId}`)}
    />;
};

// 日付選択ページ
const DatePage = () => {
    const {stationId} = useParams();
    const navigate = useNavigate();
    return <DateSelector
        stationId={stationId}
        onDateSelect={(dateStr) => navigate(`/guide/${stationId}/${dateStr}`)}
    />;
};

// 番組表ページ
const GuidePage = () => {
    const {stationId, dateStr} = useParams();
    const navigate = useNavigate();
    return <ProgramGuide
        stationId={stationId}
        dateStr={dateStr}
        onDownloadScheduled={() => navigate('/status')}
    />;
};

function App() {
    // --- 状態管理(State) ---
    // アプリ起動時にlocalStorageからトークンを読み込む
    const [authToken, setAuthToken] = useState(getToken());

    const handleLogin = (jwtToken, radikoToken) => {
        setTokens(jwtToken, radikoToken);
        setAuthToken(jwtToken);
    };

    const handleLogout = () => {
        removeTokens();
        setAuthToken(null);
    };

    return (
        <BrowserRouter>
            <main className="container">
                {authToken && (
                    <nav>
                        <ul>
                            <li><strong>R Downloader V2</strong></li>
                        </ul>
                        <ul>
                            <li><Link to="/areas">エリア選択</Link></li>
                            <li><Link to="/status">ダウンロード状況</Link></li>
                            <li><a href="#" role="button" className="contrast" onClick={handleLogout}>ログアウト</a>
                            </li>
                        </ul>
                    </nav>
                )}
                <Routes>
                    {!authToken ? (
                        <>
                            <Route path="/login" element={<LoginPage onLogin={handleLogin}/>}/>
                            <Route path="*" element={<Navigate to="/login"/>}/>
                        </>
                    ) : (
                        <>
                            <Route path="/areas" element={<AreaPage/>}/>
                            <Route path="/stations/:areaId" element={<StationPage/>}/>
                            <Route path="/dates/:stationId" element={<DatePage/>}/>
                            <Route path="/guide/:stationId/:dateStr" element={<GuidePage/>}/>
                            <Route path="/status" element={<StatusPage/>}/>
                            <Route path="*" element={<Navigate to="/areas"/>}/>
                        </>
                    )}
                </Routes>
            </main>
        </BrowserRouter>
    );
}

export default App;
