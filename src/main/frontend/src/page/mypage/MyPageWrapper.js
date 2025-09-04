import { useState } from "react";
import MyPage from "../../page/mypage/MyPage";
import Auth from "../auth/Auth";
import LoginRequired from "../auth/LoginRequired";
import MyPageSideBar from "./MyPageSideBar";

export default function MyPageWrapper() {

    const token = localStorage.getItem("token");

    const [isLogin, setIsLogin] = useState(!!token);
    const [userInfo, setUserInfo] = useState({});
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);

    return (
        <div style={{ display: "flex", height: "100vh" }}>
            <div style={{ width: "80px", background: "#f3f4f6", borderRight: "1px solid black" }}>
                <MyPageSideBar isLogin={isLogin} setIsLoginModalOpen={setIsLoginModalOpen} />
            </div>

            <Auth
                isLoginModalOpen={isLoginModalOpen}
                setIsLoginModalOpen={setIsLoginModalOpen}
                isSignUpModalOpen={isSignUpModalOpen}
                setIsSignUpModalOpen={setIsSignUpModalOpen}
                setIsLogin={setIsLogin}
                setUserInfo={setUserInfo}
            />

            {isLogin ? (
                <MyPage
                    userInfo={userInfo}
                    setUserInfo={setUserInfo}
                    setIsLogin={setIsLogin}
                />
            ) : (
                <MyPageSideBar setIsLoginModalOpen={setIsLoginModalOpen} />
            )}
        </div>
    );
}
