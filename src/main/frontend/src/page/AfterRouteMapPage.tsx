// src/main/frontend/src/page/RouteMapPage.tsx
import React from "react";
import RouteMap from "../components/RouteMap";     // <- RouteMap.tsx 의 default export
import RouteSideBar from "./RouteSideBar";         // 중복 import 제거
import AfterRouteMap from "../components/AfterRouteMap";

type Props = {
  isLogin: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
};

const RouteMapPage: React.FC<Props> = ({ isLogin, setIsLoginModalOpen }) => {
  return (
    <div className="layout">
      <aside className="app-nav">
        <RouteSideBar
          isLogin={isLogin}
          setIsLoginModalOpen={setIsLoginModalOpen}
        />
      </aside>

      <main className="app-main">
        <AfterRouteMap/>
      </main>
    </div>
  );
};

export default RouteMapPage;
