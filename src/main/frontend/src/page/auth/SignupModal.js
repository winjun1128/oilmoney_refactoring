import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';   // ✅ 추가
import './Auth.css';
import axios from "axios";

/** 약관 전문 (원하는 내용으로 교체 가능) */
const TERMS_TEXT = `
[서비스 이용약관 요약]
1. 목적: 서비스 제공 및 회원의 이용조건을 정합니다.
2. 회원가입: 정확한 정보 제공 및 변경사항 갱신 의무가 있습니다.
3. 서비스: 시스템 점검 등으로 일시 중지될 수 있습니다.
4. 금지행위: 타인 개인정보 도용, 불법적인 사용 등은 금지됩니다.
5. 책임: 고의/중과실을 제외하고 서비스 장애에 대한 책임은 제한될 수 있습니다.
6. 기타: 약관 변경 시 공지 후 적용됩니다.
`;

const PRIVACY_TEXT = `
[개인정보 수집 및 이용 동의 요약]
1. 수집항목: 아이디, 비밀번호, 이름, 이메일 등.
2. 이용목적: 회원관리, 본인확인, 서비스 제공 및 공지.
3. 보유기간: 회원 탈퇴 시 또는 관련 법령에 따른 기간 동안 보관.
4. 동의 거부 권리: 동의 거부 시 회원가입 및 서비스 이용이 제한될 수 있습니다.
`;

function TermsModal({ open, title, content, onClose }) {
  const [mounted, setMounted] = useState(false);

  // 클라이언트 마운트 이후에만 포털 렌더
  useEffect(() => { setMounted(true); }, []);

  // 스크롤 잠금 + 가로 밀림 보정
  useEffect(() => {
    if (!open || !mounted) return;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      document.removeEventListener('keydown', onEsc);
    };
  }, [open, mounted, onClose]);

  if (!open || !mounted) return null;           // ✅ 서버/초기 렌더에서 document 미접근

  return createPortal(
    <div className="terms-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="terms-modal" onClick={(e) => e.stopPropagation()}>
        <div className="terms-header">
          <h3>{title}</h3>
          <button type="button" className="terms-close" onClick={onClose} aria-label="닫기">×</button>
        </div>
        <div className="terms-body">
          <pre className="terms-pre">{content}</pre>
        </div>
        <div className="terms-footer">
          <button type="button" className="auth-button" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function SignupModal({ isOpen, onClose, onSwitchToLogin }) {

    const [name, setName] = useState("");
    const [userid, setUserid] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [email, setEmail] = useState("");

    // 아이디 중복 확인 상태
    const [useridAvailable, setUseridAvailable] = useState(null);
    const [useridMsg, setUseridMsg] = useState("");

    // 이메일 인증 상태
    const [showVerification, setShowVerification] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");
    const [emailVerified, setEmailVerified] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [emailMsg, setEmailMsg] = useState("");
    const [emailMsgColor, setEmailMsgColor] = useState("red");

    // 약관동의
    const [allChecked, setAllChecked] = useState(false);
    const [termsChecked, setTermsChecked] = useState(false);
    const [privacyChecked, setPrivacyChecked] = useState(false);

    // 약관보기 모달
    const [termsOpen, setTermsOpen] = useState(false);
    const [termsKind, setTermsKind] = useState(null); // 'service' | 'privacy'
    const openTerms = (kind) => { setTermsKind(kind); setTermsOpen(true); };
    const closeTerms = () => setTermsOpen(false);

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

    // 인증 타이머
    useEffect(() => {
        let timer;
        if (timeLeft > 0) {
            timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [timeLeft]);

    // 아이디 중복 확인
    const checkUserId = async () => {
        if (!userid) return setUseridMsg('아이디를 입력하세요.');
        try {
            const checkId = await axios.post("/auth/check-userid", { userId: userid });
            setUseridAvailable(checkId.data);
            setUseridMsg(checkId.data ? "사용 가능한 아이디입니다." : "이미 사용 중인 아이디입니다.");
        } catch (e) {
            console.log(e);
            alert("서버 오류가 발생했습니다.");
        }
    };

    // 이메일 인증 요청
    const sendVertificationEmail = async () => {
        if (!email) return setEmailMsg("이메일을 입력하세요");
        try {
            await axios.post("/auth/send-email", { email });
            setShowVerification(true);
            setTimeLeft(300);
            setEmailMsg("인증번호가 이메일로 전송되었습니다.");
            setEmailMsgColor("green");
        } catch (e) {
            console.log(e);
            setEmailMsg("이메일 발송에 실패했습니다.");
            setEmailMsgColor("red");
        }
    };

    const verifyCode = async () => {
        if (!verificationCode) return setEmailMsg("인증번호를 입력하세요.");
        try {
            const checkCode = await axios.post("/auth/verify-code", { email, code: verificationCode });
            if (checkCode.data.valid) {
                setEmailVerified(true);
                setEmailMsg("인증되었습니다.");
                setEmailMsgColor("green");
            } else {
                setEmailMsg("인증번호가 일치하지 않습니다.");
                setEmailMsgColor("red");
            }
        } catch (e) {
            console.log(e);
            setEmailMsg("서버 오류가 발생했습니다.");
            setEmailMsgColor("red");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name) return alert("이름을 입력하세요.");
        if (!userid) return alert("아이디를 입력하세요.");
        if (!useridAvailable) return alert("아이디 중복 확인이 필요합니다.");
        if (!password || !confirmPassword) return alert("비밀번호를 입력하세요.");
        if (password !== confirmPassword) return alert("비밀번호가 일치하지 않습니다.");
        if (!email) return alert("이메일을 입력하세요.");
        if (!emailVerified) return alert("이메일 인증이 필요합니다.");
        if (!termsChecked || !privacyChecked) return alert("필수 약관에 동의해야 합니다.");

        try {
            const res = await axios.post("/auth/signup", {
                userId: userid, pw: password, email, name
            });
            if (res.data.success) {
                alert(res.data.message);
                onClose();
                onSwitchToLogin();
            } else {
                alert(res.data.message || "회원가입에 실패했습니다.");
            }
        } catch (e) {
            console.error(e);
            alert("서버 오류가 발생했습니다.");
        }
    };

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
        setAllChecked(termsChecked && privacyChecked);
    }, [termsChecked, privacyChecked]);

    if (!isOpen) return null;

    return (
        <div className='auth-modal-container' onClick={onClose}>
            <div className='auth-modal-content' onClick={(e) => e.stopPropagation()}>
                <h2>회원가입</h2>
                <form onSubmit={handleSubmit} className="auth-form">
                    <input type='text' className='auth-input2' value={name} placeholder='이름'
                        onChange={(e) => setName(e.target.value)} />

                    <div className="auth-inline">
                        <input type='text' className='auth-input2' value={userid} placeholder='아이디'
                            onChange={(e) => setUserid(e.target.value)} />
                        <button type="button" className='auth-confirm-button' onClick={checkUserId}>중복확인</button>
                    </div>

                    {useridMsg && (
                        <p style={{ color: useridAvailable ? "green" : "red", fontSize: 13, margin: 3 }}>{useridMsg}</p>
                    )}

                    <input type='password' className='auth-input2' value={password} placeholder='비밀번호'
                        onChange={(e) => setPassword(e.target.value)} />
                    <input type='password' className='auth-input2' value={confirmPassword} placeholder='비밀번호 확인'
                        onChange={(e) => setConfirmPassword(e.target.value)} />

                    <div className="auth-inline">
                        <input type='email' className='auth-input2' value={email} placeholder='이메일'
                            onChange={(e) => setEmail(e.target.value)} />
                        <button type="button" className='auth-confirm-button' onClick={sendVertificationEmail}>인증</button>
                    </div>

                    {emailMsg && (
                        <p style={{ color: emailMsgColor, fontSize: 13, margin: 3 }}>{emailMsg}</p>
                    )}

                    {showVerification && !emailVerified && (
                        <div className="auth-verification-section">
                            <input type='text' className='auth-input2' value={verificationCode} placeholder='인증번호 입력'
                                onChange={(e) => setVerificationCode(e.target.value)} />
                            <button type="button" className='auth-confirm-button' onClick={verifyCode}>확인</button>
                            <span className="auth-timer">{timeLeft > 0 ? formatTime(timeLeft) : "시간 만료"}</span>
                        </div>
                    )}

                    {/* 약관 동의 */}
                    <div className='auth-agreement-section'>
                        <label id='auth-agree-all'>
                            <input type='checkbox' checked={allChecked} onChange={handleAllCheck} />
                            &nbsp;&nbsp;전체선택
                        </label>

                        <div className="agree-item">
                            <label>
                                <input type='checkbox' checked={termsChecked}
                                    onChange={(e) => setTermsChecked(e.target.checked)} />
                                &nbsp;&nbsp;[필수] 서비스 이용약관 동의
                            </label>
                            <button type="button" className="auth-link-button" onClick={() => openTerms('service')}>
                                약관보기
                            </button>
                        </div>

                        <div className="agree-item">
                            <label>
                                <input type='checkbox' checked={privacyChecked}
                                    onChange={(e) => setPrivacyChecked(e.target.checked)} />
                                &nbsp;&nbsp;[필수] 개인정보 수집 및 이용 동의
                            </label>
                            <button type="button" className="auth-link-button" onClick={() => openTerms('privacy')}>
                                약관보기
                            </button>
                        </div>
                    </div>

                    <button type='submit' className='auth-button2'>회원가입 완료</button>
                </form>

                <div className="login-signup">
                    <span onClick={onSwitchToLogin}>이미 계정이 있으신가요? 로그인</span>
                </div>
            </div>

            {/* 약관 모달 */}
            <TermsModal
                open={termsOpen}
                title={termsKind === 'privacy' ? '개인정보 수집 및 이용 동의' : '서비스 이용약관'}
                content={termsKind === 'privacy' ? PRIVACY_TEXT : TERMS_TEXT}
                onClose={closeTerms}
            />
        </div>
    );
}

export default SignupModal;
