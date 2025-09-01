import { useState } from 'react';
import './Auth.css';
import axios from 'axios';

function LoginModal({ isOpen, onClose, onSwitchToSignUp, setIsLogin, setUserInfo }) {

    const [userId, setUserId] = useState("");
    const [pw, setPw] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("/auth/login", { userId, pw });
            if (res.data.success) {
                // 토큰 저장
                localStorage.setItem("token", res.data.accessToken);
                setIsLogin(true);
                setUserInfo(res.data.userInfo);
                onClose();
                alert("로그인 성공!");
            } else {
                alert(res.data.message);
            }
        } catch (error) {
            console.log(error);
            alert("아이디 또는 비밀번호가 일치하지 않습니다.");
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className='auth-modal-container' onClick={onClose}>
            <div className='auth-modal-content' onClick={(e) => e.stopPropagation()}>
                <img src='/images/oilmoney_logo.png' alt='큰 로고' id="login-logo" />
                <form onSubmit={handleSubmit}>
                    <input type='text' className='auth-input' value={userId} placeholder='아이디' onChange={(e) => setUserId(e.target.value)} /><br />
                    <input type='password' className='auth-input' value={pw} placeholder='비밀번호' onChange={(e) => setPw(e.target.value)} /><br />
                    <button type='submit' className='auth-button'>로그인</button>
                </form>
                <div className='auth-sns-login'>
                    <div className='auth-login-text'>
                        <span>SNS 간편로그인</span>
                    </div>
                    <div className='auth-sns-icons'>
                        <img src='/images/login-icons/naver_icon.png' alt='네이버 로그인'></img>
                        <img src='/images/login-icons/kakao_icon.png' alt='카카오 로그인'></img>
                        <img src='/images/login-icons/google_icon.png' alt='구글 로그인'></img>
                        <img src='/images/login-icons/apple_icon.png' alt='애플 로그인'></img>
                    </div>
                </div>
                <div className='login-signup'>
                    <span onClick={onSwitchToSignUp}>아이디 찾기 |</span>
                    <span onClick={onSwitchToSignUp}>비밀번호 찾기 |</span>
                    <span onClick={onSwitchToSignUp}>회원가입 </span>
                </div>
            </div>
        </div>
    );
}

export default LoginModal;