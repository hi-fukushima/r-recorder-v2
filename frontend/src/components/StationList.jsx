import {useState, useEffect} from 'react';

function StationList({areaId, authToken, onStationSelect, onBack}) {
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);

    // useEffectを使って、コンポーネントが表示された時にAPIからデータを取得する
    useEffect(() => {
        const fetchStations = async () => {
            setLoading(true);
            try {
                const response = await fetch(`http://localhost:8000/api/stations/${areaId}`, {
                    headers: {
                        'x-radiko-authtoken': authToken,
                    },
                });
                if (!response.ok) {
                    throw new Error('放送局リストの取得に失敗しました。');
                }
                const data = await response.json();
                setStations(data);
            } catch (error) {
                alert(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStations();
    }, [areaId, authToken]); // areaIdかauthTokenが変わった時だけ再実行

    if (loading) {
        return <article aria-busy="true">放送局を読み込み中...</article>;
    }

    return (
        <article>
            <h2>放送局を選択 ({areaId})</h2>
            <button onClick={onBack} className="secondary outline">エリア選択に戻る</button>
            <ul>
                {stations.map(station => (
                    <li key={station.id}>
                        {/* クリックされたら onStationSelect を呼び出す */}
                        <a href="#" onClick={() => onStationSelect(station.id)}>
                            {station.name}
                        </a>
                    </li>
                ))}
            </ul>
        </article>
    );
}

export default StationList;
