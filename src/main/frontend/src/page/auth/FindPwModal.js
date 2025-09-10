import { useState } from 'react';
import './Auth.css';
import axios from 'axios';

function FindPwModal({ isOpen, onClose, onSwitchToFindId, onSwitchToLogin, onSwitchToSignUp }) {
    const [userId, setUserId] = useState("");
    const [email, setEmail] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("/auth/find-pw", { userId, email });
            if (res.data.success) {
                alert("임시 비밀번호가 이메일로 발송되었습니다.");
                onClose();
            } else {
                alert(res.data.message);
            }
        } catch (err) {
            console.log(err);
            alert("비밀번호 찾기 실패");
        }
    }

    if (!isOpen) return null;

    return (
        <div className='auth-modal-container' onClick={onClose}>
            <div className='auth-modal-content' onClick={e => e.stopPropagation()}>
                <img src='/images/oilmoney_logo.png' alt='로고' id="login-logo" />
                <h3>비밀번호 찾기</h3>
                <form onSubmit={handleSubmit}>
                    <input type="text" className='auth-input' value={userId} placeholder="아이디" onChange={(e) => setUserId(e.target.value)} />
                    <input type="email" className='auth-input' value={email} placeholder="가입된 이메일" onChange={(e) => setEmail(e.target.value)} />
                    <button type="submit" className='auth-button'>비밀번호 찾기</button>
                </form>
                <div className='login-signup'>
                    <span onClick={onSwitchToFindId}>아이디 찾기 |</span>
                    <span onClick={onSwitchToLogin}>로그인 |</span>
                    <span onClick={onSwitchToSignUp}>회원가입 </span>
                </div>
            </div>
        </div>
    )
}

export default FindPwModal;
