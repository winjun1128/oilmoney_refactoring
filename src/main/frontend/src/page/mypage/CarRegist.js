import { useEffect, useState } from 'react';
import './MyPage.css';
import axios from 'axios';

function CarRegist({ cars, setCars }) {

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
            const { newCar, carCount } = res.data;
            setCars([newCar]);
            setCarCount(carCount);
            setCarType("");
            setFuelType("휘발유");
            setIsRegisting(false);
            alert("등록 성공!");
        } catch (error) {
            console.log(error);
            alert("등록 실패!");
        }
    };

    const handleDelete = async (index, car) => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;

        try {
            const token = localStorage.getItem("token");

            await axios.post("/deletecar",
                { carId: car.carId },
                { headers: { "Authorization": "Bearer " + token } }
            );

            setCars(prevCars => prevCars.filter((_, i) => i !== index));
        } catch (error) {
            console.log(error);
            alert("삭제 실패!");
        }
    };

    return (
        <>
            <div className="edit-info-container">
                {!isRegisting ? (
                    <>
                        <div className='edit-title'>
                            <span className='edit-title-text'>내 차 등록</span>
                            <button type="button" className='edit-button' onClick={handleAddClick}>추가</button>
                        </div>
                        <div className='edit-contents'>
                            {cars.length === 0 ? (
                                <span className='mypage-regist-info'>등록된 차량이 없습니다.</span>
                            ) : (
                                cars.map((car, index) => (
                                    <div key={car.carId || index} className='mypage-car-item'>
                                        <div>
                                            <span>차종: {car.carType || "-"}</span><br></br>
                                            <span>연료: {car.fuelType}</span>
                                        </div>
                                        <button type="button" onClick={() => handleDelete(index, car)} className='car-delete-btn'><i class="fa-solid fa-xmark"></i></button>

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
                                    <label>차종 (선택): </label>
                                    <input
                                        type="text"
                                        value={carType}
                                        onChange={(e) => setCarType(e.target.value)}
                                        placeholder="예: 소나타"
                                    />
                                </div>
                                <div>
                                    <label>연료 종류: </label>
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