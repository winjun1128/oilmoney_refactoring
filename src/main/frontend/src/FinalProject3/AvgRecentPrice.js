// AvgRecentPrice.js (수정된 코드)

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './components.css';
import './AvgRecentPrice.css';

// selectedSidoRecentData는 사용되지 않으므로 제거했습니다.
export default function AvgRecentPrice({ activeFuel, avgRecentData }) {

    // ✅ 주석 처리된 prodNameMap을 다시 사용합니다.
    const prodNameMap = { B034: '고급휘발유', D047: '경유', B027: '휘발유', K015: 'LPG' };
    const fuelColorMap = { '휘발유': '#4a90e2', '경유': '#ff7300', '고급휘발유': '#8884d8', 'LPG': '#534c1bff' };
    
    // ✅ 데이터 변환 로직을 수정합니다.
    const tempData = {};
    avgRecentData.forEach(item => {
        const mmdd = item.DATE.slice(4, 6) + '-' + item.DATE.slice(6, 8);
        if (!tempData[mmdd]) tempData[mmdd] = { date: mmdd };
        const key = prodNameMap[item.PRODCD];
        if (key) tempData[mmdd][key] = item.PRICE;
    });

    const chartData = Object.values(tempData);
    const chartKey = activeFuel;
    
    const prices = chartData.map(d => d[chartKey] || 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 100;

    return (
        <div className="card-container avg-recent-price-card">
            <h2 className="card-title">&nbsp;&nbsp;일주일 유가 추이</h2>
            <hr className="line" />
            <ResponsiveContainer width="100%" height={300}>
                {/* ✅ data 대신 chartData를 사용합니다. */}
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
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