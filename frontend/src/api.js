// トークンをlocalStorageから読み書きするヘルパー関数
const getToken = () => localStorage.getItem('jwt_token');
const getRadikoToken = () => localStorage.getItem('radiko_token');
const setTokens = (jwtToken, radikoToken) => {
    localStorage.setItem('jwt_token', jwtToken);
    localStorage.setItem('radiko_token', radikoToken);
};
const removeTokens = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('radiko_token');
};

// 認証が必要なAPIリクエストの基本形
const fetchWithAuth = async (url, options = {}) => {
    const jwtToken = getToken();
    const radikoToken = getRadikoToken();

    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${jwtToken}`,
        'X-Radiko-AuthToken': radikoToken,
    };

    const response = await fetch(`/api/${url}`, {...options, headers});

    if (response.status === 401) {
        // 認証エラーの場合はトークンを削除してリロード
        removeTokens();
        window.location.reload();
        throw new Error('Authentication failed');
    }

    return response;
};

export {getToken, setTokens, removeTokens, fetchWithAuth};
