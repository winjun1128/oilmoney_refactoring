package com.app.dao.route.review.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.route.review.ReviewDAO;
import com.app.dto.route.Review;
import com.app.dto.route.ReviewAgg;

@Repository
public class ReviewDAOImpl implements ReviewDAO {
	
	@Autowired
	SqlSessionTemplate sqlSessionTemplate;

	@Override
	public long insert(Review review) {
		return sqlSessionTemplate.insert("review_mapper.insertReview",review);
	}

	@Override
	public int updateByOwner(long id, String userId, double rating, String text) {
		Map<String,Object> p = new HashMap<>();
        p.put("id", id);
        p.put("userId", userId);
        p.put("rating", rating);
        p.put("text", text);
        return sqlSessionTemplate.update("review_mapper.updateReviewByOwner",p);
	}

	@Override
	public int deleteByOwner(long id, String userId) {
		Map<String,Object> p = new HashMap<>();
        p.put("id", id);
        p.put("userId", userId);
		return sqlSessionTemplate.delete("review_mapper.deleteReviewByOwner",p);
	}

	@Override
	public Review findOne(long id) {
		return sqlSessionTemplate.selectOne("review_mapper.selectOne",id);
	}

	@Override
	public List<Review> findByKeyPaged(String reviewKey, String userIdOrNull, int offset, int size) {
		Map<String,Object> p = new HashMap<>();
        p.put("reviewKey", reviewKey);
        p.put("userId", userIdOrNull); // mine 계산용, 비로그인 null
        p.put("offset", offset);
        p.put("size", size);
		return sqlSessionTemplate.selectList("review_mapper.selectByKeyPaged",p);
	}

	@Override
	public ReviewAgg findAggByKey(String reviewKey) {
		return sqlSessionTemplate.selectOne("review_mapper.selectAggByKey",Map.of("reviewKey",reviewKey));
	}

	@Override
	public int countByKey(String reviewKey) {
		return sqlSessionTemplate.selectOne("review_mapper.countByKey",Map.of("reviewKey",reviewKey));
	}

}
