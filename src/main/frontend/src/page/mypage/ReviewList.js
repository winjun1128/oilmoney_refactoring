import { useEffect, useState } from 'react';
import './MyPage.css';
import axios from 'axios';

function ReviewList() {

    const [reviews, setReviews] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        axios.post('/reviews', {}, {
            headers: { "Authorization": "Bearer " + token }
        })
            .then((res) => {
                setReviews(res.data);
            })
            .catch((err) => {
                console.error("리뷰 목록 조회 실패", err);
            });
    }, []);

    

    return (
        <div className="edit-info-container">
            <div className='edit-title'>
                <span className='edit-title-text'>내가 쓴 리뷰</span>
            </div>
            <div className='edit-contents'>
                {reviews.length === 0 ? (
                    <span className='mypage-regist-info'>등록된 리뷰가 없습니다.</span>
                ) : (
                    <ul className="review-list">
                        {reviews.map((review) => (
                            <li key={review.reviewKey} className="review-item">
                                <span className={`review-type ${review.type}`}>
                                    [{review.type === 'oil' ? '주유소' : '충전소'}]
                                </span>
                                <span className="review-station">{review.name}</span>
                                <span className="review-rating">⭐ {review.rating}</span>
                                <p className="review-text">{review.text}</p>
                                <div className="review-date">
                                    작성일: {review.createdAt}
                                    {review.updatedAt && (
                                        <span> (수정: {review.updatedAt})</span>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}

export default ReviewList;