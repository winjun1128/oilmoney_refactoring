import { useEffect, useState } from "react";
import './MyPage.css';
import EditInfo from "./EditInfo";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CarRegist from "./CarRegist";
import ReviewList from "./ReviewList";
import FavList from "./FavList";

function MyPage({ userInfo, setUserInfo, setIsLogin, setIsLoginModalOpen }) {

    const navigate = useNavigate();

    const token = localStorage.getItem("token");

    const [deletePw, setDeletePw] = useState("");
    const [deleteModal, setDeleteModal] = useState(false);

    const [cars, setCars] = useState([]);
    const [carCount, setCarCount] = useState(0);
    const [favCount, setFavCount] = useState(0);
    const [reviewCount, serReviewCount] = useState(0);
    const [favStations, setFavStations] = useState([]);

    useEffect(() => {
        if (!token) {
            setIsLogin(false);
            setIsLoginModalOpen(true);
            return;
        }

        axios.get("/mypage", { headers: { "Authorization": "Bearer " + token } })
            .then(res => {
                setUserInfo(res.data.userInfo);
                setCarCount(res.data.carCount)
                setFavCount(res.data.favCount);
                serReviewCount(res.data.reviewCount);
                setCars(res.data.cars || []);
                setFavStations(res.data.stationInfo || []);
                setIsLogin(true);
            })
            .catch(err => {
                console.log(err);
                setIsLogin(false);
                localStorage.removeItem("token");
                setIsLoginModalOpen(true);
            });
    }, [token, navigate]);

    const handleDeleteAccount = async () => {
        setDeleteModal(true);
    }

    const confirmDeleteAccount = async () => {
        try {
            const token = localStorage.getItem("token");

            const res = await axios.post("/auth/delete",
                null,
                {
                    params: { pw: deletePw },
                    headers: { "Authorization": "Bearer " + token }
                }
            );
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
            setIsLogin(false);
            navigate("/");
        }
    };

    return (
        <div>
            <div className="mypage-container">
                <div className="mypage-left">
                    <div className="mypage-left-profile">
                        <img src={userInfo.profileUrl ? userInfo.profileUrl : "/images/mypage/profile.jpg"} alt="프로필 사진" className="mypage-profile-img" />
                        <span>{userInfo.name}</span>
                        <span>{userInfo.email}</span>
                    </div>
                    <div className="mypage-left-menu">
                        <div className="mypage-menu-tabs">
                            <img src="/images/mypage/car_color.png" alt="차" />
                            <div className="mypage-menu-tab">
                                <span>등록 차량 수</span>
                                <span className="mypage-count">{carCount}</span>
                            </div>
                        </div>
                        <div className="mypage-menu-tabs">
                            <img src="/images/mypage/star_color.png" alt="별" />
                            <div className="mypage-menu-tab">
                                <span>즐겨찾기</span>
                                <span className="mypage-count">{favCount}</span>
                            </div>
                        </div>
                        <div className="mypage-menu-tabs">
                            <img src="/images/mypage/pencil_color.png" alt="연필" />
                            <div className="mypage-menu-tab">
                                <span>내가 쓴 리뷰</span>
                                <span className="mypage-count">{reviewCount}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mypage-left-footer">
                        <span onClick={handleDeleteAccount}>회원탈퇴 </span>|<span onClick={handleLogout}> 로그아웃</span>
                    </div>
                </div>

                <div className="mypage-right">
                    <div>
                        <EditInfo userInfo={userInfo} setUserInfo={setUserInfo} />
                        <CarRegist cars={cars} setCars={setCars} />
                        <FavList stations={favStations}/>
                        <ReviewList />
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