// SidoPrice.js (최종본, 오류 해결)
import { useState, useEffect } from "react";
import axios from "axios";
import FlipNumbers from 'react-flip-numbers';
import RegionSelector from "./RegionSelector";

export default function SidoPrice() {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [oilData, setOilData] = useState([]);
    const [selectedSidoName, setSelectedSidoName] = useState("서울");

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
        setSelectedSidoName(pins[index].name);
    };

    return (
        <div className="sido_container" style={{ display: "flex" }}>
            <div className="map_box" style={{ padding: '10px', width: '32%' }}>
                <h2>시도별 평균유가</h2>
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

            <div className="LocalPriceBox" style={{ marginTop: 12 }}>
                {oilData.filter(item => item.SIDONM === selectedSidoName).length > 0 && (
                    <ul style={{ listStyle: 'none', padding: 0, border: '1px solid black' }}>
                        {oilData
                            .filter(item =>
                                item.SIDONM === selectedSidoName && ["B034", "B027", "D047", "K015"].includes(item.PRODCD)
                            )
                            .map((item, index) => {
                                let fuelName = "";
                                switch (item.PRODCD) {
                                    case "B027": fuelName = "휘발유"; break;
                                    case "B034": fuelName = "고급휘발유"; break;
                                    case "D047": fuelName = "경유"; break;
                                    case "K015": fuelName = "LPG"; break;
                                    default: fuelName = item.PRODNM;
                                }

                                return (
                                    <li key={index} style={{
                                        display: 'flex',
                                        marginBottom: '10px',
                                        padding: '10px',
                                        borderRadius: '20px'
                                    }}>
                                        <div style={{ display: 'flex' }}>
                                            {fuelName} : <FlipNumbers
                                                height={20}
                                                width={10}
                                                color="black"
                                                background="white"
                                                play
                                                numbers={item.PRICE.toString()}
                                            /> 원
                                        </div>
                                    </li>
                                );
                            })}
                    </ul>
                )}
                <RegionSelector sidoName={selectedSidoName} />
            </div>
        </div>
    );
}