// components/SidoPrice.js
import { useState, useEffect } from "react";
import axios from "axios";
import './components.css';
import './SidoPrice.css';
import { PINS } from './pinsData';

export default function SidoPrice({ selectedSidoName, setSelectedSidoName, selectedFuel }) {
    const [oilData, setOilData] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(PINS.findIndex(p => p.name === selectedSidoName));

    useEffect(() => {
        const fetchOilData = async () => {
            try {
                const response = await axios.get('/main/oilPrice/sido');
                setOilData(response.data || []);
            } catch (error) {
                console.error(error);
                setOilData([]);
            }
        };
        fetchOilData();
    }, []);

    useEffect(() => {
        const index = PINS.findIndex(p => p.name === selectedSidoName);
        if (index !== -1) {
            setSelectedIndex(index);
        }
    }, [selectedSidoName]);

    const handlePinClick = (index) => {
        setSelectedSidoName(PINS[index].name);
    };

    const filteredData = oilData.filter(item =>
        item.SIDONM === selectedSidoName &&
        ((selectedFuel === "휘발유" && item.PRODCD === "B027") ||
            (selectedFuel === "고급휘발유" && item.PRODCD === "B034") ||
            (selectedFuel === "경유" && item.PRODCD === "D047") ||
            (selectedFuel === "LPG" && item.PRODCD === "K015"))
    );

    return (
        <div className="card-container sido-price">
            <div className="map-section">
                <h2 className="card-title">지역별 평균유가</h2>
                <div className="main-map-container">
                    <img src="/images/main_map.png" alt="대한민국 지도" className="main-map-image" />
                    {PINS.map((pin, index) => (
                        <button
                            className={`map-pin-button ${selectedIndex === index ? 'active' : ''}`}
                            key={index}
                            onClick={() => handlePinClick(index)}
                            style={{ top: pin.top, left: pin.left }}
                        >
                            {pin.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}