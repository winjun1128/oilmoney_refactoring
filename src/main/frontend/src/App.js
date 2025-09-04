import { BrowserRouter, Routes, Route } from "react-router-dom";
import MyPageWrapper from "./page/mypage/MyPageWrapper.js";
import Page from './page/Page';
import RouteMapPage from './page/RouteMapPage';
import { useState } from "react";
import Auth from "./page/auth/Auth.js";
import OilPrice from "./page/OilPrice.js";



function App() {

  const [isLogin, setIsLogin] = useState(!!localStorage.getItem("token"));
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({});

  return (
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
        <Route path="/mypage" element={<MyPageWrapper isLogin={isLogin} setIsLoginModalOpen={setIsLoginModalOpen}
          setIsLogin={setIsLogin} />} />
        <Route path="/oilPrice" element={<OilPrice />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;