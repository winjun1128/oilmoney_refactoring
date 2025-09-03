import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./OilMap.css"; // ✅ 외부 스타일 연결

const APP_KEY = "a0bf78472bc0a1b7bbc6d29dacbebd9a";
const SDK_URL = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${APP_KEY}&autoload=false&libraries=services`;

const OPENWEATHER_KEY = "0b031132dd9ad99e8aae8aef34f370a8";
const MY_COORD = { lat: 36.8072917, lon: 127.1471611 };

const MIN_LEVEL = 1;
const MAX_LEVEL = 12;

/* ✅ 마커 아이콘 */
const pinSvg = (fill = "#2b8af7", stroke = "#1b6ad1") => `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
  <path d="M14 0C6.82 0 1 5.82 1 13c0 9.53 12 27 13 27s13-17.47 13-27C27 5.82 21.18 0 14 0z" 
        fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
  <circle cx="14" cy="13" r="5.5" fill="#fff"/>
</svg>`.trim();

const markerImgCache = {};
const getMarkerImage = (type, kakao) => {
    const key = String(type);
    if (markerImgCache[key]) return markerImgCache[key];

    const color =
        type === "ev" ? "#2b8af7" :
            type === "oil" ? "#ff7f27" :
                type === "lpg" ? "#616161" :
                    type === "origin" ? "#7b1fa2" :
                        type === "dest" ? "#2e7d32" : "#999";

    const src = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(pinSvg(color));
    const img = new kakao.maps.MarkerImage(src, new kakao.maps.Size(21, 30), {
        offset: new kakao.maps.Point(14, 40),
    });

    markerImgCache[key] = img;
    return img;
};

export default function OilMap({ stations, handleLocationSearch }) {
    const mapDivRef = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef([]);
    const myMarkerRef = useRef(null);
    const infoRef = useRef(null);

    const zoomFillRef = useRef(null);
    const zoomLabelRef = useRef(null);

    const [weather, setWeather] = useState(null);
    const [air, setAir] = useState(null);
    const [adjustMode, setAdjustMode] = useState(false);
    const [selectedCoord, setSelectedCoord] = useState(null);

    // ✅ 미세먼지 등급
    const pmGrade = (v, type) => {
        if (v == null) return { label: "-", color: "#6b7280" };
        if (type === "pm10") {
            if (v <= 30) return { label: "좋음", color: "#2563eb" };
            if (v <= 80) return { label: "보통", color: "#22c55e" };
            if (v <= 150) return { label: "나쁨", color: "#f59e0b" };
            return { label: "매우 나쁨", color: "#ef4444" };
        } else {
            if (v <= 15) return { label: "좋음", color: "#2563eb" };
            if (v <= 35) return { label: "보통", color: "#22c55e" };
            if (v <= 75) return { label: "나쁨", color: "#f59e0b" };
            return { label: "매우 나쁨", color: "#ef4444" };
        }
    };

    // ✅ 날씨
    const fetchWeather = async (lat, lon) => {
        try {
            const wRes = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=kr&appid=${OPENWEATHER_KEY}`
            );
            const w = await wRes.json();

            const aRes = await fetch(
                `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}`
            );
            const a = await aRes.json();

            setWeather({
                temp: Math.round(w?.main?.temp ?? 0),
                feels: Math.round(w?.main?.feels_like ?? 0),
                icon: w?.weather?.[0]?.icon,
                desc: w?.weather?.[0]?.description ?? "",
            });

            const comp = a?.list?.[0]?.components || {};
            setAir({ pm10: comp.pm10, pm25: comp.pm2_5 });
        } catch (e) {
            console.error("weather fetch error", e);
        }
    };

    // ✅ 줌바
    const updateZoomBar = () => {
        if (!mapRef.current) return;
        const level = mapRef.current.getLevel();
        if (zoomLabelRef.current) zoomLabelRef.current.textContent = `Lv ${level}`;
        const ratio = Math.max(0, Math.min(1, (MAX_LEVEL - level) / (MAX_LEVEL - MIN_LEVEL)));
        if (zoomFillRef.current) zoomFillRef.current.style.height = `${ratio * 100}%`;
    };

    const zoomIn = () => {
        if (!mapRef.current) return;
        mapRef.current.setLevel(Math.max(MIN_LEVEL, mapRef.current.getLevel() - 1));
    };
    const zoomOut = () => {
        if (!mapRef.current) return;
        mapRef.current.setLevel(Math.min(MAX_LEVEL, mapRef.current.getLevel() + 1));
    };

    // ✅ 맵 초기화
    useEffect(() => {
        const init = () => {
            const savedCoord = localStorage.getItem("savedCoord");
            const coord = savedCoord ? JSON.parse(savedCoord) : MY_COORD;

            const center = new window.kakao.maps.LatLng(coord.lat, coord.lon);
            const map = new window.kakao.maps.Map(mapDivRef.current, { center, level: 3 });
            mapRef.current = map;

            map.setMinLevel(MIN_LEVEL);
            map.setMaxLevel(MAX_LEVEL);

            infoRef.current = new window.kakao.maps.InfoWindow({ zIndex: 10 });
            window.kakao.maps.event.addListener(map, "click", () => infoRef.current.close());

            const markerImage = new window.kakao.maps.MarkerImage(
                "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
                new window.kakao.maps.Size(24, 35),
                { offset: new window.kakao.maps.Point(12, 35) }
            );

            myMarkerRef.current = new window.kakao.maps.Marker({
                position: center,
                image: markerImage,
                map,
            });

            fetchWeather(coord.lat, coord.lon);
            window.kakao.maps.event.addListener(map, "zoom_changed", updateZoomBar);
            updateZoomBar();
        };

        if (window.kakao?.maps) window.kakao.maps.load(init);
        else {
            const script = document.createElement("script");
            script.src = SDK_URL;
            script.async = true;
            script.onload = () => window.kakao.maps.load(init);
            document.head.appendChild(script);
        }
    }, []);

    // ✅ 마커 표시
    useEffect(() => {
        if (!window.kakao || !mapRef.current) return;
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        if (!stations?.length) return;
        const bounds = new window.kakao.maps.LatLngBounds();
        const newMarkers = [];
        const centerCoord = selectedCoord ?? MY_COORD;

        stations.forEach((s) => {
            const lat = Number(s.lat ?? s.LAT);
            const lon = Number(s.lon ?? s.LON ?? s.lng);
            if (Number.isNaN(lat) || Number.isNaN(lon)) return;

            const pos = new window.kakao.maps.LatLng(lat, lon);
            const isCharge = !!s.statId;
            const markerImage = getMarkerImage(isCharge ? "ev" : "oil", window.kakao);

            const marker = new window.kakao.maps.Marker({ position: pos, zIndex: 5, image: markerImage });
            marker.setMap(mapRef.current);
            newMarkers.push(marker);
            bounds.extend(pos);

            window.kakao.maps.event.addListener(marker, "click", async () => {
                if (isCharge) {
                    const html = `
            <div class="info-window">
              <div class="info-title">${escapeHtml(s.statNm ?? "충전소")}</div>
              ${s.addr ? `<div class="info-row">📍 ${escapeHtml(s.addr)}</div>` : ""}
              ${s.useTime ? `<div class="info-row">⏰ ${escapeHtml(s.useTime)}</div>` : ""}
              ${s.busiNm ? `<div class="info-row">👤 운영사: ${escapeHtml(s.busiNm)}</div>` : ""}
            </div>`;
                    infoRef.current.setContent(html);
                } else {
                    const stationName = s.name ?? s.NAME ?? "이름없음";
                    const addr = s.address ?? s.ADDR ?? s.ADDRESS ?? "";
                    const brand = s.brand ?? s.BRAND ?? "";
                    let oilHtml = "";

                    try {
                        const res = await axios.get("/api/oil/price", { params: { id: s.stationId } });
                        const prices = res.data;
                        if (prices["휘발유"] || prices["경유"] || prices["LPG"] || prices["등유"]) {
                            oilHtml = `
                <div class="price-box">
                  ${prices["휘발유"] ? `<div class="price-row"><span>⛽ 휘발유</span><b>${prices["휘발유"]}원</b></div>` : ""}
                  ${prices["경유"] ? `<div class="price-row"><span>🛢 경유</span><b>${prices["경유"]}원</b></div>` : ""}
                  ${prices["등유"] ? `<div class="price-row"><span>🏠 등유</span><b>${prices["등유"]}원</b></div>` : ""}
                  ${prices["LPG"] ? `<div class="price-row"><span>🔥 LPG</span><b>${prices["LPG"]}원</b></div>` : ""}
                </div>`;
                        } else {
                            oilHtml = `<div class="price-box">⚠️ 가격 등록이 안됐습니다.</div>`;
                        }
                    } catch {
                        oilHtml = `<div class="price-error">⚠️ 가격 정보를 불러오지 못했습니다.</div>`;
                    }

                    const flags = {
                        세차장: (s.carWash ?? s.CAR_WASH_YN) === "Y",
                        편의점: (s.store ?? s.CVS_YN ?? s.CONVENIENCE_YN) === "Y",
                        경정비: (s.repair ?? s.MAINT_YN) === "Y",
                        셀프주유소: (s.self ?? s.SELF_YN) === "Y",
                        품질인증주유소: (s.quality ?? s.KPETRO_YN ?? s.QUAL_YN) === "Y",
                        '24시간': (s.twentyFour ?? s.OPEN_24H_YN ?? s.TWENTY_FOUR_YN) === "Y",
                        LPG충전소: (s.lpgYN ?? s.LPG_YN) === "Y",
                    };

                    const html = `
            <div class="info-window">
              <div class="info-header">
                <div class="info-title">${escapeHtml(stationName)}</div>
                ${brand ? `<span class="info-badge">${escapeHtml(brand)}</span>` : ""}
              </div>
              ${addr ? `<div class="info-row">📍 ${escapeHtml(addr)}</div>` : ""}
              ${oilHtml}
              <div class="info-flags">
                ${Object.entries(flags).map(([k, v]) => `<span class="flag ${v ? "on" : ""}">${k}</span>`).join("")}
              </div>
            </div>`;
                    infoRef.current.setContent(html);
                }
                infoRef.current.open(mapRef.current, marker);
                mapRef.current.panTo(pos);
            });
        });

        markersRef.current = newMarkers;
        if (newMarkers.length > 0) mapRef.current.setBounds(bounds);
    }, [stations]);

    // ✅ 내 위치 이동
    const goMyPosition = () => {
        if (!window.kakao || !mapRef.current) return;
        const savedCoord = localStorage.getItem("savedCoord");
        let target = savedCoord ? JSON.parse(savedCoord) : MY_COORD;
        const pos = new window.kakao.maps.LatLng(target.lat, target.lon);
        mapRef.current.setLevel(3);
        mapRef.current.panTo(pos);
        if (myMarkerRef.current) myMarkerRef.current.setPosition(pos);
        fetchWeather(target.lat, target.lon);
    };

    // ✅ 위치 저장 함수
    const saveMyPosition = () => {
        const center = mapRef.current.getCenter();
        const newPos = { lat: center.getLat(), lon: center.getLng() };

        setSelectedCoord(newPos);
        setAdjustMode(false);

        // localStorage 저장
        localStorage.setItem("savedCoord", JSON.stringify(newPos));

        if (myMarkerRef.current) {
            myMarkerRef.current.setPosition(
                new window.kakao.maps.LatLng(newPos.lat, newPos.lon)
            );
        }

        fetchWeather(newPos.lat, newPos.lon);
    };

    const heatWarning = weather && (weather.temp >= 33 || weather.feels >= 33);

    return (
        <div className="map-container">
            <div ref={mapDivRef} className="map-area" />

            {/* ✅ 날씨 카드 */}
            <div className="weather-card">
                {weather ? (
                    <>
                        <div className="weather-top">
                            {weather.icon ? (
                                <img alt={weather.desc} width={36} height={36}
                                    src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} />
                            ) : <span>⛅</span>}
                            <div className="temp">{weather.temp}°</div>
                        </div>
                        <div className="air-row"><span>미세</span><b style={{ color: pmGrade(air?.pm10, "pm10").color }}>{pmGrade(air?.pm10, "pm10").label}</b></div>
                        <div className="air-row"><span>초미세</span><b style={{ color: pmGrade(air?.pm25, "pm25").color }}>{pmGrade(air?.pm25, "pm25").label}</b></div>
                        {heatWarning && <div className="heat-warning">폭염 주의보</div>}
                    </>
                ) : <div>날씨 불러오는 중…</div>}
            </div>

            {/* ✅ 줌바 */}
            <div className="zoom-bar">
                <div onClick={zoomIn}>＋</div>
                <div className="zoom-track"><div ref={zoomFillRef} className="zoom-fill" /></div>
                <div onClick={zoomOut}>－</div>
                <div ref={zoomLabelRef} className="zoom-label">Lv -</div>
            </div>

            {/* ✅ 내 위치 버튼 */}
            <button onClick={goMyPosition} className="my-location-btn">📍</button>

            {/* ✅ 위치 조정 버튼 (기본 모드에서 표시) */}
            {!adjustMode && (
                <button onClick={() => setAdjustMode(true)} className="adjust-btn">
                    위치 조정
                </button>
            )}

            {/* ✅ 조정 모드일 때 지도 중앙에 빨간 핀 */}
            {adjustMode && (
                <div className="adjust-pin">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"
                        viewBox="0 0 24 24" fill="#ef4444">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 
            7-13c0-3.87-3.13-7-7-7zM12 11.5c-1.38 
            0-2.5-1.12-2.5-2.5s1.12-2.5 
            2.5-2.5 2.5 1.12 2.5 2.5-1.12 
            2.5-2.5 2.5z"/>
                    </svg>
                </div>
            )}

            {/* ✅ 저장 버튼 (조정 모드일 때만) */}
            {adjustMode && (
                <button onClick={saveMyPosition} className="save-btn">
                    저장
                </button>
            )}
        </div>
    );
}

function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
