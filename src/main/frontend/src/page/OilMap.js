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

// ★ 즐겨찾기(및 내 위치) 별 마커 이미지 (캐시)
const getStarMarkerImage = (kakao) => {
    if (markerImgCache.star) return markerImgCache.star;
    const img = new kakao.maps.MarkerImage(
        "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
        new kakao.maps.Size(24, 35),
        { offset: new kakao.maps.Point(12, 35) }
    );
    markerImgCache.star = img;
    return img;
};

const MY_LOC_ICON_URL = process.env.PUBLIC_URL
    ? `${process.env.PUBLIC_URL}/images/location3.png`
    : "/images/location3.png";

const getMyLocationImage = (kakao) => {
    if (markerImgCache.my) return markerImgCache.my;
    // 아이콘 표시 크기와 기준점(오프셋) — 원형이면 중앙(22,22)이 자연스럽습니다.
    const size = new kakao.maps.Size(36, 36);
    const offset = new kakao.maps.Point(22, 22); // 핀꼬리처럼 아래끝이 좌표면 (22,44)로
    const img = new kakao.maps.MarkerImage(MY_LOC_ICON_URL, size, { offset });
    markerImgCache.my = img;
    return img;
};

// ★ 즐겨찾기 상태에 따라 마커 이미지/우선순위 바꾸기
const setMarkerIconByFav = (marker, isCharge, isFav, kakao) => {
    const img = isFav
        ? getStarMarkerImage(kakao)
        : getMarkerImage(isCharge ? "ev" : "oil", kakao);
    marker.setImage(img);
    marker.setZIndex(isFav ? 7 : 5);
};
//// 즐겨찾기
// ✅ html escape (파일 하단의 escapeHtml가 이미 있다면, 아래 것으로 교체하고 하단 것은 삭제)
const escapeHtml = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

// ✅ 즐겨찾기/로그인 관련 (RouteMap 동일 로직의 경량 버전)
const FAV_KEY = "route.favorites.v1";

const parseJwt = (t = "") => {
    try {
        const b64 = t.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/") || "";
        return JSON.parse(atob(b64)) || {};
    } catch { return {}; }
};
const isTokenAlive = (t) => {
    if (!t) return false;
    const { exp } = parseJwt(t);
    return typeof exp === "number" ? Date.now() < exp * 1000 : true;
};
const getToken = () => localStorage.getItem("token") || "";
const isLoggedIn = () => isTokenAlive(getToken());

// ✅ 즐겨찾기 키 만들기 (오일/EV 공용)
const coordKey = (lat, lng) => `${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`;
const favKeyOf = (station, mode) => {
    if (!station) return "";
    if (mode === "oil") {
        const uni = station?.stationId || station?.uni || station?.UNI_CD;
        return uni ? `oil:${uni}` : `oil@${coordKey(station.lat ?? station.LAT, station.lon ?? station.LON ?? station.lng)}`;
    }
    // mode === 'ev'
    const sid = station?.statId || station?.STAT_ID || "";
    return sid ? `ev:${String(sid)}` : `ev@${coordKey(station.lat ?? station.LAT, station.lon ?? station.LON ?? station.lng)}`;
};
////
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

    const [reviewModal, setReviewModal] = useState({ open: false, mode: null, station: null });

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

    ///////////////////모달 유틸////////////////////
    // ... 기존 refs/state ...

    // ✅ 즐겨찾기 상태 (서버 동기화 + 로컬 캐시)
    const [favSet, setFavSet] = useState(() => {
        try {
            const arr = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
            return new Set(Array.isArray(arr) ? arr : []);
        } catch { return new Set(); }
    });
    const favSetRef = useRef(favSet);
    useEffect(() => { favSetRef.current = favSet; }, [favSet]);

    // 최초 1회 서버 → 로컬 동기화 (로그인 시)
    useEffect(() => {
        (async () => {
            try {
                const token = getToken();
                if (!isTokenAlive(token)) return;
                const res = await fetch("/api/route/favs", { headers: { Authorization: `Bearer ${token}` } });
                if (!res.ok) return;
                const json = await res.json();
                const keys = (json.items || []).map((it) => it.key);
                setFavSet(new Set(keys));
                localStorage.setItem(FAV_KEY, JSON.stringify(keys));
            } catch { /* ignore */ }
        })();
    }, []);

    // 즐겨찾기 토글 (optimistic 업데이트, 실패 시 롤백)
    const toggleFavForStation = async (station, mode) => {
        const key = favKeyOf(station, mode);
        if (!key) return;
        if (!isLoggedIn()) { alert("로그인 후 이용 가능합니다."); return; }

        const wasFav = favSetRef.current?.has(key);
        // optimistic
        setFavSet(prev => {
            const next = new Set(prev);
            wasFav ? next.delete(key) : next.add(key);
            localStorage.setItem(FAV_KEY, JSON.stringify([...next]));
            return next;
        });

        try {
            const token = getToken();
            const method = wasFav ? "DELETE" : "POST";
            const url = method === "POST" ? "/api/route/favs" : `/api/route/favs/${encodeURIComponent(key)}`;
            const body = method === "POST"
                ? JSON.stringify({ key, label: station?.statNm || station?.name || "", lat: station?.lat, lng: station?.lon ?? station?.lng, mode })
                : undefined;

            const r = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body,
            });
            if (!r.ok) throw new Error("즐겨찾기 동기화 실패");
        } catch (e) {
            // rollback
            setFavSet(prev => {
                const rollback = new Set(prev);
                wasFav ? rollback.add(key) : rollback.delete(key);
                localStorage.setItem(FAV_KEY, JSON.stringify([...rollback]));
                return rollback;
            });
            alert("즐겨찾기 저장에 실패했습니다.");
        }
    };
    /////


    // ✅ 줌바 ...

    // 인포윈도우에 문자열 HTML 넣고, 마운트 직후 DOM 접근 콜백 실행
    const setInfoHtml = (html, anchorMarker, onAfterMount) => {
        const box = document.createElement("div");
        box.innerHTML = html;
        infoRef.current.setContent(box);
        infoRef.current.open(mapRef.current, anchorMarker);
        if (typeof onAfterMount === "function") onAfterMount(box);
    };

    // EV 헬퍼들 (상태/타입/시각)
    const chargerTypeName = (code = "") =>
    ({
        "01": "DC차데모", "02": "AC완속", "03": "DC차데모+AC3상",
        "04": "DC콤보", "05": "DC차데모+DC콤보", "06": "DC차데모+AC3상+DC콤보",
        "07": "AC3상", "08": "DC콤보+AC3상", "09": "DC콤보(초고속)", "10": "기타",
    }[String(code).padStart(2, "0")] || String(code));

    const statusText = (s) =>
        ({ "1": "통신이상", "2": "충전가능", "3": "충전중", "4": "운영중지", "5": "점검중", "9": "미확인", "0": "미확인" }[String(s ?? "9")] || "미확인");

    // ↺ 이걸로 교체
    const parseTs = (v) => {
        const s = String(v ?? "").trim();
        if (!s) return null;

        // ① yyyymmddHHMMSS (예: 20250904125524)
        let m = s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
        if (m) return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);

        // ② yyyymmddHHMM (초 없음)
        m = s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/);
        if (m) return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], 0);

        // ③ yyyymmdd (날짜만)
        m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
        if (m) return new Date(+m[1], +m[2] - 1, +m[3]);

        // ④ 'YYYY-MM-DD HH:mm:ss' / 'YYYY/MM/DD HH:mm:ss' 등
        const d = new Date(s.replace(/\//g, "-").replace(" ", "T"));
        return isNaN(d) ? null : d;
    };

    const fmtTs = (v, { seconds = false } = {}) => {
        const d = parseTs(v);
        if (!d) return String(v ?? "");

        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} `
            + `${pad(d.getHours())}:${pad(d.getMinutes())}`
            + (seconds ? `:${pad(d.getSeconds())}` : "");
    };


    // /api/route/ev/status/by-station 응답 정규화
    const normalizeEvStatusList = (json) => {
        const raw = json?.items?.item ?? json?.items ?? json?.list ?? json?.data ?? [];
        const arr = Array.isArray(raw) ? raw : [raw].filter(Boolean);
        return arr.map(o => ({
            chgerId: o.chgerId ?? o.CHGER_ID ?? o.chargerId ?? "-",
            type: o.chgerType ?? o.TYPE ?? o.type ?? "",
            status: o.stat ?? o.STATUS ?? o.status ?? "9",
            lastTs: o.statUpdDt ?? o.stat_upd_dt ?? o.updateTime ??
                o.lastTs ?? o.UPDT_DT ?? o.LAST_TS ?? o.UPDATE_DT ?? "",
        }));
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

            const markerImage = getMyLocationImage(window.kakao);

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
            // const markerImage = getMarkerImage(isCharge ? "ev" : "oil", window.kakao);
            const favKey = favKeyOf(s, isCharge ? "ev" : "oil");
            const isFav = !!(favKey && favSetRef.current?.has(favKey));
            const markerImage = isFav
                ? getStarMarkerImage(window.kakao)
                : getMarkerImage(isCharge ? "ev" : "oil", window.kakao);

            // const marker = new window.kakao.maps.Marker({ position: pos, zIndex: 5, image: markerImage });
            const marker = new window.kakao.maps.Marker({
                position: pos,
                zIndex: isFav ? 7 : 5,
                image: markerImage
            });
            marker.setMap(mapRef.current);
            newMarkers.push(marker);
            bounds.extend(pos);

            window.kakao.maps.event.addListener(marker, "click", async () => {
                if (isCharge) {
                    // ───────────────── EV 인포윈도우 ─────────────────
                    const mode = "ev";
                    const favKey = favKeyOf(s, mode);
                    const starredNow = !!(favKey && favSetRef.current?.has(favKey));
                    const favBtnHtml = (on) => `
      <button class="fav-btn ${on ? "on" : ""}"
              ${isLoggedIn() ? "" : "disabled"}
              title="${isLoggedIn() ? (on ? "즐겨찾기 해제" : "즐겨찾기 추가") : "로그인 필요"}"
              style="border:none;background:transparent;font-size:18px;line-height:1;${isLoggedIn() ? "cursor:pointer;" : "cursor:not-allowed;opacity:.5"}">
        ${on ? "★" : "☆"}
      </button>`;

                    // 1) 즉시 기본 화면
                    const baseHtml = `
      <div class="info-window">
        <div style="display:flex;align-items:center;gap:8px;justify-content:space-between;">
          <div style="flex:1;min-width:0;">
            <div class="info-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              ${escapeHtml(s.statNm ?? "충전소")}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
        ${favBtnHtml(starredNow)}
        <button class="review-btn" style="border:1px solid #e5e7eb;background:#fff;padding:4px 8px;border-radius:8px;font-size:12px;cursor:pointer">리뷰보기</button>
      </div>
        </div>
        ${s.addr ? `<div class="info-row">📍 ${escapeHtml(s.addr)}</div>` : ""}
        ${s.useTime ? `<div class="info-row">⏰ ${escapeHtml(s.useTime)}</div>` : ""}
        ${s.busiNm ? `<div class="info-row">👤 운영사: ${escapeHtml(s.busiNm)}</div>` : ""}
        <div class="info-row" id="ev-status-line">상태 불러오는 중…</div>
      </div>`.trim();

                    setInfoHtml(baseHtml, marker, (root) => {
                        const btn = root.querySelector(".fav-btn");
                        if (!btn || btn.disabled) { /* 비로그인시 즐겨찾기 비활성 */ }
                        else {
                            btn.addEventListener("click", async (e) => {
                                e.stopPropagation();
                                await toggleFavForStation(s, "ev");
                                const on = favSetRef.current?.has(favKeyOf(s, "ev"));
                                btn.textContent = on ? "★" : "☆";
                                btn.classList.toggle("on", on);
                                setMarkerIconByFav(marker, /*isCharge=*/true, on, window.kakao);
                            });
                        }

                        const rvBtn = root.querySelector(".review-btn");
                        if (rvBtn) {
                            rvBtn.addEventListener("click", (e) => {
                                e.stopPropagation();
                                setReviewModal({ open: true, mode: "ev", station: s });
                            });
                        }
                    });

                    // 2) 상태 비동기 로딩 → 갱신
                    try {
                        const statId = String(s.statId || "");
                        if (!statId) throw new Error("STAT_ID 없음");
                        const url = `/api/route/ev/status/by-station?statIds=${encodeURIComponent(statId)}`;
                        const j = await (await fetch(url)).json();
                        const list = normalizeEvStatusList(j);

                        const available = list.filter(c => String(c.status) === "2").length;
                        const hasDc = list.some(c => ["01", "03", "04", "05", "06", "08", "09"].includes(String(c.type).padStart(2, "0")));
                        const hasAc = list.some(c => ["02", "03", "06", "07", "08"].includes(String(c.type).padStart(2, "0")));
                        let latest = "";
                        for (const c of list) {
                            const t = String(c.lastTs || "");
                            if (!t) continue;
                            if (!latest || new Date(t.replace(" ", "T")) > new Date(latest.replace(" ", "T"))) latest = t;
                        }

                        const statusPill = (s) => {
                            const code = String(s ?? "9");
                            let bg = "#999";
                            if (code === "2") bg = "#27ae60";
                            else if (code === "3") bg = "#f59e0b";
                            else if (code === "5") bg = "#e74c3c";
                            else if (["1", "4", "9", "0"].includes(code)) bg = "#7f8c8d";
                            return `<span style="display:inline-block;padding:3px 8px;border-radius:999px;font-size:12px;color:#fff;background:${bg};">${escapeHtml(statusText(code))}</span>`;
                        };

                        const rowsHtml = list.map(c => `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin:6px 0;padding:8px 10px;border:1px solid #f0f0f0;border-radius:10px;background:#fafafa;">
          <div style="display:flex;align-items:center;gap:10px;min-width:0">
            <span style="display:inline-block;min-width:44px;text-align:center;font-weight:700;color:#444;background:#fff;border:1px solid #eaeaea;padding:4px 8px;border-radius:8px;">#${escapeHtml(c.chgerId)}</span>
            <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#666;font-size:12px;">${escapeHtml(chargerTypeName(c.type) || "-")}</span>
          </div>
          <div>${statusPill(c.status)}</div>
        </div>
      `).join("");

                        const nowStar = !!(favKey && favSetRef.current?.has(favKey));
                        const html2 = `
        <div class="info-window">
          <div style="display:flex;align-items:center;gap:8px;justify-content:space-between;">
            <div style="flex:1;min-width:0;">
              <div class="info-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${escapeHtml(s.statNm ?? "충전소")}
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
        ${favBtnHtml(nowStar)}
        <button class="review-btn" style="border:1px solid #e5e7eb;background:#fff;padding:4px 8px;border-radius:8px;font-size:12px;cursor:pointer">리뷰보기</button>
      </div>
          </div>
          ${s.addr ? `<div class="info-row">📍 ${escapeHtml(s.addr)}</div>` : ""}
          ${s.useTime ? `<div class="info-row">⏰ ${escapeHtml(s.useTime)}</div>` : ""}
          ${s.busiNm ? `<div class="info-row">👤 운영사: ${escapeHtml(s.busiNm)}</div>` : ""}
          <div class="info-flags">
            <span class="flag ${available ? "on" : ""}">충전가능 ${available}기</span>
            ${hasDc ? `<span class="flag on">⚡ 급속(DC)</span>` : `<span class="flag">급속 없음</span>`}
            ${hasAc ? `<span class="flag on">🔌 완속(AC)</span>` : `<span class="flag">완속 없음</span>`}
          </div>
          <div class="info-row"><strong>업데이트</strong>: ${latest ? fmtTs(latest) : "-"}</div>
          ${rowsHtml ? `
            <div style="margin-top:8px">
              <div style="font-size:12px;color:#666;margin:2px 0 6px">충전 포트 상세</div>
              <div style="max-height:200px;overflow:auto">${rowsHtml}</div>
            </div>` : ""}
        </div>`.trim();

                        setInfoHtml(html2, marker, (root) => {
                            const btn = root.querySelector(".fav-btn");
                            if (!btn || btn.disabled) { /* skip */ }
                            else {
                                btn.addEventListener("click", async (e) => {
                                    e.stopPropagation();
                                    await toggleFavForStation(s, "ev");
                                    const on = favSetRef.current?.has(favKeyOf(s, "ev"));
                                    btn.textContent = on ? "★" : "☆";
                                    btn.classList.toggle("on", on);
                                    setMarkerIconByFav(marker, /*isCharge=*/true, on, window.kakao);
                                });
                            }

                            const rvBtn = root.querySelector(".review-btn");
                            if (rvBtn) {
                                rvBtn.addEventListener("click", (e) => {
                                    e.stopPropagation();
                                    setReviewModal({ open: true, mode: "ev", station: s });
                                });
                            }
                        });
                    } catch (e) {
                        const fail = `
        <div class="info-window">
          <div class="info-title">${escapeHtml(s.statNm ?? "충전소")}</div>
          ${s.addr ? `<div class="info-row">📍 ${escapeHtml(s.addr)}</div>` : ""}
          <div class="info-row" style="color:#c0392b">⚠️ 상태 조회 실패</div>
        </div>`.trim();
                        setInfoHtml(fail, marker);
                    }
                } else {
                    // ───────────────── 주유소 인포윈도우 ─────────────────
                    const mode = "oil";
                    const stationName = s.name ?? s.NAME ?? "이름없음";
                    const addr = s.address ?? s.ADDR ?? s.ADDRESS ?? "";
                    const brand = s.brand ?? s.BRAND ?? "";

                    const favKey = favKeyOf(s, mode);
                    const starredNow = !!(favKey && favSetRef.current?.has(favKey));
                    const favBtnHtml = (on) => `
      <button class="fav-btn ${on ? "on" : ""}"
              ${isLoggedIn() ? "" : "disabled"}
              title="${isLoggedIn() ? (on ? "즐겨찾기 해제" : "즐겨찾기 추가") : "로그인 필요"}"
              style="border:none;background:transparent;font-size:18px;line-height:1;${isLoggedIn() ? "cursor:pointer;" : "cursor:not-allowed;opacity:.5"}">
        ${on ? "★" : "☆"}
      </button>`;

                    // 1) 가격 로딩 전 화면
                    const baseHtml = `
      <div class="info-window">
        <div class="info-header" style="display:flex;align-items:center;gap:8px;justify-content:space-between;">
          <div style="flex:1;min-width:0;display:flex;align-items:center;gap:8px;">
            <div class="info-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              ${escapeHtml(stationName)}
            </div>
            ${brand ? `<span class="info-badge">${escapeHtml(brand)}</span>` : ""}
          </div>
          <div style="display:flex;align-items:center;gap:6px">
        ${favBtnHtml(starredNow)}
        <button class="review-btn" style="border:1px solid #e5e7eb;background:#fff;padding:4px 8px;border-radius:8px;font-size:12px;cursor:pointer">리뷰보기</button>
      </div>
        </div>
        ${addr ? `<div class="info-row">📍 ${escapeHtml(addr)}</div>` : ""}
        <div class="price-box">가격 불러오는 중…</div>
        <div class="info-flags">
          ${[
                            ["세차장", (s.carWash ?? s.CAR_WASH_YN) === "Y"],
                            ["편의점", (s.store ?? s.CVS_YN ?? s.CONVENIENCE_YN) === "Y"],
                            ["경정비", (s.repair ?? s.MAINT_YN) === "Y"],
                            ["셀프주유소", (s.self ?? s.SELF_YN) === "Y"],
                            ["품질인증주유소", (s.quality ?? s.KPETRO_YN ?? s.QUAL_YN) === "Y"],
                            ["24시간", (s.twentyFour ?? s.OPEN_24H_YN ?? s.TWENTY_FOUR_YN) === "Y"],
                            ["LPG충전소", (s.lpgYN ?? s.LPG_YN) === "Y"],
                        ].map(([k, v]) => `<span class="flag ${v ? "on" : ""}">${k}</span>`).join("")}
        </div>
      </div>`.trim();

                    setInfoHtml(baseHtml, marker, (root) => {
                        const btn = root.querySelector(".fav-btn");
                        if (!btn || btn.disabled) { /* skip */ }
                        else {
                            btn.addEventListener("click", async (e) => {
                                e.stopPropagation();
                                await toggleFavForStation(s, "oil");
                                const on = favSetRef.current?.has(favKeyOf(s, "oil"));
                                btn.textContent = on ? "★" : "☆";
                                btn.classList.toggle("on", on);
                                setMarkerIconByFav(marker, /*isCharge=*/false, on, window.kakao);
                            });
                        }

                        const rvBtn = root.querySelector(".review-btn");
                        if (rvBtn) {
                            rvBtn.addEventListener("click", (e) => {
                                e.stopPropagation();
                                setReviewModal({ open: true, mode: "oil", station: s });
                            });
                        }
                    });

                    // 2) 가격 로딩 → 갱신
                    let oilHtml = "";
                    try {
                        const res = await axios.get("/api/oil/price", { params: { id: s.stationId } });
                        const prices = res.data || {};
                        if (prices["휘발유"] || prices["경유"] || prices["LPG"] || prices["등유"]) {
                            const won = (n) => Number(n).toLocaleString();
                            oilHtml = `
          <div class="price-box">
            ${prices["휘발유"] ? `<div class="price-row"><span>⛽ 휘발유</span><b>${won(prices["휘발유"])}원</b></div>` : ""}
            ${prices["경유"] ? `<div class="price-row"><span>🛢 경유</span><b>${won(prices["경유"])}원</b></div>` : ""}
            ${prices["등유"] ? `<div class="price-row"><span>🏠 등유</span><b>${won(prices["등유"])}원</b></div>` : ""}
            ${prices["LPG"] ? `<div class="price-row"><span>🔥 LPG</span><b>${won(prices["LPG"])}원</b></div>` : ""}
          </div>`;
                        } else {
                            oilHtml = `<div class="price-box">⚠️ 가격 등록이 안됐습니다.</div>`;
                        }
                    } catch {
                        oilHtml = `<div class="price-error">⚠️ 가격 정보를 불러오지 못했습니다.</div>`;
                    }

                    const nowStar = !!(favKey && favSetRef.current?.has(favKey));
                    const html = `
      <div class="info-window">
        <div class="info-header" style="display:flex;align-items:center;gap:8px;justify-content:space-between;">
          <div style="flex:1;min-width:0;display:flex;align-items:center;gap:8px;">
            <div class="info-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              ${escapeHtml(stationName)}
            </div>
            ${brand ? `<span class="info-badge">${escapeHtml(brand)}</span>` : ""}
          </div>
          <div style="display:flex;align-items:center;gap:6px">
        ${favBtnHtml(nowStar)}
        <button class="review-btn" style="border:1px solid #e5e7eb;background:#fff;padding:4px 8px;border-radius:8px;font-size:12px;cursor:pointer">리뷰보기</button>
      </div>
        </div>
        ${addr ? `<div class="info-row">📍 ${escapeHtml(addr)}</div>` : ""}
        ${oilHtml}
        <div class="info-flags">
          ${[
                            ["세차장", (s.carWash ?? s.CAR_WASH_YN) === "Y"],
                            ["편의점", (s.store ?? s.CVS_YN ?? s.CONVENIENCE_YN) === "Y"],
                            ["경정비", (s.repair ?? s.MAINT_YN) === "Y"],
                            ["셀프주유소", (s.self ?? s.SELF_YN) === "Y"],
                            ["품질인증주유소", (s.quality ?? s.KPETRO_YN ?? s.QUAL_YN) === "Y"],
                            ["24시간", (s.twentyFour ?? s.OPEN_24H_YN ?? s.TWENTY_FOUR_YN) === "Y"],
                            ["LPG충전소", (s.lpgYN ?? s.LPG_YN) === "Y"],
                        ].map(([k, v]) => `<span class="flag ${v ? "on" : ""}">${k}</span>`).join("")}
        </div>
      </div>`.trim();

                    setInfoHtml(html, marker, (root) => {
                        const btn = root.querySelector(".fav-btn");
                        if (!btn || btn.disabled) { /* skip */ }
                        else {
                            btn.addEventListener("click", async (e) => {
                                e.stopPropagation();
                                await toggleFavForStation(s, "oil");
                                const on = favSetRef.current?.has(favKeyOf(s, "oil"));
                                btn.textContent = on ? "★" : "☆";
                                btn.classList.toggle("on", on);
                                setMarkerIconByFav(marker, /*isCharge=*/false, on, window.kakao);
                            });
                        }

                        const rvBtn = root.querySelector(".review-btn");
                        if (rvBtn) {
                            rvBtn.addEventListener("click", (e) => {
                                e.stopPropagation();
                                setReviewModal({ open: true, mode: "oil", station: s });
                            });
                        }
                    });
                }

                // 포커싱 이동
                mapRef.current.panTo(pos);
            });

        });

        markersRef.current = newMarkers;
        if (newMarkers.length > 0) mapRef.current.setBounds(bounds);
    }, [stations, favSet]);

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

            {/* ✅ 하단 마커색깔 설명 구역 */}
            <div
                style={{
                    position: "fixed",
                    left: "50%",
                    transform: "translateX(-50%)",
                    bottom: 16,
                    zIndex: 1000,
                    pointerEvents: "none", // 맵 드래그 방해 X
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        background: "rgba(255,255,255,.96)",
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        boxShadow: "0 8px 24px rgba(0,0,0,.12)",
                        padding: "8px 12px",
                        pointerEvents: "none", // 클릭 불가(설명 전용)
                        fontSize: 12,
                        color: "#374151",
                    }}
                >
                    <span style={{ color: "#6b7280", marginRight: 4 }}>가격 마커 안내</span>

                    <LegendDot color="#ef4444" />
                    <span>평균보다 +30 이상</span>

                    <LegendDot color="#f59e0b" />
                    <span>±30 구간</span>

                    <LegendDot color="#10b981" />
                    <span>평균보다 -30 이하</span>
                </div>
            </div>

            {/* 리뷰 모달 함수 맨 아래 */}
            <ReviewModal
                open={reviewModal.open}
                mode={reviewModal.mode}
                station={reviewModal.station}
                onClose={() => setReviewModal({ open: false, mode: null, station: null })}
            />

        </div>


    );
}


function LegendDot({ color }) {
    return (
        <span
            style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: color,
                display: "inline-block",
                boxShadow: `0 0 0 2px #fff, 0 0 0 3px ${color}`,
                marginRight: 4,
            }}
        />
    );
}



function ReviewModal({ open, mode, station, onClose }) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  // 작성 상태
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const MAX_LEN = 500;
  const loggedIn = isLoggedIn();

  const getStationId = () =>
    mode === "oil"
      ? (station?.stationId ?? station?.uni ?? station?.UNI_CD ?? "")
      : String(station?.statId ?? station?.STAT_ID ?? "");

  // 목록 불러오기
  useEffect(() => {
    if (!open) return;
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const id = getStationId();
        const res = await fetch(`/api/reviews?mode=${mode}&id=${encodeURIComponent(id)}`);
        const json = await res.json();
        if (!ignore) setItems(Array.isArray(json?.items) ? json.items : (json || []));
      } catch {
        if (!ignore) setItems([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    // 모달 닫히면 폼 초기화
    return () => { ignore = true; setText(""); setRating(0); setSubmitting(false); };
  }, [open, mode, station]);

  const submitReview = async (e) => {
    e?.preventDefault?.();
    if (!loggedIn) { alert("로그인 후 이용 가능합니다."); return; }
    const clean = text.trim();
    if (!clean) { alert("리뷰 내용을 입력해주세요."); return; }

    try {
      setSubmitting(true);
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          mode,
          id: getStationId(),
          text: clean,
          rating: rating || null,
        }),
      });
      if (!res.ok) throw new Error("리뷰 저장 실패");
      const created = await res.json();

      const now = new Date().toISOString();
      setItems(prev => [{
        id: created?.id ?? Math.random().toString(36).slice(2),
        nickname: created?.nickname ?? "나",
        text: created?.text ?? clean,
        rating: (created?.rating ?? rating) || undefined,
        createdAt: created?.createdAt ?? now,
      }, ...prev]);

      setText("");
      setRating(0);
    } catch (err) {
      console.error(err);
      alert("리뷰 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const onKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") submitReview(e);
  };

  if (!open) return null;

  return (
    <div className="review-modal__overlay" onClick={onClose}>
      <div className="review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="review-modal__header">
          <div className="review-modal__title">
            {mode === "oil" ? "주유소" : "충전소"} 리뷰
          </div>
          <button className="review-modal__close" onClick={onClose}>×</button>
        </div>

        <div className="review-modal__sub">
          <b>{mode === "oil" ? (station?.name ?? station?.NAME) : (station?.statNm ?? station?.STAT_NM)}</b>
          <span style={{ marginLeft: 8, color: "#6b7280" }}>{mode}</span>
        </div>

        {/* 작성 영역 */}
        <section className="review-compose">
          <div className="compose-title">리뷰 작성</div>

          <div className="review-field">
            <label className="review-label">평점</label>
            <div className="rating-stars" aria-label="별점 선택">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  className={n <= (rating || 0) ? "on" : ""}
                  onClick={() => loggedIn && setRating(n)}
                  disabled={!loggedIn || submitting}
                  title={`${n}점`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="review-field">
            <label className="review-label">내용</label>
            <textarea
              className="review-textarea"
              placeholder={loggedIn ? "방문 소감, 가격, 친절도 등을 적어주세요. (Ctrl/Cmd + Enter 등록)" : "로그인 후 작성할 수 있습니다."}
              maxLength={MAX_LEN}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={!loggedIn || submitting}
            />
            <div className="review-actions">
              <span className="review-count">{text.length}/{MAX_LEN}</span>
              <button
                className="review-submit"
                onClick={submitReview}
                disabled={!loggedIn || submitting || !rating || !text.trim()}
                title={!loggedIn ? "로그인 필요" : ""}
              >
                {submitting ? "등록 중…" : "리뷰 등록"}
              </button>
            </div>
            {!loggedIn && <div className="review-login-hint">로그인 후 리뷰를 작성할 수 있어요.</div>}
          </div>
        </section>

        {/* 목록 */}
        <div className="review-modal__body">
          {loading ? (
            <div className="review-modal__empty">불러오는 중…</div>
          ) : items.length === 0 ? (
            <div className="review-modal__empty">아직 등록된 리뷰가 없습니다.</div>
          ) : (
            <ul className="review-list">
              {items.map((r, i) => (
                <li key={r.id ?? i} className="review-item">
                  <div className="review-item__top">
                    <div className="review-item__avatar" />
                    <div className="review-item__meta">
                      <b className="review-item__nick">{r.nickname ?? "익명"}</b>
                      <span className="review-item__date">{(r.createdAt ?? "").slice(0, 10)}</span>
                    </div>
                    {r.rating ? (
                      <span className="review-item__rating">
                        {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                      </span>
                    ) : null}
                  </div>
                  <div className="review-item__text">{r.text ?? r.content ?? ""}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

