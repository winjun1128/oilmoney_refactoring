import { useState } from 'react';
import AllAvgPrice from './AllAvgPrice';
import AvgRecentPrice from './AvgRecentPrice';

export default function OilDashboard() {
    const [selectedFuel, setSelectedFuel] = useState('휘발유'); // 상위 상태

    // selectedFuel 상태를 상위에서 관리 → 하위 컴포넌트에 prop 전달
    // AllAvgPrice에서 버튼 클릭 → setSelectedFuel 호출 → AvgRecentPrice에 전달

    return (
        //✅AllAvgPrice와 AvgRecentPrice를 두개의 컴포넌트를 하나로 묶어서 finalproject로 내보내기함
        <div className='oilDashboard' style={{ display: 'flex', gap: 20 }}>
            {/* ✅AllAvgPrice의 selectedFuel 유종 선택시에 AvgRecentPrice의 selectedFuel도 같이 선택되어 동기화 */}
            <AllAvgPrice
                activeTab={selectedFuel}
                setActiveTab={setSelectedFuel}
            />
            <AvgRecentPrice
                activeFuel={selectedFuel}
            />
        </div>
    );
}
