import { useEffect, useState } from 'react';
import './MyPage.css';
import axios from 'axios';

function FavList() {

    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        axios.post('/favorites', {}, {
            headers: { "Authorization": "Bearer " + token }
        })
            .then((res) => {
                setStations(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("즐겨찾기 조회 실패", err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="edit-info-container">
            <div className='edit-title'>
                <span className='edit-title-text'>즐겨찾기</span>
            </div>
            <div className='edit-contents'>
                {stations.length === 0 ? (
                    <span className='mypage-regist-info'>등록된 장소가 없습니다.</span>
                ) : (
                    <ul className='fav-list'>
                        {stations.map((station) => (
                            <li key={station.id} className='fav-item'>
                                <span className={`fav-type ${station.type}`}>
                                    [{station.type === 'oil' ? '주유소' : '충전소'}]
                                </span>
                                <span className='fav-name'>{station.name}</span>
                                <span className='fav-addr'>{station.addr}</span>
                                {station.tel && <span className='fav-tel'>{station.tel}</span>}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}

export default FavList;