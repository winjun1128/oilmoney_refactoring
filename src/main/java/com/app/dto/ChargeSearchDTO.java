package com.app.dto;

import java.util.List;

import lombok.Data;

@Data
public class ChargeSearchDTO {

	private String region;         // 지역 코드
    private String city;           // 시군구 코드
    private List<String> chargerType; // 충전기 타입 (완속/급속/초급속)
    private List<String> method;      // 충전 방식 (AC완속/DC콤보 등)
    private String minOutput;      // 최소 출력
    private String status;         // 상태 (01=충전가능, 02=충전중...)
    private Boolean twentyFour;    // 24시간 여부
    private String floorType;      // 설치 위치 (G/B)

}
