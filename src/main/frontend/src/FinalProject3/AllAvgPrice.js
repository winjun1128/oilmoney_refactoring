// components/AllAvgPrice.js
import { useState, useEffect } from 'react';
import axios from "axios";
import './components.css';
import './AllAvgPrice.css';
import FlipNumbers from 'react-flip-numbers';
import { PINS } from './pinsData';


export default function AllAvgPrice({ activeTab, setActiveTab, selectedSidoName, selectedFuel }) {
    const [selectedIndex, setSelectedIndex] = useState(PINS.findIndex(p => p.name === selectedSidoName));
    const [oilData, setOilData] = useState([]);
    const tabs = ['고급휘발유', '휘발유', '경유', 'LPG'];
    const prodMap = {
        '경유': '자동차용경유',
        'LPG': '자동차용부탄',
        '휘발유': '휘발유',
        '고급휘발유': '고급휘발유'
    };

    useEffect(() => {
        const index = PINS.findIndex(p => p.name === selectedSidoName);
        if (index !== -1) {
            setSelectedIndex(index);
        }
    }, [selectedSidoName]);

    useEffect(() => {
        const fetchOilData = async () => {
            try {
                const response = await axios.get('/main/oilPrice/allavg');
                console.log("API 응답 데이터:", response.data);
                setOilData(response.data || []);
            } catch (error) {
                console.error(error);
                setOilData([]);
            }
        };
        fetchOilData();
    }, []);

    const filteredData = oilData.filter(item => item.PRODNM === (prodMap[activeTab] || activeTab));
    const priceItem = filteredData[0];

    

    return (
        <div className="card-container all-avg-price-card">

            <h2 className="card-title">전국 평균 유가정보</h2>
            <div className="fuel-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        className={`fuel-tab-btn ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            {priceItem && (
                <div className="price-content">
                    <span className="price-label">전국 평균</span>
                    <strong className="price-value">{priceItem.PRICE} 원</strong>
                    <span className={`price-diff ${Number(priceItem.DIFF) > 0 ? 'up' : Number(priceItem.DIFF) < 0 ? 'down' : ''}`}>
                        {Number(priceItem.DIFF) > 0 ? '▲' : Number(priceItem.DIFF) < 0 ? '▼' : ''} {Math.abs(Number(priceItem.DIFF))}원
                    </span>
                </div>
            )}
            <div className="local-price-card">
                <h2 className="card-title">{selectedSidoName} {selectedFuel} 평균유가</h2>
                {filteredData.length > 0 ? (
                    <ul className="list-container price-list">
                        {filteredData.map((item, index) => (
                            <li key={index} className="list-item price-item">
                                <span>{selectedFuel}</span>
                                <div className="flip-numbers-container">
                                    <FlipNumbers height={20} width={10} color="black" background="white" play numbers={item.PRICE.toString()} /> 원
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="no-data-message">데이터를 불러올 수 없습니다.</p>
                )}
            </div>
        </div>
    );
}