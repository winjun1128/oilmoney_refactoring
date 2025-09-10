import React, { useState, useRef,useEffect } from "react";
import SideBar from "./SideBar";
import OilFilterPanel from "./OilFilterPanel";
import ChargeFilterPanel from "./ChargeFilterPanel";
import OilMap from "./OilMap";
import axios from "axios";

export default function Page({ isLogin, setIsLoginModalOpen }) {
    const [activeFilter, setActiveFilter] = useState("oil");
    const [stations, setStations] = useState([]); // ✅ 주유소 검색 결과
    const latestReqRef = useRef(0);
    // state 추가
    const [queryType, setQueryType] = useState("nearby");   // 'nearby' | 'filter'
    const [nearbyParams, setNearbyParams] = useState(null); // {lat, lon, radius} | null


    // OilFilterPanel 컴포넌트 내부
        useEffect(() => {
            // 페이지 로드(마운트) 시 1회만
            (async () => {
                try {
                    const token = localStorage.getItem("token");
                    if (!token) return;
    
                    const res = await fetch("/mainCar", {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "application/json", // ★ JSON으로 받도록 강제
                        },
                    });
                    if (!res.ok) return;
    
                    // 혹시 서버가 XML이나 다른 포맷을 줄 경우 대비 (무한 에러 방지)
                    const ct = res.headers.get("content-type") || "";
                    if (!ct.includes("application/json")) {
                        const text = await res.text();
                        console.warn("[/mainCar] non-JSON response:", text);
                        return;
                    }
    
                    const { ok, item: car } = await res.json();
                    if (!ok || !car) return;

                    const fuelType = car.fuelType;

                    if(fuelType==="전기차")setActiveFilter("charge");
                } catch (e) {
                    // 비로그인/네트워크 오류 등은 조용히 무시
                    console.error(e);
                }
            })();
        }, []); // 마운트 시 1회
    

    // ✅ 내 주변 검색
    const handleLocationSearch = (coord, radiusKm) => {
        const reqId = ++latestReqRef.current;
        setQueryType("nearby");
        setNearbyParams({ lat: coord.lat, lon: coord.lon, radius: Number(radiusKm) || 0 });

        axios.post("/api/stations/search", { lat: coord.lat, lon: coord.lon, radius: radiusKm })
            .then(res => { if (reqId === latestReqRef.current) setStations(res.data); })
            .catch(console.error);
    };

    // ✅ 주유소 필터 검색
    const handleOilFilterSearch = (filters) => {
        const reqId = ++latestReqRef.current;

        const isNearby = filters?.mode === "nearby";
        setQueryType(isNearby ? "nearby" : "filter");
        setNearbyParams(isNearby ? {
            lat: filters.lat, lon: filters.lon, radius: Number(filters.radius) || 0
        } : null);

        axios.post("/api/stations/search", filters)
            .then(res => { if (reqId === latestReqRef.current) setStations(res.data); })
            .catch(console.error);
    };

    // ✅ 충전소 필터 기반 검색
    const handleChargeFilterSearch = (filters) => {
        const reqId = ++latestReqRef.current;
        setQueryType("filter");
        setNearbyParams(null);
        axios.post("/api/charge/search", filters)
            .then(res => { if (reqId === latestReqRef.current) setStations(res.data); })
            .catch(console.error);
    };

    return (
        <div style={{ display: "flex", height: "100vh" }}>
            <SideBar onFilterChange={setActiveFilter} handleOilFilterSearch={handleOilFilterSearch} isLogin={isLogin} setIsLoginModalOpen={setIsLoginModalOpen} />
            <div style={{ flex: 1, position: "relative" }}>
                <OilMap stations={stations} handleLocationSearch={handleLocationSearch} isFilterMode={activeFilter === "oil" || activeFilter === "charge"} queryType={queryType} nearbyParams={nearbyParams} />


                <div
                    className={`filter-wrapper ${activeFilter ? "open" : ""}`}
                    style={window.innerWidth > 768
                        ? { ...panelStyle, transform: activeFilter ? "translateX(0)" : "translateX(-100%)" }
                        : {}}
                >
                    {activeFilter === "oil" && (
                        <OilFilterPanel
                            isOpen={true}
                            handleOilFilterSearch={handleOilFilterSearch}
                            onClose={() => setActiveFilter(null)}
                            setStations={setStations}
                        />
                    )}
                    {activeFilter === "charge" && (
                        <ChargeFilterPanel
                            isOpen={true}
                            handleChargeFilterSearch={handleChargeFilterSearch}
                            onClose={() => setActiveFilter(null)}
                            setStations={setStations}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

const panelStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "300px",
    height: "100%",
    background: "#fff",
    borderRight: "1px solid #ddd",
    boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
    zIndex: 30,
    transition: "transform 0.3s ease-in-out",
};
