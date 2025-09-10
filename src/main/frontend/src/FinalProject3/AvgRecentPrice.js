// components/AvgRecentPrice.js
import { useState, useEffect } from 'react';
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './components.css';
import './AvgRecentPrice.css';

export default function AvgRecentPrice({ activeFuel, avgRecentData, selectedSidoRecentData }) {
    
    const dataToDisplay = selectedSidoRecentData.length > 0 ? selectedSidoRecentData : avgRecentData;
    // ✅ 시도 코드 맵 추가s
    const sidoCodeMap = {
        "서울": "01", "경기": "02", "강원": "03", "충북": "04",
        "충남": "05", "전북": "06", "전남": "07", "경북": "08",
        "경남": "09", "부산": "10", "제주": "11", "대구": "14",
        "인천": "15", "광주": "16", "대전": "17", "울산": "18",
        "세종": "19"
    };

    const [data, setData] = useState([]);
    const prodNameMap = { B034: '고급휘발유', D047: '경유', B027: '휘발유', K015: 'LPG' };
    const fuelColorMap = { '휘발유': '#4a90e2', '경유': '#ff7300', '고급휘발유': '#8884d8', 'LPG': '#d6bf25ff' };

    useEffect(() => {
        axios.get('/main/oilPrice/avgrecent')
            .then(res => {
                const tempData = {};
                res.data.forEach(item => {
                    const mmdd = item.DATE.slice(4, 6) + '-' + item.DATE.slice(6, 8);
                    if (!tempData[mmdd]) tempData[mmdd] = { date: mmdd };
                    const key = prodNameMap[item.PRODCD];
                    if (key) tempData[mmdd][key] = item.PRICE;
                });
                setData(Object.values(tempData));
            })
            .catch(err => console.error(err));
    }, []);

    const chartKey = activeFuel;
    const prices = data.map(d => d[chartKey] || 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 100;
    const formatYAxis = (tickItem) => `${tickItem.toLocaleString()}원`;

    return (
        <div className="card-container avg-recent-price-card">
            <h2 className="card-title">&nbsp;&nbsp;일주일 유가 추이</h2>
            <hr className="line" />
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" padding={{ left: 20, right: 20 }} />
                    <YAxis domain={[minPrice, maxPrice]} />
                    <Tooltip formatter={(value) => `${value.toLocaleString()}원`} />
                    <Legend />
                    {chartKey && (
                        <Line
                            type="monotoneX"
                            dataKey={chartKey}
                            stroke={fuelColorMap[chartKey]}
                            strokeWidth={3}
                            dot={{ r: 3 }}
                            activeDot={{ r: 6 }}
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>

        </div>
    );
}