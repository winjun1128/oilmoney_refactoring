import { useState, useEffect } from 'react';
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function AvgRecentPrice({ activeFuel }) {
    const [data, setData] = useState([]);
    const prodNameMap = { B034: '고급휘발유', D047: '경유', B027: '휘발유', K015: 'LPG' };

    useEffect(() => {
        axios.get('/main/oilPrice/avgrecent')
            .then(res => {
                const tempData = {};
                res.data.forEach(item => {
                    const mmdd = item.DATE.slice(4, 6) + '-' + item.DATE.slice(6, 8);
                    if (!tempData[mmdd]) tempData[mmdd] = { date: mmdd };
                    const key = prodNameMap[item.PRODCD];
                    tempData[mmdd][key] = item.PRICE;
                });
                setData(Object.values(tempData));
            })
            .catch(err => console.error(err));
    }, []);

    const fuelKeyMap = { '경유': '경유', '휘발유': '휘발유', '고급휘발유': '고급휘발유', 'LPG': 'LPG' };
    const chartKey = fuelKeyMap[activeFuel];

    const prices = data.map(d => d[chartKey] || 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 100;

    const fuelColorMap = {
        '휘발유': '#82ca9d',      // 초록
        '경유': '#ff7300',        // 주황
        '고급휘발유': '#8884d8',   // 보라
        'LPG': '#88846a'
    };

    return (
        <div style={{ padding: '10px', width: '75%' }}>
            <h2>전국 유가추이</h2>
            <LineChart width={600} height={300} data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[minPrice, maxPrice]} tickFormatter={v => v.toFixed(0)} />
                <Tooltip />
                <Legend />
                {chartKey && <Line
                    type="monotone"
                    dataKey={chartKey}
                    stroke={fuelColorMap[chartKey]}
                />}

            </LineChart>
        </div>
    );
}
