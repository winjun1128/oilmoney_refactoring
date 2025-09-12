import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

function KakaoCallback({ setIsLogin, setUserInfo }) {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const code = query.get("code"); // 카카오가 보내준 code

        if (code) {
            // 백으로 code 보내 access token 발급 후 JWT 받아오기
            axios.post("/auth/login/oauth2/kakao", { code })
                .then(res => {
                    if(res.data.success){
                        localStorage.setItem("token", res.data.accessToken);
                        setIsLogin(true);
                        setUserInfo(res.data.userInfo);
                        navigate("/mypage");
                    } else {
                        alert("에러입니다"+res.data.message);
                    }
                })
                .catch(err => {
                    console.error(err);
                    alert("카카오 로그인 실패");
                });
        }
    }, [location, navigate, setIsLogin, setUserInfo]);

    return <div>카카오 로그인 처리 중...</div>;
}

export default KakaoCallback;
