import RouteMap from "../components/RouteMap";
import RouteSideBar from "./RouteSideBar";
import SideBar from "./RouteSideBar";
// RouteMapPage.jsx
export default function RouteMapPage({ isLogin, setIsLoginModalOpen }) {
  return (
    <div className="layout">
      <aside className="app-nav">
        <RouteSideBar isLogin={isLogin} setIsLoginModalOpen={setIsLoginModalOpen}/>
      </aside>

      <main className="app-main">
        <RouteMap/>
      </main>
    </div>
  );
}

