import { useEffect, useState } from "react";
import './MyPage.css';
import EditInfo from "./EditInfo";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function MyPage({ userInfo, setUserInfo, setIsLogin }) {

    const navigate = useNavigate();

    const [deletePw, setDeletePw] = useState("");
    const [deleteModal, setDeleteModal] = useState(false);


    const handleDeleteAccount = async () => {
        setDeleteModal(true);
    }

    const confirmDeleteAccount = async () => {
        try {
            const token = localStorage.getItem("token");
            console.log("[MyPage] 회원탈퇴 요청 - 입력 PW:", deletePw);

            const res = await axios.post("/auth/delete",
                null,
                {
                    params: { pw: deletePw },
                    headers: { "Authorization": "Bearer " + token }
                }
            );

            console.log("[MyPage] 서버 응답:", res.data);

            if (res.data.success) {
                alert("회원 탈퇴가 완료되었습니다.");
                localStorage.removeItem("token");
                //setIsLogin(false);
                window.location.href = "/";
            } else {
                alert(res.data.message);
                setDeletePw("");
            }

        } catch (error) {
            console.log(error);
            alert("탈퇴 중 오류가 발생했습니다.");
        }
    };

    const handleLogout = () => {
        if (window.confirm("정말 로그아웃하시겠습니까?")) {
            localStorage.removeItem("token");
            setIsLogin(false); // 상태로 처리
            navigate("/");
        }
    };

    return (
        <div style={{ display: "flex", height: "100vh" }}>
            <div style={{ flex: 1, background: "#ffffff", position: "relative" }}>
                <div className="mypage-container">
                    <div className="mypage-left">
                        <div className="mypage-left-profile">
                            <img src="/images/mypage/profile.jpg" alt="프로필 사진" className="mypage-profile-img" />
                            <span>{userInfo.name}</span>
                            <span>{userInfo.email}</span>
                        </div>
                        <div className="mypage-left-menu">
                            <span >🚘 등록 차량 수</span>
                            <span >⭐ 즐겨찾기</span>
                            <span >📝 내가 쓴 리뷰</span>
                        </div>
                        <div className="mypage-left-footer">
                            <span onClick={handleDeleteAccount}>회원탈퇴 </span>|<span onClick={handleLogout}> 로그아웃</span>
                        </div>
                    </div>

                    <div className="mypage-right">
                        <div>
                            <EditInfo userInfo={userInfo} setUserInfo={setUserInfo} />
                        </div>
                    </div>
                </div>
            </div>

            {deleteModal && (
                <div className="mypage-modal-overlay">
                    <div className="mypage-modal-content">
                        <h3>회원 탈퇴</h3>
                        <input
                            type="password"
                            value={deletePw}
                            className="mypage-modal-input"
                            onChange={(e) => setDeletePw(e.target.value)}
                            placeholder="비밀번호 입력"
                        />
                        <div className="mypage-modal-btns">
                            <button className="mypage-modal-btn" onClick={() => setDeleteModal(false)}>취소</button>
                            <button className="mypage-modal-btn" onClick={confirmDeleteAccount}>확인</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MyPage;