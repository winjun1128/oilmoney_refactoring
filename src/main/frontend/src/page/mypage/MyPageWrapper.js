import { useEffect, useState } from "react";
import MyPage from "../../page/mypage/MyPage";
import MyPageSideBar from "./MyPageSideBar";
import LoginModal from "../auth/LoginModal";

export default function MyPageWrapper() {

    const token = localStorage.getItem("token");

    const [isLogin, setIsLogin] = useState(!!token);
    const [userInfo, setUserInfo] = useState({});
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    useEffect(() => {
        if (!isLogin) {
            setIsLoginModalOpen(true);
        }
    }, [isLogin, setIsLoginModalOpen]);

    return (
        <div style={{ display: "flex", height: "100vh" }}>
            <div style={{ width: "80px", background: "#f3f4f6", borderRight: "1px solid black" }}>
                <MyPageSideBar isLogin={isLogin} setIsLoginModalOpen={setIsLoginModalOpen}  userInfo={userInfo} setUserInfo={setUserInfo}/>
            </div>

            {isLogin ? (
                <MyPage userInfo={userInfo} setUserInfo={setUserInfo} setIsLogin={setIsLogin} />
            ) : (
                <LoginModal
                    isOpen={isLoginModalOpen}
                    onClose={() => setIsLoginModalOpen(false)}
                    setIsLogin={setIsLogin}
                    setUserInfo={setUserInfo}
                />
            )}
        </div>
    );
}
