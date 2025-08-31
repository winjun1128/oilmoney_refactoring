package com.app.dto;

import java.util.List;

import lombok.Data;

@Data
public class ChargeSearchDTO {

	private String region;       // ex) 44 (충남)
    private String city;         // ex) 44130 (천안시)
    private List<String> chargerTypes; // ["slow", "fast"]
    private boolean free;        // 무료 충전 여부
    private boolean twentyFour;  // 24시간 여부
    private boolean parking;     // 전용 주차면 여부

}
