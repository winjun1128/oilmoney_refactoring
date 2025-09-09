// components/RegionSelector.js
import { useState, useEffect } from "react";
import axios from "axios";
import './components.css';
import './RegionSelector.css';
import './line.css';

export default function RegionSelector({ sidoName, selectedFuel }) {
    const regionCodeMap = {
        "서울": "01", "경기": "02", "강원": "03", "충북": "04", "충남": "05",
        "전북": "06", "전남": "07", "경북": "08", "경남": "09", "부산": "10",
        "제주": "11", "대구": "14", "인천": "15", "광주": "16", "대전": "17",
        "울산": "18", "세종": "19"
    };

    const fuelCodeMap = {
        "휘발유": "B027", "경유": "D047", "고급휘발유": "B034", "LPG": "K015",
    };

    const iconMap = {
        SKE: "https://www.opinet.co.kr/images/user/main/img_logo2.jpg",   // SK에너지
        GSC: "https://www.opinet.co.kr/images/user/main/img_logo3.jpg",   // GS칼텍스
        HDO: "https://www.opinet.co.kr/images/user/main/img_logo.jpg",   // 현대오일뱅크
        SOL: "https://www.opinet.co.kr/images/user/main/img_logo4.jpg",   // S-OIL
        RTE: "https://www.opinet.co.kr/images/user/main/img_logo7.jpg",   // 자영알뜰
        RTX: "https://www.opinet.co.kr/images/user/main/img_logo7.jpg",   // 고속도로알뜰
        NHO: "https://www.opinet.co.kr/images/user/main/img_logo11.jpg",   // 농협알뜰
        ETC: "https://www.opinet.co.kr/images/user/main/img_logo13.jpg",   // 자가상표
        E1G: "https://www.opinet.co.kr/images/user/main/img_logo10.jpg",   // E1
        SKG: "https://www.opinet.co.kr/images/user/main/img_logo12.jpg"    // SK가스
    };

    const [sigunList, setSigunList] = useState([]);
    const [selectedSigunCode, setSelectedSigunCode] = useState('');
    const [gasStationData, setGasStationData] = useState([]);

    // ✅ 첫 번째 useEffect: sidoName이 바뀔 때만 시/군 목록을 가져옵니다.
    useEffect(() => {
        if (!sidoName) return;
        const fetchSigunData = async () => {
            const regionCode = regionCodeMap[sidoName];
            try {
                const response = await axios.get(`/main/oilPrice/sigun?area=${regionCode}`);
                const data = response.data.RESULT?.OIL || [];
                setSigunList(data);
                // 시/군 목록을 가져온 후, 첫 번째 시/군 코드로 상태를 업데이트합니다.
                if (data.length > 0) {
                    setSelectedSigunCode(data[0].AREA_CD);
                } else {
                    setSelectedSigunCode('');
                }
            } catch (error) {
                console.error("시군 데이터를 불러오는 데 실패했습니다:", error);
                setSigunList([]);
                setSelectedSigunCode('');
            }
        };
        fetchSigunData();
        setGasStationData([]);
    }, [sidoName]); // 의존성 배열에 sidoName만 포함

    // ✅ 두 번째 useEffect: selectedSigunCode나 selectedFuel이 바뀔 때만 주유소 목록을 가져옵니다.
    useEffect(() => {
        if (!selectedSigunCode || !selectedFuel) {
            setGasStationData([]);
            return;
        }
        const fetchGasStations = async () => {
            const prodcd = fuelCodeMap[selectedFuel];
            if (!prodcd) {
                console.error("유효하지 않은 유종:", selectedFuel);
                return;
            }
            try {
                const response = await axios.get(`/main/oilPrice/lowerTop?area=${selectedSigunCode}&prodcd=${prodcd}`);
                setGasStationData(response.data || []);
            } catch (error) {
                console.error("주유소 정보를 불러오는 데 실패했습니다:", error);
                setGasStationData([]);
            }
        };
        fetchGasStations();
    }, [selectedSigunCode, selectedFuel]); // 의존성 배열 수정

    return (
        <div className="card-container region-selector">

            <h2 className="card-title">{sidoName} 지역별 저렴한 주유소 TOP 5</h2>
            <hr className="line" />
            <select
                className="sigun-select"
                value={selectedSigunCode}
                onChange={e => setSelectedSigunCode(e.target.value)}
            >
                <option value="">시/군 선택</option>
                {sigunList.map(sigun => (
                    <option key={sigun.AREA_CD} value={sigun.AREA_CD}>
                        {sigun.AREA_NM}
                    </option>
                ))}
            </select>
            {gasStationData.length > 0 ? (
                <ul className="list-container gas-station-list">
                    {gasStationData.map(station => (
                        <li key={station.UNI_ID} className="list-item">
                            <strong>
                                {iconMap[station.POLL_DIV_CD]?.startsWith("http")
                                    ? <img
                                        src={iconMap[station.POLL_DIV_CD]}
                                        alt={station.POLL_DIV_CD}
                                        style={{ width: "55px", marginRight: "15px", verticalAlign: "middle" }}
                                    />
                                    : iconMap[station.POLL_DIV_CD] || "❓"
                                }
                                {station.OS_NM}
                            </strong>
                            <span>{station.PRICE}원</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="no-data-message">주유소 정보를 찾을 수 없습니다.</p>
            )}
        </div>
    );
}