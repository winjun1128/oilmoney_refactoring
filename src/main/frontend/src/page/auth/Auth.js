import { useState } from 'react';
import SideBar from '../SideBar';
import './Auth.css';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';
import FindIdModal from './FindIdModal';
import FindPwModal from './FindPwModal';

export default function Auth({ isLoginModalOpen, setIsLoginModalOpen, isSignUpModalOpen, setIsSignUpModalOpen, setIsLogin, setUserInfo }) {

    const [isFindIdModalOpen, setIsFindIdModalOpen] = useState(false);
    const [isFindPwModalOpen, setIsFindPwModalOpen] = useState(false);

    return (
        <>
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                onSwitchToSignUp={() => {
                    setIsLoginModalOpen(false);
                    setIsSignUpModalOpen(true);
                }}
                onSwitchToFindId={() => {
                    setIsLoginModalOpen(false);
                    setIsFindIdModalOpen(true);
                }}
                onSwitchToFindPw={() => {
                    setIsLoginModalOpen(false);
                    setIsFindPwModalOpen(true);
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

            <FindIdModal
                isOpen={isFindIdModalOpen}
                onClose={() => setIsFindIdModalOpen(false)}
                onSwitchToFindPw={() => {
                    setIsFindIdModalOpen(false);
                    setIsFindPwModalOpen(true);
                }}
                onSwitchToLogin={() => {
                    setIsFindIdModalOpen(false);
                    setIsLoginModalOpen(true);
                }}
                onSwitchToSignUp={() => {
                    setIsFindIdModalOpen(false);
                    setIsSignUpModalOpen(true);
                }}
            />

            <FindPwModal
                isOpen={isFindPwModalOpen}
                onClose={() => setIsFindPwModalOpen(false)}
                onSwitchToFindId={() => {
                    setIsFindPwModalOpen(false);
                    setIsFindIdModalOpen(true);
                }}
                onSwitchToLogin={() => {
                    setIsFindPwModalOpen(false);
                    setIsLoginModalOpen(true);
                }}
                onSwitchToSignUp={() => {
                    setIsFindPwModalOpen(false);
                    setIsSignUpModalOpen(true);
                }}
            />
        </>
    );
}
