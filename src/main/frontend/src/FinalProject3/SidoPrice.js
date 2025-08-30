// React 훅(useState, useEffect)을 불러옴
// useState → 상태(state) 관리, useEffect → 컴포넌트 생명주기 관리(마운트/업데이트)
import { useState, useEffect } from "react";

// axios 라이브러리 불러오기
// HTTP 요청(GET, POST 등)을 보내고 서버에서 데이터를 받아올 때 사용
import axios from "axios";
import FlipNumbers from 'react-flip-numbers';

// SidoPrice라는 이름의 함수형 컴포넌트 정의
// export default → 다른 파일에서 import 시 기본(default)으로 불러올 수 있음
export default function SidoPrice() {

    //✅selectedIndex: 현재 선택된 지역(지도 버튼)의 index
    //setSelectedIndex: selectedIndex 상태를 변경하는 함수
    //✅useState(0) → 초기값 0 (첫 번째 지역 서울)
    //✅상수 배열 선언을 한 pins의 첫번째 배열인 0인덱스를 파라미터로 넣어 기본값을 서울로 지정함 
    const [selectedIndex, setSelectedIndex] = useState(0);

    // oilData: API에서 받아온 전국 시도별 유가 데이터 배열
    // setOilData: oilData 상태를 변경하는 함수
    const [oilData, setOilData] = useState([]);

    // 지도 버튼 위치, 이름 정의
    //✅각 pin 객체는 지역 이름(name), 지도 내 top/left 좌표(px)
    //✅절대 경로로 설정해놓음
    const pins = [
        { name: "서울", top: "70px", left: "135px" },
        { name: "인천", top: "75px", left: "80px" },
        { name: "경기", top: "40px", left: "130px" },
        { name: "충북", top: "105px", left: "190px" },
        { name: "세종", top: "145px", left: "150px" },
        { name: "대전", top: "195px", left: "145px" },
        { name: "강원", top: "70px", left: "215px" },
        { name: "충남", top: "170px", left: "80px" },
        { name: "대구", top: "220px", left: "205px" },
        { name: "부산", top: "285px", left: "230px" },
        { name: "경북", top: "175px", left: "220px" },
        { name: "울산", top: "235px", left: "250px" },
        { name: "경남", top: "285px", left: "170px" },
        { name: "전남", top: "320px", left: "60px" },
        { name: "제주", top: "390px", left: "63px" },
        { name: "광주", top: "280px", left: "70px" },
        { name: "전북", top: "240px", left: "85px" },
    ];

    // 현재 선택된 지역 이름 계산
    // ✅selectedIndex가 null이 아니면 pins 배열에서 이름 가져오기
    // ✅selectedIndex가 null이면 선택된 지역 없음 → null 반환
    const selectedLocalName = selectedIndex !== null ? pins[selectedIndex].name : null;

    // 선택된 지역의 데이터 필터링
    // oilData 배열에서 SIDONM이 selectedLocalName과 같은 항목만 추출
    const selectedLocalRows = oilData.filter(
        item => item.SIDONM === selectedLocalName
    );

    // API 호출 (데이터 가져오기)
    // 컴포넌트가 처음 렌더링될 때 한 번만 실행되는 useEffect
    useEffect(() => {
        // API 호출 함수 정의
        const fetchOilData = async () => { // API에서 데이터를 가져오는 비동기 함수
            try {
                // axios GET 요청 → '/main/oilPrice/sido' API 호출
                const response = await axios.get('/main/oilPrice/sido');

                // 서버에서 받은 데이터가 존재하고 배열 길이가 0 이상이면 상태에 저장
                if (response.data && response.data.length > 0) {
                    setOilData(response.data);
                } else {
                    // 데이터가 없으면 빈 배열 저장
                    setOilData([]);
                }
            } catch (error) {
                // 오류 발생 시 콘솔 출력 후 상태를 null로 설정
                console.error(error);
                setOilData(null);
            }
        };
        fetchOilData(); // 컴포넌트 마운트 직후 API 호출
    }, []); // 빈 배열 → 처음 한 번만 실행

    //=============================
    // 디버깅용 콘솔 로그
    console.log("selectedIndex:", selectedIndex); // 현재 선택된 인덱스
    console.log("selectedLocalName:", selectedLocalName); // 현재 선택된 지역 이름
    console.log("selectedLocalRows:", selectedLocalRows); // 선택 지역의 데이터 배열

    // 렌더링 (JSX)
    //=============================
    return (
        // 전체 컨테이너: 좌우 영역(지도, 유가 정보)을 flex로 배치
        // 클래스명 sido_container → CSS 스타일 적용 가능
        <div className="sido_container" style={{ display: "flex" }}>

            {/* 왼쪽 지도 영역 */}
            <div className="map_box" style={{ padding: '10px', width: '32%' }}>
                <h2>시도별 평균유가</h2>
                <hr></hr>

                {/* 지도 이미지와 버튼들을 포함하는 박스 */}
                <div
                    className="main_map"
                    style={{
                        width: '300px',           // 지도 박스 너비
                        height: '430px',          // 지도 박스 높이
                        position: 'relative'      // 버튼 absolute 위치 배치를 위해 부모 relative 설정
                    }}>

                    {/* 실제 지도 이미지 */}
                    <img
                        src="/images/main_map.png" // 이미지 경로
                        alt="지도"                 // 이미지 대체 텍스트
                        style={{ width: '100%', height: '100%' }} // 부모 박스 크기에 맞게 확대/축소
                    />

                    {/* 지도 위에 지역 버튼 생성 */}
                    {pins.map((pin, index) => (
                        <button
                            className="local_button" // 버튼 스타일 클래스
                            key={index}               // React 리스트 key 필수
                            onClick={() => setSelectedIndex(index)} // 클릭 시 선택 지역 변경
                            style={{
                                position: 'absolute',  // 부모 relative 기준 절대 위치
                                top: pin.top,          // CSS top 좌표
                                left: pin.left,        // CSS left 좌표
                                padding: '4px 6px',   // 버튼 안쪽 여백
                                border: '1px solid #333', // 테두리 스타일
                                borderRadius: '3px',      // 둥근 모서리
                                fontSize: '12px',          // 글자 크기
                                cursor: 'pointer',         // 마우스 포인터 변경
                                backgroundColor: selectedIndex === index ? '#2563eb' : 'white', // 선택된 버튼 색상
                                color: selectedIndex === index ? 'white' : 'black'              // 글자 색상
                            }}
                        >
                            {pin.name} {/* 버튼 안 텍스트: 지역 이름 */}
                        </button>
                    ))}
                </div>
            </div>

            {/* 오른쪽 선택 지역 유가 정보 영역 */}
            <div className="LocalPriceBox" style={{ marginTop: 12 }}>
                {/* selectedLocalRows가 존재할 때만 렌더링 (조건부 렌더링) */}
                {selectedLocalRows.length > 0 && (
                    <ul style={{ listStyle: 'none', padding: 0, border: '1px solid black' }}>
                        {/* 선택된 지역의 유가 데이터를 필터링 후 반복 렌더링 */}
                        {selectedLocalRows
                            .filter(item =>
                                ["B034", "B027", "D047", "K015"].includes(item.PRODCD) // 고급휘발유, 휘발유, 경유만 표시
                            )
                            .map((item, index) => {
                                // PRODCD 코드에 따라 연료 이름 변환
                                let fuelName = "";
                                switch (item.PRODCD) {
                                    case "B027": fuelName = "휘발유"; break;
                                    case "B034": fuelName = "고급휘발유"; break;
                                    case "D047": fuelName = "경유"; break;
                                    case "K015": fuelName = "LPG"; break;
                                    default: fuelName = item.PRODNM;
                                }

                                return (
                                    //✅❎
                                    // 유가 데이터 리스트 아이템
                                    <li
                                        key={index} // React 리스트 key 필수
                                        style={{
                                            //width: '300px',
                                            display: 'flex',     // 내용만큼 너비 자동
                                            marginBottom: '10px',     // 아래 여백
                                            padding: '10px',          // 내부 여백
                                            //border: '1px solid #000000ff', // 테두리
                                            borderRadius: '20px'       // 둥근 모서리
                                        }}
                                    >
                                        <div style={{ display: 'flex' }}>
                                            {/* 지역명과 연료 종류, 가격 표시 */}
                                            {/* <strong>{item.SIDONM}평균</strong> */}
                                            {fuelName} : <FlipNumbers
                                                height={20}
                                                width={10}
                                                color="black"
                                                background="white"
                                                play // true일 때 애니메이션
                                                numbers={item.PRICE.toString()} // 표시할 숫자
                                            />   원
                                        </div>
                                    </li>
                                );
                            })}
                    </ul>
                )}
            </div>
        </div>
    )
}