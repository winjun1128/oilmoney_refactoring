import logo from './logo.svg';
import './App.css';
import React, { useState } from "react";
import SideBar from './page/SideBar';
import Auth from './page/auth/Auth';
import MyPage from './page/mypage/MyPage';


function App() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [userInfo, setUserInfo] = useState({});

  return (
    <div>
      <SideBar
        isLogin={isLogin}
        setIsLoginModalOpen={setIsLoginModalOpen}
      />
      <Auth
        isLoginModalOpen={isLoginModalOpen}
        setIsLoginModalOpen={setIsLoginModalOpen}
        isSignUpModalOpen={isSignUpModalOpen}
        setIsSignUpModalOpen={setIsSignUpModalOpen}
        setIsLogin={setIsLogin}
        setUserInfo={setUserInfo}
      />
      <MyPage
        setIsLoginModalOpen={setIsLoginModalOpen}
        userInfo={userInfo}
        setUserInfo={setUserInfo}
      />
    </div>
  );
}

export default App;
