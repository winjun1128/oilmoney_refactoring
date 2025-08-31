import { useEffect, useRef, useState } from "react";

/** ✅ Kakao Developers → 내 애플리케이션 → 앱 키의 "JavaScript 키" */
const DEFAULT_KAKAO_JS_KEY = "01a51f847b68dacc1745dde38509991d";

/** URL로 키를 넘길 수 있게(예: http://localhost:3000/?kakaoKey=... ) */
const KAKAO_JS_KEY =
  new URLSearchParams(window.location.search).get("kakaoKey") ||
  DEFAULT_KAKAO_JS_KEY;

export default function KakaoMap() {
  const mapEl = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const init = () => {
      if (!mounted || !mapEl.current) return;
      const { kakao } = window;
      if (!kakao?.maps) return;

      const map = new kakao.maps.Map(mapEl.current, {
        center: new kakao.maps.LatLng(37.5665, 126.9780), // 서울시청 근처
        level: 7,
      });

      // 중앙에 마커 하나
      new kakao.maps.Marker({
        map,
        position: new kakao.maps.LatLng(37.5665, 126.9780),
        title: "서울시청",
      });
    };

    const ensureSdk = () =>
      new Promise((resolve, reject) => {
        if (window.kakao?.maps) return resolve();

        let s = document.getElementById("kakao-sdk");
        if (!s) {
          s = document.createElement("script");
          s.id = "kakao-sdk";
          s.async = true;
          s.src =
            "https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=" +
            encodeURIComponent(KAKAO_JS_KEY);
          s.onerror = () => {
            console.error("[Kakao] SDK 로드 실패:", s.src);
            reject(new Error("카카오 SDK 로드 실패"));
          };
          document.head.appendChild(s);
        }
        s.addEventListener("load", () => {
          if (!window.kakao?.maps) return reject(new Error("kakao.maps 없음"));
          window.kakao.maps.load(resolve);
        });
      });

    ensureSdk().then(init).catch((e) => setError(e.message));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <div
        ref={mapEl}
        style={{ width: "100%", height: 480, border: "1px solid #ddd" }}
      />
      {error && (
        <div style={{ color: "#c00", marginTop: 8 }}>
          지도 로드 오류: {error}
        </div>
      )}
    </div>
  );
}
