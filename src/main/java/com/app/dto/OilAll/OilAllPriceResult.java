package com.app.dto.OilAll;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class OilAllPriceResult {
	
    @JsonProperty("RESULT")
    private OilAllPriceList result;
    
}