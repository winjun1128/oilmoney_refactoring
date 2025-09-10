import { useContext, useEffect, useState } from "react";
import MyPage from "../../page/mypage/MyPage";
import MyPageSideBar from "./MyPageSideBar";
import LoginModal from "../auth/LoginModal";
import { UserContext } from "../contexts/UserContext";
import axios from "axios";

export default function MyPageWrapper() {

    const token = localStorage.getItem("token");

    const { userInfo, setUserInfo } = useContext(UserContext);
    const [isLogin, setIsLogin] = useState(!!token);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    useEffect(() => {
        if (!isLogin) {
            setIsLoginModalOpen(true);
        }
    }, [isLogin, setIsLoginModalOpen]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        axios.get("/mypage", { headers: { Authorization: `Bearer ${token}` } })
            .then(res => setUserInfo(res.data.userInfo))
            .catch(err => console.error(err));
    }, [setUserInfo]);

    return (
        <div style={{ display: "flex", height: "100vh" }}>
            <div className="mypage-sidebar-wrapper">
                <MyPageSideBar isLogin={isLogin} setIsLoginModalOpen={setIsLoginModalOpen} />
            </div>

            {isLogin ? (
                <MyPage setIsLogin={setIsLogin} />
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
