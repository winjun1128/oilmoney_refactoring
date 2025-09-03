import { useState } from "react";

export default function ChargeFilterPanel({ handleChargeFilterSearch, onClose }) {
    const [selectedRegion, setSelectedRegion] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [chargerType, setChargerType] = useState([]);
    const [method, setMethod] = useState([]);
    const [minOutput, setMinOutput] = useState("");
    const [status, setStatus] = useState("");
    const [twentyFour, setTwentyFour] = useState(false);
    const [floorType, setFloorType] = useState("");

    // ✅ 지역 코드 매핑
    const regionCodes = {
        서울: "01",
        충남: "44",
    };

    // ✅ 시군구 코드 매핑
    const cityCodes = {
        "01": {
            "마포구": "0109",
            "중구": "0102",
            "성동구": "0104",
            "서대문구": "0107",
            "강서구": "0115",
        },
        "44": {
            "천안시": "44130",
            "공주시": "44150",
            "보령시": "44180",
            "아산시": "44200",
            "서산시": "44210",
            "논산시": "44230",
            "계룡시": "44250",
            "당진시": "44270",
            "금산군": "44710",
            "부여군": "44760",
            "서천군": "44770",
            "청양군": "44790",
            "홍성군": "44800",
            "예산군": "44810",
            "태안군": "44825",
        },
    };

    // ✅ 체크박스 토글 핸들러
    const toggleCheckbox = (value, setState) => {
        setState((prev) =>
            prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
        );
    };

    // ✅ 검색 실행
    const doSearch = () => {
        const statusMap = { "01": "1", "02": "2", "03": "3" }; // T_CHARGER_STATUS.STAT 매핑

        const payload = {
            region: selectedRegion || null,          // T_CHARGE.ZCODE (예: "44")
            city: selectedCity || null,            // T_CHARGE.SCODE (예: "44130")
            methods: method,                        // ["AC완속","DC콤보", ...] (TYPE_NM 부분매칭)
            chargerType,                            // ["완속","급속","초급속"] → 출력구간 OR 매칭
            minOutput: minOutput ? Number(minOutput) : null, // g.OUTPUT_KW >= minOutput
            status: statusMap[status] || null,      // T_CHARGER_STATUS.STAT (1/2/3)
            twentyFour,                             // USETIME 24시 여부
            floorType: floorType || null            // T_CHARGE.FLOORTYPE ('G'/'B' 등)
        };
        console.log("🚀 충전소 필터 payload:", payload);
        handleChargeFilterSearch(payload);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", width: "300px", height: "100vh", background: "#fff", borderRight: "1px solid #e5e7eb" }}>
            {/* 상단 헤더 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "18px" }}>🔋</span>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>충전소 필터</h3>
                </div>
                <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: "18px", cursor: "pointer", color: "#374151" }}>✕</button>
            </div>

            {/* 콘텐츠 영역 */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
                {/* ✅ 지역 */}
                <div style={{ marginBottom: "20px" }}>
                    <h4 style={titleStyle}>지역</h4>
                    <select
                        value={selectedRegion}
                        onChange={(e) => {
                            setSelectedRegion(e.target.value);
                            setSelectedCity("");
                        }}
                        style={selectStyle}
                    >
                        <option value="">전체</option>
                        {Object.keys(regionCodes).map((region) => (
                            <option key={region} value={regionCodes[region]}>
                                {region}
                            </option>
                        ))}
                    </select>

                    {selectedRegion && cityCodes[selectedRegion] && (
                        <select
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            style={{ ...selectStyle, marginTop: "10px" }}
                        >
                            <option value="">전체</option>
                            {Object.entries(cityCodes[selectedRegion]).map(([city, code]) => (
                                <option key={city} value={code}>
                                    {city}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* ✅ 충전기 타입 */}
                <div style={{ marginBottom: "20px" }}>
                    <h4 style={titleStyle}>충전기 타입</h4>
                    <div style={checkboxGrid}>
                        {["완속", "급속", "초급속"].map((t) => (
                            <label key={t} style={checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={chargerType.includes(t)}
                                    onChange={() => toggleCheckbox(t, setChargerType)}
                                    style={{ marginRight: "6px" }}
                                />
                                {t}
                            </label>
                        ))}
                    </div>
                </div>

                {/* ✅ 충전 방식 */}
                <div style={{ marginBottom: "20px" }}>
                    <h4 style={titleStyle}>충전 방식</h4>
                    <div style={checkboxGrid}>
                        {["AC완속", "DC차데모", "DC콤보", "AC3상"].map((m) => (
                            <label key={m} style={checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={method.includes(m)}
                                    onChange={() => toggleCheckbox(m, setMethod)}
                                    style={{ marginRight: "6px" }}
                                />
                                {m}
                            </label>
                        ))}
                    </div>
                </div>

                {/* ✅ 상태 */}
                <div style={{ marginBottom: "20px" }}>
                    <h4 style={titleStyle}>충전 가능 여부</h4>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} style={selectStyle}>
                        <option value="">전체</option>
                        <option value="01">충전 가능</option>
                        <option value="02">충전 중</option>
                        <option value="03">점검 중</option>
                    </select>
                </div>

                {/* ✅ 24시간 */}
                <div style={{ marginBottom: "20px" }}>
                    <h4 style={titleStyle}>운영 시간</h4>
                    <label style={checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={twentyFour}
                            onChange={(e) => setTwentyFour(e.target.checked)}
                            style={{ marginRight: "6px" }}
                        />
                        24시간 운영
                    </label>
                </div>

                {/* ✅ 설치 위치 */}
                <div style={{ marginBottom: "20px" }}>
                    <h4 style={titleStyle}>설치 위치</h4>
                    <select value={floorType} onChange={(e) => setFloorType(e.target.value)} style={selectStyle}>
                        <option value="">전체</option>
                        <option value="G">지상</option>
                        <option value="B">지하</option>
                    </select>
                </div>
            </div>

            {/* 검색 버튼 */}
            <div style={{ padding: "16px 20px", borderTop: "1px solid #e5e7eb" }}>
                <button
                    onClick={doSearch}
                    style={{
                        width: "100%",
                        padding: "10px",
                        backgroundColor: "#2563eb",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: "pointer",
                    }}
                >
                    🔍 검색
                </button>
            </div>
        </div>
    );
}

// ✅ 공통 스타일
const titleStyle = {
    fontSize: "13px",
    fontWeight: "700",
    marginBottom: "8px",
    color: "#111827",
};

const selectStyle = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    fontSize: "13px",
    color: "#111827",
};

const checkboxGrid = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
};

const checkboxLabel = {
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    padding: "6px 8px",
    fontSize: "13px",
    color: "#374151",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    background: "#fff",
};
