package com.app.dto.route;

import lombok.Data;

@Data
public class ReviewAgg {
    private double avgRating; // NVL(AVG,0)
    private int count;

}
