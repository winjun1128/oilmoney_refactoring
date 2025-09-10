//AllAvgPrice.js
import './components.css';
import './AllAvgPrice.css';

// props로 부모 컴포넌트에서 받은 allAvgData와 sidoPriceData를 사용합니다.
export default function AllAvgPrice({ activeTab, setActiveTab, selectedSidoName, selectedFuel, allAvgData, sidoPriceData }) {

    const tabs = ['휘발유', '고급휘발유', '경유', 'LPG'];
    const prodMap = {
        '경유': '자동차용경유',
        'LPG': '자동차용부탄',
        '휘발유': '휘발유',
        '고급휘발유': '고급휘발유'
    };

    // 전국 평균 필터링 (부모로부터 받은 allAvgData 사용)
    // ✅ allAvgData가 유효한 배열인지 확인
    const allAvgFiltered = allAvgData && Array.isArray(allAvgData)
        ? allAvgData.filter(item => item.PRODNM === (prodMap[activeTab] || activeTab))
        : [];
    const allAvgItem = allAvgFiltered[0];

    // ✅ sidoPriceData가 유효한 배열인지 확인
    const sidoFiltered = sidoPriceData && Array.isArray(sidoPriceData)
        ? sidoPriceData.filter(item =>
            item.SIDONM === selectedSidoName &&
            ((selectedFuel === "휘발유" && item.PRODCD === "B027") ||
                (selectedFuel === "고급휘발유" && item.PRODCD === "B034") ||
                (selectedFuel === "경유" && item.PRODCD === "D047") ||
                (selectedFuel === "LPG" && item.PRODCD === "K015"))
        )
        : [];
    const sidoItem = sidoFiltered[0];

    return (
        <div className="card-container all-avg-price-card">

            {/* 전국 평균 */}
            <h2 className="card-title">&nbsp;&nbsp;&nbsp;전국 평균 유가정보</h2>
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
            {/* 전국 평균 */}
            {allAvgItem && (
                <div className="national-price-content">
                    <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                        <span className="price-label">전국 평균</span>
                        <span>(원/리터)</span>
                    </div>
                    <strong className="price-value">{allAvgItem.PRICE} 원</strong>
                    <span className={`price-diff ${Number(allAvgItem.DIFF) > 0 ? 'up' : Number(allAvgItem.DIFF) < 0 ? 'down' : 'no-change'}`}>
                        {Number(allAvgItem.DIFF) > 0 ? '▲' : Number(allAvgItem.DIFF) < 0 ? '▼' : '-'} {Math.abs(Number(allAvgItem.DIFF)).toFixed(2)}원
                    </span>
                </div>
            )}
            {/* 선택 지역 평균 */}
            <div className="national-price-content">
                <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                    <span className="price-label">{selectedSidoName} 평균</span>
                    <span>(원/리터)</span>
                </div>
                {sidoItem ? (
                    <>
                        <strong className="price-value">{sidoItem.PRICE} 원</strong>
                        <span className={`price-diff ${Number(sidoItem.DIFF) > 0 ? 'up' : Number(sidoItem.DIFF) < 0 ? 'down' : 'no-change'}`}>
                            {Number(sidoItem.DIFF) > 0 ? '▲' : Number(sidoItem.DIFF) < 0 ? '▼' : '-'} {Math.abs(Number(sidoItem.DIFF)).toFixed(2)}원
                        </span>
                    </>
                ) : (
                    <p className="no-data-message">데이터를 불러올 수 없습니다.</p>
                )}
            </div>
        </div>
    );
}
