import './Auth.css';

function LoginModal({ isOpen, onClose, onSwitchToSignUp }) {

    if (!isOpen) {
        return null;
    }

    return (
        <div className='auth-modal-container' onClick={onClose}>
            <div className='auth-modal-content' onClick={(e) => e.stopPropagation()}>
                <img src='/images/oilmoney_logo.png' alt='큰 로고' id="login-logo" />
                <form>
                    <input type='text' className='auth-input' placeholder='아이디' /><br />
                    <input type='password' className='auth-input' placeholder='비밀번호' /><br />
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