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
    const [sigunList, setSigunList] = useState([]);
    const [lowerTopData, setLowerTopData] = useState([]);
    const [selectedSigunCode, setSelectedSigunCode] = useState([]);

    // ✅ Map 객체들을 부모 컴포넌트에 정의
    const regionCodeMap = {
        "서울": "01", "경기": "02", "강원": "03", "충북": "04", "충남": "05",
        "전북": "06", "전남": "07", "경북": "08", "경남": "09", "부산": "10",
        "제주": "11", "대구": "14", "인천": "15", "광주": "16", "대전": "17",
        "울산": "18", "세종": "19"
    };

    const fuelCodeMap = {
        "휘발유": "B027", "경유": "D047", "고급휘발유": "B034", "LPG": "K015",
    };

    // ✅ 1. 초기 데이터를 불러오는 훅 (컴포넌트 마운트 시 한 번만 실행)
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
                console.error("초기 데이터 로딩 실패", error);
            }
        };
        fetchInitialData();
    }, []);

    // ✅ 2. 'selectedSidoName'이 변경될 때 시/군 목록을 가져오는 훅
    useEffect(() => {
        const fetchSigunData = async () => {
            if (!selectedSidoName) return;
            const regionCode = regionCodeMap[selectedSidoName];
            try {
                const sigunRes = await axios.get(`/main/oilPrice/sigun?area=${regionCode}`);
                const sigunData = sigunRes.data.RESULT?.OIL || [];
                setSigunList(sigunData);

                // 시/군 목록을 가져온 후, 첫 번째 시/군 코드로 상태를 업데이트
                if (sigunData.length > 0) {
                    setSelectedSigunCode(sigunData[0].AREA_CD);
                } else {
                    setSelectedSigunCode('');
                }
            } catch (error) {
                console.error("시/군 데이터 로딩 실패", error);
                setSigunList([]);
            }
        };
        fetchSigunData();
    }, [selectedSidoName]);

    // ✅ 3. 'selectedSigunCode'나 'selectedFuel'이 변경될 때 주유소 목록을 가져오는 훅
    useEffect(() => {
        const fetchLowerTopData = async () => {
            if (!selectedSigunCode || !selectedFuel) {
                setLowerTopData([]);
                return;
            }
            const prodcd = fuelCodeMap[selectedFuel];
            try {
                const lowerTopRes = await axios.get(`/main/oilPrice/lowerTop?area=${selectedSigunCode}&prodcd=${prodcd}`);
                setLowerTopData(lowerTopRes.data || []);
            } catch (error) {
                console.error("주유소 데이터 로딩 실패", error);
                setLowerTopData([]);
            }
        };
        fetchLowerTopData();
    }, [selectedSigunCode, selectedFuel]);

    return (
        <div className="oil-dashboard-container">
            <div className="dashboard-section-top">
                <AllAvgPrice
                    activeTab={selectedFuel}
                    setActiveTab={setSelectedFuel}
                    allAvgData={allAvgData} // 데이터 전달
                    selectedSidoName={selectedSidoName}
                    selectedFuel={selectedFuel}
                    sidoPriceData={sidoPriceData}
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
                />
                <RegionSelector
                    // ✅ props로 Map 객체들을 전달
                    sidoName={selectedSidoName}
                    selectedFuel={selectedFuel}
                    sigunList={sigunList}
                    lowerTopData={lowerTopData}
                    setSelectedSigunCode={setSelectedSigunCode}
                />
            </div>
        </div>
    );
}