package com.app.service.route;

import java.util.List;

import com.app.dto.route.Review;

public interface ReviewService {
	 public long create(String reviewKey, String userId,double rating, String text);
	 public boolean update(long id, String userId, double rating, String text);
	 public boolean delete(long id, String userId);
	 public PagedResult list(String key, String userIdOrNull, int page, int size);
	// 페이지 결과 DTO(레코드가 가능하면 추천)
    final class PagedResult {
        public final List<Review> items;
        public final double avg;
        public final int count;
        public final boolean hasMore;
        public PagedResult(List<Review> items, double avg, int count, boolean hasMore) {
            this.items = items; this.avg = avg; this.count = count; this.hasMore = hasMore;
        }
    }
}
