import logo from './logo.svg';
import './App.css';
import React from "react";
import SideBar from './page/SideBar';
import Auth from './page/auth/Auth';



function App() {
  // return <Page/>;
  return (
    <div>
      <SideBar />
      <Auth />
    </div>
  );
}

export default App;
