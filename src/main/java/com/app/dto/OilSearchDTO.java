package com.app.dto;

import java.util.List;

import lombok.Data;

@Data
public class OilSearchDTO {

	private String region;   // SIDO_CD (예: 05)
    private String city;     // SIGUN_CD (예: 0502)

    private Boolean carWash;
    private Boolean store;
    private Boolean repair;
    private Boolean self;
    private Boolean quality;
    private Boolean twentyFour;
    private Boolean lpg;

    private List<String> brands; // ["SKG","GSC","SOL"...]
}
