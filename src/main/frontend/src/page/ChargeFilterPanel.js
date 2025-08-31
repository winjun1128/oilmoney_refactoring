import { useState } from "react";

export default function ChargeFilterPanel({ handleChargeFilterSearch }) {
    const [selectedRegion, setSelectedRegion] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [chargerTypes, setChargerTypes] = useState({
        slow: false,
        fast: false,
        super: false,
    });
    const [extras, setExtras] = useState({
        free: false,
        twentyFour: false,
        parking: false,
    });

    // ✅ 지역 코드 매핑
    const regionCodes = {
        서울: "01", // 서울 작동 x
        충남: "44",
    };

    // ✅ 시군구 코드 매핑
    const cityCodes = {
        "44": { // 충청남도
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
        }
    };

    const toggleCheckbox = (state, setState, key) => {
        setState((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const doSearch = () => {
        const payload = {
            region: selectedRegion ? regionCodes[selectedRegion] : "",
            city: selectedCity 
                ? cityCodes[regionCodes[selectedRegion]][selectedCity] 
                : "",
            chargerTypes: Object.entries(chargerTypes)
                .filter(([_, v]) => v)
                .map(([k]) => k),
            free: extras.free,
            twentyFour: extras.twentyFour,
            parking: extras.parking,
        };

        console.log("충전소 필터 payload:", payload);
        handleChargeFilterSearch(payload);
    };

    return (
        <div
            style={{
                padding: "20px",
                fontSize: "15px",
                color: "#1f2937",
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                width: "260px",
            }}
        >
            <h3 style={{ marginBottom: "1rem", fontSize: "18px", fontWeight: "600" }}>
                🔋 충전소 필터
            </h3>

            {/* ✅ 지역 선택 */}
            <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>
                    지역
                </label>
                <select
                    value={selectedRegion}
                    onChange={(e) => {
                        setSelectedRegion(e.target.value);
                        setSelectedCity("");
                    }}
                    style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "10px",
                        border: "1px solid #d1d5db",
                        outline: "none",
                    }}
                >
                    <option value="">전체</option>
                    <option value="충남">충남</option>
                    <option value="서울">서울</option>
                </select>
            </div>

            {/* ✅ 시군구 */}
            {selectedRegion && cityCodes[regionCodes[selectedRegion]] && (
                <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>
                        시/군/구
                    </label>
                    <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: "10px",
                            border: "1px solid #d1d5db",
                            outline: "none",
                        }}
                    >
                        <option value="">전체</option>
                        {Object.keys(cityCodes[regionCodes[selectedRegion]]).map((city) => (
                            <option key={city} value={city}>
                                {city}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* ✅ 충전기 타입 */}
            <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>
                    충전기 타입
                </label>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "6px",
                    }}
                >
                    {[
                        { key: "slow", label: "완속" },
                        { key: "fast", label: "급속" },
                        { key: "super", label: "초급속" },
                    ].map((item) => (
                        <label
                            key={item.key}
                            style={{
                                background: "#f9fafb",
                                border: "1px solid #e5e7eb",
                                borderRadius: "10px",
                                padding: "6px 8px",
                                cursor: "pointer",
                                fontSize: "14px",
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={chargerTypes[item.key]}
                                onChange={() =>
                                    toggleCheckbox(chargerTypes, setChargerTypes, item.key)
                                }
                                style={{ marginRight: "6px" }}
                            />
                            {item.label}
                        </label>
                    ))}
                </div>
            </div>

            {/* ✅ 부가정보 */}
            <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>
                    부가정보
                </label>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "6px",
                    }}
                >
                    {[
                        { key: "free", label: "무료 충전" },
                        { key: "twentyFour", label: "24시 운영" },
                        { key: "parking", label: "전용 주차면" },
                    ].map((item) => (
                        <label
                            key={item.key}
                            style={{
                                background: "#f9fafb",
                                border: "1px solid #e5e7eb",
                                borderRadius: "10px",
                                padding: "6px 8px",
                                cursor: "pointer",
                                fontSize: "14px",
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={extras[item.key]}
                                onChange={() =>
                                    toggleCheckbox(extras, setExtras, item.key)
                                }
                                style={{ marginRight: "6px" }}
                            />
                            {item.label}
                        </label>
                    ))}
                </div>
            </div>

            {/* ✅ 검색 버튼 */}
            <div style={{ textAlign: "right", marginTop: "1.5rem" }}>
                <button
                    onClick={doSearch}
                    style={{
                        padding: "10px 14px",
                        backgroundColor: "#059669",
                        color: "#fff",
                        border: "none",
                        borderRadius: "12px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "600",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    }}
                >
                    🔍 검색
                </button>
            </div>
        </div>
    );
}
