// import { useState, useEffect } from 'react';
// import axios from "axios";

// export default function AllAvgPrice({ activeTab, setActiveTab }) {
//     //✅전국 유가 정보의 유종 리스트
//     const [oilData, setOilData] = useState(null);
//     const tabs = ['고급휘발유', '휘발유', '경유', 'LPG'];
//     const prodMap = {
//         //✅들어갈 유종을 받아온 API와 매핑
//         '경유': '자동차용경유',
//         'LPG': '자동차용부탄',
//         '휘발유': '휘발유',
//         '고급휘발유': '고급휘발유'
//     };

//     useEffect(() => {
//         //✅받아온 데이터 
//         const fetchOilData = async () => {
//             try {
//                 //✅응답받은 데이터 '/main/oilPrice/allavg' 와 연결 
//                 const response = await axios.get('/main/oilPrice/allavg');
//                 //✅데이터가 존재하고 && 데이터의 길이가 0이상(1부터) 이라면 setOilData에 저장함
//                 setOilData(response.data && response.data.length > 0 ? response.data : null);
//             } catch (error) {
//                 console.error(error);
//                 setOilData(null);
//             }
//         };
//         fetchOilData();
//         //[EXECUTE] 선언한 비동기 함수를 즉시 실행.
//     }, []);

//     return (
//         //✅유가정보 박스 크기
//         <div className="avg_price" style={{ padding: '10px', width: '32%' }}>
//             <h2>전국 유가정보</h2>
//             <hr />
//             <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
//                 {/* ✅탭메뉴 버튼누르면 setActiveTab으로 활성화 */}
//                 {tabs.map(tab => (
//                     <button
//                         key={tab}
//                         // ✅[KEY] 배열 렌더링 시 고유 키 필수 (React 내부 최적화)
//                         onClick={() => setActiveTab(tab)}
//                         //✅[EVENT] 버튼 클릭 → 상위 상태 변경 → 선택된 연료가 바뀌면 다른 컴포넌트(AvgRecentPrice)에도 반영.
//                         style={{
//                             padding: '8px 16px',
//                             cursor: 'pointer',
//                             backgroundColor: activeTab === tab ? '#2563eb' : '#f3f4f6',
//                             //✅[STYLE] 현재 선택된 탭이면 파란색(#2563eb), 아니면 회색.
//                             color: activeTab === tab ? '#fff' : '#000',
//                             border: 'none',
//                             borderRadius: '5px',
//                         }}
//                     >
//                         {tab}
//                         {/* ✅[UI TEXT] 버튼에 연료명 표시 */}
//                     </button>
//                 ))}
//             </div>

//             {oilData && Array.isArray(oilData) && (
//                 //✅[CONDITIONAL RENDER] 데이터가 존재하고 배열일 때만 목록 렌더링.   

//                 <ul style={{ listStyleType: 'none', padding: 0 }}>
//                     {oilData
//                         .filter(item => item.PRODNM === (prodMap[activeTab] || activeTab))
//                         .map((item, index) => {
//                             const diff = Number(item.DIFF);
//                             return (
//                                 <li
//                                     key={index}
//                                     style={{
//                                         marginBottom: '10px',
//                                         padding: '10px',
//                                         border: '1px solid #eee',
//                                         borderRadius: '5px',
//                                     }}
//                                 >
//                                     {/*✅가격을 API로부터 받아온 ELEMENT값으로 설정*/}
//                                     <p><strong>전국 평균 :</strong> {item.PRICE}원</p>
//                                     <p>
//                                         <strong>전일대비 등락값 : </strong>
//                                         {/* ✅가격이 전일대비 상승이면 노란색, 하락이면 초록색 */}
//                                         <span style={{ color: diff > 0 ? 'orange' : diff < 0 ? 'green' : 'black' }}>
//                                             {diff > 0 ? '▲' : diff < 0 ? '▼' : ''}{Math.abs(diff)}원
//                                         </span>
//                                     </p>
//                                 </li>
//                             );
//                         })}
//                 </ul>
//             )}
//         </div>
//     );
// }


import { useState, useEffect } from 'react';
import axios from "axios";

export default function AllAvgPrice({ activeTab, setActiveTab }) {
    const [oilData, setOilData] = useState(null);
    const tabs = ['고급휘발유', '휘발유', '경유', 'LPG'];
    const prodMap = {
        '경유': '자동차용경유',
        'LPG': '자동차용부탄',
        '휘발유': '휘발유',
        '고급휘발유': '고급휘발유'
    };

    useEffect(() => {
        const fetchOilData = async () => {
            try {
                const response = await axios.get('/main/oilPrice/allavg');
                setOilData(response.data && response.data.length > 0 ? response.data : null);
            } catch (error) {
                console.error(error);
                setOilData(null);
            }
        };
        fetchOilData();
    }, []);

    return (
        <div style={{
            padding: '15px',
            width: '32%',
            borderRadius: '12px',
            backgroundColor: '#fff',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
            <h2 style={{ marginBottom: '10px' }}>전국 유가정보</h2>
            <hr style={{ marginBottom: '15px' }} />
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '8px 16px',
                            cursor: 'pointer',
                            backgroundColor: activeTab === tab ? '#2563eb' : '#f3f4f6',
                            color: activeTab === tab ? '#fff' : '#000',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: activeTab === tab ? 'bold' : 'normal',
                            transition: '0.2s'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {oilData && Array.isArray(oilData) && (
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {oilData
                        .filter(item => item.PRODNM === (prodMap[activeTab] || activeTab))
                        .map((item, index) => {
                            const diff = Number(item.DIFF);
                            return (
                                <li
                                    key={index}
                                    style={{
                                        marginBottom: '12px',
                                        padding: '12px',
                                        border: '1px solid #eee',
                                        borderRadius: '8px',
                                        backgroundColor: '#fafafa',
                                    }}
                                >
                                    <p style={{ margin: 0 }}><strong>전국 평균 :</strong> {item.PRICE}원</p>
                                    <p style={{ margin: 0 }}>
                                        <strong>전일대비 등락값 : </strong>
                                        <span style={{
                                            color: diff > 0 ? 'orange' : diff < 0 ? 'green' : 'black'
                                        }}>
                                            {diff > 0 ? '▲' : diff < 0 ? '▼' : ''}{Math.abs(diff)}원
                                        </span>
                                    </p>
                                </li>
                            );
                        })}
                </ul>
            )}
        </div>
    );
}
