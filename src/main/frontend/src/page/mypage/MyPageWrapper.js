import { useEffect, useState } from "react";
import MyPage from "../../page/mypage/MyPage";
import SideBar from "../SideBar";
import Auth from "../auth/Auth";
import LoginRequired from "../auth/LoginRequired";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import MyPageSideBar from "./MyPageSideBar";

export default function MyPageWrapper() {
    const navigate = useNavigate();

    const token = localStorage.getItem("token");

    const [isLogin, setIsLogin] = useState(!!token);
    const [userInfo, setUserInfo] = useState({});
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);

    useEffect(() => {
        if (!token) {
            setIsLogin(false);
            //alert("로그인이 필요합니다.");
            setIsLoginModalOpen(true);

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
                alert("로그인이 필요합니다.");
                setIsLoginModalOpen(true);

            });
    }, [token, navigate]);


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
                <LoginRequired setIsLoginModalOpen={setIsLoginModalOpen} />
            )}
        </div>
    );
}
