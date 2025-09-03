import './MyPage.css';

function ReviewList(){
    return(
        <div className="edit-info-container">
            <div className='edit-title'>
                <span className='edit-title-text'>내가 쓴 리뷰</span>
            </div>
            <div className='edit-contents'>
                <span className='mypage-regist-info'>등록된 리뷰가 없습니다.</span>
            </div>
        </div>
    )
}

export default ReviewList;