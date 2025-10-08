import React from 'react';
import {useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {fetchWithAuth} from '../api';

function StationList({onStationSelect}) {
    const {areaId} = useParams();
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);

    // useEffectを使って、コンポーネントが表示された時にAPIからデータを取得する
    useEffect(() => {
        const fetchStations = async () => {
            setLoading(true);
            try {
                // ★★★ fetchをfetchWithAuthに変更 ★★★
                const response = await fetchWithAuth(`stations/${areaId}`);
                if (!response.ok) throw new Error('放送局リストの取得に失敗');
                const data = await response.json();
                setStations(data);
            } catch (error) {
                alert(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchStations();
    }, [areaId]);

    if (loading) {
        return <article aria-busy="true">放送局を読み込み中...</article>;
    }

    return (
        <article>
            <h2>放送局を選択 ({areaId})</h2>
            <Link to="/areas">エリア選択に戻る</Link>
            <ul>
                {stations.map(station => (
                    <li key={station.id}>
                        <Link to={`/dates/${areaId}/${station.id}`}>{station.name}</Link>
                    </li>
                ))}
            </ul>
        </article>
    );
}

export default StationList;
