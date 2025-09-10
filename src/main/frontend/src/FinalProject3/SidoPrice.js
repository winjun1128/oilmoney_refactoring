// SidoPrice.js
import React, { useMemo } from "react";
import './components.css';
import './SidoPrice.css';
import { PINS } from './pinsData';

// ✅ props에 fuelCodeMap을 추가합니다.
export default React.memo(function SidoPrice({ selectedSidoName, setSelectedSidoName, sidoPriceData, selectedFuel, fuelCodeMap }) {

    // ✅ useMemo의 의존성 배열에 fuelCodeMap을 추가합니다.
    const priceMap = useMemo(() => {
        const selectedProdCD = fuelCodeMap[selectedFuel];
        const map = new Map();

        sidoPriceData.forEach(item => {
            // ✅ PRODCD를 사용하여 필터링합니다.
            if (item.SIDONM !== '전국' && item.PRODCD === selectedProdCD) {
                map.set(item.SIDONM, {
                    price: Number(item.PRICE),
                    diff: Number(item.DIFF)
                });
            }
        });
        return map;
    }, [sidoPriceData, selectedFuel, fuelCodeMap]);

    const getPinStyle = (sidoName) => {
        const item = priceMap.get(sidoName);

        // 데이터가 없거나 DIFF 값이 비정상적일 때 기본 스타일 반환
        if (!item || item.diff === item.price) {
            return {
                borderColor: '#ccc',
                backgroundColor: '#fff',
                borderWidth: '1px',
                borderStyle: 'solid'
            };
        }

        const diff = item.diff;
        let borderColor = '#ccc';
        let backgroundColor = '#fff';
        let borderWidth = '1px'; // 기본 두께 설정
        let borderStyle = 'solid'; // 기본 스타일 추가

        if (diff > 0) {
            borderColor = '#ff1414ff';
            borderWidth = '2px'; // 상승 시 두껍게
        } else if (diff < 0) {
            borderColor = '#14ac07ff';
            borderWidth = '2px'; // 상승 시 두껍게
        } else if (diff == 0) {
            borderColor = '#ff9f22ff';
            borderWidth = '2px';
        }

        return {
            borderColor,
            backgroundColor,
            borderWidth, // ✅ borderWidth 속성 추가
            borderStyle
        };
    };

    return (
        <div className="card-container sido-price">
            <h2 className="card-title">&nbsp;&nbsp;시도별 평균 가격</h2>
            <hr className="line" />
            <div className="main-map-container">
                <img src="/images/main_map.png" alt="대한민국 지도" className="main-map-image" />
                {PINS.map((pin, index) => (
                    <button
                        className={`map-pin-button ${selectedSidoName === pin.name ? 'active' : ''}`}
                        key={index}
                        onClick={() => setSelectedSidoName(pin.name)}
                        style={{
                            top: pin.top,
                            left: pin.left,
                            ...getPinStyle(pin.name)
                        }}
                    >
                        {pin.name}
                    </button>
                ))}
            </div>
        </div>
    );
});