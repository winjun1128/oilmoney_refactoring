import { useEffect, useRef, useState } from "react";
import axios from "axios";

const APP_KEY = "a0bf78472bc0a1b7bbc6d29dacbebd9a";
const SDK_URL = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${APP_KEY}&autoload=false`;

// ✅ OpenWeather API Key (필수)
const OPENWEATHER_KEY = "0b031132dd9ad99e8aae8aef34f370a8";

// ✅ 오피넷 API KEY
const OPINET_KEY = "F250814713";

// ✅ 내 위치(고정)
const MY_COORD = { lat: 36.8072917, lon: 127.1471611 };

const MIN_LEVEL = 1;
const MAX_LEVEL = 12;

/* ✅ 마커 아이콘 & 라벨  */
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
        type === "ev" ? "#2b8af7" :   // 전기차 충전소 (파랑)
            type === "oil" ? "#ff7f27" :   // 주유소 (주황)
                type === "lpg" ? "#616161" :   // LPG (회색)
                    type === "origin" ? "#7b1fa2" :   // 출발지 (보라)
                        type === "dest" ? "#2e7d32" :   // 목적지 (초록)
                            "#999";       // 기본 회색

    const src = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(pinSvg(color));
    const img = new kakao.maps.MarkerImage(src, new kakao.maps.Size(21, 30), {
        offset: new kakao.maps.Point(14, 40),
    });

    markerImgCache[key] = img;
    return img;
};

export default function OilMap({ stations, handleLocationSearch, isFilterMode }) {
    const mapDivRef = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef([]);
    const myMarkerRef = useRef(null);
    const infoRef = useRef(null);

    // ✅ 처음 로드 시 localStorage 확인 후 지도 중심만 세팅
useEffect(() => {
    const savedCoord = localStorage.getItem("savedCoord");

    if (savedCoord) {
        const coord = JSON.parse(savedCoord);
        setSelectedCoord(coord);

        // 지도 중심 세팅
        if (mapRef.current) {
            mapRef.current.setCenter(new window.kakao.maps.LatLng(coord.lat, coord.lon));
            if (myMarkerRef.current) {
                myMarkerRef.current.setPosition(new window.kakao.maps.LatLng(coord.lat, coord.lon));
            }
        }
    } else {
        // 저장된 좌표가 없으면 기본 좌표만 세팅
        if (mapRef.current) {
            mapRef.current.setCenter(new window.kakao.maps.LatLng(MY_COORD.lat, MY_COORD.lon));
            if (myMarkerRef.current) {
                myMarkerRef.current.setPosition(new window.kakao.maps.LatLng(MY_COORD.lat, MY_COORD.lon));
            }
        }
    }
}, []);




    // ✅ 커스텀 줌바
    const zoomFillRef = useRef(null);
    const zoomLabelRef = useRef(null);

    // ✅ 날씨/대기질 상태
    const [weather, setWeather] = useState(null);
    const [air, setAir] = useState(null);
    const fetchTimerRef = useRef(null);

    // ✅ 내위치 변경
    const [adjustMode, setAdjustMode] = useState(false); // 조정 모드 ON/OFF
    const [selectedCoord, setSelectedCoord] = useState(null);   // 저장된 좌표

    // ✅ 미세/초미세 등급
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

    // ✅ 날씨/대기질 호출
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
            setAir({
                pm10: comp.pm10,
                pm25: comp.pm2_5,
            });
        } catch (e) {
            console.error("weather fetch error", e);
        }
    };

    // ✅ 줌바 업데이트
    const updateZoomBar = () => {
        if (!mapRef.current) return;
        const level = mapRef.current.getLevel();
        if (zoomLabelRef.current) zoomLabelRef.current.textContent = `Lv ${level}`;
        const ratio = Math.max(
            0,
            Math.min(1, (MAX_LEVEL - level) / (MAX_LEVEL - MIN_LEVEL))
        );
        if (zoomFillRef.current) zoomFillRef.current.style.height = `${ratio * 100}%`;
    };

    const zoomIn = () => {
        if (!mapRef.current) return;
        const lv = mapRef.current.getLevel();
        mapRef.current.setLevel(Math.max(MIN_LEVEL, lv - 1));
    };
    const zoomOut = () => {
        if (!mapRef.current) return;
        const lv = mapRef.current.getLevel();
        mapRef.current.setLevel(Math.min(MAX_LEVEL, lv + 1));
    };



    useEffect(() => {
        const init = () => {
            // ✅ localStorage 확인
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

            // ✅ 마커도 savedCoord 기준으로 찍기
            myMarkerRef.current = new window.kakao.maps.Marker({
                position: center,
                image: markerImage,
                map,
            });

            // 날씨도 savedCoord 기준으로 호출
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

    // ✅ 주유소 마커 표시 (반경 필터 적용)
    useEffect(() => {
        if (!window.kakao || !mapRef.current) return;

        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        if (!stations?.length) return;

        const bounds = new window.kakao.maps.LatLngBounds();
        const newMarkers = [];

        const centerCoord = selectedCoord ?? MY_COORD; // 저장된 좌표 우선
        const cLat = centerCoord.lat;
        const cLng = centerCoord.lon;

        stations.forEach((s) => {
            const lat = Number(s.lat ?? s.LAT);
            const lon = Number(s.lon ?? s.LON ?? s.lng); // ✅ 충전소는 lng 필드 사용

            if (Number.isNaN(lat) || Number.isNaN(lon)) return;

            const pos = new window.kakao.maps.LatLng(lat, lon);
            const isCharge = !!s.statId; // ✅ 충전소 여부 구분

            // ✅ 현재 중심 좌표
            const centerCoord = selectedCoord ?? MY_COORD;

            // ✅ 마커 이미지 (충전소: 초록색, 주유소: 기본)
            const markerImage = getMarkerImage(
                isCharge ? "ev" : "oil", // 충전소 = ev, 주유소 = oil
                window.kakao
            );

            const marker = new window.kakao.maps.Marker({
                position: pos,
                zIndex: 5,
                image: markerImage,
            });
            marker.setMap(mapRef.current);
            newMarkers.push(marker);
            bounds.extend(pos);



            window.kakao.maps.event.addListener(marker, "click", async () => {
                if (isCharge) {
                    // ⚡ 충전소 인포윈도우
                    const html = `
                <div style="min-width:240px;max-width:280px;background:#fff;border-radius:12px;
                box-shadow:0 6px 18px rgba(0,0,0,.12);padding:12px 14px;border:1px solid #e5e7eb;
                font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans KR',Arial,sans-serif;">
                <div style="font-weight:800;font-size:15px;line-height:1.2;color:#111827;margin-bottom:6px;">
                ${escapeHtml(s.statNm ?? "충전소")}
                </div>
                ${s.addr ? `<div style="color:#4b5563;font-size:12px;margin:4px 0;">📍 ${escapeHtml(s.addr)}</div>` : ""}
                ${s.useTime ? `<div style="color:#374151;font-size:12px;margin:4px 0;">⏰ ${escapeHtml(s.useTime)}</div>` : ""}
                ${s.busiNm ? `<div style="color:#374151;font-size:12px;margin:4px 0;">👤 운영사: ${escapeHtml(s.busiNm)}</div>` : ""}
                </div>
            `;
                    infoRef.current.setContent(html);
                } else {
                    // 🛢️ 주유소 인포윈도우
                    const name = s.name ?? s.NAME ?? "이름없음";
                    const addr = s.address ?? s.ADDR ?? s.ADDRESS ?? "";
                    const brand = s.brand ?? s.BRAND ?? "";
                    const price = s.price ?? s.PRICE ?? "";

                    // 🛢️ 주유소 가격 가져오기 (백엔드 호출)
                    let oilHtml = "";
                    try {
                        const res = await axios.get("/api/oil/price", {
                            params: { id: s.stationId },
                        });
                        const prices = res.data;

                        // ✅ 가격 데이터가 있는지 확인
                        if (prices["휘발유"] || prices["경유"] || prices["LPG"] || prices["등유"]) {
                            oilHtml = `
    <div style="width:240px;display:flex;flex-direction:column;gap:4px;margin:8px 0;padding:8px;
                border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb;">
        ${prices["휘발유"] ? `
        <div style="display:flex;justify-content:space-between;font-size:13px;color:#111827;">
            <span>⛽ 휘발유</span>
            <b style="color:#dc2626;font-weight:700">${prices["휘발유"]}원</b>
        </div>` : ""}

        ${prices["경유"] ? `
        <div style="display:flex;justify-content:space-between;font-size:13px;color:#111827;">
            <span>🛢 경유</span>
            <b style="color:#2563eb;font-weight:700">${prices["경유"]}원</b>
        </div>` : ""}

        ${prices["등유"] ? `
        <div style="display:flex;justify-content:space-between;font-size:13px;color:#111827;">
            <span>🏠 등유</span>
            <b style="color:#9333ea;font-weight:700">${prices["등유"]}원</b>
        </div>` : ""}

        ${prices["LPG"] ? `
        <div style="display:flex;justify-content:space-between;font-size:13px;color:#111827;">
            <span>🔥 LPG</span>
            <b style="color:#059669;font-weight:700">${prices["LPG"]}원</b>
        </div>` : ""}
    </div>`;
                        } else {
                            // ✅ 값이 비어있을 때
                            oilHtml = `<div style="display:flex;flex-direction:column;gap:4px;margin:8px 0;padding:8px;
                border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb;">
        ⚠️ 가격 등록이 안됐습니다.
    </div>`;
                        }
                    } catch (err) {
                        console.error("가격 불러오기 실패", err);
                        // ✅ API 호출 자체가 실패했을 때
                        oilHtml = `<div style="color:#ef4444;font-size:13px;margin-top:6px;">
                            ⚠️ 가격 정보를 불러오지 못했습니다.
                        </div>`;
                    }

                    const flags = {
                        carWash: (s.carWash ?? s.CAR_WASH_YN) === "Y",
                        store: (s.store ?? s.CVS_YN ?? s.CONVENIENCE_YN) === "Y",
                        repair: (s.repair ?? s.MAINT_YN) === "Y",
                        self: (s.self ?? s.SELF_YN) === "Y",
                        quality: (s.quality ?? s.KPETRO_YN ?? s.QUAL_YN) === "Y",
                        twentyFour: (s.twentyFour ?? s.OPEN_24H_YN ?? s.TWENTY_FOUR_YN) === "Y",
                        lpg: (s.lpgYN ?? s.LPG_YN) === "Y",
                    };

                    const badge = (label, on) =>
                        `<span style="display:inline-block;padding:5px 10px;margin:4px 6px 0 0;
      border-radius:999px;font-size:12px;font-weight:600;
      border:1px solid ${on ? '#1d4ed8' : '#d1d5db'};
      background:${on ? '#2563eb' : '#f3f4f6'};
      color:${on ? '#fff' : '#374151'};">${label}</span>`;

                    const html = `
    <div style="min-width:240px;max-width:270px;background:#fff;border-radius:12px;
      box-shadow:0 6px 18px rgba(0,0,0,.12);padding:12px 14px;border:1px solid #e5e7eb;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans KR',Arial,sans-serif;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
        <div style="font-weight:800;font-size:15px;line-height:1.2;color:#111827;">${escapeHtml(name)}</div>
        ${brand ? `<span style="padding:4px 8px;border-radius:8px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:700;border:1px solid #c7d2fe">${escapeHtml(brand)}</span>` : ""}
      </div>
      ${addr ? `<div style="display:flex;gap:8px;color:#4b5563;font-size:12px;margin:4px 0;"><span>📍</span><span style="flex:1">${escapeHtml(addr)}</span></div>` : ""}
      ${price ? `<div style="display:flex;gap:8px;color:#374151;font-size:13px;margin:4px 0;"><span>⛽</span><span>가격: <b style="font-weight:800">${escapeHtml(String(price))}</b></span></div>` : ""}
      <div style="height:1px;background:linear-gradient(90deg,#fff,#e5e7eb,#fff);margin:10px 0;"></div>
      ${oilHtml}
      <div style="display:flex;flex-wrap:wrap;">
        ${[
                            badge("세차장", flags.carWash),
                            badge("편의점", flags.store),
                            badge("경정비", flags.repair),
                            badge("셀프주유소", flags.self),
                            badge("품질인증주유소", flags.quality),
                            badge("24시운영", flags.twentyFour),
                            badge("LPG 충전소", flags.lpg),
                        ].join("")}
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

    // ✅ 버튼 클릭 → 내 위치로 이동
    const goMyPosition = () => {
        if (!window.kakao || !mapRef.current) return;

        // ✅ 저장된 좌표(localStorage) 확인
        const savedCoord = localStorage.getItem("savedCoord");
        let target;

        if (savedCoord) {
            target = JSON.parse(savedCoord); // 저장된 좌표 우선
        } else {
            target = MY_COORD; // 없으면 기본 좌표
        }

        const pos = new window.kakao.maps.LatLng(target.lat, target.lon);


        mapRef.current.setLevel(3);
        mapRef.current.panTo(pos);

        if (myMarkerRef.current) {
            myMarkerRef.current.setPosition(pos);
        }

        fetchWeather(target.lat, target.lon);
    };

    const heatWarning = weather && (weather.temp >= 33 || weather.feels >= 33);

    return (
        <div style={{ position: "relative", width: "100%", height: "100vh" }}>
            {/* ✅ 지도 */}
            <div ref={mapDivRef} style={{ position: "absolute", inset: 0 }} />

            {/* ✅ 조정 모드일 때 지도 중심에 핀 아이콘 */}
            {adjustMode && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -100%)",
                        zIndex: 70,
                        pointerEvents: "none"
                    }}
                >
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

            {/* ✅ 좌상단 날씨 카드 */}
            <div
                style={{
                    position: "absolute",
                    right: 16,
                    top: 16,
                    zIndex: 50,
                    width: 180,
                    background: "#fff",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 6px 16px rgba(0,0,0,.12)",
                    padding: "8px 10px",
                    fontFamily:
                        "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans KR',Arial,'Apple SD Gothic Neo',sans-serif",
                }}
            >
                {weather ? (
                    <>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {weather.icon ? (
                                <img
                                    alt={weather.desc || "weather"}
                                    width={36}
                                    height={36}
                                    src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                                    style={{ transform: "translateY(-2px)" }}
                                />
                            ) : (
                                <span>⛅</span>
                            )}
                            <div style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>
                                {weather.temp}°
                            </div>
                        </div>

                        {/* 미세/초미세 */}
                        <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: "#6b7280" }}>미세</span>
                            <span
                                style={{
                                    fontSize: 12,
                                    fontWeight: 800,
                                    color: pmGrade(air?.pm10, "pm10").color,
                                }}
                            >
                                {pmGrade(air?.pm10, "pm10").label}
                            </span>
                        </div>
                        <div style={{ marginTop: 2, display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: "#6b7280" }}>초미세</span>
                            <span
                                style={{
                                    fontSize: 12,
                                    fontWeight: 800,
                                    color: pmGrade(air?.pm25, "pm25").color,
                                }}
                            >
                                {pmGrade(air?.pm25, "pm25").label}
                            </span>
                        </div>

                        {/* 경보 배너 */}
                        {heatWarning && (
                            <div
                                style={{
                                    marginTop: 8,
                                    background: "#ef4444",
                                    color: "#fff",
                                    textAlign: "center",
                                    padding: "4px 6px",
                                    fontSize: 12,
                                    fontWeight: 900,
                                    borderRadius: 6,
                                }}
                            >
                                폭염 주의보
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ fontSize: 12, color: "#6b7280" }}>날씨 불러오는 중…</div>
                )}
            </div>

            {/* ✅ 커스텀 줌 바 (원래 코드 유지) */}
            <div
                style={{
                    position: "absolute",
                    right: 16,
                    bottom: 16,
                    width: 25,
                    height: 160,
                    borderRadius: 12,
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 6px 16px rgba(0,0,0,.12)",
                    padding: 8,
                    zIndex: 50,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    userSelect: "none",
                }}
            >
                <div
                    onClick={zoomIn}
                    style={{ fontSize: 16, lineHeight: 1, color: "#111827", cursor: "pointer" }}
                    title="확대"
                >
                    ＋
                </div>
                <div
                    style={{
                        position: "relative",
                        width: 10,
                        flex: 1,
                        borderRadius: 999,
                        background: "#eef2f7",
                        overflow: "hidden",
                    }}
                    aria-label="zoom-bar"
                >
                    <div
                        ref={zoomFillRef}
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: "0%",
                            background: "#2563eb",
                            transition: "height .15s ease",
                        }}
                    />
                </div>
                <div
                    onClick={zoomOut}
                    style={{ fontSize: 16, lineHeight: 1, color: "#111827", cursor: "pointer" }}
                    title="축소"
                >
                    －
                </div>
                <div
                    ref={zoomLabelRef}
                    style={{ marginTop: 2, fontSize: 11, fontWeight: 700, color: "#374151" }}
                >
                    Lv -
                </div>
            </div>

            {/* ✅ 위치 조정 모드 버튼 */}
            {!adjustMode && (
                <button
                    onClick={() => setAdjustMode(true)}
                    style={{
                        position: "absolute",
                        right: 16,
                        bottom: 250,
                        zIndex: 70,
                        padding: "6px 12px",
                        background: "#2563eb",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer"
                    }}
                >
                    위치 조정
                </button>
            )}

            {/* ✅ 저장 버튼 (조정 모드일 때만) */}
            {adjustMode && (
                <button
                    onClick={() => {
                        const center = mapRef.current.getCenter();
                        const newPos = { lat: center.getLat(), lon: center.getLng() };

                        setSelectedCoord(newPos);
                        setAdjustMode(false);

                        // ✅ localStorage에 좌표 저장
                        localStorage.setItem("savedCoord", JSON.stringify(newPos));

                        if (myMarkerRef.current) {
                            myMarkerRef.current.setPosition(
                                new window.kakao.maps.LatLng(newPos.lat, newPos.lon)
                            );
                        }

                        fetchWeather(newPos.lat, newPos.lon);

                        // ✅ 저장하자마자 주변 주유소 검색 실행
                        handleLocationSearch(newPos);
                    }}
                    style={{
                        position: "absolute",
                        right: 16,
                        bottom: 250,
                        zIndex: 70,
                        padding: "6px 12px",
                        background: "#22c55e",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer"
                    }}
                >
                    저장
                </button>
            )}

            {/* ✅ 내 위치 버튼 */}
            <button
                onClick={goMyPosition}
                aria-label="내 위치로 이동"
                style={{
                    position: "absolute",
                    right: 16,
                    bottom: 200,
                    zIndex: 50,
                    width: 43,
                    height: 40,
                    background: "#fff",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "background 0.2s",
                }}
                onMouseDown={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                onMouseUp={(e) => (e.currentTarget.style.background = "#fff")}
            >
                {/* ✅ 사람 아이콘 (SVG) */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: "#374151" }}
                >
                    <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z" />
                </svg>
            </button>


        </div>
    );
}

// 간단 XSS 방지
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
