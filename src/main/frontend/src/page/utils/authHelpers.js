export function handleMyInfoClick({ isLogin, setIsLoginModalOpen, navigate }) {
    const token = localStorage.getItem("token");
    
    if (token && isLogin) {
        navigate("/mypage");
    } else {
        if (typeof setIsLoginModalOpen === "function") {
            setIsLoginModalOpen(true);
        } else {
            console.error("setIsLoginModalOpen is not a function!");
        }
    }
}
