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

    const [profileFile, setProfileFile] = useState(null);
    const [profilePreview, setProfilePreview] = useState(userInfo.profileUrl || "/images/mypage/profile.jpg");

    // const originalData = {
    //     email: userInfo.email,
    //     phoneNum: userInfo.phoneNum || "",
    //     addr: userInfo.addr || "",
    //     profileFile: userInfo.profileUrl || "/images/mypage/profile.jpg"
    // };

    // const handleCancel = () => {
    //     setEmail(originalData.email);
    //     setPhoneNum(originalData.phoneNum);
    //     setAddr(originalData.addr);
    //     setPw("");
    //     setNewPw("");
    //     setConfirmPw("");
    //     setIsEditing(false);
    //     setProfilePreview(originalData.profilePreview);
    // }

    useEffect(() => {
        setEmail(userInfo.email || "");
        setPhoneNum(userInfo.phoneNum || "");
        setAddr(userInfo.addr || "");
        setProfilePreview(userInfo.profileUrl || "/images/mypage/profile.jpg");
    }, [userInfo]);

    const handleCancel = () => {
        setEmail(userInfo.email || "");
        setPhoneNum(userInfo.phoneNum || "");
        setAddr(userInfo.addr || "");
        setPw("");
        setNewPw("");
        setConfirmPw("");
        setProfileFile(null);
        setProfilePreview(userInfo.profileUrl || "/images/mypage/profile.jpg");
        setIsEditing(false);
    }

    const handleProfileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileFile(file);
            setProfilePreview(URL.createObjectURL(file)); // 미리보기
        }
    };

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
            if (profileFile) formData.append("profile", profileFile);
            const res = await axios.post("/update", formData,
                {
                    headers: {
                        "Authorization": "Bearer " + localStorage.getItem("token"),
                        "Content-Type": "multipart/form-data"
                    },
                }
            );
            alert(res.data);
            setUserInfo({ ...userInfo, email, phoneNum, addr, profileUrl: profilePreview });
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
                        <div className='edit-contents'>
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
                        <span id='edit-info'>* 이름과 아이디 변경은 불가능합니다.</span>
                        <div className='edit-contents-box'>
                            <div className='edit-contents'>
                                <div>
                                    <span>이름 : {userInfo.name}</span>
                                </div>
                                <div>
                                    <span>아이디 : {userInfo.userId}</span>
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
                            <div>
                                <div className='edit-profile'>
                                    <p>프로필 사진</p>
                                    <img src={profilePreview} alt="프로필 미리보기" style={{ width: 120, height: 120, borderRadius: '50%', marginBottom: 15 }} /><br></br>
                                    <input type="file" accept="image/*" onChange={handleProfileChange} />
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