import { BrowserRouter, Routes, Route } from "react-router-dom";
import MyPageWrapper from "./page/mypage/MyPageWrapper.js";
import Page from './page/Page';
import RouteMapPage from './page/RouteMapPage';
import AfterRouteMapPage from "./page/AfterRouteMapPage.tsx";
import { useEffect, useState } from "react";
import Auth from "./page/auth/Auth.js";
import OilPrice from "./page/OilPrice.js";
import { UserContext } from "./page/contexts/UserContext.js";
import axios from "axios";
import KakaoCallback from "./page/auth/KakaoCallback.js";



function App() {

  const [isLogin, setIsLogin] = useState(!!localStorage.getItem("token"));
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios.get("/mypage", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setUserInfo(res.data.userInfo))
      .catch(err => {
        console.log(err);
        localStorage.removeItem("token");
        setUserInfo({});
      });
  }, []);

  return (
    <UserContext.Provider value={{ userInfo, setUserInfo }}>
      <BrowserRouter>
        <Auth
          isLoginModalOpen={isLoginModalOpen}
          setIsLoginModalOpen={setIsLoginModalOpen}
          isSignUpModalOpen={isSignUpModalOpen}
          setIsSignUpModalOpen={setIsSignUpModalOpen}
          setIsLogin={setIsLogin}
          setUserInfo={setUserInfo}
        />

        <Routes>
          <Route path="/" element={<Page isLogin={isLogin} setIsLoginModalOpen={setIsLoginModalOpen} />} />
          <Route path="/route" element={<RouteMapPage isLogin={isLogin} setIsLoginModalOpen={setIsLoginModalOpen} />} />
          {/* <Route path="/route" element={<AfterRouteMapPage isLogin={isLogin} setIsLoginModalOpen={setIsLoginModalOpen} />} /> */}
          <Route path="/mypage" element={<MyPageWrapper isLogin={isLogin} setIsLoginModalOpen={setIsLoginModalOpen}
            setIsLogin={setIsLogin} />} />
          <Route path="/oilPrice" element={<OilPrice isLogin={isLogin} setIsLoginModalOpen={setIsLoginModalOpen} />} />
          <Route
            path="/auth/login/oauth2/kakao"
            element={<KakaoCallback setIsLogin={setIsLogin} setUserInfo={setUserInfo} />}
          />
        </Routes>
      </BrowserRouter>
    </UserContext.Provider>
  );
}

export default App;