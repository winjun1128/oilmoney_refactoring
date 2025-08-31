import React, { useState } from "react";
import SideBar from "./SideBar";
import OilFilterPanel from "./OilFilterPanel";
import ChargeFilterPanel from "./ChargeFilterPanel";
import OilMap from "./OilMap";
import axios from "axios";

export default function Page() {
    const [activeFilter, setActiveFilter] = useState(null);
    const [stations, setStations] = useState([]); // ✅ 주유소 검색 결과

    // ✅ 위치/반경 기반 기본 검색
    const handleLocationSearch = (coord, radiusKm) => {
        axios.post("/api/stations/search", {
            lat: coord.lat,
            lon: coord.lon,
            radius: radiusKm,
        })
            .then((res) => setStations(res.data))
            .catch((err) => console.error(err));
    };

    // ✅ 주유소 필터 기반 검색
    const handleOilFilterSearch = (filters) => {
        axios.post("/api/stations/search", filters)
            .then((res) => { 
                console.log(res.data);
                setStations(res.data);
            })
            .catch((err) => console.error(err));
    };

    // ✅ 충전소 필터 기반 검색
    const handleChargeFilterSearch = (filters) => {
        axios.post("/api/charge/search", filters)
        .then((res) => { 
            console.log(res.data);
            setStations(res.data);
        })
        .catch(err => console.error(err));
};

    return (
        <div style={{ display: "flex", height: "100vh" }}>
            <SideBar onFilterChange={setActiveFilter} />
            <div style={{ flex: 1, position: "relative" }}>
                <OilMap stations={stations} handleLocationSearch={handleLocationSearch} isFilterMode={activeFilter === "oil" || activeFilter === "charge"}/>

                <div style={{ ...panelStyle, transform: activeFilter ? "translateX(0)" : "translateX(-100%)",}}>
                    <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px" }}>
                        <button
                            onClick={() => setActiveFilter(null)}
                            style={{
                                background: "none",
                                border: "none",
                                fontSize: "20px",
                                cursor: "pointer",
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    {activeFilter === "oil" && <OilFilterPanel handleOilFilterSearch={handleOilFilterSearch} setStations={setStations} />}
                    {activeFilter === "charge" && <ChargeFilterPanel handleChargeFilterSearch={handleChargeFilterSearch} setStations={setStations} />}
                </div>
            </div>
        </div>
    );
}

const panelStyle = {
    position: "absolute",
    top: 0,
    left: 80,
    width: "300px",
    height: "100%",
    background: "#fff",
    borderRight: "1px solid #ddd",
    boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
    zIndex: 30,
    transition: "transform 0.3s ease-in-out", 
};
