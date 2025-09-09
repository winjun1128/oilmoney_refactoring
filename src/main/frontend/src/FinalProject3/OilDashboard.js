// OilDashboard.js

import { useState, useEffect } from 'react';
import axios from 'axios';
import AllAvgPrice from './AllAvgPrice';
import AvgRecentPrice from './AvgRecentPrice';
import SidoPrice from './SidoPrice';
import RegionSelector from './RegionSelector';
import './OilDashboard.css';
import './components.css';

export default function OilDashboard() {
    const [selectedFuel, setSelectedFuel] = useState('휘발유');
    const [selectedSidoName, setSelectedSidoName] = useState("서울");
    const [allAvgData, setAllAvgData] = useState([]);
    const [avgRecentData, setAvgRecentData] = useState([]);
    const [sidoPriceData, setSidoPriceData] = useState([]);
    const [sigunList, setSigunList] = useState([]); // 새로운 상태 추가
    const [lowerTopData, setLowerTopData] = useState([]); // 새로운 상태 추가
    

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [allAvgRes, avgRecentRes, sidoPriceRes] = await Promise.all([
                    axios.get('/main/oilPrice/allavg'),
                    axios.get('/main/oilPrice/avgrecent'),
                    axios.get('/main/oilPrice/sido')
                ]);

                setAllAvgData(allAvgRes.data || []);
                setAvgRecentData(avgRecentRes.data || []);
                setSidoPriceData(sidoPriceRes.data || []);
            } catch (error) {
                console.error("데이터 로딩 실패", error);
            }
        };
        fetchInitialData();
    }, []);

    const regionCodeMap = { /* ... */ }; // 지도 정보는 여기에 유지
    const fuelCodeMap = { /* ... */ }; // 유종 정보는 여기에 유지

    // ✅ 시/군 및 주유소 데이터를 가져오는 새로운 useEffect 훅
    useEffect(() => {
        const fetchRegionData = async () => {
            if (!selectedSidoName) return;
            const regionCode = regionCodeMap[selectedSidoName];
            try {
                const sigunRes = await axios.get(`/main/oilPrice/sigun?area=${regionCode}`);
                const sigunData = sigunRes.data.RESULT?.OIL || [];
                setSigunList(sigunData);

                // 첫 번째 시/군 데이터로 주유소 목록을 가져옴
                if (sigunData.length > 0) {
                    const firstSigunCode = sigunData[0].AREA_CD;
                    const prodcd = fuelCodeMap[selectedFuel];
                    const lowerTopRes = await axios.get(`/main/oilPrice/lowerTop?area=${firstSigunCode}&prodcd=${prodcd}`);
                    setLowerTopData(lowerTopRes.data || []);
                } else {
                    setLowerTopData([]);
                }
            } catch (error) {
                console.error("지역별 데이터 로딩 실패", error);
                setSigunList([]);
                setLowerTopData([]);
            }
        };
        fetchRegionData();
    }, [selectedSidoName, selectedFuel]); // ✅ sidoName과 selectedFuel이 바뀔 때만 실행

    return (
        <div className="oil-dashboard-container">
            <div className="dashboard-section-top">
                <AllAvgPrice
                    activeTab={selectedFuel}
                    setActiveTab={setSelectedFuel}
                    allAvgData={allAvgData} // 데이터 전달
                    selectedSidoName={selectedSidoName}
                    selectedFuel={selectedFuel}
                    //sidoOilData={sidoOilData}
                />
                <AvgRecentPrice
                    activeFuel={selectedFuel}
                    avgRecentData={avgRecentData} // 데이터 전달
                />
            </div>
            <div className="dashboard-section-bottom">
                <SidoPrice
                    selectedSidoName={selectedSidoName}
                    setSelectedSidoName={setSelectedSidoName}
                    selectedFuel={selectedFuel}
                    sidoPriceData={sidoPriceData} // 데이터 전달
                />
                <RegionSelector
                    sidoName={selectedSidoName} 
                    selectedFuel={selectedFuel}
                    sigunList={sigunList} // ✅ sigunList와 lowerTopData 전달
                    lowerTopData={lowerTopData}
                    regionCodeMap={regionCodeMap}
                    fuelCodeMap={fuelCodeMap}
                />
            </div>
        </div>
    );
}