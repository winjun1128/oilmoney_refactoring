import React, { useState } from "react";
import SideBar from "./page/SideBar";
import FinalProject from "./FinalProject3/FinalProject";
import "./App.css";

export default function App() {
  const [showFinalProject, setShowFinalProject] = useState(false);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* 왼쪽 사이드바 */}
      <SideBar
        onSelect={(label) => {
          if (label === "유가정보") setShowFinalProject(true);
          else setShowFinalProject(false); // 다른 메뉴 클릭 시 숨김
        }}
      />

      {/* 오른쪽 구역 */}
      <div style={{ flex: 1, background: "#ffffff", position: "relative", overflow: "hidden" }}>
        <div className={`page-wrapper ${showFinalProject ? "active" : ""}`}>
          {showFinalProject && <FinalProject />}
        </div>
      </div>
    </div>
  );
}
