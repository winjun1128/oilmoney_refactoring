import { useState } from 'react';
import './MyPage.css';
import axios from 'axios';

function EditInfo({ userInfo, setUserInfo }) {

    const [email, setEmail] = useState(userInfo.email);
    const [phoneNum, setPhoneNum] = useState(userInfo.phoneNum || "");
    const [addr, setAddr] = useState(userInfo.addr || "");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPw && newPw !== confirmPw) {
            return alert("비밀번호가 일치하지 않습니다.");
        }

        try {
            const res = await axios.post("/update",
                { email, phoneNum, addr, newPw },
                {
                    headers: {
                        "Authorization": "Bearer " + localStorage.getItem("token")
                    },
                }
            );
            alert(res.data.message || "정보가 수정되었습니다.");
            setUserInfo({ ...userInfo, email, phoneNum, addr });
            setNewPw("");
            setConfirmPw("");
        } catch (error) {
            console.log(error);
            alert(error.response?.data?.message || "정보 수정 실패");
        }
    }

    return (
        <div className="edit-info-container">
            <h2>개인정보 수정</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>이름:</label>
                    <input type="text" value={userInfo.name} disabled />
                </div>
                <div>
                    <label>아이디:</label>
                    <input type="text" value={userInfo.userId} disabled />
                </div>
                <div>
                    <label>새 비밀번호:</label>
                    <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="새 비밀번호" />
                </div>
                <div>
                    <label>새 비밀번호 확인:</label>
                    <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="새 비밀번호 확인" />
                </div>
                <div>
                    <label>이메일:</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                    <label>전화번호:</label>
                    <input type="text" value={phoneNum} onChange={(e) => setPhoneNum(e.target.value)} />
                </div>
                <div>
                    <label>주소:</label>
                    <input type="text" value={addr} onChange={(e) => setAddr(e.target.value)} />
                </div>
                <button type="submit">저장</button>
            </form>
        </div>
    )
}

export default EditInfo;