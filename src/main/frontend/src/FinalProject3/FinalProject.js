import React, { useState, useEffect } from 'react';
import axios from 'axios';

function FinalProject() {
    const [oilData, setOilData] = useState(null); 
    const [message, setMessage] = useState('로딩 중...'); // 처음부터 로딩 중으로 표시

    // 페이지 로드 시 자동으로 API 호출
    useEffect(() => {
        const fetchOilData = async () => {
            try {
                const response = await axios.get('/main/oilPrice');

                if (response.data && response.data.length > 0) {
                    setOilData(response.data);
                    setMessage('데이터를 성공적으로 불러왔습니다.');
                } else {
                    setOilData(null);
                    setMessage('데이터가 비어있습니다.');
                }
            } catch (error) {
                console.error(error);
                setOilData(null);
                setMessage('API 호출 중 오류가 발생했습니다.');
            }
        };

        fetchOilData(); // 컴포넌트가 마운트되자마자 API 호출
    }, []); // 빈 배열 → 처음 한 번만 실행

    return (
        <div style={{ padding: '10px'}}>
            <h1>유가 정보 페이지</h1>

            <p style={{ marginTop: '15px', fontWeight: 'bold' }}>{message}</p>

            {oilData && Array.isArray(oilData) && (
                <div style={{ marginTop: '20px' }}>
                    <h2>유가 정보</h2>
                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                        {oilData.map((item, index) => (
                            <li key={index} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #eee', borderRadius: '5px' }}>
                                <p><strong>제품명 :</strong> {item.PRODNM}</p>
                                <p><strong>유가 :</strong> {item.PRICE}원</p>
                                <p><strong>날짜 :</strong> {item.TRADE_DT}</p>
                                <p><strong>전일대비 등락값 :</strong> {item.DIFF}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default FinalProject;
