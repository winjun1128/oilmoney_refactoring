import { useEffect, useState } from 'react';
import './MyPage.css';
import axios from 'axios';

function CarRegist({ cars, setCars, userInfo, fetchCars }) {

    const [isRegisting, setIsRegisting] = useState(false);
    const [carType, setCarType] = useState("");
    const [fuelType, setFuelType] = useState("휘발유");
    const [carCount, setCarCount] = useState(cars.length);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        axios.get("/mypage", { headers: { "Authorization": "Bearer " + token } })
            .then(res => {
                setCars(res.data.cars || []);
                if (res.data.cars && res.data.cars.length > 0) {
                    const last = res.data.cars[res.data.cars.length - 1];
                    setCarType(last.carType || "");
                    setFuelType(last.fuelType || "휘발유");
                }
            })
            .catch(err => console.log(err));
    }, [setCars]);

    const handleAddClick = () => {
        setCarType("");
        setFuelType("휘발유");
        setIsRegisting(true);
    };

    const handleCancel = () => {
        if (cars.length > 0) {
            const last = cars[cars.length - 1];
            setCarType(last.carType || "");
            setFuelType(last.fuelType || "휘발유");
        } else {
            setCarType("");
            setFuelType("휘발유");
        }
        setIsRegisting(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!fuelType) return alert("연료 타입을 선택해주세요.");

        try {
            const token = localStorage.getItem("token");
            const carData = { carType, fuelType };

            const res = await axios.post("/registcar", carData, {
                headers: {
                    "Authorization": "Bearer " + token
                }
            });
            fetchCars();
            setCarType("");
            setFuelType("휘발유");
            setIsRegisting(false);
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
            setCars(prev => prev.filter(c => c.carId !== car.carId));
        } catch (error) {
            console.log(error);
            alert("삭제 실패!");
        }
    };

    const setMainCar = async (car, carId) => {
        const confirmed = window.confirm(car.carType + "(" + car.fuelType + ")으로 설정하시겠습니까?");
        if (!confirmed) return;
        try {
            const res = await axios.post("/setmain", null, {
                params: { userId: userInfo.userId, carId }
            });
            // alert(res.data.message);
            fetchCars();
        } catch (err) {
            console.error(err);
            alert("대표차 변경 실패");
        }
    };

    return (
        <>
            <div className="car-container">
                {!isRegisting ? (
                    <>
                        <div className='edit-title'>
                            <span className='edit-title-text'>내 차 등록</span>
                            <button type="button" className='edit-button' onClick={handleAddClick}>추가</button>
                        </div>
                        <div className='mypage-regist-contents'>
                            {cars.length === 0 ? (
                                <span className='mypage-regist-info'>등록된 차량이 없습니다.</span>
                            ) : (
                                cars.map(car => (
                                    <div key={car.carId} className='mypage-car-item'>
                                        <div className={`car-info ${car.isMain === 'Y' ? 'main-car' : ''}`}>
                                            <span>차종: {car.carType || "-"}</span><br />
                                            <span>연료: {car.fuelType}</span>
                                            {car.isMain === 'Y' && <span className="main-label">대표차</span>}
                                        </div>
                                        <div className="car-buttons">
                                            {car.isMain !== 'Y' && (
                                                <button type="button" onClick={() => setMainCar(car, car.carId)} className="set-main-btn">
                                                    대표차로 설정
                                                </button>
                                            )}
                                            <button type="button" onClick={() => handleDelete(car)} className='car-delete-btn'>
                                                <i className="fa-solid fa-xmark"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                ) : (
                    <form>
                        <div className='edit-title'>
                            <span className='edit-title-text'>내 차 등록</span>
                            <div className='edit-buttons'>
                                <button type="button" onClick={handleCancel} className='edit-button'>취소</button>
                                <button type="submit" onClick={handleSubmit} className='edit-button'>등록</button>
                            </div>
                        </div>
                        <div className='edit-contents-box'>
                            <div className='edit-contents'>
                                <div>
                                    <label>차종(선택) : </label>
                                    <input
                                        type="text"
                                        value={carType}
                                        onChange={(e) => setCarType(e.target.value)}
                                        placeholder="예: 소나타"
                                    />
                                </div>
                                <div>
                                    <label>연료 종류 : </label>
                                    <select value={fuelType} onChange={(e) => setFuelType(e.target.value)} required>
                                        <option value="휘발유">휘발유</option>
                                        <option value="경유">경유</option>
                                        <option value="LPG">LPG</option>
                                        <option value="전기차">전기차</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </>
    )
}

export default CarRegist;