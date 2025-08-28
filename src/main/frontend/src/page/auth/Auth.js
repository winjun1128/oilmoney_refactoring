import './Auth.css';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';

export default function Auth({ isLoginModalOpen, setIsLoginModalOpen, isSignUpModalOpen, setIsSignUpModalOpen, }) {
    return (
        <>
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                onSwitchToSignUp={() => {
                    setIsLoginModalOpen(false);
                    setIsSignUpModalOpen(true);
                }}
            />
            <SignupModal
                isOpen={isSignUpModalOpen}
                onClose={() => setIsSignUpModalOpen(false)}
                onSwitchToLogin={() => {
                    setIsSignUpModalOpen(false);
                    setIsLoginModalOpen(true);
                }}
            />
        </>
    );
}
