import { useState, useEffect } from "react";
import axios from "axios";
import './MyPage.css';

function EnergyRecord({ car }) {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false); // 기록 폼 표시 여부
    const [date, setDate] = useState(""); // 날짜
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
        if (!date || !station || !amount || !price) {
            alert("모든 정보를 입력해주세요.");
            return;
        }

        try {
            const res = await axios.post(`/${car.carId}/energy`, {
                carId: car.carId,
                recordDate: date,
                station,
                amount: parseFloat(amount),
                price: parseFloat(price),
                fuelType: car.fuelType
            });

            setRecords([res.data, ...records]);
            // 입력 초기화
            setDate("");
            setStation("");
            setAmount("");
            setPrice("");
            setShowForm(false); // 등록 후 폼 숨김
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
            <div className="record-title">
                <h4>{car.fuelType === "전기차" ? "충전" : "주유"} 기록</h4>
                <button onClick={() => setShowForm(!showForm)} className="record-add-btn">
                    {showForm ? "취소" : "기록하기"}
                </button>
            </div>

            {showForm && (
                <div className="add-record-form">
                    <div className="form-row">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="record-input"
                        />
                        <input
                            type="text"
                            placeholder={car.fuelType === "전기차" ? "충전소" : "주유소"}
                            value={station}
                            onChange={(e) => setStation(e.target.value)}
                            className="record-input"
                        />
                    </div>

                    <div className="form-row2">
                        <input
                            type="number"
                            placeholder={car.fuelType === "전기차" ? "충전량(kWh)" : "주유량(L)"}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="record-input"
                        />
                        <input
                            type="number"
                            placeholder="가격(원)"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="record-input"
                        />
                        <button className="record-submit-btn" onClick={handleAddRecord}>등록</button>
                    </div>
                </div>
            )}

            {/* 기록 리스트 */}
            {loading ? (
                <p>불러오는 중...</p>
            ) : records.length === 0 ? (
                <p>기록이 없습니다.</p>
            ) : (
                <table className="record-table">
                    <thead>
                        <tr>
                            <th className="date-column">날짜</th>
                            <th className="station-column">{car.fuelType === "전기차" ? "충전소" : "주유소"}</th>
                            <th>{car.fuelType === "전기차" ? "충전량(kWh)" : "주유량(L)"}</th>
                            <th>가격(원)</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((record) => (
                            <tr key={record.recordId}>
                                <td className="date-column">{record.recordDate}</td>
                                <td className="station-column" title={record.station}>{record.station}</td>
                                <td>{record.amount}</td>
                                <td>{record.price}</td>
                                <td>
                                    <button onClick={() => handleDeleteRecord(record.recordId)}>X</button>
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
