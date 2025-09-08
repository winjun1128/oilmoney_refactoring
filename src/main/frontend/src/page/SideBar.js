import React from "react";
import { User } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGasPump, faChargingStation, faShare, faChartSimple } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { handleMyInfoClick } from "./utils/authHelpers";
import "./SideBar.css";   // ✅ 외부 스타일 파일 연결

export default function SideBar({ onFilterChange, isLogin, setIsLoginModalOpen }) {
    const navigate = useNavigate();
    const itemsTop = [
        { icon: <FontAwesomeIcon icon={faGasPump} />, label: "주유소", action: () => onFilterChange(prev => prev === "oil" ? null : "oil") },
        { icon: <FontAwesomeIcon icon={faChargingStation} />, label: "충전소", action: () => onFilterChange(prev => prev === "charge" ? null : "charge") },
        { icon: <FontAwesomeIcon icon={faShare} />, label: "목적지", action: () => navigate("/route") },
        { icon: <FontAwesomeIcon icon={faChartSimple} />, label: "유가정보", action: () => navigate("/oilPrice") },
    ];

    return (
        <aside className="sidebar">
            {/* ✅ 위쪽 (로고 + 메뉴) */}
            <div className="sidebar-top">
                <div className="sidebar-logo">
                    <img src="/images/logo_square.png" alt="로고" />
                </div>

                <nav className="sidebar-menu">
                    {itemsTop.map((it, idx) => (
                        <DockButton key={idx} label={it.label} onClick={it.action}>
                            {it.icon}
                        </DockButton>
                    ))}
                </nav>
            </div>

            {/* ✅ 아래쪽 (내정보) */}
            <div className="sidebar-bottom">
                <DockButton label="내정보" onClick={() => handleMyInfoClick({ isLogin, setIsLoginModalOpen, navigate })}>
                    <User />
                </DockButton>
            </div>
        </aside>
    );
}

function DockButton({ children, label, onClick = () => { } }) {
    return (
        <button className="dock-btn" onClick={onClick}>
            <span className="dock-icon">{children}</span>
            <span className="dock-label">{label}</span>
        </button>
    );
}
