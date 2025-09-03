import {useState} from 'react';
import AreaSelector from './components/AreaSelector';
import StationList from './components/StationList';
import DateSelector from './components/DateSelector';
import ProgramGuide from './components/ProgramGuide';
import StatusPage from "./components/StatusPage.jsx";

function App() {
    // useStateを使って、入力されたメールアドレスとパスワードを保存する変数を定義
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // ログイン後の認証トークンなどを保存する変数
    const [authToken, setAuthToken] = useState(null);
    const [currentView, setCurrentView] = useState('login');
    const [selectedAreaId, setSelectedAreaId] = useState(null);
    const [selectedStationId, setSelectedStationId] = useState(null);
    const [selectedDateStr, setSelectedDateStr] = useState(null);

    // ログインボタンが押されたときの処理
    const handleSubmit = async (event) => {
        event.preventDefault(); // フォームのデフォルトの送信動作をキャンセル

        // FastAPIに送るためのフォームデータを作成
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        try {
            // バックエンドの/api/loginにPOSTリクエストを送信
            const response = await fetch('http://localhost:8000/api/login', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                // ログイン失敗の場合
                const errorData = await response.json();
                alert(`ログインに失敗しました: ${errorData.detail}`);
                return;
            }

            // ログイン成功の場合
            const data = await response.json();
            setAuthToken(data.auth_token);
            setCurrentView('areas'); // エリア選択画面へ遷移

        } catch (error) {
            console.error('通信エラー:', error);
            alert('サーバーとの通信中にエラーが発生しました。');
        }
    };

    // ログアウト処理
    const handleLogout = () => {
        setAuthToken(null);
        setSelectedAreaId(null);
        setSelectedStationId(null);
        setSelectedDateStr(null);
        setCurrentView('login');
    };

    // ----- 画面の切り替えロジック -----
    const renderView = () => {
        switch (currentView) {
            case 'areas':
                return <AreaSelector onAreaSelect={(areaId) => {
                    setSelectedAreaId(areaId);
                    setCurrentView('stations');
                }}/>;
            case 'stations':
                return <StationList
                    areaId={selectedAreaId}
                    authToken={authToken}
                    onStationSelect={(stationId) => {
                        setSelectedStationId(stationId);
                        setCurrentView('dates');
                    }}
                    onBack={() => setCurrentView('areas')}
                />;
            case 'dates':
                return <DateSelector
                    stationId={selectedStationId}
                    onDateSelect={(dateStr) => {
                        setSelectedDateStr(dateStr);
                        setCurrentView('guide');
                    }}
                    onBack={() => setCurrentView('stations')}
                />;
            case 'guide':
                return <ProgramGuide
                    stationId={selectedStationId}
                    dateStr={selectedDateStr}
                    authToken={authToken}
                    onBack={() => setCurrentView('dates')}
                    onDownloadScheduled={() => setCurrentView('status')}
                />;
            case 'status':
                return <StatusPage onNavClick={(view) => setCurrentView(view)}/>;
            default: // 'login'
                return (
                    <article>
                        <h1 style={{textAlign: 'center'}}>Radiko ログイン</h1>
                        <form onSubmit={handleSubmit}>
                            <label htmlFor="email">メールアドレス</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="メールアドレス"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <label htmlFor="password">パスワード</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="パスワード"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button type="submit">ログイン</button>
                        </form>
                    </article>
                );
        }
    };

    return (
        <main className="container">
            {/* ナビゲーションバーはログイン後に表示 */}
            {authToken && (
                <nav>
                    <ul>
                        <li><strong>Radiko Downloader</strong></li>
                    </ul>
                    <ul>
                        <li><a href="#" onClick={() => {
                            setSelectedStationId(null);
                            setSelectedAreaId(null);
                            setSelectedDateStr(null);
                            setCurrentView('areas');
                        }}>エリア選択</a></li>
                        <li><a href="#" onClick={() => setCurrentView('status')}>ダウンロード状況</a></li>
                        <li><a href="#" role="button" className="contrast" onClick={handleLogout}>ログアウト</a></li>
                    </ul>
                </nav>
            )}
            {renderView()}
        </main>
    );
}

export default App;
