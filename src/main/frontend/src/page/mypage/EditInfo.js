import { useEffect, useState } from 'react';
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

    useEffect(() => {
        setEmail(userInfo.email || "");
        setPhoneNum(userInfo.phoneNum || "");
        setAddr(userInfo.addr || "");
    }, [userInfo]);

    const handleCancel = () => {
        setEmail(userInfo.email || "");
        setPhoneNum(userInfo.phoneNum || "");
        setAddr(userInfo.addr || "");
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
            const formData = new FormData();
            formData.append("email", email);
            formData.append("phoneNum", phoneNum);
            formData.append("addr", addr);
            if (newPw) formData.append("newPw", newPw);
            const res = await axios.post("/update", formData,
                {
                    headers: {
                        "Authorization": "Bearer " + localStorage.getItem("token"),
                        "Content-Type": "multipart/form-data"
                    },
                }
            );
            alert(res.data);
            setUserInfo({ ...userInfo, email, phoneNum, addr });
            setPw("");
            setNewPw("");
            setConfirmPw("");
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
                        <div className='edit-info-contents'>
                            <span>이름 : {userInfo.name}</span>
                            <span>아이디 : {userInfo.userId}</span>
                            <span>이메일 : {userInfo.email}</span>
                            {phoneNum && <span>전화번호 : {phoneNum}</span>}
                            {addr && <span>주소 : {addr}</span>}
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
                        <div className='edit-contents-box'>
                            <div className='edit-contents'>
                                <div>
                                    이메일 : <input type="email" className='edit-email' value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                                <div className='edit-pw'>
                                    비밀번호 변경 :
                                    <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder='현재 비밀번호' />
                                    <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder='새 비밀번호' />
                                    <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder='새 비밀번호 확인' />
                                    전화번호 :
                                    <input type="text" value={phoneNum} onChange={(e) => setPhoneNum(e.target.value)} />
                                    주소 :
                                    <input type="text" value={addr} onChange={(e) => setAddr(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </>
    )
}

export default EditInfo;