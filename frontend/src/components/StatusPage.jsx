import React from 'react';
import {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import {fetchWithAuth} from '../api';

function StatusPage() {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStatus = async () => {
        try {
            const response = await fetchWithAuth('http://localhost:5001/api/status');
            if (!response.ok) throw new Error('Status fetch failed');
            const data = await response.json();
            setStatus(data);
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        // 10秒ごとに自動更新
        const interval = setInterval(fetchStatus, 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <article aria-busy="true">状況を読み込み中...</article>;
    }

    return (
        <article>
            <hgroup>
                <h2>ダウンロード状況</h2>
                <p>このページは10秒ごとに自動更新されます。</p>
            </hgroup>
            <Link to="/areas" role="button" className="outline">エリア選択に戻る</Link>

            <table>
                <thead>
                <tr>
                    <th>番組名</th>
                    <th>放送局</th>
                    <th>開始時刻</th>
                    <th>ステータス</th>
                    <th>ファイル名</th>
                </tr>
                </thead>
                <tbody>
                {status?.jobs.map(job => (
                    <tr key={job.id}>
                        <td>{job.program_title}</td>
                        <td>{job.station_id}</td>
                        <td>{new Date(job.start_time).toLocaleString('ja-JP')}</td>
                        <td>{job.status}</td>
                        <td>{job.filename || ''}</td>
                    </tr>
                ))}
                </tbody>
            </table>

            <h2 style={{marginTop: '2rem'}}>ログイン履歴</h2>
            <table>
                <thead>
                <tr>
                    <th>日時</th>
                    <th>メールアドレス</th>
                    <th>結果</th>
                </tr>
                </thead>
                <tbody>
                {status?.logins.map(login => (
                    <tr key={login.id}>
                        <td>{new Date(login.login_time).toLocaleString('ja-JP')}</td>
                        <td>{login.email}</td>
                        <td>{login.status}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </article>
    );
}

export default StatusPage;