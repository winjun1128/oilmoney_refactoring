import { useEffect, useState } from 'react';
import './MyPage.css';
import axios from 'axios';
import EnergyRecord from './EnergyRecord';

function CarRegist({ cars, setCars, userInfo }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [carType, setCarType] = useState("");
    const [fuelType, setFuelType] = useState("휘발유");
    const [chargerType, setChargerType] = useState("");

    const fetchCars = async () => {
        try {
            const token = localStorage.getItem("token");

            // 차량 목록 요청
            const res = await axios.get("/cars", {
                headers: { Authorization: "Bearer " + token }
            });

            // 각 차량의 연료 기록 요청
            const carsWithRecords = await Promise.all(
                res.data.map(async car => {
                    const recordsRes = await axios.get(`/${car.carId}/energy`, {
                        headers: { Authorization: "Bearer " + token }
                    });
                    return { ...car, fuelRecords: recordsRes.data };
                })
            );

            setCars(carsWithRecords); // 상태에 한 번만 저장
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchCars();
    }, []);


    const handleAddClick = () => {
        setCarType("");
        setFuelType("휘발유");
        setChargerType("");
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!fuelType) return alert("연료 타입을 선택해주세요.");
        if (fuelType === "전기차" && !chargerType) return alert("충전기 타입을 선택해주세요.");

        try {
            const token = localStorage.getItem("token");
            const carData = { carType, fuelType, chargerType };

            await axios.post("/registcar", carData, {
                headers: { "Authorization": "Bearer " + token }
            });

            fetchCars();
            setCarType("");
            setFuelType("휘발유");
            setChargerType("");
            setIsModalOpen(false);
        } catch (error) {
            console.log(error);
            alert("등록 실패!");
        }
    };

    const handleDelete = async (car) => {
        if (car.isMain === 'Y') {
            alert("대표차는 삭제할 수 없습니다. 다른 차를 대표차로 설정 후 삭제해주세요.");
            return;
        }

        if (!window.confirm(car.carType + "(" + car.fuelType + ")를 삭제하시겠습니까?")) return;

        try {
            const token = localStorage.getItem("token");

            await axios.post("/deletecar",
                { carId: car.carId },
                { headers: { "Authorization": "Bearer " + token } }
            );
            //setCars(prev => prev.filter(c => c.carId !== car.carId));
            fetchCars();
        } catch (error) {
            console.log(error);
            alert("삭제 실패!");
        }
    };

    const setMainCar = async (car, carId) => {
        const confirmed = window.confirm(car.carType + "(" + car.fuelType + ")으로 설정하시겠습니까?");
        if (!confirmed) return;
        try {
            await axios.post("/setmain", null, {
                params: { userId: userInfo.userId, carId }
            });
            fetchCars();
        } catch (err) {
            console.error(err);
            alert("대표차 변경 실패");
        }
    };

    // 연료 타입 옵션
    const fuelOptions = [
        { label: "휘발유", icon: "fa-solid fa-gas-pump" },
        { label: "경유", icon: "fa-solid fa-truck" },
        { label: "LPG", icon: "fa-solid fa-fire-flame-simple" },
        { label: "전기차", icon: "fa-solid fa-bolt" }
    ];

    // 충전기 타입 옵션
    const chargerOptions = [
        { code: "01", label: "DC차데모" },
        { code: "02", label: "AC완속" },
        { code: "04", label: "DC콤보" },
        { code: "07", label: "AC3상" }
    ];

    const getChargerLabel = (code) => {
        const option = chargerOptions.find(opt => opt.code === code);
        return option ? option.label : "";
    };

    return (
        <div className="car-container">
            <div className='edit-title'>
                <span className='edit-title-text'>내 차 관리</span>
                <button type="button" className='edit-button' onClick={handleAddClick}>등록</button>
            </div>

            <div className='mypage-regist-contents'>
                {cars.length === 0 ? (
                    <span className='mypage-regist-info'>등록된 차량이 없습니다.</span>
                ) : (
                    <div className="cars-container">
                        {cars.map(car => (
                            <div key={car.carId} className={`car-card ${car.isMain === 'Y' ? 'main-car-card' : ''}`}>
                                {/* 차량 헤더 */}
                                <div className="car-header">
                                    <img src="/images/mypage/suv.png" alt={car.carType} className="car-photo" />
                                    <div className='car-title'>
                                        <div className="car-basic-info">
                                            <h3 className="car-nickname">{car.nickname || "내 차"}</h3>
                                            <span>모델명: {car.carType || "-"}</span><br></br>
                                            <span>연료: {car.fuelType}</span><br></br>
                                            {car.fuelType === "전기차" && car.chargerType && (
                                                <span>충전기 타입: {getChargerLabel(car.chargerType)}</span>
                                            )}
                                            {car.isMain === 'Y' && <span className="main-label">대표차</span>}
                                        </div>
                                        {/* 액션 버튼 */}
                                        <div className="car-actions">
                                            {car.isMain !== 'Y' && (
                                                <button className="set-main-btn" onClick={() => setMainCar(car, car.carId)}>대표차로 설정</button>
                                            )}
                                            <button className="car-delete-btn" onClick={() => handleDelete(car)}>
                                                <i className="fa-solid fa-xmark"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <EnergyRecord car={car} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 🚗 모달 */}
            {isModalOpen && (
                <div className="car-modal-overlay">
                    <div className="car-modal-content">
                        <h2 className="car-modal-title">차량 등록</h2>
                        <form onSubmit={handleSubmit}>
                            <div>
                                <label className='car-contents'>모델명 : </label>
                                <input type="text" className='car-model' value={carType} onChange={(e) => setCarType(e.target.value)} placeholder="예: 소나타" />
                            </div>

                            <div style={{ marginTop: "15px" }}>
                                <label className='car-contents'>연료 종류 : </label>
                                <div className="fuel-select">
                                    {fuelOptions.map(fuel => (
                                        <div key={fuel.label} className={`fuel-option ${fuelType === fuel.label ? "active" : ""}`} onClick={() => setFuelType(fuel.label)} >
                                            <i className={fuel.icon} style={{ marginRight: "6px" }}></i>
                                            {fuel.label}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {fuelType === "전기차" && (
                                <div style={{ marginTop: "15px" }}>
                                    <label className='car-contents'>충전기 타입 : </label>
                                    <div className="fuel-select">
                                        {chargerOptions.map(option => (
                                            <div
                                                key={option.code}
                                                className={`fuel-option ${chargerType === option.code ? "active" : ""}`}
                                                onClick={() => setChargerType(option.code)}
                                            >
                                                {option.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="modal-buttons">
                                <button type="button" className="modal-button cancel" onClick={handleCancel}>취소</button>
                                <button type="submit" className="modal-button submit">등록</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CarRegist;
