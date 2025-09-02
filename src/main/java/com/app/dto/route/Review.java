package com.app.dto.route;

import java.time.OffsetDateTime;

import lombok.Data;

@Data
public class Review {
    private Long id;
    private String reviewKey; // "oil:UNI" or "ev:STATID|STATID"
    private String userId;
//    private String userName;
//    private String clientId;
    private Double rating;    // 0.0~5.0
    private String text;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // 조회용 부가 필드
    private Boolean mine;     // 현재 사용자 소유 여부(SELECT에서 계산)

}
