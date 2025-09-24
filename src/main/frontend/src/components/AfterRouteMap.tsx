// src/main/frontend/src/components/RouteMap.tsx
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

/* ========================================================
   Kakao Types (아주 얇은 선언 — 실제 SDK가 로드되면 런타임에서 채워짐)
   ======================================================== */
declare global {
  interface Window {
    kakao?: any; // window.kakao.maps.* 를 자유롭게 사용
  }
}

/* ========================================================
   외부(다른 파일)에서 이미 존재하는 헬퍼들의 타입 선언
   ======================================================== */
// 실제 구현은 기존 프로젝트에 있습니다. 여기서는 TS 컴파일을 위한 시그니처만 선언합니다.
export type LatLng = { lat: number; lng: number; name?: string };
export type StationEV = LatLng & {
  statId?: string;
  statIds?: string[];
  addr?: string;
  usetime?: string;
  floornum?: string;
  floortype?: string;
  businm?: string;
  busicall?: string;
  hasDc?: boolean;
  hasAc?: boolean;
  chargerCount?: number;
  [k: string]: any;
};
export type StationOil = LatLng & {
  uni?: string; // UNI_CD
  addr?: string;
  brand?: string;
  brandGroup?: string;
  tel?: string;
  self?: string;
  cvsYn?: string;
  carWashYn?: string;
  maintYn?: string;
  kpetroYn?: string;
  lpgYn?: string;
  open24hYn?: string;
  avg?: Record<string, number>;
  diff?: Record<string, number>;
  [k: string]: any;
};

export type LabeledMarkerInfo = {
  marker: any;
  overlay?: any;
};

export declare function addLabeledMarker(args: {
  map: any;
  kakao: any;
  type: string;
  lat: number;
  lng: number;
  name?: string;
  labelAlways?: boolean;
  starred?: boolean;
}): LabeledMarkerInfo;

export declare function brandName(code?: string, group?: string): string;
export declare function chargerTypeName(code?: string): string;
export declare function floorTypeName(code?: string): string;
export declare function coordToLabel(lat: number, lng: number): Promise<string>;
export declare function resolveTextToLonLat(
  text: string
): Promise<[number, number]>; // [lon, lat]
export declare function favKeyOf(obj: any, cat: string): string;
export declare function isLoggedIn(): boolean;
export declare function getToken(): string | null;
export declare function pickAddress(obj: any): string;
export declare function isKoreaWgs(lat?: number, lng?: number): boolean;
export declare function parseNum(v: any): number;
export declare function tmToWgs(
  x: number,
  y: number
): { lat: number; lng: number } | null;
export declare function escapeHtml(s: string): string;
export declare function tip(s: string): string;
export declare function fmtTs(ts: string): string;
export declare function productName(code?: string): string;
export declare function fmtWon(n?: number): string;
export declare function markerTypeByBasis(
  gs: StationOil,
  cat: "oil" | "lpg",
  basis: string
): string;
export declare function oilAvgPairPanel(
  gs: StationOil,
  opt?: { lpgOnly?: boolean }
): string;
export declare function wasEdited(created?: string, updated?: string): boolean;
export declare function toggleFavForStation(
  site: StationEV | StationOil,
  cat: "ev" | "oil"
): Promise<void>;

/* ========================================================
   상수/설정
   ======================================================== */
const HOME_KEY = "route:home";
const PRESET: Record<string, [number, number]> = {
  휴먼교육센터: [127.147169, 36.807313],
};
const OSRM = "https://router.project-osrm.org"; // 필요 시 환경변수로 교체

const LABEL_ALWAYS = true;
const AUTO_HIDE_LEVEL = { oil: 7, lpg: 7, ev: 7 } as const;

/* ========================================================
   Kakao SDK 로더
   ======================================================== */
const KAKAO_APP_KEY = process.env.REACT_APP_KAKAO_MAP_KEY as string;

function loadKakaoSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).kakao?.maps) {
      // 이미 로드됨
      (window as any).kakao.maps.load ? resolve() : resolve();
      return;
    }
    const id = "kakao-map-sdk";
    if (document.getElementById(id)) {
      const el = document.getElementById(id)!;
      el.addEventListener("load", () => {
        try {
          (window as any).kakao.maps.load(() => resolve());
        } catch {
          resolve();
        }
      });
      return;
    }
    if (!KAKAO_APP_KEY) {
      reject(new Error("REACT_APP_KAKAO_MAP_KEY 가 설정되지 않았습니다."));
      return;
    }
    const s = document.createElement("script");
    s.id = id;
    s.async = true;
    s.defer = true;
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&libraries=services&autoload=false`;
    s.onload = () => {
      try {
        (window as any).kakao.maps.load(() => resolve());
      } catch (e) {
        reject(e);
      }
    };
    s.onerror = () => reject(new Error("Kakao SDK 로드 실패"));
    document.head.appendChild(s);
  });
}

/* ========================================================
   유틸: 거리/경로 보조
   ======================================================== */
const havKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

const minDistanceKmFromPath = (
  pathLatLng: any[],
  lon: number,
  lat: number
) => {
  let min = Infinity;
  for (let i = 0; i < pathLatLng.length; i++) {
    const p = pathLatLng[i];
    const d = havKm(p.getLat(), p.getLng(), lat, lon);
    if (d < min) min = d;
  }
  return min;
};

/* ========================================================
   OSRM 라우팅
   ======================================================== */
export type OsrmRoute = {
  distance: number; // meters
  duration: number; // seconds
  geometry: { type: "LineString"; coordinates: [number, number][] };
};

async function fetchOsrm(
  origin: [number, number],
  dest: [number, number]
): Promise<OsrmRoute> {
  const url = `${OSRM}/route/v1/driving/${origin[0]},${origin[1]};${dest[0]},${dest[1]}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM 오류: ${res.status}`);
  const json = await res.json();
  if (!json.routes?.length) throw new Error("경로가 없습니다.");
  return json.routes[0] as OsrmRoute;
}

async function fetchOsrmVia(
  origin: [number, number],
  via: [number, number],
  dest: [number, number]
): Promise<OsrmRoute> {
  const url = `${OSRM}/route/v1/driving/${origin[0]},${origin[1]};${via[0]},${via[1]};${dest[0]},${dest[1]}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM 오류(경유): ${res.status}`);
  const json = await res.json();
  if (!json.routes?.length) throw new Error("경유 경로가 없습니다.");
  return json.routes[0] as OsrmRoute;
}

/* ========================================================
   컴포넌트 상태 타입들
   ======================================================== */
type RouteCtx = {
  origin: [number, number] | null; // [lon,lat]
  dest: [number, number] | null;
  baseMeters: number;
  baseSeconds: number;
  path: any[] | null; // kakao.maps.LatLng[]
  destFixed: boolean; // true면 경유 모드
  previewTopN?: boolean;
  onlyDest?: boolean;
  destKey?: string;
  viaKey?: string;
};

type MarkerRec = {
  marker: any;
  overlay?: any;
  type: string; // marker 스타일 키(oil/oil-cheap/ev 등)
  cat: "ev" | "oil" | "lpg";
  key?: string; // destKey 비교용
  favKey?: string;
  uniKey?: string;
  lat: number;
  lng: number;
  data: StationEV | StationOil;
  _ok?: boolean;
  _dist?: number;
};

/* ========================================================
   메인 컴포넌트
   ======================================================== */
const AfterRouteMap: React.FC = () => {
  // 지도/마커 레퍼런스
  const mapRef = useRef<any>(null);
  const polyRef = useRef<any>(null);
  const viaRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const allMarkersRef = useRef<MarkerRec[]>([]);
  const activeMarkerRef = useRef<{ marker?: any } | null>(null);

  // 출발/도착 마커
  const odRef = useRef<{
    origin?: any;
    originLabel?: any;
    dest?: any;
    destLabel?: any;
  }>({});

  // 상태들
  const [summary, setSummary] = useState("");
  const [detourSummary, setDetourSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeCat, setActiveCat] = useState<"ev" | "oil" | "lpg">("ev");
  const [nearestCount, setNearestCount] = useState(5);
  const [priceBasis, setPriceBasis] =
    useState<"B027" | "D047" | "K015">("B027");

  const [originInput, setOriginInput] = useState("");
  const [destInput, setDestInput] = useState("");

  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [clickMode, setClickMode] =
    useState<"" | "origin" | "dest">("");

  const [homeCoord, setHomeCoord] = useState<{ lat: number; lng: number }>(
    () => {
      const [defLng, defLat] =
        PRESET["휴먼교육센터"] ?? [127.147169, 36.807313];
      return { lat: defLat, lng: defLng };
    }
  );

  const filtersRef = useRef({
    ev: {
      enabled: true,
      status: "any" as "any" | "available",
      type: "any" as "any" | "dc" | "ac" | "combo",
    },
    oil: { enabled: false },
    lpg: { enabled: false },
  });
  const [filters, setFilters] = useState(filtersRef.current);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // 경로 컨텍스트
  const routeCtxRef = useRef<RouteCtx>({
    origin: null,
    dest: null,
    baseMeters: 0,
    baseSeconds: 0,
    path: null,
    destFixed: false,
  });

  // "경로 & 표시" 직후 최초 1회 도착지만 보이기 플래그
  const onlyDestNextRef = useRef(false);
  const destFocusKeyRef = useRef<string>("");

  // 게이트: 마커 전체 표시/숨김(추천 모드 등에서 제어)
  const markersVisibleRef = useRef(false);
  const showMarkers = () => {
    markersVisibleRef.current = true;
  };
  const hideMarkers = () => {
    markersVisibleRef.current = false;
  };

  /* --------------------------------------------
     SDK 로드 + 지도 생성 + 클릭 이벤트 바인딩
     -------------------------------------------- */
  useEffect(() => {
    let canceled = false;

    (async () => {
      try {
        await loadKakaoSdk();
        if (canceled) return;
        const { kakao } = window as any;

        const container = document.getElementById("map");
        if (!container) return;

        const center = new kakao.maps.LatLng(
          homeCoord.lat,
          homeCoord.lng
        );
        const map = new kakao.maps.Map(container, {
          center,
          level: 7,
        });
        mapRef.current = map;

        // 지도 클릭 → onMapClick 연결
        kakao.maps.event.addListener(
          map,
          "click",
          (mouseEvent: any) => {
            const latlng = mouseEvent.latLng;
            onMapClick({
              lat: latlng.getLat(),
              lng: latlng.getLng(),
            });
          }
        );

        // 초기 홈 마커가 필요하면:
        // drawHomeMarker(homeCoord);
      } catch (e) {
        console.error(e);
        alert("지도를 불러오지 못했습니다. (Kakao SDK)");
      }
    })();

    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --------------------------------------------
     상태/배지 유틸 (모달/인포윈도우 공통)
     -------------------------------------------- */
  const statusText = (s?: string | number) => {
    const code = String(s ?? "").trim() || "9";
    return (
      {
        "1": "통신이상",
        "2": "충전가능",
        "3": "충전중",
        "4": "운영중지",
        "5": "점검중",
        "9": "미확인",
        "0": "미확인",
      } as const
    )[code] || "미확인";
  };
  const statusBadgeStyle = (s?: string | number) => {
    const code = String(s ?? "").trim() || "9";
    let bg = "#999";
    if (code === "2") bg = "#27ae60";
    else if (code === "3") bg = "#f39c12";
    else if (code === "5") bg = "#e74c3c";
    else if (code === "4" || code === "1" || code === "9")
      bg = "#7f8c8d";
    return {
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 999,
      background: bg,
      color: "#fff",
      fontSize: 12,
    } as React.CSSProperties;
  };

  /* --------------------------------------------
     포인트 클릭시: 도착/경유 그리기
     -------------------------------------------- */
  const drawDetourForPoint = useCallback(async (p: LatLng) => {
    try {
      const ctx = routeCtxRef.current;
      if (!ctx?.origin || !window.kakao?.maps || !mapRef.current)
        return;
      const { kakao } = window;

      // 도착 고정 전 → 항상 도착 갱신(파란선)
      if (!ctx.destFixed) {
        const destLonLat: [number, number] = [
          Number(p.lng),
          Number(p.lat),
        ];

        if (polyRef.current) {
          polyRef.current.setMap(null);
          polyRef.current = null;
        }
        if (viaRef.current) {
          viaRef.current.setMap(null);
          viaRef.current = null;
        }

        const route = await fetchOsrm(ctx.origin, destLonLat);
        const path = route.geometry.coordinates.map(
          ([lon, lat]) => new kakao.maps.LatLng(lat, lon)
        );
        const blue = new kakao.maps.Polyline({
          path,
          strokeWeight: 5,
          strokeColor: "#1e88e5",
          strokeOpacity: 0.9,
          strokeStyle: "solid",
        });
        blue.setMap(mapRef.current);
        polyRef.current = blue;

        // 프리뷰 모드: 도착 핀 제거
        if (odRef.current.dest) {
          odRef.current.dest.setMap(null);
          odRef.current.dest = null;
        }
        if (odRef.current.destLabel) {
          odRef.current.destLabel.setMap(null);
          odRef.current.destLabel = null;
        }

        routeCtxRef.current = {
          origin: ctx.origin,
          dest: destLonLat,
          baseMeters: route.distance,
          baseSeconds: route.duration,
          path,
          destFixed: false,
        };

        const km = (route.distance / 1000).toFixed(2);
        const min = Math.round(route.duration / 60);
        setSummary(
          `출발 → ${p.name || "선택지"}: 총 ${km} km / 약 ${min} 분`
        );
        setDetourSummary("");

        const bounds = new kakao.maps.LatLngBounds();
        path.forEach((pt: any) => bounds.extend(pt));
        mapRef.current.setBounds(bounds);

        applyFiltersToMarkers();
        return;
      }

      // 도착 고정 → 경유(보라선)
      const via: [number, number] = [Number(p.lng), Number(p.lat)];
      const route = await fetchOsrmVia(
        ctx.origin,
        via,
        ctx.dest as [number, number]
      );

      if (viaRef.current) {
        viaRef.current.setMap(null);
        viaRef.current = null;
      }

      const path = route.geometry.coordinates.map(
        ([lon, lat]) => new kakao.maps.LatLng(lat, lon)
      );
      const purple = new kakao.maps.Polyline({
        path,
        strokeWeight: 5,
        strokeColor: "#8e24aa",
        strokeOpacity: 0.9,
        strokeStyle: "solid",
      });
      purple.setMap(mapRef.current);
      viaRef.current = purple;

      const km = (route.distance / 1000).toFixed(2);
      const min = Math.round(route.duration / 60);
      const dKm = (
        (route.distance - (ctx.baseMeters || 0)) /
        1000
      ).toFixed(2);
      const dMn = Math.max(
        0,
        Math.round((route.duration - (ctx.baseSeconds || 0)) / 60)
      );
      setDetourSummary(
        `경유(${p.name || "선택지"}) 포함: 총 ${km} km / 약 ${min} 분  (+${dKm} km · +${dMn} 분)`
      );

      const bounds = new kakao.maps.LatLngBounds();
      path.forEach((pt: any) => bounds.extend(pt));
      mapRef.current.setBounds(bounds);
    } catch (e) {
      console.error("경유/도착 처리 실패:", e);
      alert("경로를 계산하지 못했습니다.");
    }
  }, []);

  /* --------------------------------------------
     지도 클릭: 출발/도착 지정 (경로는 그리지 않음)
     -------------------------------------------- */
  const replaceOriginPin = (p: LatLng & { name?: string }) => {
    const { kakao } = window;
    if (!mapRef.current || !kakao?.maps) return;
    if (odRef.current.origin) {
      odRef.current.origin.setMap(null);
      odRef.current.origin = null;
    }
    if (odRef.current.originLabel) {
      odRef.current.originLabel.setMap(null);
      odRef.current.originLabel = null;
    }
    const { marker, overlay } = addLabeledMarker({
      map: mapRef.current,
      kakao,
      type: "origin",
      lat: p.lat,
      lng: p.lng,
      name: p.name || "출발",
      labelAlways: true,
    });
    odRef.current.origin = marker;
    odRef.current.originLabel = overlay;
    overlay?.setMap(mapRef.current);
  };
  const replaceDestPin = (p: LatLng & { name?: string; keepBehindPoi?: boolean }) => {
    const { kakao } = window;
    if (!mapRef.current || !kakao?.maps) return;
    if (odRef.current.dest) {
      odRef.current.dest.setMap(null);
      odRef.current.dest = null;
    }
    if (odRef.current.destLabel) {
      odRef.current.destLabel.setMap(null);
      odRef.current.destLabel = null;
    }
    const { marker, overlay } = addLabeledMarker({
      map: mapRef.current,
      kakao,
      type: "dest",
      lat: p.lat,
      lng: p.lng,
      name: p.name || "도착",
      labelAlways: true,
    });
    if (p.keepBehindPoi) {
      try {
        marker.setZIndex(1);
      } catch {}
    }
    odRef.current.dest = marker;
    odRef.current.destLabel = overlay;
    overlay?.setMap(mapRef.current);
  };

  const clearRouteOnly = () => {
    if (polyRef.current) {
      polyRef.current.setMap(null);
      polyRef.current = null;
    }
    if (viaRef.current) {
      viaRef.current.setMap(null);
      viaRef.current = null;
    }
  };

  const onMapClick = useCallback(
    async ({ lat, lng }: { lat: number; lng: number }) => {
      const mode = clickMode;
      if (!mode) return;

      const lonLat: [number, number] = [Number(lng), Number(lat)];
      const label = await coordToLabel(lat, lng);

      if (mode === "origin") {
        clearRouteOnly();
        setOriginInput(label);
        replaceOriginPin({ lat, lng });

        routeCtxRef.current = {
          origin: lonLat,
          dest: null,
          baseMeters: 0,
          baseSeconds: 0,
          path: null,
          destFixed: false,
          previewTopN: false,
        };

        mapRef.current?.setCenter(
          new window.kakao!.maps.LatLng(lat, lng)
        );
        setSummary(
          "출발지 설정됨 · 아래 ‘경로 & 표시’를 눌러 추천을 보세요"
        );
        setDetourSummary("");
        hideMarkers();
        setClickMode("");
        return;
      }

      // dest
      setDestInput(label);
      const ctx = routeCtxRef.current;
      if (ctx?.origin) {
        replaceDestPin({ lat, lng, name: "도착" });
        routeCtxRef.current = {
          origin: ctx.origin,
          dest: lonLat,
          baseMeters: 0,
          baseSeconds: 0,
          path: null,
          destFixed: false,
        };
        setSummary(
          "도착지 설정됨 · 아래 ‘경로 & 표시’ 버튼을 눌러 경로를 그리세요"
        );
        setDetourSummary("");
        hideMarkers();
      } else {
        replaceDestPin({ lat, lng, name: "도착" });
        setSummary("도착지 설정됨 · 출발지를 먼저 지정하세요.");
      }
      setClickMode("");
    },
    [clickMode]
  );

  /* --------------------------------------------
     경로 버튼
     -------------------------------------------- */
  const handleRoute = useCallback(async () => {
    try {
      if (!window.kakao?.maps || !mapRef.current) {
        alert("지도를 준비 중입니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      setLoading(true);
      clearRouteOnly();
      hideMarkers();

      const origin = await resolveTextToLonLat(originInput);

      // 도착 미입력 → 출발지만 설정 & Top-N 프리뷰
      if (!destInput.trim()) {
        routeCtxRef.current = {
          origin,
          dest: null,
          baseMeters: 0,
          baseSeconds: 0,
          path: null,
          destFixed: false,
          previewTopN: true,
        };

        const { kakao } = window;
        const { marker, overlay } = addLabeledMarker({
          map: mapRef.current,
          kakao,
          type: "origin",
          lat: origin[1],
          lng: origin[0],
          name: "출발",
          labelAlways: true,
        });
        odRef.current.origin = marker;
        odRef.current.originLabel = overlay;
        overlay?.setMap(mapRef.current);

        mapRef.current.setCenter(
          new kakao.maps.LatLng(origin[1], origin[0])
        );
        setSummary("출발지 설정됨 · ‘경로 & 표시’를 눌러 추천을 보세요");
        setDetourSummary("");

        if (onlyDestNextRef.current && destFocusKeyRef.current) {
          routeCtxRef.current = {
            ...(routeCtxRef.current || ({} as RouteCtx)),
            onlyDest: true,
            destKey: destFocusKeyRef.current,
          } as RouteCtx;
          onlyDestNextRef.current = false;
          destFocusKeyRef.current = "";
        }

        showMarkers();
        applyFiltersToMarkers();
        return;
      }

      // 도착 있음 → 경로 계산
      const dest = await resolveTextToLonLat(destInput);
      const route = await fetchOsrm(origin, dest);

      const { kakao } = window;
      const path = route.geometry.coordinates.map(
        ([lon, lat]) => new kakao.maps.LatLng(lat, lon)
      );

      const onlyOne =
        !!(onlyDestNextRef.current && destFocusKeyRef.current);
      const destKeyFromFocus = onlyOne
        ? destFocusKeyRef.current
        : undefined;

      routeCtxRef.current = {
        origin,
        dest,
        baseMeters: route.distance,
        baseSeconds: route.duration,
        path,
        destFixed: true,
        destKey: destKeyFromFocus,
        onlyDest: onlyOne,
        viaKey: undefined,
      };

      const km = (route.distance / 1000).toFixed(2);
      const min = Math.round(route.duration / 60);
      setSummary(`기본 경로: 총 ${km} km / 약 ${min} 분`);
      setDetourSummary("");

      const polyline = new kakao.maps.Polyline({
        path,
        strokeWeight: 5,
        strokeColor: "#1e88e5",
        strokeOpacity: 0.9,
        strokeStyle: "solid",
      });
      polyline.setMap(mapRef.current);
      polyRef.current = polyline;

      // 출발 핀
      {
        const { marker, overlay } = addLabeledMarker({
          map: mapRef.current,
          kakao,
          type: "origin",
          lat: origin[1],
          lng: origin[0],
          name: "출발",
          labelAlways: true,
        });
        odRef.current.origin = marker;
        odRef.current.originLabel = overlay;
        overlay?.setMap(mapRef.current);
      }

      // 도착 핀은 POI 뒤로
      replaceDestPin({
        lat: dest[1],
        lng: dest[0],
        name: "도착",
        keepBehindPoi: true,
      });

      showMarkers();
      applyFiltersToMarkers();

      const bounds = new kakao.maps.LatLngBounds();
      path.forEach((p: any) => bounds.extend(p));
      mapRef.current.setBounds(bounds);

      onlyDestNextRef.current = false;
      destFocusKeyRef.current = "";
    } catch (err: any) {
      console.error("❌ handleRoute 실패:", err);
      alert(err?.message || "경로 계산 실패");
    } finally {
      setLoading(false);
    }
  }, [destInput, originInput]);

  /* --------------------------------------------
     마커 필터/보이기
     -------------------------------------------- */
  const evAvailSetRef = useRef<Set<string> | null>(null);
  const nearestCountRef = useRef<number>(nearestCount);
  useEffect(() => {
    nearestCountRef.current = nearestCount;
  }, [nearestCount]);

  const statIdsOfSite = (site?: any) =>
    Array.isArray(site?.statIds) && site.statIds.length
      ? site.statIds.map(String)
      : site?.statId
      ? [String(site.statId)]
      : [];

  const matchesEvSubFilters = (site: any) => {
    const f = filtersRef.current.ev;
    const availSet = evAvailSetRef.current;

    if (f.status === "available") {
      if (!availSet || availSet.size === 0) return false;
      const hit = (site.statIds || []).some((id: any) =>
        availSet.has(String(id))
      );
      if (!hit) return false;
      return true;
    }

    if (f.type === "dc") return !!site.hasDc;
    if (f.type === "ac") return !!site.hasAc;
    if (f.type === "combo") return !!(site.hasDc && site.hasAc);
    return true;
  };

  const matchesOilSubFilters = (_gs: any) => true;

  const matchesFilter = (obj: MarkerRec) => {
    const cat = obj.cat;
    const curCat = activeCat;
    if (cat !== curCat) return false;

    const curFilters = filtersRef.current;
    if (cat === "ev" && !curFilters.ev.enabled) return false;
    if (cat === "oil" && !curFilters.oil.enabled) return false;
    if (cat === "lpg" && !curFilters.lpg.enabled) return false;

    if (!polyRef.current && mapRef.current) {
      const lvl = mapRef.current.getLevel?.();
      if (cat === "oil" && lvl >= AUTO_HIDE_LEVEL.oil) return false;
      if (cat === "lpg" && lvl >= AUTO_HIDE_LEVEL.lpg) return false;
      if (cat === "ev" && lvl >= AUTO_HIDE_LEVEL.ev) return false;
    }

    if (cat === "ev" && !matchesEvSubFilters(obj.data)) return false;
    if (cat === "oil" && !matchesOilSubFilters(obj.data)) return false;

    return true;
  };

  const applyFiltersToMarkers = () => {
    if (!markersVisibleRef.current) {
      const map = mapRef.current;
      const active = activeMarkerRef.current?.marker || null;
      allMarkersRef.current.forEach((o) => {
        // 즐겨찾기 세트가 외부에 있다면 여기에 붙이세요.
        const fav = isLoggedIn() && !!(o.favKey && false);
        const show = o.marker === active || fav;
        o.marker.setMap(show ? map : null);
        if (o.overlay)
          o.overlay.setMap(show ? (LABEL_ALWAYS ? map : null) : null);
      });
      return;
    }

    const arr = allMarkersRef.current;
    const ctx = routeCtxRef.current;

    // 1) 도착지만 보기 (onlyDest)
    if (ctx?.onlyDest) {
      const dk = ctx.destKey;
      if (dk) {
        arr.forEach((o) => {
          const show = o.key === dk;
          o.marker.setMap(show ? mapRef.current : null);
          if (o.overlay)
            o.overlay.setMap(
              show ? (LABEL_ALWAYS ? mapRef.current : null) : null
            );
        });

        if (clustererRef?.current) {
          const c = clustererRef.current;
          c.removeMarkers(arr.map((o) => o.marker));
          const keep = arr.find((o) => o.key === dk)?.marker;
          if (keep) c.addMarker(keep);
        }
        return;
      }
    }

    // 2) 출발지만 + Top-N 프리뷰
    if (ctx && ctx.origin && ctx.destFixed === false && ctx.previewTopN) {
      arr.forEach((o) => (o._ok = matchesFilter(o)));
      arr.forEach((o) => {
        o._dist = o._ok
          ? havKm(
              (ctx.origin as [number, number])[1],
              (ctx.origin as [number, number])[0],
              o.lat,
              o.lng
            )
          : Infinity;
      });

      const keep = new Set(
        arr
          .filter((o) => o._ok && o.cat === activeCat)
          .sort((a, b) => (a._dist! - b._dist!))
          .slice(0, nearestCountRef.current)
          .map((o) => o.marker)
      );

      arr.forEach((o) => {
        const show = keep.has(o.marker);
        o.marker.setMap(show ? mapRef.current : null);
        if (o.overlay)
          o.overlay.setMap(
            show ? (LABEL_ALWAYS ? mapRef.current : null) : null
          );
      });
      return;
    }

    // 3) 경로 없는 기본 모드
    const hasPath = !!(ctx && ctx.path);
    if (!hasPath || ctx.destFixed === false) {
      arr.forEach((o) => {
        const show = matchesFilter(o);
        o.marker.setMap(show ? mapRef.current : null);
        if (o.overlay)
          o.overlay.setMap(
            show ? (LABEL_ALWAYS ? mapRef.current : null) : null
          );
      });
      return;
    }

    // 4) 경로 고정 모드 → 경로 기준 Top-N
    if (!(ctx?.path && ctx.destFixed === true)) return;
    const path = ctx.path;
    arr.forEach((o) => (o._ok = matchesFilter(o)));
    arr.forEach(
      (o) =>
        (o._dist = o._ok
          ? minDistanceKmFromPath(path!, o.lng, o.lat)
          : Infinity)
    );

    const pickTop = (cat: MarkerRec["cat"], n: number) =>
      arr
        .filter((o) => o._ok && o.cat === cat)
        .sort((a, b) => (a._dist! - b._dist!))
        .slice(0, n);

    const keep = new Set(
      pickTop(activeCat, nearestCountRef.current).map((o) => o.marker)
    );

    arr.forEach((o) => {
      const show = keep.has(o.marker);
      o.marker.setMap(show ? mapRef.current : null);
      if (o.overlay)
        o.overlay.setMap(
          show ? (LABEL_ALWAYS ? mapRef.current : null) : null
        );
    });
  };

  /* --------------------------------------------
     홈/원점 초기화
     -------------------------------------------- */
  const drawHomeMarker = (_p: { lat: number; lng: number }) => {
    // 프로젝트에서 이미 구현돼 있으면 연결하세요.
  };
  const handleResetHome = () => {
    try {
      localStorage.removeItem(HOME_KEY);
    } catch {}
    const [defLng, defLat] =
      PRESET["휴먼교육센터"] ?? [127.147169, 36.807313];
    const def = { lat: defLat, lng: defLng };
    setHomeCoord(def);
    drawHomeMarker(def);
    if (mapRef.current && window.kakao?.maps) {
      mapRef.current.setCenter(
        new window.kakao.maps.LatLng(def.lat, def.lng)
      );
      mapRef.current.setLevel(7);
    }
    setSummary("원점이 기본 좌표로 초기화되었습니다.");
  };

  /* --------------------------------------------
     모달 정규화 유틸 (필요 시 사용)
     -------------------------------------------- */
  function normalizeOilPriceItems(json: any, uniHint?: string) {
    const out: Array<{
      product: string;
      price: number;
      ts: string;
      uni: string;
    }> = [];
    const seen = new Set<string>();
    const toNum = (v: any) => {
      const n = Number(String(v ?? "").replace(/,/g, "").trim());
      return Number.isFinite(n) ? n : NaN;
    };
    const push = (rec: any) => {
      if (!rec || typeof rec !== "object") return;
      const prodCd = rec.PRODCD || rec.PROD_CD || rec.productCode;
      const prodNm =
        rec.PRODNM ||
        ({ B027: "휘발유", D047: "경유", B034: "고급휘발유", C004: "등유", K015: "자동차용 LPG" } as any)[
          String(prodCd || "").trim()
        ] ||
        prodCd ||
        "기타";
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
    const isPriceRow = (node: any) =>
      node &&
      typeof node === "object" &&
      ("PRICE" in node || "PRICE_WON" in node || "PRIS" in node) &&
      ("PRODCD" in node ||
        "PROD_CD" in node ||
        "PRODNM" in node ||
        "productCode" in node);
    const walk = (node: any) => {
      if (!node || typeof node !== "object") return;
      if (isPriceRow(node)) push(node);
      if (Array.isArray(node)) node.forEach(walk);
      else Object.values(node).forEach(walk);
    };
    walk(json?.RESULT ?? json);
    return out;
  }

  function normalizeEvStatusForModal(json: any) {
    const items =
      json?.items?.item ||
      json?.list ||
      json?.data ||
      json?.Items ||
      json?.ITEMS ||
      [];
    const arr = Array.isArray(items) ? items : [items];
    const toNum = (v: any) => {
      const n = Number(String(v ?? "").replace(/,/g, "").trim());
      return Number.isFinite(n) ? n : undefined;
    };
    return arr.map((o: any) => ({
      statId: String(
        o.statId ?? o.stationId ?? o.STAT_ID ?? o.csId ?? o.CS_ID ?? ""
      ),
      chgerId: String(
        o.chgerId ??
          o.chargerId ??
          o.chger_id ??
          o.CHARGER_ID ??
          o.num ??
          o.CHGER_ID ??
          ""
      ),
      status: String(o.stat ?? o.status ?? o.chgerStat ?? o.STAT ?? ""),
      type: String(
        o.chgerType ?? o.type ?? o.CHARGER_TYPE ?? o.TYPE ?? ""
      ),
      powerKw: toNum(
        o.output ?? o.power ?? o.kw ?? o.POWER ?? o.output_kw
      ),
      lastTs:
        o.statUpdDt ||
        o.updateTime ||
        o.lastTs ||
        o.UPDT_DT ||
        o.LAST_TS ||
        o.stat_upd_dt ||
        "",
    }));
  }

  /* --------------------------------------------
     UI — 최소 렌더(핵심 핸들러들만 배치)
     -------------------------------------------- */
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      <div
        style={{
          padding: "8px 10px",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <button onClick={handleResetHome}>지도초기화</button>
        <button
          onClick={() =>
            setClickMode(clickMode === "origin" ? "" : "origin")
          }
          style={{ marginLeft: 8 }}
        >
          출발(지도클릭)
        </button>
        <button
          onClick={() =>
            setClickMode(clickMode === "dest" ? "" : "dest")
          }
          style={{ marginLeft: 8 }}
        >
          도착(지도클릭)
        </button>
        <button
          onClick={handleRoute}
          style={{ marginLeft: 8 }}
          disabled={loading}
        >
          {loading ? "계산/그리는 중..." : "경로 & 표시"}
        </button>
        <span style={{ marginLeft: 12, color: "#555" }}>
          🔵 {summary}
        </span>
        {detourSummary && (
          <span style={{ marginLeft: 8, color: "#7e3c99" }}>
            🟣 {detourSummary}
          </span>
        )}
      </div>

      <div
        id="map"
        style={{ flex: 1, minHeight: 0, border: "1px solid #ddd" }}
      />
      {/* 실제 지도 클릭 바인딩은 SDK 로드 useEffect에서 onMapClick으로 연결됨 */}
    </div>
  );
};

export default AfterRouteMap;
