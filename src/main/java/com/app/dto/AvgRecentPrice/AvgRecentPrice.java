package com.app.dto.AvgRecentPrice;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class AvgRecentPrice {

	@JsonProperty("DATE")
    private String date;
    
    @JsonProperty("PRODCD")
    private String productCode;
    
    @JsonProperty("PRICE")
    private double  price;

	
}
