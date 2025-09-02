package com.app.dao.route.review;

import java.util.List;

import com.app.dto.route.Review;
import com.app.dto.route.ReviewAgg;

public interface ReviewDAO {
    long insert(Review review);
    int updateByOwner(long id, String userId, double rating, String text);
    int deleteByOwner(long id, String userId);

    Review findOne(long id);
    List<Review> findByKeyPaged(String reviewKey, String userIdOrNull, int offset, int size);
    ReviewAgg findAggByKey(String reviewKey);
    int countByKey(String reviewKey);
}
