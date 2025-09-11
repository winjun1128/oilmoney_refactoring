import { useState, useEffect, useRef } from "react";
import "./OilFilterPanel.css";  // 외부 스타일 연결


// OilFilterPanel.jsx 상단 import들 아래에 헬퍼 추가
const inferBasisFromCar = (car) => {
    const raw = String(
        car?.fuelType ?? car?.fuel ?? car?.fuelCd ?? car?.fuel_code ?? car?.fuel_kind ?? ""
    ).toUpperCase();

    // 한/영/코드 혼용 대응
    if (raw.includes("LPG") || raw.includes("K015") || raw.includes("액화석유")) {
        return { basis: "K015", isLpg: true };
    }
    if (raw.includes("DIESEL") || raw.includes("경유") || raw.includes("D047")) {
        return { basis: "D047", isLpg: false };
    }
    if (raw.includes("GASOLINE") || raw.includes("휘발유") || raw.includes("B027") ||
        raw.includes("PETROL") || raw.includes("BENZ")) {
        return { basis: "B027", isLpg: false };
    }
    // 모르면 휘발유로
    return { basis: "B027", isLpg: false };
};

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
                mode: "filter",
                region: selectedRegion ? regionCodes[selectedRegion] : "",
                city: selectedCity ? cityCodes[regionCodes[selectedRegion]][selectedCity] : "",
                ...extras,
                brands: brandCodes,
            });

            // 🔍 찍기
console.log("검색 요청 파라미터:", {
    mode: "filter",
    region: selectedRegion ? regionCodes[selectedRegion] : "",
    city: selectedCity ? cityCodes[regionCodes[selectedRegion]][selectedCity] : "",
    ...extras,
    brands: brandCodes,
});
        }
        onClose(); // 검색 후 패널 닫기
    };

    // OilFilterPanel 컴포넌트 내부
    useEffect(() => {
        // 페이지 로드(마운트) 시 1회만
        (async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                const res = await fetch("/mainCar", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json", // ★ JSON으로 받도록 강제
                    },
                });
                if (!res.ok) return;

                // 혹시 서버가 XML이나 다른 포맷을 줄 경우 대비 (무한 에러 방지)
                const ct = res.headers.get("content-type") || "";
                if (!ct.includes("application/json")) {
                    const text = await res.text();
                    console.warn("[/mainCar] non-JSON response:", text);
                    return;
                }

                const { ok, item: car } = await res.json();
                if (!ok || !car) return;

                const { basis: b, isLpg } = inferBasisFromCar(car);

                // lpg 체크 반영
                setExtras((prev) => ({ ...prev, lpg: isLpg }));
                // 기준 반영 + 이벤트 브로드캐스트
                if (b !== basis) sendBasis(b);
            } catch (e) {
                // 비로그인/네트워크 오류 등은 조용히 무시
                console.error(e);
            }
        })();
    }, []); // 마운트 시 1회



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
                            <option value="서울">서울</option>
                            <option value="서울">경기</option>
                            <option value="충남">인천</option>
                            <option value="서울">강원</option>
                            <option value="서울">충남</option>
                            <option value="서울">충북</option>
                            <option value="서울">전남</option>
                            <option value="서울">전북</option>
                            <option value="서울">부산</option>
                            <option value="서울">제주</option>
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
