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

// 파일 상단 헬퍼들 근처에 추가
const tip = (text) =>
  `<span class="tt" title="${escapeHtml(text)}" data-tip="${escapeHtml(text)}">${escapeHtml(text)}</span>`;


// ★ 상표명 통일
const brandName = (raw = "", group = "") => {
  const s = String(raw || "").trim();
  const g = String(group || "").trim().toUpperCase();
  if (!s && !g) return "";

  // 그룹 힌트 우선
  if (/NHO|NH[-_ ]?OIL|RTO/.test(g)) return "알뜰(농협)";
  if (/HDO/.test(g)) return "알뜰(도로공사)";

  const su = s.toUpperCase().replace(/[.\-·\s]/g, "");

  // 대표 브랜드 매핑
  if (/^SK|SK에너지|SKENERGY/.test(su)) return "SK에너지";
  if (/^GS|GSCALTEX|GS칼텍스/.test(su)) return "GS칼텍스";
  // S-OIL 표기 변형: SOIL, SOL, (한글) 에스오일/에쓰오일
  if (/^(?:SOIL|SOL)$/.test(su) || /(에스오일|에쓰오일)/.test(s)) return "S-OIL";
  if (/HYUNDAI|OILBANK|현대/.test(su)) return "현대오일뱅크";

  // 알뜰 파생 코드
  if (/NHO|NH[-_ ]?OIL|RTO/.test(su)) return "알뜰(농협)";
  if (/HDO/.test(su)) return "알뜰(도로공사)";

  // 무폴/자가
  if (/(자영|무폴|자가)/.test(s)) return "자가(무폴)";

  return s; // 알 수 없으면 원문 유지
};


// 공통: 주유소 ID(가격 조회용) 추출
// 공통: 주유소 ID(가격 조회용) 추출 — 일반/주변 응답 모두 커버
// ✅ 주유소 가격 ID(UNI) 뽑기: 6~12자리 숫자만 인정
// 파일 상단 헬퍼 근처에 추가
const getOilId = (o) => {
  if (!o) return "";
  const keys = ["stationId","STATION_ID","uni","UNI","UNI_CD","uniCd","id","ID"];
  for (const k of keys) {
    const v = o?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
};





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
      avg: o.AVG || {},  // 시·군 평균
      diff: o.DIFF || {},  // (개별가격 - 시·군 평균)
      updatedAt: o.UPDATED_AT || null,
      sigunCd: o.SIGUN_CD || null,
    });
  }
  return map;
};

// 유종별로 마커 타입 결정
const markerTypeByBasis = (station, cat, basis) => {
  const d = Number((station?.diff || {})[basis]);
  if (!Number.isFinite(d)) return cat;
  if (d <= -PRICE_DIFF_THRESH) return "oil-cheap";
  if (d >= PRICE_DIFF_THRESH) return "oil-exp";
  return cat;
};

// 보기용
const basisLabel = (k) => ({ B027: "휘발유", D047: "경유", K015: "LPG" }[k] || k);
const fmtWon = (v) => {
  const n = Number(String(v ?? "").replace(/,/g, "").trim());
  return Number.isFinite(n) ? n.toLocaleString() : "-";
};
const oilAvgPairPanel = (gs, { lpgOnly = false } = {}) => {
  const row = (label, avg, diff) => {
    const hasAvg = Number.isFinite(avg);
    const hasDiff = Number.isFinite(diff);
    const sign = hasDiff ? (diff > 0 ? "+" : "") : "";
    const diffColor = hasDiff ? (diff < 0 ? "#2ecc71" : diff > 0 ? "#e74c3c" : "#999") : "#999";
    return `<div style="display:flex;justify-content:space-between;gap:8px;margin:2px 0;">
      <span>${label}</span>
      <span>${hasAvg ? `${fmtWon(avg)}원` : "-"}${hasDiff ? `<em style="color:${diffColor};font-style:normal;margin-left:6px">(${sign}${fmtWon(diff)})</em>` : ""
      }</span></div>`;
  };
  if (lpgOnly) {
    const a = Number(gs?.avg?.K015), d = Number(gs?.diff?.K015);
    if (![a, d].some(Number.isFinite)) return "";
    return `<div style="margin:6px 0 8px;padding:8px 10px;border:1px solid #eee;border-radius:8px;background:#fafafa;font-size:12px;">
      <div style="font-weight:600;margin-bottom:4px">시·군 평균가 / 차이</div>${row("🔥 LPG", a, d)}</div>`;
  }
  const ag = Number(gs?.avg?.B027), dg = Number(gs?.diff?.B027);
  const ad = Number(gs?.avg?.D047), dd = Number(gs?.diff?.D047);
  if (![ag, dg, ad, dd].some(Number.isFinite)) return "";
  return `<div style="margin:6px 0 8px;padding:8px 10px;border:1px solid #eee;border-radius:8px;background:#fafafa;font-size:12px;">
    <div style="font-weight:600;margin-bottom:4px">시·군 평균가 / 차이</div>
    ${row("⛽ 휘발유", ag, dg)}${row("🛢 경유", ad, dd)}</div>`;
};

// 두 좌표 사이 거리(km)
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
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
    type === "ev" ? "#2b8af7" :
      type === "oil-cheap" ? "#2ecc71" :  // 평균보다 싼 곳
        type === "oil-exp" ? "#e74c3c" :  // 평균보다 비싼 곳
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
  const on = isLoggedIn() && isFav;  // ✅ 로그아웃이면 항상 false
  const img = on
    ? getStarMarkerImage(kakao)
    : getMarkerImage(isCharge ? "ev" : "oil", kakao);
  marker.setImage(img);
  marker.setZIndex(on ? 7 : 5);
};

//// 즐겨찾기
// ✅ html escape (파일 하단의 escapeHtml가 이미 있다면, 아래 것으로 교체하고 하단 것은 삭제)
const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

// ✅ 즐겨찾기/로그인 관련 (RouteMap 동일 로직의 경량 버전)
const FAV_KEY = "route.favorites.v1";

// 즐겨찾기/로그인 관련 바로 아래에 추가
const favStorageKey = () => {
  const t = getToken();
  if (!t || !isTokenAlive(t)) return "";

  const p = parseJwt(t) || {};
  const uid =
    p.sub || p.userId || p.uid || p.id ||
    (p.email ? String(p.email).split("@")[0] : "");

  // ✅ JWT가 아니거나 식별자가 없을 때 토큰 해시로 구분
  const hash = (s) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  };

  const suffix = uid ? String(uid) : `tok-${hash(t)}`;
  return `${FAV_KEY}:${suffix}`;
};



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
   const id = getOilId(station);
   return id ? `oil:${id}` : `oil@${coordKey(station.lat ?? station.LAT, station.lon ?? station.LON ?? station.lng)}`;
   }
  // mode === 'ev'
  const sid = station?.statId || station?.STAT_ID || "";
  return sid ? `ev:${String(sid)}` : `ev@${coordKey(station.lat ?? station.LAT, station.lon ?? station.LON ?? station.lng)}`;
};
////
export default function OilMap({ stations, handleLocationSearch,handleOilFilterSearch }) {
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const myMarkerRef = useRef(null);
  const infoRef = useRef(null);

  // 두 가지 검색 핸들러(객체/옛 방식)를 모두 지원
  const doFilterSearch = (args) => {
  if (!args) return;
  lastQueryRef.current = args?.mode === "nearby"
    ? { type: "nearby", lat: args.lat, lon: args.lon, radius: Number(args.radius) || 0 }
    : { type: "filter" };

  if (handleOilFilterSearch) { handleOilFilterSearch(args); return; }
  if (handleLocationSearch && args?.mode === "nearby") {
    const { lat, lon, radius } = args;
    handleLocationSearch({ lat, lon }, Number(radius));
  }
};

  const [mapReady, setMapReady] = useState(false);
  const bootRunRef = useRef(false);

  const zoomFillRef = useRef(null);
  const zoomLabelRef = useRef(null);

  const [weather, setWeather] = useState(null);
  const [air, setAir] = useState(null);

  const [adjustMode, setAdjustMode] = useState(false);
  const [selectedCoord, setSelectedCoord] = useState(null);

  const [reviewModal, setReviewModal] = useState({ open: false, mode: null, station: null });

  const lastQueryRef = useRef(null);
  // ── 평균유가/차이: RouteMap과 동일 개념
  //const PRICE_DIFF_THRESH = 30;                     // 임계값(원)
  //const BASIS_KEY = "route.priceBasis.v1";
  const [priceBasis, setPriceBasis] = useState(() => {
    try { return localStorage.getItem(BASIS_KEY) || "B027"; } catch { return "B027"; }
  });
  useEffect(() => { try { localStorage.setItem(BASIS_KEY, priceBasis); } catch { } }, [priceBasis]);

  // uni(주유소 고유코드) → {prices, avg, diff, ...}
  const [avgMap, setAvgMap] = useState(new Map());
  const fetchOilWithAverage = async () => {
    // ✅ 서버 라우트가 다르면 이 URL만 바꾸세요
    const r = await fetch("/api/route/oil/price/all");
    if (!r.ok) return;
    const j = await r.json();
    setAvgMap(normalizeOilAvgMap(j));
  };
  useEffect(() => { fetchOilWithAverage().catch(() => { }); }, []);

useEffect(() => {
  const prefix = "route.favorites.v1";
  const del = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) del.push(k);
  }
  del.forEach(k => localStorage.removeItem(k));
}, []);



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
  if (!isLoggedIn()) return new Set();
  try {
    const k = favStorageKey();
    const arr = JSON.parse(localStorage.getItem(k) || "[]");
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
      const k = favStorageKey();
      if (k) localStorage.setItem(k, JSON.stringify(keys));  // ✅ 사용자별 저장
    } catch { /* ignore */ }
  })();
}, []);

useEffect(() => {
  // 처음 렌더 1회: 토큰으로 즐겨찾기 목록 가져오고, 별마커로 표시되도록 favSet 갱신
  (async () => {
    try {
      const token = getToken(); // localStorage의 JWT
      if (!token) return;       // 비로그인 시 스킵

      // ⬇⬇⬇ POST 바꾸기 → GET + Authorization 헤더
      const { data } = await axios.get("/idtoken", {
        headers: {
          Authorization: `Bearer ${token}`, // 서버에서 Bearer 제거 후 파싱
        },
      });
      // data: StationDTO[] (stationId / lat / lon 등 포함)

      // 1) 즐겨찾기 키로 변환
      const keys = (Array.isArray(data) ? data : [])
        .map((st) => {
          const id = getOilId(st) || st.stationId;
          return id ? `oil:${String(id)}` : null;
        })
        .filter(Boolean);

      setFavSet(new Set(keys));
      const k = favStorageKey();
      if (k) localStorage.setItem(k, JSON.stringify(keys)); // 사용자별 로컬 캐시

      // 2) 지도 뷰 보정(선택)
      if (window.kakao && mapRef.current && data?.length) {
        const kakao = window.kakao;
        const map = mapRef.current;
        const bounds = new kakao.maps.LatLngBounds();
        let any = false;

        data.forEach((st) => {
          const lat = Number(st.lat ?? st.LAT);
          const lon = Number(st.lon ?? st.LON ?? st.lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
          bounds.extend(new kakao.maps.LatLng(lat, lon));
          any = true;
        });

        if (any) {
          try { map.setLevel(6, { animate: false }); } catch { map.setLevel(6); }
          map.panTo(bounds.getCenter());
        }
      }
    } catch (err) {
      console.error("[/idtoken] fetch favorites failed:", err?.response?.data || err);
    }
  })();

  return () => {
    // cleanup 불필요
  };
}, []);


  // 즐겨찾기 토글 (optimistic 업데이트, 실패 시 롤백)
 const toggleFavForStation = async (station, mode) => {
  const key = favKeyOf(station, mode);
  if (!key) return;
  if (!isLoggedIn()) { alert("로그인 후 이용 가능합니다."); return; }

  const wasFav = favSetRef.current?.has(key);

  setFavSet(prev => {
    const next = new Set(prev);
    wasFav ? next.delete(key) : next.add(key);
    const k = favStorageKey();
    if (k) localStorage.setItem(k, JSON.stringify([...next]));  // ✅
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
    // 롤백
    setFavSet(prev => {
      const rollback = new Set(prev);
      wasFav ? rollback.add(key) : rollback.delete(key);
      const k = favStorageKey();
      if (k) localStorage.setItem(k, JSON.stringify([...rollback])); // ✅
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

  ////평균유가-기준 바뀌면 현재 마커 이미지만 재칠하기
useEffect(() => {
  if (!window.kakao || !mapRef.current) return;
  markersRef.current.forEach((m, idx) => {
    const s0 = drawList?.[idx]; if (!s0) return;
    const uni = getOilId(s0);
    const extra = uni ? (avgMap.get(uni) || {}) : {};
    const s = { ...s0, uni, stationId: uni, prices: extra.prices || {}, avg: extra.avg || {}, diff: extra.diff || {}, updatedAt: extra.updatedAt };
    const isCharge = !!s.statId;
    if (isCharge) return; // EV는 그대로
    const cat = ((s.lpgYN ?? s.LPG_YN) === "Y") ? "lpg" : "oil";
    const t = markerTypeByBasis(s, cat, priceBasis);

    const favKey = favKeyOf(s, "oil");
    const favOn = isLoggedIn() && favSetRef.current?.has(favKey);  // ✅
    m.setImage(favOn ? getStarMarkerImage(window.kakao)
                     : getMarkerImage(t, window.kakao));
    m.setZIndex(favOn ? 7 : 5);                                    // ✅
  });
}, [priceBasis, avgMap, stations /* 필요하면 favSet도 추가 가능 */]);

const [authToken, setAuthToken] = useState(getToken());

// 토큰 변경 감지 (탭 내 폴링 + 다른 탭 storage 이벤트 대응)
useEffect(() => {
  const onStorage = (e) => { if (e.key === "token") setAuthToken(getToken()); };
  window.addEventListener("storage", onStorage);
  const id = setInterval(() => {
    const t = getToken();
    if (t !== authToken) setAuthToken(t);
  }, 1000);
  return () => { window.removeEventListener("storage", onStorage); clearInterval(id); };
}, [authToken]);

// 토큰이 바뀌면 즐겨찾기 셋을 다시 로드 (로그아웃이면 비움)
useEffect(() => {
  if (!isTokenAlive(authToken)) {
    setFavSet(new Set());                // ✅ 로그아웃 즉시 전체 ⭐ 제거
    return;
  }
  try {
    const k = favStorageKey();
    const arr = JSON.parse(localStorage.getItem(k) || "[]");
    setFavSet(new Set(Array.isArray(arr) ? arr : []));
  } catch {
    setFavSet(new Set());
  }
}, [authToken]);



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

      const markerImage = getMyLocationImage(window.kakao);

      myMarkerRef.current = new window.kakao.maps.Marker({
        position: center,
        image: markerImage,
        map,
      });

      fetchWeather(coord.lat, coord.lon);
      window.kakao.maps.event.addListener(map, "zoom_changed", updateZoomBar);
      updateZoomBar();
      setMapReady(true); // ✅ 지도 SDK/맵 생성 완료
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

  // 지도 준비가 끝나면 최초 1회 '내 주변 3km' 검색 자동 실행
useEffect(() => {
  if (!mapReady || bootRunRef.current) return; // StrictMode 중복 방지
  bootRunRef.current = true;

  const saved = localStorage.getItem("savedCoord");
  const { lat, lon } = saved ? JSON.parse(saved) : MY_COORD;

  doFilterSearch?.({ mode: "nearby", lat, lon, radius: 3 }); // ← 핵심
}, [mapReady]);

  ////평균유가
  // ✅ 마커 표시
  

  // ★ 주유소/충전소 공통 정규화
const normalizeStation = (s0 = {}) => {
  const stationId =
    s0.stationId ?? s0.UNI_CD ?? s0.uni ?? s0.UNI ?? s0.UNI_ID ?? s0.id ?? s0.ID ?? "";

  return {
    ...s0,
    stationId,                                 // 주유소 가격조회용 ID를 확실히 채움
    statId: s0.statId ?? s0.STAT_ID ?? "",     // EV도 통일
    lat: Number(s0.lat ?? s0.LAT),
    lon: Number(s0.lon ?? s0.LON ?? s0.lng),
  };
};

// ★ 서버가 반경을 무시해도 프론트에서 한 번 더 걸러준다
let drawList = stations;
if (lastQueryRef.current?.type === "nearby") {
  const { lat: qLat, lon: qLon, radius } = lastQueryRef.current;
  drawList = stations.filter((s0) => {
    const s = normalizeStation(s0);
    if (!Number.isFinite(s.lat) || !Number.isFinite(s.lon)) return false;
    return haversineKm(s.lat, s.lon, qLat, qLon) <= (radius || 0);
  });
}

  useEffect(() => {
    if (!mapReady || !window.kakao || !mapRef.current) return;

    console.log('[nearby]', drawList.slice(0,3).map(s => ({ name: s.name||s.NAME, id: getOilId(s) })));

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (!drawList?.length) return;
    const bounds = new window.kakao.maps.LatLngBounds();
    const newMarkers = [];
    const centerCoord = selectedCoord ?? MY_COORD;

    drawList.forEach((s0) => {
       const s = normalizeStation(s0);                 // ← 여기서 통일
       // avgMap에서 평균/차이 붙이기
  const uni   = getOilId(s);
  const extra = uni ? (avgMap.get(uni) || {}) : {};
  const sPlus = {
    ...s,
    uni,
    stationId: uni || s.stationId,
    brandGroup: s.brandGroup ?? s.BRAND_GROUP,
    prices:   extra.prices || {},
    avg:      extra.avg    || {},
    diff:     extra.diff   || {},
    updatedAt: extra.updatedAt || s.updatedAt,
  };
  if (!Number.isFinite(sPlus.lat) || !Number.isFinite(sPlus.lon)) return;
  const pos = new window.kakao.maps.LatLng(sPlus.lat, sPlus.lon);
  const isCharge = !!sPlus.statId;

  const favKey = favKeyOf(sPlus, isCharge ? "ev" : "oil");
  const isFav = !!(favKey && favSetRef.current?.has(favKey));
  const favOn = isLoggedIn() && isFav;                     // ✅
  // 평균/차이에 따라 마커색 결정
  const cat  = ((sPlus.lpgYN ?? sPlus.LPG_YN) === "Y") ? "lpg" : "oil";
  const type = isCharge ? "ev" : markerTypeByBasis(sPlus, cat, priceBasis);
  const markerImage = favOn
    ? getStarMarkerImage(window.kakao)
    : getMarkerImage(type, window.kakao);

  const marker = new window.kakao.maps.Marker({
    position: pos,
    zIndex: favOn ? 7 : 5,
    image: markerImage,
  });
  marker.setMap(mapRef.current);
  newMarkers.push(marker);
  bounds.extend(pos);

      window.kakao.maps.event.addListener(marker, "click", async () => {
  if (isCharge) {
    // ───────── EV 인포윈도우 ─────────
    const mode = "ev";
    const favKey = favKeyOf(sPlus, mode);
    const starredNow = !!(favKey && favSetRef.current?.has(favKey));
    const favBtnHtml = (on) => `
      <button class="fav-btn ${on ? "on" : ""}"
              ${isLoggedIn() ? "" : "disabled"}
              title="${isLoggedIn() ? (on ? "즐겨찾기 해제" : "즐겨찾기 추가") : "로그인 필요"}"
              style="border:none;background:transparent;font-size:18px;line-height:1;${isLoggedIn() ? "cursor:pointer;" : "cursor:not-allowed;opacity:.5"}">
        ${on ? "★" : "☆"}
      </button>`;

    // 1) 기본 화면
    const baseHtml = `
      <div class="info-window">
        <div style="display:flex;align-items:center;gap:8px;justify-content:space-between;">
          <div style="flex:1;min-width:0;">
            <div class="info-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              ${tip(sPlus.statNm ?? "충전소")}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            ${favBtnHtml(starredNow)}
            <button class="review-btn" style="border:1px solid #e5e7eb;background:#fff;padding:4px 8px;border-radius:8px;font-size:12px;cursor:pointer">리뷰보기</button>
          </div>
        </div>
        ${sPlus.addr ? `<div class="info-row">📍 ${escapeHtml(sPlus.addr)}</div>` : ""}
        ${sPlus.useTime ? `<div class="info-row">⏰ ${escapeHtml(sPlus.useTime)}</div>` : ""}
        ${sPlus.busiNm ? `<div class="info-row">👤 운영사: ${escapeHtml(sPlus.busiNm)}</div>` : ""}
        <div class="info-row" id="ev-status-line">상태 불러오는 중…</div>
      </div>`.trim();

    setInfoHtml(baseHtml, marker, (root) => {
      const btn = root.querySelector(".fav-btn");
      if (btn && !btn.disabled) {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          await toggleFavForStation(sPlus, "ev");
          const on = favSetRef.current?.has(favKeyOf(sPlus, "ev"));
          btn.textContent = on ? "★" : "☆";
          btn.classList.toggle("on", on);
          setMarkerIconByFav(marker, true, on, window.kakao);
        });
      }
      const rvBtn = root.querySelector(".review-btn");
      if (rvBtn) {
        rvBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          setReviewModal({ open: true, mode: "ev", station: sPlus });
        });
      }
    });

    // 2) 상태 비동기 로딩 → 갱신
    try {
      const statId = String(sPlus.statId || "");
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

      const statusText = (s) =>
        ({ "1":"통신이상","2":"충전가능","3":"충전중","4":"운영중지","5":"점검중","9":"미확인","0":"미확인" }[String(s ?? "9")] || "미확인");
      const statusPill = (v) => {
        const code = String(v ?? "9");
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
                ${escapeHtml(sPlus.statNm ?? "충전소")}
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              ${favBtnHtml(nowStar)}
              <button class="review-btn" style="border:1px solid #e5e7eb;background:#fff;padding:4px 8px;border-radius:8px;font-size:12px;cursor:pointer">리뷰보기</button>
            </div>
          </div>
          ${sPlus.addr ? `<div class="info-row">📍 ${escapeHtml(sPlus.addr)}</div>` : ""}
          ${sPlus.useTime ? `<div class="info-row">⏰ ${escapeHtml(sPlus.useTime)}</div>` : ""}
          ${sPlus.busiNm ? `<div class="info-row">👤 운영사: ${escapeHtml(sPlus.busiNm)}</div>` : ""}
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
        if (btn && !btn.disabled) {
          btn.addEventListener("click", async (e) => {
            e.stopPropagation();
            await toggleFavForStation(sPlus, "ev");
            const on = favSetRef.current?.has(favKeyOf(sPlus, "ev"));
            btn.textContent = on ? "★" : "☆";
            btn.classList.toggle("on", on);
            setMarkerIconByFav(marker, true, on, window.kakao);
          });
        }
        const rvBtn = root.querySelector(".review-btn");
        if (rvBtn) {
          rvBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            setReviewModal({ open: true, mode: "ev", station: sPlus });
          });
        }
      });
    } catch (e) {
      const fail = `
        <div class="info-window">
          <div class="info-title">${tip(sPlus.statNm ?? "충전소")}</div>
          ${sPlus.addr ? `<div class="info-row">📍 ${escapeHtml(sPlus.addr)}</div>` : ""}
          <div class="info-row" style="color:#c0392b">⚠️ 상태 조회 실패</div>
        </div>`.trim();
      setInfoHtml(fail, marker);
    }
  } else {
    // ───────── 주유소 인포윈도우 ─────────
    const mode = "oil";
    const stationName = sPlus.name ?? sPlus.NAME ?? "이름없음";
    const addr  = sPlus.address ?? sPlus.ADDR ?? sPlus.ADDRESS ?? "";
    const brand = brandName(sPlus.brand ?? sPlus.BRAND, sPlus.brandGroup);
    const isLpg = (sPlus.lpgYN ?? sPlus.LPG_YN) === "Y";

    const favKey = favKeyOf(sPlus, mode);
    const starredNow = !!(favKey && favSetRef.current?.has(favKey));
    const favBtnHtml = (on) => `
      <button class="fav-btn ${on ? "on" : ""}"
              ${isLoggedIn() ? "" : "disabled"}
              title="${isLoggedIn() ? (on ? "즐겨찾기 해제" : "즐겨찾기 추가") : "로그인 필요"}"
              style="border:none;background:transparent;font-size:18px;line-height:1;${isLoggedIn() ? "cursor:pointer;" : "cursor:not-allowed;opacity:.5"}">
        ${on ? "★" : "☆"}
      </button>`;

    // (가격 로딩 전 화면)
    const baseHtml = `
      <div class="info-window">
        <div class="info-header" style="display:flex;align-items:center;gap:8px;justify-content:space-between;">
          <div style="flex:1;min-width:0;display:flex;align-items:center;gap:8px;">
            <div class="info-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              ${tip(stationName)}
            </div>
            ${brand ? `<span class="info-badge">${escapeHtml(brand)}</span>` : ""}
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            ${favBtnHtml(starredNow)}
            <button class="review-btn" style="border:1px solid #e5e7eb;background:#fff;padding:4px 8px;border-radius:8px;font-size:12px;cursor:pointer">리뷰보기</button>
          </div>
        </div>
        ${addr ? `<div class="info-row">📍 ${escapeHtml(addr)}</div>` : ""}
        ${oilAvgPairPanel(sPlus, { lpgOnly: isLpg })}
        <div class="price-box">가격 불러오는 중…</div>
        <div class="info-flags">
          ${[
            ["세차장", (sPlus.carWash ?? sPlus.CAR_WASH_YN) === "Y"],
            ["편의점", (sPlus.store ?? sPlus.CVS_YN ?? sPlus.CONVENIENCE_YN) === "Y"],
            ["경정비", (sPlus.repair ?? sPlus.MAINT_YN) === "Y"],
            ["셀프주유소", (sPlus.self ?? sPlus.SELF_YN) === "Y"],
            ["품질인증주유소", (sPlus.quality ?? sPlus.KPETRO_YN ?? sPlus.QUAL_YN) === "Y"],
            ["24시간", (sPlus.twentyFour ?? sPlus.OPEN_24H_YN ?? sPlus.TWENTY_FOUR_YN) === "Y"],
            ["LPG충전소", (sPlus.lpgYN ?? sPlus.LPG_YN) === "Y"],
          ].map(([k, v]) => `<span class="flag ${v ? "on" : ""}">${k}</span>`).join("")}
        </div>
      </div>`.trim();

    setInfoHtml(baseHtml, marker, (root) => {
      const btn = root.querySelector(".fav-btn");
      if (btn && !btn.disabled) {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          await toggleFavForStation(sPlus, "oil");
          const on = favSetRef.current?.has(favKeyOf(sPlus, "oil"));
          btn.textContent = on ? "★" : "☆";
          btn.classList.toggle("on", on);
          setMarkerIconByFav(marker, false, on, window.kakao);
        });
      }
      const rvBtn = root.querySelector(".review-btn");
      if (rvBtn) {
        rvBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          setReviewModal({ open: true, mode: "oil", station: sPlus });
        });
      }
    });

    // 가격 조회
    let oilHtml = "";
    const priceId = getOilId(sPlus);
    if (!priceId) {
      oilHtml = `<div class="price-error">⚠️ 가격 조회용 ID가 없어 가격을 불러올 수 없습니다.</div>`;
    } else {
      try {
        const res = await axios.get("/api/oil/price", { params: { id: priceId } });
        const prices = res.data || {};
        const won = (n) => Number(n).toLocaleString();
        oilHtml = (prices["휘발유"] || prices["경유"] || prices["LPG"] || prices["등유"])
          ? `<div class="price-box">
               ${prices["휘발유"] ? `<div class="price-row"><span>⛽ 휘발유</span><b>${won(prices["휘발유"])}원</b></div>` : ""}
               ${prices["경유"] ? `<div class="price-row"><span>🛢 경유</span><b>${won(prices["경유"])}원</b></div>` : ""}
               ${prices["등유"] ? `<div class="price-row"><span>🏠 등유</span><b>${won(prices["등유"])}원</b></div>` : ""}
               ${prices["LPG"] ? `<div class="price-row"><span>🔥 LPG</span><b>${won(prices["LPG"])}원</b></div>` : ""}
             </div>`
          : `<div class="price-box">⚠️ 가격 등록이 안됐습니다.</div>`;
      } catch {
        oilHtml = `<div class="price-error">⚠️ 가격 정보를 불러오지 못했습니다.</div>`;
      }
    }

    // (가격 로딩 후 최종 화면)
    const html = `
      <div class="info-window">
        <div class="info-header" style="display:flex;align-items:center;gap:8px;justify-content:space-between;">
          <div style="flex:1;min-width:0;display:flex;align-items:center;gap:8px;">
            <div class="info-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              ${tip(stationName)}
            </div>
            ${brand ? `<span class="info-badge">${escapeHtml(brand)}</span>` : ""}
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            ${favBtnHtml(starredNow)}
            <button class="review-btn" style="border:1px solid #e5e7eb;background:#fff;padding:4px 8px;border-radius:8px;font-size:12px;cursor:pointer">리뷰보기</button>
          </div>
        </div>
        ${addr ? `<div class="info-row">📍 ${escapeHtml(addr)}</div>` : ""}
        ${oilAvgPairPanel(sPlus, { lpgOnly: isLpg })}
        ${oilHtml}
        <div class="info-flags">
          ${[
            ["세차장", (sPlus.carWash ?? sPlus.CAR_WASH_YN) === "Y"],
            ["편의점", (sPlus.store ?? sPlus.CVS_YN ?? sPlus.CONVENIENCE_YN) === "Y"],
            ["경정비", (sPlus.repair ?? sPlus.MAINT_YN) === "Y"],
            ["셀프주유소", (sPlus.self ?? sPlus.SELF_YN) === "Y"],
            ["품질인증주유소", (sPlus.quality ?? sPlus.KPETRO_YN ?? sPlus.QUAL_YN) === "Y"],
            ["24시간", (sPlus.twentyFour ?? sPlus.OPEN_24H_YN ?? sPlus.TWENTY_FOUR_YN) === "Y"],
            ["LPG충전소", (sPlus.lpgYN ?? sPlus.LPG_YN) === "Y"],
          ].map(([k, v]) => `<span class="flag ${v ? "on" : ""}">${k}</span>`).join("")}
        </div>
      </div>`.trim();

    setInfoHtml(html, marker, (root) => {
      const btn = root.querySelector(".fav-btn");
      if (btn && !btn.disabled) {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          await toggleFavForStation(sPlus, "oil");
          const on = favSetRef.current?.has(favKeyOf(sPlus, "oil"));
          btn.textContent = on ? "★" : "☆";
          btn.classList.toggle("on", on);
          setMarkerIconByFav(marker, false, on, window.kakao);
        });
      }
      const rvBtn = root.querySelector(".review-btn");
      if (rvBtn) {
        rvBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          setReviewModal({ open: true, mode: "oil", station: sPlus });
        });
      }
    });
  }

  // 포커싱 이동
  mapRef.current.panTo(pos);
});


    });

    markersRef.current = newMarkers;
  if (newMarkers.length > 0) {
    // 우선 레벨 고정
    try { mapRef.current.setLevel(6, { animate: false }); } catch { mapRef.current.setLevel(6); }

    if (lastQueryRef.current?.type === "nearby") {
      // ✅ '내 주변' 검색이면 내 위치를 화면 중앙으로
      const { lat, lon } = lastQueryRef.current;
      const center = new window.kakao.maps.LatLng(lat, lon);
      mapRef.current.setCenter(center);        // panTo 대신 setCenter(무애니메이션)
      myMarkerRef.current?.setPosition(center);
    } else {
      // 일반 필터 검색이면 기존 로직으로 밀집 중심
      const pts = [];
      drawList.forEach((s0) => {
        const lat = Number(s0.lat ?? s0.LAT);
        const lon = Number(s0.lon ?? s0.LON ?? s0.lng);
        if (Number.isFinite(lat) && Number.isFinite(lon)) pts.push({ lat, lon });
      });
      const bestCenter = findDensestCenterAtLevel(mapRef.current, pts, 6);
      if (bestCenter) mapRef.current.panTo(bestCenter);
    }
  }
  }, [mapReady,stations, favSet, avgMap, priceBasis]);

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
  const isMobile = window.innerWidth <= 768;

  return (
    <div className="map-container">
      <div ref={mapDivRef} className="map-area" />

      {/* ✅ 날씨 카드 */}
      <div className="weather-card">
        {weather ? (
          <div>
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
          </div>
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
      <div className="price-legend">
        <span className="legend-title">가격 마커 안내</span>

        <LegendDot color="#ef4444" />
        <span>{isMobile ? "+30 이상" : "평균보다 +30 이상"}</span>

        <LegendDot color="#f59e0b" />
        <span>{isMobile ? "±30 구간" : "±30 구간"}</span>

        <LegendDot color="#10b981" />
        <span>{isMobile ? "-30 이하" : "평균보다 -30 이하"}</span>
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

// 레벨 6에서 최다 밀집 영역의 중심을 찾아 panTo용 LatLng 반환
function findDensestCenterAtLevel(map, points, targetLevel = 6) {
  if (!map || !window.kakao || !points?.length) return null;

  const b = map.getBounds();
  if (!b) return null;

  // 현재 레벨/뷰포트의 위경도 스팬
  const currLevel = map.getLevel();
  const latSpanNow = Math.abs(b.getNorthEast().getLat() - b.getSouthWest().getLat());
  const lngSpanNow = Math.abs(b.getNorthEast().getLng() - b.getSouthWest().getLng());

  // 카카오맵: 레벨이 1 커질 때마다 스케일 2배 → span도 2배
  const scale = Math.pow(2, targetLevel - currLevel);
  const latSpan = latSpanNow * scale;
  const lngSpan = lngSpanNow * scale;

  const halfLat = latSpan / 2;
  const halfLng = lngSpan / 2;

  // 레벨 6 뷰 사각형 안에 가장 많은 포인트가 들어오게 하는 중심 찾기
  let bestCount = -1;
  let bestLat = points[0].lat;
  let bestLng = points[0].lon;

  for (const p of points) {
    const minLat = p.lat - halfLat, maxLat = p.lat + halfLat;
    const minLng = p.lon - halfLng, maxLng = p.lon + halfLng;
    let c = 0;
    for (const q of points) {
      if (q.lat >= minLat && q.lat <= maxLat && q.lon >= minLng && q.lon <= maxLng) c++;
    }
    if (c > bestCount) {
      bestCount = c;
      bestLat = p.lat;
      bestLng = p.lon;
    }
  }

  return new window.kakao.maps.LatLng(bestLat, bestLng);
}




function ReviewModal({ open, mode, station, onClose }) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const makeReviewKey = () => {
    const id = getStationId();
    const m = (mode === "oil" ? "oil" : "ev"); // charge → ev로 들어온다면 여기서 ev 처리
    return `${m}:${id}`;
  };

  const getMyUserId = () => {
    try {
      const p = parseJwt(getToken()) || {};
      // 서버 JWT payload 안에 userId 가 있다고 가정
      return p.userId || p.sub || "익명";
    } catch {
      return "익명";
    }
  };

  // 작성 상태
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const MAX_LEN = 500;
  const loggedIn = isLoggedIn();

  // 토큰(payload)에서 닉네임/아이디를 뽑아 표시명으로 사용
  const getMyDisplayName = () => {
    try {
      const p = parseJwt(getToken()) || {};
      // 선호 순서: nickname > name > username > user > email local-part > sub
      const nick =
        p.nickname ||
        p.name ||
        p.username ||
        p.user ||
        (p.email ? String(p.email).split("@")[0] : null) ||
        p.sub;
      return nick ? String(nick) : "익명";
    } catch {
      return "익명";
    }
  };

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
        const token = getToken();
        const res = await fetch(
          `/api/route/reviews?key=${encodeURIComponent(makeReviewKey())}`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );
        const json = await res.json();

        const list = (json?.items ?? []).map(r => {
          let nick = r.user || "익명";

          // ⚡ 서버가 accessToken 같은 잘못된 값을 줄 때 교정
          if (!nick || nick === "accessToken") {
            nick = getMyUserId();
          }

          return {
            id: r.id,
            nickname: nick,
            text: r.text,
            rating: r.rating != null ? Math.round(r.rating) : undefined,
            createdAt: r.createdAt || r.updatedAt || "",
            mine: !!r.mine,
          };
        });

        if (!ignore) setItems(list);
      } catch {
        if (!ignore) setItems([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    // 모달 닫히면 폼 초기화
    return () => {
      ignore = true;
      setText("");
      setRating(0);
      setSubmitting(false);
    };
  }, [open, mode, station]);

  // 삭제 함수 (경로 파라미터 사용 + 토큰만 헤더에)
  const deleteReview = async (reviewId) => {
    if (!loggedIn) { alert("로그인 후 이용 가능합니다."); return; }
    if (!window.confirm("이 리뷰를 삭제할까요?")) return;

    // 낙관적 제거(실패 시 롤백 대비 복제본 저장)
    const snapshot = [...items];
    setItems(prev => prev.filter(r => r.id !== reviewId));

    try {
      const res = await fetch(`/api/route/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });

      if (!res.ok) {
        // 401/403 등 처리
        const msg = res.status === 403
          ? "삭제 권한이 없습니다."
          : res.status === 401
            ? "로그인이 필요합니다."
            : "삭제에 실패했습니다.";
        throw new Error(msg);
      }

      // (선택) 서버 응답 {"ok":true} 체크
      // const j = await res.json();
      // if (!j.ok) throw new Error("삭제 실패");
    } catch (e) {
      alert(e.message || "삭제에 실패했습니다.");
      setItems(snapshot); // 롤백
    }
  };

  const submitReview = async (e) => {
    e?.preventDefault?.();
    if (!loggedIn) { alert("로그인 후 이용 가능합니다."); return; }
    const clean = text.trim();
    if (!clean) { alert("리뷰 내용을 입력해주세요."); return; }

    try {
      setSubmitting(true);
      const res = await fetch("/api/route/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          key: makeReviewKey(),           // 서버는 key만 받음
          text: clean,
          rating: rating || null,
        }),

      });
      console.log("res : " + res);
      if (!res.ok) throw new Error("리뷰 저장 실패");
      const { item } = await res.json();   // 서버 응답: { item: { id } }

      const now = new Date().toISOString();
      setItems(prev => [{
        id: item?.id ?? Math.random().toString(36).slice(2),
        nickname: getMyUserId(),                    // 서버가 닉네임 안 주므로 프론트에서 표시만
        text: clean,
        rating: rating || undefined,        // UI가 정수 별점 repeat
        createdAt: now,                     // 서버는 create 응답에 시간 안 줌 → 프론트에서 now 사용
        mine: true,
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

        {/* 리스트 영역 (스크롤) */}
        <div className="review-modal__body">
          {loading ? (
            <div className="review-modal__empty">불러오는 중…</div>
          ) : items.length === 0 ? (
            <div className="review-modal__empty">아직 등록된 리뷰가 없습니다.</div>
          ) : (
            <ul className="review-list">
              {items.map((r, i) => (
                <li key={`review-${r.id ?? i}`} className="review-item">
                  <div className="review-item__top">
                    <div className="review-item__avatar" />
                    <div className="review-item__meta">
                      <b className="review-item__nick">{r.nickname}</b>
                      <span className="review-item__date">{(r.createdAt ?? "").slice(0, 10)}</span>
                    </div>
                    <div className="review-item__right">
                      {r.rating ? (
                        <span className="review-item__rating">
                          {"★".repeat(r.rating || 0)}{"☆".repeat(5 - (r.rating || 0))}
                        </span>
                      ) : null}
                      {r.mine && loggedIn && (
                        <button
                          className="review-delete"
                          onClick={() => deleteReview(r.id)}
                          title="내가 쓴 리뷰 삭제"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="review-item__text">{r.text ?? r.content ?? ""}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 작성 영역 (아래로 이동) */}
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
              placeholder={loggedIn ? "방문 소감, 가격, 친절도 등을 적어주세요." : "로그인 후 작성할 수 있습니다."}
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
          </div>
        </section>
      </div>
    </div>
  );
}

