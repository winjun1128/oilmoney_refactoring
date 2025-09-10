import React, { useContext } from "react";
import { User } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGasPump, faChargingStation, faShare, faChartSimple } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { handleMyInfoClick } from "../utils/authHelpers";
import { UserContext } from "../contexts/UserContext";
import "../RouteSideBar.css";

export default function RouteSideBar({ isLogin, setIsLoginModalOpen }) {
    const navigate = useNavigate();
    const { userInfo } = useContext(UserContext);

    const itemsTop = [
        { icon: <FontAwesomeIcon icon={faGasPump} className="icon" />, label: "주유소", onClick: () => navigate("/") },
        { icon: <FontAwesomeIcon icon={faChargingStation} className="icon" />, label: "충전소", onClick: () => navigate("/") },
        { icon: <FontAwesomeIcon icon={faShare} className="icon" />, label: "목적지", onClick: () => navigate("/route") },
        { icon: <FontAwesomeIcon icon={faChartSimple} className="icon" />, label: "유가정보", onClick: () => navigate("/oilPrice") },
    ];

    return (
        <aside className="root-dock">
            {/* 위쪽 (로고 + 메뉴) */}
            <div className="root-dock__top">
                <div className="root-dock__logo">
                    <img src="/images/logo_square.png" alt="서비스 로고" />
                </div>

                <nav className="root-dock__nav">
                    {itemsTop.map((it, idx) => (
                        <DockButton
                            key={idx}
                            label={it.label}
                            onClick={it.onClick}
                            iconOverride={it.icon}   // ← 아이콘 전달
                        />
                    ))}
                </nav>
            </div>

            {/* 아래쪽 (내정보) */}
            <div className="root-dock__bottom">
                <DockButton
                    label={userInfo?.name ? `${userInfo.name}님` : "내정보"}
                    onClick={() => handleMyInfoClick({ isLogin, setIsLoginModalOpen, navigate })}
                    iconOverride={<User className="icon" aria-hidden />}
                />
            </div>
        </aside>
    );
}

function DockButton({ label, onClick, iconOverride }) {
    return (
        <button type="button" onClick={onClick} className="dock-item">
            <span className="icon-wrap">
                {iconOverride ?? <span className="icon" aria-hidden />}
            </span>
            <span className="label">{label}</span>
        </button>
    );
}
