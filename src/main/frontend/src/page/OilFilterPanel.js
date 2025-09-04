import { useState } from "react";

export default function OilFilterPanel({ setStations, handleOilFilterSearch, onClose }) {
    const [nearbyMode, setNearbyMode] = useState(false); // ✅ 내 주변 주유소 모드 ON/OFF
    const [radius, setRadius] = useState("");            // ✅ 선택한 반경 km

////평균유가
   // ── 유종 색상 기준 (여기서 직접 제어)
  const [basis, setBasis] = useState(() => {
    try { return localStorage.getItem("route.priceBasis.v1") || "B027"; } catch { return "B027"; }
  });
  const sendBasis = (k) => {
    setBasis(k);
    try { localStorage.setItem("route.priceBasis.v1", k); } catch {}
    window.dispatchEvent(new CustomEvent("oil:setPriceBasis", { detail: k }));
  };

    // ✅ 지역 코드 매핑
    const regionCodes = {
        서울: "01",
        충남: "05",
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

    // ✅ 기본 선택값 (충남 / 천안시)
    const [selectedRegion, setSelectedRegion] = useState("충남");
    const [selectedCity, setSelectedCity] = useState("천안시");

    // ✅ 부가정보
    const [extras, setExtras] = useState({
        carWash: false,
        store: false,
        repair: false,
        self: false,
        quality: false,
        twentyFour: false,
        lpg: false,
    });

    // ✅ 상표 카테고리
    const [brands, setBrands] = useState({
        all: false,
        sk: false,
        gs: false,
        hyundai: false,
        soil: false,
        etc: false,
    });

    // ✅ 기본 좌표 (내 위치 저장 없을 때)
    const MY_COORD = { lat: 36.8072917, lon: 127.1471611 };

    // ✅ 체크박스 토글 핸들러
    const toggleCheckbox = (state, setState, key) => {
        setState((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    // ✅ 상표 전체 체크 토글
    const toggleBrand = (key) => {
        setBrands((prev) => {
            if (key === "all") {
                const newValue = !prev.all;
                return {
                    all: newValue,
                    sk: newValue,
                    gs: newValue,
                    hyundai: newValue,
                    soil: newValue,
                    etc: newValue,
                };
            } else {
                const updated = { ...prev, [key]: !prev[key] };
                const allChecked =
                    updated.sk && updated.gs && updated.hyundai && updated.soil && updated.etc;
                return { ...updated, all: allChecked };
            }
        });
    };

    // ✅ 검색 실행
    const doSearch = () => {
        // 1️⃣ 내 주변 주유소 모드
        if (nearbyMode && radius) {
            const savedCoord = localStorage.getItem("savedCoord");
            const myCoord = savedCoord ? JSON.parse(savedCoord) : MY_COORD;

            const payload = {
                mode: "nearby",
                lat: myCoord.lat,
                lon: myCoord.lon,
                radius: Number(radius), // km 단위
            };

            console.log("📍 내 주변 주유소 검색:", payload);
            handleOilFilterSearch(payload);
            return;
        }

        // 2️⃣ 지역 기반 검색
        const extrasConverted = {
            carWash: !!extras.carWash,
            store: !!extras.store,
            repair: !!extras.repair,
            self: !!extras.self,
            quality: !!extras.quality,
            twentyFour: !!extras.twentyFour,
            lpg: !!extras.lpg,
        };

        const brandCodes = [];
        if (brands.sk) brandCodes.push("SKG");
        if (brands.gs) brandCodes.push("GSC");
        if (brands.hyundai) brandCodes.push("HDO");
        if (brands.soil) brandCodes.push("SOL");
        if (brands.etc) brandCodes.push("ETC");

        const payload = {
            region: selectedRegion ? regionCodes[selectedRegion] : "",
            city: selectedCity ? cityCodes[regionCodes[selectedRegion]][selectedCity] : "",
            ...extrasConverted,
            brands: brandCodes,
        };

        console.log("📍 지역 기반 검색:", payload);
        handleOilFilterSearch(payload);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", width: "300px", height: "100vh", background: "#fff", borderRight: "1px solid #e5e7eb" }}>
            {/* 상단 헤더 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "18px" }}>⛽</span>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>주유소 찾기</h3>
                </div>
                <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: "18px", cursor: "pointer", color: "#374151" }}>✕</button>
            </div>

            {/* ── 유종 색상 기준 ─────────────────────────── */}
<div style={{ marginBottom: "20px", paddingTop: "12px", borderTop: "1px solid #e5e7eb" }}>
  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#111827", textAlign: "center" }}>
    유종 색상 기준
  </h4>
  <div style={{ display: "flex", gap: 8 }}>
    <SmallToggle active={basis === "B027"} onClick={() => sendBasis("B027")}>휘발유</SmallToggle>
    <SmallToggle active={basis === "D047"} onClick={() => sendBasis("D047")}>경유</SmallToggle>
    <SmallToggle active={basis === "K015"} onClick={() => sendBasis("K015")}>LPG</SmallToggle>
  </div>
</div>


            {/* 콘텐츠 영역 */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
                {/* 콘텐츠 영역 - 필터 묶음 전체 비활성화 */}
<fieldset
  disabled={nearbyMode}
  style={{
    border: 0,
    padding: 0,
    margin: 0,
    opacity: nearbyMode ? 0.55 : 1, // 시각적 디밍
    transition: "opacity .15s ease"
  }}
  aria-disabled={nearbyMode}
>
                {/* ✅ 지역 */}
                <div style={{ marginBottom: "20px" }}>
                    <h4 style={{ fontSize: "13px", fontWeight: "700", marginBottom: "8px", color: "#111827" }}>지역</h4>
                    <select
                        value={selectedRegion}
                        onChange={(e) => {
                            setSelectedRegion(e.target.value);
                            setSelectedCity("");
                        }}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px", color: "#111827" }}
                    >
                        <option value="">전체</option>
                        <option value="충남">충남</option>
                        <option value="서울">서울</option>
                    </select>

                    {selectedRegion && cityCodes[regionCodes[selectedRegion]] && (
                        <select
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            style={{ marginTop: "10px", width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px", color: "#111827" }}
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
                    <h4 style={{ fontSize: "13px", fontWeight: "700", marginBottom: "8px", color: "#111827" }}>부가정보</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        {[
                            { key: "carWash", label: "세차장" },
                            { key: "store", label: "편의점" },
                            { key: "repair", label: "경정비" },
                            { key: "self", label: "셀프주유소" },
                            { key: "quality", label: "품질인증" },
                            { key: "twentyFour", label: "24시 운영" },
                            { key: "lpg", label: "LPG 충전소" },
                        ].map((item) => (
                            <label key={item.key} style={{ border: "1px solid #d1d5db", borderRadius: "6px", padding: "6px 8px", fontSize: "13px", color: "#374151", display: "flex", alignItems: "center", cursor: "pointer", background: "#fff" }}>
                                <input type="checkbox" checked={extras[item.key]} onChange={() => toggleCheckbox(extras, setExtras, item.key)} style={{ marginRight: "6px" }} />
                                {item.label}
                            </label>
                        ))}
                    </div>
                </div>

                {/* ✅ 상표 카테고리 */}
                <div style={{ marginBottom: "20px" }}>
                    <h4 style={{ fontSize: "13px", fontWeight: "700", marginBottom: "8px", color: "#111827" }}>상표 카테고리</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        {[
                            { key: "all", label: "전체" },
                            { key: "sk", label: "SK에너지" },
                            { key: "gs", label: "GS칼텍스" },
                            { key: "hyundai", label: "현대오일뱅크" },
                            { key: "soil", label: "S-OIL" },
                            { key: "etc", label: "기타" },
                        ].map((item) => (
                            <label key={item.key} style={{ border: "1px solid #d1d5db", borderRadius: "6px", padding: "6px 8px", fontSize: "13px", color: "#374151", display: "flex", alignItems: "center", cursor: "pointer", background: "#fff" }}>
                                <input type="checkbox" checked={brands[item.key]} onChange={() => toggleBrand(item.key)} style={{ marginRight: "6px" }} />
                                {item.label}
                            </label>
                        ))}
                    </div>
                    
                </div>
                </fieldset>
                

                {/* ✅ 내 주변 주유소 */}
                <div style={{ marginBottom: "20px" }}>
                    <button
                        onClick={() => setNearbyMode(!nearbyMode)}
                        style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: "6px",
                            border: "1px solid #d1d5db",
                            fontSize: "13px",
                            backgroundColor: nearbyMode ? "#2563eb" : "#fff",
                            color: nearbyMode ? "#fff" : "#111827",
                            cursor: "pointer",
                        }}
                    >
                        📍 내 주변 주유소
                    </button>

                    {nearbyMode && (
                        <select
                            value={radius}
                            onChange={(e) => setRadius(e.target.value)}
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
                            <option value="">반경 선택</option>
                            <option value="1">1 km</option>
                            <option value="3">3 km</option>
                            <option value="5">5 km</option>
                        </select>
                    )}
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

function SmallToggle({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "8px 10px",
        borderRadius: 8,
        border: "1px solid #d1d5db",
        background: active ? "#eef2ff" : "#fff",
        color: active ? "#1d4ed8" : "#111827",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

