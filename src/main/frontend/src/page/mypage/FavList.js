import './MyPage.css';

function FavList(){
    return(
        <div className="edit-info-container">
            <div className='edit-title'>
                <span className='edit-title-text'>즐겨찾기</span>
            </div>
            <div className='edit-contents'>
                <span className='mypage-regist-info'>등록된 장소가 없습니다.</span>
            </div>
        </div>
    )
}

export default FavList;