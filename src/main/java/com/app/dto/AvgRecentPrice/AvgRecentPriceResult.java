package com.app.dto.AvgRecentPrice;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class AvgRecentPriceResult {

	@JsonProperty("RESULT")
    private AvgRecentPriceList result;
	
}
