import React from 'react';
import {useState, useEffect} from 'react';
import {useNavigate, useParams, Link} from 'react-router-dom';
import {fetchWithAuth} from '../api';

function ProgramGuide() {
    const {stationId, dateStr} = useParams();
    const navigate = useNavigate();
    const [guide, setGuide] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGuide = async () => {
            setLoading(true);
            try {
                const response = await fetchWithAuth(`http://localhost:5001/api/guide/${stationId}/${dateStr}`);
                if (!response.ok) throw new Error('番組表の取得に失敗');
                const data = await response.json();
                setGuide(data);
            } catch (error) {
                alert(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchGuide();
    }, [stationId, dateStr]);

    const handleDownload = async (program) => {
        const payload = {
            station_id: stationId,
            station_name: guide.station_name,
            program_title: program.title,
            start_time: program.start_time.substring(0, 19).replace(/[-T:]/g, ''),
            end_time: program.end_time.substring(0, 19).replace(/[-T:]/g, ''),
        };

        try {
            const response = await fetchWithAuth('http://localhost:5001/api/download', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error('Download request failed');

            // ★★★ ここで onDownloadScheduled を呼び出す ★★★
            navigate('/status');
        } catch (error) {
            alert(error.message);
        }
    };

    if (loading) {
        return <article aria-busy="true">番組表を読み込み中...</article>;
    }

    if (!guide) {
        return <article>番組表の読み込みに失敗しました。</article>;
    }

    return (
        <article>
            <h2>番組表 ({guide.station_name} - {dateStr})</h2>
            <Link to={`/dates/${stationId}`}>日付選択に戻る</Link>
            <table>
                <thead>
                <tr>
                    <th>画像</th>
                    <th>開始時刻</th>
                    <th>番組名</th>
                    <th>出演者</th>
                    <th>アクション</th>
                </tr>
                </thead>
                <tbody>
                {guide.programs.map(prog => (
                    <tr key={prog.start_time}>
                        <td>
                            {prog.image_url ? (
                                <img src={prog.image_url} alt={prog.title} style={{width: '80px', height: 'auto'}}/>
                            ) : (
                                '(画像なし)'
                            )}
                        </td>
                        <td>{new Date(prog.start_time).toLocaleTimeString('ja-JP', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</td>
                        <td>{prog.title}</td>
                        <td>{prog.pfm}</td>
                        <td>
                            <button onClick={() => handleDownload(prog)}>ダウンロード</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </article>
    );
}

export default ProgramGuide;
