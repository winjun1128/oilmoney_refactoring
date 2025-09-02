package com.app.service.route.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.route.review.ReviewDAO;
import com.app.dto.route.Review;
import com.app.dto.route.ReviewAgg;
import com.app.service.route.ReviewService;

@Service
public class ReviewServiceImpl implements ReviewService {
	
	@Autowired
	ReviewDAO reviewDAO;

	@Override
	@Transactional
	public long create(String reviewKey, String userId, String userName, String clientId, double rating, String text) {
		 Review r = new Review();
	        r.setReviewKey(reviewKey);
	        r.setUserId(userId);
	        r.setUserName(userName);
	        r.setClientId(clientId); // 기록용
	        r.setRating(rating);
	        r.setText(text);
	        // created/updated 는 DB default/trigger 사용
	        return reviewDAO.insert(r);
	}

	@Override
	@Transactional
	public boolean update(long id, String userId, double rating, String text) {
		return reviewDAO.updateByOwner(id, userId, rating, text)>0;
	}

	@Override
	@Transactional
	public boolean delete(long id, String userId) {
		// TODO Auto-generated method stub
		return reviewDAO.deleteByOwner(id, userId)>0;
	}

	@Override
	@Transactional
	public PagedResult list(String key, String userIdOrNull, int page, int size) {
		 int p  = Math.max(page, 1);
	        int sz = Math.max(size, 1);
	        int offset = (p - 1) * sz;

	        List<Review> items = reviewDAO.findByKeyPaged(key, userIdOrNull, offset, sz);
	        int total = reviewDAO.countByKey(key);
	        ReviewAgg agg = reviewDAO.findAggByKey(key); // avg/count 집계
	        boolean hasMore = offset + items.size() < total;

	        double avg = agg != null ? agg.getAvgRating() : 0.0;
	        return new PagedResult(items, avg, total, hasMore);
	}

}
