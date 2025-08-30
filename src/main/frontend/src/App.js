import logo from './logo.svg';
import './App.css';
import React from "react";
import SideBar from './page/SideBar';
import Auth from './page/auth/Auth';
import MyPage from './page/mypage/MyPage';



function App() {
  // return <Page/>;
  return (
    <div>
      {/* <SideBar /> */}
      <Auth />
      <MyPage />;
    </div>
  );
}

export default App;
