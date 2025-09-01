import { useState } from 'react';
import './MyPage.css';
import axios from 'axios';

function EditInfo({ userInfo, setUserInfo }) {

    const [isEditing, setIsEditing] = useState(false);

    const [pw, setPw] = useState("");
    const [email, setEmail] = useState(userInfo.email);
    const [phoneNum, setPhoneNum] = useState(userInfo.phoneNum || "");
    const [addr, setAddr] = useState(userInfo.addr || "");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");

    const originalData = {
        email: userInfo.email,
        phoneNum: userInfo.phoneNum || "",
        addr: userInfo.addr || "",
    };

    const handleCancel = () => {
        setEmail(originalData.email);
        setPhoneNum(originalData.phoneNum);
        setAddr(originalData.addr);
        setPw("");
        setNewPw("");
        setConfirmPw("");
        setIsEditing(false);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if ((newPw || pw) && pw !== userInfo.pw) {
            return alert("현재 비밀번호가 일치하지 않습니다.");
        }

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
            setPw("");
            setIsEditing(false);
        } catch (error) {
            console.log(error);
            alert(error.response?.data?.message || "정보 수정 실패");
        }
    }

    return (
        <>
            <div className="edit-info-container">
                {!isEditing ? (
                    <>
                        <div className='edit-title'>
                            <span className='edit-title-text'>개인정보</span>
                            <button type="button" className='edit-button' onClick={() => setIsEditing(true)}>수정</button>
                        </div>
                        <div>
                            <p>이름 : {userInfo.name}</p>
                            <p>아이디 : {userInfo.userId}</p>
                            <p>이메일 : {userInfo.email}</p>
                            {phoneNum && <p>전화번호 : {phoneNum}</p>}
                            {addr && <p>주소 : {addr}</p>}
                        </div>
                    </>
                ) : (
                    <form>
                        <div className='edit-title'>
                            <span className='edit-title-text'>개인정보 수정</span>
                            <div className='edit-buttons'>
                                <button type="button" onClick={handleCancel} className='edit-button'>취소</button>
                                <button type="submit" onClick={handleSubmit} className='edit-button'>저장</button>
                            </div>
                        </div>
                        <div className='edit-contents'>
                            <div>
                                <span>이름 : <input type="text" value={userInfo.name} disabled /></span>
                            </div>
                            <div>
                                <span>아이디 : <input type="text" value={userInfo.userId} disabled /></span>
                            </div>
                            <div>
                                <span>이메일 : <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></span>
                            </div>
                            <div>
                                <span>현재 비밀번호 : <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></span>
                            </div>
                            <div>
                                <span>새 비밀번호 : <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} /></span>
                            </div>
                            <div>
                                <span>새 비밀번호 확인 : <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} /></span>
                            </div>
                            <div>
                                <span>전화번호 : <input type="text" value={phoneNum} onChange={(e) => setPhoneNum(e.target.value)} /></span>
                            </div>
                            <div>
                                <span>주소 : <input type="text" value={addr} onChange={(e) => setAddr(e.target.value)} /></span>
                            </div>
                        </div>

                    </form>
                )}
            </div>
        </>
    )
}

export default EditInfo;