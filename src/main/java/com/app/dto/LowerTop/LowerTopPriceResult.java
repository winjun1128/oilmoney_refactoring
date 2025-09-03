package com.app.dto.LowerTop;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class LowerTopPriceResult {

	@JsonProperty("RESULT")
    private LowerTopPriceList result;
	
}
