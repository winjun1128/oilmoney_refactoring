import { useEffect } from "react";

function LoginRequired({ setIsLoginModalOpen }) {
    useEffect(() => {
        // 한 번만 알림 + 모달 열기
        if (!sessionStorage.getItem("loginAlertShown")) {
            alert("로그인이 필요한 서비스입니다.");
            setIsLoginModalOpen(true);
            sessionStorage.setItem("loginAlertShown", "true");
        }
    }, [setIsLoginModalOpen]);

    return null;
}

export default LoginRequired;
