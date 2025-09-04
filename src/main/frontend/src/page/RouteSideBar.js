import React from "react";
import { User } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGasPump, faChargingStation, faShare, faChartSimple} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom"; 
import { handleMyInfoClick } from "./utils/authHelpers";

export default function RouteSideBar({ isLogin, setIsLoginModalOpen }) {
    const navigate = useNavigate();   // ✅ 훅 선언
    const itemsTop = [
        { icon: <FontAwesomeIcon icon={faGasPump} style={{ fontSize: "24px" }} />, label: "주유소", onClick: ()=> navigate("/") },
        { icon: <FontAwesomeIcon icon={faChargingStation} style={{ fontSize: "24px" }} />, label: "충전소" , onClick: ()=> navigate("/")},
        { icon: <FontAwesomeIcon icon={faShare} style={{ fontSize: "24px" }} />, label: "목적지",onClick: () => window.dispatchEvent(new CustomEvent("ui:toggleFilters")) },
        { icon: <FontAwesomeIcon icon={faChartSimple} style={{ fontSize: "24px" }} />, label: "유가정보" ,onClick: ()=> navigate("/oilPrice")},
    ];

    return (
        <aside
            style={{
                position: "fixed",
                left: 0,
                top: 0,
                zIndex: 40,
                width: 80,
                height: "100vh",
                borderRight: "1px solid #e5e7eb", // gray-200
                backgroundColor: "#ffffff",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* ─── 위쪽 (로고 + 메뉴) ─── */}
            <div
                style={{
                    display: "flex",
                    width: "100%",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <div
                    style={{
                        width: 80,
                        height: 80,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        marginTop: 10,
                        marginBottom: 30
                    }}
                >
                    <img
                        src="/images/logo_square.png"
                        alt="로고"
                        style={{
                            width: "80px",
                            height: "80px",
                            objectFit: "contain",
                            display: "block",
                        }}
                    />
                </div>

                <nav
                    style={{
                        marginTop: "0.5rem",
                        display: "flex",
                        width: "100%",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.5rem",
                    }}
                >
                    {/* 토글추가 */}
                    {itemsTop.map((it, idx) => (
                        <DockButton key={idx} label={it.label} onClick={it.onClick}>
                            {it.icon}
                        </DockButton>
                    ))}
                </nav>
            </div>

            {/* ─── 아래쪽 (내정보: mt-auto로 바닥에 고정) ─── */}
            <div
                style={{
                    marginTop: "auto",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <DockButton label="내정보" onClick={() => handleMyInfoClick({ isLogin, setIsLoginModalOpen, navigate })}>
                    <User style={{ width: "1.75rem", height: "1.75rem" }} />
                </DockButton>
            </div>
        </aside>
    );
}
//버튼연결
function DockButton({ children, label,onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}   //버튼에 연결
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                paddingTop: "1.5rem",
                paddingBottom: "1.5rem",
                color: "#1f2937",
                background: "none",
                border: "none",
                outline: "none",
                cursor: "pointer",
                transition: "color 0.2s, background-color 0.2s",
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.color = "#2563eb";
                e.currentTarget.style.backgroundColor = "#eff6ff";
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.color = "#1f2937";
                e.currentTarget.style.backgroundColor = "transparent";
            }}
        >
            <span style={{ fontSize: "15px", lineHeight: "1.75rem" }}>{children}</span>
            <span style={{ fontSize: "15px", marginTop: "0.25rem", textAlign: "center" }}>{label}</span>
        </button>
    );
}
