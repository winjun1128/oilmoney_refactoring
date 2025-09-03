package com.app.dto.users;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StationInfo {
	// 즐겨찾기 목록
	String id;		// UNI_CD 또는 STATID
	String name;	// NAME 또는 STATNM
	String addr;
	String tel;		// TEL 또는 BUSICALL
	String type;	// 'oil' 또는 'ev'
	
	// 리뷰 목록
    String reviewKey;
    String userId;
    double rating;
    String text;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    LocalDateTime createdAt;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    LocalDateTime updatedAt;
}
