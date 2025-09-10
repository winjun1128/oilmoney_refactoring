import { useState,useEffect } from "react";
import "./ChargeFilterPanel.css"; // ✅ 외부 스타일 연결

// ChargeFilterPanel.jsx 상단 import들 아래에 헬퍼 추가
const inferEvFromCar = (car) => {
  const fuelRaw = String(
    car?.fuelType ?? car?.fuel ?? car?.powertrain ?? car?.type ?? ""
  ).toUpperCase();

  const isEv =
    fuelRaw.includes("EV") ||
    fuelRaw.includes("ELECTRIC") ||
    fuelRaw.includes("전기");

  // 커넥터/방식/출력 추정
  const plugRaw = String(
    car?.connector ?? car?.plugType ?? car?.chargeType ?? ""
  ).toUpperCase();
  const maxKw = Number(car?.maxKw ?? car?.maxOutput ?? car?.kw ?? 0);

  const methods = new Set();
  if (plugRaw.includes("CCS") || plugRaw.includes("콤보")) methods.add("DC콤보");
  if (plugRaw.includes("차데모") || plugRaw.includes("CHADEMO")) methods.add("DC차데모");
  if (plugRaw.includes("AC3상")) methods.add("AC3상");
  if (plugRaw.includes("AC완속") || plugRaw.includes("AC")) methods.add("AC완속");

  const chargerTypes = new Set();
  if (maxKw >= 100) chargerTypes.add("초급속");
  else if (maxKw >= 50) chargerTypes.add("급속");
  else if (maxKw > 0) chargerTypes.add("완속");

  // 정보가 모호하면 한국 기본값(DC콤보/급속) 추천
  if (isEv && methods.size === 0) methods.add("DC콤보");
  if (isEv && chargerTypes.size === 0) chargerTypes.add("급속");

  return {
    isEv,
    method: Array.from(methods),
    chargerType: Array.from(chargerTypes),
  };
};


export default function ChargeFilterPanel({ isOpen, handleChargeFilterSearch, onClose }) {
    const [selectedRegion, setSelectedRegion] = useState("44");
    const [selectedCity, setSelectedCity] = useState("44130");
    const [chargerType, setChargerType] = useState([]);
    const [method, setMethod] = useState([]);
    const [minOutput, setMinOutput] = useState("");
    const [status, setStatus] = useState("");
    const [twentyFour, setTwentyFour] = useState(false);
    const [floorType, setFloorType] = useState("");
    const [nearbyMode, setNearbyMode] = useState(false);
    const [radius, setRadius] = useState("");

    const MY_COORD = { lat: 36.8072917, lon: 127.1471611 };

    const regionCodes = { 서울: "01", 충남: "44" };

    const cityCodes = {
        "01": { "마포구": "0109", "중구": "0102", "성동구": "0104", "서대문구": "0107", "강서구": "0115" },
        "44": { "천안시": "44130", "공주시": "44150", "보령시": "44180", "아산시": "44200", "서산시": "44210" }
    };

    const toggleCheckbox = (value, setState) => {
        setState(prev =>
            prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
        );
    };

    const doSearch = () => {
        

        // 1) 🔵 내 주변 충전소 모드
        if (nearbyMode) {
            if (!radius) {
                alert("반경을 선택하세요.");
                return;
            }
            const savedCoord = localStorage.getItem("savedCoord");
            const myCoord = savedCoord ? JSON.parse(savedCoord) : MY_COORD;

            const payload = {
                mode: "nearby",
                lat: myCoord.lat,
                lng: myCoord.lon,
                radius: Number(radius), // km
              //method,
              //chargerType,
            };
            console.log("📍 내 주변 충전소 검색:", payload);
            handleChargeFilterSearch(payload);
            onClose();
            return;
        }

        const statusMap = { "01": "2", "02": "3", "03": "5" };

        const payload = {
            region: selectedRegion || null,
            city: selectedCity || null,
            methods: method,
            chargerType,
            minOutput: minOutput ? Number(minOutput) : null,
            status: statusMap[status] || null,
            twentyFour,
            floorType: floorType || null
        };
        console.log("🚀 충전소 필터 payload:", payload);
        handleChargeFilterSearch(payload);
        onClose();
    };

    // ChargeFilterPanel.jsx
useEffect(() => {
  (async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("/mainCar", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",        // ★ JSON 요청 강제
        },
      });

      // 혹시 서버가 또 JSON이 아닌 걸 줄 경우 대비한 안전장치 (디버깅용)
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const t = await res.text();
        console.warn("[/mainCar] non-JSON response:", t);
        return; // JSON 아니라면 여기서 종료 (바인딩 회피)
      }

      const { ok, item: car } = await res.json();
      if (!ok || !car) return;

      const pref = inferEvFromCar(car); // 이전에 드린 헬퍼
      if (pref.isEv) {
        if (pref.method.length) setMethod(pref.method);
        if (pref.chargerType.length) setChargerType(pref.chargerType);
      }
    } catch (e) {
      console.error(e);
    }
  })();
}, []);



    return (
        <div className={`charge-panel ${isOpen ? "open" : ""}`}>
            {/* 헤더 */}
            <div className="panel-header">
                <div className="panel-title">
                    <span className="panel-icon">🔋</span>
                    <h3>충전소 찾기</h3>
                </div>
                <button onClick={onClose} className="close-btn">✕</button>
            </div>

            {/* 본문 */}
            <div className="panel-body">
                <fieldset disabled={nearbyMode} className={nearbyMode ? "dimmed" : ""}>
                    {/* 지역 */}
                    <div className="filter-block">
                        <h4>지역</h4>
                        <select value={selectedRegion} onChange={(e) => { setSelectedRegion(e.target.value); setSelectedCity(""); }}>
                            <option value="">전체</option>
                            {Object.keys(regionCodes).map(r => (
                                <option key={r} value={regionCodes[r]}>{r}</option>
                            ))}
                        </select>
                        {selectedRegion && cityCodes[selectedRegion] && (
                            <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
                                <option value="">전체</option>
                                {Object.entries(cityCodes[selectedRegion]).map(([city, code]) => (
                                    <option key={city} value={code}>{city}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* 충전기 타입 */}
                    <div className="filter-block">
                        <h4>충전기 타입</h4>
                        <div className="grid-2">
                            {["완속", "급속", "초급속"].map(t => (
                                <label key={t} className="checkbox-label">
                                    <input type="checkbox" checked={chargerType.includes(t)} onChange={() => toggleCheckbox(t, setChargerType)} />
                                    {t}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 충전 방식 */}
                    <div className="filter-block">
                        <h4>충전 방식</h4>
                        <div className="grid-2">
                            {["AC완속", "DC차데모", "DC콤보", "AC3상"].map(m => (
                                <label key={m} className="checkbox-label">
                                    <input type="checkbox" checked={method.includes(m)} onChange={() => toggleCheckbox(m, setMethod)} />
                                    {m}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 충전 가능 여부 */}
                    <div className="filter-block">
                        <h4>충전 가능 여부</h4>
                        <select value={status} onChange={(e) => setStatus(e.target.value)}>
                            <option value="">전체</option>
                            <option value="01">충전 가능</option>
                            <option value="02">충전 중</option>
                            <option value="03">점검 중</option>
                        </select>
                    </div>

                    {/* 운영 시간 */}
                    <div className="filter-block">
                        <h4>운영 시간</h4>
                        <label className="checkbox-label">
                            <input type="checkbox" checked={twentyFour} onChange={(e) => setTwentyFour(e.target.checked)} />
                            24시간 운영
                        </label>
                    </div>

                    {/* 설치 위치 */}
                    <div className="filter-block">
                        <h4>설치 위치</h4>
                        <select value={floorType} onChange={(e) => setFloorType(e.target.value)}>
                            <option value="">전체</option>
                            <option value="F">지상</option>
                            <option value="B">지하</option>
                        </select>
                    </div>
                </fieldset>

                {/* 내 주변 충전소 */}
                <div className="filter-block">
                    <button onClick={() => { const next = !nearbyMode; setNearbyMode(next); if (next && !radius) setRadius("3"); }}
                        className={`nearby-btn ${nearbyMode ? "on" : ""}`}>
                        ⚡ 내 주변 충전소
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
