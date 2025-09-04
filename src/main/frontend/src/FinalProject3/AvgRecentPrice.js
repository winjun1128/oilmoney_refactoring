// components/AvgRecentPrice.js
import { useState, useEffect } from 'react';
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './components.css';
import './AvgRecentPrice.css';

export default function AvgRecentPrice({ activeFuel }) {
    const [data, setData] = useState([]);
    const prodNameMap = { B034: '고급휘발유', D047: '경유', B027: '휘발유', K015: 'LPG' };
    const fuelColorMap = { '휘발유': '#4a90e2', '경유': '#ff7300', '고급휘발유': '#8884d8', 'LPG': '#88846a' };

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
            <h2 className="card-title">전국 유가 추이</h2>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[minPrice, maxPrice]} tickFormatter={formatYAxis} />
                    <Tooltip formatter={(value) => `${value.toLocaleString()}원`} />
                    <Legend />
                    {chartKey && <Line type="monotone" dataKey={chartKey} stroke={fuelColorMap[chartKey]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}