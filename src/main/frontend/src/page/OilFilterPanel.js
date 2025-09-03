import { useState, useEffect } from "react";
import axios from "axios";

export default function OilFilterPanel({ setStations, handleOilFilterSearch, onClose }) {
    const [selectedRegion, setSelectedRegion] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [extras, setExtras] = useState({
        carWash: false,
        store: false,
        repair: false,
        self: false,
        quality: false,
        twentyFour: false,
        lpg: false,
    });
    const [brands, setBrands] = useState({
        all: false,
        sk: false,
        gs: false,
        hyundai: false,
        soil: false,
        etc: false,
    });

    // ✅ 지역 코드 매핑
    const regionCodes = {
        서울: "01",
        충남: "05",
    };

    // ✅ 충남 시군구 코드 매핑
    const cityCodes = {
        "01": {
            "마포구": "0109",
            "중구": "0102",
            "성동구": "0104",
            "서대문구": "0107",
            "강서구": "0115",
        },
        "05": {
            "천안시": "0502",
            "공주시": "0503",
            "아산시": "0504",
            "보령시": "0505",
            "서산시": "0506",
            "논산시": "0507",
            "계룡시": "0508",
            "금산군": "0521",
            "부여군": "0526",
            "서천군": "0527",
            "청양군": "0529",
            "홍성군": "0530",
            "예산군": "0531",
            "당진시": "0533",
            "태안군": "0537"
        }
    };

    // ✅ 체크박스 토글 핸들러
    const toggleCheckbox = (state, setState, key) => {
        setState((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const doSearch = () => {
        // ✅ 부가정보 변환 (Y/N)
        const extrasConverted = {
            carWash: !!extras.carWash,
            store: !!extras.store,
            repair: !!extras.repair,
            self: !!extras.self,
            quality: !!extras.quality,
            twentyFour: !!extras.twentyFour,
            lpg: !!extras.lpg,
        };

        // ✅ 브랜드 변환 (코드 리스트)
        const brandCodes = [];
        if (brands.sk) brandCodes.push("SKG");      // SK에너지
        if (brands.gs) brandCodes.push("GSC");      // GS칼텍스
        if (brands.hyundai) brandCodes.push("HDO"); // 현대오일뱅크
        if (brands.soil) brandCodes.push("SOL");    // S-OIL
        if (brands.etc) brandCodes.push("ETC");     // 기타

        // ✅ 최종 payload (코드값으로 변환)
        const payload = {
            region: selectedRegion ? regionCodes[selectedRegion] : "",
            city: selectedCity ? cityCodes[regionCodes[selectedRegion]][selectedCity] : "",
            ...extrasConverted,
            brands: brandCodes,
        };

        console.log("백엔드로 보낼 데이터:", payload);

        handleOilFilterSearch(payload);
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                width: "300px",
                height: "100vh",
                background: "#fff",
                borderRight: "1px solid #e5e7eb",
            }}
        >
            {/* 상단 헤더 */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    borderBottom: "1px solid #e5e7eb",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "18px" }}>⛽</span>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>주유소 찾기</h3>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: "transparent",
                        border: "none",
                        fontSize: "18px",
                        cursor: "pointer",
                        color: "#374151",
                    }}
                >
                    ✕
                </button>
            </div>

            {/* 콘텐츠 영역 */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
                {/* ✅ 지역 */}
                <div style={{ marginBottom: "20px" }}>
                    <h4
                        style={{
                            fontSize: "13px",
                            fontWeight: "700",
                            marginBottom: "8px",
                            color: "#111827",
                        }}
                    >
                        지역
                    </h4>
                    <select
                        value={selectedRegion}
                        onChange={(e) => {
                            setSelectedRegion(e.target.value);
                            setSelectedCity("");
                        }}
                        style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: "6px",
                            border: "1px solid #d1d5db",
                            fontSize: "13px",
                            color: "#111827",
                        }}
                    >
                        <option value="">전체</option>
                        <option value="충남">충남</option>
                        <option value="서울">서울</option>
                    </select>

                    {selectedRegion && cityCodes[regionCodes[selectedRegion]] && (
                        <select
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            style={{
                                marginTop: "10px",
                                width: "100%",
                                padding: "8px 10px",
                                borderRadius: "6px",
                                border: "1px solid #d1d5db",
                                fontSize: "13px",
                                color: "#111827",
                            }}
                        >
                            <option value="">전체</option>
                            {Object.keys(cityCodes[regionCodes[selectedRegion]]).map((city) => (
                                <option key={city} value={city}>
                                    {city}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* ✅ 부가정보 */}
                <div style={{ marginBottom: "20px" }}>
                    <h4
                        style={{
                            fontSize: "13px",
                            fontWeight: "700",
                            marginBottom: "8px",
                            color: "#111827",
                        }}
                    >
                        부가정보
                    </h4>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "8px",
                        }}
                    >
                        {[
                            { key: "carWash", label: "세차장" },
                            { key: "store", label: "편의점" },
                            { key: "repair", label: "경정비" },
                            { key: "self", label: "셀프주유소" },
                            { key: "quality", label: "품질인증" },
                            { key: "twentyFour", label: "24시 운영" },
                            { key: "lpg", label: "LPG 충전소" },
                        ].map((item) => (
                            <label
                                key={item.key}
                                style={{
                                    border: "1px solid #d1d5db",
                                    borderRadius: "6px",
                                    padding: "6px 8px",
                                    fontSize: "13px",
                                    color: "#374151",
                                    display: "flex",
                                    alignItems: "center",
                                    cursor: "pointer",
                                    background: "#fff",
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={extras[item.key]}
                                    onChange={() => toggleCheckbox(extras, setExtras, item.key)}
                                    style={{ marginRight: "6px" }}
                                />
                                {item.label}
                            </label>
                        ))}
                    </div>
                </div>

                {/* ✅ 상표 카테고리 */}
                <div style={{ marginBottom: "20px" }}>
                    <h4
                        style={{
                            fontSize: "13px",
                            fontWeight: "700",
                            marginBottom: "8px",
                            color: "#111827",
                        }}
                    >
                        상표 카테고리
                    </h4>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "8px",
                        }}
                    >
                        {[
                            { key: "all", label: "전체" },
                            { key: "sk", label: "SK에너지" },
                            { key: "gs", label: "GS칼텍스" },
                            { key: "hyundai", label: "현대오일뱅크" },
                            { key: "soil", label: "S-OIL" },
                            { key: "etc", label: "기타" },
                        ].map((item) => (
                            <label
                                key={item.key}
                                style={{
                                    border: "1px solid #d1d5db",
                                    borderRadius: "6px",
                                    padding: "6px 8px",
                                    fontSize: "13px",
                                    color: "#374151",
                                    display: "flex",
                                    alignItems: "center",
                                    cursor: "pointer",
                                    background: "#fff",
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={brands[item.key]}
                                    onChange={() => toggleCheckbox(brands, setBrands, item.key)}
                                    style={{ marginRight: "6px" }}
                                />
                                {item.label}
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* 검색 버튼 (하단 고정) */}
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
