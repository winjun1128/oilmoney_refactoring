// src/components/RouteMap.jsx
import "./RouteMap.css";
import { useEffect, useRef, useState } from "react";
import proj4 from "proj4";
//////////통일 모달
// html escape
const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));


////////////
/** 원점(홈) 저장 키 & 카카오 스타마커 이미지 */
const HOME_KEY = "route.home.coord.v1";
const KAKAO_STAR_IMG = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png";

/** ✅ 카카오 Developers "JavaScript 키" (REST 키 아님) */
const KAKAO_JS_KEY = "01a51f847b68dacc1745dde38509991d";

/** 공용 OSRM 데모(상용 X) */
const OSRM = "https://router.project-osrm.org";

/** 확대/축소에 따라 자동으로 숨기는 임계 레벨 */
const AUTO_HIDE_LEVEL = { oil: 7, lpg: 7, ev: 9 };

/** EV/주유소 이름 라벨 항상 표시 여부 */
const LABEL_ALWAYS = false;

/** 프리셋 + 직접 좌표 입력 */
const PRESET = {
  "서울시청": [126.9784, 37.5667],
  "강남역": [127.0276, 37.4979],
  "인천국제공항": [126.4505, 37.4602],
  "휴먼교육센터": [127.147169, 36.807313],
  "천안아산역": [127.104464, 36.79427],
};

/** 지도/패널 공통 높이 */
const MAP_HEIGHT = 460;

// 빈 값 체크
const isBlank = (s) => !String(s ?? "").trim();

// ★ 추가: EV 충전기 타입 코드 → 이름
const chargerTypeName = (code = "") =>
  ({
    "01": "DC차데모",
    "02": "AC완속",
    "03": "DC차데모+AC3상",
    "04": "DC콤보",
    "05": "DC차데모+DC콤보",
    "06": "DC차데모+AC3상+DC콤보",
    "07": "AC3상",
    "08": "DC콤보+AC3상",
    "09": "DC콤보(초고속)",
    "10": "기타",
  }[String(code).padStart(2, "0")] || String(code));

/* ───────── 숫자/좌표 유틸 ───────── */
const parseNum = (v) => {
  if (v == null) return NaN;
  const n = Number(String(v).trim().replace(/,/g, ""));
  return Number.isFinite(n) ? n : NaN;
};
const isKoreaWgs = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng) && lat > 32 && lat < 39.5 && lng > 124 && lng < 132;
/** 좌표 키(≈ 1e-6deg) – 겹침 판정/병합용 */
const coordKey = (lat, lng) => `${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`;

/** 좌표 범위로 투영계 추정 */
const guessProj = (x, y) => {
  const X = parseNum(x), Y = parseNum(y);
  if (!Number.isFinite(X) || !Number.isFinite(Y)) return null;
  if (X > 150000 && X < 900000 && Y > 3500000 && Y < 5000000)
    return "+proj=utm +zone=52 +ellps=WGS84 +units=m +no_defs";
  if (X > 100000 && X < 400000 && Y > 350000 && Y < 900000)
    return "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +units=m +no_defs";
  if (X > 100000 && X < 400000 && Y > 450000 && Y < 1000000)
    return "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs";
  if (X > 800000 && X < 1400000 && Y > 1500000 && Y < 3000000)
    return "+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +units=m +no_defs";
  if (X > 100000 && X < 400000 && Y > 350000 && Y < 900000)
    return "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +towgs84=-146.43,507.89,681.46,0,0,0,0 +units=m +no_defs";
  return null;
};
/** TM/UTM → WGS84 */
const tmToWgs = (x, y) => {
  const primary = guessProj(x, y);
  const CANDS = [
    primary,
    "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +units=m +no_defs",
    "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs",
    "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +towgs84=-146.43,507.89,681.46,0,0,0,0 +units=m +no_defs",
    "+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +units=m +no_defs",
    "+proj=utm +zone=52 +ellps=WGS84 +units=m +no_defs",
  ].filter(Boolean);

  for (const def of CANDS) {
    try {
      const [lng, lat] = proj4(def, proj4.WGS84, [parseNum(x), parseNum(y)]);
      if (isKoreaWgs(lat, lng)) return { lat, lng };
    } catch {}
  }
  return null;
};

/** 브랜드/유종 */
const brandName = (c) =>
  ({ SKE: "SK에너지", GSC: "GS칼텍스", HDO: "현대오일뱅크", SOL: "S-OIL", RTX: "자가/고속도로", RTO: "알뜰(농협)", ETC: "기타" }[String(c || "").trim()] || c || "");
const productName = (code) =>
  ({ B027: "휘발유", D047: "경유", B034: "고급휘발유", C004: "등유", K015: "자동차용 LPG" }[String(code || "").trim()] || code || "기타");

/** 층 타입 코드 → 라벨 */
const floorTypeName = (c) => {
  const k = String(c || "").trim().toUpperCase();
  return k === "B" ? "지하" : k === "N" ? "지상" : (k || "-");
};

/** ✅ EV "행(충전기)" → "사이트(지점)"로 병합 — ev/info 기반 */
const aggregateEvSites = (rows) => {
  const byStat = new Map();
  for (const r of rows) {
    const lat = parseNum(r.lat), lng = parseNum(r.lng);
    const sid = r.statId || coordKey(lat, lng);
    if (!byStat.has(sid)) {
      byStat.set(sid, {
        type: "ev",
        statId: r.statId || null,
        name: r.name || r.addr || "",
        addr: r.addr || "",
        lat, lng,
        chargerCount: 0,
        hasDc: false,
        hasAc: false,
        usetime: r.usetime || "",
        floornum: r.floornum || "",
        floortype: r.floortype || "",
        businm: r.businm || "",
        busicall: r.busicall || "",
      });
    }
    const s = byStat.get(sid);
    s.chargerCount += 1;
    const t = String(r.chgerType || "").padStart(2, "0");
    if (["01", "03", "04", "05", "06", "08"].includes(t)) s.hasDc = true;
    if (["02", "03", "06", "07", "08"].includes(t)) s.hasAc = true;
  }
  const stations = [...byStat.values()];
  const byCoord = new Map();
  for (const s of stations) {
    const key = coordKey(s.lat, s.lng);
    if (!byCoord.has(key)) {
      byCoord.set(key, {
        type: "ev",
        name: s.name, addr: s.addr, lat: s.lat, lng: s.lng,
        statIds: s.statId ? [String(s.statId)] : [],
        chargerCount: s.chargerCount,
        hasDc: s.hasDc, hasAc: s.hasAc,
        usetime: s.usetime, floornum: s.floornum, floortype: s.floortype, businm: s.businm, busicall: s.busicall,
      });
    } else {
      const t = byCoord.get(key);
      if (s.name && !t.name.includes(s.name)) t.name += ` / ${s.name}`;
      if (s.statId) {
        const sid = String(s.statId);
        if (!t.statIds.includes(sid)) t.statIds.push(sid);
      }
      t.chargerCount += s.chargerCount;
      t.hasDc = t.hasDc || s.hasDc;
      t.hasAc = t.hasAc || s.hasAc;
      t.usetime ||= s.usetime; t.floornum ||= s.floornum; t.floortype ||= s.floortype; t.businm ||= s.businm; t.busicall ||= s.busicall;
    }
  }
  return [...byCoord.values()];
};

/* ───────── Kakao 마커 아이콘 & 라벨 ───────── */
const pinSvg = (fill = "#2b8af7", stroke = "#1b6ad1", starred = false) => {
  const circle = { cx: 14, cy: 13, r: 5.5, d: 11 };
  const starBox = { minX: 0.4, maxX: 19.6, minY: 1, maxY: 17.9 };
  const starW = starBox.maxX - starBox.minX;
  const starH = starBox.maxY - starBox.minY;
  const starCx = (starBox.minX + starBox.maxX) / 2;
  const starCy = (starBox.minY + starBox.maxY) / 2;
  const pad = 0.98;
  const s = pad * Math.min(circle.d / starW, circle.d / starH);
  const starTransform =
    `translate(${circle.cx},${circle.cy}) ` +
    `scale(${s}) ` +
    `translate(${-starCx},${-starCy})`;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
  <path d="M14 0C6.82 0 1 5.82 1 13c0 9.53 12 27 13 27s13-17.47 13-27C27 5.82 21.18 0 14 0z"
        fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
  <circle cx="${circle.cx}" cy="${circle.cy}" r="${circle.r}" fill="#fff"/>
  ${
    starred
      ? `<g transform="${starTransform}">
           <path d="M10 1 L12.9 7.1 L19.6 7.3 L14.3 11.3 L16.2 17.9 L10 14.2 L3.8 17.9 L5.7 11.3 L0.4 7.3 L7.1 7.1 Z"
                 fill="#ffd54f" stroke="#f39c12" stroke-width="1"/>
         </g>`
      : ""
  }
</svg>`.trim();
};

const markerImgCache = {};
const getMarkerImage = (type, kakao, starred = false, scale = 1) => {
  const key = `${type}${starred ? "-fav" : ""}@${scale}`;
  if (markerImgCache[key]) return markerImgCache[key];

    // ⭐️ 원점(홈)은 카카오 제공 star 마커를 항상 사용
  if (type === "home") {
    const img = new kakao.maps.MarkerImage(
      KAKAO_STAR_IMG,
      new kakao.maps.Size(24 * scale, 35 * scale),
      { offset: new kakao.maps.Point(12 * scale, 35 * scale) }
    );
    markerImgCache[key] = img;
    return img;
  }

  const fill =
   type === "ev"         ? "#2b8af7" :
   type === "oil-cheap"  ? "#2ecc71" :   // 싸다(초록)
   type === "oil-exp"    ? "#e74c3c" :   // 비싸다(빨강)
   type === "oil"        ? "#ff7f27" :   // 보통(주황)
   type === "lpg"        ? "#616161" :
    type === "origin" ? "#7b1fa2" :
    type === "dest" ? "#2e7d32" : "#999";

  const src = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(pinSvg(fill, "#1b6ad1", starred));
  const w = 28 * scale, h = 40 * scale;
  const img = new kakao.maps.MarkerImage(src, new kakao.maps.Size(w, h), {
    offset: new kakao.maps.Point(14 * scale, 40 * scale),
  });
  markerImgCache[key] = img;
  return img;
};

const makeNameOverlay = (kakao, { name, lat, lng }) => {
  const content = document.createElement("div");
  content.innerHTML =
    `<div style="
        transform: translateY(-46px);
        background: rgba(0,0,0,.75);
        color:#fff; font-size:12px; line-height:18px;
        padding:2px 6px; border-radius:6px; white-space:nowrap;
        pointer-events:none;">
      ${name ? String(name).replace(/</g, "&lt;") : ""}
     </div>`;
  return new kakao.maps.CustomOverlay({
    position: new kakao.maps.LatLng(lat, lng),
    content,
    yAnchor: 1,
  });
};

const addLabeledMarker = ({ map, kakao, type, lat, lng, name, onClick, labelAlways = false, starred = false }) => {
  const pos = new kakao.maps.LatLng(lat, lng);
  const marker = new kakao.maps.Marker({
    map,
    position: pos,
    image: getMarkerImage(type, kakao, starred),
    title: name ? String(name) : undefined,
    zIndex: type === "origin" || type === "dest" ? 40
      : type === "ev" ? 35
      : type === "oil" || type === "lpg" ? 30
      : 10,
  });
  const overlay = makeNameOverlay(kakao, { name, lat, lng });
  if (labelAlways) overlay.setMap(map); else overlay.setMap(null);

  if (!labelAlways) {
    kakao.maps.event.addListener(marker, "mouseover", () => overlay.setMap(map));
    kakao.maps.event.addListener(marker, "mouseout", () => overlay.setMap(null));
  }
  if (onClick) kakao.maps.event.addListener(marker, "click", onClick);

  return { marker, overlay };
};

/* ───────────────────────────────────────────────────────────────────── */

export default function RouteMap() {
  ////통일 모달 
  // 문자열 html을 DOM 노드로 바꿔 넣고, 필요하면 앵커(marker)에 열기
// infoWindow에 HTML을 넣고, 마운트 직후 바인딩 콜백 실행
const setInfoHtml = (html, anchorMarker, onAfterMount) => {
  const box = document.createElement("div");
  box.innerHTML = html;
  infoRef.current.setContent(box);
  infoRef.current.open(mapRef.current, anchorMarker);
  if (typeof onAfterMount === "function") onAfterMount(box);
};


  // 지도 공용 인포윈도우
  const infoRef = useRef(null);

  const mapRef = useRef(null);
  const polyRef = useRef(null);
  const viaRef = useRef(null);

    // ⭐️ 홈(원점)
  const homeMarkerRef = useRef(null);
  const homeLabelRef = useRef(null);
  const [homeCoord, setHomeCoord] = useState(() => {
    try {
      const s = localStorage.getItem(HOME_KEY);
      if (!s) return { lat: 36.807313, lng: 127.147169 }; // 기본: 휴먼교육센터
      const o = JSON.parse(s);
      if (Number.isFinite(o?.lat) && Number.isFinite(o?.lng)) return { lat: o.lat, lng: o.lng };
      return { lat: 36.807313, lng: 127.147169 };
    } catch { return { lat: 36.807313, lng: 127.147169 }; }
  });
    // ⭐️ 홈(원점) 마커를 갱신해서 항상 지도에 보이게
  const drawHomeMarker = ({ lat, lng }) => {
    const { kakao } = window;
    if (!mapRef.current || !kakao?.maps) return;
    if (homeMarkerRef.current) { homeMarkerRef.current.setMap(null); homeMarkerRef.current = null; }
    if (homeLabelRef.current)  { homeLabelRef.current.setMap(null);  homeLabelRef.current  = null; }
    const pos = new kakao.maps.LatLng(lat, lng);
    homeMarkerRef.current = new kakao.maps.Marker({
      map: mapRef.current,
      position: pos,
      image: getMarkerImage("home", kakao, false, 1),
      zIndex: 60,
      title: "원점",
    });
    homeLabelRef.current = makeNameOverlay(kakao, { name: "원점", lat, lng });
    homeLabelRef.current.setMap(mapRef.current);
  };

  // 저장+그리기
  const saveHome = (lat, lng) => {
    const v = { lat: Number(lat), lng: Number(lng) };
    setHomeCoord(v);
    try { localStorage.setItem(HOME_KEY, JSON.stringify(v)); } catch {}
    drawHomeMarker(v);
  };


  const routeCtxRef = useRef(null);
  const allMarkersRef = useRef([]); // {marker, overlay, type, cat, lat, lng, data}

  // 출발/도착 마커 ref
  const odRef = useRef({ origin: null, originLabel: null, dest: null, destLabel: null });

  // Kakao services
  const geocoderRef = useRef(null);
  const placesRef = useRef(null);

  // 입력/요약
  const [originInput, setOriginInput] = useState("휴먼교육센터");
  const [destInput, setDestInput] = useState("천안아산역");
  const [summary, setSummary] = useState("");
  const [detourSummary, setDetourSummary] = useState("");
  const [loading, setLoading] = useState(false);

  // state 모음 근처
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  // 상단 근처에 추가
  const ACTIVE_SCALE = 1;
  const baseZ = (t) => (t === "origin" || t === "dest") ? 40 : (t === "ev" ? 35 : (t === "oil" || t === "lpg" ? 30 : 10));
  const activeMarkerRef = useRef(null);

  // 클릭된 마커만 크게 보이기
  const setActiveMarker = ({ marker, type, starred, overlay }) => {
    const { kakao } = window;
    if (!kakao?.maps) return;

    const prev = activeMarkerRef.current;
    if (prev?.marker) {
      const prevStar = prev.starred;
      prev.marker.setImage(getMarkerImage(prev.type, kakao, prevStar, 1));
      prev.marker.setZIndex(baseZ(prev.type));
      if (prev.overlay && !LABEL_ALWAYS) prev.overlay.setMap(null);
    }

    marker.setImage(getMarkerImage(type, kakao, starred, ACTIVE_SCALE));
    marker.setZIndex(9999);
    if (overlay) overlay.setMap(mapRef.current);

    activeMarkerRef.current = { marker, type, starred, overlay };
  };
  // 유가 동작
  // 파일 상단 유틸 근처에 추가
const fmtWon = (v) => {
  const n = Number(String(v ?? "").replace(/,/g, "").trim());
  return Number.isFinite(n) ? n.toLocaleString() : "-";
};

// 휘발유/경유 평균가 + 차이 패널 (둘 다 없으면 빈 문자열 반환)
// 휘발유/경유 평균가 + 차이 패널 (LPG 전용 출력도 지원)
const oilAvgPairPanel = (gs, { lpgOnly = false } = {}) => {
  const row = (label, avg, diff) => {
    const hasAvg = Number.isFinite(avg);
    const hasDiff = Number.isFinite(diff);
    const sign = hasDiff ? (diff > 0 ? "+" : "") : "";
    const diffColor = hasDiff ? (diff < 0 ? "#2ecc71" : diff > 0 ? "#e74c3c" : "#999") : "#999";
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:2px 0;">
        <span>${label}</span>
        <span>
          ${hasAvg ? `${fmtWon(avg)}원` : "-"}
          ${hasDiff ? `<em style="color:${diffColor};font-style:normal;margin-left:6px">(${sign}${fmtWon(diff)})</em>` : ""}
        </span>
      </div>
    `;
  };

  if (lpgOnly) {
    const avgL  = parseNum(gs?.avg?.K015);
    const diffL = parseNum(gs?.diff?.K015);
    if (![avgL, diffL].some(Number.isFinite)) return "";
    return `
      <div class="info-avg-pair" style="
        margin:6px 0 8px; padding:8px 10px; border-radius:8px;
        background:#fafafa; border:1px solid #eee; font-size:12px;">
        <div style="font-weight:600;margin-bottom:4px">시·군 평균가 / 차이</div>
        ${row("🔥 LPG", avgL, diffL)}
      </div>
    `;
  }

  const avgG  = parseNum(gs?.avg?.B027);
  const diffG = parseNum(gs?.diff?.B027);
  const avgD  = parseNum(gs?.avg?.D047);
  const diffD = parseNum(gs?.diff?.D047);
  if (![avgG, diffG, avgD, diffD].some(Number.isFinite)) return "";

  return `
    <div class="info-avg-pair" style="
      margin:6px 0 8px; padding:8px 10px; border-radius:8px;
      background:#fafafa; border:1px solid #eee; font-size:12px;">
      <div style="font-weight:600;margin-bottom:4px">시·군 평균가 / 차이</div>
      ${row("⛽ 휘발유", avgG, diffG)}
      ${row("🛢 경유",   avgD, diffD)}
    </div>
  `;
};


  // ── [API] 추가
 const fetchOilWithAverage = async () => {
   const res = await fetch(`/api/route/oil/price/all`);
   if (!res.ok) throw new Error(`/oil/price/all 오류: ${res.status}`);
   return res.json();
 };

 const normalizeOilAvgMap = (json) => {
   const raw = json?.response?.body?.items ?? [];
   const arr = Array.isArray(raw) ? raw : [raw];
   const map = new Map();
   for (const o of arr) {
     const uni = String(o.UNI_CD || o.uni || "");
     if (!uni) continue;
     map.set(uni, {
       prices: o.PRICES || {},
       avg:    o.AVG    || {},
       diff:   o.DIFF   || {},
       updatedAt: o.UPDATED_AT || null,
       sigunCd:   o.SIGUN_CD   || null,
     });
   }
   return map;
 };


  // 즐겨찾기 동작
  const FAV_KEY = "route.favorites.v1";
  const getToken = () => localStorage.getItem("token")||"";
  const [favSet, setFavSet] = useState(() => {
    try {
      const arr = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
      return new Set(Array.isArray(arr) ? arr : []);
    } catch { return new Set(); }
  });
  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        if (!token) return;
        const res = await fetch("/api/route/favs", { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error("즐겨찾기 로드 실패");
        const json = await res.json();
        const keys = (json.items || []).map((it) => it.key);
        setFavSet(new Set(keys));
        localStorage.setItem(FAV_KEY, JSON.stringify(keys));
      } catch (e) {
        console.warn(e);
      }
    })();
  }, []);
  const favKeyOf = (station, mode = modalMode) => {
    if (!station) return "";
    if (mode === "oil") {
      return station?.uni ? `oil:${station.uni}` : `oil@${coordKey(station.lat, station.lng)}`;
    }
    const ids = Array.isArray(station?.statIds) && station.statIds.length
      ? station.statIds.slice().sort().join("|")
      : (station?.statId ? String(station.statId) : coordKey(station.lat, station.lng));
    return `ev:${ids}`;
  };
  const isFavStation = (st, mode = modalMode) => !!favKeyOf(st, mode) && favSet.has(favKeyOf(st, mode));

  const toggleFav = async () => {
    const key = favKeyOf(modalStation, modalMode);
    if (!key) return;
    
    // ⛔ 로그아웃이면 불가
   if (!isLoggedIn()) { alert("로그인 후 이용 가능합니다."); return; }
   const token = getToken();

   // 통신 성공을 전제로 optimistic (실패 시 롤백)
   setFavSet((prev) => {
     const next = new Set(prev);
     next.has(key) ? next.delete(key) : next.add(key);
     localStorage.setItem(FAV_KEY, JSON.stringify([...next]));
     return next;
   });

    try {
      const wasFav = favSetRef.current?.has(key);
      const method = wasFav ? "DELETE" : "POST";
      const url = method === "POST" ? "/api/route/favs" : `/api/route/favs/${encodeURIComponent(key)}`;
      const body = method === "POST"
        ? JSON.stringify({
            key,
            label: modalStation?.name || "",
            lat: modalStation?.lat, lng: modalStation?.lng,
            mode: modalMode,
          })
        : undefined;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body,
      });
      if (!res.ok) throw new Error("즐겨찾기 동기화 실패");
    } catch (e) {
      console.warn(e);
      setFavSet((prev) => {
        const revert = new Set(prev);
        if (revert.has(key)) revert.delete(key); else revert.add(key);
        localStorage.setItem(FAV_KEY, JSON.stringify([...revert]));
        return revert;
      });
      alert("즐겨찾기 저장에 실패했습니다.");
    }
  };

  //// 통일 모달
  // 클릭 핸들러 내부에서 사용할 헬퍼


  // 특정 지점(충전소/주유소)을 즐겨찾기 토글 (로그인 필수, 실패시 롤백)
const toggleFavForStation = async (station, mode) => {
  const key = favKeyOf(station, mode);
  if (!key) return;
  if (!isLoggedIn()) { alert("로그인 후 이용 가능합니다."); return; }

  const token = getToken();
  const wasFav = favSetRef.current?.has(key);

  // optimistic update
  setFavSet(prev => {
    const next = new Set(prev);
    wasFav ? next.delete(key) : next.add(key);
    localStorage.setItem(FAV_KEY, JSON.stringify([...next]));
    return next;
  });

  try {
    const method = wasFav ? "DELETE" : "POST";
    const url = method === "POST" ? "/api/route/favs" : `/api/route/favs/${encodeURIComponent(key)}`;
    const body = method === "POST"
      ? JSON.stringify({
          key,
          label: station?.name || "",
          lat: station?.lat, lng: station?.lng,
          mode,
        })
      : undefined;

    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body,
    });
    if (!r.ok) throw new Error("즐겨찾기 동기화 실패");
  } catch (e) {
    console.warn(e);
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

  const favSetRef = useRef(favSet);
  useEffect(() => { favSetRef.current = favSet; }, [favSet]);

  useEffect(() => {
    const { kakao } = window;
    if (!kakao?.maps) return;
    allMarkersRef.current.forEach((o) => {
      const starred = !!(o.favKey && favSet.has(o.favKey));
      const isActive = activeMarkerRef.current?.marker === o.marker;
      const scale = isActive ? ACTIVE_SCALE : 1;
      o.marker.setImage(getMarkerImage(o.type, kakao, starred, scale));
      o.marker.setZIndex(isActive ? 9999 : baseZ(o.type));
    });
  }, [favSet]);

  // 사이드바 토글 이벤트
  useEffect(() => {
    const onToggle = (e) => {
      const mode = e.detail?.mode || "toggle";
      if (mode === "open") setIsFilterOpen(true);
      else if (mode === "close") setIsFilterOpen(false);
      else setIsFilterOpen((v) => !v);
    };
    window.addEventListener("ui:toggleFilters", onToggle);
    return () => window.removeEventListener("ui:toggleFilters", onToggle);
  }, []);

  useEffect(() => {
    const tid = setTimeout(() => { try { mapRef.current?.relayout(); } catch {} }, 220);
    return () => clearTimeout(tid);
  }, [isFilterOpen]);

  // 지도 클릭 모드
  const [clickMode, setClickMode] = useState("origin"); // 'origin' | 'dest' | 'home'
  const clickModeRef = useRef(clickMode);
  useEffect(() => { clickModeRef.current = clickMode; }, [clickMode]);

  // 지도 편집 토글
  const [isMapEdit, setIsMapEdit] = useState(false);
  const isMapEditRef = useRef(isMapEdit);
  useEffect(() => { isMapEditRef.current = isMapEdit; }, [isMapEdit]);

  useEffect(() => {
    const el = document.getElementById("map");
    if (!el) return;
    el.style.cursor = isMapEdit ? "crosshair" : "default";
  }, [isMapEdit]);

  // 모달
  const [modalOpen, setModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false); // ★ 리뷰 전용 모달
  const [modalMode, setModalMode] = useState("ev"); // 'ev' | 'oil'
  const [modalStation, setModalStation] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalList, setModalList] = useState([]);

  ////리뷰
  // DB/ISO/문자 다양한 형태를 안전하게 "YYYY-MM-DD HH:mm" 으로
const fmtTs = (v) => {
  if (!v) return "";
  const s = String(v).trim();

  // 14자리: yyyyMMddHHmmss
  let m = s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (m) {
    const [, y, mo, d, h, mi] = m;
    return `${y}-${mo}-${d} ${h}:${mi}`;
  }
  // 12자리: yyyyMMddHHmm
  m = s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (m) {
    const [, y, mo, d, h, mi] = m;
    return `${y}-${mo}-${d} ${h}:${mi}`;
  }
  // 8자리: yyyyMMdd
  m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) {
    const [, y, mo, d] = m;
    return `${y}-${mo}-${d}`;
  }

  // ISO/스페이스 구분 시각들
  const tryDate = new Date(s.includes("T") ? s : s.replace(" ", "T"));
  if (!isNaN(tryDate.getTime())) {
    const pad = (n) => String(n).padStart(2, "0");
    const y = tryDate.getFullYear();
    const mo = pad(tryDate.getMonth() + 1);
    const d = pad(tryDate.getDate());
    const hh = pad(tryDate.getHours());
    const mm = pad(tryDate.getMinutes());
    return `${y}-${mo}-${d} ${hh}:${mm}`;
  }
  // 모르면 최대한 보기 좋게
  return s.replace("T", " ").slice(0, 16);
};

// createdAt과 updatedAt이 '사실상 동일'인지(초 단위 이내) 판정
const wasEdited = (createdAt, updatedAt) => {
  if (!createdAt || !updatedAt) return false;
  const c = new Date(String(createdAt).replace(" ", "T")).getTime();
  const u = new Date(String(updatedAt).replace(" ", "T")).getTime();
  if (isNaN(c) || isNaN(u)) return String(createdAt) !== String(updatedAt);
  return Math.abs(u - c) > 1000; // 1초 초과 차이면 수정으로 간주
};

  // utils (RouteMap.jsx 상단 아무데나)
const parseJwt = (t="") => {
  try {
    const b64 = t.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/") || "";
    return JSON.parse(atob(b64)) || {};
  } catch { return {}; }
};

const isTokenAlive = (t) => {
  if (!t) return false;
  const { exp } = parseJwt(t);
  // exp가 없으면(서버 설정에 따라) 일단 true 취급, 있으면 만료 체크
  return typeof exp === "number" ? Date.now() < exp * 1000 : true;
};

//// 통일 모달
const isLoggedIn = () => isTokenAlive(getToken());


// requireJson 에 401 처리 추가 (이미 있는 함수에 아래 블록만 넣기)
const requireJson = async (r) => {
  if (r.status === 401 || r.status === 403) {
    try { localStorage.removeItem("token"); } catch {}
    setIsAuthed(false);
    throw new Error("로그인이 만료되었습니다. 다시 로그인해주세요.");
  }
  if (!r.ok) throw new Error(`요청 실패 (${r.status})`);
  if (r.status === 204) return null;
  const ct = r.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const t = await r.text().catch(() => "");
    throw new Error("서버가 JSON을 반환하지 않았습니다. 로그인 만료 또는 API 라우트 확인 필요.");
  }
  return r.json();
};



  // 유틸 하나 추가
  const isLocalReviewId = (id) => String(id || "").startsWith("local:");

  const rvTextRef = useRef(null);
  const rvEditTextRef = useRef(null);

// 저장 시 현재 입력된 텍스트를 DOM에서 직접 읽음
  const text = rvTextRef.current?.value?.trim() ?? "";
  // 공용 IME 핸들러 팩토리
const imeRef = useRef(false);
const imeHandlers = (setter) => ({
  onChange: (e) => { if (!imeRef.current) setter(e.target.value); },
  onCompositionStart: () => { imeRef.current = true; },
  onCompositionEnd: (e) => { imeRef.current = false; setter(e.target.value); },
});
  // 응답이 진짜 JSON인지 확인
  const isJsonResponse = (r) => (r.headers.get("content-type") || "").includes("application/json");

  const rvComposing = useRef(false);

  const isTypingRef = useRef(false);

// 포커스/블러 훅
const onStartTyping = () => { isTypingRef.current = true; };
const onStopTyping  = () => { isTypingRef.current = false; };
  // ★ 리뷰 state 위쪽 근처에 추가
const CLIENT_ID_KEY = "route.reviews.clientId.v1";
const getClientId = () => {
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = (crypto?.randomUUID?.() || (Date.now().toString(36)+Math.random().toString(16).slice(2)));
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
};

// 기존: const [isAuthed, setIsAuthed] = useState(!!getToken());
// 교체
const [isAuthed, setIsAuthed] = useState(() => isTokenAlive(getToken()));

useEffect(() => {
  const sync = () => {
    const t = getToken();
    const ok = isTokenAlive(t);
    setIsAuthed(ok);
    if (!ok && t) { try { localStorage.removeItem("token"); } catch {} }
  };
  window.addEventListener("focus",  sync);
  window.addEventListener("storage", sync);
  sync(); // 첫 렌더 직후 한 번 검증
  return () => { window.removeEventListener("focus", sync); window.removeEventListener("storage", sync); };
}, []);




  // ── [모달 state 아래에 추가] ──────────────────────────────
const [rvLoading, setRvLoading]   = useState(false);
const [rvError, setRvError]       = useState("");
const [rvItems, setRvItems]       = useState([]);   // [{id, user, rating, text, ts}]
const [rvAvg, setRvAvg]           = useState(0);
const [rvCount, setRvCount]       = useState(0);
const [rvPage, setRvPage]         = useState(1);
const [rvHasMore, setRvHasMore]   = useState(false);

const [rvFormOpen, setRvFormOpen] = useState(false);
// const [rvText, setRvText]         = useState("");

// 인증이 끊기면 작성 폼 자동 닫기
useEffect(() => {
  if (!isAuthed) setRvFormOpen(false);
}, [isAuthed]);

const [rvRating, setRvRating]     = useState(0);

// 리뷰 state 근처에 추가
const [rvEditingId, setRvEditingId]   = useState(null);
const [rvEditText, setRvEditText]     = useState("");
const [rvEditRating, setRvEditRating] = useState(0);

const putReview = async ({ id, key, rating, text }) => {
  if (isLocalReviewId(id)) {
    // 로컬 리뷰는 더 이상 지원하지 않음: 그냥 막아버림
    throw new Error("오프라인(로컬) 리뷰는 수정할 수 없습니다. 로그인 후 작성해주세요.");
  }
  const token = getToken();
  if (!token) throw new Error("로그인 후 수정할 수 있습니다.");

  const r = await fetch(`/api/route/reviews/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ rating, text }),
  });
  return await requireJson(r); // JSON 또는 204만 성공으로 처리
};


const deleteReview = async ({ id, key }) => {
  if (isLocalReviewId(id)) {
    throw new Error("오프라인(로컬) 리뷰는 삭제할 수 없습니다. 로그인 후 작성해주세요.");
  }
  const token = getToken();
  if (!token) throw new Error("로그인 후 삭제할 수 있습니다.");

  const r = await fetch(`/api/route/reviews/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  await requireJson(r);
  return { ok: true };
};


const startEdit = (it) => {
  if (!getToken()) { alert("로그인 후 수정할 수 있습니다."); return; }
  setRvEditingId(it.id);
  setRvEditRating(Number(it.rating) || 0);
};

const handleUpdateReview = async () => {
  try {
    const key = reviewKeyOf(modalStation, modalMode);
    const newText = rvEditTextRef.current?.value?.trim() || "";
    await putReview({ id: rvEditingId, key, rating: rvEditRating, text: newText });
    setRvEditingId(null);
    await reloadReviews({ resetPage: true });
  } catch (e) {
    alert(e.message || "리뷰 수정 실패");
  }
};

const handleDeleteReview = async (id) => {
  try {
    if (!getToken() && !isLocalReviewId(id)) {  // 로컬은 토큰 없어도 삭제 가능
      alert("로그인 후 삭제할 수 있습니다.");
      return;
    }
    if (!window.confirm("리뷰를 삭제할까요?")) return;
    const key = reviewKeyOf(modalStation, modalMode);
    await deleteReview({ id, key });
    await reloadReviews({ resetPage: true });
  } catch (e) {
    alert(e.message || "리뷰 삭제 실패");
  }
};


// 별점 표시용
const Stars = ({ value = 0, size = 16, onChange }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = i <= Math.round(value);
    stars.push(
      <span
        key={i}
        onClick={onChange ? () => onChange(i) : undefined}
        style={{
          cursor: onChange ? "pointer" : "default",
          fontSize: size, color: filled ? "#f39c12" : "#ddd",
          userSelect: "none", marginRight: 2,
        }}
        aria-label={`${i}점`}
        role={onChange ? "button" : "img"}
      >
        ★
      </span>
    );
  }
  return <>{stars}</>;
};

// 리뷰 키(=즐겨찾기 키 재사용)
const reviewKeyOf = (station, mode = modalMode) => favKeyOf(station, mode);

// 서버/로컬 폴백 유틸
const REV_LS_KEY = "route.reviews.v1";
const readLocalReviews = (key) => {
  try {
    const m = JSON.parse(localStorage.getItem(REV_LS_KEY) || "{}");
    return Array.isArray(m[key]) ? m[key] : [];
  } catch { return []; }
};
const writeLocalReview = (key, item) => {
  try {
    const m = JSON.parse(localStorage.getItem(REV_LS_KEY) || "{}");
    m[key] = [item, ...(m[key] || [])];
    localStorage.setItem(REV_LS_KEY, JSON.stringify(m));
  } catch {}
};

// 기존 readLocalReviews / writeLocalReview 아래에 추가
const updateLocalReview = (key, id, { rating, text }) => {
  try {
    const m = JSON.parse(localStorage.getItem(REV_LS_KEY) || "{}");
    const arr = Array.isArray(m[key]) ? m[key] : [];
    m[key] = arr.map(it => it.id === id ? { ...it, rating, text } : it);
    localStorage.setItem(REV_LS_KEY, JSON.stringify(m));
  } catch {}
};

const removeLocalReview = (key, id) => {
  try {
    const m = JSON.parse(localStorage.getItem(REV_LS_KEY) || "{}");
    const arr = Array.isArray(m[key]) ? m[key] : [];
    m[key] = arr.filter(it => it.id !== id);
    localStorage.setItem(REV_LS_KEY, JSON.stringify(m));
  } catch {}
};


const fetchReviews = async ({ key, page = 1, size = 5 }) => {
  const token = getToken();
  const me = getClientId();
  const qs = new URLSearchParams({ key, page: String(page), size: String(size), clientId: me });
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const r = await fetch(`/api/route/reviews?${qs.toString()}`, { headers });
  const json = await requireJson(r);
  // 서버가 반드시 { items, hasMore, avg, count } 형태를 주도록 가정
  return json;
};




const postReview = async ({ key, rating, text }) => {
  const token = getToken();
  if (!token) throw new Error("로그인 후 작성할 수 있습니다.");
  const payload = {
    key, rating, text,
    ts: new Date().toISOString().slice(0,16).replace("T"," "),
    clientId: getClientId(),
  };
  const r = await fetch(`/api/route/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return await requireJson(r); // { item } 만 허용, 아니면 throw
};




// 기존: const reloadReviews = async ({ resetPage = true } = {}) => {
const reloadReviews = async ({ resetPage = true, page } = {}) => {
  const key = reviewKeyOf(modalStation, modalMode);
  if (!key) return;

  const pageToLoad = resetPage ? 1 : (page ?? rvPage + 1); // ← 확실히 어떤 페이지를 읽을지 결정
  setRvLoading(true); setRvError("");

  try {
    const res = await fetchReviews({ key, page: pageToLoad, size: 5 });
    const norm = (arr = []) =>
      arr.map((it) => ({
        ...it,
        user: it.user ?? it.userName ?? "",         // 표시에 쓸 이름
        createdAt: it.createdAt ?? it.ts ?? "",     // 생성시각
        updatedAt: it.updatedAt ?? "",  // 수정시각
      }));
    setRvPage(pageToLoad);
    setRvItems((prev) => resetPage ? norm(res.items) : [...prev, ...norm(res.items)]);

    setRvHasMore(Boolean(res.hasMore) && (res.items?.length ?? 0) > 0);
    setRvAvg(res.avg || 0);
    setRvCount(prev =>
      res.count ?? (resetPage ? (res.items?.length ?? 0) : prev + (res.items?.length ?? 0))
    );
  } catch (e) {
    setRvError(e.message || "리뷰를 불러오지 못했습니다.");
  } finally {
    setRvLoading(false);
  }
};

////

  // ✅ 추천 개수
  const [nearestCount, setNearestCount] = useState(5);

//// 평균유가
// --- 새로 추가/수정 ---
const PRICE_DIFF_THRESH = 30; // 원 단위 임계값
// ── 유종 색상 기준 (휘발유=B027, 경유=D047, LPG=K015)
const BASIS_KEY = "route.priceBasis.v1";
const [priceBasis, setPriceBasis] = useState(() => {
  try { return localStorage.getItem(BASIS_KEY) || "B027"; } catch { return "B027"; }
});
useEffect(() => { try { localStorage.setItem(BASIS_KEY, priceBasis); } catch {} }, [priceBasis]);

// 최신 값을 이벤트 리스너에서도 쓰기 위한 ref
const priceBasisRef = useRef(priceBasis);
useEffect(() => { priceBasisRef.current = priceBasis; }, [priceBasis]);

// --- 새로 추가 ---
const basisLabel = (k) => ({ B027: "휘발유", D047: "경유", K015: "LPG" }[k] || k);

// 유종별 diff로 마커 타입 계산 (싸면 oil-cheap, 비싸면 oil-exp, 아니면 기본 cat)
const markerTypeByBasis = (gs, cat, basis) => {
  const d = parseNum(gs?.diff?.[basis]);
  if (!Number.isFinite(d)) return cat;               // diff 없으면 기본색
  if (d <= -PRICE_DIFF_THRESH) return "oil-cheap";   // 평균보다 30원 이상 저렴
  if (d >=  PRICE_DIFF_THRESH) return "oil-exp";     // 평균보다 30원 이상 비쌈
  return cat;                                        // 그 외: 기본색(oil/lpg)
};



  // ✅ 카테고리 & 필터
  const [activeCat, setActiveCat] = useState("oil");
  const defaultFilters = () => ({
    ev: { enabled: false, status: "any", type: "any" },
    oil: { enabled: true },
    lpg: { enabled: false },
  });
  const [filters, setFilters] = useState(defaultFilters());

  /** EV 가능 집합 */
  const [evAvailSet, setEvAvailSet] = useState(null); // Set<string> | null

  /** 작은 칩 */
  const YnChip = ({ label, val }) => {
    const on = /^(Y|1|T|TRUE)$/i.test(String(val ?? "").trim());
    return (
      <span style={{
        display: "inline-block", padding: "2px 8px", borderRadius: 999,
        fontSize: 12, marginRight: 6, marginBottom: 6,
        background: on ? "#27ae60" : "#bdc3c7", color: "#fff",
      }}>
        {label}{on ? "" : " 없음"}
      </span>
    );
  };

  // 상태 → ref 미러
  const activeCatRef = useRef(activeCat);
  const filtersRef = useRef(filters);
  const evAvailSetRef = useRef(evAvailSet);
  const nearestCountRef = useRef(nearestCount);
  useEffect(() => { activeCatRef.current = activeCat; }, [activeCat]);
  useEffect(() => { filtersRef.current = filters; }, [filters]);
  useEffect(() => { evAvailSetRef.current = evAvailSet; }, [evAvailSet]);
  useEffect(() => { nearestCountRef.current = nearestCount; }, [nearestCount]);


  // ───────── 모달 드래그 ─────────
 const [modalDelta, setModalDelta] = useState({ dx: 0, dy: 0 });
 const [rvModalDelta, setRvModalDelta] = useState({ dx: 0, dy: 0 }); // ★ 리뷰 모달 드래그
 const rvDragRef = useRef({ dragging: false, startX: 0, startY: 0, baseDx: 0, baseDy: 0 });
 useEffect(() => { if (reviewModalOpen) setRvModalDelta({ dx: 0, dy: 0 }); }, [reviewModalOpen]);

 const onRvDragStart = (e) => {
   const pt = e.touches ? e.touches[0] : e;
   rvDragRef.current = {
     dragging: true,
     startX: pt.clientX, startY: pt.clientY,
     baseDx: rvModalDelta.dx, baseDy: rvModalDelta.dy,
   };
   document.body.style.userSelect = "none";
   window.addEventListener("mousemove", onRvDragMove);
   window.addEventListener("mouseup", onRvDragEnd);
   window.addEventListener("touchmove", onRvDragMove, { passive: false });
   window.addEventListener("touchend", onRvDragEnd);
 };
 const onRvDragMove = (e) => {
   if (!rvDragRef.current.dragging) return;
   const pt = e.touches ? e.touches[0] : e;
   e.preventDefault();
   const dx = pt.clientX - rvDragRef.current.startX;
   const dy = pt.clientY - rvDragRef.current.startY;
   setRvModalDelta({ dx: rvDragRef.current.baseDx + dx, dy: rvDragRef.current.baseDy + dy });
 };
 const onRvDragEnd = () => {
   rvDragRef.current.dragging = false;
   document.body.style.userSelect = "";
   window.removeEventListener("mousemove", onRvDragMove);
   window.removeEventListener("mouseup", onRvDragEnd);
   window.removeEventListener("touchmove", onRvDragMove);
   window.removeEventListener("touchend", onRvDragEnd);
 };
 
const dragRef = useRef({ dragging: false, startX: 0, startY: 0, baseDx: 0, baseDy: 0 });

// 모달이 열릴 때마다 위치 초기화
useEffect(() => {
  if (modalOpen) setModalDelta({ dx: 0, dy: 0 });
}, [modalOpen]);

const onModalDragStart = (e) => {
  const pt = e.touches ? e.touches[0] : e;
  dragRef.current = {
    dragging: true,
    startX: pt.clientX,
    startY: pt.clientY,
    baseDx: modalDelta.dx,
    baseDy: modalDelta.dy,
  };
  document.body.style.userSelect = "none"; // 드래그 중 텍스트 선택 방지
  window.addEventListener("mousemove", onModalDragMove);
  window.addEventListener("mouseup", onModalDragEnd);
  window.addEventListener("touchmove", onModalDragMove, { passive: false });
  window.addEventListener("touchend", onModalDragEnd);
};

const onModalDragMove = (e) => {
  if (!dragRef.current.dragging) return;
  const pt = e.touches ? e.touches[0] : e;
  e.preventDefault(); // 모바일 스크롤 방지
  const dx = pt.clientX - dragRef.current.startX;
  const dy = pt.clientY - dragRef.current.startY;
  setModalDelta({ dx: dragRef.current.baseDx + dx, dy: dragRef.current.baseDy + dy });
};

const onModalDragEnd = () => {
  dragRef.current.dragging = false;
  document.body.style.userSelect = "";
  window.removeEventListener("mousemove", onModalDragMove);
  window.removeEventListener("mouseup", onModalDragEnd);
  window.removeEventListener("touchmove", onModalDragMove);
  window.removeEventListener("touchend", onModalDragEnd);
};


  /* ───────── Kakao SDK + 초기 마커 로드 ───────── */
  useEffect(() => {
    let mounted = true;

    const initMapAndMarkers = async () => {
      if (!mounted || mapRef.current) return;
      const { kakao } = window;
      const container = document.getElementById("map");
      if (!kakao?.maps || !container) return;

      const map = new kakao.maps.Map(container, {
        center: new kakao.maps.LatLng(homeCoord.lat, homeCoord.lng),
        level: 7,
      });
      mapRef.current = map;
      // ⭐️ 홈(원점) 바로 표시
      ////
      infoRef.current = new kakao.maps.InfoWindow({ removable: true });

      // (선택) 지도 클릭하면 정보창 닫기
      kakao.maps.event.addListener(map, "click", () => {
        try { infoRef.current?.close(); } catch {}
      });

      drawHomeMarker(homeCoord);

      // services 준비
      geocoderRef.current = new kakao.maps.services.Geocoder();
      placesRef.current = new kakao.maps.services.Places(map);

      // 지도 클릭 → 출발/도착 지정
      kakao.maps.event.addListener(map, "click", (e) => {
        const lat = e.latLng.getLat();
        const lng = e.latLng.getLng();
        onMapClick({ lat, lng });
      });

      // 줌 변경 시 자동 숨김
      let zoomTimer = null;
      kakao.maps.event.addListener(map, "zoom_changed", () => {
        clearTimeout(zoomTimer);
        zoomTimer = setTimeout(() => applyFiltersToMarkers(), 80);
      });

      try {
        setLoading(true);
        const [evInfoJson, oilJson, oilAvgJson] = await Promise.all([
          fetchEvInfo(),
          fetchOilInfoAll(),     // 위치/브랜드/LPG 여부 등
          fetchOilWithAverage(), // PRICES/AVG/DIFF
        ]);

        const evAll = normalizeEvInfoItems(evInfoJson);
        const evSites = aggregateEvSites(evAll);
        const oilAll = normalizeOilInfoItems(oilJson);
        const avgMap = normalizeOilAvgMap(oilAvgJson);

        // 지점 리스트에 평균/차이/가격을 merge
      const oilEnriched = oilAll.map((gs) => {
        const extra = avgMap.get(gs.uni) || {};
        return {
          ...gs,
          prices:   extra.prices   || {},
          avg:      extra.avg      || {},   // ← 기본 {}
          diff:     extra.diff     || {},   // ← 기본 {}
          updatedAt: extra.updatedAt ?? null,
          sigunCd:   extra.sigunCd   ?? null,
        };
      });


        drawEvMarkers(evSites);
        drawOilMarkers(oilEnriched);     // ← merge된 걸 넘김

        applyFiltersToMarkers();
      } catch (e) {
        console.error(e);
        alert("마커 로드 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    const ensureSdk = () =>
      new Promise((resolve, reject) => {
        if (window.kakao?.maps) return resolve();
        let s = document.getElementById("kakao-sdk");
        if (!s) {
          s = document.createElement("script");
          s.id = "kakao-sdk";
          s.async = true;
          // ✅ services 라이브러리 추가
          s.src = "https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&libraries=services&appkey=" + encodeURIComponent(KAKAO_JS_KEY);
          s.onerror = () => reject(new Error("카카오 SDK 로드 실패"));
          document.head.appendChild(s);
        }
        s.addEventListener("load", () => {
          if (!window.kakao?.maps) return reject(new Error("kakao.maps 없음"));
          window.kakao.maps.load(() => resolve());
        });
      });

    ensureSdk().then(initMapAndMarkers).catch((e) => {
      console.error(e);
      alert("지도를 준비 중입니다. 잠시 후 다시 시도해주세요.");
    });

    return () => { mounted = false; };
  }, []);

  ////평균유가-마터 아이콘 즉시 갱신
  useEffect(() => {
  const { kakao } = window;
  if (!kakao?.maps) return;

  allMarkersRef.current.forEach((o) => {
    if (o.cat === "oil" || o.cat === "lpg") {
      const newType = markerTypeByBasis(o.data, o.cat, priceBasis);
      const starred = !!(o.favKey && favSetRef.current?.has(o.favKey));
      const isActive = activeMarkerRef.current?.marker === o.marker;
      const scale = isActive ? ACTIVE_SCALE : 1;

      o.type = newType; // 내부 타입도 최신으로
      o.marker.setImage(getMarkerImage(newType, kakao, starred, scale));
      o.marker.setZIndex(isActive ? 9999 : baseZ(newType));
    }
  });
  // 색상만 바뀌므로 applyFiltersToMarkers()는 필요 없음
}, [priceBasis]);


  /* ───────── 공통 유틸 ───────── */
  // Kakao Geocoder Promises
  const coordToLabel = async (lat, lng) => {
    const { kakao } = window;
    const geocoder = geocoderRef.current;
    if (!geocoder || !kakao?.maps?.services) return `${lng.toFixed(6)},${lat.toFixed(6)}`;
    const address = await new Promise((resolve) => {
      geocoder.coord2Address(lng, lat, (result, status) => {
        if (status === kakao.maps.services.Status.OK && result?.length) {
          const r0 = result[0];
          resolve(r0.road_address?.address_name || r0.address?.address_name || null);
        } else {
          resolve(null);
        }
      });
    });
    return address || `${lng.toFixed(6)},${lat.toFixed(6)}`;
  };

  // 텍스트(프리셋/좌표/주소/장소명) → [lon, lat]
  const resolveTextToLonLat = async (text) => {
    const t = String(text || "").trim();
    if (!t) throw new Error("입력이 비어 있습니다.");
    if (PRESET[t]) return PRESET[t];

    if (t.includes(",")) {
      const [lonS, latS] = t.split(",").map((v) => Number(v.trim()));
      if (Number.isFinite(lonS) && Number.isFinite(latS)) return [lonS, latS];
    }

    const { kakao } = window;
    const geocoder = geocoderRef.current;
    const places = placesRef.current || (kakao?.maps?.services ? new kakao.maps.services.Places(mapRef.current || null) : null);

    // 1) 주소 검색
    if (geocoder && kakao?.maps?.services) {
      const hit = await new Promise((resolve) => {
        geocoder.addressSearch(t, (result, status) => {
          if (status === kakao.maps.services.Status.OK && result?.[0]) resolve(result[0]);
          else resolve(null);
        });
      });
      if (hit) return [parseNum(hit.x), parseNum(hit.y)];
    }

    // 2) 키워드(장소명) 검색
    if (places && kakao?.maps?.services) {
      const center = mapRef.current?.getCenter?.();
      const opt = center ? { location: center } : undefined;
      const poi = await new Promise((resolve) => {
        places.keywordSearch(t, (res, status) => {
          if (status === kakao.maps.services.Status.OK && res?.[0]) resolve(res[0]);
          else resolve(null);
        }, opt);
      });
      if (poi) return [parseNum(poi.x), parseNum(poi.y)];
    }

    throw new Error(`좌표/주소/장소를 찾지 못했습니다: ${t}`);
  };

  // 출발지 마커 교체
  const replaceOriginPin = ({ lat, lng, name = "출발" }) => {
    if (!mapRef.current || !window.kakao?.maps) return;
    if (odRef.current.origin) { odRef.current.origin.setMap(null); odRef.current.origin = null; }
    if (odRef.current.originLabel) { odRef.current.originLabel.setMap(null); odRef.current.originLabel = null; }

    const { kakao } = window;
    const { marker, overlay } = addLabeledMarker({
      map: mapRef.current,
      kakao,
      type: "origin",
      lat, lng,
      name,
      labelAlways: true,
    });
    odRef.current.origin = marker;
    odRef.current.originLabel = overlay;
    overlay.setMap(mapRef.current);
  };

  // 목적지 마커 교체
  const replaceDestPin = ({ lat, lng, name = "도착" }) => {
    if (!mapRef.current || !window.kakao?.maps) return;
    if (odRef.current.dest) { odRef.current.dest.setMap(null); odRef.current.dest = null; }
    if (odRef.current.destLabel) { odRef.current.destLabel.setMap(null); odRef.current.destLabel = null; }

    const { kakao } = window;
    const { marker, overlay } = addLabeledMarker({
      map: mapRef.current,
      kakao,
      type: "dest",
      lat, lng,
      name,
      labelAlways: true,
    });
    odRef.current.dest = marker;
    odRef.current.destLabel = overlay;
    overlay.setMap(mapRef.current);
  };

  const clearDetourOnly = () => {
    if (viaRef.current) { viaRef.current.setMap(null); viaRef.current = null; }
    setDetourSummary("");
  };
  const clearRouteOnly = () => {
    if (polyRef.current) { polyRef.current.setMap(null); polyRef.current = null; }
    clearDetourOnly();
    if (odRef.current.origin) { odRef.current.origin.setMap(null); odRef.current.origin = null; }
    if (odRef.current.originLabel) { odRef.current.originLabel.setMap(null); odRef.current.originLabel = null; }
    if (odRef.current.dest) { odRef.current.dest.setMap(null); odRef.current.dest = null; }
    if (odRef.current.destLabel) { odRef.current.destLabel.setMap(null); odRef.current.destLabel = null; }
    setSummary("");
    routeCtxRef.current = null;
  };
  const handleClearAll = () => {
    clearRouteOnly();
    applyFiltersToMarkers();
  };

  // 홈 이동
  const resetAllToInitial = () => {
    clearRouteOnly();
    setOriginInput("휴먼교육센터");
    setDestInput("천안아산역");
    setSummary("");
    setDetourSummary("");
    setActiveCat("oil");
    setFilters(defaultFilters());
    setEvAvailSet(null);
    setNearestCount(5);
    setIsMapEdit(false);
    setClickMode("origin");
    setModalOpen(false);
    routeCtxRef.current = null;
  };

  const handleGoHome = () => {
    try {
      if (!window.kakao?.maps || !mapRef.current) {
        alert("지도가 준비되지 않았습니다.");
        return;
      }
      resetAllToInitial();
      // ✅ 저장된 원점으로 카메라 이동 (없으면 기본값)
      const { lat, lng } = homeCoord || { lat: 36.807313, lng: 127.147169 };
      mapRef.current.setLevel(7);
      mapRef.current.setCenter(new window.kakao.maps.LatLng(lat, lng));
      setTimeout(() => applyFiltersToMarkers(), 0);
    } catch (e) {
      console.error(e);
    }
  };
  // 원점 초기화 (로컬스토리지 삭제 + 기본 좌표 복귀)
const handleResetHome = () => {
  try { localStorage.removeItem(HOME_KEY); } catch {}
  const [defLng, defLat] = PRESET["휴먼교육센터"] ?? [127.147169, 36.807313];
  const def = { lat: defLat, lng: defLng };

  setHomeCoord(def);        // 상태 업데이트
  drawHomeMarker(def);      // 지도상의 홈 마커 갱신

  if (mapRef.current && window.kakao?.maps) {
    mapRef.current.setCenter(new window.kakao.maps.LatLng(def.lat, def.lng));
    mapRef.current.setLevel(7);
  }

  setSummary("원점이 기본 좌표로 초기화되었습니다.");
};


  const havKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  };
  const minDistanceKmFromPath = (pathLatLng, lon, lat) => {
    let min = Infinity;
    for (let i = 0; i < pathLatLng.length; i++) {
      const p = pathLatLng[i];
      const d = havKm(p.getLat(), p.getLng(), lat, lon);
      if (d < min) min = d;
    }
    return min;
  };

  /* ───────── 라우팅 ───────── */
  const fetchOsrm = async (origin, dest) => {
    const url = `${OSRM}/route/v1/driving/${origin[0]},${origin[1]};${dest[0]},${dest[1]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OSRM 오류: ${res.status}`);
    const json = await res.json();
    if (!json.routes?.length) throw new Error("경로가 없습니다.");
    return json.routes[0];
  };
  const fetchOsrmVia = async (origin, via, dest) => {
    const url = `${OSRM}/route/v1/driving/${origin[0]},${origin[1]};${via[0]},${via[1]};${dest[0]},${dest[1]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OSRM 오류(경유): ${res.status}`);
    const json = await res.json();
    if (!json.routes?.length) throw new Error("경유 경로가 없습니다.");
    return json.routes[0];
  };

  /* ───────── API ───────── */
  const fetchEvInfo = async () => {
    const res = await fetch(`/api/route/ev/info`);
    if (!res.ok) throw new Error(`EV info 오류: ${res.status}`);
    return res.json();
  };
  const fetchEvAvailableStatIds = async ({ type, zcode } = {}) => {
    const qs = new URLSearchParams();
    if (type && type !== "any") qs.set("type", type);
    if (zcode) qs.set("zcode", zcode);
    const url = `/api/route/ev/status/available${qs.toString() ? `?${qs.toString()}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`EV available 오류: ${res.status}`);
    const json = await res.json();
    const raw = json?.items?.item ?? json?.statIds ?? json?.list ?? [];
    const ids = Array.isArray(raw)
      ? raw.map((x) => (typeof x === "string" ? x : (x?.statId || x?.STATID || x?.id))).filter(Boolean)
      : [];
    return new Set(ids.map(String));
  };
  const fetchOilInfoAll = async () => {
    const res = await fetch(`/api/route/oil/info`);
    if (!res.ok) throw new Error(`/oil/info 오류: ${res.status}`);
    return res.json();
  };
  const fetchOilPriceByUni = async (uni) => {
    const res = await fetch(`/api/route/oil/price?id=${encodeURIComponent(uni)}`);
    if (!res.ok) throw new Error(`/oil/price 오류: ${res.status}`);
    return res.json();
  };

  /* ───────── 표기 유틸 ───────── */
  ////통일 모달
   const statusText = (s) => {
   const code = (String(s ?? "").trim() || "9");   // 빈 값 → 9(미확인)
   return ({
     "1": "통신이상", "2": "충전가능", "3": "충전중",
     "4": "운영중지", "5": "점검중", "9": "미확인", "0": "미확인"
   }[code]) || "미확인";
 };
 const statusBadgeStyle = (s) => {
   const code = (String(s ?? "").trim() || "9");
    let bg = "#999";
    if (code === "2") bg = "#27ae60";
    else if (code === "3") bg = "#f39c12";
    else if (code === "5") bg = "#e74c3c";
    else if (code === "4" || code === "1" || code === "9") bg = "#7f8c8d";
    return { display: "inline-block", padding: "2px 8px", borderRadius: 999, background: bg, color: "#fff", fontSize: 12 };
  };

  /* ───────── 정규화 ───────── */
  const normalizeEvInfoItems = (json) => {
    const items = json?.items?.item || json?.items || json?.data || json?.list || json?.Item || [];
    const arr = Array.isArray(items) ? items : [items];
    return arr
      .map((o) => ({
        lat: parseNum(o.lat ?? o.y ?? o.wgs84Lat ?? o.LAT),
        lng: parseNum(o.lng ?? o.x ?? o.wgs84Lon ?? o.LON),
        name: o.statNm || o.csNm || o.name || o.addr || "",
        statId: o.statId || o.csId || o.id || o.STAT_ID,
        addr: o.addr || o.address || o.ADDR || "",
        chgerType: String(o.chgerType ?? o.CHGER_TYPE ?? o.type ?? o.TYPE ?? ""),
        usetime: o.useTime ?? o.USETIME ?? "",
        floornum: o.floorNum ?? o.FLOORNUM ?? "",
        floortype: o.floorType ?? o.FLOORTYPE ?? "",
        businm: o.busiNm ?? o.BUSINM ?? "",
        busicall: o.busiCall ?? o.BUSICALL ?? "",
      }))
      .filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lng));
  };
  const normalizeOilInfoItems = (json) => {
    const raw = Array.isArray(json)
      ? json
      : (json?.response?.body?.items ?? json?.items?.item ?? json?.items ?? json?.list ?? json?.data ?? json?.OIL ?? json?.RESULT?.OIL ?? json?.rows ?? []);
    const arr = Array.isArray(raw) ? raw : [raw].filter(Boolean);
    const MERC3857 =
      "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs";

    const out = [];
    for (const o of arr) {
      let lat = parseNum(o.lat ?? o.LAT ?? o.wgs84Lat ?? o.WGS84_Y ?? o.GPS_LAT);
      let lng = parseNum(o.lon ?? o.LON ?? o.wgs84Lon ?? o.WGS84_X ?? o.GPS_LON);

      if (!isKoreaWgs(lat, lng)) {
        const Xw = parseNum(o.xWeb ?? o.xweb ?? o.x_web ?? o.X);
        const Yw = parseNum(o.yWeb ?? o.yweb ?? o.y_web ?? o.Y);
        if (Number.isFinite(Xw) && Number.isFinite(Yw)) {
          const looksMerc = Math.abs(Xw) > 1e6 || Math.abs(Yw) > 1e6;
          if (looksMerc) {
            try {
              const [lng2, lat2] = proj4(MERC3857, proj4.WGS84, [Xw, Yw]);
              if (isKoreaWgs(lat2, lng2)) { lat = lat2; lng = lng2; }
            } catch {}
          } else if (isKoreaWgs(Yw, Xw)) { lat = Yw; lng = Xw; }
        }
      }
      if (!isKoreaWgs(lat, lng)) {
        const x = parseNum(o.xKatec ?? o.xkatec ?? o.X_KATEC ?? o.GIS_X_COOR ?? o.KATEC_X);
        const y = parseNum(o.yKatec ?? o.ykatec ?? o.Y_KATEC ?? o.GIS_Y_COOR ?? o.KATEC_Y);
        if (Number.isFinite(x) && Number.isFinite(y)) {
          const p = tmToWgs(x, y);
          if (p) { lat = p.lat; lng = p.lng; }
        }
      }
      if (!isKoreaWgs(lat, lng)) continue;

      out.push({
        lat, lng,
        name: o.name ?? o.OS_NM ?? o.STATION_NM ?? o.NM ?? o.BIZPLC_NM ?? o.NEW_ADR ?? o.addr ?? "",
        uni: String(o.uniCd ?? o.UNI_CD ?? o.uni ?? o.UNI ?? ""),
        addr: o.addr ?? o.addrOld ?? o.NEW_ADR ?? o.VAN_ADR ?? "",
        tel: o.tel ?? o.TEL ?? "",
        brand: o.brand ?? o.POLL_DIV_CO ?? "",
        self: o.selfYn ?? o.SELF_YN ?? o.self_yn ?? "",
        brandGroup: o.brandGroup ?? o.BRAND_GROUP ?? "",
        cvsYn: o.cvsYn ?? o.cvs_yn ?? o.CVS_YN ?? "",
        carWashYn: o.carWashYn ?? o.car_wash_yn ?? o.CAR_WASH_YN ?? "",
        maintYn: o.maintYn ?? o.maint_yn ?? o.MAINT_YN ?? "",
        kpetroYn: o.kpetroYn ?? o.kpetro_yn ?? o.KPETRO_YN ?? "",
        lpgYn: o.lpgYn ?? o.lpg_yn ?? o.LPG_YN ?? "",
        open24hYn: o.open24hYn ?? o.open_24h_yn ?? o.OPEN_24H_YN ?? "",
      });
    }
    return out;
  };

  ////통일 모달
  /* ───────── 마커 그리기 ───────── */
  // drawEvMarkers 위에 아무데나
const statIdsOfSite = (site) =>
  Array.isArray(site?.statIds) && site.statIds.length
    ? site.statIds.map(String)
    : (site?.statId ? [String(site.statId)] : []);

  const drawEvMarkers = (list) => {
    if (!mapRef.current) return;
    const { kakao } = window;

    list.forEach((it) => {
      const favKey = favKeyOf(it, "ev");
      const starred0 = !!(favKey && favSetRef.current?.has(favKey));
      const label = it.chargerCount ? `${it.name || "EV"} (${it.chargerCount}기)` : (it.name || "EV");

      const { marker, overlay } = addLabeledMarker({
        map: mapRef.current, kakao, type: "ev",
        lat: it.lat, lng: it.lng, name: label,
        labelAlways: LABEL_ALWAYS,
        starred: starred0,
      });

    kakao.maps.event.addListener(marker, "click", async () => {
  const pos = new kakao.maps.LatLng(it.lat, it.lng);

  // 선택 마커 하이라이트 유지
  const starredNow = !!(favKey && favSetRef.current?.has(favKey));
  //setActiveMarker({ marker, type: "ev", starred: starredNow, overlay });

    // A) 우측 상단 즐겨찾기 버튼 HTML
  const favBtnHtml = (on) => `
    <button class="fav-btn ${on ? "on" : ""}"
            ${isLoggedIn() ? "" : "disabled"}
            title="${isLoggedIn() ? (on ? "즐겨찾기 해제" : "즐겨찾기 추가") : "로그인 필요"}"
            style="border:none;background:transparent;font-size:18px;line-height:1;
                   ${isLoggedIn() ? "cursor:pointer;" : "cursor:not-allowed;opacity:.5"}">
      ${on ? "★" : "☆"}
    </button>`;

  // ── 기본 칩(총 기수/급속/완속) + "상태 불러오는 중..."을 먼저 그림
  const chips = `
    <div class="info-flags">
      ${Number(it.chargerCount) ? `<span class="flag on">총 ${it.chargerCount}기</span>` : ""}
      ${it.hasDc ? `<span class="flag on">⚡ 급속(DC)</span>` : `<span class="flag">급속 없음</span>`}
      ${it.hasAc ? `<span class="flag on">🔌 완속(AC)</span>` : `<span class="flag">완속 없음</span>`}
    </div>
  `;

    // B) 헤더: 제목은 한 줄 고정 + ellipsis, 우측에 ★
  const baseHtml = `
    <div class="info-window">
      <div style="display:flex;align-items:center;gap:8px;justify-content:space-between;">
        <div style="flex:1;min-width:0;">
          <div class="info-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${escapeHtml(it.name || "충전소")}
          </div>
        </div>
        ${favBtnHtml(starredNow)}
      </div>
      ${it.addr     ? `<div class="info-row">📍 ${escapeHtml(it.addr)}</div>` : ""}
      ${it.usetime  ? `<div class="info-row">⏰ ${escapeHtml(it.usetime)}</div>` : ""}
      ${it.businm   ? `<div class="info-row">👤 운영사: ${escapeHtml(it.businm)}</div>` : ""}
      ${(it.floornum || it.floortype)
        ? `<div class="info-row">🏢 설치층: ${escapeHtml(it.floornum || "-")} / ${escapeHtml(floorTypeName(it.floortype))}</div>`
        : ""}
      ${chips}
      <div class="info-row" id="ev-status-line">상태 불러오는 중…</div>
    </div>
  `.trim();

    setInfoHtml(baseHtml, marker, (root) => {
   const btn = root.querySelector(".fav-btn");
   if (!btn) return;
   btn.addEventListener("click", async (e) => {
     e.stopPropagation();
     if (!isLoggedIn()) { alert("로그인 후 이용 가능합니다."); return; }
     await toggleFavForStation(it, "ev");
     const on = favSetRef.current?.has(favKey);
     btn.textContent = on ? "★" : "☆";
     btn.classList.toggle("on", on);
     setActiveMarker({ marker, type: "ev", starred: on, overlay });
   });
 });
  mapRef.current.panTo(pos);

    // C) 버튼 바인딩(기본 화면)
  {
    const root = infoRef.current.getContent?.();
    const btn = root?.querySelector?.(".fav-btn");
    if (btn) {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!isLoggedIn()) { alert("로그인 후 이용 가능합니다."); return; }
        await toggleFavForStation(it, "ev");
        const on = favSetRef.current?.has(favKey);
        btn.textContent = on ? "★" : "☆";
        btn.classList.toggle("on", on);
        // active 마커 외형도 즉시 반영
        setActiveMarker({ marker, type: "ev", starred: on, overlay });
      });
    }
  }

  // 경유/도착 미리보기는 병렬로
  //// 통일모달
  //drawDetourForPoint(it).catch(() => {});

  // ── ★ 여기서 상태를 불러와 인포윈도우 내용을 갱신
  try {
    const ids = statIdsOfSite(it);
    if (!ids.length) throw new Error("STAT_ID 없음");
    const url = `/api/route/ev/status/by-station?statIds=${encodeURIComponent(ids.join(","))}`;
    const data = await (await fetch(url)).json();
    const list = normalizeEvStatusForModal(data); // ← 이미 파일 하단에 정의되어 있음

   // 상태 응답 기준으로 총대수/급속/완속 재계산
  // 상태 응답 기준으로 "충전가능" 개수/급속/완속 재계산
  const availableCount =
    list.filter(c => (String(c.status ?? "").trim() || "9") === "2").length;

   const hasDc = list.some(c => ["01","03","04","05","06","08","09"]
                     .includes(String(c.type).padStart(2,"0")));
   const hasAc = list.some(c => ["02","03","06","07","08"]
                     .includes(String(c.type).padStart(2,"0")));
   const chips2 = `
     <div class="info-flags">
       <span class="flag ${availableCount ? "on" : ""}">
        충전가능 ${availableCount}기
       </span>
       ${hasDc ? `<span class="flag on">⚡ 급속(DC)</span>` : `<span class="flag">급속 없음</span>`}
       ${hasAc ? `<span class="flag on">🔌 완속(AC)</span>` : `<span class="flag">완속 없음</span>`}
     </div>
   `;

   // 최신 업데이트 시간만 추출
  let latestTs = "";
  for (const c of list) {
    const t = String(c.lastTs || "").trim();
    if (t && (!latestTs || new Date(t.replace(" ","T")) > new Date(latestTs.replace(" ","T")))) {
      latestTs = t;
    }
  }
  const updatedText = latestTs ? fmtTs(latestTs) : "";

      // ---------- 충전 포트 카드 UI ----------
  const statusPill = (s) => {
    const code = String(s ?? "9");
    let bg = "#999";
    if (code === "2") bg = "#27ae60";     // 충전가능
    else if (code === "3") bg = "#f39c12"; // 충전중
    else if (code === "5") bg = "#e74c3c"; // 점검중
    else if (code === "4" || code === "1" || code === "9") bg = "#7f8c8d";
    return `<span style="
      display:inline-block;padding:3px 8px;border-radius:999px;
      font-size:12px;color:#fff;background:${bg};
    ">${escapeHtml(statusText(code))}</span>`;
  };

  const rowsHtml = list.map((c) => `
    <div style="
      display:flex;align-items:center;justify-content:space-between;
      gap:10px;margin:6px 0;padding:8px 10px;border:1px solid #f0f0f0;
      border-radius:10px;background:#fafafa;
    ">
      <div style="display:flex;align-items:center;gap:10px;min-width:0">
        <span style="
          display:inline-block;min-width:44px;text-align:center;
          font-weight:700;color:#444;background:#fff;border:1px solid #eaeaea;
          padding:4px 8px;border-radius:8px;
        ">#${escapeHtml(c.chgerId)}</span>
        <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          <span style="color:#666;margin-left:6px;font-size:12px;">
            ${escapeHtml(chargerTypeName(c.type) || "-")}
          </span>
        </span>
      </div>
      <div>${statusPill(c.status)}</div>
    </div>
  `).join("");

        const nowStar = !!(favKey && favSetRef.current?.has(favKey));
    const html = `
      <div class="info-window">
        <div style="display:flex;align-items:center;gap:8px;justify-content:space-between;">
          <div style="flex:1;min-width:0;">
            <div class="info-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              ${escapeHtml(it.name || "충전소")}
            </div>
          </div>
          ${favBtnHtml(nowStar)}
        </div>
        ${it.addr     ? `<div class="info-row">📍 ${escapeHtml(it.addr)}</div>` : ""}
        ${it.usetime  ? `<div class="info-row">⏰ ${escapeHtml(it.usetime)}</div>` : ""}
        ${it.businm   ? `<div class="info-row">👤 운영사: ${escapeHtml(it.businm)}</div>` : ""}
        ${(it.floornum || it.floortype)
          ? `<div class="info-row">🏢 설치층: ${escapeHtml(it.floornum || "-")} / ${escapeHtml(floorTypeName(it.floortype))}</div>`
          : ""}
        ${chips2}
         <div class="info-row"><strong>업데이트</strong>: ${updatedText || "-"}</div>
       ${rowsHtml ? `
        <div style="margin-top:8px">
          <div style="font-size:12px;color:#666;margin:2px 0 6px">충전 포트 상세</div>
          <div style="max-height:200px;overflow:auto">${rowsHtml}</div>
        </div>` : ""
       }
      </div>
    `.trim();

     setInfoHtml(html, marker, (root) => {
   const btn = root.querySelector(".fav-btn");
   if (!btn) return;
   btn.addEventListener("click", async (e) => {
     e.stopPropagation();
     if (!isLoggedIn()) { alert("로그인 후 이용 가능합니다."); return; }
     await toggleFavForStation(it, "ev");
     const on = favSetRef.current?.has(favKey);
     btn.textContent = on ? "★" : "☆";
     btn.classList.toggle("on", on);
     setActiveMarker({ marker, type: "ev", starred: on, overlay });
   });
 });
  } catch (e) {
    // 실패 시 안내
    const failHtml = `
      <div class="info-window">
        <div class="info-title">${escapeHtml(it.name || "충전소")}</div>
        ${chips}
        <div class="info-row" style="color:#c0392b">⚠️ 상태 조회 실패</div>
      </div>
    `.trim();
    setInfoHtml(failHtml, marker);
  }
    });



      allMarkersRef.current.push({ marker, overlay, type: "ev", cat: "ev", lat: it.lat, lng: it.lng, data: it, favKey });
    });
  };

  const drawOilMarkers = (list) => {
  if (!mapRef.current) return;
  const { kakao } = window;

  list.forEach((gs) => {
    const isLpg = /^(Y|1|T|TRUE)$/i.test(String(gs.lpgYn ?? ""));
    const cat = isLpg ? "lpg" : "oil";

    // B027(휘발유) 우선, 없으면 D047(경유)
    ////선택한 유종 기준으로 색상 결정 (oil/lpg 공통)
  let markerType = markerTypeByBasis(gs, cat, priceBasisRef.current);

    const favKey = favKeyOf(gs, "oil");
    const starred0 = !!(favKey && favSetRef.current?.has(favKey));

    const { marker, overlay } = addLabeledMarker({
      map: mapRef.current, kakao, type: markerType,
      lat: gs.lat, lng: gs.lng,
      name: gs.name || (cat === "lpg" ? "LPG" : "주유소"),
      labelAlways: LABEL_ALWAYS,
      starred: starred0,
    });

    kakao.maps.event.addListener(marker, "click", async () => {
      const pos = new kakao.maps.LatLng(gs.lat, gs.lng);

      // 선택 마커 하이라이트 유지
      const starredNow = !!(favKey && favSetRef.current?.has(favKey));
      //setActiveMarker({ marker, type: markerType, starred: starredNow, overlay });

      {
       const basisNow = priceBasisRef.current;
       const curType = markerTypeByBasis(gs, cat, basisNow);
       setActiveMarker({ marker, type: curType, starred: starredNow, overlay });
      }
      const favBtnHtml = (on) => `
        <button class="fav-btn ${on ? "on" : ""}"
                ${isLoggedIn() ? "" : "disabled"}
                title="${isLoggedIn() ? (on ? "즐겨찾기 해제" : "즐겨찾기 추가") : "로그인 필요"}"
                style="border:none;background:transparent;font-size:18px;line-height:1;
                       ${isLoggedIn() ? "cursor:pointer;" : "cursor:not-allowed;opacity:.5"}">
          ${on ? "★" : "☆"}
        </button>`;

      // 편의시설 플래그(가격과 무관하게 먼저 그림)
      const flags = {
        세차장: /^(Y|1|T|TRUE)$/i.test(String(gs.carWashYn ?? "")),
        편의점: /^(Y|1|T|TRUE)$/i.test(String(gs.cvsYn ?? "")),
        경정비: /^(Y|1|T|TRUE)$/i.test(String(gs.maintYn ?? "")),
        셀프주유소: /^(Y|1|T|TRUE)$/i.test(String(gs.self ?? "")),
        품질인증주유소: /^(Y|1|T|TRUE)$/i.test(String(gs.kpetroYn ?? "")),
        "24시간": /^(Y|1|T|TRUE)$/i.test(String(gs.open24hYn ?? "")),
        LPG충전소: /^(Y|1|T|TRUE)$/i.test(String(gs.lpgYn ?? "")),
      };

      const stationName = gs.name || "이름없음";
      const addr = gs.addr || "";
      const brand = brandName(gs.brand || "");

      // (A) 기본 화면: 가격 로딩 전 즉시 표시
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
         ${oilAvgPairPanel(gs, { lpgOnly: isLpg })}  <!-- ✅ 휘발유/경유 평균 패널 -->
          <div class="price-box">가격 불러오는 중…</div>
          <div class="info-flags">
            ${Object.entries(flags)
              .map(([k, v]) => `<span class="flag ${v ? "on" : ""}">${k}</span>`)
              .join("")}
          </div>
        </div>`.trim();

      setInfoHtml(baseHtml, marker, (root) => {
        const btn = root.querySelector(".fav-btn");
        if (btn) {
          btn.addEventListener("click", async (e) => {
            e.stopPropagation();
            if (!isLoggedIn()) { alert("로그인 후 이용 가능합니다."); return; }
            await toggleFavForStation(gs, "oil");
            const on = favSetRef.current?.has(favKey);
            btn.textContent = on ? "★" : "☆";
            btn.classList.toggle("on", on);
            setActiveMarker({ marker, type: markerType, starred: on, overlay });
          });
        }
      });

     mapRef.current.panTo(pos);

      // (B) 가격 로드 후 업데이트
      let oilHtml = "";
      try {
        const r = await fetch(`/api/route/oil/price?id=${encodeURIComponent(gs.uni)}`);
        if (!r.ok) throw new Error();
        const j = await r.json();
        const arr = normalizeOilPriceItems(j, gs.uni);
        const priceMap = {};
        for (const it of arr) priceMap[it.product] = it.price;

        if (priceMap["휘발유"] || priceMap["경유"] || priceMap["자동차용 LPG"] || priceMap["등유"]) {
          oilHtml = `
            <div class="price-box">
              ${priceMap["휘발유"]       ? `<div class="price-row"><span>⛽ 휘발유</span><b>${priceMap["휘발유"].toLocaleString()}원</b></div>` : ""}
              ${priceMap["경유"]         ? `<div class="price-row"><span>🛢 경유</span><b>${priceMap["경유"].toLocaleString()}원</b></div>` : ""}
              ${priceMap["등유"]         ? `<div class="price-row"><span>🏠 등유</span><b>${priceMap["등유"].toLocaleString()}원</b></div>` : ""}
              ${priceMap["자동차용 LPG"] ? `<div class="price-row"><span>🔥 LPG</span><b>${priceMap["자동차용 LPG"].toLocaleString()}원</b></div>` : ""}
            </div>`;
        } else {
          oilHtml = `<div class="price-box">⚠️ 가격 등록이 안됐습니다.</div>`;
        }
      } catch {
        oilHtml = `<div class="price-error">⚠️ 가격 정보를 불러오지 못했습니다.</div>`;
      }

      const nowStar = !!(favKey && favSetRef.current?.has(favKey));
      const html2 = `
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
          ${oilAvgPairPanel(gs, { lpgOnly: isLpg })}  <!-- ✅ 휘발유/경유 평균 패널 -->
          ${oilHtml}
          <div class="info-flags">
            ${Object.entries(flags)
              .map(([k, v]) => `<span class="flag ${v ? "on" : ""}">${k}</span>`)
              .join("")}
          </div>
        </div>`.trim();

      setInfoHtml(html2, marker, (root) => {
        const btn = root.querySelector(".fav-btn");
        if (btn) {
          btn.addEventListener("click", async (e) => {
            e.stopPropagation();
            if (!isLoggedIn()) { alert("로그인 후 이용 가능합니다."); return; }
            await toggleFavForStation(gs, "oil"); // ← oil 모드
            const on = favSetRef.current?.has(favKey);
            btn.textContent = on ? "★" : "☆";
            btn.classList.toggle("on", on);
            setActiveMarker({ marker, type: markerType, starred: on, overlay });
          });
        }
      });

      // 경유/도착 미리 보기 유지
      try { await drawDetourForPoint(gs); } catch {}
    });

    allMarkersRef.current.push({ marker, overlay, type: markerType, cat, lat: gs.lat, lng: gs.lng, data: gs, favKey });
  });
};


  /* ───────── 필터/자동숨김 적용 ───────── */
  const matchesOilSubFilters = (_gs) => true;

  const matchesEvSubFilters = (site) => {
    const f = filtersRef.current.ev;
    const availSet = evAvailSetRef.current;

    if (f.status === "available") {
      if (!availSet || availSet.size === 0) return false;
      const hit = (site.statIds || []).some((id) => availSet.has(String(id)));
      if (!hit) return false;
      return true;
    }

    if (f.type === "dc") return !!site.hasDc;
    if (f.type === "ac") return !!site.hasAc;
    if (f.type === "combo") return !!(site.hasDc && site.hasAc);
    return true;
  };

  const matchesFilter = (obj) => {
    const cat = obj.cat;
    const curCat = activeCatRef.current;
    if (cat !== curCat) return false;

    const curFilters = filtersRef.current;
    if (cat === "ev" && !curFilters.ev.enabled) return false;
    if (cat === "oil" && !curFilters.oil.enabled) return false;
    if (cat === "lpg" && !curFilters.lpg.enabled) return false;

    if (!polyRef.current && mapRef.current) {
      const lvl = mapRef.current.getLevel();
      if (cat === "oil" && lvl >= AUTO_HIDE_LEVEL.oil) return false;
      if (cat === "lpg" && lvl >= AUTO_HIDE_LEVEL.lpg) return false;
      if (cat === "ev" && lvl >= AUTO_HIDE_LEVEL.ev) return false;
    }

    if (cat === "ev" && !matchesEvSubFilters(obj.data)) return false;
    if (cat === "oil" && !matchesOilSubFilters(obj.data)) return false;

    return true;
  };

  /** 현재 필터/줌 기준 적용 */
  const applyFiltersToMarkers = () => {
    const arr = allMarkersRef.current;
    const ctx = routeCtxRef.current;

    // 출발지만 있는 모드
    if (ctx && ctx.origin && !ctx.path) {
      arr.forEach((o) => (o._ok = matchesFilter(o)));
      arr.forEach((o) => {
        o._dist = o._ok ? havKm(ctx.origin[1], ctx.origin[0], o.lat, o.lng) : Infinity;
      });

      const keep = new Set(
        arr
          .filter((o) => o._ok && o.cat === activeCatRef.current)
          .sort((a, b) => a._dist - b._dist)
          .slice(0, nearestCountRef.current)
          .map((o) => o.marker)
      );

      arr.forEach((o) => {
        const show = keep.has(o.marker);
        o.marker.setMap(show ? mapRef.current : null);
        if (o.overlay) o.overlay.setMap(show ? (LABEL_ALWAYS ? mapRef.current : null) : null);
      });
      return;
    }

    // 경로 없는 기본 모드
    if (!polyRef.current || !routeCtxRef.current?.path) {
      arr.forEach((o) => {
        const show = matchesFilter(o);
        o.marker.setMap(show ? mapRef.current : null);
        if (o.overlay) o.overlay.setMap(show ? (LABEL_ALWAYS ? mapRef.current : null) : null);
      });
      return;
    }

    // 경로가 있는 모드
    const path = routeCtxRef.current.path;
    arr.forEach((o) => (o._ok = matchesFilter(o)));
    arr.forEach((o) => (o._dist = o._ok ? minDistanceKmFromPath(path, o.lng, o.lat) : Infinity));

    const pickTop = (cat, n) =>
      arr.filter((o) => o._ok && o.cat === cat).sort((a, b) => a._dist - b._dist).slice(0, n);

    const keep = new Set(pickTop(activeCatRef.current, nearestCountRef.current).map((o) => o.marker));

    arr.forEach((o) => {
      const show = keep.has(o.marker);
      o.marker.setMap(show ? mapRef.current : null);
      if (o.overlay) o.overlay.setMap(show ? (LABEL_ALWAYS ? mapRef.current : null) : null);
    });
  };

  /* ───────── EV 자동 재조회 ───────── */
  useEffect(() => {
    if (!filters.ev.enabled) {
      setEvAvailSet(null);
      applyFiltersToMarkers();
      return;
    }

    if (filters.ev.status === "available") {
      let ignore = false;
      (async () => {
        try {
          setLoading(true);
          const set = await fetchEvAvailableStatIds({ type: filters.ev.type });
          if (!ignore) setEvAvailSet(set);
        } catch (e) {
          console.error(e);
        } finally {
          if (!ignore) {
            setLoading(false);
            applyFiltersToMarkers();
          }
        }
      })();
      return () => { ignore = true; };
    } else {
      setEvAvailSet(null);
      applyFiltersToMarkers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.ev.status, filters.ev.type, filters.ev.enabled]);

  /* ───────── 모달/경유 경로 ───────── */
  const openStationModal = async (station) => {
    setModalMode("ev");
    setModalStation(station);
    setModalOpen(true);
    setModalLoading(true);
    setModalError("");
    setModalList([]);

    try {
      const ids = Array.isArray(station?.statIds) && station.statIds.length
        ? station.statIds.map(String)
        : (station?.statId ? [String(station.statId)] : []);
      if (!ids.length) throw new Error("이 지점과 매칭할 STAT_ID가 없습니다.");

      const url = `/api/route/ev/status/by-station?statIds=${encodeURIComponent(ids.join(","))}`;
      const data = await (await fetch(url)).json();
      const list = normalizeEvStatusForModal(data);
      setModalList(list);
      if (!list.length) setModalError("해당 지점의 충전기 정보가 없습니다.");
    } catch (e) {
      console.error(e);
      setModalError(e.message || "상태 조회 실패");
    } finally {
      setModalLoading(false);
    }
    // openStationModal(...) 끝 try/finally 아래 or 마지막에 추가:
  await reloadReviews({ resetPage: true });
  };

  const openOilModal = async (gs) => {
    setModalMode("oil");
    setModalStation(gs);
    setModalOpen(true);
    setModalLoading(true);
    setModalError("");
    setModalList([]);
    try {
      if (!gs?.uni) throw new Error("UNI_CD가 없어 가격 조회가 불가합니다.");
      const data = await fetchOilPriceByUni(gs.uni);
      const list = normalizeOilPriceItems(data, gs.uni);
      setModalList(list);
      if (!list.length) setModalError("해당 주유소의 유가 정보가 없습니다.");
    } catch (e) {
      console.error(e);
      setModalError(e.message || "유가 조회 실패");
    } finally {
      setModalLoading(false);
    }
    // openOilModal(...) 끝 try/finally 아래 or 마지막에 추가:
    await reloadReviews({ resetPage: true });
  };

  ////
  const handleSaveReview = async () => {
    const text = rvTextRef.current?.value?.trim() || "";
  if (!text || rvRating <= 0) {
    alert("리뷰 내용과 별점을 입력하세요.");
    return;
  }
  if (!getToken()) {
    alert("로그인 후 작성할 수 있습니다.");
    return;
  }
  const key = reviewKeyOf(modalStation, modalMode);
  try {
    setRvLoading(true);
    await postReview({ key, rating: rvRating, text });
    if (rvTextRef.current) rvTextRef.current.value = ""; // 입력창 비우기
    setRvRating(0);
    setRvFormOpen(false);
    await reloadReviews({ resetPage: true });
  } catch (e) {
    alert(e.message || "리뷰 저장 실패");
  } finally {
    setRvLoading(false);
  }
};


  // ✅ 마커 클릭 시:
// destFixed === false → 도착지로 계속 갱신(파란선)
// destFixed === true  → 경유로 갱신(보라선)
const drawDetourForPoint = async (p) => {
  try {
    const ctx = routeCtxRef.current;
    if (!ctx?.origin || !window.kakao?.maps || !mapRef.current) return;
    const { kakao } = window;

    // ── CASE A: 도착지가 '고정되지 않은' 상태 → 항상 도착지로 갱신
    if (!ctx.destFixed) {
      const destLonLat = [Number(p.lng), Number(p.lat)];

      if (polyRef.current) { polyRef.current.setMap(null); polyRef.current = null; }
      if (viaRef.current)  { viaRef.current.setMap(null);  viaRef.current = null; }

      const route = await fetchOsrm(ctx.origin, destLonLat);
      const path = route.geometry.coordinates.map(([lon, lat]) => new kakao.maps.LatLng(lat, lon));

      const blue = new kakao.maps.Polyline({
        path, strokeWeight: 5, strokeColor: "#1e88e5", strokeOpacity: 0.9, strokeStyle: "solid",
      });
      blue.setMap(mapRef.current);
      polyRef.current = blue;

      replaceDestPin({ lat: p.lat, lng: p.lng, name: "도착" });

      routeCtxRef.current = {
        origin: ctx.origin,
        dest: destLonLat,
        baseMeters: route.distance,
        baseSeconds: route.duration,
        path,
        // ✨ 포인트: 여기서도 계속 false 유지 → 다음 클릭도 '도착지 갱신'
        destFixed: false,
      };

      const km  = (route.distance / 1000).toFixed(2);
      const min = Math.round(route.duration / 60);
      setSummary(`출발 → ${p.name || "선택지"}: 총 ${km} km / 약 ${min} 분`);
      setDetourSummary("");

      const bounds = new kakao.maps.LatLngBounds();
      path.forEach((pt) => bounds.extend(pt));
      mapRef.current.setBounds(bounds);

      applyFiltersToMarkers();
      return;
    }

    // ── CASE B: 도착지가 '고정'된 상태 → 경유 경로(보라선)
    const via = [Number(p.lng), Number(p.lat)];
    const route = await fetchOsrmVia(ctx.origin, via, ctx.dest);

    if (viaRef.current) { viaRef.current.setMap(null); viaRef.current = null; }

    const path = route.geometry.coordinates.map(([lon, lat]) => new kakao.maps.LatLng(lat, lon));
    const purple = new kakao.maps.Polyline({
      path, strokeWeight: 5, strokeColor: "#8e24aa", strokeOpacity: 0.9, strokeStyle: "solid",
    });
    purple.setMap(mapRef.current);
    viaRef.current = purple;

    const km  = (route.distance / 1000).toFixed(2);
    const min = Math.round(route.duration / 60);
    const dKm = ((route.distance - ctx.baseMeters) / 1000).toFixed(2);
    const dMn = Math.max(0, Math.round((route.duration - ctx.baseSeconds) / 60));
    setDetourSummary(`경유(${p.name || "선택지"}) 포함: 총 ${km} km / 약 ${min} 분  (+${dKm} km · +${dMn} 분)`);

    const bounds = new kakao.maps.LatLngBounds();
    path.forEach((pt) => bounds.extend(pt));
    mapRef.current.setBounds(bounds);
  } catch (e) {
    console.error("경유/도착 처리 실패:", e);
    alert("경로를 계산하지 못했습니다.");
  }
};



  /* ───────── 지도 클릭으로 출발/도착 지정 ───────── */
  const onMapClick = async ({ lat, lng }) => {
    if (!isMapEditRef.current) return;
    const mode = clickModeRef.current;
    const lonLat = [Number(lng), Number(lat)];

    // 좌표 → 주소/장소 라벨
    const label = await coordToLabel(lat, lng);

        // ⭐️ 홈(원점) 지정 모드
   if (mode === "home") {
      saveHome(lat, lng);
      setSummary("원점이 저장되었습니다.");
      return;
    }

    if (mode === "origin") {
      clearRouteOnly();
      setOriginInput(label); // ✅ 좌표 대신 장소/주소명 바인딩
      replaceOriginPin({ lat, lng });

      routeCtxRef.current = {
        origin: lonLat,
        dest: null,
        baseMeters: 0,
        baseSeconds: 0,
        path: null,
      };

      mapRef.current.setCenter(new window.kakao.maps.LatLng(lat, lng));
      setSummary(`출발지 설정됨 · 가까운 추천 ${nearestCountRef.current}개 표시`);
      setDetourSummary("");
      applyFiltersToMarkers();
      return;
    }

    // mode === 'dest'
    setDestInput(label); // ✅ 좌표 대신 장소/주소명 바인딩

    const ctx = routeCtxRef.current;
    if (ctx?.origin) {
      try {
        if (polyRef.current) { polyRef.current.setMap(null); polyRef.current = null; }
        if (viaRef.current) { viaRef.current.setMap(null); viaRef.current = null; }

        const route = await fetchOsrm(ctx.origin, lonLat);
        const { kakao } = window;
        const path = route.geometry.coordinates.map(([LON, LAT]) => new kakao.maps.LatLng(LAT, LON));

        const blue = new kakao.maps.Polyline({
          path, strokeWeight: 5, strokeColor: "#1e88e5", strokeOpacity: 0.9, strokeStyle: "solid",
        });
        blue.setMap(mapRef.current);
        polyRef.current = blue;

        replaceDestPin({ lat, lng, name: "도착" });

        routeCtxRef.current = {
          origin: ctx.origin,
          dest: lonLat,
          baseMeters: route.distance,
          baseSeconds: route.duration,
          path,
          destFixed: true, // ← 사용자가 도착을 명시 확정
        };

        const km = (route.distance / 1000).toFixed(2);
        const min = Math.round(route.duration / 60);
        setSummary(`기본 경로: 총 ${km} km / 약 ${min} 분`);
        setDetourSummary("");

        const bounds = new kakao.maps.LatLngBounds();
        path.forEach((p) => bounds.extend(p));
        mapRef.current.setBounds(bounds);

        applyFiltersToMarkers();
      } catch (err) {
        console.error(err);
        alert("경로 계산에 실패했습니다.");
      }
    } else {
      replaceDestPin({ lat, lng, name: "도착" });
      setSummary("도착지 설정됨 · 출발지를 먼저 지정하세요.");
    }
  };

  // 포커스(출발로 이동)
  const handleFocusOrigin = async () => {
    try {
      if (!window.kakao?.maps || !mapRef.current) {
        alert("지도가 준비되지 않았습니다.");
        return;
      }
      const [lng, lat] = await resolveTextToLonLat(originInput);
      mapRef.current.setCenter(new window.kakao.maps.LatLng(lat, lng));
    } catch (e) {
      alert(e.message || "출발지 좌표/주소를 확인해주세요.");
    }
  };

  /* ───────── 경로 버튼 ───────── */
  const handleRoute = async () => {
    try {
      if (!window.kakao?.maps || !mapRef.current) {
        alert("지도를 준비 중입니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      setLoading(true);
      clearRouteOnly();

      const origin = await resolveTextToLonLat(originInput);

      // 도착지 비었을 때: 출발지만 설정하고 추천 N개 표시
      if (isBlank(destInput)) {
        routeCtxRef.current = {
          origin,
          dest: null,
          baseMeters: 0,
          baseSeconds: 0,
          path: null,
          destFixed: false, // ← 도착지 아직 '고정' 아님(마커 클릭할 때마다 도착지로 갱신)
        };

        const { kakao } = window;
        const { marker, overlay } = addLabeledMarker({
          map: mapRef.current, kakao, type: "origin",
          lat: origin[1], lng: origin[0], name: "출발", labelAlways: true,
        });
        odRef.current.origin = marker; odRef.current.originLabel = overlay; overlay.setMap(mapRef.current);

        mapRef.current.setCenter(new kakao.maps.LatLng(origin[1], origin[0]));
        setSummary(`출발지 설정됨 · 가까운 추천 ${nearestCountRef.current || nearestCount}개 표시`);
        setDetourSummary("");
        applyFiltersToMarkers();
        return;
      }

      // 도착지가 있으면 기본 경로 계산
      const dest = await resolveTextToLonLat(destInput);
      const route = await fetchOsrm(origin, dest);

      const { kakao } = window;
      const coords = route.geometry.coordinates;
      const path = coords.map(([lon, lat]) => new kakao.maps.LatLng(lat, lon));

      routeCtxRef.current = {
        origin, dest,
        baseMeters: route.distance,
        baseSeconds: route.duration,
        path,
        destFixed: true, // ← 도착지 '고정'(이후 마커는 경유로 계산)
      };

      const km = (route.distance / 1000).toFixed(2);
      const min = Math.round(route.duration / 60);
      setSummary(`기본 경로: 총 ${km} km / 약 ${min} 분`);
      setDetourSummary("");

      const polyline = new kakao.maps.Polyline({
        path, strokeWeight: 5, strokeColor: "#1e88e5", strokeOpacity: 0.9, strokeStyle: "solid",
      });
      polyline.setMap(mapRef.current);
      polyRef.current = polyline;

      {
        const { marker, overlay } = addLabeledMarker({
          map: mapRef.current, kakao, type: "origin", lat: origin[1], lng: origin[0], name: "출발", labelAlways: true,
        });
        odRef.current.origin = marker; odRef.current.originLabel = overlay; overlay.setMap(mapRef.current);
      }
      {
        const { marker, overlay } = addLabeledMarker({
          map: mapRef.current, kakao, type: "dest", lat: dest[1], lng: dest[0], name: "도착", labelAlways: true,
        });
        odRef.current.dest = marker; odRef.current.destLabel = overlay; overlay.setMap(mapRef.current);
      }

      applyFiltersToMarkers();

      const bounds = new kakao.maps.LatLngBounds();
      path.forEach((p) => bounds.extend(p));
      mapRef.current.setBounds(bounds);
    } catch (err) {
      console.error("❌ handleRoute 실패:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ESC로 모달 닫기
 useEffect(() => {
   const onKey = (e) => { if (e.key === "Escape") { setReviewModalOpen(false); setModalOpen(false); } };
   window.addEventListener("keydown", onKey);
   return () => window.removeEventListener("keydown", onKey);
 }, []);

  /* ───────── 카테고리 콤보 변경 ───────── */
  const onChangeCategory = (val) => {
    setActiveCat(val);
    setFilters((v) => ({
      ev: { ...v.ev, enabled: val === "ev" },
      oil: { ...v.oil, enabled: val === "oil" },
      lpg: { ...v.lpg, enabled: val === "lpg" },
    }));
    if (val !== "ev") setEvAvailSet(null);
    setTimeout(() => applyFiltersToMarkers(), 0);
  };

  /* ───────── EV 상세 필터 초기화 버튼 ───────── */
  const resetEvDetail = () => {
    setFilters((v) => ({ ...v, ev: { ...v.ev, status: "any", type: "any" } }));
    setEvAvailSet(null);
  };

  /* ───────── 필터 변경 반영 ───────── */
  useEffect(() => {
    const t = setTimeout(() => applyFiltersToMarkers(), 80);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, activeCat, evAvailSet, nearestCount]);

  // UI helper: 라벨 + 내용 한 줄
  const LabelRow = ({ label, children }) => (
    <div className="label-row">
      <span className="label-row__label">{label}</span>
      <div className="label-row__control">{children}</div>
    </div>
  );

// return 위쪽 어딘가(동일 파일 내부)에 추가

const ModalInfo = () => (
  <div style={{ marginTop: 12 }}>
    {modalLoading && <div>불러오는 중...</div>}
    {!modalLoading && modalError && (
      <div style={{ color: "#c0392b" }}>오류: {modalError}</div>
    )}
    {!modalLoading && !modalError && (
      modalMode === "ev" ? (
        modalList.length === 0 ? (
          <div>표시할 충전기 정보가 없습니다.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr>
                <th style={thStyle}>충전기ID</th>
                <th style={thStyle}>상태</th>
                <th style={thStyle}>타입</th>
                <th style={thStyle}>출력(kW)</th>
                <th style={thStyle}>업데이트</th>
              </tr>
            </thead>
            <tbody>
              {modalList.map((c, i) => (
                <tr key={`${c.statId || "no"}-${c.chgerId}-${i}`}>
                  <td style={tdStyle}>{c.chgerId}</td>
                  <td style={tdStyle}>
                    <span style={statusBadgeStyle(c.status)}>{statusText(c.status)}</span>
                  </td>
                  <td style={tdStyle}>{chargerTypeName(c.type) || "-"}</td>
                  <td style={tdStyle}>{c.powerKw ?? "-"}</td>
                  <td style={tdStyle}>{c.lastTs || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      ) : (
        modalList.length === 0 ? (
          <div>표시할 유가 정보가 없습니다.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr>
                <th style={thStyle}>유종</th>
                <th style={thStyle}>가격(원/L)</th>
                <th style={thStyle}>기준일시</th>
              </tr>
            </thead>
            <tbody>
              {modalList.map((p, i) => (
                <tr key={`${p.product}-${i}`}>
                  <td style={tdStyle}>{productName(p.product) || "-"}</td>
                  <td style={tdStyle}>
                    {Number.isFinite(p.price) ? p.price.toLocaleString() : "-"}
                  </td>
                  <td style={tdStyle}>{p.ts || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )
    )}
  </div>
);

const ReviewsSection = () => (
  <div style={{ marginTop: 16, borderTop: "1px solid #eee", paddingTop: 12 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <strong style={{ fontSize: 16 }}>리뷰</strong>
        <div aria-label={`평균 별점 ${rvAvg.toFixed(1)} / 5`}>
          <Stars value={rvAvg} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
         {isAuthed && (
          <button
            className="btn"
            onClick={() => setRvFormOpen((v) => !v)}
            title="리뷰 작성"
          >
            {rvFormOpen ? "작성 취소" : "리뷰 작성"}
          </button>
         )}
        <button className="btn btn-ghost" disabled title="준비 중">키워드 선택</button>
      </div>
   
    {!isAuthed && (
      <div style={{ marginBottom: 8, color: "#888", fontSize: 13 }}>
        ✋ 로그인해야 리뷰 작성/수정/삭제가 가능합니다.
      </div>
    )}

    </div>

    {rvFormOpen && isAuthed && (
      <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ width: 60, color: "#666" }}>별점</span>
          <Stars value={rvRating} onChange={setRvRating} />
          <input
            type="number" min={0} max={5} step={0.5}
            value={rvRating}
            onChange={(e) => setRvRating(Number(e.target.value))}
            style={{ width: 72 }}
            aria-label="별점(0~5)"
          />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <textarea
           ref={rvTextRef}
           defaultValue=""          // 초기값만 지정, 이후 값 관리는 DOM
           onFocus={onStartTyping}
           onBlur={onStopTyping}
         />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button className="btn btn-primary" onClick={handleSaveReview} disabled={rvLoading}>
              저장
            </button>
            <button className="btn btn-ghost" onClick={() => setRvFormOpen(false)}>
              취소
            </button>
          </div>
        </div>
      </div>
    )}

    {rvLoading && rvItems.length === 0 && <div>불러오는 중...</div>}
    {rvError && <div style={{ color: "#c0392b" }}>오류: {rvError}</div>}

   {rvItems.map((it) => {
    const created = it.createdAt || it.ts;
        const updated = it.updatedAt;
  return (
    <div key={it.id} style={{ padding: "10px 0", borderTop: "1px solid #f4f4f4" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Stars value={it.rating} size={14} />
          <strong style={{ fontSize: 14 }}>{it.user || "익명"}</strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          
        <span style={{ color:"#888", fontSize:12 }}>
          작성 {fmtTs(created)}
          {wasEdited(created,updated) && (
            <em style={{ color:"#999", fontStyle:"normal" }}>
              · 수정 {fmtTs(updated)}
            </em>
          )}
        </span>

          {isAuthed && it.mine && (
            <>
              <button className="btn btn-ghost" onClick={() => startEdit(it)} style={{ padding: "2px 8px" }}>수정</button>
              <button className="btn btn-ghost" onClick={() => handleDeleteReview(it.id)} style={{ padding: "2px 8px" }}>삭제</button>
            </>
          )}
        </div>
      </div>

      {rvEditingId === it.id ? (
        <div style={{ marginTop: 8, border: "1px solid #eee", borderRadius: 8, padding: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ width: 60, color: "#666" }}>별점</span>
            <Stars value={rvEditRating} onChange={setRvEditRating} />
            <input type="number" min={0} max={5} step={0.5} value={rvEditRating}
                  onChange={(e) => setRvEditRating(Number(e.target.value))} style={{ width: 72 }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
          <textarea
            ref={rvEditTextRef}
            defaultValue={it.text}   // ← 초기값만 주고 이후엔 DOM이 관리
            style={{ flex: 1, height: 80, resize: "vertical" }}
          />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button className="btn btn-primary" onClick={handleUpdateReview} disabled={rvLoading}>저장</button>
              <button className="btn btn-ghost" onClick={() => setRvEditingId(null)}>취소</button>
            </div>
          </div>
        </div>
      ) : (
        <p style={{ margin: "6px 0 0", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{it.text}</p>
      )}
    </div>
  );
})}


  {rvHasMore && (
  <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
    <button
      className="btn"
      onClick={() => {
        if (rvLoading) return;
        const next = rvPage + 1;
        reloadReviews({ resetPage: false, page: next }); // ← 명시적으로 next 전달
      }}
      disabled={rvLoading}
    >
      더보기
    </button>
  </div>
  )}

  </div>
);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* 좌: 필터 패널 / 우: 지도  */}
      <div style={{ display: "flex", gap: 12, flex: 1, minHeight: 0 }}>
        {/* ← 필터 패널 */}
        <aside className={`filter-flyout ${isFilterOpen ? "open" : ""}`}>
          <div className="sidebar-card">
           {/* 헤더: 제목 + 닫기(X) */}
            <div className="sidebar-header">
              <h3 className="sidebar-title">필터</h3>
              <button
                className="icon-btn close-btn"
                aria-label="패널 닫기"
                title="패널 닫기"
                onClick={() => setIsFilterOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="form-group">
              <span className="form-label">종류</span>
              <select className="select" value={activeCat} onChange={(e) => onChangeCategory(e.target.value)}>
                <option value="ev">충전소</option>
                <option value="oil">주유소</option>
                <option value="lpg">LPG 충전소</option>
              </select>

              <span className="form-label">유종 색상 기준</span>
  <div className="btn-row compact">
    <button
      className={`btn btn-toggle ${priceBasis === "B027" ? "on" : ""}`}
      onClick={() => setPriceBasis("B027")}
      title="휘발유 기준으로 평균 대비 싸면 초록, 비싸면 빨강"
    >
      휘발유
    </button>
    <button
      className={`btn btn-toggle ${priceBasis === "D047" ? "on" : ""}`}
      onClick={() => setPriceBasis("D047")}
      title="경유 기준으로 평균 대비 싸면 초록, 비싸면 빨강"
    >
      경유
    </button>
    <button
      className={`btn btn-toggle ${priceBasis === "K015" ? "on" : ""}`}
      onClick={() => setPriceBasis("K015")}
      title="LPG 기준으로 평균 대비 싸면 초록, 비싸면 빨강"
    >
      LPG
    </button>
  </div>
  <div className="small-note">
    선택한 유종의 시·군 평균 대비 <b>{PRICE_DIFF_THRESH}원 이상 싸면 초록</b>, <b>{PRICE_DIFF_THRESH}원 이상 비싸면 빨강</b>으로 표시돼요.
  </div>
            </div>

            <LabelRow label="추천 개수">
              <select
                className="select"
                value={nearestCount}
                onChange={(e) => setNearestCount(Number(e.target.value))}
              >
                <option value={1}>1개</option>
                <option value={2}>2개</option>
                <option value={3}>3개</option>
                <option value={4}>4개</option>
                <option value={5}>5개</option>
                <option value={6}>6개</option>
                <option value={7}>7개</option>
                <option value={8}>8개</option>
                <option value={9}>9개</option>
                <option value={10}>10개</option>
              </select>
            </LabelRow>

            {activeCat === "ev" && (
              <>
                <LabelRow label="상태">
                  <select
                    className="select"
                    value={filters.ev.status}
                    onChange={(e) => setFilters((v) => ({ ...v, ev: { ...v.ev, status: e.target.value } }))}
                  >
                    <option value="any">전체</option>
                    <option value="available">충전가능만</option>
                  </select>
                </LabelRow>

                <LabelRow label="충전 타입">
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <select
                      className="select"
                      style={{ flex: 1 }}
                      value={filters.ev.type}
                      onChange={(e) => setFilters((v) => ({ ...v, ev: { ...v.ev, type: e.target.value } }))}
                    >
                      <option value="any">전체</option>
                      <option value="dc">DC 계열(급속)</option>
                      <option value="ac">AC 계열(완속)</option>
                      <option value="combo">DC+AC 모두</option>
                    </select>
                    <button className="btn btn-ghost" onClick={resetEvDetail} title="EV 세부조건 초기화">
                      초기화
                    </button>
                  </div>
                </LabelRow>
              </>
            )}

            {(activeCat === "oil" || activeCat === "lpg") && (
              <div className="help-text">
                세부조건 없이 {activeCat === "oil" ? "주유소" : "LPG 충전소"}만 표시합니다.
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="originInput">출발지</label>
              <input
                className="input"
                id="originInput"
                value={originInput}
                onChange={(e) => setOriginInput(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="destInput">도착지</label>
              <input
                className="input"
                id="destInput"
                value={destInput}
                onChange={(e) => setDestInput(e.target.value)}
              />
            </div>

            <div className="btn-row" style={{ marginTop: 6 }}>
              <button className="btn btn-ghost" onClick={handleClearAll}>지우기</button>
              <button className="btn btn-primary" onClick={handleRoute} disabled={loading}>
                {loading ? "계산/그리는 중..." : "경로 & 표시"}
              </button>
            </div>

            <div className="form-group" style={{ marginTop: 6 }}>
              <span className="form-label">지도 옵션</span>
              <div className="btn-row">
                <button className="btn" onClick={handleFocusOrigin}>출발지 포커스</button>
                <button className="btn" onClick={handleGoHome} title="휴먼교육센터로 이동">지도초기화</button>
                <button
                  className="btn"
                  onClick={() => {
                    if (!mapRef.current) return;
                    mapRef.current.setCenter(new window.kakao.maps.LatLng(homeCoord.lat, homeCoord.lng));
                  }}
                >
                 원점 포커스
               </button>
               <button
                 className="btn"
                 onClick={async () => {
                   // 원점을 출발지로 즉시 세팅
                   replaceOriginPin({ lat: homeCoord.lat, lng: homeCoord.lng });
                   setOriginInput(await coordToLabel(homeCoord.lat, homeCoord.lng));
                   routeCtxRef.current = {
                     origin: [homeCoord.lng, homeCoord.lat],
                     dest: null, baseMeters: 0, baseSeconds: 0, path: null, destFixed: false,
                   };
                   setSummary(`출발지(원점) 설정됨 · 가까운 추천 ${nearestCountRef.current}개 표시`);
                   setDetourSummary("");
                   applyFiltersToMarkers();
                 }}
               >
                 원점=출발
               </button>
                {/* ✅ 여기 추가 */}
                <button
                  className="btn"
                  onClick={handleResetHome}
                  title="저장된 원점을 지우고 기본 좌표(휴먼교육센터)로 복귀합니다"
                >
                  원점 초기화
                </button>
              </div>
            </div>

            <div className="form-group">
              <span className="form-label">지도 편집</span>
              <button
                className={`btn btn-toggle ${isMapEdit ? "on" : ""}`}
                onClick={() => setIsMapEdit((v) => !v)}
                title="지도 클릭으로 출발/도착 편집을 켜고 끕니다"
              >
                {isMapEdit ? "지도 편집 ON" : "지도 편집 OFF"}
              </button>

              <div className="btn-row compact" style={{ marginTop: 8 }}>
                {/* ✅ 편집 모드 선택 버튼: 선택된 쪽에 '불' (배경 on) */}
                <button
                  className={`btn btn-toggle ${clickMode === "origin" ? "on" : ""}`}
                  onClick={() => setClickMode("origin")}
                  disabled={!isMapEdit}
                  title="지도 클릭으로 출발지 지정"
                >
                  지도클릭=출발
                </button>
                <button
                  className={`btn btn-toggle ${clickMode === "dest" ? "on" : ""}`}
                  onClick={() => setClickMode("dest")}
                  disabled={!isMapEdit}
                  title="지도 클릭으로 도착지 지정"
                >
                  지도클릭=도착
                </button>
                <button
                  className={`btn btn-toggle ${clickMode === "home" ? "on" : ""}`}
                  onClick={() => setClickMode("home")}
                  disabled={!isMapEdit}
                  title="지도 클릭으로 원점 저장"
                >
                  지도클릭=원점
                </button>
              </div>
              <div className="small-note">편집 ON일 때만 모드 버튼이 활성화됩니다.</div>
            </div>
          </div>
        </aside>

       {/* → 오른쪽(제목/요약 + 지도) */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          
          {/* 지도 래퍼: relative, 오버레이: absolute */}
          <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
            <div
              id="map"
              style={{ position: "absolute", inset: 0, border: "1px solid #ddd"}}
            />

            {(summary || detourSummary) && (
              <div className="map-summary">
                <div className="map-summary__card">
                  {summary && <div className="map-summary__row">✅ {summary}</div>}
                  {detourSummary && <div className="map-summary__row">➡️ {detourSummary}</div>}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 상태/유가 모달 */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setModalOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.45)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(720px, 92vw)", maxHeight: "80vh", overflow: "auto",
              background: "#fff", borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,.2)", padding: 20, transform: `translate(${modalDelta.dx}px, ${modalDelta.dy}px)`, // ✅ 드래그 이동량 반영
              touchAction: "none", // ✅ 터치 드래그 시 제스처 충돌 방지
            }}
          >
            {/* ── 헤더(제목 + 즐겨찾기 + 닫기) ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div
                style={{ flex: 1, cursor: "move" }}
                onMouseDown={onModalDragStart}
                onTouchStart={onModalDragStart}
              >
                <h2 style={{ margin: 0, fontSize: 20 }}>
                  {modalMode === "ev" ? "EV" : "주유소/LPG"}
                  {modalStation?.name ? ` — ${modalStation.name}` : ""}
                </h2>
                {modalStation?.addr && (
                  <div style={{ marginTop: 4, color: "#666", fontSize: 13 }}>
                    주소: {modalStation.addr}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={(e) => { e.preventDefault(); toggleFav(); }}
                  aria-pressed={isFavStation(modalStation)}
                  title={isFavStation(modalStation) ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    background: isFavStation(modalStation) ? "#fff8e1" : "#f5f5f5",
                    fontSize: 12,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {isFavStation(modalStation) ? "★ 즐겨찾기 해제" : "☆ 즐겨찾기"}
                </button>

               <button
                className="btn"
                onClick={async (e) => { e.preventDefault(); setReviewModalOpen(true); await reloadReviews({ resetPage: true }); }}
                title="기본정보 + 리뷰 모달 열기"
              >
                리뷰 보기
              </button>

                <button
                  onClick={() => setModalOpen(false)}
                  style={{ border: "none", background: "transparent", fontSize: 22, lineHeight: 1, cursor: "pointer" }}
                  aria-label="닫기" title="닫기"
                >
                  ×
                </button>
              </div>
            </div>

            {modalMode === "ev" && (
              <div style={{ marginTop: 6, color: "#444", fontSize: 13, lineHeight: 1.7 }}>
                <div>이용시간: {modalStation?.usetime || "-"}</div>
                <div>설치층: {modalStation?.floornum || "-"} / 층종류: {floorTypeName(modalStation?.floortype)}</div>
                <div>운영기관: {modalStation?.businm || "-"}</div>
                <div>문의: {modalStation?.busicall || "-"}</div>
              </div>
            )}

            {modalMode === "oil" && (
              <>
                <div style={{ marginTop: 2, color: "#666", fontSize: 13 }}>
                  <div>※ 시군 평균(휘발유): {fmtWon(modalStation?.avg?.B027)}</div>
                  <div>※ 차이(휘발유): {fmtWon(modalStation?.diff?.B027)} 원</div>
                  브랜드: {brandName(modalStation?.brand)}
                  {modalStation?.self ? ` · 셀프: ${modalStation.self}` : ""}
                  {modalStation?.tel ? ` · Tel: ${modalStation.tel}` : ""}
                  {modalStation?.uni ? ` · UNI_CD: ${modalStation.uni}` : ""}
                  {modalStation?.brandGroup ? ` · 브랜드그룹: ${modalStation.brandGroup}` : ""}
                </div>
                <div style={{ marginTop: 8 }}>
                  <YnChip label="편의점" val={modalStation?.cvsYn} />
                  <YnChip label="세차" val={modalStation?.carWashYn} />
                  <YnChip label="정비" val={modalStation?.maintYn} />
                  <YnChip label="한국석유관리원 인증" val={modalStation?.kpetroYn} />
                  <YnChip label="LPG" val={modalStation?.lpgYn} />
                  <YnChip label="24시간" val={modalStation?.open24hYn} />
                </div>
              </>
            )}

           

           {/* 가격/상태 표 먼저 */}
           <ModalInfo />

            {/* ───────── 리뷰 & 별점 ───────── */}
  

          </div>
        </div>
      )}

      {reviewModalOpen && (
      <div
        role="dialog"
        aria-modal="true"
        onClick={() => setReviewModalOpen(false)}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.55)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "min(720px, 92vw)", maxHeight: "80vh", overflow: "auto",
            background: "#fff", borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,.25)",
            padding: 20, transform: `translate(${rvModalDelta.dx}px, ${rvModalDelta.dy}px)`,
            touchAction: "none",
          }}
        >
          {/* 헤더(드래그 핸들 + 닫기) */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div
              style={{ flex: 1, cursor: "move" }}
              onMouseDown={onRvDragStart}
              onTouchStart={onRvDragStart}
            >
              <h2 style={{ margin: 0, fontSize: 20 }}>
                {modalMode === "ev" ? "EV" : "주유소/LPG"}
                {modalStation?.name ? ` — ${modalStation.name}` : ""} <span style={{ fontWeight: 400, color: "#666" }}>(리뷰)</span>
              </h2>
              {modalStation?.addr && (
                <div style={{ marginTop: 4, color: "#666", fontSize: 13 }}>
                  주소: {modalStation.addr}
                </div>
              )}
            </div>
            <button
              onClick={() => setReviewModalOpen(false)}
              style={{ border: "none", background: "transparent", fontSize: 22, lineHeight: 1, cursor: "pointer" }}
              aria-label="닫기" title="닫기"
            >
              ×
            </button>
          </div>

          {/* 기본정보 요약 */}
          {modalMode === "ev" ? (
            <div style={{ marginTop: 6, color: "#444", fontSize: 13, lineHeight: 1.7 }}>
              <div>이용시간: {modalStation?.usetime || "-"}</div>
              <div>설치층: {modalStation?.floornum || "-"} / 층종류: {floorTypeName(modalStation?.floortype)}</div>
              <div>운영기관: {modalStation?.businm || "-"}</div>
              <div>문의: {modalStation?.busicall || "-"}</div>
            </div>
          ) : (
            <>
              <div style={{ marginTop: 2, color: "#666", fontSize: 13 }}>
                브랜드: {brandName(modalStation?.brand)}
                {modalStation?.self ? ` · 셀프: ${modalStation.self}` : ""}
                {modalStation?.tel ? ` · Tel: ${modalStation.tel}` : ""}
                {modalStation?.uni ? ` · UNI_CD: ${modalStation.uni}` : ""}
                {modalStation?.brandGroup ? ` · 브랜드그룹: ${modalStation.brandGroup}` : ""}
              </div>
              <div style={{ marginTop: 8 }}>
                <YnChip label="편의점" val={modalStation?.cvsYn} />
                <YnChip label="세차" val={modalStation?.carWashYn} />
                <YnChip label="정비" val={modalStation?.maintYn} />
                <YnChip label="한국석유관리원 인증" val={modalStation?.kpetroYn} />
                <YnChip label="LPG" val={modalStation?.lpgYn} />
                <YnChip label="24시간" val={modalStation?.open24hYn} />
              </div>
            </>
          )}

          {/* 표 먼저 */}
          <ModalInfo />

          {/* 리뷰 섹션 */}
          <ReviewsSection />
        </div>
      </div>
      )}

    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: "1px solid #eee",
  background: "#fafafa",
  position: "sticky",
  top: 0,
};
const tdStyle = {
  padding: "8px 10px",
  borderBottom: "1px solid #f0f0f0",
};

/* ───────── 유가 정규화(모달용) ───────── */
function normalizeOilPriceItems(json, uniHint) {
  const out = [];
  const seen = new Set();
  const toNum = (v) => {
    const n = Number(String(v ?? "").replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : NaN;
  };
  const push = (rec) => {
    if (!rec || typeof rec !== "object") return;
    const prodCd = rec.PRODCD || rec.PROD_CD || rec.productCode;
    const prodNm =
      rec.PRODNM ||
      ({ B027: "휘발유", D047: "경유", B034: "고급휘발유", C004: "등유", K015: "자동차용 LPG" }[
        String(prodCd || "").trim()
      ] || prodCd || "기타");
    const price = toNum(rec.PRICE ?? rec.PRICE_WON ?? rec.PRIS);
    const dt = (rec.TRADE_DT || rec.BASE_DT || rec.UPDATE_DT || "").trim();
    const tm = (rec.TRADE_TM || rec.TRADE_TIME || "").trim();
    const ts = dt || tm ? `${dt}${tm ? " " + tm : ""}` : "";
    if (Number.isFinite(price)) {
      const key = `${prodNm}|${price}|${ts}|${uniHint || ""}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ product: prodNm, price, ts, uni: String(uniHint || "") });
    }
  };
  const isPriceRow = (node) =>
    node && typeof node === "object" &&
    ("PRICE" in node || "PRICE_WON" in node || "PRIS" in node) &&
    ("PRODCD" in node || "PROD_CD" in node || "PRODNM" in node || "productCode" in node);
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (isPriceRow(node)) push(node);
    if (Array.isArray(node)) node.forEach(walk);
    else Object.values(node).forEach(walk);
  };
  walk(json?.RESULT ?? json);
  return out;
}

/* ───────── EV 모달 정규화 ───────── */
function normalizeEvStatusForModal(json) {
  const items = json?.items?.item || json?.list || json?.data || json?.Items || json?.ITEMS || [];
  const arr = Array.isArray(items) ? items : [items];
  const toNum = (v) => {
    const n = Number(String(v ?? "").replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : undefined;
  };
  return arr.map((o) => ({
    statId: String(o.statId ?? o.stationId ?? o.STAT_ID ?? o.csId ?? o.CS_ID ?? ""),
    chgerId: String(o.chgerId ?? o.chargerId ?? o.chger_id ?? o.CHARGER_ID ?? o.num ?? o.CHGER_ID ?? ""),
    status: String(o.stat ?? o.status ?? o.chgerStat ?? o.STAT ?? ""),
    type: String(o.chgerType ?? o.type ?? o.CHARGER_TYPE ?? o.TYPE ?? ""),
    powerKw: toNum(o.output ?? o.power ?? o.kw ?? o.POWER ?? o.output_kw),
    lastTs: o.statUpdDt || o.updateTime || o.lastTs || o.UPDT_DT || o.LAST_TS || o.stat_upd_dt || "",
  }));
}