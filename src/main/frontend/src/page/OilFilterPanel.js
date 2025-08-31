import { useState,useEffect } from "react";
import axios from "axios";

export default function OilFilterPanel({ setStations, handleOilFilterSearch }) {
    const [selectedRegion, setSelectedRegion] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [radius, setRadius] = useState("3"); // 기본값 3km
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
            radius,
            ...extrasConverted,
            brands: brandCodes,
        };

        console.log("백엔드로 보낼 데이터:", payload);

        handleOilFilterSearch(payload);
    }

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
                ⛽ 주유소 필터
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

            {/* ✅ 하위 시군구 선택 */}
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

            {/* ✅ 부가정보 */}
            <div style={{ marginBottom: "1rem" }}>
                <label
                    style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}
                >
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

            {/* ✅ 상표 카테고리 */}
            <div style={{ marginBottom: "1rem" }}>
                <label
                    style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}
                >
                    상표 카테고리
                </label>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "6px",
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
                                checked={brands[item.key]}
                                onChange={() =>
                                    toggleCheckbox(brands, setBrands, item.key)
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
                        backgroundColor: "#2563eb",
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
