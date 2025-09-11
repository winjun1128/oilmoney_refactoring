import { useState, useEffect } from 'react';
import RouteSideBar from './RouteSideBar';
import PriceSideBar from "./PriceSideBar";

import OilDashboard from '.././FinalProject3/OilDashboard'
import '../App.css';

export default function OilPrice({ isLogin, setIsLoginModalOpen }) {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div>
            {/* 왼쪽 사이드바 */}
            <PriceSideBar isLogin={isLogin} setIsLoginModalOpen={setIsLoginModalOpen} />

            {/* 오른쪽 구역 */}
            <div
                style={{
                    flex: 1,
                    position: 'relative',
                    overflow: 'auto',
                    paddingBottom: windowWidth <= 768 ? '60px' : '0px', // 하단 사이드바 높이만큼 여백
                    marginLeft: windowWidth > 768 ? '80px' : '0px', // 화면 너비에 따라 margin 조절
                }}
            >
                <OilDashboard />
            </div>
        </div>
    );
}
