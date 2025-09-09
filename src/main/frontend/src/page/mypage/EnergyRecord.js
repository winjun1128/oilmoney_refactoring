import { useState, useEffect } from "react";
import axios from "axios";
import './MyPage.css';

function EnergyRecord({ car }) {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [station, setStation] = useState("");
    const [amount, setAmount] = useState("");
    const [price, setPrice] = useState("");
    const [error, setError] = useState("");

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/${car.carId}/energy`);
            setRecords(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError("기록 조회 실패");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, [car.carId]);

    const handleAddRecord = async () => {
        if (!station || !amount || (car.fuelType !== '전기차' && !price)) {
            alert("모든 정보를 입력해주세요.");
            return;
        }

        try {
            const res = await axios.post(`/${car.carId}/energy`, {
                station,
                amount: parseFloat(amount),
                price: parseFloat(price),
                fuelType: car.fuelType
                
            });
            setRecords([res.data, ...records]);
            setStation("");
            setAmount("");
            setPrice("");
        } catch (err) {
            console.error(err);
            alert("기록 추가 실패");
        }
    };

    const handleDeleteRecord = async (recordId) => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;

        try {
            await axios.post(`/energy/${recordId}`);
            setRecords(records.filter(r => r.recordId !== recordId));
        } catch (err) {
            console.error(err);
            alert("삭제 실패");
        }
    };

    return (
        <div className="energy-record-container">
            <h4>{car.fuelType === "전기차" ? "충전" : "주유"} 기록</h4>

            {/* 기록 추가 */}
            <div className="add-record-form">
                <input type="text"
                    placeholder={car.fuelType === "전기차" ? "충전소" : "주유소"}
                    value={station}
                    onChange={(e) => setStation(e.target.value)}
                />
                <input
                    type="number"
                    placeholder={car.fuelType === "전기차" ? "충전량(kWh)" : "주유량(L)"}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="가격"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                />
                <button onClick={handleAddRecord}>추가</button>
            </div>

            {/* 기록 표시 */}
            {loading ? (
                <p>불러오는 중...</p>
            ) : records.length === 0 ? (
                <p>기록이 없습니다.</p>
            ) : (
                <table className="record-table">
                    <thead>
                        <tr>
                            <th>날짜</th>
                            <th>{car.fuelType === "전기차" ? "충전소" : "주유소"}</th>
                            <th>{car.fuelType === "전기차" ? "충전량(kWh)" : "주유량(L)"}</th>
                            <th>가격</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((record) => (
                            <tr key={record.recordId}>
                                <td>{record.recodeDate}</td>
                                <td>{record.station}</td>
                                <td>{record.amount}</td>
                                <td>{record.price}</td>
                                <td>
                                    <button onClick={() => handleDeleteRecord(record.recordId)}>삭제</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {error && <p className="error">{error}</p>}
        </div>
    );
}

export default EnergyRecord;
