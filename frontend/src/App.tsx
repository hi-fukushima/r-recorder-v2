import { useState, type FormEvent } from 'react'
import {BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, Link} from 'react-router-dom';

import _AreaSelector from './components/AreaSelector'
import _StationList from './components/StationList'
import _DateSelector from './components/DateSelector'
import _ProgramGuide from './components/ProgramGuide'
import _StatusPage from './components/StatusPage'
import _SearchPage from './components/SearchPage'

import { getToken, setTokens, removeTokens } from './api'

import type {
  AreaSelectorProps,
  StationListProps,
  DateSelectorProps,
  ProgramGuideProps,
} from './types/stubs'

const AreaSelector  = _AreaSelector  as React.FC<AreaSelectorProps>
const StationList   = _StationList   as React.FC<StationListProps>
const DateSelector  = _DateSelector  as React.FC<DateSelectorProps>
const ProgramGuide  = _ProgramGuide  as React.FC<ProgramGuideProps>
const StatusPage    = _StatusPage    as React.FC
const SearchPage    = _SearchPage    as React.FC

// =====================
// 型定義
// =====================
type LoginPageProps = {
  onLogin: (jwtToken: string, radikoToken: string) => void
}

// =====================
// ページコンポーネント
// =====================

// ログインページ
const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        body: formData,
      })
      const data = (await response.json()) as {
        detail?: string
        access_token?: string
        radiko_token?: string
      }
      if (!response.ok || !data.access_token || !data.radiko_token) {
        throw new Error(data.detail || 'Login failed')
      }
      onLogin(data.access_token, data.radiko_token)
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`ログインに失敗しました: ${msg}`)
    }
  }

  return (
    <article>
      <h1 style={{ textAlign: 'center' }}>Radiko ログイン</h1>
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
  )
}

// エリア選択ページ
const AreaPage: React.FC = () => {
  const navigate = useNavigate()
  const onAreaSelect: AreaSelectorProps['onAreaSelect'] = (areaId) =>
    navigate(`/stations/${areaId}`)
  return <AreaSelector onAreaSelect={onAreaSelect} />
}

// 放送局選択ページ
const StationPage: React.FC = () => {
  const { areaId } = useParams<{ areaId: string }>()
  const navigate = useNavigate()
  const onStationSelect: StationListProps['onStationSelect'] = (stationId) =>
    navigate(`/dates/${stationId}`)
  return <StationList areaId={areaId} onStationSelect={onStationSelect} />
}

// 日付選択ページ
const DatePage: React.FC = () => {
  const { stationId } = useParams<{ stationId: string }>()
  const navigate = useNavigate()
  const onDateSelect: DateSelectorProps['onDateSelect'] = (dateStr) =>
    navigate(`/guide/${stationId}/${dateStr}`)
  return <DateSelector stationId={stationId} onDateSelect={onDateSelect} />
}

// 番組表ページ
const GuidePage: React.FC = () => {
  const { stationId, dateStr } = useParams<{ stationId: string; dateStr: string }>()
  const navigate = useNavigate()
  const onDownloadScheduled: ProgramGuideProps['onDownloadScheduled'] = () =>
    navigate('/status')
  return (
    <ProgramGuide
      stationId={stationId}
      dateStr={dateStr}
      onDownloadScheduled={onDownloadScheduled}
    />
  )
}

const Search: React.FC = () => <SearchPage />

// =====================
// ルート
// =====================
function App() {
  // アプリ起動時に localStorage から読み込み
  const initial = getToken() as string | null
  const [authToken, setAuthToken] = useState<string | null>(initial)

  const handleLogin = (jwtToken: string, radikoToken: string) => {
    setTokens(jwtToken, radikoToken)
    setAuthToken(jwtToken)
  }

  const handleLogout = () => {
    removeTokens()
    setAuthToken(null)
  }

  return (
    <BrowserRouter>
      <main className="container">
        {authToken && (
          <nav>
            <ul>
              <li>
                <strong>R Downloader V2</strong>
              </li>
            </ul>
            <ul>
              <li>
                <Link to="/search">番組検索</Link>
              </li>
              <li>
                <Link to="/areas">エリア選択</Link>
              </li>
              <li>
                <Link to="/status">ダウンロード状況</Link>
              </li>
              <li>
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <a href="#" role="button" className="contrast" onClick={handleLogout}>
                  ログアウト
                </a>
              </li>
            </ul>
          </nav>
        )}
        <Routes>
          {!authToken ? (
            <>
              <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </>
          ) : (
            <>
              <Route path="/search" element={<Search />} />
              <Route path="/areas" element={<AreaPage />} />
              <Route path="/stations/:areaId" element={<StationPage />} />
              <Route path="/dates/:stationId" element={<DatePage />} />
              <Route path="/guide/:stationId/:dateStr" element={<GuidePage />} />
              <Route path="/status" element={<StatusPage />} />
              <Route path="*" element={<Navigate to="/areas" />} />
            </>
          )}
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App
