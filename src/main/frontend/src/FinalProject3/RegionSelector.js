import { useState, useEffect } from "react";
import axios from "axios";

export default function RegionSelector({ sidoName, selectedFuel }) {

    const regionCodeMap = {
        "서울": "01",
        "경기": "02",
        "강원": "03",
        "충북": "04",
        "충남": "05",
        "전북": "06",
        "전남": "07",
        "경북": "08",
        "경남": "09",
        "부산": "10",
        "제주": "11",
        "대구": "14",
        "인천": "15",
        "광주": "16",
        "대전": "17",
        "울산": "18",
        "세종": "19"
    };

    const fuelCodeMap = {
        "휘발유": "B027",
        "경유": "D047",
        "고급휘발유": "B034",
        "LPG": "K015",  // LPG
    };

    const [sigunList, setSigunList] = useState([]);
    const [selectedSigunCode, setSelectedSigunCode] = useState('');
    const [gasStationData, setGasStationData] = useState([]);

    useEffect(() => {
        if (sigunList.length > 0) {
            setSelectedSigunCode(sigunList[0].AREA_CD);
        }
    }, [sigunList]);

    // 시도 변경 시 시군 리스트 가져오기
    useEffect(() => {
        if (!sidoName) return;

        const fetchSigunData = async () => {
            if (!sidoName) return;
            const regionCode = regionCodeMap[sidoName]; // 이름 → 코드 변환

            try {
                const response = await axios.get(`/main/oilPrice/sigun?area=${regionCode}`);
                // Opinet API는 RESULT.OIL 배열에 데이터 존재
                setSigunList(response.data.RESULT?.OIL || []);
            } catch (error) {
                console.error("시군 데이터를 불러오는 데 실패했습니다:", error);
                setSigunList([]);
            }
        };

        fetchSigunData();
        setSelectedSigunCode("");
        setGasStationData([]);
        console.log('sidoName:', sidoName);
    }, [sidoName]);

    // 시군 선택 시 최저가 주유소 가져오기
    useEffect(() => {
        if (!selectedSigunCode) return;
        if (!selectedFuel) return; // <- selectedFuel 없는 경우 무시

        const prodcd = fuelCodeMap[selectedFuel];
        if (!prodcd) {
            console.error("유효하지 않은 유종:", selectedFuel);
            return;
        }

        const fetchGasStations = async () => {
            try {
                const prodcd = fuelCodeMap[selectedFuel];
                console.log(prodcd + '품번통과');
                const response = await axios.get(`/main/oilPrice/lowerTop?area=${selectedSigunCode}&prodcd=${prodcd}`);
                console.log('통과2');
                setGasStationData(response.data || []);
                console.log('통과3');
            } catch (error) {
                console.error("주유소 정보를 불러오는 데 실패했습니다:", error);
                setGasStationData([]);
            }
        };
        fetchGasStations();
        console.log('통과4');
    }, [selectedSigunCode, selectedFuel]);
    console.log('통과5');

    return (
        <div style={{ padding: '20px' }}>
            <h2>{sidoName} 지역별 저렴한 주유소 TOP 5</h2>
            <select
                value={selectedSigunCode}
                onChange={e => {
                    console.log("선택 변경:", e.target.value);
                    setSelectedSigunCode(e.target.value);
                }}
            >
                <option value="">시/군 선택</option>
                {sigunList.map(sigun => (
                    <option key={sigun.AREA_CD} value={sigun.AREA_CD}>
                        {sigun.AREA_NM}
                    </option>
                ))}
            </select>

            {gasStationData.length > 0 && (
                <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px' }}>
                    {gasStationData.map(station => (
                        <li key={station.UNI_ID} style={{ marginBottom: '10px', border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
                            <strong>{station.OS_NM}</strong> - {station.PRICE}원
                        </li>
                    ))}
                </ul>
            )}

            {/* {gasStationData.length === 0 && selectedSigunCode && (
                <p style={{ marginTop: '20px', color: '#888' }}>주유소 정보를 불러올 수 없습니다.</p>
            )} */}
        </div>
    );
}
