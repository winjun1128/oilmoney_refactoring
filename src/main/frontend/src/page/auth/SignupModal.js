import { useEffect, useState } from 'react';
import './Auth.css';
import axios from "axios";

function SignupModal({ isOpen, onClose, onSwitchToLogin }) {

    const [name, setName] = useState("");
    const [userid, setUserid] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [email, setEmail] = useState("");

    // 아이디 중복 확인 상태
    const [useridAvailable, setUseridAvailable] = useState(null); // null: 확인 전, true: 사용 가능, false: 사용 불가
    const [useridMsg, setUseridMsg] = useState("");

    // 이메일 인증 상태
    const [showVerification, setShowVerification] = useState(false);
    const [verificationCode, setVerificationCode] = useState(""); // 인증번호
    const [emailVerified, setEmailVerified] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [emailMsg, setEmailMsg] = useState("");
    const [emailMsgColor, setEmailMsgColor] = useState("red");

    // 약관동의
    const [allChecked, setAllChecked] = useState(false);
    const [termsChecked, setTermsChecked] = useState(false);
    const [privacyChecked, setPrivacyChecked] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName("");
            setUserid("");
            setPassword("");
            setConfirmPassword("");
            setEmail("");
            setUseridAvailable(null);
            setUseridMsg("");
            setShowVerification(false);
            setVerificationCode("");
            setEmailVerified(false);
            setTimeLeft(0);
            setEmailMsg("");
            setEmailMsgColor("red");
            setAllChecked(false);
            setTermsChecked(false);
            setPrivacyChecked(false);
        }
    }, [isOpen]);

    // 인증버튼 누른 후 나타나는 타이며
    useEffect(() => {
        let timer;
        if (timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [timeLeft]);

    // 아이디 중복 확인 처리
    const checkUserId = async ()=>{
        if(!userid){
            return setUseridMsg('아이디를 입력하세요.');
        }
        try{
            const checkId = await axios.post("/auth/check-userid", {userid});
            setUseridAvailable(checkId.data.available);
            
            if(checkId.data.available){
                setUseridMsg("사용 가능한 아이디입니다.");
            } else {
                setUseridMsg("이미 사용 중인 아이디입니다.");
            }
        } catch(error){
            console.log(error);
            alert("서버 오류가 발생했습니다.");
        }
    }

    // 이메일 인증 요청 확인
    const sendVertificationEmail = async ()=>{
        if(!email){
            return setEmailMsg("이메일을 입력하세요");
        }
        try{
            await axios.post("/auth/check-verification", {email});
            setShowVerification(true);
            setTimeLeft(300);
            setEmailMsg("인증번호가 이메일로 전송되었습니다.");
            setEmailMsgColor("green");
        } catch(error){
            console.log(error);
            setEmailMsg("이메일 발송에 실패했습니다.");
            setEmailMsgColor("red");
        }
    }

    const verifyCode = async ()=>{
        if(!verificationCode){
            return setEmailMsg("인증번호를 입력하세요.");
        }
        try {
            const checkCode = await axios.post("/auth/check-verifyCode", {email, code: verificationCode});
            if(checkCode.data.valid){
                setEmailVerified(true);
                setEmailMsg("인증되었습니다.");
                setEmailMsgColor("green");
            } else {
                setEmailMsg("인증번호가 일치하지 않습니다.");
                setEmailMsgColor("red");
            }
        } catch(error){
            console.log(error);
            setEmailMsg("서버 오류가 발생했습니다.");
            setEmailMsgColor("red");
        }
    }

    const handleSubmit = async(e)=>{
        e.preventDefault();

        if(!name) return alert("이름을 입력하세요.");
        if(!userid) return alert("아이디를 입력하세요.");
        if(!useridAvailable) return alert("아이디 중복 확인이 필요합니다.");
        if(!password || !confirmPassword) return alert("비밀번호를 입력하세요.");
        if(password !== confirmPassword) return alert("비밀번호가 일치하지 않습니다.");
        if(!email) return alert("이메일을 입력하세요.");
        if(!emailVerified) return alert("이메일 인증이 필요합니다.");
        if(!termsChecked || !privacyChecked) return alert("필수 약관에 동의해야 합니다.");

        try{
            const res = await axios.post("/auth/signup", {name, userid, password, email});
            if(res.data.success){
                alert("회원가입 완료!");
                onClose();
                onSwitchToLogin();
            } else {
                alert(res.data.message || "회원가입에 실패했습니다.");
            }
        } catch(error){
            console.log(error);
            alert("서버 오류가 발생했습니다.");
        }
    }

    const formatTime = (seconds) => {
        const m = String(Math.floor(seconds / 60)).padStart(2, "0");
        const s = String(seconds % 60).padStart(2, "0");
        return `${m}:${s}`;
    };

    const handleAllCheck = (e) => {
        const checked = e.target.checked;
        setAllChecked(checked);
        setTermsChecked(checked);
        setPrivacyChecked(checked);
    };

    useEffect(() => {
        if (termsChecked && privacyChecked) {
            setAllChecked(true);
        } else {
            setAllChecked(false);
        }
    }, [termsChecked, privacyChecked]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className='auth-modal-container' onClick={onClose}>
            <div className='auth-modal-content' onClick={(e) => e.stopPropagation()}>
                <h2>회원가입</h2>
                <form onSubmit={handleSubmit}>
                    <input type='text' className='auth-input' value={name} placeholder='이름' onChange={(e) => setName(e.target.value)}/>

                    <input type='text' className='auth-input' value={userid} placeholder='아이디' onChange={(e)=>setUserid(e.target.value)}/>
                    <button type="button" className='auth-confirm-button' onClick={checkUserId}>중복확인</button>

                    {useridMsg && (
                        <p style={{color: useridAvailable ? "green" : "red",
                                    fontSize: "13px",
                                    margin: "3px",
                                    width: "235px"
                        }}>{useridMsg}</p>)
                    }

                    <input type='password' className='auth-input' value={password} placeholder='비밀번호' onChange={(e) => setPassword(e.target.value)}/>
                    <input type='password' className='auth-input' value={confirmPassword} placeholder='비밀번호 확인' onChange={(e) => setConfirmPassword(e.target.value)}/>

                    <input type='email' className='auth-input' value={email} placeholder='이메일' onChange={(e) => setEmail(e.target.value)}/>
                    <button type="button" className='auth-confirm-button' onClick={sendVertificationEmail}>인증</button>
                    {emailMsg && (<p style={{color: emailMsgColor, 
                                            fontSize: "13px", 
                                            margin: "3px",
                                            width: "273px"
                        }}>{emailMsg}</p>)
                    }
                    {showVerification && !emailVerified && (
                        <div className="auth-verification-section">
                            <input type='text' className='auth-input' value={verificationCode} placeholder='인증번호 입력' disabled={timeLeft <= 0} />
                            <button type="button" className='auth-confirm-button' onClick={verifyCode}>확인</button>
                            <span className="auth-timer">{timeLeft > 0 ? formatTime(timeLeft) : "시간 만료"}</span>
                        </div>
                    )}

                    

                    <div className='auth-agreement-section'>
                        <label id='auth-agree-all' ><input type='checkbox' checked={allChecked} onChange={handleAllCheck} />전체선택</label>
                        <label><input type='checkbox' checked={termsChecked} onChange={(e) => setTermsChecked(e.target.checked)} />[필수] 서비스 이용약관 동의</label>
                        <label><input type='checkbox' checked={privacyChecked} onChange={(e) => setPrivacyChecked(e.target.checked)} />[필수] 개인정보 수집 및 이용 동의</label>
                    </div>

                    <button type='submit' className='auth-button'>회원가입 완료</button>

                </form>
                <div className="login-signup">
                    <span onClick={onSwitchToLogin}>이미 계정이 있으신가요? 로그인</span>
                </div>
            </div>
        </div>
    );
}

export default SignupModal;