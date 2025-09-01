import { useEffect, useState } from "react";
import MyPage from "../../page/mypage/MyPage";
import SideBar from "../SideBar";
import Auth from "../auth/Auth";
import LoginRequired from "../auth/LoginRequired";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function MyPageWrapper() {
    const token = localStorage.getItem("token");
    const [isLogin, setIsLogin] = useState(!!token);
    const [userInfo, setUserInfo] = useState({});
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);

    const navigate = useNavigate();

    // 새로고침 시 토큰 체크 및 유저 정보 fetch
    useEffect(() => {
        if (!token) {
            setIsLogin(false);
            return;
        }

        axios.get("/mypage", { headers: { "Authorization": "Bearer " + token } })
            .then(res => {
                setUserInfo(res.data);
                setIsLogin(true);
            })
            .catch(err => {
                console.log(err);
                setIsLogin(false);
                localStorage.removeItem("token");
                navigate("/");
            });
    }, [token, navigate]);


    return (
        <div>
            <SideBar isLogin={isLogin} setIsLoginModalOpen={setIsLoginModalOpen} />

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
                <LoginRequired setIsLoginModalOpen={setIsLoginModalOpen} />
            )}
        </div>
    );
}
