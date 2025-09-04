import React from 'react';
import {useNavigate, useParams, Link} from 'react-router-dom';

function DateSelector() {
    const {stationId} = useParams();
    const navigate = useNavigate();

    // 今日から過去7日間の日付オブジェクトの配列を生成
    const dates = Array.from({length: 7}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date;
    });

    // 'YYYYMMDD'形式の文字列に変換する関数
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    };

    return (
        <article>
            <h2>日付を選択 ({stationId})</h2>
            <Link to={`/stations/${stationId.substring(0, 4)}`}>放送局選択に戻る</Link>
            <div className="grid" style={{marginTop: '1rem'}}>
                {dates.map(date => (
                    <a
                        href="#"
                        key={formatDate(date)}
                        role="button"
                        onClick={() => navigate(`/guide/${stationId}/${formatDate(date)}`)}
                    >
                        {date.toLocaleDateString('ja-JP', {month: 'long', day: 'numeric', weekday: 'short'})}
                    </a>
                ))}
            </div>
        </article>
    );
}

export default DateSelector;
