import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {fetchWithAuth, getRadikoToken} from '../api';

function SearchPage() {
    const navigate = useNavigate();
    const [keyword, setKeyword] = useState('');
    const [lastSearchedKeyword, setLastSearchedKeyword] = useState('');

    const [searchResult, setSearchResult] = useState({
        programs: [],
        totalResults: 0,
        currentPage: 1,
        totalPages: 0,
    });

    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (searchKeyword, page = 1) => {
        if (!keyword.trim()) {
            alert('キーワードを入力してください。');
            return;
        }
        setLoading(true);
        setSearched(true); // 検索実行済みのフラグを立てる
        setLastSearchedKeyword(searchKeyword);

        try {
            const response = await fetchWithAuth(`search/${encodeURIComponent(keyword)}?page=${page}`);
            if (!response.ok) throw new Error('番組検索に失敗しました');
            const data = await response.json();
            setSearchResult({
                programs: data.programs || [],
                totalResults: data.total_results,
                currentPage: data.current_page,
                totalPages: data.total_pages,
            });
        } catch (error) {
            alert(error.message);
            setSearchResult({programs: [], totalResults: 0, currentPage: 1, totalPages: 0});
        } finally {
            setLoading(false);
        }
    };

    // フォーム送信時の処理
    const onFormSubmit = (event) => {
        event.preventDefault();
        handleSearch(keyword, 1); // 常に1ページ目から検索
    };

    // ページ変更時の処理
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= searchResult.totalPages && !loading) {
            handleSearch(lastSearchedKeyword, newPage);
        }
    };

    const handleDownload = async (program) => {
        // ダウンロードに必要な形式（YYYYMMDDHHMMSS）に変換
        const formatDateTime = (isoString) => {
            return isoString.substring(0, 19).replace(/[-T:]/g, '');
        };

        const payload = {
            station_id: program.station_id,
            station_name: program.station_name,
            program_title: program.title,
            start_time: formatDateTime(program.start_time),
            end_time: formatDateTime(program.end_time),
            radiko_token: getRadikoToken(), // Radikoトークンを追加
        };

        try {
            const response = await fetchWithAuth('download', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error('ダウンロードリクエストに失敗しました');

            alert(`「${program.title}」のダウンロード予約が完了しました。状況ページに移動します。`);
            navigate('/status');
        } catch (error) {
            alert(error.message);
        }
    };

    const now = new Date();
    const {programs, totalResults, currentPage, totalPages} = searchResult;

    return (
        <article>
            <h2>番組検索</h2>
            <form onSubmit={onFormSubmit}>
                <input
                    type="search"
                    placeholder="番組名、出演者名などを入力"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                />
                <button type="submit" disabled={loading}>
                    {loading ? '検索中...' : '検索'}
                </button>
            </form>

            {loading && <article aria-busy="true">検索結果を読み込み中...</article>}

            {!loading && searched && programs.length === 0 && (
                <p>「{lastSearchedKeyword}」に該当する番組は見つかりませんでした。</p>
            )}

            {!loading && programs.length > 0 && (
                <>
                    <p>{totalResults}件の番組が見つかりました。(ページ {currentPage}/{totalPages})</p>
                    <table>
                        <thead>
                        <tr>
                            <th>放送日時</th>
                            <th>放送局</th>
                            <th>番組名</th>
                            <th>出演者</th>
                            <th>アクション</th>
                        </tr>
                        </thead>
                        <tbody>
                        {programs.map((prog, index) => {
                            const endTime = new Date(prog.end_time);
                            const isDownloadable = endTime > now;
                            return (
                                <tr key={`${prog.station_id}-${prog.start_time}-${index}`}>
                                    <td>
                                        {new Date(prog.start_time).toLocaleString('ja-JP', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                    <td>{prog.station_name}</td>
                                    <td>
                                        {prog.image_url && (
                                            <img src={prog.image_url} alt={prog.title} style={{
                                                width: '60px',
                                                height: 'auto',
                                                marginRight: '10px',
                                                verticalAlign: 'middle'
                                            }}/>
                                        )}
                                        {prog.title}
                                    </td>
                                    <td>{prog.pfm}</td>
                                    <td>
                                        {/* ★★★ ボタンを条件付きで表示 ★★★ */}
                                        {!isDownloadable && (
                                            <button onClick={() => handleDownload(prog)}>ダウンロード</button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>

                    {/* ★★★ ページネーションUIを追加 ★★★ */}
                    {totalPages > 1 && (
                        <nav>
                            <ul style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', listStyle: 'none', padding: 0 }}>
                                <li style={{ margin: '0 5px' }}>
                                    <button disabled={currentPage <= 1 || loading} onClick={() => handlePageChange(1)}>
                                        &lt;&lt;
                                    </button>
                                </li>
                                <li style={{ margin: '0 5px' }}>
                                    <button disabled={currentPage <= 1 || loading} onClick={() => handlePageChange(currentPage - 1)}>
                                        &lt;
                                    </button>
                                </li>
                                <li style={{ margin: '0 10px' }}>
                                    ページ {currentPage} / {totalPages}
                                </li>
                                <li style={{ margin: '0 5px' }}>
                                    <button disabled={currentPage >= totalPages || loading} onClick={() => handlePageChange(currentPage + 1)}>
                                        &gt;
                                    </button>
                                </li>
                                <li style={{ margin: '0 5px' }}>
                                    <button disabled={currentPage >= totalPages || loading} onClick={() => handlePageChange(totalPages)}>
                                        &gt;&gt;
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    )}
                </>
            )}
        </article>
    );
}

export default SearchPage;