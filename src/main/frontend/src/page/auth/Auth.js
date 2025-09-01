import { useState } from 'react';
import './Auth.css';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';
import MyPage from '../mypage/MyPage';

export default function Auth({ isLoginModalOpen, setIsLoginModalOpen, isSignUpModalOpen, setIsSignUpModalOpen, setIsLogin }) {

    const [userInfo, setUserInfo] = useState({});

    return (
        <>
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                onSwitchToSignUp={() => {
                    setIsLoginModalOpen(false);
                    setIsSignUpModalOpen(true);
                }}
                setIsLogin={setIsLogin}
                setUserInfo={setUserInfo} 
            />

            <SignupModal
                isOpen={isSignUpModalOpen}
                onClose={() => setIsSignUpModalOpen(false)}
                onSwitchToLogin={() => {
                    setIsSignUpModalOpen(false);
                    setIsLoginModalOpen(true);
                }}
            />
{/* 
            {userInfo && Object.keys(userInfo).length > 0 && (
                <MyPage userInfo={userInfo} setUserInfo={setUserInfo} setIsLogin={setIsLogin} />
            )} */}
            
        </>
    );
}
