import { useState, useEffect,useRef } from "react";
import "./OilFilterPanel.css";  // 외부 스타일 연결

export default function OilFilterPanel({ isOpen, setStations, handleOilFilterSearch, onClose }) {
    const [nearbyMode, setNearbyMode] = useState(false);
    const [radius, setRadius] = useState("");
    const [basis, setBasis] = useState(() => {
        try { return localStorage.getItem("route.priceBasis.v1") || "B027"; } catch { return "B027"; }
    });

    const sendBasis = (k) => {
        setBasis(k);
        try { localStorage.setItem("route.priceBasis.v1", k); } catch { }
        window.dispatchEvent(new CustomEvent("oil:setPriceBasis", { detail: k }));
    };

    const regionCodes = { 서울: "01", 충남: "05" };
    const cityCodes = {
        "01": { "마포구": "0109", "중구": "0102", "성동구": "0104", "서대문구": "0107", "강서구": "0115" },
        "05": { "천안시": "0502", "공주시": "0503", "아산시": "0504" }
    };

    const [selectedRegion, setSelectedRegion] = useState("충남");
    const [selectedCity, setSelectedCity] = useState("천안시");
    const [extras, setExtras] = useState({
        carWash: false, store: false, repair: false,
        self: false, quality: false, twentyFour: false, lpg: false,
    });
    const [brands, setBrands] = useState({ all: false, sk: false, gs: false, hyundai: false, soil: false, etc: false });

    const toggleCheckbox = (state, setState, key) =>
        setState(prev => ({ ...prev, [key]: !prev[key] }));

    const toggleBrand = (key) => {
        setBrands(prev => {
            if (key === "all") {
                const newValue = !prev.all;
                return { all: newValue, sk: newValue, gs: newValue, hyundai: newValue, soil: newValue, etc: newValue };
            } else {
                const updated = { ...prev, [key]: !prev[key] };
                const allChecked = updated.sk && updated.gs && updated.hyundai && updated.soil && updated.etc;
                return { ...updated, all: allChecked };
            }
        });
    };

    const doSearch = () => {
        // ✅ 검색 시: LPG가 켜지면 K015로 강제, 꺼지면 기본값(휘발유 B027)로 복귀
        if (extras.lpg) {
            if (basis !== "K015") sendBasis("K015");
        } else {
            if (basis !== "B027") sendBasis("B027");
        }
        // 1️⃣ 내 주변 주유소 모드
        if (nearbyMode && radius) {
            const savedCoord = localStorage.getItem("savedCoord");
            const myCoord = savedCoord ? JSON.parse(savedCoord) : { lat: 36.8072917, lon: 127.1471611 };
            handleOilFilterSearch({ mode: "nearby", lat: myCoord.lat, lon: myCoord.lon, radius: Number(radius) });
        } else {
            const brandCodes = [];
            if (brands.sk) brandCodes.push("SKG");
            if (brands.gs) brandCodes.push("GSC");
            if (brands.hyundai) brandCodes.push("HDO");
            if (brands.soil) brandCodes.push("SOL");
            if (brands.etc) brandCodes.push("ETC");

            handleOilFilterSearch({
                region: selectedRegion ? regionCodes[selectedRegion] : "",
                city: selectedCity ? cityCodes[regionCodes[selectedRegion]][selectedCity] : "",
                ...extras,
                brands: brandCodes,
            });
        }
        onClose(); // 검색 후 패널 닫기
    };

    return (
        <div className={`oil-panel oil-panel--floating ${isOpen ? "open" : ""}`}>
            {/* 헤더 */}
            <div className="panel-header">
                <div className="panel-title">
                    <span className="panel-icon">⛽</span>
                    <h3>주유소 찾기</h3>
                </div>
                <button onClick={onClose} className="close-btn">✕</button>
            </div>

            {/* ── 유종 색상 기준 ─────────────────────────── */}
            <div style={{ paddingTop: "12px", paddingLeft: "20px", paddingRight: "20px" }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#111827", textAlign: "center" }}>
                    유종 색상 기준
                </h4>
                {/** LPG 필터가 켜지면 다른 기준은 선택 불가 */}
                <div style={{ display: "flex", gap: 8 }}>
                    <SmallToggle
                        active={basis === "B027"}
                        onClick={() => sendBasis("B027")}
                    >
                        휘발유
                    </SmallToggle>
                    <SmallToggle
                        active={basis === "D047"}
                        onClick={() => sendBasis("D047")}
                    >
                        경유
                    </SmallToggle>
                    <SmallToggle
                        active={basis === "K015"}
                        onClick={() => sendBasis("K015")}
                        disabled={false}
                    >
                        LPG
                    </SmallToggle>
                </div>

            </div>

            {/* 본문 */}
            <div className="panel-body">
                <fieldset disabled={nearbyMode} className={nearbyMode ? "dimmed" : ""}>
                    {/* 지역 */}
                    <div className="filter-block">
                        <h4>지역</h4>
                        <select value={selectedRegion} onChange={(e) => { setSelectedRegion(e.target.value); setSelectedCity(""); }}>
                            <option value="">전체</option>
                            <option value="충남">충남</option>
                            <option value="서울">서울</option>
                        </select>
                        {selectedRegion && cityCodes[regionCodes[selectedRegion]] && (
                            <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
                                <option value="">전체</option>
                                {Object.keys(cityCodes[regionCodes[selectedRegion]]).map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* 부가정보 */}
                    <div className="filter-block">
                        <h4>부가정보</h4>
                        <div className="grid-2">
                            {[
                                { key: "carWash", label: "세차장" }, { key: "store", label: "편의점" },
                                { key: "repair", label: "경정비" }, { key: "self", label: "셀프주유소" },
                                { key: "quality", label: "품질인증" }, { key: "twentyFour", label: "24시 운영" },
                                { key: "lpg", label: "LPG 충전소" },
                            ].map(item => (
                                <label key={item.key} className="checkbox-label">
                                    <input type="checkbox" checked={extras[item.key]} onChange={() => toggleCheckbox(extras, setExtras, item.key)} />
                                    {item.label}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 상표 카테고리 */}
                    <div className="filter-block">
                        <h4>상표 카테고리</h4>
                        <div className="grid-2">
                            {[
                                { key: "all", label: "전체" }, { key: "sk", label: "SK에너지" },
                                { key: "gs", label: "GS칼텍스" }, { key: "hyundai", label: "현대오일뱅크" },
                                { key: "soil", label: "S-OIL" }, { key: "etc", label: "기타" },
                            ].map(item => (
                                <label key={item.key} className="checkbox-label">
                                    <input type="checkbox" checked={brands[item.key]} onChange={() => toggleBrand(item.key)} />
                                    {item.label}
                                </label>
                            ))}
                        </div>
                    </div>
                </fieldset>

                {/* 내 주변 */}
                <div className="filter-block">
                    <button onClick={() => setNearbyMode(!nearbyMode)} className={`nearby-btn ${nearbyMode ? "on" : ""}`}>
                        📍 내 주변 주유소
                    </button>
                    {nearbyMode && (
                        <select value={radius} onChange={(e) => setRadius(e.target.value)}>
                            <option value="">반경 선택</option>
                            <option value="1">1 km</option>
                            <option value="3">3 km</option>
                            <option value="5">5 km</option>
                        </select>
                    )}
                </div>
            </div>

            {/* 푸터 */}
            <div className="panel-footer">
                <button onClick={doSearch} className="search-btn">🔍 검색</button>
            </div>
        </div>
    );
}

function SmallToggle({ active, onClick, children, disabled }) {
    return (
        <button
            onClick={disabled ? undefined : onClick}
            disabled={!!disabled}
            style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: active ? "#eef2ff" : "#fff",
                color: active ? "#1d4ed8" : "#111827",
                fontSize: 12,
                fontWeight: 700,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.5 : 1,
            }}
        >
            {children}
        </button>
    );
}
