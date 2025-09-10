// components/SidoPrice.js
import { useState, useEffect } from "react";
import './components.css';
import './SidoPrice.css';
import { PINS } from './pinsData';

export default function SidoPrice({ selectedSidoName, setSelectedSidoName }) {
    const [selectedIndex, setSelectedIndex] = useState(PINS.findIndex(p => p.name === selectedSidoName));

    useEffect(() => {
        const index = PINS.findIndex(p => p.name === selectedSidoName);
        if (index !== -1) {
            setSelectedIndex(index);
        }
    }, [selectedSidoName]);

    const handlePinClick = (index) => {
        setSelectedSidoName(PINS[index].name);
    };

    return (
        <div className="card-container sido-price">
            <div className="map-section">
                <h2 className="card-title">&nbsp;&nbsp;지역별 평균유가</h2>
                <hr className="line" />
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