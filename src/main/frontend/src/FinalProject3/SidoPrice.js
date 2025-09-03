// SidoPrice.js (최종본, 오류 해결)
import { useState, useEffect } from "react";
import axios from "axios";
import FlipNumbers from 'react-flip-numbers';


export default function SidoPrice({ selectedSidoName, setSelectedSidoName, selectedFuel }) {
    const [selectedIndex, setSelectedIndex] = useState(7);
    const [oilData, setOilData] = useState([]);

    const pins = [
        { name: "서울", top: "70px", left: "135px" },
        { name: "인천", top: "75px", left: "80px" },
        { name: "경기", top: "40px", left: "130px" },
        { name: "충북", top: "105px", left: "190px" },
        { name: "세종", top: "145px", left: "150px" },
        { name: "대전", top: "195px", left: "145px" },
        { name: "강원", top: "70px", left: "215px" },
        { name: "충남", top: "170px", left: "80px" },
        { name: "대구", top: "220px", left: "205px" },
        { name: "부산", top: "285px", left: "230px" },
        { name: "경북", top: "175px", left: "220px" },
        { name: "울산", top: "235px", left: "250px" },
        { name: "경남", top: "285px", left: "170px" },
        { name: "전남", top: "320px", left: "60px" },
        { name: "제주", top: "390px", left: "63px" },
        { name: "광주", top: "280px", left: "70px" },
        { name: "전북", top: "240px", left: "85px" },
    ];

    useEffect(() => {
        const fetchOilData = async () => {
            try {
                const response = await axios.get('/main/oilPrice/sido');
                if (response.data && response.data.length > 0) {
                    setOilData(response.data);
                } else {
                    setOilData([]);
                }
            } catch (error) {
                console.error(error);
                setOilData(null);
            }
        };
        fetchOilData();
    }, []);

    const handlePinClick = (index) => {
        setSelectedIndex(index);
        setSelectedSidoName(pins[index].name); // 상위 상태 업데이트
    };

    // 🔹 selectedFuel을 사용한 필터링
    const filteredData = oilData.filter(item =>
        item.SIDONM === selectedSidoName &&
        ((selectedFuel === "휘발유" && item.PRODCD === "B027") ||
            (selectedFuel === "고급휘발유" && item.PRODCD === "B034") ||
            (selectedFuel === "경유" && item.PRODCD === "D047") ||
            (selectedFuel === "LPG" && item.PRODCD === "K015"))
    );

    return (
            <div className="map_box" style={{ padding: '10px', width: '32%' }}>
                <div className="LocalPriceBox" style={{ marginTop: 12 }}>
                    <h2>{selectedSidoName} {selectedFuel} 평균유가</h2>
                    {filteredData.length > 0 && (
                        <ul style={{ listStyle: 'none', padding: 0, border: '1px solid black' }}>
                            {filteredData.map((item, index) => (
                                <li key={index} style={{ display: 'flex', marginBottom: '10px', padding: '10px', borderRadius: '20px' }}>
                                    <div style={{ display: 'flex' }}>
                                        {selectedFuel} : <FlipNumbers
                                            height={20}
                                            width={10}
                                            color="black"
                                            background="white"
                                            play
                                            numbers={item.PRICE.toString()}
                                        /> 원
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <h2>지역별 평균유가</h2>
                <hr />
                <div
                    className="main_map"
                    style={{
                        width: '300px',
                        height: '430px',
                        position: 'relative'
                    }}>
                    <img
                        src="/images/main_map.png"
                        alt="지도"
                        style={{ width: '100%', height: '100%' }}
                    />
                    {pins.map((pin, index) => (
                        <button
                            className="local_button"
                            key={index}
                            onClick={() => handlePinClick(index)}
                            style={{
                                position: 'absolute',
                                top: pin.top,
                                left: pin.left,
                                padding: '4px 6px',
                                border: '1px solid #333',
                                borderRadius: '3px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                backgroundColor: selectedIndex === index ? '#2563eb' : 'white',
                                color: selectedIndex === index ? 'white' : 'black'
                            }}
                        >
                            {pin.name}
                        </button>
                    ))}
                </div>
            </div>

    );
}