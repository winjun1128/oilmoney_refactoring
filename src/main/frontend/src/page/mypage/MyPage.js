import { useEffect, useState } from "react";
import SideBar from "../SideBar";
import './MyPage.css';
import EditInfo from "./EditInfo";
import axios from "axios";

function MyPage() {

    const [userInfo, setUserInfo] = useState({});
    const [selectMenu, setSelectMenu] = useState("");
    const [isPwAuth, setIsPwAuth] = useState(false);
    const [pw, setPw] = useState("");
    const [checkPwModal, setCheckPwModel] = useState(false);
    const [deletePw, setDeletePw] = useState("");
    const [deleteModal, setDeleteModal] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            return;
        }
        axios.get("/mypage", {
            headers: { "Authorization": "Bearer " + token }
        })
            .then(response => setUserInfo(response.data))
            .catch(error => console.log(error));
    }, [setUserInfo]);

    const handlePwCheck = () => {
        if (pw === userInfo.pw) {
            setIsPwAuth(true);
            setCheckPwModel(false);
            setPw("");
            setSelectMenu("editInfo");
        } else {
            alert("비밀번호가 일치하지 않습니다.");
            setPw("");
        }
    }

    const handleMenuClick = (menu) => {
        if (menu === "editInfo" && !isPwAuth) {
            setCheckPwModel(true);
        } else {
            setSelectMenu(menu);
        }
    }

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

        if(res.data.success){
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
            //setIsLogin(false);
            window.location.href = "/";
        }
    };

    return (
        <div style={{ display: "flex", height: "100vh" }}>
            <div style={{ width: "80px", background: "#f3f4f6", borderRight: "1px solid black" }}>
                <SideBar />
            </div>

            <div style={{ flex: 1, background: "#ffffff", position: "relative" }}>
                <div className="mypage-container">
                    <div className="mypage-left">
                        <div className="mypage-left-profile">
                            <img src="/images/mypage/profile.jpg" alt="프로필 사진" className="mypage-profile-img" />
                            <span>{userInfo.name}</span>
                            <span>{userInfo.email}</span>
                        </div>
                        <div className="mypage-left-menu">
                            <span onClick={() => handleMenuClick("car")}>내 차 등록/관리</span>
                            <span onClick={() => handleMenuClick("favorite")}>즐겨찾기</span>
                            <span onClick={() => handleMenuClick("review")}>내가 쓴 리뷰</span>
                            <span onClick={() => handleMenuClick("editInfo")}>개인정보 수정</span>
                        </div>
                        <div className="mypage-left-footer">
                            <span onClick={handleDeleteAccount}>탈퇴하기 </span>|<span onClick={handleLogout}> 로그아웃</span>
                        </div>
                    </div>

                    <div className="mypage-right">
                        {selectMenu === "car" && <div>내차등록</div>}
                        {selectMenu === "favorite" && <div>즐겨찾기</div>}
                        {selectMenu === "review" && <div>내가 쓴 리뷰</div>}
                        {selectMenu === "editInfo" && isPwAuth && (
                            <div>
                                <EditInfo userInfo={userInfo} setUserInfo={setUserInfo} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {checkPwModal && (
                <div className="mypage-modal-overlay">
                    <div className="mypage-modal-content">
                        <h3>비밀번호 확인</h3>
                        <input
                            type="password"
                            value={pw}
                            className="mypage-modal-input"
                            onChange={(e) => setPw(e.target.value)}
                            placeholder="현재 비밀번호 입력"
                        />
                        <div className="mypage-modal-btns">
                            <button className="mypage-modal-btn" onClick={() => { setCheckPwModel(false) }}>취소</button>
                            <button className="mypage-modal-btn" onClick={handlePwCheck}>확인</button>
                        </div>
                    </div>
                </div>
            )}

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