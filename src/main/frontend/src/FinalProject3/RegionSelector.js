//RegionSelector.js
import { useState } from "react";
import './components.css';
import './RegionSelector.css';
import './line.css';

export default function RegionSelector({ sidoName,  sigunList, lowerTopData, selectedSigunCode, setSelectedSigunCode }) {

    const iconMap = {
        SKE: "https://www.opinet.co.kr/images/user/main/img_logo2.jpg",   // SK에너지
        GSC: "https://www.opinet.co.kr/images/user/main/img_logo3.jpg",   // GS칼텍스
        HDO: "https://www.opinet.co.kr/images/user/main/img_logo.jpg",   // 현대오일뱅크
        SOL: "https://www.opinet.co.kr/images/user/main/img_logo4.jpg",   // S-OIL
        RTE: "https://www.opinet.co.kr/images/user/main/img_logo7.jpg",   // 자영알뜰
        RTX: "https://www.opinet.co.kr/images/user/main/img_logo7.jpg",   // 고속도로알뜰
        NHO: "https://www.opinet.co.kr/images/user/main/img_logo11.jpg",   // 농협알뜰
        ETC: "https://www.opinet.co.kr/images/user/main/img_logo13.jpg",   // 자가상표
        E1G: "https://www.opinet.co.kr/images/user/main/img_logo10.jpg",   // E1
        SKG: "https://www.opinet.co.kr/images/user/main/img_logo12.jpg",   // SK가스
        RTO: "https://www.opinet.co.kr/images/user/main/img_logo7.jpg"
    };

    // ✅ 부모로부터 받은 lowerTopData를 사용합니다.
    const gasStationData = lowerTopData;

    return (
        <div className="card-container region-selector">

            <h2 className="card-title">&nbsp;&nbsp;{sidoName} 지역별 저렴한 주유소 TOP 7</h2>
            <hr className="line" />
            <select
                className="sigun-select"
                value={selectedSigunCode}
                onChange={e => setSelectedSigunCode(e.target.value)}
            >
                <option value="">시/군 선택</option>
                {sigunList.sort((a, b) => a.AREA_NM.localeCompare(b.AREA_NM)).map(sigun => (
                    <option key={sigun.AREA_CD} value={sigun.AREA_CD}>
                        {sigun.AREA_NM}
                    </option>
                ))}
            </select>
            {gasStationData.length > 0 ? (
                <ul className="list-container gas-station-list">
                    {gasStationData.map(station => (
                        <li key={station.UNI_ID} className="list-item">
                            <strong>
                                {iconMap[station.POLL_DIV_CD]?.startsWith("http")
                                    ? <img
                                        src={iconMap[station.POLL_DIV_CD]}
                                        alt={station.POLL_DIV_CD}
                                        style={{ width: "px", marginRight: "15px", verticalAlign: "middle" }}
                                    />
                                    : iconMap[station.POLL_DIV_CD] || "❓"
                                }
                                {station.OS_NM}
                            </strong>
                            <span className="price">{station.PRICE}원</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="no-data-message">주유소 정보를 찾을 수 없습니다.</p>
            )}
        </div>
    );
}