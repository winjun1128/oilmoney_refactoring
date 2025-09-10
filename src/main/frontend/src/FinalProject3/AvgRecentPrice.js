// AvgRecentPrice.js
import React from 'react'; // React import
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './components.css';
import './AvgRecentPrice.css';

// export default function AvgRecentPrice({ activeFuel, avgRecentData }) { ... }
// 위의 코드를 아래와 같이 변경합니다.

// ✅ React.memo로 감싸서 props가 변하지 않으면 리렌더링을 방지합니다.
export default React.memo(function AvgRecentPrice({ activeFuel, avgRecentData }) {
    // ... (기존 차트 로직)
    const prodNameMap = { B034: '고급휘발유', D047: '경유', B027: '휘발유', K015: 'LPG' };
    const fuelColorMap = { '휘발유': '#4a90e2', '경유': '#ff7300', '고급휘발유': '#8884d8', 'LPG': '#534c1bff' };
    
    const chartData = avgRecentData.reduce((acc, item) => {
        const mmdd = item.DATE.slice(4, 6) + '-' + item.DATE.slice(6, 8);
        if (!acc[mmdd]) acc[mmdd] = { date: mmdd };
        const key = prodNameMap[item.PRODCD];
        if (key) acc[mmdd][key] = item.PRICE;
        return acc;
    }, {});

    const processedData = Object.values(chartData);
    const prices = processedData.map(d => d[activeFuel] || 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 100;

    return (
        <div className="card-container avg-recent-price-card">
            <h2 className="card-title">&nbsp;&nbsp;일주일 유가 추이</h2>
            <hr className="line" />
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={processedData} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" padding={{ left: 20, right: 20 }} />
                    <YAxis domain={[minPrice, maxPrice]} />
                    <Tooltip formatter={(value) => `${value.toLocaleString()}원`} />
                    <Legend />
                    {activeFuel && (
                        <Line
                            type="monotoneX"
                            dataKey={activeFuel}
                            stroke={fuelColorMap[activeFuel]}
                            strokeWidth={3}
                            dot={{ r: 3 }}
                            activeDot={{ r: 6 }}
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
});