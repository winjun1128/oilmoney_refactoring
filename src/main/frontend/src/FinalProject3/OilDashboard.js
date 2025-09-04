import { useState } from 'react';
import AllAvgPrice from './AllAvgPrice';
import AvgRecentPrice from './AvgRecentPrice';
import SidoPrice from './SidoPrice';
import RegionSelector from './RegionSelector';

// export default function OilDashboard() {
//     const [selectedFuel, setSelectedFuel] = useState('휘발유'); // 상위 상태
//     const [selectedSidoName, setSelectedSidoName] = useState("충남"); // 시도 선택 상태

//     // selectedFuel 상태를 상위에서 관리 → 하위 컴포넌트에 prop 전달
//     // AllAvgPrice에서 버튼 클릭 → setSelectedFuel 호출 → AvgRecentPrice에 전달

//     return (
//         //✅AllAvgPrice와 AvgRecentPrice를 두개의 컴포넌트를 하나로 묶어서 finalproject로 내보내기함
//         <div className='oilDashboard' style={{
//             display: 'flex',
//             flexDirection: 'column', // 여기서 방향을 세로로 변경
//             gap: 20
//         }}>
//             {/* ✅AllAvgPrice의 selectedFuel 유종 선택시에 AvgRecentPrice의 selectedFuel도 같이 선택되어 동기화 */}
//             <div style={{
//                 display: 'flex', flexDirection: 'row',  // 가로 방향 (왼쪽 → 오른쪽)
//                 gap: '20px',
//             }}>
//                 <AllAvgPrice
//                     activeTab={selectedFuel}
//                     setActiveTab={setSelectedFuel}
//                 />

//                 <AvgRecentPrice
//                     activeFuel={selectedFuel}
//                 />
//             </div>

//             {/* SidoPrice에 selectedFuel, selectedSidoName 상태 내려주기 */}
//             <div style={{
//                 display: 'flex', flexDirection: 'row',  // 가로 방향 (왼쪽 → 오른쪽)
//                 gap: '20px',
//             }}>
//                 <SidoPrice
//                     selectedSidoName={selectedSidoName}
//                     setSelectedSidoName={setSelectedSidoName}
//                     selectedFuel={selectedFuel}
//                 />

//                 {/* RegionSelector도 동일 상태 사용 가능 */}
//                 <RegionSelector
//                     sidoName={selectedSidoName}  // 동일한 상태를 사용
//                     selectedFuel={selectedFuel}
//                 />
//             </div>
//         </div>
//     );
// }
///-------------------------------------------------------------------
export default function OilDashboard() {
    const [selectedFuel, setSelectedFuel] = useState('휘발유');
    const [selectedSidoName, setSelectedSidoName] = useState("충남");

    return (
        <div className="oilDashboard" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '30px',        // 위아래 컴포넌트 간 간격 증가
            padding: '20px',    // 전체 padding 추가
            backgroundColor: '#f5f5f5', // 전체 배경색 연한 회색
            minHeight: '100vh', // 화면 전체 높이 확보
            boxSizing: 'border-box'
        }}>
            {/* 상단 유종 관련 컴포넌트 */}
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '20px',
                backgroundColor: '#ffffff', // 카드 느낌
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                alignItems: 'flex-start', // 컴포넌트 상단 정렬
                flexWrap: 'wrap', // 화면이 작으면 아래로 내려가도록
            }}>
                <AllAvgPrice
                    activeTab={selectedFuel}
                    setActiveTab={setSelectedFuel}
                />

                <AvgRecentPrice
                    activeFuel={selectedFuel}
                />
            </div>

            {/* 하단 지역 관련 컴포넌트 */}
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '20px',
                backgroundColor: '#ffffff',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
            }}>
                <SidoPrice
                    selectedSidoName={selectedSidoName}
                    setSelectedSidoName={setSelectedSidoName}
                    selectedFuel={selectedFuel}
                />

                <RegionSelector
                    sidoName={selectedSidoName}
                    selectedFuel={selectedFuel}
                />
            </div>
        </div>
    );
}
///-------------------------------------------------------------------

