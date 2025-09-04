import RouteMap from "../components/RouteMap";
import RouteSideBar from "./RouteSideBar";
import SideBar from "./RouteSideBar";

export default function App() {
    return (
        <div style={{ display: "flex", height: "100vh" }}>
            {/* 왼쪽 구역 */}
            <div style={{ width: "80px", background: "#f3f4f6", borderRight: "1px solid black" }}>
                <RouteSideBar/>
            </div>

            {/* 오른쪽 구역 */}
            <div style={{ flex: 1, background: "#ffffff", position: "relative" }}>
                <RouteMap/>
            </div>
        </div>
    );
}
