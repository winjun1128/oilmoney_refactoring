import { useState, useEffect } from "react";
import axios from "axios";

export default function RegionSelector({ sidoName }) {

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

    const [sigunList, setSigunList] = useState([]);
    const [selectedSigunCode, setSelectedSigunCode] = useState('');
    const [gasStationData, setGasStationData] = useState([]);

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

        const fetchGasStations = async () => {
            try {
                console.log('1');
                const response = await axios.get(`/main/oilPrice/lowerTop?area=${selectedSigunCode}`);
                console.log('2');
                setGasStationData(response.data || []);
                console.log('3');
            } catch (error) {
                console.error("주유소 정보를 불러오는 데 실패했습니다:", error);
                setGasStationData([]);
            }
        };
        fetchGasStations();
    }, [selectedSigunCode]);

    return (
        <div style={{ padding: '20px' }}>
            <h2>{sidoName} 지역별 저렴한 주유소 TOP 5</h2>
            <select
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

            {gasStationData.length > 0 && (
                <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px' }}>
                    {gasStationData.map(station => (
                        <li key={station.stationId} style={{ marginBottom: '10px', border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
                            <strong>{station.stationName}</strong> - {station.price}원
                        </li>
                    ))}
                </ul>
            )}

            {gasStationData.length === 0 && selectedSigunCode && (
                <p style={{ marginTop: '20px', color: '#888' }}>주유소 정보를 불러올 수 없습니다.</p>
            )}
        </div>
    );
}
