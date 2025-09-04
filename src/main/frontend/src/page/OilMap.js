import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./OilMap.css"; // ✅ 외부 스타일 연결


const APP_KEY = "a0bf78472bc0a1b7bbc6d29dacbebd9a";
const SDK_URL = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${APP_KEY}&autoload=false&libraries=services`;

const OPENWEATHER_KEY = "0b031132dd9ad99e8aae8aef34f370a8";
const MY_COORD = { lat: 36.8072917, lon: 127.1471611 };

const MIN_LEVEL = 1;
const MAX_LEVEL = 12;

const PRICE_DIFF_THRESH = 30;                     // 임계값(원)
const BASIS_KEY = "route.priceBasis.v1";



// JSON→Map 정규화 (RouteMap의 함수 그대로)
const normalizeOilAvgMap = (json) => {
  const raw = json?.response?.body?.items ?? [];
  const arr = Array.isArray(raw) ? raw : [raw];
  const map = new Map();
  for (const o of arr) {
    const uni = String(o.UNI_CD || o.uni || "");
    if (!uni) continue;
    map.set(uni, {
      prices: o.PRICES || {},  // 최신 개별가격(있으면)
      avg:    o.AVG    || {},  // 시·군 평균
      diff:   o.DIFF   || {},  // (개별가격 - 시·군 평균)
      updatedAt: o.UPDATED_AT || null,
      sigunCd:   o.SIGUN_CD   || null,
    });
  }
  return map;
};

// 유종별로 마커 타입 결정
const markerTypeByBasis = (station, cat, basis) => {
  const d = Number((station?.diff || {})[basis]);
  if (!Number.isFinite(d)) return cat;
  if (d <= -PRICE_DIFF_THRESH) return "oil-cheap";
  if (d >=  PRICE_DIFF_THRESH) return "oil-exp";
  return cat;
};

// 보기용
const basisLabel = (k) => ({ B027:"휘발유", D047:"경유", K015:"LPG" }[k] || k);
const fmtWon = (v) => {
  const n = Number(String(v ?? "").replace(/,/g,"").trim());
  return Number.isFinite(n) ? n.toLocaleString() : "-";
};
const oilAvgPairPanel = (gs, { lpgOnly=false } = {}) => {
  const row = (label, avg, diff) => {
    const hasAvg  = Number.isFinite(avg);
    const hasDiff = Number.isFinite(diff);
    const sign = hasDiff ? (diff > 0 ? "+" : "") : "";
    const diffColor = hasDiff ? (diff < 0 ? "#2ecc71" : diff > 0 ? "#e74c3c" : "#999") : "#999";
    return `<div style="display:flex;justify-content:space-between;gap:8px;margin:2px 0;">
      <span>${label}</span>
      <span>${hasAvg ? `${fmtWon(avg)}원` : "-"}${
        hasDiff ? `<em style="color:${diffColor};font-style:normal;margin-left:6px">(${sign}${fmtWon(diff)})</em>` : ""
      }</span></div>`;
  };
  if (lpgOnly) {
    const a = Number(gs?.avg?.K015), d = Number(gs?.diff?.K015);
    if (![a,d].some(Number.isFinite)) return "";
    return `<div style="margin:6px 0 8px;padding:8px 10px;border:1px solid #eee;border-radius:8px;background:#fafafa;font-size:12px;">
      <div style="font-weight:600;margin-bottom:4px">시·군 평균가 / 차이</div>${row("🔥 LPG", a, d)}</div>`;
  }
  const ag = Number(gs?.avg?.B027), dg = Number(gs?.diff?.B027);
  const ad = Number(gs?.avg?.D047), dd = Number(gs?.diff?.D047);
  if (![ag,dg,ad,dd].some(Number.isFinite)) return "";
  return `<div style="margin:6px 0 8px;padding:8px 10px;border:1px solid #eee;border-radius:8px;background:#fafafa;font-size:12px;">
    <div style="font-weight:600;margin-bottom:4px">시·군 평균가 / 차이</div>
    ${row("⛽ 휘발유", ag, dg)}${row("🛢 경유", ad, dd)}</div>`;
};





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
    //// 평균유가
    const color =
      type === "ev"        ? "#2b8af7" :
      type === "oil-cheap" ? "#2ecc71" :  // 평균보다 싼 곳
      type === "oil-exp"   ? "#e74c3c" :  // 평균보다 비싼 곳
      type === "oil"       ? "#ff7f27" :
      type === "lpg"       ? "#616161" :
      type === "origin"    ? "#7b1fa2" :
      type === "dest"      ? "#2e7d32" : "#999";

    const src = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(pinSvg(color));
    const img = new kakao.maps.MarkerImage(src, new kakao.maps.Size(21, 30), {
        offset: new kakao.maps.Point(14, 40),
    });

    markerImgCache[key] = img;
    return img;
};
//// 즐겨찾기
    // ✅ html escape (파일 하단의 escapeHtml가 이미 있다면, 아래 것으로 교체하고 하단 것은 삭제)
const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));

// ✅ 즐겨찾기/로그인 관련 (RouteMap 동일 로직의 경량 버전)
const FAV_KEY = "route.favorites.v1";

const parseJwt = (t="") => {
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

    // ── 평균유가/차이: RouteMap과 동일 개념
//const PRICE_DIFF_THRESH = 30;                     // 임계값(원)
//const BASIS_KEY = "route.priceBasis.v1";
const [priceBasis, setPriceBasis] = useState(() => {
  try { return localStorage.getItem(BASIS_KEY) || "B027"; } catch { return "B027"; }
});
useEffect(() => { try { localStorage.setItem(BASIS_KEY, priceBasis); } catch {} }, [priceBasis]);

// uni(주유소 고유코드) → {prices, avg, diff, ...}
const [avgMap, setAvgMap] = useState(new Map());
const fetchOilWithAverage = async () => {
  // ✅ 서버 라우트가 다르면 이 URL만 바꾸세요
  const r = await fetch("/api/route/oil/price/all");
  if (!r.ok) return;
  const j = await r.json();
  setAvgMap(normalizeOilAvgMap(j));
};
useEffect(() => { fetchOilWithAverage().catch(()=>{}); }, []);

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
  }[String(code).padStart(2,"0")] || String(code));

const statusText = (s) =>
  ({ "1":"통신이상","2":"충전가능","3":"충전중","4":"운영중지","5":"점검중","9":"미확인","0":"미확인" }[String(s ?? "9")] || "미확인");

// ↺ 이걸로 교체
const parseTs = (v) => {
  const s = String(v ?? "").trim();
  if (!s) return null;

  // ① yyyymmddHHMMSS (예: 20250904125524)
  let m = s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (m) return new Date(+m[1], +m[2]-1, +m[3], +m[4], +m[5], +m[6]);

  // ② yyyymmddHHMM (초 없음)
  m = s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (m) return new Date(+m[1], +m[2]-1, +m[3], +m[4], +m[5], 0);

  // ③ yyyymmdd (날짜만)
  m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) return new Date(+m[1], +m[2]-1, +m[3]);

  // ④ 'YYYY-MM-DD HH:mm:ss' / 'YYYY/MM/DD HH:mm:ss' 등
  const d = new Date(s.replace(/\//g, "-").replace(" ", "T"));
  return isNaN(d) ? null : d;
};

const fmtTs = (v, { seconds = false } = {}) => {
  const d = parseTs(v);
  if (!d) return String(v ?? "");

  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} `
       + `${pad(d.getHours())}:${pad(d.getMinutes())}`
       + (seconds ? `:${pad(d.getSeconds())}` : "");
};


// /api/route/ev/status/by-station 응답 정규화
const normalizeEvStatusList = (json) => {
  const raw = json?.items?.item ?? json?.items ?? json?.list ?? json?.data ?? [];
  const arr = Array.isArray(raw) ? raw : [raw].filter(Boolean);
  return arr.map(o => ({
    chgerId: o.chgerId ?? o.CHGER_ID ?? o.chargerId ?? "-",
    type:    o.chgerType ?? o.TYPE ?? o.type ?? "",
    status:  o.stat ?? o.STATUS ?? o.status ?? "9",
    lastTs:  o.statUpdDt ?? o.stat_upd_dt ?? o.updateTime ??
        o.lastTs ?? o.UPDT_DT ?? o.LAST_TS ?? o.UPDATE_DT ?? "",
  }));
};

////평균유가-기준 바뀌면 현재 마커 이미지만 재칠하기
useEffect(() => {
  if (!window.kakao || !mapRef.current) return;
  markersRef.current.forEach((m, idx) => {
    const s0 = stations?.[idx]; if (!s0) return;
    const uni = String(s0.stationId ?? s0.uni ?? s0.UNI_CD ?? "");
    const extra = uni ? (avgMap.get(uni) || {}) : {};
    const s = { ...s0, uni, avg: extra.avg || {}, diff: extra.diff || {} };
    const isCharge = !!s.statId;
    if (isCharge) return; // EV는 그대로
    const cat = ((s.lpgYN ?? s.LPG_YN) === "Y") ? "lpg" : "oil";
    const t = markerTypeByBasis(s, cat, priceBasis);
    m.setImage(getMarkerImage(t, window.kakao));
  });
}, [priceBasis, avgMap, stations]);

    ////평균유가-사이드바에서 보낼 커스텀 이벤트 수신
useEffect(() => {
  const on = (e) => setPriceBasis(e.detail);
  window.addEventListener("oil:setPriceBasis", on);
  return () => window.removeEventListener("oil:setPriceBasis", on);
}, []);


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

    ////평균유가
    // ✅ 마커 표시
    useEffect(() => {
        if (!window.kakao || !mapRef.current) return;
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        if (!stations?.length) return;
        const bounds = new window.kakao.maps.LatLngBounds();
        const newMarkers = [];
        const centerCoord = selectedCoord ?? MY_COORD;

      stations.forEach((s0) => {
    // uni 추출(프로젝트에 맞게 보정)
    const uni = String(s0.stationId ?? s0.uni ?? s0.UNI_CD ?? "");
    const extra = uni ? (avgMap.get(uni) || {}) : {};
    const s = { ...s0, uni, prices: extra.prices || {}, avg: extra.avg || {}, diff: extra.diff || {}, updatedAt: extra.updatedAt };
            const lat = Number(s.lat ?? s.LAT);
            const lon = Number(s.lon ?? s.LON ?? s.lng);
            if (Number.isNaN(lat) || Number.isNaN(lon)) return;

            const pos = new window.kakao.maps.LatLng(lat, lon);

            const isCharge = !!s.statId;
    // 주유/LPG의 기본 분류
    const cat = ((s.lpgYN ?? s.LPG_YN) === "Y") ? "lpg" : "oil";
    // 평균 대비 색상 반영
    const oilMarkerType = markerTypeByBasis(s, cat, priceBasis);
    const markerImage = getMarkerImage(isCharge ? "ev" : oilMarkerType, window.kakao);

            const marker = new window.kakao.maps.Marker({ position: pos, zIndex: 5, image: markerImage });
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
          ${favBtnHtml(starredNow)}
        </div>
        ${s.addr ? `<div class="info-row">📍 ${escapeHtml(s.addr)}</div>` : ""}
        ${s.useTime ? `<div class="info-row">⏰ ${escapeHtml(s.useTime)}</div>` : ""}
        ${s.busiNm ? `<div class="info-row">👤 운영사: ${escapeHtml(s.busiNm)}</div>` : ""}
        <div class="info-row" id="ev-status-line">상태 불러오는 중…</div>
      </div>`.trim();

    setInfoHtml(baseHtml, marker, (root) => {
      const btn = root.querySelector(".fav-btn");
      if (!btn) return;
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!isLoggedIn()) { alert("로그인 후 이용 가능합니다."); return; }
        await toggleFavForStation(s, mode);
        const on = favSetRef.current?.has(favKey);
        btn.textContent = on ? "★" : "☆";
        btn.classList.toggle("on", on);
      });
    });

    // 2) 상태 비동기 로딩 → 갱신
    try {
      const statId = String(s.statId || "");
      if (!statId) throw new Error("STAT_ID 없음");
      const url = `/api/route/ev/status/by-station?statIds=${encodeURIComponent(statId)}`;
      const j = await (await fetch(url)).json();
      const list = normalizeEvStatusList(j);

      const available = list.filter(c => String(c.status) === "2").length;
      const hasDc = list.some(c => ["01","03","04","05","06","08","09"].includes(String(c.type).padStart(2,"0")));
      const hasAc = list.some(c => ["02","03","06","07","08"].includes(String(c.type).padStart(2,"0")));
      let latest = "";
      for (const c of list) {
        const t = String(c.lastTs || "");
        if (!t) continue;
        if (!latest || new Date(t.replace(" ","T")) > new Date(latest.replace(" ","T"))) latest = t;
      }

      const statusPill = (s) => {
        const code = String(s ?? "9");
        let bg = "#999";
        if (code === "2") bg = "#27ae60";
        else if (code === "3") bg = "#f59e0b";
        else if (code === "5") bg = "#e74c3c";
        else if (["1","4","9","0"].includes(code)) bg = "#7f8c8d";
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
            ${favBtnHtml(nowStar)}
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
        if (!btn) return;
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          if (!isLoggedIn()) { alert("로그인 후 이용 가능합니다."); return; }
          await toggleFavForStation(s, mode);
          const on = favSetRef.current?.has(favKey);
          btn.textContent = on ? "★" : "☆";
          btn.classList.toggle("on", on);
        });
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
    const isLpg = (s.lpgYN ?? s.LPG_YN) === "Y";
    const baseHtml = `
      <div class="info-window">
        <div class="info-header" style="display:flex;align-items:center;gap:8px;justify-content:space-between;">
          <div style="flex:1;min-width:0;display:flex;align-items:center;gap:8px;">
            <div class="info-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              ${escapeHtml(stationName)}
            </div>
            ${brand ? `<span class="info-badge">${escapeHtml(brand)}</span>` : ""}
          </div>
          ${favBtnHtml(starredNow)}
        </div>
        ${addr ? `<div class="info-row">📍 ${escapeHtml(addr)}</div>` : ""}
      ${oilAvgPairPanel(s, { lpgOnly: isLpg })}
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
          ].map(([k,v]) => `<span class="flag ${v ? "on" : ""}">${k}</span>`).join("")}
        </div>
      </div>`.trim();

    setInfoHtml(baseHtml, marker, (root) => {
      const btn = root.querySelector(".fav-btn");
      if (!btn) return;
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!isLoggedIn()) { alert("로그인 후 이용 가능합니다."); return; }
        await toggleFavForStation(s, mode);
        const on = favSetRef.current?.has(favKey);
        btn.textContent = on ? "★" : "☆";
        btn.classList.toggle("on", on);
      });
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
            ${prices["경유"]   ? `<div class="price-row"><span>🛢 경유</span><b>${won(prices["경유"])}원</b></div>` : ""}
            ${prices["등유"]   ? `<div class="price-row"><span>🏠 등유</span><b>${won(prices["등유"])}원</b></div>` : ""}
            ${prices["LPG"]    ? `<div class="price-row"><span>🔥 LPG</span><b>${won(prices["LPG"])}원</b></div>` : ""}
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
          ${favBtnHtml(nowStar)}
        </div>
        ${addr ? `<div class="info-row">📍 ${escapeHtml(addr)}</div>` : ""}
      ${oilAvgPairPanel(s, { lpgOnly: isLpg })}
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
          ].map(([k,v]) => `<span class="flag ${v ? "on" : ""}">${k}</span>`).join("")}
        </div>
      </div>`.trim();

    setInfoHtml(html, marker, (root) => {
      const btn = root.querySelector(".fav-btn");
      if (!btn) return;
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!isLoggedIn()) { alert("로그인 후 이용 가능합니다."); return; }
        await toggleFavForStation(s, mode);
        const on = favSetRef.current?.has(favKey);
        btn.textContent = on ? "★" : "☆";
        btn.classList.toggle("on", on);
      });
    });
  }

  // 포커싱 이동
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

