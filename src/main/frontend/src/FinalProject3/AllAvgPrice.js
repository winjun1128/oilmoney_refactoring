// components/AllAvgPrice.js
import { useState, useEffect } from 'react';
import axios from "axios";
import './components.css';
import './AllAvgPrice.css';
import FlipNumbers from 'react-flip-numbers';
import { PINS } from './pinsData';

export default function AllAvgPrice({ activeTab, setActiveTab, selectedSidoName, selectedFuel }) {
    const [selectedIndex, setSelectedIndex] = useState(PINS.findIndex(p => p.name === selectedSidoName));
    const [allAvgData, setAllAvgData] = useState([]);   // 전국 평균
    const [sidoData, setSidoData] = useState([]);       // 지역별 데이터
    const tabs = ['휘발유', '고급휘발유', '경유', 'LPG'];
    const prodMap = {
        '경유': '자동차용경유',
        'LPG': '자동차용부탄',
        '휘발유': '휘발유',
        '고급휘발유': '고급휘발유'
    };

    // selectedIndex 업데이트
    useEffect(() => {
        const index = PINS.findIndex(p => p.name === selectedSidoName);
        setSelectedIndex(index >= 0 ? index : 0);
    }, [selectedSidoName]);

    // 전국 평균 데이터 가져오기
    useEffect(() => {
        const fetchAllAvg = async () => {
            try {
                const res = await axios.get('/main/oilPrice/allavg');
                setAllAvgData(res.data || []);
            } catch (err) {
                console.error(err);
                setAllAvgData([]);
            }
        };
        fetchAllAvg();
    }, []);

    // 지역별 데이터 가져오기
    useEffect(() => {
        const fetchSidoData = async () => {
            try {
                const res = await axios.get('/main/oilPrice/sido');
                setSidoData(res.data || []);
            } catch (err) {
                console.error(err);
                setSidoData([]);
            }
        };
        fetchSidoData();
    }, []);

    // 전국 평균 필터링
    const allAvgFiltered = allAvgData.filter(item => item.PRODNM === (prodMap[activeTab] || activeTab));
    const allAvgItem = allAvgFiltered[0];

    // 선택 지역 데이터 필터링
    const sidoFiltered = sidoData.filter(item =>
        item.SIDONM === selectedSidoName &&
        ((selectedFuel === "휘발유" && item.PRODCD === "B027") ||
            (selectedFuel === "고급휘발유" && item.PRODCD === "B034") ||
            (selectedFuel === "경유" && item.PRODCD === "D047") ||
            (selectedFuel === "LPG" && item.PRODCD === "K015"))
    );
    const sidoItem = sidoFiltered[0];

    return (
        <div className="card-container all-avg-price-card">

            {/* 전국 평균 */}
            <h2 className="card-title">전국 평균 유가정보</h2>
            <hr className="line" />
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
                <button
                    className={'fuel-tab-btn'}
                    onClick={() => alert("전기차 요금 서비스는 준비중입니다")}
                >
                    전기
                </button>
            </div>
            {allAvgItem && (
                <div className="price-content">
                    <span className="price-label">전국 평균</span>
                    <strong className="price-value">{allAvgItem.PRICE} 원</strong>
                    <span className={`price-diff ${Number(allAvgItem.DIFF) > 0 ? 'up' : Number(allAvgItem.DIFF) < 0 ? 'down' : ''}`}>
                        {Number(allAvgItem.DIFF) > 0 ? '▲' : Number(allAvgItem.DIFF) < 0 ? '▼' : ''} {Math.abs(Number(allAvgItem.DIFF))}원
                    </span>
                </div>
            )}

            {/* 선택 지역 평균 */}
            <div className="local-price-card">
                <h2 className="card-title">{selectedSidoName} {selectedFuel} 평균유가</h2>
                {sidoItem ? (
                    <ul className="list-container price-list">
                        <li className="list-item price-item">
                            <span>{selectedFuel}</span>
                            <div className="flip-numbers-container">
                                <FlipNumbers
                                    height={20}
                                    width={10}
                                    color="black"
                                    background="white"
                                    play
                                    numbers={sidoItem.PRICE.toString()}
                                /> 원
                            </div>
                        </li>
                    </ul>
                ) : (
                    <p className="no-data-message">데이터를 불러올 수 없습니다.</p>
                )}
            </div>
        </div>
    );
}
