const JAPAN_REGIONS = [
    {
        "name": "北海道・東北",
        "prefectures": [
            {"id": "JP1", "name": "北海道"}, {"id": "JP2", "name": "青森県"},
            {"id": "JP3", "name": "岩手県"}, {"id": "JP4", "name": "宮城県"},
            {"id": "JP5", "name": "秋田県"}, {"id": "JP6", "name": "山形県"},
            {"id": "JP7", "name": "福島県"}
        ]
    },
    {
        "name": "関東",
        "prefectures": [
            {"id": "JP8", "name": "茨城県"}, {"id": "JP9", "name": "栃木県"},
            {"id": "JP10", "name": "群馬県"}, {"id": "JP11", "name": "埼玉県"},
            {"id": "JP12", "name": "千葉県"}, {"id": "JP13", "name": "東京都"},
            {"id": "JP14", "name": "神奈川県"}
        ]
    },
    {
        "name": "甲信越・北陸",
        "prefectures": [
            {"id": "JP19", "name": "山梨県"}, {"id": "JP20", "name": "長野県"},
            {"id": "JP15", "name": "新潟県"}, {"id": "JP16", "name": "富山県"},
            {"id": "JP17", "name": "石川県"}, {"id": "JP18", "name": "福井県"}
        ]
    },
    {
        "name": "東海",
        "prefectures": [
            {"id": "JP21", "name": "岐阜県"}, {"id": "JP22", "name": "静岡県"},
            {"id": "JP23", "name": "愛知県"}, {"id": "JP24", "name": "三重県"}
        ]
    },
    {
        "name": "近畿",
        "prefectures": [
            {"id": "JP25", "name": "滋賀県"}, {"id": "JP26", "name": "京都府"},
            {"id": "JP27", "name": "大阪府"}, {"id": "JP28", "name": "兵庫県"},
            {"id": "JP29", "name": "奈良県"}, {"id": "JP30", "name": "和歌山県"}
        ]
    },
    {
        "name": "中国・四国",
        "prefectures": [
            {"id": "JP31", "name": "鳥取県"}, {"id": "JP32", "name": "島根県"},
            {"id": "JP33", "name": "岡山県"}, {"id": "JP34", "name": "広島県"},
            {"id": "JP35", "name": "山口県"}, {"id": "JP36", "name": "徳島県"},
            {"id": "JP37", "name": "香川県"}, {"id": "JP38", "name": "愛媛県"},
            {"id": "JP39", "name": "高知県"}
        ]
    },
    {
        "name": "九州・沖縄",
        "prefectures": [
            {"id": "JP40", "name": "福岡県"}, {"id": "JP41", "name": "佐賀県"},
            {"id": "JP42", "name": "長崎県"}, {"id": "JP43", "name": "熊本県"},
            {"id": "JP44", "name": "大分県"}, {"id": "JP45", "name": "宮崎県"},
            {"id": "JP46", "name": "鹿児島県"}, {"id": "JP47", "name": "沖縄県"}
        ]
    }
];

function AreaSelector({onAreaSelect}) {
    return (
        <article>
            <hgroup>
                <h2>エリアを選択</h2>
                <h3>聴取したい都道府県を選択してください</h3>
            </hgroup>

            {JAPAN_REGIONS.map(region => (
                <details key={region.name} open>
                    <summary>{region.name}</summary>
                    <div className="grid">
                        {region.prefectures.map(area => (
                            <a href="#" key={area.id} role="button" className="secondary outline"
                               onClick={() => onAreaSelect(area.id)}>
                                {area.name}
                            </a>
                        ))}
                    </div>
                </details>
            ))}
        </article>
    );
}

export default AreaSelector;
