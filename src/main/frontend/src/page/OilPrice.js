import React, { useState } from "react";
import PriceSideBar from './PriceSideBar';
import FinalProject from '../FinalProject3/FinalProject';
import '../App.css';

export default function OilPrice({ isLogin, setIsLoginModalOpen }) {
    const [showFinalProject, setShowFinalProject] = useState(true);

    return (
        <div>
            {/* 왼쪽 사이드바 */}
            <PriceSideBar isLogin={isLogin} setIsLoginModalOpen={setIsLoginModalOpen}
            />

            {/* 오른쪽 구역 */}
            <div style={{flex:1, position: 'relative',  overflow: 'auto', marginLeft: '80px'}}>
            <FinalProject
            />
            </div>
        </div>
    );
}